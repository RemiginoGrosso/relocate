/**
 * refresh-who
 *
 * Fetches WHO health indicators from the World Bank API:
 * - SH.UHC.SRVS.CV.XD (UHC Service Coverage Index)
 * - SH.XPD.OOPC.CH.ZS (Out-of-Pocket Health Expenditure %)
 *
 * These feed into the healthcare and purchasing_power dimensions.
 *
 * Invoke: POST /functions/v1/refresh-who
 * Auth: Bearer token with service role key
 */
import { createServiceClient, getCountryIdMap } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { COUNTRIES, WORLD_BANK_EXCLUDED } from "../_shared/countries.ts";
import { logRefresh, jsonResponse } from "../_shared/logger.ts";

// ---------------------------------------------------------------------------
// WHO indicator mapping (via World Bank API)
// ---------------------------------------------------------------------------
interface IndicatorSpec {
  wbId: string;
  indicator: string;
  source: string;
  unit: string;
  sourceUrl: string;
}

const INDICATORS: IndicatorSpec[] = [
  {
    wbId: "SH.UHC.SRVS.CV.XD",
    indicator: "who_uhc_coverage",
    source: "worldbank",
    unit: "index_0_100",
    sourceUrl: "https://api.worldbank.org/v2/indicator/SH.UHC.SRVS.CV.XD",
  },
  {
    wbId: "SH.XPD.OOPC.CH.ZS",
    indicator: "who_oop_pct",
    source: "worldbank",
    unit: "percentage",
    sourceUrl: "https://api.worldbank.org/v2/indicator/SH.XPD.OOPC.CH.ZS",
  },
];

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch a single indicator from the World Bank API.
 * Returns the most recent available value per country (iso2 -> value).
 */
async function fetchIndicator(
  isoCodes: string[],
  indicator: IndicatorSpec,
  dateRange: string
): Promise<Record<string, { value: number; year: number }>> {
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
  const entries = json[1] ?? [];
  const result: Record<string, { value: number; year: number }> = {};

  for (const entry of entries) {
    if (entry.value == null) continue;
    const iso = entry.country?.id;
    const year = parseInt(entry.date, 10);
    if (!iso || isNaN(year)) continue;

    // Keep the most recent year
    const existing = result[iso];
    if (!existing || year > existing.year) {
      result[iso] = { value: entry.value, year };
    }
  }

  console.log(`  Got values for ${Object.keys(result).length} countries.`);
  return result;
}

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
    const countryIds = await getCountryIdMap(supabase);

    // WHO/UHC data lags 2-3 years. Query a wider window.
    const currentYear = new Date().getFullYear();
    const dateRange = `${currentYear - 5}:${currentYear}`;

    const eligibleCountries = COUNTRIES.filter(
      (c) => !WORLD_BANK_EXCLUDED.has(c.iso2) && countryIds[c.iso2]
    );
    const isoCodes = eligibleCountries.map((c) => c.iso2);

    let totalUpserted = 0;
    const errors: string[] = [];

    for (const spec of INDICATORS) {
      try {
        const values = await fetchIndicator(isoCodes, spec, dateRange);

        const rows = [];
        for (const [iso, { value, year }] of Object.entries(values)) {
          const countryId = countryIds[iso];
          if (!countryId) continue;
          rows.push({
            country_id: countryId,
            source: spec.source,
            indicator: spec.indicator,
            value,
            unit: spec.unit,
            year,
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

    const status = errors.length === 0
      ? "success"
      : totalUpserted > 0
        ? "partial"
        : "failed";

    await logRefresh(supabase, {
      source: "who-health",
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
    console.error("refresh-who failed:", msg);

    await logRefresh(supabase, {
      source: "who-health",
      status: "failed",
      countries_updated: 0,
      error_message: msg,
      started_at: startedAt,
    });

    return jsonResponse({ status: "failed", error: msg }, 500);
  }
});
