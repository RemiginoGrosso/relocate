'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { CountryDetail } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import { isLargeCountry, getCitiesForCountry, getDefaultCity } from '@/lib/large-countries';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { CountryRadarChart } from '@/components/country/CountryRadarChart';
import { DimensionBreakdown } from '@/components/country/DimensionBreakdown';
import { DataFreshness } from '@/components/country/DataFreshness';
import { useWeightStore, hydrateWeightStore } from '@/stores/useWeightStore';
import { applyClimatePreference, computeComposite, normaliseWeights } from '@/lib/scoring';

interface CountryDetailViewProps {
  detail: CountryDetail;
}

export function CountryDetailView({ detail }: CountryDetailViewProps) {
  const { country, rawIndices, climate } = detail;
  const { weights, climateType, selectedCities, setSelectedCity } = useWeightStore();

  useEffect(() => {
    hydrateWeightStore();
  }, []);

  const adjustedCountry = useMemo(
    () => applyClimatePreference([country], climateType, selectedCities)[0],
    [country, climateType, selectedCities],
  );

  const normWeights = normaliseWeights(weights);
  const { score } = computeComposite(adjustedCountry, normWeights);

  useEffect(() => {
    trackEvent('country_detail_view', { country: country.iso, name: country.name });
  }, [country.iso, country.name]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      <Link
        href="/ranking"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to ranking
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{country.flagEmoji}</span>
        <div className="flex-1">
          <h1 className="text-3xl font-medium tracking-tight text-zinc-900">
            {country.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {country.region}
          </p>
          {isLargeCountry(country.iso) && (() => {
            const cities = getCitiesForCountry(country.iso);
            const currentCity = selectedCities[country.iso.toUpperCase()] ?? getDefaultCity(country.iso) ?? undefined;
            return cities ? (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs text-zinc-400">Climate city:</span>
                <select
                  value={currentCity}
                  onChange={(e) => setSelectedCity(country.iso.toUpperCase(), e.target.value)}
                  className="text-xs text-teal-700 bg-transparent border-none cursor-pointer p-0 focus:outline-none focus:ring-0"
                  aria-label={`Select climate city for ${country.name}`}
                >
                  {cities.map((city) => (
                    <option key={city.name} value={city.name}>{city.name}</option>
                  ))}
                </select>
                <span className="text-xs text-zinc-400">· only affects climate score</span>
              </div>
            ) : null;
          })()}
        </div>
        <ScoreBadge score={score} size="lg" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-medium text-zinc-900">Overview</h2>
          <div className="rounded-lg border border-zinc-200 p-4">
            <CountryRadarChart country={adjustedCountry} />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-medium text-zinc-900">
            Dimension breakdown
          </h2>
          <div className="rounded-lg border border-zinc-200">
            <DimensionBreakdown
              country={adjustedCountry}
              rawIndices={rawIndices}
              climate={climate}
              selectedCity={selectedCities[country.iso.toUpperCase()]}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-zinc-200 p-5">
        <DataFreshness rawIndices={rawIndices} climate={climate} />
      </div>
    </div>
  );
}
