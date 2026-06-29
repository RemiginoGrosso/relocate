import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type RefreshStatus = "success" | "partial" | "failed";

export interface LogEntry {
  source: string;
  status: RefreshStatus;
  countries_updated: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

/**
 * Write a row to the data_refresh_log table.
 * Returns the inserted log ID, or null on failure (non-throwing).
 */
export async function logRefresh(
  supabase: SupabaseClient,
  entry: LogEntry
): Promise<string | null> {
  const { data, error } = await supabase
    .from("data_refresh_log")
    .insert({
      source: entry.source,
      status: entry.status,
      countries_updated: entry.countries_updated,
      error_message: entry.error_message ?? null,
      started_at: entry.started_at,
      completed_at: entry.completed_at ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(`Failed to write refresh log: ${error.message}`);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Helper to create a consistent JSON response.
 */
export function jsonResponse(
  body: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
