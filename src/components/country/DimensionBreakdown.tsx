'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { Shield, ShieldCheck, Briefcase, DollarSign } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DIMENSIONS, INDICATOR_TOOLTIPS, WARMTH_MISMATCH_THRESHOLD, HEALTHCARE_SYSTEM_MAP, HEALTHCARE_SYSTEM_LABELS } from '@/lib/constants';
import { INDICATOR_LABELS, DIMENSION_INDICATORS, getRawValue, getInterpretation, formatValue } from '@/lib/indicator-display';
import { hasCityData, getCityClimate } from '@/lib/large-countries';
import { getSourceStatuses } from '@/lib/source-provenance';
import type { CountryScores, RawIndex, ClimateData, HealthcareSystemType } from '@/lib/types';

interface DimensionBreakdownProps {
  country: CountryScores;
  rawIndices: RawIndex[];
  climate: ClimateData | null;
  selectedCity?: string;
}

interface ClimateSectionProps {
  climate: ClimateData | null;
  selectedCity?: string;
  countryIso: string;
  countryName: string;
}

const SYSTEM_TYPE_ICONS: Record<HealthcareSystemType, typeof Shield> = {
  public: Shield,
  regulated_buyin: ShieldCheck,
  employer_provided: Briefcase,
  budget_private: DollarSign,
};

function HealthcareSystemBadge({ iso }: { iso: string }) {
  const systemType = HEALTHCARE_SYSTEM_MAP[iso.toUpperCase()];
  if (!systemType) return null;
  const meta = HEALTHCARE_SYSTEM_LABELS[systemType];
  const Icon = SYSTEM_TYPE_ICONS[systemType];
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`inline-flex items-center gap-1.5 self-start rounded-md border px-2.5 py-1.5 text-xs font-medium ${meta.color}`}>
        <Icon size={14} />
        <span>{meta.label}</span>
      </div>
      <p className="text-xs text-zinc-500">{meta.tooltip}</p>
    </div>
  );
}

