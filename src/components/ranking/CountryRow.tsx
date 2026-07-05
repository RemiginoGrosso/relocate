import Link from 'next/link';
import { AlertTriangle, Shield, ShieldCheck, Briefcase, DollarSign } from 'lucide-react';
import type { DimensionKey, HealthcareSystemType, RankedCountry, UserWeights } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import { DIMENSIONS, HEALTHCARE_SYSTEM_MAP, HEALTHCARE_SYSTEM_LABELS } from '@/lib/constants';
import { isLargeCountry, getCitiesForCountry, getDefaultCity } from '@/lib/large-countries';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { DimensionBars } from './DimensionBars';

const dimensionName = (key: DimensionKey): string =>
  DIMENSIONS.find((d) => d.key === key)?.name ?? key;

const SYSTEM_TYPE_ICONS: Record<HealthcareSystemType, typeof Shield> = {
  public: Shield,
  regulated_buyin: ShieldCheck,
  employer_provided: Briefcase,
  budget_private: DollarSign,
};

interface CountryRowProps {
  country: RankedCountry;
  weights: UserWeights;
  singleDimension?: DimensionKey;
  selectedCity?: string;
  onCityChange?: (iso: string, city: string) => void;
  isComparing?: boolean;
  onToggleCompare?: (iso: string) => void;
  canAddMore?: boolean;
}

export function CountryRow({ country, weights, singleDimension, selectedCity, onCityChange, isComparing, onToggleCompare, canAddMore }: CountryRowProps) {
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
      >
        <span className="sr-only">{country.name} — view country profile</span>
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {onToggleCompare && (
            <div
              className="relative z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isComparing || canAddMore) onToggleCompare(country.iso);
              }}
            >
              <input
                type="checkbox"
                checked={isComparing ?? false}
                disabled={!isComparing && !canAddMore}
                readOnly
                className="h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 text-teal-700 focus:ring-teal-700 disabled:cursor-not-allowed disabled:opacity-40 pointer-events-none"
                aria-label={`Compare ${country.name}`}
                tabIndex={-1}
              />
            </div>
          )}
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
            {singleDimension === 'healthcare' && (() => {
              const systemType = HEALTHCARE_SYSTEM_MAP[country.iso.toUpperCase()];
              if (!systemType) return null;
              const meta = HEALTHCARE_SYSTEM_LABELS[systemType];
              const Icon = SYSTEM_TYPE_ICONS[systemType];
              return (
                <Tooltip>
                  <TooltipTrigger
                    className="relative z-10 cursor-default"
                    onClick={(e) => e.preventDefault()}
                  >
                    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs ${meta.color}`}>
                      <Icon size={12} />
                      {meta.short}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64 text-xs">
                    {meta.tooltip}
                  </TooltipContent>
                </Tooltip>
              );
            })()}
            {isLarge && cities && (!singleDimension || singleDimension === 'climate') && (
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
          {singleDimension && displayScore === null && (
            <Tooltip>
              <TooltipTrigger
                className="relative z-10 shrink-0 cursor-default"
                aria-label="Data unavailable for this dimension"
                onClick={(e) => e.preventDefault()}
              >
                <AlertTriangle size={14} className="text-amber-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-48 text-xs">
                No data available for this dimension
              </TooltipContent>
            </Tooltip>
          )}
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
