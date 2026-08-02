import type { CountryScores, Region } from './types';

export interface ComparisonPair {
  slug: string;
  isoA: string;
  isoB: string;
}

export function slugifyCountryName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateComparisonPairs(countries: CountryScores[]): ComparisonPair[] {
  const byRegion = new Map<Region, CountryScores[]>();
  for (const c of countries) {
    const list = byRegion.get(c.region) ?? [];
    list.push(c);
    byRegion.set(c.region, list);
  }

  const pairs: ComparisonPair[] = [];
  for (const regionCountries of byRegion.values()) {
    const sorted = [...regionCountries].sort((a, b) => a.name.localeCompare(b.name));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        pairs.push({
          slug: `${slugifyCountryName(a.name)}-vs-${slugifyCountryName(b.name)}`,
          isoA: a.iso,
          isoB: b.iso,
        });
      }
    }
  }

  return pairs;
}

export function findComparisonPair(
  slug: string,
  countries: CountryScores[],
): { a: CountryScores; b: CountryScores } | null {
  const pairs = generateComparisonPairs(countries);
  const match = pairs.find((p) => p.slug === slug);
  if (!match) return null;

  const a = countries.find((c) => c.iso === match.isoA);
  const b = countries.find((c) => c.iso === match.isoB);
  if (!a || !b) return null;

  return { a, b };
}
