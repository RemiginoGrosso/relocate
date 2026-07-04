-- B5: Luxembourg warmth fix + WVS cleanup
-- Run in Supabase SQL Editor (https://supabase.com/dashboard/project/rvjyhjfjvqaftaxjwzxj/sql)
-- Run each step separately (select the block, then Run)

------------------------------------------------------------
-- Step 1: Check current Luxembourg warmth data
------------------------------------------------------------
SELECT ri.source, ri.indicator, ri.value, ri.year
FROM raw_indices ri
JOIN countries c ON ri.country_id = c.id
WHERE c.iso_alpha2 = 'LU'
AND ri.source IN ('hofstede', 'internations', 'gallup')
ORDER BY ri.source;

------------------------------------------------------------
-- Step 2: Insert missing Hofstede IVR for Luxembourg
------------------------------------------------------------
INSERT INTO raw_indices (country_id, source, indicator, value, unit, year, source_url)
SELECT c.id, 'hofstede', 'ivr', 56, 'score', 2010, 'https://hofstede-insights.com'
FROM countries c
WHERE c.iso_alpha2 = 'LU'
AND NOT EXISTS (
  SELECT 1 FROM raw_indices ri
  WHERE ri.country_id = c.id AND ri.source = 'hofstede' AND ri.indicator = 'ivr'
)
ON CONFLICT (country_id, source, indicator, year) DO NOTHING;

------------------------------------------------------------
-- Step 3: Insert missing Gallup MAI for Luxembourg
------------------------------------------------------------
INSERT INTO raw_indices (country_id, source, indicator, value, unit, year, source_url)
SELECT c.id, 'gallup', 'mai', 6.98, 'score', 2018, 'https://worldhappiness.report'
FROM countries c
WHERE c.iso_alpha2 = 'LU'
AND NOT EXISTS (
  SELECT 1 FROM raw_indices ri
  WHERE ri.country_id = c.id AND ri.source = 'gallup' AND ri.indicator = 'mai'
)
ON CONFLICT (country_id, source, indicator, year) DO NOTHING;

------------------------------------------------------------
-- Step 4: Update Luxembourg warmth normalised score
-- IVR = 56, InterNations ease_rank = 38
-- intScore = ((53-38)/(53-1))*100 = 28.85
-- warmth = 56 * 0.40 + 28.85 * 0.60 = 39.71
------------------------------------------------------------
UPDATE normalised_scores
SET score = 39.71,
    confidence = 'high',
    component_scores = '{"ivr": 56, "internations_score": 28.85}'::jsonb,
    computed_at = NOW()
WHERE country_id = (SELECT id FROM countries WHERE iso_alpha2 = 'LU')
AND dimension_key = 'warmth';

------------------------------------------------------------
-- Step 4b: If no row existed, insert it
------------------------------------------------------------
INSERT INTO normalised_scores (country_id, dimension_key, score, confidence, component_scores)
SELECT c.id, 'warmth', 39.71, 'high', '{"ivr": 56, "internations_score": 28.85}'::jsonb
FROM countries c
WHERE c.iso_alpha2 = 'LU'
AND NOT EXISTS (
  SELECT 1 FROM normalised_scores ns
  WHERE ns.country_id = c.id AND ns.dimension_key = 'warmth'
)
ON CONFLICT (country_id, dimension_key) DO NOTHING;

------------------------------------------------------------
-- Step 5: Delete all WVS rows (source removed in v0.1.7)
------------------------------------------------------------
DELETE FROM raw_indices WHERE source = 'wvs';

------------------------------------------------------------
-- Step 6: Refresh materialised view
------------------------------------------------------------
REFRESH MATERIALIZED VIEW v_country_scores;

------------------------------------------------------------
-- Step 7: Verify Luxembourg warmth is now correct
------------------------------------------------------------
SELECT ns.dimension_key, ns.score, ns.confidence, ns.component_scores
FROM normalised_scores ns
JOIN countries c ON ns.country_id = c.id
WHERE c.iso_alpha2 = 'LU' AND ns.dimension_key = 'warmth';
