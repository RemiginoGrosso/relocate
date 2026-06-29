'use client';

import { useMemo, useState } from 'react';
import type { ClimatePreference, CountryScores, RankedCountry, UserWeights } from '@/lib/types';
import { applyClimatePreference, rankCountries } from '@/lib/scoring';
import { REGION_FILTER_GROUPS } from '@/lib/constants';
import { CountryRow } from './CountryRow';
import { RegionFilter } from './RegionFilter';

interface CountryListProps {
  countries: CountryScores[];
  weights: UserWeights;
  climateType: ClimatePreference;
}

export function CountryList({ countries, weights, climateType }: CountryListProps) {
  const [regionGroup, setRegionGroup] = useState('All');

  const adjusted = useMemo(
    () => applyClimatePreference(countries, climateType),
    [countries, climateType],
  );

  const ranked: RankedCountry[] = useMemo(
    () => rankCountries(adjusted, weights),
    [adjusted, weights],
  );

  const filtered = useMemo(() => {
    if (regionGroup === 'All') return ranked;
    const group = REGION_FILTER_GROUPS.find((g) => g.label === regionGroup);
    if (!group) return ranked;
    return ranked.filter((c) => group.regions.includes(c.region));
  }, [ranked, regionGroup]);

  const allZero = Object.values(weights).every((w) => w === 0);

  if (allZero) {
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
          <CountryRow key={country.id} country={country} weights={weights} />
        ))}
      </div>
    </div>
  );
}
