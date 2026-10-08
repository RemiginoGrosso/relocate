/**
 * Pure scoring logic for recompute-scores, kept free of Deno and Supabase so
 * scripts/edge-parity.ts and the vitest suite can run it in Node.
 *
 * Formulas implemented here MUST match SCORING_ENGINE.md exactly.
 */
import { ENGLISH_NATIVE } from "../_shared/countries.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface RawRow {
  country_id: string;
  source: string;
  indicator: string;
  value: number | null;
  year: number;
}

export interface CountryRow {
  id: string;
  iso_alpha2: string;
}

export interface ClimateRow {
  country_id: string;
  avg_temp_annual: number | null;
  avg_temp_winter: number | null;
  avg_temp_summer: number | null;
  sunshine_hours_annual: number | null;
  rain_days_annual: number | null;
}

export interface DimensionScore {
  country_id: string;
  dimension_key: string;
  score: number | null;
  confidence: "high" | "medium" | "low" | "no_data";
  component_scores: Record<string, number | null>;
}

export type RawMap = Record<string, number | null>;

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

// Latest year wins when an indicator has rows for several years, whatever the row order.
export function getRaw(
  rawByCountry: Record<string, RawRow[]>,
  countryId: string
): RawMap {
  const map: RawMap = {};
  const years: Record<string, number> = {};
  for (const row of rawByCountry[countryId] ?? []) {
    const key = `${row.source}.${row.indicator}`;
    if (years[key] != null && years[key] >= row.year) continue;
    years[key] = row.year;
    map[key] = row.value;
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

function logNormalise(value: number, min: number, max: number): number {
  const clamped = Math.min(Math.max(value, min), max);
  return round2(((Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 100);
}

// Homicides per 100k, log scale: 0.3 or lower = 100, 40 or higher = 0
function homicideNormalise(rate: number): number {
  const clamped = Math.min(Math.max(rate, 0.3), 40);
  return round2(((Math.log10(40) - Math.log10(clamped)) / (Math.log10(40) - Math.log10(0.3))) * 100);
}

// Score = cost affordability (income from abroad). local_income kept as a component for local-job users.
function computePurchasingPower(raw: RawMap): DimensionScore | null {
  // Key name is historical: the value is World Bank GDP per capita PPP (NY.GDP.PCAP.PP.CD)
  const gdpPcPpp = safeNum(raw["worldbank.oecd_ppp_aic"]);
  const priceLevel = safeNum(raw["worldbank.price_level_ratio"]);

  if (gdpPcPpp == null && priceLevel == null) return null;

  const costAffordability = priceLevel != null
    ? round2(minMaxNormalise(priceLevel, 0.10, 1.50, true)!)
    : null;
  const localIncome = gdpPcPpp != null ? logNormalise(gdpPcPpp, 8000, 160000) : null;

  return {
    country_id: "",
    dimension_key: "purchasing_power",
    score: costAffordability,
    confidence: costAffordability != null ? "high" : "no_data",
    component_scores: {
      cost_affordability: costAffordability,
      local_income: localIncome,
    },
  };
}

// Rule of Law (key civic_culture): WGI only
function computeCivicCulture(raw: RawMap): DimensionScore | null {
  const wgiRol = safeNum(raw["worldbank.wgi_rule_of_law"]);
  const wgiCc = safeNum(raw["worldbank.wgi_corruption_control"]);

  if (wgiRol == null || wgiCc == null) return null;

  return {
    country_id: "",
    dimension_key: "civic_culture",
    score: round2(wgiRol * 0.55 + wgiCc * 0.45),
    confidence: "high",
    component_scores: {
      wgi_rule_of_law: wgiRol,
      wgi_corruption: wgiCc,
    },
  };
}

// Safety: UNODC homicide (log) x 0.50 + Numbeo street crime x 0.50
function computeSafety(raw: RawMap): DimensionScore | null {
  const homicideRate = safeNum(raw["worldbank.homicide_rate"]);
  const numbeoCrime = safeNum(raw["numbeo.crime_index"]);
  const homicide = homicideRate != null ? homicideNormalise(homicideRate) : null;
  const streetCrime = numbeoCrime != null ? round2(100 - numbeoCrime) : null;

  if (homicide == null && streetCrime == null) return null;

  const both = homicide != null && streetCrime != null;
  return {
    country_id: "",
    dimension_key: "safety",
    score: both ? round2(homicide! * 0.5 + streetCrime! * 0.5) : (homicide ?? streetCrime),
    confidence: both ? "high" : "medium",
    component_scores: { homicide, street_crime: streetCrime },
  };
}

function computeWarmth(raw: RawMap): DimensionScore | null {
  const ivr = safeNum(raw["hofstede.ivr"]);
  const intRank = safeNum(raw["internations.ease_rank"]);
  // Unrounded in the formula, rounded only for display, as in scripts/compute-normalised.ts
  const intScore = intRank != null
    ? ((53 - intRank) / (53 - 1)) * 100
    : null;

  // Both sources required — no single-source or MAI fallback
  if (ivr != null && intScore != null) {
    return {
      country_id: "",
      dimension_key: "warmth",
      score: round2(ivr * 0.4 + intScore * 0.6),
      confidence: "high",
      component_scores: { ivr, internations_score: round2(intScore) },
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
  if (uhc == null) return null;

  const uhcNorm = minMaxNormalise(uhc, 0, 100);
  const haq = safeNum(raw["ihme.haq_index"]);
  const physicians = safeNum(raw["oecd.physicians_per_1000"]);
  const beds = safeNum(raw["oecd.beds_per_1000"]);
  const nurses = safeNum(raw["oecd.nurses_per_1000"]);

  let capacityScore: number | null = null;
  if (physicians != null && beds != null && nurses != null) {
    const physNorm = minMaxNormalise(physicians, 0, 6);
    const bedsNorm = minMaxNormalise(beds, 0, 13);
    const nursesNorm = minMaxNormalise(nurses, 0, 18);
    if (physNorm != null && bedsNorm != null && nursesNorm != null) {
      capacityScore = round2(physNorm * 0.40 + bedsNorm * 0.35 + nursesNorm * 0.25);
    }
  }

  let score: number;
  let confidence: "high" | "medium";
  if (haq != null && capacityScore != null) {
    score = uhcNorm! * 0.35 + haq * 0.35 + capacityScore * 0.30;
    confidence = "high";
  } else if (haq != null) {
    score = uhcNorm! * 0.50 + haq * 0.50;
    confidence = "medium";
  } else {
    score = uhcNorm!;
    confidence = "medium";
  }

  return {
    country_id: "",
    dimension_key: "healthcare",
    score: round2(score),
    confidence,
    component_scores: {
      who_uhc: uhcNorm,
      haq_index: haq,
      capacity: capacityScore,
      physicians: physicians != null ? minMaxNormalise(physicians, 0, 6) : null,
      beds: beds != null ? minMaxNormalise(beds, 0, 13) : null,
      nurses: nurses != null ? minMaxNormalise(nurses, 0, 18) : null,
    },
  };
}

// Values patched from the World Bank LPI, not IMD: shown as estimates (keep in sync with ESTIMATED_VALUES in src/lib/constants.ts)
const INFRASTRUCTURE_ESTIMATES = new Set(["CZ", "VN", "PA", "UY", "CR"]);

function computeInfrastructure(raw: RawMap, iso: string): DimensionScore | null {
  const imd = safeNum(raw["imd.infrastructure_score"]);
  if (imd == null) return null;

  return {
    country_id: "",
    dimension_key: "infrastructure",
    score: imd,
    confidence: INFRASTRUCTURE_ESTIMATES.has(iso) ? "low" : "high",
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
    confidence: govtNorm != null && socialNorm != null ? "high" : "medium",
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
// Whole-table computation
// ---------------------------------------------------------------------------

export function computeAllScores(
  countries: CountryRow[],
  rawIndices: RawRow[],
  climateData: ClimateRow[]
): DimensionScore[] {
  const rawByCountry: Record<string, RawRow[]> = {};
  for (const row of rawIndices) {
    if (!rawByCountry[row.country_id]) rawByCountry[row.country_id] = [];
    rawByCountry[row.country_id].push(row);
  }

  // Caller orders climate_data by data_year desc; keep the first (most recent) per country
  const climateByCountry: Record<string, ClimateRow> = {};
  for (const row of climateData) {
    if (!climateByCountry[row.country_id]) {
      climateByCountry[row.country_id] = row;
    }
  }

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
      computeInfrastructure(raw, iso),
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
          avg_temp_winter: climateRow.avg_temp_winter,
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

  return scores;
}

/**
 * Reads every row through a page fetcher. PostgREST silently caps one select at
 * 1000 rows, which is how the old single select dropped half of raw_indices.
 * Throws unless the rows read equal the table's exact count.
 */
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => Promise<{ rows: T[]; count: number | null }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  let expected: number | null = null;
  for (let from = 0; ; from += pageSize) {
    const { rows, count } = await fetchPage(from, from + pageSize - 1);
    if (expected == null) expected = count;
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  if (expected == null) {
    throw new Error("Row count unavailable; refusing to compute from a possibly partial read");
  }
  if (all.length !== expected) {
    throw new Error(`Read ${all.length} rows but the table holds ${expected}`);
  }
  return all;
}

/** Stored (country, dimension) pairs that no longer compute, so their old score must go. */
export function staleScoreKeys<T extends { country_id: string; dimension_key: string }>(
  stored: T[],
  computed: DimensionScore[]
): T[] {
  const keep = new Set(computed.map((s) => `${s.country_id}|${s.dimension_key}`));
  return stored.filter((s) => !keep.has(`${s.country_id}|${s.dimension_key}`));
}
