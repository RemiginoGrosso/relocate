import type { ClimatePreference, ClimateProfile, CountryScores, DimensionKey, RankedCountry, ScoreTier, UserWeights } from './types';
import { CLIMATE_PROFILES, CLIMATE_REFERENCE_TEMP, MAX_NULL_DIMENSIONS, SCORE_THRESHOLDS } from './constants';
import { getCityClimate } from './large-countries';

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
): { score: number; nullDimensions: DimensionKey[] } {
  let weightedSum = 0;
  let activeWeightSum = 0;
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

  if (activeWeightSum === 0) return { score: 0, nullDimensions };

  const score = Math.round((weightedSum / activeWeightSum) * 10) / 10;
  return { score, nullDimensions };
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

  const ranked = countries
    .map((country) => {
      const { score, nullDimensions } = computeComposite(country, normWeights);
      return {
        ...country,
        compositeScore: score,
        rank: 0,
        nullDimensions,
        hasLimitedData: nullDimensions.length > MAX_NULL_DIMENSIONS,
      };
    })
    .sort((a, b) => {
      if (b.compositeScore !== a.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }
      if (!highestWeightKey) return 0;
      const aTop = a.dimensionScores[highestWeightKey]?.score ?? 0;
      const bTop = b.dimensionScores[highestWeightKey]?.score ?? 0;
      return bTop - aTop;
    });

  return ranked.map((country, i) => ({
    ...country,
    rank: i + 1,
  }));
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

    const cityName = selectedCities[c.iso.toUpperCase()];
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
