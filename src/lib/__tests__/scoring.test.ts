import { describe, it, expect } from 'vitest';
import { normaliseWeights, computeComposite, rankCountries, getScoreTier, computeClimateScore, applyClimatePreference } from '../scoring';
import { minMaxNormalise, rankToScore, pisaAcademicNormalise, gpiNormalise, pewNormalise } from '../normalisation';
import { DEFAULT_WEIGHTS, CLIMATE_PROFILES } from '../constants';
import type { CountryScores, UserWeights, DimensionKey } from '../types';

function makeCountry(
  overrides: Partial<CountryScores> & { scores?: Partial<Record<DimensionKey, number | null>> },
): CountryScores {
  const scores = overrides.scores ?? {};
  const dimensionScores: CountryScores['dimensionScores'] = {};
  for (const [key, val] of Object.entries(scores)) {
    dimensionScores[key as DimensionKey] = {
      score: val,
      confidence: val != null ? 'high' : 'no_data',
      components: {},
    };
  }
  return {
    id: overrides.id ?? 'test-id',
    name: overrides.name ?? 'Test Country',
    iso: overrides.iso ?? 'TC',
    region: overrides.region ?? 'Western Europe',
    flagEmoji: overrides.flagEmoji ?? '🏳️',
    capitalCity: overrides.capitalCity ?? 'Test City',
    dimensionScores,
  };
}

