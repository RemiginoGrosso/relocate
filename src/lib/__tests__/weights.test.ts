import { describe, it, expect } from 'vitest';
import { computeOnboardingWeights } from '../weights';
import { DEFAULT_WEIGHTS } from '../constants';

describe('computeOnboardingWeights', () => {
  it('returns defaults when no answers provided', () => {
    const weights = computeOnboardingWeights({});
    expect(weights).toEqual(DEFAULT_WEIGHTS);
  });

  it('sets school_culture to 0 for solo households', () => {
    const weights = computeOnboardingWeights({ household: 'solo' });
    expect(weights.school_culture).toBe(0);
  });

  it('sets school_culture to 0 for couples', () => {
    const weights = computeOnboardingWeights({ household: 'couple' });
    expect(weights.school_culture).toBe(0);
  });

  it('boosts school_culture and healthcare for young families', () => {
    const weights = computeOnboardingWeights({ household: 'family_young' });
    expect(weights.school_culture).toBe(DEFAULT_WEIGHTS.school_culture + 40);
    expect(weights.healthcare).toBe(DEFAULT_WEIGHTS.healthcare + 15);
  });

  it('boosts healthcare, climate, safety for retiring', () => {
    const weights = computeOnboardingWeights({ household: 'retiring' });
    expect(weights.healthcare).toBe(DEFAULT_WEIGHTS.healthcare + 25);
    expect(weights.climate).toBe(DEFAULT_WEIGHTS.climate + 20);
    expect(weights.safety).toBe(DEFAULT_WEIGHTS.safety + 15);
  });

  it('boosts purchasing_power for remote workers', () => {
    const weights = computeOnboardingWeights({ income: 'remote' });
    expect(weights.purchasing_power).toBe(DEFAULT_WEIGHTS.purchasing_power + 25);
  });

  it('boosts purchasing_power and english for local job seekers', () => {
    const weights = computeOnboardingWeights({ income: 'local_job' });
    expect(weights.purchasing_power).toBe(DEFAULT_WEIGHTS.purchasing_power + 15);
    expect(weights.english_proficiency).toBe(DEFAULT_WEIGHTS.english_proficiency + 20);
  });

  it('boosts civic_culture for top priority', () => {
    const weights = computeOnboardingWeights({ civicImportance: 'top_priority' });
    expect(weights.civic_culture).toBe(DEFAULT_WEIGHTS.civic_culture + 40);
  });

  it('boosts warmth for essential', () => {
    const weights = computeOnboardingWeights({ warmthImportance: 'essential' });
    expect(weights.warmth).toBe(DEFAULT_WEIGHTS.warmth + 35);
  });

  it('boosts religious_freedom when important', () => {
    const weights = computeOnboardingWeights({ religiousNeeds: 'important' });
    expect(weights.religious_freedom).toBe(DEFAULT_WEIGHTS.religious_freedom + 25);
  });

  it('stacks adjustments across all questions', () => {
    const weights = computeOnboardingWeights({
      household: 'family_young',
      income: 'remote',
      civicImportance: 'top_priority',
      warmthImportance: 'essential',
      climatePreference: 'warm_sunny',
      religiousNeeds: 'important',
    });
    expect(weights.school_culture).toBe(50);
    expect(weights.healthcare).toBe(30);
    expect(weights.purchasing_power).toBe(50);
    expect(weights.civic_culture).toBe(65);
    expect(weights.warmth).toBe(55);
    expect(weights.climate).toBe(30);
    expect(weights.religious_freedom).toBe(30);
  });
});
