import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { DimensionKey, RankedCountry, UserWeights } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import { DIMENSIONS } from '@/lib/constants';
import { isLargeCountry, getCitiesForCountry, getDefaultCity } from '@/lib/large-countries';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { DimensionBars } from './DimensionBars';

const dimensionName = (key: DimensionKey): string =>
  DIMENSIONS.find((d) => d.key === key)?.name ?? key;

interface CountryRowProps {
  country: RankedCountry;
  weights: UserWeights;
  singleDimension?: DimensionKey;
  selectedCity?: string;
  onCityChange?: (iso: string, city: string) => void;
}

export function CountryRow({ country, weights, singleDimension, selectedCity, onCityChange }: CountryRowProps) {
  const displayScore = singleDimension
    ? (country.dimensionScores[singleDimension]?.score ?? null)
    : country.compositeScore;

  const missingCount = country.nullDimensions.length;
  const isLarge = isLargeCountry(country.iso);
  const cities = isLarge ? getCitiesForCountry(country.iso) : null;
  const currentCity = selectedCity ?? getDefaultCity(country.iso) ?? undefined;

  return (
    <div className="relative rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:bg-zinc-50">
      <Link
        href={`/country/${country.iso.toLowerCase()}`}
        onClick={() => trackEvent('country_click', { country: country.iso, rank: country.rank, score: country.compositeScore })}
        className="absolute inset-0 z-0"
        aria-label={`View ${country.name}`}
      />
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
            {isLarge && cities && (
              <select
                value={currentCity}
                onChange={(e) => onCityChange?.(country.iso.toUpperCase(), e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="relative z-10 text-xs text-teal-700 bg-transparent border-none cursor-pointer p-0 focus:outline-none focus:ring-0"
                aria-label={`Select city for ${country.name}`}
              >
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge score={displayScore ?? 0} />
          {missingCount > 0 && missingCount <= 3 && (
            <Tooltip>
              <TooltipTrigger
                className="relative z-10 shrink-0 cursor-default"
                aria-label={`Missing data: ${country.nullDimensions.map(dimensionName).join(', ')}`}
                onClick={(e) => e.preventDefault()}
              >
                <AlertTriangle size={14} className="text-amber-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-48 text-xs">
                Missing data: {country.nullDimensions.map(dimensionName).join(', ')}
              </TooltipContent>
            </Tooltip>
          )}
          {missingCount > 3 && (
            <Badge className="border-amber-500 text-amber-700 bg-amber-50 text-xs" variant="outline">
              Limited data
            </Badge>
          )}
        </div>
      </div>
      {!singleDimension && (
        <div className="mt-3">
          <DimensionBars
            dimensionScores={country.dimensionScores}
            weights={weights}
          />
        </div>
      )}
    </div>
  );
}