describe('normaliseWeights', () => {
  it('normalises equal weights to equal values', () => {
    const weights: UserWeights = {
      purchasing_power: 5, civic_culture: 5, safety: 5, warmth: 5,
      school_culture: 5, healthcare: 5, infrastructure: 5, climate: 5,
      religious_freedom: 5, english_proficiency: 5,
    };
    const result = normaliseWeights(weights);
    for (const v of Object.values(result)) {
      expect(v).toBeCloseTo(0.1, 5);
    }
  });

  it('gives ~4x weight to a dimension at 8 vs 2', () => {
    const weights: UserWeights = {
      purchasing_power: 8, civic_culture: 2, safety: 2, warmth: 2,
      school_culture: 2, healthcare: 2, infrastructure: 2, climate: 2,
      religious_freedom: 2, english_proficiency: 2,
    };
    const result = normaliseWeights(weights);
    expect(result.purchasing_power / result.civic_culture).toBeCloseTo(4, 5);
  });

  it('excludes zero-weight dimensions', () => {
    const weights: UserWeights = {
      purchasing_power: 5, civic_culture: 0, safety: 5, warmth: 5,
      school_culture: 5, healthcare: 5, infrastructure: 5, climate: 5,
      religious_freedom: 5, english_proficiency: 5,
    };
    const result = normaliseWeights(weights);
    expect(result.civic_culture).toBeUndefined();
    expect(Object.keys(result)).toHaveLength(9);
  });

  it('returns empty record when all weights are zero', () => {
    const weights: UserWeights = {
      purchasing_power: 0, civic_culture: 0, safety: 0, warmth: 0,
      school_culture: 0, healthcare: 0, infrastructure: 0, climate: 0,
      religious_freedom: 0, english_proficiency: 0,
    };
    const result = normaliseWeights(weights);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('computeComposite', () => {
  it('computes correct weighted average with all scores present', () => {
    const country = makeCountry({
      scores: {
        purchasing_power: 80, civic_culture: 60, safety: 70, warmth: 50,
        school_culture: 90, healthcare: 75, infrastructure: 65, climate: 55,
        religious_freedom: 85, english_proficiency: 40,
      },
    });
    const normWeights = normaliseWeights(DEFAULT_WEIGHTS);
    const { score, nullDimensions } = computeComposite(country, normWeights);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(nullDimensions).toHaveLength(0);
  });

  it('re-normalises correctly when dimensions are null', () => {
    const country = makeCountry({
      scores: {
        purchasing_power: 80, civic_culture: 60,
        safety: null, warmth: null,
        school_culture: 80, healthcare: 70,
        infrastructure: 60, climate: 50,
        religious_freedom: 90, english_proficiency: 40,
      },
    });
    const normWeights = normaliseWeights(DEFAULT_WEIGHTS);
    const { score, nullDimensions } = computeComposite(country, normWeights);

    expect(nullDimensions).toContain('safety');
    expect(nullDimensions).toContain('warmth');
    expect(nullDimensions).toHaveLength(2);
    expect(score).toBeGreaterThan(0);
  });

  it('returns 0 when all dimensions are null', () => {
    const country = makeCountry({
      scores: {
        purchasing_power: null, civic_culture: null, safety: null, warmth: null,
        school_culture: null, healthcare: null, infrastructure: null, climate: null,
        religious_freedom: null, english_proficiency: null,
      },
    });
    const normWeights = normaliseWeights(DEFAULT_WEIGHTS);
    const { score } = computeComposite(country, normWeights);
    expect(score).toBe(0);
  });
});

describe('rankCountries', () => {
  it('ranks countries in descending order of composite score', () => {
    const countries = [
      makeCountry({ name: 'Low', iso: 'LO', scores: { purchasing_power: 30, civic_culture: 30, safety: 30, warmth: 30, school_culture: 30, healthcare: 30, infrastructure: 30, climate: 30, religious_freedom: 30, english_proficiency: 30 } }),
      makeCountry({ name: 'High', iso: 'HI', scores: { purchasing_power: 90, civic_culture: 90, safety: 90, warmth: 90, school_culture: 90, healthcare: 90, infrastructure: 90, climate: 90, religious_freedom: 90, english_proficiency: 90 } }),
      makeCountry({ name: 'Mid', iso: 'MI', scores: { purchasing_power: 60, civic_culture: 60, safety: 60, warmth: 60, school_culture: 60, healthcare: 60, infrastructure: 60, climate: 60, religious_freedom: 60, english_proficiency: 60 } }),
    ];
    const ranked = rankCountries(countries, DEFAULT_WEIGHTS);

    expect(ranked[0].name).toBe('High');
    expect(ranked[1].name).toBe('Mid');
    expect(ranked[2].name).toBe('Low');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].rank).toBe(3);
  });

  it('sets hasLimitedData flag when > 3 dimensions are null', () => {
    const country = makeCountry({
      scores: {
        purchasing_power: 50, civic_culture: 50, safety: 50, warmth: 50,
        school_culture: null, healthcare: null, infrastructure: null, climate: null,
        religious_freedom: 50, english_proficiency: 50,
      },
    });
    const ranked = rankCountries([country], DEFAULT_WEIGHTS);
    expect(ranked[0].hasLimitedData).toBe(true);
    expect(ranked[0].nullDimensions).toHaveLength(4);
  });

  it('returns empty array when all weights are zero', () => {
    const zeroWeights: UserWeights = {
      purchasing_power: 0, civic_culture: 0, safety: 0, warmth: 0,
      school_culture: 0, healthcare: 0, infrastructure: 0, climate: 0,
      religious_freedom: 0, english_proficiency: 0,
    };
    const ranked = rankCountries([makeCountry({ scores: { purchasing_power: 50 } })], zeroWeights);
    expect(ranked).toHaveLength(0);
  });
});

describe('getScoreTier', () => {
  it('returns correct tiers', () => {
    expect(getScoreTier(85)).toBe('excellent');
    expect(getScoreTier(70)).toBe('excellent');
    expect(getScoreTier(55)).toBe('good');
    expect(getScoreTier(50)).toBe('good');
    expect(getScoreTier(35)).toBe('fair');
    expect(getScoreTier(30)).toBe('fair');
    expect(getScoreTier(15)).toBe('poor');
    expect(getScoreTier(0)).toBe('poor');
  });
});

describe('computeClimateScore', () => {
  it('returns 100 for ideal conditions', () => {
    expect(computeClimateScore(20, 100, 2000)).toBe(100);
  });

  it('applies all penalties', () => {
    const score = computeClimateScore(5, 200, 1200);
    expect(score).toBeLessThan(50);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('clamps to 0 for extreme values', () => {
    expect(computeClimateScore(-10, 250, 800)).toBe(0);
  });

  it('returns null for null temperature', () => {
    expect(computeClimateScore(null, 100, 2000)).toBeNull();
  });

  it('scores high for sunny_warm profile with Mediterranean climate', () => {
    const profile = CLIMATE_PROFILES.sunny_warm;
    const score = computeClimateScore(22, 60, 2800, profile);
    expect(score).toBe(100);
  });

  it('scores high for freezing_cold profile with Nordic climate', () => {
    const profile = CLIMATE_PROFILES.freezing_cold;
    const score = computeClimateScore(3, 150, 1200, profile);
    expect(score).toBe(100);
  });

  it('penalises cold climate under sunny_warm profile', () => {
    const profile = CLIMATE_PROFILES.sunny_warm;
    const warmScore = computeClimateScore(22, 60, 2800, profile)!;
    const coldScore = computeClimateScore(5, 60, 2800, profile)!;
    expect(warmScore).toBeGreaterThan(coldScore);
    expect(warmScore - coldScore).toBeGreaterThan(40);
  });

  it('penalises warm climate under freezing_cold profile', () => {
    const profile = CLIMATE_PROFILES.freezing_cold;
    const coldScore = computeClimateScore(3, 150, 1200, profile)!;
    const warmScore = computeClimateScore(25, 150, 1200, profile)!;
    expect(coldScore).toBeGreaterThan(warmScore);
    expect(coldScore - warmScore).toBeGreaterThan(40);
  });

  it('applies winter penalty to Chicago under green_rainy profile', () => {
    // Chicago: avgTemp 10°C, winterTemp -6°C
    // Base: 100 - |10-12|*3 = 94, rain 125 < 220 → no penalty, sun 2508 > 1200 → no penalty
    // Winter: threshold 3, deficit = 3-(-6) = 9, penalty = 9*3 = 27 → score 67
    const profile = CLIMATE_PROFILES.green_rainy;
    const score = computeClimateScore(10, 125, 2508, profile, -6)!;
    expect(score).toBe(67);
    expect(score).toBeLessThan(80);
  });

  it('does not apply winter penalty when winterTemp is above threshold (green_rainy, Lisbon)', () => {
    const profile = CLIMATE_PROFILES.green_rainy;
    const withWinter = computeClimateScore(17, 115, 2806, profile, 11)!;
    const withoutWinter = computeClimateScore(17, 115, 2806, profile)!;
    expect(withWinter).toBe(withoutWinter);
  });

  it('does not apply winter penalty for freezing_cold profile', () => {
    const profile = CLIMATE_PROFILES.freezing_cold;
    const withWinter = computeClimateScore(3, 150, 1200, profile, -20)!;
    const withoutWinter = computeClimateScore(3, 150, 1200, profile)!;
    expect(withWinter).toBe(withoutWinter);
  });

  it('does not apply winter penalty for no_preference profile', () => {
    const profile = CLIMATE_PROFILES.no_preference;
    const withWinter = computeClimateScore(10, 100, 1500, profile, -10)!;
    const withoutWinter = computeClimateScore(10, 100, 1500, profile)!;
    expect(withWinter).toBe(withoutWinter);
  });

  it('clamps winter-penalised score to 0', () => {
    // avgTemp=5 under sunny_warm: base = 100 - |5-22|*3 = 49
    // winterTemp=-20, threshold 12, deficit=32, penalty=32*2=64 → 49-64=-15 → clamped to 0
    const profile = CLIMATE_PROFILES.sunny_warm;
    const score = computeClimateScore(5, 60, 2800, profile, -20)!;
    expect(score).toBe(0);
  });

  it('scores high for desert_dry profile with arid climate', () => {
    const profile = CLIMATE_PROFILES.desert_dry;
    const score = computeClimateScore(30, 14, 3500, profile);
    expect(score).toBe(100);
  });

  it('penalises rain under desert_dry profile', () => {
    const profile = CLIMATE_PROFILES.desert_dry;
    const dryScore = computeClimateScore(30, 14, 3500, profile)!;
    const wetScore = computeClimateScore(30, 150, 3500, profile)!;
    expect(dryScore).toBeGreaterThan(wetScore);
    expect(dryScore - wetScore).toBe(20);
  });

  it('scores high for tropical_heat profile with tropical climate', () => {
    const profile = CLIMATE_PROFILES.tropical_heat;
    const score = computeClimateScore(27, 167, 2020, profile);
    expect(score).toBe(100);
  });

  it('scores high for four_seasons profile with continental climate', () => {
    const profile = CLIMATE_PROFILES.four_seasons;
    const score = computeClimateScore(11, 130, 1800, profile);
    expect(score).toBe(100);
  });

  it('mild_scenic rewards dry-summer mild climates', () => {
    const profile = CLIMATE_PROFILES.mild_scenic;
    const score = computeClimateScore(15, 100, 2200, profile);
    expect(score).toBe(100);
  });

  it('green_rainy tolerates high rain and low sunshine', () => {
    const profile = CLIMATE_PROFILES.green_rainy;
    const score = computeClimateScore(12, 200, 1400, profile);
    expect(score).toBe(100);
  });
});

describe('applyClimatePreference', () => {
  it('returns countries unchanged for no_preference', () => {
    const countries = [makeCountry({
      scores: { climate: 50 },
    })];
    const result = applyClimatePreference(countries, 'no_preference');
    expect(result).toBe(countries);
  });

  it('recomputes climate scores based on profile', () => {
    const country = makeCountry({ scores: { climate: 50 } });
    country.dimensionScores.climate!.components = {
      avg_temp: 5, rain_days: 150, sunshine_hours: 1200,
    };
    const warmResult = applyClimatePreference([country], 'sunny_warm');
    const coldResult = applyClimatePreference([country], 'freezing_cold');
    expect(coldResult[0].dimensionScores.climate!.score)
      .toBeGreaterThan(warmResult[0].dimensionScores.climate!.score!);
  });
});

describe('normalisation functions', () => {
  it('minMaxNormalise: standard case', () => {
    expect(minMaxNormalise(50, 0, 100)).toBe(50);
    expect(minMaxNormalise(0, 0, 100)).toBe(0);
    expect(minMaxNormalise(100, 0, 100)).toBe(100);
  });

  it('minMaxNormalise: inverted', () => {
    expect(minMaxNormalise(0, 0, 100, true)).toBe(100);
    expect(minMaxNormalise(100, 0, 100, true)).toBe(0);
  });

  it('minMaxNormalise: null input', () => {
    expect(minMaxNormalise(null, 0, 100)).toBeNull();
    expect(minMaxNormalise(undefined, 0, 100)).toBeNull();
  });

  it('minMaxNormalise: clamps values outside range', () => {
    expect(minMaxNormalise(150, 0, 100)).toBe(100);
    expect(minMaxNormalise(-50, 0, 100)).toBe(0);
  });

  it('rankToScore: best rank = 100, worst = 0', () => {
    expect(rankToScore(1, 53)).toBeCloseTo(100, 1);
    expect(rankToScore(53, 53)).toBeCloseTo(0, 1);
  });

  it('rankToScore: null input', () => {
    expect(rankToScore(null, 53)).toBeNull();
  });

  it('pisaAcademicNormalise: average then scale', () => {
    const result = pisaAcademicNormalise(500, 500, 500);
    expect(result).toBeCloseTo(66.67, 1);
  });

  it('pisaAcademicNormalise: handles partial nulls', () => {
    const result = pisaAcademicNormalise(600, null, null);
    expect(result).toBe(100);
  });

  it('pisaAcademicNormalise: all null returns null', () => {
    expect(pisaAcademicNormalise(null, null, null)).toBeNull();
  });

  it('gpiNormalise: most peaceful = 100', () => {
    const result = gpiNormalise(1.00);
    expect(result).toBeCloseTo(100, 0);
  });

  it('gpiNormalise: least peaceful = 0', () => {
    const result = gpiNormalise(3.50);
    expect(result).toBeCloseTo(0, 0);
  });

  it('pewNormalise: 0 = full freedom (100)', () => {
    expect(pewNormalise(0)).toBe(100);
  });

  it('pewNormalise: 10 = no freedom (0)', () => {
    expect(pewNormalise(10)).toBe(0);
  });
});
