-- refresh-climate has never succeeded: Open-Meteo's climate API rejects its
-- `monthly=` query with HTTP 400. Climate averages do not change month to month,
-- so the job is removed rather than fixed. Applied to production on 2026-10-08.
SELECT cron.unschedule('refresh-climate');