function ClimateSection({ climate, selectedCity, countryIso, countryName }: ClimateSectionProps) {
  const large = hasCityData(countryIso);

  if (!climate && !selectedCity) return <p className="text-xs text-zinc-500">No climate data available.</p>;

  const cityClimate = selectedCity ? getCityClimate(countryIso, selectedCity) : null;

  const avgTemp = cityClimate?.avgTemp ?? climate?.avgTempAnnual ?? null;
  const sunshine = cityClimate?.sunshineHours ?? climate?.sunshineHoursAnnual ?? null;
  const rainDays = cityClimate?.rainDays ?? climate?.rainDaysAnnual ?? null;

  const rows = [
    { label: 'Avg temp (annual)', value: avgTemp !== null ? `${avgTemp}°C` : 'N/A' },
    { label: 'Winter avg', value: !cityClimate && climate?.avgTempWinter != null ? `${climate.avgTempWinter}°C` : cityClimate ? '—' : 'N/A' },
    { label: 'Summer avg', value: !cityClimate && climate?.avgTempSummer != null ? `${climate.avgTempSummer}°C` : cityClimate ? '—' : 'N/A' },
    { label: 'Sunshine', value: sunshine !== null ? `${sunshine.toLocaleString()} hrs/yr` : 'N/A' },
    { label: 'Rain days', value: rainDays !== null ? `${rainDays}/yr` : 'N/A' },
  ];

  return (
    <div className="flex flex-col gap-2">
      {selectedCity && (
        <p className="text-xs font-medium text-zinc-700 mb-1.5">
          Climate data for {selectedCity}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-xs">
            <span className="text-zinc-500">{r.label}</span>
            <span className="text-zinc-700 tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>

      {large && (
        <p className="text-xs text-amber-600">
          Climate varies significantly across {countryName}. Use the city selector at the top of the page to update this score.
        </p>
      )}
    </div>
  );
}

export function DimensionBreakdown({ country, rawIndices, climate, selectedCity }: DimensionBreakdownProps) {
  const warmthScore = country.dimensionScores.warmth;
  const warmthMismatch = (() => {
    const ivrRaw = rawIndices.find((r) => r.source === 'hofstede' && r.indicator === 'ivr');
    const interNationsRaw = rawIndices.find((r) => r.source === 'internations' && r.indicator === 'ease_rank');
    if (!ivrRaw?.value || !interNationsRaw?.value || !warmthScore?.components) return false;
    return Math.abs(
      (warmthScore.components['ivr'] ?? 0) -
      (warmthScore.components['internations_score'] ?? 0)
    ) > WARMTH_MISMATCH_THRESHOLD;
  })();

  return (
    <Accordion>
      {DIMENSIONS.map((dim) => {
        const dimScore = country.dimensionScores[dim.key];
        const indicators = DIMENSION_INDICATORS[dim.key];
        const isClimate = dim.key === 'climate';
        const statuses = getSourceStatuses(dim.key, rawIndices);
        const hasScore = dimScore?.score != null;
        const missingKeySources = statuses.filter((s) => !s.present && s.tier === 'key');
        const isNativeEnglishOverride = dim.key === 'english_proficiency' && dimScore?.components?.native_speaker === 1;
        const isPartial = hasScore && missingKeySources.length > 0 && !isNativeEnglishOverride;
        const hasAnyRawData = !isClimate && indicators.some((indKey) => {
          const [source, indicator] = indKey.split('.');
          return getRawValue(rawIndices, source, indicator)?.value != null;
        });
        const isNullWithRawData = !hasScore && hasAnyRawData;

        return (
          <AccordionItem key={dim.key} value={dim.key}>
            <AccordionTrigger className="gap-3">
              <div className="flex flex-1 items-center justify-between pr-2">
                <span>{dim.name}</span>
                <span className="flex items-center gap-1.5">
                  {isNullWithRawData && (
                    <span title="Limited data — see available indicators inside">
                      <AlertTriangle size={14} className="text-amber-500" />
                    </span>
                  )}
                  {hasScore ? (
                    <>
                      <ScoreBadge score={dimScore!.score!} />
                      {isPartial && (
                        <span className="text-xs text-amber-500">(partial)</span>
                      )}
                      {isNativeEnglishOverride && (
                        <span className="text-xs text-zinc-400">(native)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-zinc-400">{isNullWithRawData ? 'Limited data' : 'No data'}</span>
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 px-2">
                <p className="text-xs text-zinc-500">{dim.description}</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{dim.context}</p>

                {dim.key === 'healthcare' && (
                  <HealthcareSystemBadge iso={country.iso} />
                )}

                {isClimate ? (
                  <ClimateSection
                    climate={climate}
                    selectedCity={selectedCity}
                    countryIso={country.iso}
                    countryName={country.name}
                  />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {indicators.map((indKey) => {
                      const [source, indicator] = indKey.split('.');
                      const raw = getRawValue(rawIndices, source, indicator);
                      const interpretation = getInterpretation(indKey, raw?.value ?? null);
                      const tooltipText = INDICATOR_TOOLTIPS[indKey];
                      return (
                        <div key={indKey} className="flex items-baseline justify-between gap-4 text-xs">
                          {tooltipText ? (
                            <Tooltip>
                              <TooltipTrigger className="min-w-0 text-left text-zinc-500 cursor-default border-b border-dotted border-zinc-300">
                                {INDICATOR_LABELS[indKey] ?? indKey}
                              </TooltipTrigger>
                              <TooltipContent className="max-w-64 text-xs">
                                {tooltipText}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="min-w-0 text-zinc-500">
                              {INDICATOR_LABELS[indKey] ?? indKey}
                            </span>
                          )}
                          <span className="shrink-0 text-right text-zinc-700 tabular-nums">
                            {raw ? formatValue(raw) : 'N/A'}
                            {raw?.year ? ` (${raw.year})` : ''}
                            {interpretation && (
                              <span className="block text-zinc-400">{interpretation}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {dim.key === 'warmth' && warmthMismatch && warmthScore?.components && (() => {
                  const ivr = warmthScore.components['ivr'] ?? 0;
                  const inter = warmthScore.components['internations_score'] ?? 0;
                  const msg = ivr > inter
                    ? 'Cultural values suggest an open, permissive society — but expats report finding it harder to settle in and build connections.'
                    : 'Expats report settling in easily — but underlying cultural values lean more restrained. Day-to-day warmth may feel different from what surveys capture.';
                  return (
                    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <ArrowLeftRight size={14} className="mt-0.5 shrink-0 text-amber-600" />
                      <p className="text-xs text-amber-800">{msg}</p>
                    </div>
                  );
                })()}

                {isNullWithRawData && (
                  <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-800">
                      All key sources ({missingKeySources.map((s) => s.label).join(', ')}) are required to produce a comparable score. Available indicators are shown above for reference.
                    </p>
                  </div>
                )}

                {isPartial && (
                  <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-800">
                      Partial data — missing {missingKeySources.map((s) => s.label).join(', ')}. Score based on available sources only.
                    </p>
                  </div>
                )}

                {(() => {
                  if (!statuses.length) return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dim.sources.map((src) => (
                        <span key={src} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{src}</span>
                      ))}
                    </div>
                  );
                  return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {statuses.map((s) => (
                        <span
                          key={s.label}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            s.present
                              ? 'bg-zinc-100 text-zinc-600'
                              : 'border border-dashed border-zinc-300 text-zinc-400'
                          }`}
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
                  );
                })()}

                <details className="text-xs">
                  <summary className="cursor-pointer text-teal-700 hover:text-teal-800">
                    How is this calculated?
                  </summary>
                  <p className="mt-1 font-mono text-zinc-600">{dim.methodology}</p>
                  {dim.knownLimitation && (
                    <p className="mt-1 text-zinc-400">Limitation: {dim.knownLimitation}</p>
                  )}
                </details>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
