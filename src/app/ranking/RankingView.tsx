'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import type { CountryScores, DimensionKey } from '@/lib/types';
import { DIMENSIONS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import { useWeightStore, hydrateWeightStore } from '@/stores/useWeightStore';
import { CountryList } from '@/components/ranking/CountryList';
import { CompareBar } from '@/components/ranking/CompareBar';
import { WeightSliders } from '@/components/ranking/WeightSliders';
import { useCompareStore } from '@/stores/useCompareStore';
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
  const compareCount = useCompareStore((s) => s.compareIsos.length);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rankedBy, setRankedBy] = useState<DimensionKey | 'overall'>('overall');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    hydrateWeightStore();
  }, []);

  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  function handleRankedByChange(value: DimensionKey | 'overall' | null) {
    if (value === null) return;
    setRankedBy(value);
    trackEvent('dimension_sort', { dimension: value });
  }

  return (
    <div className="flex min-h-dvh">
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
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
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

      {/* Compare bar */}
      <CompareBar countries={countries} />

      {/* Mobile bottom bar + drawer */}
      <div className={`fixed left-0 right-0 z-30 lg:hidden ${compareCount > 0 ? 'bottom-[52px]' : 'bottom-0'}`}>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="w-full border-t border-zinc-200 bg-white px-4 py-3">
              <span className="mx-auto block w-full max-w-3xl rounded-md bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800">
                Adjust priorities
              </span>
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

      {/* Back to top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-opacity hover:text-teal-700 lg:bottom-8"
          aria-label="Back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
