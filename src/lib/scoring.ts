import type { ClimatePreference, ClimateProfile, CountryScores, DimensionKey, RankedCountry, ScoreTier, UserWeights } from './types';
import { CLIMATE_PROFILES, CLIMATE_REFERENCE_TEMP, MAX_NULL_DIMENSIONS, SCORE_THRESHOLDS } from './constants';

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

  return Math.max(0, Math.min(100, score));
}

export function applyClimatePreference(
  countries: CountryScores[],
  climateType: ClimatePreference,
): CountryScores[] {
  if (climateType === 'no_preference') return countries;
  const profile = CLIMATE_PROFILES[climateType];
  return countries.map((c) => {
    const climateDim = c.dimensionScores.climate;
    if (!climateDim?.components) return c;
    const newScore = computeClimateScore(
      climateDim.components.avg_temp ?? null,
      climateDim.components.rain_days ?? null,
      climateDim.components.sunshine_hours ?? null,
      profile,
    );
    return {
      ...c,
      dimensionScores: {
        ...c.dimensionScores,
        climate: { ...climateDim, score: newScore },
      },
    };
  });
}
