'use client';

import { useEffect, useState } from 'react';
import type { CountryScores, DimensionKey } from '@/lib/types';
import { DIMENSIONS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import { useWeightStore, hydrateWeightStore } from '@/stores/useWeightStore';
import { CountryList } from '@/components/ranking/CountryList';
import { WeightSliders } from '@/components/ranking/WeightSliders';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface RankingViewProps {
  countries: CountryScores[];
}

export function RankingView({ countries }: RankingViewProps) {
  const { weights, setWeight, resetToDefaults, climateType, setClimateType, selectedCities, setSelectedCity } = useWeightStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rankedBy, setRankedBy] = useState<DimensionKey | 'overall'>('overall');

  useEffect(() => {
    hydrateWeightStore();
  }, []);

  function handleRankedByChange(value: DimensionKey | 'overall' | null) {
    if (value === null) return;
    setRankedBy(value);
    trackEvent('dimension_sort', { dimension: value });
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
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

      {/* Main content */}
      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-3xl font-medium tracking-tight text-zinc-900">
              Country ranking
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Adjust your priorities to see how countries rank for you.
            </p>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-zinc-500">Ranked by</span>
            <Select value={rankedBy} onValueChange={handleRankedByChange}>
              <SelectTrigger className="w-52 border-zinc-200 bg-white text-sm text-zinc-900">
                <span className="flex flex-1 text-left">
                  {rankedBy === 'overall'
                    ? 'Overall score'
                    : DIMENSIONS.find((d) => d.key === rankedBy)?.name}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall score</SelectItem>
                {DIMENSIONS.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CountryList
            countries={countries}
            weights={weights}
            climateType={climateType}
            selectedCities={selectedCities}
            rankedBy={rankedBy}
            onCityChange={setSelectedCity}
          />
        </div>
      </main>

      {/* Mobile bottom bar + drawer */}
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
