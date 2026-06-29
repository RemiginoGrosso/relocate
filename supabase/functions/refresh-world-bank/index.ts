/**
 * refresh-world-bank
 *
 * Fetches WGI Rule of Law, Control of Corruption, and Price Level Ratio
 * from the World Bank API for all 40 V1 countries.
 *
 * Upserts results into the raw_indices table.
 *
 * Invoke: POST /functions/v1/refresh-world-bank
 * Auth: Bearer token with service role key
 */
import { createServiceClient, getCountryIdMap } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { COUNTRIES, WORLD_BANK_EXCLUDED } from "../_shared/countries.ts";
import { logRefresh, jsonResponse } from "../_shared/logger.ts";

// ---------------------------------------------------------------------------
// World Bank indicator mapping
// ---------------------------------------------------------------------------
interface IndicatorSpec {
  /** World Bank indicator ID */
  wbId: string;
  /** Key stored in raw_indices.indicator */
  indicator: string;
  /** Source name stored in raw_indices.source */
  source: string;
  /** Unit label */
  unit: string;
  /** API source URL */
  sourceUrl: string;
}

const INDICATORS: IndicatorSpec[] = [
  {
    wbId: "RL.PER.RNK",
    indicator: "wgi_rule_of_law",
    source: "worldbank",
    unit: "percentile_rank_0_100",
    sourceUrl: "https://api.worldbank.org/v2/indicator/RL.PER.RNK",
  },
  {
    wbId: "CC.PER.RNK",
    indicator: "wgi_corruption_control",
    source: "worldbank",
    unit: "percentile_rank_0_100",
    sourceUrl: "https://api.worldbank.org/v2/indicator/CC.PER.RNK",
  },
  {
    wbId: "PA.NUS.PPPC.RF",
    indicator: "price_level_ratio",
    source: "worldbank",
    unit: "ratio",
    sourceUrl: "https://api.worldbank.org/v2/indicator/PA.NUS.PPPC.RF",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a single indicator from the World Bank API for a batch of countries.
 * The API accepts semicolon-separated ISO codes and returns paginated JSON.
 *
 * Returns a map of iso2 -> value.
 */
async function fetchIndicator(
  isoCodes: string[],
  indicator: IndicatorSpec,
  dateRange: string
): Promise<Record<string, number>> {
  const isoParam = isoCodes.join(";");
  const url =
    `https://api.worldbank.org/v2/country/${isoParam}/indicator/${indicator.wbId}` +
    `?date=${dateRange}&format=json&per_page=500`;

  console.log(`Fetching ${indicator.wbId} for ${isoCodes.length} countries...`);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(
      `World Bank API error for ${indicator.wbId}: ${resp.status} ${resp.statusText}`
    );
  }

  const json = await resp.json();

  // World Bank API returns [metadata, data_array].
  // If no data, json[1] may be null.
  const entries = json[1] ?? [];
  const result: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.value == null) continue;
    const iso = entry.country?.id;
    if (!iso) continue;
    // If multiple years returned, keep the most recent (highest date).
    const existing = result[iso];
    if (existing === undefined) {
      result[iso] = entry.value;
    }
  }

  console.log(`  Got values for ${Object.keys(result).length} countries.`);
  return result;
}

/**
 * Determine the best date range to query.
 * WGI data usually lags 1-2 years. Query the last 3 years to find the most recent.
 */
function getDateRange(): string {
  const currentYear = new Date().getFullYear();
  return `${currentYear - 3}:${currentYear}`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  const supabase = createServiceClient();

  try {
    // Get country ID map from database
    const countryIds = await getCountryIdMap(supabase);
    const dateRange = getDateRange();
    const currentYear = new Date().getFullYear();

    // Filter out countries not in World Bank
    const eligibleCountries = COUNTRIES.filter(
      (c) => !WORLD_BANK_EXCLUDED.has(c.iso2) && countryIds[c.iso2]
    );
    const isoCodes = eligibleCountries.map((c) => c.iso2);

    let totalUpserted = 0;
    const errors: string[] = [];

    // Fetch each indicator
    for (const spec of INDICATORS) {
      try {
        const values = await fetchIndicator(isoCodes, spec, dateRange);

        // Build upsert rows
        const rows = [];
        for (const [iso, value] of Object.entries(values)) {
          const countryId = countryIds[iso];
          if (!countryId) continue;
          rows.push({
            country_id: countryId,
            source: spec.source,
            indicator: spec.indicator,
            value,
            unit: spec.unit,
            year: currentYear,
            source_url: spec.sourceUrl,
            fetched_at: new Date().toISOString(),
          });
        }

        if (rows.length > 0) {
          const { error } = await supabase
            .from("raw_indices")
            .upsert(rows, {
              onConflict: "country_id,source,indicator,year",
            });

          if (error) {
            errors.push(`${spec.indicator}: upsert failed - ${error.message}`);
          } else {
            totalUpserted += rows.length;
            console.log(`  Upserted ${rows.length} rows for ${spec.indicator}`);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${spec.indicator}: ${msg}`);
        console.error(`Error fetching ${spec.indicator}:`, msg);
      }
    }

    // Determine status
    const status = errors.length === 0
      ? "success"
      : totalUpserted > 0
        ? "partial"
        : "failed";

    // Log the refresh
    await logRefresh(supabase, {
      source: "world-bank",
      status,
      countries_updated: totalUpserted,
      error_message: errors.length > 0 ? errors.join("; ") : undefined,
      started_at: startedAt,
    });

    return jsonResponse({
      status,
      indicators_fetched: INDICATORS.map((i) => i.indicator),
      rows_upserted: totalUpserted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("refresh-world-bank failed:", msg);

    await logRefresh(supabase, {
      source: "world-bank",
      status: "failed",
      countries_updated: 0,
      error_message: msg,
      started_at: startedAt,
    });

    return jsonResponse({ status: "failed", error: msg }, 500);
  }
});
