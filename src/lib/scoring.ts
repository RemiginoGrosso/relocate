import type { ClimatePreference, ClimateProfile, CountryScores, DimensionKey, IncomeType, RankedCountry, ScoreTier, UserWeights } from './types';
import { CLIMATE_PROFILES, CLIMATE_REFERENCE_TEMP, LEVER_WEIGHTS, MIN_COVERAGE_RATIO, SCORE_THRESHOLDS, SHORTLIST_SIZE } from './constants';
import { getCityClimate, getDefaultCity } from './large-countries';

export function normaliseWeights(
  weights: UserWeights,
): Record<DimensionKey, number> {
  const entries = (Object.entries(weights) as [DimensionKey, number][]).filter(
    ([, v]) => v > 0,
  );
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return {} as Record<DimensionKey, number>;

  return Object.fromEntries(
    entries.map(([k, v]) => [k, v / total]),
  ) as Record<DimensionKey, number>;
}

export function computeComposite(
  country: CountryScores,
  normWeights: Partial<Record<DimensionKey, number>>,
): { score: number; nullDimensions: DimensionKey[]; coverageRatio: number } {
  let weightedSum = 0;
  let activeWeightSum = 0;
  const totalWeightSum = Object.values(normWeights).reduce((s, w) => s + (w ?? 0), 0);
  const nullDimensions: DimensionKey[] = [];

  for (const [key, weight] of Object.entries(normWeights) as [DimensionKey, number][]) {
    const dimScore = country.dimensionScores[key]?.score;
    if (dimScore == null) {
      nullDimensions.push(key);
    } else {
      weightedSum += dimScore * weight;
      activeWeightSum += weight;
    }
  }

  if (activeWeightSum === 0) return { score: 0, nullDimensions, coverageRatio: 0 };

  const score = Math.round((weightedSum / activeWeightSum) * 10) / 10;
  const coverageRatio = totalWeightSum > 0 ? activeWeightSum / totalWeightSum : 0;
  return { score, nullDimensions, coverageRatio };
}

export function rankCountries(
  countries: CountryScores[],
  weights: UserWeights,
): RankedCountry[] {
  const normWeights = normaliseWeights(weights);
  if (Object.keys(normWeights).length === 0) return [];

  const highestWeightKey = (
    Object.entries(normWeights) as [DimensionKey, number][]
  ).sort((a, b) => b[1] - a[1])[0]?.[0];

  const scored = countries
    .map((country) => {
      const { score, nullDimensions, coverageRatio } = computeComposite(country, normWeights);
      return {
        ...country,
        compositeScore: score,
        rank: 0,
        nullDimensions,
        hasLimitedData: coverageRatio < MIN_COVERAGE_RATIO,
        coverageRatio,
      };
    });

  const main = scored.filter((c) => !c.hasLimitedData);
  const limited = scored.filter((c) => c.hasLimitedData);

  const sortFn = (a: typeof scored[0], b: typeof scored[0]) => {
    if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore;
    if (!highestWeightKey) return 0;
    return (b.dimensionScores[highestWeightKey]?.score ?? 0) - (a.dimensionScores[highestWeightKey]?.score ?? 0);
  };

  main.sort(sortFn);
  limited.sort(sortFn);

  return [
    ...main.map((c, i) => ({ ...c, rank: i + 1 })),
    ...limited.map((c) => ({ ...c, rank: 0 })),
  ];
}

export interface ShortlistLever {
  dimension: DimensionKey;
  from: number;
  to: number;
  entering: RankedCountry[];
  leaving: RankedCountry[];
}

/**
 * The single slider move that changes the most countries in the user's top
 * SHORTLIST_SIZE. Tries each dimension at each LEVER_WEIGHTS position; on a tie,
 * the smaller move wins. Returns null when no single move changes the shortlist.
 */
