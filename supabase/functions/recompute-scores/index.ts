/**
 * recompute-scores
 *
 * Reads all raw_indices and climate_data, applies normalisation formulas
 * from SCORING_ENGINE.md, writes results to normalised_scores, then
 * refreshes the v_country_scores materialised view.
 *
 * Should be called after any data refresh (world-bank, who, climate).
 *
 * Invoke: POST /functions/v1/recompute-scores
 * Auth: Bearer token with service role key
 *
 * Formulas implemented here MUST match SCORING_ENGINE.md exactly.
 */
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { ENGLISH_NATIVE } from "../_shared/countries.ts";
import { logRefresh, jsonResponse } from "../_shared/logger.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RawRow {
  country_id: string;
  source: string;
  indicator: string;
  value: number | null;
}

interface CountryRow {
  id: string;
  iso_alpha2: string;
}

interface ClimateRow {
  country_id: string;
  avg_temp_annual: number | null;
  avg_temp_winter: number | null;
  avg_temp_summer: number | null;
  sunshine_hours_annual: number | null;
  rain_days_annual: number | null;
}

interface DimensionScore {
  country_id: string;
  dimension_key: string;
  score: number | null;
  confidence: "high" | "medium" | "low" | "no_data";
  component_scores: Record<string, number | null>;
}

type RawMap = Record<string, number | null>;

// ---------------------------------------------------------------------------
// Normalisation functions
// (Mirrors src/lib/normalisation.ts for Deno runtime)
// ---------------------------------------------------------------------------

function minMaxNormalise(
  value: number | null | undefined,
  min: number,
  max: number,
  invert = false
): number | null {
  if (value == null || min === max) return null;
  const clamped = Math.max(min, Math.min(max, value));
  const normalised = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - normalised : normalised;
}

function pisaAcademicNormalise(
  reading: number | null | undefined,
  maths: number | null | undefined,
  science: number | null | undefined
): number | null {
  const scores = [reading, maths, science].filter(
    (s): s is number => s != null
  );
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return minMaxNormalise(avg, 300, 600);
}

/**
 * Climate comfort heuristic from SCORING_ENGINE.md section 3.8:
 * climate = 100 - (|avg_temp - 20| * 3) - (rain_days > 150 ? 10 : 0) - (sunshine < 1500 ? 15 : 0)
 */
