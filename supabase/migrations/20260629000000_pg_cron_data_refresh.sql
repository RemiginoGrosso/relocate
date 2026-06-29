-- Migration: pg_cron schedule for data refresh pipeline
--
-- This sets up:
-- 1. A PostgreSQL function to refresh the materialised view (callable via RPC)
-- 2. pg_cron jobs that trigger the Edge Functions on a schedule
--
-- pg_cron is available on Supabase Pro plans. On the free tier, trigger
-- the functions manually or use an external scheduler (e.g., GitHub Actions cron).

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

-- Grant execute to the service role so Edge Functions can call it
GRANT EXECUTE ON FUNCTION refresh_country_scores() TO service_role;

-- ============================================================================
-- 2. pg_cron schedules
-- ============================================================================
-- These use pg_net (http extension) to call the Edge Functions.
-- Requires: pg_cron and pg_net extensions enabled on the Supabase project.
--
-- To enable: Supabase Dashboard -> Database -> Extensions -> enable pg_cron, pg_net
--
-- Schedule overview:
--   - World Bank WGI + Price Level: January 15, annually
--   - WHO health indicators:        February 1, annually
--   - Climate (Open-Meteo):          January 20, annually
--   - Recompute scores:              After each data refresh (chained), plus Feb 15
--
-- All times in UTC.
-- ============================================================================

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper: project URL and service role key are read from vault or config.
-- Replace {SUPABASE_URL} and {SERVICE_ROLE_KEY} with actual values,
-- or use Supabase Vault secrets.

-- ---------------------------------------------------------------------------
-- Annual: World Bank governance + price indicators (January 15)
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'refresh-world-bank-annual',
  '0 6 15 1 *',  -- 06:00 UTC, January 15
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/refresh-world-bank',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------------
-- Annual: WHO health indicators (February 1)
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'refresh-who-annual',
  '0 6 1 2 *',  -- 06:00 UTC, February 1
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/refresh-who',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------------
-- Annual: Climate data (January 20)
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'refresh-climate-annual',
  '0 6 20 1 *',  -- 06:00 UTC, January 20
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/refresh-climate',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------------
-- Annual: Recompute all normalised scores (February 15)
-- Runs after all data refreshes have had time to complete.
-- Can also be triggered manually after any individual refresh.
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'recompute-scores-annual',
  '0 6 15 2 *',  -- 06:00 UTC, February 15
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/recompute-scores',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- 3. App settings for pg_cron jobs
-- ============================================================================
-- These must be set manually via Supabase SQL Editor or Dashboard:
--
--   ALTER DATABASE postgres SET app.supabase_url = 'https://rvjyhjfjvqaftaxjwzxj.supabase.co';
--   ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key-here';
--
-- Or use Supabase Vault for the service role key:
--   SELECT vault.create_secret('service_role_key', 'your-key-here');
--
-- Then reference it in cron jobs:
--   (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
-- ============================================================================

-- ============================================================================
-- 4. Manual trigger helper
-- ============================================================================
-- For ad-hoc runs, call the Edge Functions directly via curl:
--
--   curl -X POST https://rvjyhjfjvqaftaxjwzxj.supabase.co/functions/v1/refresh-world-bank \
--     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--     -H "Content-Type: application/json"
--
--   curl -X POST .../functions/v1/refresh-who ...
--   curl -X POST .../functions/v1/refresh-climate ...
--   curl -X POST .../functions/v1/recompute-scores ...
--
-- Or use the Supabase Dashboard -> Edge Functions -> Invoke.
-- ============================================================================
