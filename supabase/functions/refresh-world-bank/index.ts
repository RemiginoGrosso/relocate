/**
 * refresh-world-bank
 *
 * Fetches governance, economic, and health indicators from the World Bank API.
 * Upserts results into the raw_indices table.
 *
 * Indicator IDs updated for the 2025 World Bank API rename:
 * - WGI indicators now use GOV_WGI_*.SC with source=3
 * - UHC requires source=16
 * - Price Level Ratio computed from PA.NUS.PRVT.PP / PA.NUS.FCRF
 *
 * Invoke: POST /functions/v1/refresh-world-bank
 * Auth: Bearer token with service role key
 */
import { createServiceClient, getCountryIdMap } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { COUNTRIES, WORLD_BANK_EXCLUDED } from "../_shared/countries.ts";
import { logRefresh, jsonResponse } from "../_shared/logger.ts";

interface IndicatorSpec {
  wbId: string;
  indicator: string;
  source: string;
  unit: string;
  sourceUrl: string;
  apiSource?: number;
}

const INDICATORS: IndicatorSpec[] = [
  {
    wbId: "GOV_WGI_RL.SC",
    indicator: "wgi_rule_of_law",
    source: "worldbank",
    unit: "percentile_rank_0_100",
    sourceUrl: "https://api.worldbank.org/v2/indicator/GOV_WGI_RL.SC",
    apiSource: 3,
  },
  {
    wbId: "GOV_WGI_CC.SC",
    indicator: "wgi_corruption_control",
    source: "worldbank",
    unit: "percentile_rank_0_100",
    sourceUrl: "https://api.worldbank.org/v2/indicator/GOV_WGI_CC.SC",
    apiSource: 3,
  },
  {
    wbId: "NY.GDP.PCAP.PP.CD",
    indicator: "oecd_ppp_aic",
    source: "worldbank",
    unit: "current_international_dollar",
    sourceUrl: "https://api.worldbank.org/v2/indicator/NY.GDP.PCAP.PP.CD",
  },
];

const PLR_INDICATORS = {
  ppp: "PA.NUS.PRVT.PP",
  exchRate: "PA.NUS.FCRF",
};

async function fetchIndicator(
  isoCodes: string[],
  spec: IndicatorSpec,
  dateRange: string
): Promise<Record<string, { value: number; year: number }>> {
  const isoParam = isoCodes.join(";");
  let url =
    `https://api.worldbank.org/v2/country/${isoParam}/indicator/${spec.wbId}` +
    `?date=${dateRange}&format=json&per_page=500`;
  if (spec.apiSource) url += `&source=${spec.apiSource}`;

  console.log(`Fetching ${spec.wbId} for ${isoCodes.length} countries...`);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`World Bank API error for ${spec.wbId}: ${resp.status}`);
  }

  const json = await resp.json();
  const entries = json[1] ?? [];
  const result: Record<string, { value: number; year: number }> = {};

  for (const entry of entries) {
    if (entry.value == null) continue;
    const iso = entry.country?.id;
    const year = parseInt(entry.date, 10);
    if (!iso || isNaN(year)) continue;
    const existing = result[iso];
    if (!existing || year > existing.year) {
      result[iso] = { value: entry.value, year };
    }
  }

  console.log(`  Got values for ${Object.keys(result).length} countries.`);
  return result;
}

async function fetchPriceLevelRatio(
  isoCodes: string[],
  dateRange: string
): Promise<Record<string, { value: number; year: number }>> {
  const isoParam = isoCodes.join(";");

  const [pppResp, fxResp] = await Promise.all([
    fetch(
      `https://api.worldbank.org/v2/country/${isoParam}/indicator/${PLR_INDICATORS.ppp}?date=${dateRange}&format=json&per_page=500`
    ),
    fetch(
      `https://api.worldbank.org/v2/country/${isoParam}/indicator/${PLR_INDICATORS.exchRate}?date=${dateRange}&format=json&per_page=500`
    ),
  ]);

  if (!pppResp.ok || !fxResp.ok) {
    throw new Error("Failed to fetch PLR component indicators");
  }

  const pppJson = await pppResp.json();
  const fxJson = await fxResp.json();

  const pppByIso: Record<string, { value: number; year: number }> = {};
  for (const entry of pppJson[1] ?? []) {
    if (entry.value == null) continue;
    const iso = entry.country?.id;
    const year = parseInt(entry.date, 10);
    if (!iso || isNaN(year)) continue;
    if (!pppByIso[iso] || year > pppByIso[iso].year) {
      pppByIso[iso] = { value: entry.value, year };
    }
  }

  const fxByIso: Record<string, { value: number; year: number }> = {};
  for (const entry of fxJson[1] ?? []) {
    if (entry.value == null) continue;
    const iso = entry.country?.id;
    const year = parseInt(entry.date, 10);
    if (!iso || isNaN(year)) continue;
    if (!fxByIso[iso] || year > fxByIso[iso].year) {
      fxByIso[iso] = { value: entry.value, year };
    }
  }

  const result: Record<string, { value: number; year: number }> = {};
  for (const iso of Object.keys(pppByIso)) {
    if (fxByIso[iso] && fxByIso[iso].value > 0) {
      result[iso] = {
        value: pppByIso[iso].value / fxByIso[iso].value,
        year: Math.min(pppByIso[iso].year, fxByIso[iso].year),
      };
    }
  }

  console.log(`  Computed PLR for ${Object.keys(result).length} countries.`);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  const supabase = createServiceClient();

  try {
    const countryIds = await getCountryIdMap(supabase);
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
            .upsert(rows, { onConflict: "country_id,source,indicator,year" });

          if (error) {
            errors.push(`${spec.indicator}: upsert failed - ${error.message}`);
          } else {
            totalUpserted += rows.length;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${spec.indicator}: ${msg}`);
      }
    }

    // Price Level Ratio (computed from two indicators)
    try {
      const plrValues = await fetchPriceLevelRatio(isoCodes, dateRange);
      const rows = [];
      for (const [iso, { value, year }] of Object.entries(plrValues)) {
        const countryId = countryIds[iso];
        if (!countryId) continue;
        rows.push({
          country_id: countryId,
          source: "worldbank",
          indicator: "price_level_ratio",
          value,
          unit: "ratio",
          year,
          source_url: "https://api.worldbank.org/v2/indicator/PA.NUS.PRVT.PP",
          fetched_at: new Date().toISOString(),
        });
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from("raw_indices")
          .upsert(rows, { onConflict: "country_id,source,indicator,year" });

        if (error) {
          errors.push(`price_level_ratio: upsert failed - ${error.message}`);
        } else {
          totalUpserted += rows.length;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`price_level_ratio: ${msg}`);
    }

    const status = errors.length === 0
      ? "success"
      : totalUpserted > 0
        ? "partial"
        : "failed";

    await logRefresh(supabase, {
      source: "world-bank",
      status,
      countries_updated: totalUpserted,
      error_message: errors.length > 0 ? errors.join("; ") : undefined,
      started_at: startedAt,
    });

    return jsonResponse({
      status,
      indicators_fetched: [...INDICATORS.map((i) => i.indicator), "price_level_ratio"],
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
