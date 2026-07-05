'use client';

import { useMemo, useState } from 'react';
import type { ClimatePreference, CountryScores, DimensionKey, RankedCountry, UserWeights } from '@/lib/types';
import { applyClimatePreference, rankCountries } from '@/lib/scoring';
import { REGION_FILTER_GROUPS } from '@/lib/constants';
import { useCompareStore } from '@/stores/useCompareStore';
import { CountryRow } from './CountryRow';
import { RegionFilter } from './RegionFilter';

interface CountryListProps {
  countries: CountryScores[];
  weights: UserWeights;
  climateType: ClimatePreference;
  selectedCities: Record<string, string>;
  rankedBy: DimensionKey | 'overall';
  onCityChange: (iso: string, city: string) => void;
}

export function CountryList({ countries, weights, climateType, selectedCities, rankedBy, onCityChange }: CountryListProps) {
  const [regionGroup, setRegionGroup] = useState('All');
  const { compareIsos, toggleCompare, canAddMore } = useCompareStore();

  const adjusted = useMemo(
    () => applyClimatePreference(countries, climateType, selectedCities),
    [countries, climateType, selectedCities],
  );

  const ranked: RankedCountry[] = useMemo(() => {
    if (rankedBy === 'overall') {
      return rankCountries(adjusted, weights);
    }
    // Sort by the selected dimension score; nulls go to the bottom
    const sorted = [...adjusted].sort((a, b) => {
      const scoreA = a.dimensionScores[rankedBy]?.score ?? null;
      const scoreB = b.dimensionScores[rankedBy]?.score ?? null;
      if (scoreA === null && scoreB === null) return 0;
      if (scoreA === null) return 1;
      if (scoreB === null) return -1;
      return scoreB - scoreA;
    });
    return sorted.map((country, i): RankedCountry => ({
      ...country,
      compositeScore: country.dimensionScores[rankedBy]?.score ?? 0,
      rank: i + 1,
      nullDimensions: [],
      hasLimitedData: false,
    }));
  }, [adjusted, weights, rankedBy]);

  const filtered = useMemo(() => {
    if (regionGroup === 'All') return ranked;
    const group = REGION_FILTER_GROUPS.find((g) => g.label === regionGroup);
    if (!group) return ranked;
    return ranked.filter((c) => group.regions.includes(c.region));
  }, [ranked, regionGroup]);

  const allZero = Object.values(weights).every((w) => w === 0);

  if (allZero && rankedBy === 'overall') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-zinc-500">Set at least one priority.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <RegionFilter activeGroup={regionGroup} onChange={setRegionGroup} />
      <p className="text-xs text-zinc-400">
        {filtered.length} {filtered.length === 1 ? 'country' : 'countries'}
      </p>
      <div className="flex flex-col gap-3">
        {filtered.map((country) => (
          <CountryRow
            key={country.id}
            country={country}
            weights={weights}
            singleDimension={rankedBy !== 'overall' ? rankedBy : undefined}
            selectedCity={selectedCities[country.iso.toUpperCase()]}
            onCityChange={onCityChange}
            isComparing={compareIsos.includes(country.iso.toUpperCase())}
            onToggleCompare={toggleCompare}
            canAddMore={canAddMore()}
          />
        ))}
      </div>
    </div>
  );
}
