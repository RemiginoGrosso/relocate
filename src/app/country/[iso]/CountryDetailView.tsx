'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import type { CountryDetail } from '@/lib/types';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { CountryRadarChart } from '@/components/country/CountryRadarChart';
import { DimensionBreakdown } from '@/components/country/DimensionBreakdown';
import { DataFreshness } from '@/components/country/DataFreshness';
import { useWeightStore } from '@/stores/useWeightStore';
import { applyClimatePreference, computeComposite, normaliseWeights } from '@/lib/scoring';

interface CountryDetailViewProps {
  detail: CountryDetail;
}

export function CountryDetailView({ detail }: CountryDetailViewProps) {
  const { country, rawIndices, climate } = detail;
  const { weights, climateType } = useWeightStore();

  const adjustedCountry = useMemo(
    () => applyClimatePreference([country], climateType)[0],
    [country, climateType],
  );

  const normWeights = normaliseWeights(weights);
  const { score } = computeComposite(adjustedCountry, normWeights);

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
            {country.region} · {country.capitalCity}
          </p>
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
