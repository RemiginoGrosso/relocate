/**
 * CORS headers for Supabase Edge Functions.
 * All data-refresh functions are invoked server-side (pg_cron or HTTP trigger),
 * but CORS headers are included for manual testing from a browser.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
