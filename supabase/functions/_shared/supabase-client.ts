import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Create a Supabase client with the service role key for write access.
 * Edge Functions get SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * automatically when deployed to Supabase.
 */
export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Fetch the country ID map from the countries table.
 * Returns a Record mapping iso_alpha2 -> country UUID.
 */
export async function getCountryIdMap(
  supabase: SupabaseClient
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("countries")
    .select("id, iso_alpha2")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch country IDs: ${error.message}`);
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.iso_alpha2] = row.id;
  }
  return map;
}