function computeClimateScore(
  avgTemp: number | null,
  rainDays: number | null,
  sunshineHours: number | null
): number | null {
  if (avgTemp == null) return null;
  let score = 100 - Math.abs(avgTemp - 20) * 3;
  if (rainDays != null && rainDays > 150) score -= 10;
  if (sunshineHours != null && sunshineHours < 1500) score -= 15;
  return Math.max(0, Math.min(100, score));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeNum(val: number | null | undefined): number | null {
  return val != null && !isNaN(val) ? val : null;
}

function getRaw(
  rawByCountry: Record<string, RawRow[]>,
  countryId: string
): RawMap {
  const map: RawMap = {};
  for (const row of rawByCountry[countryId] ?? []) {
    // Use the most recent value per source.indicator
    // (raw_indices may have multiple years; we want the latest)
    const key = `${row.source}.${row.indicator}`;
    if (map[key] === undefined) {
      map[key] = row.value;
    }
  }
  return map;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

// ---------------------------------------------------------------------------
// Dimension computations
// All formulas match SCORING_ENGINE.md sections 3.1-3.10
// ---------------------------------------------------------------------------

function computePurchasingPower(raw: RawMap): DimensionScore | null {
  const oecdPpp = safeNum(raw["worldbank.oecd_ppp_aic"]);
  const priceLevel = safeNum(raw["worldbank.price_level_ratio"]);
  const oopPct = safeNum(raw["worldbank.who_oop_pct"]);

  if (oecdPpp == null && priceLevel == null) return null;

  const pppNorm = oecdPpp != null ? minMaxNormalise(oecdPpp, 8000, 160000) : null;
  const affordNorm = priceLevel != null
    ? minMaxNormalise(priceLevel, 0.10, 1.50, true)
    : null;
  const oopNorm = oopPct != null
    ? minMaxNormalise(oopPct, 5, 65, true)
    : null;

  // Weighted sum with re-normalisation for missing components
  const parts: { val: number; weight: number }[] = [];
  if (pppNorm != null) parts.push({ val: pppNorm, weight: 0.55 });
  if (affordNorm != null) parts.push({ val: affordNorm, weight: 0.30 });
  if (oopNorm != null) parts.push({ val: oopNorm, weight: 0.15 });

  if (parts.length === 0) return null;

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  const score = parts.reduce((s, p) => s + p.val * (p.weight / totalWeight), 0);

  return {
    country_id: "",
    dimension_key: "purchasing_power",
    score: round2(score),
    confidence: parts.length === 3 ? "high" : "medium",
    component_scores: {
      oecd_ppp: pppNorm,
      cost_affordability: affordNorm,
      oop_burden: oopNorm,
    },
  };
}

function computeCivicCulture(raw: RawMap): DimensionScore | null {
  const wgiRol = safeNum(raw["worldbank.wgi_rule_of_law"]);
  const wgiCc = safeNum(raw["worldbank.wgi_corruption_control"]);
  const wvsTrust = safeNum(raw["wvs.trust_pct"]);

  if (wgiRol == null && wgiCc == null) return null;

  let score: number | null = null;
  let confidence: "high" | "medium" = "medium";

  if (wgiRol != null && wgiCc != null && wvsTrust != null) {
    // Full formula: 40/35/25 split
    score = wgiRol * 0.4 + wgiCc * 0.35 + wvsTrust * 0.25;
    confidence = "high";
  } else if (wgiRol != null && wgiCc != null) {
    // Fallback: 55/45 split (no WVS data)
    score = wgiRol * 0.55 + wgiCc * 0.45;
    confidence = "medium";
  }

  if (score == null) return null;

  return {
    country_id: "",
    dimension_key: "civic_culture",
    score: round2(score),
    confidence,
    component_scores: {
      wgi_rule_of_law: wgiRol,
      wgi_corruption: wgiCc,
      wvs_trust: wvsTrust,
    },
  };
}

function computeSafety(raw: RawMap): DimensionScore | null {
  const gpi = safeNum(raw["gpi.gpi_score"]);
  if (gpi == null) return null;

  const gpiNorm = minMaxNormalise(gpi, 1.00, 3.50, true);
  if (gpiNorm == null) return null;

  return {
    country_id: "",
    dimension_key: "safety",
    score: gpiNorm,
    confidence: "high",
    component_scores: { gpi: gpiNorm },
  };
}

function computeWarmth(raw: RawMap): DimensionScore | null {
  const ivr = safeNum(raw["hofstede.ivr"]);
  const intRank = safeNum(raw["internations.ease_rank"]);
  const intScore = intRank != null
    ? round2(((53 - intRank) / (53 - 1)) * 100)
    : null;
  const maiRaw = safeNum(raw["gallup.mai"]);
  const maiNorm = maiRaw != null ? round2((maiRaw / 9) * 100) : null;

  // Primary formula: IVR × 0.4 + InterNations × 0.6
  if (ivr != null && intScore != null) {
    return {
      country_id: "",
      dimension_key: "warmth",
      score: round2(ivr * 0.4 + intScore * 0.6),
      confidence: "medium",
      component_scores: { ivr, internations_score: intScore },
    };
  }

  // Partial: one primary source available
  if (ivr != null || intScore != null) {
    return {
      country_id: "",
      dimension_key: "warmth",
      score: ivr ?? intScore!,
      confidence: "low",
      component_scores: { ivr, internations_score: intScore },
    };
  }

  // Fallback: MAI when neither IVR nor InterNations is available
  if (maiNorm != null) {
    return {
      country_id: "",
      dimension_key: "warmth",
      score: maiNorm,
      confidence: "low",
      component_scores: { mai: maiNorm },
    };
  }

  return null;
}

function computeSchoolCulture(raw: RawMap): DimensionScore | null {
  const pisaReading = safeNum(raw["pisa.pisa_reading"]);
  const pisaMaths = safeNum(raw["pisa.pisa_maths"]);
  const pisaScience = safeNum(raw["pisa.pisa_science"]);
  const pisaBelonging = safeNum(raw["pisa.pisa_belonging"]);
  const pisaBullying = safeNum(raw["pisa.pisa_bullying"]);
  const pisaSafety = safeNum(raw["pisa.pisa_safety"]);

  if (pisaReading == null && pisaMaths == null && pisaScience == null)
    return null;

  const academic = pisaAcademicNormalise(pisaReading, pisaMaths, pisaScience);
  const belonging =
    pisaBelonging != null ? minMaxNormalise(pisaBelonging, -0.3, 0.5) : null;
  const bullying =
    pisaBullying != null
      ? minMaxNormalise(pisaBullying, 0.05, 0.3, true)
      : null;
  const safety =
    pisaSafety != null ? minMaxNormalise(pisaSafety, 0.1, 0.55) : null;

  const parts: { val: number; weight: number }[] = [];
  if (academic != null) parts.push({ val: academic, weight: 0.25 });
  if (belonging != null) parts.push({ val: belonging, weight: 0.3 });
  if (bullying != null) parts.push({ val: bullying, weight: 0.3 });
  if (safety != null) parts.push({ val: safety, weight: 0.15 });

  if (parts.length === 0) return null;

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  const score = parts.reduce(
    (s, p) => s + p.val * (p.weight / totalWeight),
    0
  );

  return {
    country_id: "",
    dimension_key: "school_culture",
    score: round2(score),
    confidence: parts.length >= 3 ? "high" : "medium",
    component_scores: {
      academic,
      belonging,
      bullying_inv: bullying,
      safety,
    },
  };
}

function computeHealthcare(raw: RawMap): DimensionScore | null {
  const uhc = safeNum(raw["worldbank.who_uhc_coverage"]);
  const healthOop = safeNum(raw["worldbank.who_oop_pct"]);

  if (uhc == null) return null;

  const uhcNorm = minMaxNormalise(uhc, 0, 100);
  const oopNorm =
    healthOop != null ? minMaxNormalise(healthOop, 5, 65, true) : null;

  let healthScore: number | null;
  if (uhcNorm != null && oopNorm != null) {
    healthScore = uhcNorm * 0.55 + oopNorm * 0.45;
  } else {
    healthScore = uhcNorm;
  }

  return {
    country_id: "",
    dimension_key: "healthcare",
    score: healthScore != null ? round2(healthScore) : null,
    confidence: oopNorm != null ? "high" : "medium",
    component_scores: { who_uhc: uhcNorm, who_oop: oopNorm },
  };
}

function computeInfrastructure(raw: RawMap): DimensionScore | null {
  const imd = safeNum(raw["imd.infrastructure_score"]);
  if (imd == null) return null;

  return {
    country_id: "",
    dimension_key: "infrastructure",
    score: imd,
    confidence: "high",
    component_scores: { imd_score: imd },
  };
}

function computeReligiousFreedom(raw: RawMap): DimensionScore | null {
  const pewGovt = safeNum(raw["pew.govt_restrictions"]);
  const pewSocial = safeNum(raw["pew.social_hostility"]);

  if (pewGovt == null && pewSocial == null) return null;

  // Normalise 0-10 scale to 0-100, then invert (higher = more freedom)
  const govtNorm =
    pewGovt != null ? 100 - (pewGovt / 10) * 100 : null;
  const socialNorm =
    pewSocial != null ? 100 - (pewSocial / 10) * 100 : null;

  let rfScore: number | null = null;
  if (govtNorm != null && socialNorm != null) {
    rfScore = govtNorm * 0.5 + socialNorm * 0.5;
  } else if (govtNorm != null) {
    rfScore = govtNorm;
  } else if (socialNorm != null) {
    rfScore = socialNorm;
  }

  return {
    country_id: "",
    dimension_key: "religious_freedom",
    score: rfScore != null ? round2(rfScore) : null,
    confidence: govtNorm != null && socialNorm != null ? "medium" : "low",
    component_scores: { pew_govt: govtNorm, pew_social: socialNorm },
  };
}

function computeEnglishProficiency(
  raw: RawMap,
  iso: string
): DimensionScore | null {
  if (ENGLISH_NATIVE.has(iso)) {
    return {
      country_id: "",
      dimension_key: "english_proficiency",
      score: 100,
      confidence: "high",
      component_scores: { ef_epi: null, native_speaker: 1 },
    };
  }

  const efEpi = safeNum(raw["ef.epi_score"]);
  if (efEpi == null) return null;

  const epiNorm = minMaxNormalise(efEpi, 400, 650);

  return {
    country_id: "",
    dimension_key: "english_proficiency",
    score: epiNorm,
    confidence: "high",
    component_scores: { ef_epi: epiNorm },
  };
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
    console.log("Fetching raw data and climate data...");

    // Fetch all data in parallel
    const [countriesResult, rawResult, climateResult] = await Promise.all([
      supabase
        .from("countries")
        .select("id, iso_alpha2")
        .eq("is_active", true),
      supabase
        .from("raw_indices")
        .select("country_id, source, indicator, value")
        .order("year", { ascending: false }),
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
    if (rawResult.error) {
      throw new Error(`Raw indices query failed: ${rawResult.error.message}`);
    }

    const countries = countriesResult.data as CountryRow[];
    const rawIndices = rawResult.data as RawRow[];
    const climateData = (climateResult.data ?? []) as ClimateRow[];

    if (!countries.length) {
      throw new Error("No active countries found. Run seed.ts first.");
    }

    // Group raw indices by country (most recent year first due to ORDER BY)
    const rawByCountry: Record<string, RawRow[]> = {};
    for (const row of rawIndices) {
      if (!rawByCountry[row.country_id]) rawByCountry[row.country_id] = [];
      rawByCountry[row.country_id].push(row);
    }

    // Group climate by country (most recent year first)
    const climateByCountry: Record<string, ClimateRow> = {};
    for (const row of climateData) {
      // Keep only the first (most recent) entry per country
      if (!climateByCountry[row.country_id]) {
        climateByCountry[row.country_id] = row;
      }
    }

    // Compute all dimension scores
    const scores: DimensionScore[] = [];

    for (const country of countries) {
      const raw = getRaw(rawByCountry, country.id);
      const iso = country.iso_alpha2;

      const computations = [
        computePurchasingPower(raw),
        computeCivicCulture(raw),
        computeSafety(raw),
        computeWarmth(raw),
        computeSchoolCulture(raw),
        computeHealthcare(raw),
        computeInfrastructure(raw),
        computeReligiousFreedom(raw),
        computeEnglishProficiency(raw, iso),
      ];

      // Climate uses the climate_data table, not raw_indices
      const climateRow = climateByCountry[country.id];
      if (climateRow) {
        const climateScore = computeClimateScore(
          climateRow.avg_temp_annual,
          climateRow.rain_days_annual,
          climateRow.sunshine_hours_annual
        );
        scores.push({
          country_id: country.id,
          dimension_key: "climate",
          score: climateScore,
          confidence: "high",
          component_scores: {
            avg_temp: climateRow.avg_temp_annual,
            rain_days: climateRow.rain_days_annual,
            sunshine_hours: climateRow.sunshine_hours_annual,
          },
        });
      }

      for (const result of computations) {
        if (result) {
          result.country_id = country.id;
          scores.push(result);
        }
      }
    }

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
