/**
 * refresh-climate
 *
 * Fetches temperature, sunshine, and precipitation data from Open-Meteo
 * Climate API for all 40 V1 country capitals.
 *
 * Uses ERA5 reanalysis data averaged over 2020-2024.
 * Computes: annual avg temp, winter avg temp, summer avg temp,
 *           sunshine hours/year, rain days/year.
 *
 * Upserts into the climate_data table.
 *
 * Invoke: POST /functions/v1/refresh-climate
 * Auth: Bearer token with service role key
 */
import { createServiceClient, getCountryIdMap } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { COUNTRIES, SOUTHERN_HEMISPHERE } from "../_shared/countries.ts";
import { logRefresh, jsonResponse } from "../_shared/logger.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MonthlyClimate {
  time: string[]; // YYYY-MM-01
  temperature_2m_mean: (number | null)[];
  precipitation_sum: (number | null)[];
  sunshine_duration?: (number | null)[]; // seconds per month
}

interface OpenMeteoResponse {
  monthly: MonthlyClimate;
  latitude: number;
  longitude: number;
}

interface ComputedClimate {
  avgTempAnnual: number;
  avgTempWinter: number;
  avgTempSummer: number;
  sunshineHoursAnnual: number;
  rainDaysAnnual: number;
  avgHumidityPct: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Months indexed 1-12. Northern winter = Dec(12), Jan(1), Feb(2). */
const NORTHERN_WINTER = new Set([12, 1, 2]);
const NORTHERN_SUMMER = new Set([6, 7, 8]);
const SOUTHERN_WINTER = new Set([6, 7, 8]);
const SOUTHERN_SUMMER = new Set([12, 1, 2]);

/**
 * Rough heuristic: count months with > 50mm precipitation as "rain months"
 * and scale to "rain days". A month with > 50mm typically has ~10-15 rain days.
 * More precise: use total precip / avg rain-per-day, but we approximate with
 * monthly totals / 5mm per rain-day (typical light-moderate threshold).
 */
function estimateRainDays(monthlyPrecip: (number | null)[]): number {
  let totalDays = 0;
  for (const precip of monthlyPrecip) {
    if (precip == null) continue;
    // Approximate: each 5mm of monthly precipitation ~ 1 rain day
    totalDays += Math.round(precip / 5);
  }
  // Average across years (data spans 5 years = 60 months)
  const yearCount = monthlyPrecip.length / 12;
  return yearCount > 0 ? Math.round(totalDays / yearCount) : totalDays;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeClimate(
  data: MonthlyClimate,
  isSouthern: boolean
): ComputedClimate {
  const temps: number[] = [];
  const winterTemps: number[] = [];
  const summerTemps: number[] = [];
  const precips: (number | null)[] = [];
  let totalSunshineSec = 0;
  let sunshineMonths = 0;

  const winterSet = isSouthern ? SOUTHERN_WINTER : NORTHERN_WINTER;
  const summerSet = isSouthern ? SOUTHERN_SUMMER : NORTHERN_SUMMER;

  for (let i = 0; i < data.time.length; i++) {
    const month = parseInt(data.time[i].split("-")[1], 10);
    const temp = data.temperature_2m_mean[i];
    const precip = data.precipitation_sum[i];
    const sunshine = data.sunshine_duration?.[i];

    if (temp != null) {
      temps.push(temp);
      if (winterSet.has(month)) winterTemps.push(temp);
      if (summerSet.has(month)) summerTemps.push(temp);
    }

    precips.push(precip);

    if (sunshine != null) {
      totalSunshineSec += sunshine;
      sunshineMonths++;
    }
  }

  // Sunshine duration from Open-Meteo is in seconds per month.
  // Convert total to hours, then average per year.
  const yearCount = data.time.length / 12;
  const sunshineHoursTotal = totalSunshineSec / 3600;
  const sunshineHoursAnnual =
    yearCount > 0 ? Math.round(sunshineHoursTotal / yearCount) : 0;

  return {
    avgTempAnnual: Math.round(mean(temps) * 10) / 10,
    avgTempWinter: Math.round(mean(winterTemps) * 10) / 10,
    avgTempSummer: Math.round(mean(summerTemps) * 10) / 10,
    sunshineHoursAnnual,
    rainDaysAnnual: estimateRainDays(precips),
    avgHumidityPct: null, // Open-Meteo climate API does not provide humidity
  };
}

/**
 * Fetch climate data from Open-Meteo for a single location.
 * Rate limit: 10,000 requests/day. 40 countries is well within budget.
 */
async function fetchClimate(
  lat: number,
  lon: number
): Promise<MonthlyClimate | null> {
  const url =
    `https://climate-api.open-meteo.com/v1/climate` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=2020-01-01&end_date=2024-12-31` +
    `&models=EC_Earth3P_HR` +
    `&monthly=temperature_2m_mean,precipitation_sum,sunshine_duration`;

  const resp = await fetch(url);
  if (!resp.ok) {
    console.error(`Open-Meteo error for (${lat}, ${lon}): ${resp.status}`);
    return null;
  }

  const json: OpenMeteoResponse = await resp.json();
  return json.monthly ?? null;
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
    const dataYear = new Date().getFullYear();
    let updated = 0;
    const errors: string[] = [];

    for (const country of COUNTRIES) {
      const countryId = countryIds[country.iso2];
      if (!countryId) {
        errors.push(`${country.iso2}: not found in database`);
        continue;
      }

      try {
        console.log(`Fetching climate for ${country.name} (${country.iso2})...`);
        const monthly = await fetchClimate(
          country.capitalLat,
          country.capitalLon
        );

        if (!monthly || !monthly.time || monthly.time.length === 0) {
          errors.push(`${country.iso2}: no climate data returned`);
          continue;
        }

        const isSouthern = SOUTHERN_HEMISPHERE.has(country.iso2);
        const computed = computeClimate(monthly, isSouthern);

        const { error } = await supabase.from("climate_data").upsert(
          {
            country_id: countryId,
            avg_temp_annual: computed.avgTempAnnual,
            avg_temp_winter: computed.avgTempWinter,
            avg_temp_summer: computed.avgTempSummer,
            sunshine_hours_annual: computed.sunshineHoursAnnual,
            rain_days_annual: computed.rainDaysAnnual,
            avg_humidity_pct: computed.avgHumidityPct,
            data_year: dataYear,
          },
          { onConflict: "country_id,data_year" }
        );

        if (error) {
          errors.push(`${country.iso2}: upsert failed - ${error.message}`);
        } else {
          updated++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${country.iso2}: ${msg}`);
        console.error(`Error for ${country.iso2}:`, msg);
      }

      // Small delay between requests to stay well within rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    const status =
      errors.length === 0
        ? "success"
        : updated > 0
          ? "partial"
          : "failed";

    await logRefresh(supabase, {
      source: "open-meteo-climate",
      status,
      countries_updated: updated,
      error_message: errors.length > 0 ? errors.join("; ") : undefined,
      started_at: startedAt,
    });

    return jsonResponse({
      status,
      countries_updated: updated,
      total_countries: COUNTRIES.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("refresh-climate failed:", msg);

    await logRefresh(supabase, {
      source: "open-meteo-climate",
      status: "failed",
      countries_updated: 0,
      error_message: msg,
      started_at: startedAt,
    });

    return jsonResponse({ status: "failed", error: msg }, 500);
  }
});
