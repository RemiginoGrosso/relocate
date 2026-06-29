import Link from 'next/link';
import type { RankedCountry, UserWeights } from '@/lib/types';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { DimensionBars } from './DimensionBars';

interface CountryRowProps {
  country: RankedCountry;
  weights: UserWeights;
}

export function CountryRow({ country, weights }: CountryRowProps) {
  return (
    <Link
      href={`/country/${country.iso.toLowerCase()}`}
      className="block rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 tabular-nums w-5">
            {country.rank}
          </span>
          <span className="text-2xl" aria-hidden>
            {country.flagEmoji}
          </span>
          <div>
            <h3 className="text-lg font-medium text-zinc-900">
              {country.name}
            </h3>
            <p className="text-xs text-zinc-500">{country.region}</p>
          </div>
        </div>
        <ScoreBadge score={country.compositeScore} />
      </div>
      <div className="mt-3">
        <DimensionBars
          dimensionScores={country.dimensionScores}
          weights={weights}
        />
      </div>
      {country.hasLimitedData && (
        <p className="mt-2 text-xs text-amber-700">Limited data available</p>
      )}
    </Link>
  );
}
