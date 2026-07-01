-- Migration: pg_cron schedule for data refresh pipeline
--
-- Prerequisites:
--   1. Enable pg_cron and pg_net in Supabase Dashboard -> Database -> Extensions
--   2. Store service role key in Vault (run in SQL Editor):
--      SELECT vault.create_secret('service_role_key', 'your-key-here');
--
-- The cron jobs call Edge Functions monthly. Data sources are annual,
-- so monthly checks catch updates promptly without waste.

-- ============================================================================
-- 1. RPC function to refresh the materialised view
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_country_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY v_country_scores;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_country_scores() TO service_role;

-- ============================================================================
-- 2. Helper function to invoke Edge Functions via pg_net + Vault
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_edge_function(function_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _key text;
  _url text;
  _result bigint;
BEGIN
  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF _key IS NULL THEN
    RAISE EXCEPTION 'Vault secret "service_role_key" not found. Run: SELECT vault.create_secret(''service_role_key'', ''your-key'');';
  END IF;

  _url := 'https://rvjyhjfjvqaftaxjwzxj.supabase.co/functions/v1/' || function_name;

  SELECT net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || _key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO _result;

  RETURN _result;
END;
$$;

-- ============================================================================
-- 3. pg_cron schedules (monthly on the 1st, staggered by 15 min)
-- ============================================================================

-- World Bank governance + economic indicators
SELECT cron.schedule(
  'refresh-world-bank',
  '0 6 1 * *',
  $$ SELECT invoke_edge_function('refresh-world-bank'); $$
);

-- WHO health indicators
SELECT cron.schedule(
  'refresh-who',
  '15 6 1 * *',
  $$ SELECT invoke_edge_function('refresh-who'); $$
);

-- Climate data (Open-Meteo)
SELECT cron.schedule(
  'refresh-climate',
  '30 6 1 * *',
  $$ SELECT invoke_edge_function('refresh-climate'); $$
);

-- Recompute normalised scores + refresh materialised view
SELECT cron.schedule(
  'recompute-scores',
  '45 6 1 * *',
  $$ SELECT invoke_edge_function('recompute-scores'); $$
);

-- ============================================================================
-- Manual trigger (run in SQL Editor):
--   SELECT invoke_edge_function('refresh-world-bank');
--   SELECT invoke_edge_function('refresh-who');
--   SELECT invoke_edge_function('refresh-climate');
--   SELECT invoke_edge_function('recompute-scores');
-- ============================================================================