export function findShortlistLever(
  countries: CountryScores[],
  weights: UserWeights,
): ShortlistLever | null {
  const top = (w: UserWeights) =>
    rankCountries(countries, w).filter((c) => c.rank > 0).slice(0, SHORTLIST_SIZE);
  const current = top(weights);
  if (current.length === 0) return null;
  const currentIds = new Set(current.map((c) => c.id));

  let best: ShortlistLever | null = null;
  for (const dimension of Object.keys(weights) as DimensionKey[]) {
    const from = weights[dimension];
    for (const to of LEVER_WEIGHTS) {
      if (to === from) continue;
      const next = top({ ...weights, [dimension]: to });
      const nextIds = new Set(next.map((c) => c.id));
      const entering = next.filter((c) => !currentIds.has(c.id));
      if (entering.length === 0) continue;
      const leaving = current.filter((c) => !nextIds.has(c.id));
      const better =
        !best ||
        entering.length > best.entering.length ||
        (entering.length === best.entering.length && Math.abs(to - from) < Math.abs(best.to - best.from));
      if (better) best = { dimension, from, to, entering, leaving };
    }
  }
  return best;
}

export function getScoreTier(score: number): ScoreTier {
  if (score >= SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= SCORE_THRESHOLDS.good) return 'good';
  if (score >= SCORE_THRESHOLDS.fair) return 'fair';
  return 'poor';
}

export function computeClimateScore(
  avgTemp: number | null,
  rainDays: number | null,
  sunshineHours: number | null,
  profile?: ClimateProfile,
  winterTemp?: number | null,
): number | null {
  if (avgTemp == null) return null;

  const ref = profile?.referenceTemp ?? CLIMATE_REFERENCE_TEMP;
  const tempPen = profile?.tempPenalty ?? 3;
  const rainThresh = profile?.rainThreshold ?? 150;
  const rainPen = profile?.rainPenalty ?? 10;
  const sunThresh = profile?.sunshineThreshold ?? 1500;
  const sunPen = profile?.sunshinePenalty ?? 15;

  let score = 100 - Math.abs(avgTemp - ref) * tempPen;
  if (rainDays != null && rainDays > rainThresh) score -= rainPen;
  if (sunshineHours != null && sunshineHours < sunThresh) score -= sunPen;

  if (profile?.winterTempThreshold != null && winterTemp != null) {
    const winterDeficit = profile.winterTempThreshold - winterTemp;
    if (winterDeficit > 0) {
      score -= winterDeficit * (profile.winterTempPenalty ?? 3);
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function applyClimatePreference(
  countries: CountryScores[],
  climateType: ClimatePreference,
  selectedCities: Record<string, string> = {},
): CountryScores[] {
  const hasPreference = climateType !== 'no_preference';
  const hasCityOverrides = Object.keys(selectedCities).length > 0;
  if (!hasPreference && !hasCityOverrides) return countries;

  const profile = hasPreference ? CLIMATE_PROFILES[climateType] : undefined;

  return countries.map((c) => {
    const climateDim = c.dimensionScores.climate;
    if (!climateDim?.components) return c;

    const cityName = selectedCities[c.iso.toUpperCase()] ?? (hasPreference ? getDefaultCity(c.iso) : null);
    const cityClimate = cityName ? getCityClimate(c.iso, cityName) : null;

    const avgTemp = cityClimate?.avgTemp ?? climateDim.components.avg_temp ?? null;
    const rainDays = cityClimate?.rainDays ?? climateDim.components.rain_days ?? null;
    const sunshineHours = cityClimate?.sunshineHours ?? climateDim.components.sunshine_hours ?? null;
    const winterTemp = cityClimate?.winterTemp ?? climateDim.components.avg_temp_winter ?? null;

    const newScore = computeClimateScore(avgTemp, rainDays, sunshineHours, profile, winterTemp);

    const newComponents = cityClimate
      ? { ...climateDim.components, avg_temp: avgTemp as number, rain_days: rainDays as number, sunshine_hours: sunshineHours as number }
      : climateDim.components;

    return {
      ...c,
      dimensionScores: {
        ...c.dimensionScores,
        climate: { ...climateDim, score: newScore, components: newComponents },
      },
    };
  });
}

/**
 * Purchasing power is stored as cost affordability (income from abroad).
 * For a local salary, swap in the local_income component (GDP per capita PPP, log scale).
 */
export function applyIncomeType(countries: CountryScores[], incomeType: IncomeType): CountryScores[] {
  if (incomeType === 'abroad') return countries;
  return countries.map((c) => {
    const pp = c.dimensionScores.purchasing_power;
    if (!pp?.components) return c;
    const localIncome = pp.components.local_income ?? null;
    return {
      ...c,
      dimensionScores: {
        ...c.dimensionScores,
        purchasing_power: {
          ...pp,
          score: localIncome,
          confidence: localIncome == null ? 'no_data' : 'high',
        },
      },
    };
  });
}
