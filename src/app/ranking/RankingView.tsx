'use client';

import { useState } from 'react';
import type { CountryScores } from '@/lib/types';
import { useWeightStore } from '@/stores/useWeightStore';
import { CountryList } from '@/components/ranking/CountryList';
import { WeightSliders } from '@/components/ranking/WeightSliders';
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
  const { weights, setWeight, resetToDefaults } = useWeightStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-80 lg:shrink-0 lg:border-r lg:border-zinc-200">
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <WeightSliders
            weights={weights}
            onWeightChange={setWeight}
            onReset={resetToDefaults}
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
          <CountryList countries={countries} weights={weights} />
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
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
