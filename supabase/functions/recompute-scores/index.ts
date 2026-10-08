/**
 * recompute-scores
 *
 * Reads all raw_indices (paged, count-checked) and climate_data, applies the
 * formulas in compute.ts, upserts normalised_scores, deletes scores that no
 * longer compute, then refreshes the v_country_scores materialised view.
 *
 * Should be called after any data refresh (world-bank, who, climate).
 *
 * Invoke: POST /functions/v1/recompute-scores
 * Auth: Bearer token with service role key
 */
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logRefresh, jsonResponse } from "../_shared/logger.ts";
import {
  computeAllScores,
  fetchAllRows,
  staleScoreKeys,
  type ClimateRow,
  type CountryRow,
  type RawRow,
} from "./compute.ts";

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  const supabase = createServiceClient();

  try {
    // Gate: check today's refresh outcomes before recomputing
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: refreshLogs } = await supabase
      .from("data_refresh_log")
      .select("source, status")
      .gte("started_at", todayStart.toISOString())
      .in("source", ["world-bank", "who-health", "open-meteo-climate"]);

    const loggedSources = new Set((refreshLogs ?? []).map((r: { source: string }) => r.source));
    const failedSources = (refreshLogs ?? [])
      .filter((r: { source: string; status: string }) => r.status === "failed")
      .map((r: { source: string }) => r.source);

    const expectedSources = ["world-bank", "who-health", "open-meteo-climate"];
    const missingSources = expectedSources.filter((s) => !loggedSources.has(s));

    if (missingSources.length > 0 || failedSources.length > 0) {
      const warnings: string[] = [];
      if (missingSources.length > 0) {
        warnings.push(`Missing refresh runs today: ${missingSources.join(", ")}`);
      }
      if (failedSources.length > 0) {
        warnings.push(`Failed refresh runs today: ${failedSources.join(", ")}`);
      }
      const warningMsg = warnings.join("; ");
      console.warn(`Refresh gate warning: ${warningMsg}. Proceeding with existing data.`);

      // Log the warning but don't abort -- the data isn't going anywhere
      await logRefresh(supabase, {
        source: "recompute-scores",
        status: "partial",
        countries_updated: 0,
        error_message: `Pre-run warning: ${warningMsg}`,
        started_at: startedAt,
      });
    }

    console.log("Fetching raw data and climate data...");

    const [countriesResult, climateResult] = await Promise.all([
      supabase
        .from("countries")
        .select("id, iso_alpha2")
        .eq("is_active", true),
      supabase
        .from("climate_data")
        .select(
          "country_id, avg_temp_annual, avg_temp_winter, avg_temp_summer, sunshine_hours_annual, rain_days_annual"
        )
        .order("data_year", { ascending: false }),
    ]);

    if (countriesResult.error) {
      throw new Error(`Countries query failed: ${countriesResult.error.message}`);
    }
    if (climateResult.error) {
      throw new Error(`Climate query failed: ${climateResult.error.message}`);
    }

    // Paged read with an exact-count check: a single select is capped at 1000 rows
    const rawIndices = await fetchAllRows<RawRow>(async (from, to) => {
      const { data, error, count } = await supabase
        .from("raw_indices")
        .select("country_id, source, indicator, value, year", { count: "exact" })
        .order("id")
        .range(from, to);
      if (error) throw new Error(`Raw indices query failed: ${error.message}`);
      return { rows: (data ?? []) as RawRow[], count };
    });

    const countries = countriesResult.data as CountryRow[];
    const climateData = (climateResult.data ?? []) as ClimateRow[];

    if (!countries.length) {
      throw new Error("No active countries found. Run seed.ts first.");
    }
    // An empty read would make every climate score look stale and delete it
    if (!climateData.length) {
      throw new Error("climate_data returned no rows; refusing to recompute.");
    }

    console.log(`Read ${rawIndices.length} raw_indices rows.`);

    const scores = computeAllScores(countries, rawIndices, climateData);

    console.log(
      `Computed ${scores.length} dimension scores for ${countries.length} countries.`
    );

    // Upsert in batches
    const batchSize = 50;
    let upsertedCount = 0;
    const upsertErrors: string[] = [];

    for (let i = 0; i < scores.length; i += batchSize) {
      const batch = scores.slice(i, i + batchSize);
      const { error } = await supabase.from("normalised_scores").upsert(
        batch.map((s) => ({
          country_id: s.country_id,
          dimension_key: s.dimension_key,
          score: s.score,
          confidence: s.confidence,
          component_scores: s.component_scores,
          computed_at: new Date().toISOString(),
        })),
        { onConflict: "country_id,dimension_key" }
      );

      if (error) {
        upsertErrors.push(`Batch ${i / batchSize}: ${error.message}`);
      } else {
        upsertedCount += batch.length;
      }
    }

    console.log(`Upserted ${upsertedCount} normalised scores.`);

    // A dimension that no longer computes must lose its old score. Only after every
    // upsert succeeded, so a failed run never leaves a country with fewer scores.
    let staleDeleted = 0;
    if (upsertErrors.length === 0) {
      try {
        const stored = await fetchAllRows<{ id: string; country_id: string; dimension_key: string }>(
          async (from, to) => {
            const { data, error, count } = await supabase
              .from("normalised_scores")
              .select("id, country_id, dimension_key", { count: "exact" })
              .order("id")
              .range(from, to);
            if (error) throw new Error(`normalised_scores read failed: ${error.message}`);
            return { rows: data ?? [], count };
          }
        );
        const stale = staleScoreKeys(stored, scores);
        if (stale.length > 0) {
          const { error } = await supabase
            .from("normalised_scores")
            .delete()
            .in("id", stale.map((s) => s.id));
          if (error) {
            upsertErrors.push(`Stale score delete failed: ${error.message}`);
          } else {
            staleDeleted = stale.length;
            console.log(`Deleted ${staleDeleted} stale scores.`);
          }
        }
      } catch (err) {
        // Upserts already landed: keep going so the view refresh and the log reflect them
        upsertErrors.push(`Stale score cleanup failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Refresh materialised view
    let viewRefreshed = false;
    console.log("Refreshing materialised view...");
    const { error: rpcError } = await supabase.rpc("refresh_country_scores");
    if (rpcError) {
      console.warn(
        `RPC refresh failed: ${rpcError.message}. ` +
          "Ensure the refresh_country_scores() function exists in the database."
      );
    } else {
      viewRefreshed = true;
      console.log("Materialised view refreshed.");
    }

    const hasErrors = upsertErrors.length > 0 || !viewRefreshed;
    const status = upsertedCount === 0
      ? "failed"
      : hasErrors
        ? "partial"
        : "success";

    const allErrors = [
      ...upsertErrors,
      ...(viewRefreshed ? [] : ["materialised view refresh failed"]),
    ];

    await logRefresh(supabase, {
      source: "recompute-scores",
      status,
      countries_updated: upsertedCount,
      error_message: allErrors.length > 0 ? allErrors.join("; ") : undefined,
      started_at: startedAt,
    });

    return jsonResponse({
      status,
      scores_computed: scores.length,
      scores_upserted: upsertedCount,
      stale_deleted: staleDeleted,
      raw_rows_read: rawIndices.length,
      countries: countries.length,
      view_refreshed: viewRefreshed,
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("recompute-scores failed:", msg);

    await logRefresh(supabase, {
      source: "recompute-scores",
      status: "failed",
      countries_updated: 0,
      error_message: msg,
      started_at: startedAt,
    });

    return jsonResponse({ status: "failed", error: msg }, 500);
  }
});
