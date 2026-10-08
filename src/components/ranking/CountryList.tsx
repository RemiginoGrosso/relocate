'use client';

import { useRef, useMemo, useState } from 'react';
import type { ClimatePreference, CountryScores, DimensionKey, IncomeType, RankedCountry, UserWeights } from '@/lib/types';
import { applyClimatePreference, applyIncomeType, findShortlistLever, rankCountries } from '@/lib/scoring';
import { DIMENSIONS, REGION_FILTER_GROUPS, SHORTLIST_SIZE } from '@/lib/constants';
import { useCompareStore } from '@/stores/useCompareStore';
import { CountryRow } from './CountryRow';
import { RegionFilter } from './RegionFilter';

interface CountryListProps {
  countries: CountryScores[];
  weights: UserWeights;
  climateType: ClimatePreference;
  incomeType: IncomeType;
  selectedCities: Record<string, string>;
  rankedBy: DimensionKey | 'overall';
  onCityChange: (iso: string, city: string) => void;
}

export function CountryList({ countries, weights, climateType, incomeType, selectedCities, rankedBy, onCityChange }: CountryListProps) {
  const [regionGroup, setRegionGroup] = useState('All');
  const { compareIsos, toggleCompare, canAddMore } = useCompareStore();
  const unrankedRef = useRef<HTMLDivElement>(null);

  const adjusted = useMemo(
    () => applyIncomeType(applyClimatePreference(countries, climateType, selectedCities), incomeType),
    [countries, climateType, selectedCities, incomeType],
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
        coverageRatio: 1,
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
    if (singleDimension) {
      const rc: RankedCountry[] = [];
      const uc: RankedCountry[] = [];
      for (const c of filtered) {
        const dimScore = c.dimensionScores[singleDimension];
        const isUnranked = dimScore?.score == null || dimScore.confidence !== 'high';
        if (isUnranked) {
          uc.push(c);
        } else {
          rc.push({ ...c, rank: rc.length + 1 });
        }
      }
      return { rankedCountries: rc, unrankedCountries: uc };
    }
    const rc: RankedCountry[] = [];
    const uc: RankedCountry[] = [];
    for (const c of filtered) {
      if (c.hasLimitedData) {
        uc.push(c);
      } else {
        rc.push(c);
      }
    }
    return { rankedCountries: rc, unrankedCountries: uc };
  }, [filtered, singleDimension]);

  const lever = useMemo(
    () => (rankedBy === 'overall' ? findShortlistLever(adjusted, weights) : null),
    [adjusted, weights, rankedBy],
  );

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
      {rankedBy === 'overall' && (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          {lever ? (
            <>
              What would change your top {SHORTLIST_SIZE}: setting{' '}
              <span className="font-medium text-zinc-900">
                {DIMENSIONS.find((d) => d.key === lever.dimension)?.name ?? lever.dimension}
              </span>{' '}
              to {lever.to} brings in {joinNames(lever.entering.map((c) => c.name))}
              {lever.leaving.length > 0 && <>, replacing {joinNames(lever.leaving.map((c) => c.name))}</>}.
            </>
          ) : (
            <>No single slider change alters your top {SHORTLIST_SIZE}.</>
          )}
        </p>
      )}
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
              {unrankedCountries.length} {singleDimension ? 'not ranked' : 'limited data'}
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
          <p className="text-sm font-medium text-zinc-500">
            {singleDimension ? `Not ranked for ${dimensionName}` : 'Limited data'}
          </p>
          <p className="mb-3 text-xs text-zinc-400">
            {singleDimension
              ? "These countries don’t have enough comparable data for this dimension."
              : "These countries are missing too many of the dimensions you care about to rank fairly. Scores shown are based on available data only."}
          </p>
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

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
