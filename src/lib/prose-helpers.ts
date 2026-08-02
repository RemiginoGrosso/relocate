import type { CountryScores, DimensionKey, RawIndex } from './types';
import { DIMENSIONS, INDICATOR_INTERPRETATIONS, MIN_COVERAGE_RATIO } from './constants';
import { computeComposite, normaliseWeights } from './scoring';
import { DEFAULT_WEIGHTS } from './constants';

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function interpret(indicatorKey: string, value: number | null): string | null {
  if (value === null) return null;
  const interp = INDICATOR_INTERPRETATIONS[indicatorKey];
  if (!interp) return null;
  const range = interp.ranges.find((r) => value <= r.max);
  return range?.label ?? null;
}

export function findRaw(rawIndices: RawIndex[], key: string): RawIndex | undefined {
  return rawIndices.find((r) => `${r.source}.${r.indicator}` === key);
}

export function compositeRank(
  countryIso: string,
  allCountries: CountryScores[],
): { rank: number; total: number; score: number; limitedData: boolean } {
  const normW = normaliseWeights(DEFAULT_WEIGHTS);
  const withScores = allCountries.map((c) => {
    const { score, coverageRatio } = computeComposite(c, normW);
    return { iso: c.iso, score, limitedData: coverageRatio < MIN_COVERAGE_RATIO };
  });

  const target = withScores.find((c) => c.iso === countryIso);
  if (!target) return { rank: 0, total: 0, score: 0, limitedData: true };

  if (target.limitedData) {
    return { rank: 0, total: 0, score: target.score, limitedData: true };
  }

  const main = withScores.filter((c) => !c.limitedData).sort((a, b) => b.score - a.score);
  const idx = main.findIndex((c) => c.iso === countryIso);
  return { rank: idx + 1, total: main.length, score: target.score, limitedData: false };
}

export function dimRank(
  countryIso: string,
  dimKey: DimensionKey,
  allCountries: CountryScores[],
): { rank: number; total: number } | null {
  const scored = allCountries
    .filter((c) => c.dimensionScores[dimKey]?.score != null)
    .sort((a, b) => (b.dimensionScores[dimKey]!.score!) - (a.dimensionScores[dimKey]!.score!));
  const idx = scored.findIndex((c) => c.iso === countryIso);
  if (idx === -1) return null;
  return { rank: idx + 1, total: scored.length };
}

export function dimensionName(key: string): string {
  return DIMENSIONS.find((d) => d.key === key)?.name ?? key.replace(/_/g, ' ');
}
