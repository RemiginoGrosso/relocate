'use client';

import { useRef, useMemo, useState } from 'react';
import type { ClimatePreference, CountryScores, DimensionKey, RankedCountry, UserWeights } from '@/lib/types';
import { applyClimatePreference, rankCountries } from '@/lib/scoring';
import { DIMENSIONS, REGION_FILTER_GROUPS } from '@/lib/constants';
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
  const unrankedRef = useRef<HTMLDivElement>(null);

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
    return sorted.map((country, i): RankedCountry => {
      const dimScore = country.dimensionScores[rankedBy];
      return {
        ...country,
        compositeScore: dimScore?.score ?? 0,
        rank: i + 1,
        nullDimensions: dimScore?.score == null ? [rankedBy] : [],
        hasLimitedData: false,
      };
    });
  }, [adjusted, weights, rankedBy]);

  const filtered = useMemo(() => {
    if (regionGroup === 'All') return ranked;
    const group = REGION_FILTER_GROUPS.find((g) => g.label === regionGroup);
    if (!group) return ranked;
    return ranked.filter((c) => group.regions.includes(c.region));
  }, [ranked, regionGroup]);

  const singleDimension = rankedBy !== 'overall' ? rankedBy : undefined;

  const { rankedCountries, unrankedCountries } = useMemo(() => {
    if (!singleDimension) return { rankedCountries: filtered, unrankedCountries: [] as RankedCountry[] };
    const rc: RankedCountry[] = [];
    const uc: RankedCountry[] = [];
    for (const c of filtered) {
      const dimScore = c.dimensionScores[singleDimension];
      const isUnranked = dimScore?.score == null || dimScore.confidence === 'medium';
      if (isUnranked) {
        uc.push(c);
      } else {
        rc.push({ ...c, rank: rc.length + 1 });
      }
    }
    return { rankedCountries: rc, unrankedCountries: uc };
  }, [filtered, singleDimension]);

  const allZero = Object.values(weights).every((w) => w === 0);

  if (allZero && rankedBy === 'overall') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-zinc-500">Set at least one priority.</p>
      </div>
    );
  }

  const dimensionName = singleDimension
    ? DIMENSIONS.find((d) => d.key === singleDimension)?.name ?? singleDimension
    : '';

  return (
    <div className="flex flex-col gap-4">
      <RegionFilter activeGroup={regionGroup} onChange={setRegionGroup} />
      <p className="text-xs text-zinc-400">
        {rankedCountries.length} {rankedCountries.length === 1 ? 'country' : 'countries'} ranked
        {unrankedCountries.length > 0 && (
          <>
            {' · '}
            <button
              type="button"
              className="text-teal-700 underline underline-offset-2 hover:text-teal-800"
              onClick={() => unrankedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {unrankedCountries.length} not ranked
            </button>
          </>
        )}
      </p>
      <div className="flex flex-col gap-3">
        {rankedCountries.map((country) => (
          <CountryRow
            key={country.id}
            country={country}
            weights={weights}
            singleDimension={singleDimension}
            selectedCity={selectedCities[country.iso.toUpperCase()]}
            onCityChange={onCityChange}
            isComparing={compareIsos.includes(country.iso.toUpperCase())}
            onToggleCompare={toggleCompare}
            canAddMore={canAddMore()}
          />
        ))}
      </div>
      {unrankedCountries.length > 0 && (
        <div ref={unrankedRef} className="mt-2 scroll-mt-4 border-t border-zinc-200 pt-4">
          <p className="text-sm font-medium text-zinc-500">Not ranked for {dimensionName}</p>
          <p className="mb-3 text-xs text-zinc-400">These countries don&apos;t have enough comparable data for this dimension.</p>
          <div className="flex flex-col gap-3">
            {unrankedCountries.map((country) => (
              <CountryRow
                key={country.id}
                country={country}
                weights={weights}
                singleDimension={singleDimension}
                selectedCity={selectedCities[country.iso.toUpperCase()]}
                onCityChange={onCityChange}
                isComparing={compareIsos.includes(country.iso.toUpperCase())}
                onToggleCompare={toggleCompare}
                canAddMore={canAddMore()}
                unranked
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
