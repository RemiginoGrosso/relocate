'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useWeightStore, hydrateWeightStore } from '@/stores/useWeightStore';
import { useCompareStore } from '@/stores/useCompareStore';
import { CompareRadarChart } from '@/components/compare/CompareRadarChart';
import { CompareTable } from '@/components/compare/CompareTable';
import { WeightSliders } from '@/components/ranking/WeightSliders';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import type { CountryScores } from '@/lib/types';
import { applyClimatePreference } from '@/lib/scoring';
import { isLargeCountry, getCitiesForCountry, getDefaultCity } from '@/lib/large-countries';
import { trackEvent } from '@/lib/analytics';

interface CompareViewProps {
  allCountries: CountryScores[];
}

export function CompareView({ allCountries }: CompareViewProps) {
  const searchParams = useSearchParams();
  const { weights, setWeight, resetToDefaults, climateType, setClimateType, selectedCities, setSelectedCity } = useWeightStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    hydrateWeightStore();
  }, []);

  const isoParam = searchParams.get('countries') ?? '';
  const isos = isoParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);

  const adjusted = useMemo(
    () => applyClimatePreference(allCountries, climateType, selectedCities),
    [allCountries, climateType, selectedCities],
  );

  const countries = useMemo(
    () =>
      isos
        .map((iso) => adjusted.find((c) => c.iso.toUpperCase() === iso))
        .filter(Boolean) as CountryScores[],
    [isos, adjusted],
  );

  useEffect(() => {
    const store = useCompareStore.getState();
    if (store.compareIsos.length === 0 && isos.length > 0) {
      isos.forEach((iso) => store.toggleCompare(iso));
    }
  }, [isos]);

  useEffect(() => {
    if (countries.length >= 2) {
      trackEvent('comparison_started', {
        countries: countries.map((c) => c.iso).join(','),
        count: countries.length,
      });
    }
  // Fire once on mount with resolved countries
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries.length]);

  if (countries.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-zinc-500">
          Select at least 2 countries to compare.
        </p>
        <Link
          href="/ranking"
          className="mt-4 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          Back to ranking
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:block lg:w-80 lg:shrink-0 lg:border-r lg:border-zinc-200">
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <WeightSliders
            weights={weights}
            onWeightChange={setWeight}
            onReset={resetToDefaults}
            climateType={climateType}
            onClimateTypeChange={setClimateType}
          />
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/ranking"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
          >
            <ArrowLeft size={14} />
            Back to ranking
          </Link>

          <h1 className="text-2xl font-medium tracking-tight text-zinc-900">
            Compare countries
          </h1>

          <div className="mt-2 flex flex-wrap items-start gap-4">
            {countries.map((c) => {
              const iso = c.iso.toUpperCase();
              const large = isLargeCountry(iso);
              const cities = large ? getCitiesForCountry(iso) : null;
              const currentCity = selectedCities[iso] ?? getDefaultCity(iso) ?? undefined;
              return (
                <div key={c.iso} className="flex items-center gap-1.5">
                  <span className="text-sm text-zinc-600">
                    {c.flagEmoji} {c.name}
                  </span>
                  {large && cities && (
                    <select
                      value={currentCity}
                      onChange={(e) => setSelectedCity(iso, e.target.value)}
                      className="text-xs text-teal-700 bg-transparent border-none cursor-pointer p-0 focus:outline-none focus:ring-0"
                      aria-label={`Select city for ${c.name}`}
                    >
                      {cities.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <CompareRadarChart countries={countries} />
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <CompareTable countries={countries} weights={weights} />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 lg:hidden">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="w-full border-t border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-teal-700">
              Adjust priorities
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>Your priorities</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-8">
              <WeightSliders
                weights={weights}
                onWeightChange={setWeight}
                onReset={resetToDefaults}
                climateType={climateType}
                onClimateTypeChange={setClimateType}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
