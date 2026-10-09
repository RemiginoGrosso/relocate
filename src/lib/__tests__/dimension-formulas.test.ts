import { describe, it, expect } from 'vitest';
import {
  homicideNormalise,
  localIncomeNormalise,
  computePurchasingPower,
  computeSafety,
  computeRuleOfLaw,
  computeInfrastructure,
} from '../dimension-formulas';

describe('homicideNormalise', () => {
  it('maps the bounds to 100 and 0', () => {
    expect(homicideNormalise(0.3)).toBe(100);
    expect(homicideNormalise(40)).toBe(0);
  });
  it('clamps outside the bounds', () => {
    expect(homicideNormalise(0.07)).toBe(100);
    expect(homicideNormalise(60)).toBe(0);
  });
  it('is log-scaled: US 5.76 sits near 40', () => {
    expect(homicideNormalise(5.76)).toBeCloseTo(39.6, 0);
  });
});

describe('localIncomeNormalise', () => {
  it('maps the bounds to 0 and 100', () => {
    expect(localIncomeNormalise(8000)).toBe(0);
    expect(localIncomeNormalise(160000)).toBe(100);
  });
  it('is log-scaled: geometric midpoint is 50', () => {
    expect(localIncomeNormalise(Math.sqrt(8000 * 160000))).toBeCloseTo(50, 1);
  });
});

describe('computePurchasingPower', () => {
  it('stores cost affordability as the score and keeps local income as a component', () => {
    const r = computePurchasingPower(80450, 1.05)!;
    expect(r.score).toBeCloseTo(32.14, 1);
    expect(r.components.cost_affordability).toBe(r.score);
    expect(r.components.local_income).toBeGreaterThan(70);
    expect(r.confidence).toBe('high');
  });
  it('a cheap country scores higher than an expensive one', () => {
    expect(computePurchasingPower(25243, 0.59)!.score!).toBeGreaterThan(computePurchasingPower(80450, 1.05)!.score!);
  });
  it('returns null score without a price level, but keeps local income', () => {
    const r = computePurchasingPower(50000, null)!;
    expect(r.score).toBeNull();
    expect(r.components.local_income).not.toBeNull();
    expect(r.confidence).toBe('no_data');
  });
  it('returns null when both inputs are missing', () => {
    expect(computePurchasingPower(null, null)).toBeNull();
  });
});

describe('computeSafety', () => {
  it('averages homicide and street crime', () => {
    const r = computeSafety(5.76, 49.2)!;
    expect(r.score).toBeCloseTo(45.2, 0);
    expect(r.confidence).toBe('high');
  });
  it('uses one source alone with medium confidence', () => {
    expect(computeSafety(null, 17.1)).toEqual({
      score: 82.9,
      confidence: 'medium',
      components: { homicide: null, street_crime: 82.9 },
    });
    expect(computeSafety(0.23, null)!.confidence).toBe('medium');
  });
  it('returns null when both are missing', () => {
    expect(computeSafety(null, null)).toBeNull();
  });
});

describe('computeRuleOfLaw', () => {
  it('is WGI only', () => {
    expect(computeRuleOfLaw(91.0, 86.0)!.score).toBeCloseTo(88.75, 2);
  });
  it('requires both WGI indicators', () => {
    expect(computeRuleOfLaw(91.0, null)).toBeNull();
  });
});

describe('computeInfrastructure', () => {
  it('averages logistics and digital halves', () => {
    const r = computeInfrastructure(3.0, 90, 25)!;
    expect(r.components).toEqual({ logistics: 50, digital: 62.5, internet_users: 75, broadband: 50 });
    expect(r.score).toBeCloseTo(56.25, 2);
    expect(r.confidence).toBe('high');
  });
  it('clamps to the fixed bounds', () => {
    expect(computeInfrastructure(5, 100, 80)!.score).toBe(100);
    expect(computeInfrastructure(1, 50, 0)!.score).toBe(0);
  });
  it('scores one half alone at medium confidence', () => {
    const r = computeInfrastructure(null, 80, 10)!;
    expect(r.score).toBeCloseTo(35, 2);
    expect(r.confidence).toBe('medium');
  });
  it('needs both digital indicators for the digital half', () => {
    expect(computeInfrastructure(null, 80, null)).toBeNull();
    expect(computeInfrastructure(3.0, 80, null)!.score).toBe(50);
  });
});
