-- B5: Luxembourg warmth fix + WVS cleanup
-- Run in Supabase SQL Editor (https://supabase.com/dashboard/project/rvjyhjfjvqaftaxjwzxj/sql)

-- Step 1: Check current Luxembourg warmth data
SELECT ri.source, ri.indicator, ri.value, ri.year
FROM raw_indices ri
JOIN countries c ON ri.country_id = c.id
WHERE c.iso_alpha2 = 'LU'
AND ri.source IN ('hofstede', 'internations', 'gallup')
ORDER BY ri.source;

-- Step 2: Insert missing Hofstede IVR for Luxembourg (if not present)
INSERT INTO raw_indices (country_id, source, indicator, value, unit, year, source_url)
SELECT c.id, 'hofstede', 'ivr', 56, 'score', 2010, 'https://hofstede-insights.com'
FROM countries c
WHERE c.iso_alpha2 = 'LU'
AND NOT EXISTS (
  SELECT 1 FROM raw_indices ri
  WHERE ri.country_id = c.id AND ri.source = 'hofstede' AND ri.indicator = 'ivr'
)
ON CONFLICT (country_id, source, indicator, year) DO NOTHING;

-- Step 3: Insert missing Gallup MAI for Luxembourg (if not present)
INSERT INTO raw_indices (country_id, source, indicator, value, unit, year, source_url)
SELECT c.id, 'gallup', 'mai', 6.98, 'score', 2018, 'https://worldhappiness.report'
FROM countries c
WHERE c.iso_alpha2 = 'LU'
AND NOT EXISTS (
  SELECT 1 FROM raw_indices ri
  WHERE ri.country_id = c.id AND ri.source = 'gallup' AND ri.indicator = 'mai'
)
ON CONFLICT (country_id, source, indicator, year) DO NOTHING;

-- Step 4: Recompute Luxembourg warmth normalised score
-- IVR = 56, InterNations ease_rank = 38 → intScore = ((53-38)/(53-1))*100 = 28.85
-- warmth = 56 * 0.40 + 28.85 * 0.60 = 22.4 + 17.31 = 39.71
UPDATE normalised_scores
SET score = 39.71,
    confidence = 'high',
    components = '{"ivr": 56, "internations_score": 28.85}'::jsonb
WHERE country_id = (SELECT id FROM countries WHERE iso_alpha2 = 'LU')
AND dimension = 'warmth';

-- If the row doesn't exist, insert it:
INSERT INTO normalised_scores (country_id, dimension, score, confidence, components)
SELECT c.id, 'warmth', 39.71, 'high', '{"ivr": 56, "internations_score": 28.85}'::jsonb
FROM countries c
WHERE c.iso_alpha2 = 'LU'
AND NOT EXISTS (
  SELECT 1 FROM normalised_scores ns
  WHERE ns.country_id = c.id AND ns.dimension = 'warmth'
)
ON CONFLICT (country_id, dimension) DO NOTHING;

-- Step 5: Delete all WVS rows from raw_indices (source removed in v0.1.7)
DELETE FROM raw_indices WHERE source = 'wvs';

-- Step 6: Refresh the materialised view
REFRESH MATERIALIZED VIEW v_country_scores;

-- Step 7: Verify Luxembourg warmth is now correct
SELECT ns.dimension, ns.score, ns.confidence, ns.components
FROM normalised_scores ns
JOIN countries c ON ns.country_id = c.id
WHERE c.iso_alpha2 = 'LU' AND ns.dimension = 'warmth';
