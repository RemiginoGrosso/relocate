import { minMaxNormalise } from './normalisation';
import type { Confidence } from './types';

// Pure per-dimension formulas shared by scripts/compute-normalised.ts and tests.
// Formulas are specified in KNOWLEDGE/02_Reference/SCORING_ENGINE.md (Iteration 29).

export interface FormulaResult {
  score: number | null;
  confidence: Confidence;
  components: Record<string, number | null>;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

function logNormalise(value: number, min: number, max: number): number {
  const clamped = Math.min(Math.max(value, min), max);
  return round2(((Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 100);
}

/** Homicides per 100k → 0-100, log scale. 0.3 or lower = 100, 40 or higher = 0. */
export function homicideNormalise(rate: number): number {
  const clamped = Math.min(Math.max(rate, 0.3), 40);
  return round2(((Math.log10(40) - Math.log10(clamped)) / (Math.log10(40) - Math.log10(0.3))) * 100);
}

/** GDP per capita PPP (current intl $) → 0-100, log scale over 8,000–160,000. */
export function localIncomeNormalise(gdpPcPpp: number): number {
  return logNormalise(gdpPcPpp, 8000, 160000);
}

/**
 * Purchasing power.
 * Stored score = cost_affordability (how far income earned abroad goes: inverted price level ratio).
 * local_income is kept as a component; the client swaps it in for users with a local job.
 */
export function computePurchasingPower(gdpPcPpp: number | null, priceLevel: number | null): FormulaResult | null {
  if (gdpPcPpp == null && priceLevel == null) return null;
  const costAffordability = priceLevel != null ? round2(minMaxNormalise(priceLevel, 0.10, 1.50, true)!) : null;
  const localIncome = gdpPcPpp != null ? localIncomeNormalise(gdpPcPpp) : null;
  return {
    score: costAffordability,
    // Confidence describes the stored score (cost affordability). The client re-derives it for local income.
    confidence: costAffordability != null ? 'high' : 'no_data',
    components: { cost_affordability: costAffordability, local_income: localIncome },
  };
}

/** Safety: UNODC homicide rate × 0.50 + Numbeo street crime (inverted) × 0.50. One source alone → medium. */
export function computeSafety(homicideRate: number | null, numbeoCrime: number | null): FormulaResult | null {
  const homicide = homicideRate != null ? homicideNormalise(homicideRate) : null;
  const streetCrime = numbeoCrime != null ? round2(100 - numbeoCrime) : null;
  if (homicide == null && streetCrime == null) return null;
  const score =
    homicide != null && streetCrime != null ? round2(homicide * 0.5 + streetCrime * 0.5) : (homicide ?? streetCrime);
  return {
    score,
    confidence: homicide != null && streetCrime != null ? 'high' : 'medium',
    components: { homicide, street_crime: streetCrime },
  };
}

/** Rule of Law: WGI Rule of Law × 0.55 + WGI Control of Corruption × 0.45. Both required. */
export function computeRuleOfLaw(wgiRol: number | null, wgiCc: number | null): FormulaResult | null {
  if (wgiRol == null || wgiCc == null) return null;
  return {
    score: round2(wgiRol * 0.55 + wgiCc * 0.45),
    confidence: 'high',
    components: { wgi_rule_of_law: wgiRol, wgi_corruption: wgiCc },
  };
}
