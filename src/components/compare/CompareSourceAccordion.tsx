'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { DIMENSIONS, INDICATOR_TOOLTIPS } from '@/lib/constants';
import {
  DIMENSION_INDICATORS,
  INDICATOR_LABELS,
  getRawValue,
  getInterpretation,
  formatValue,
} from '@/lib/indicator-display';
import type { CountryScores, RawIndex, UserWeights } from '@/lib/types';

const COLORS = ['text-teal-700', 'text-indigo-600', 'text-amber-600'];

interface CompareSourceAccordionProps {
  countries: CountryScores[];
  weights: UserWeights;
  rawIndicesByCountry: Record<string, RawIndex[]>;
}

const CLIMATE_ROWS: { key: string; label: string; format: (v: number) => string }[] = [
  { key: 'avg_temp', label: 'Avg temp (annual)', format: (v) => `${v}°C` },
  { key: 'avg_temp_winter', label: 'Winter avg', format: (v) => `${v}°C` },
  { key: 'sunshine_hours', label: 'Sunshine', format: (v) => `${v.toLocaleString()} hrs/yr` },
  { key: 'rain_days', label: 'Rain days', format: (v) => `${v}/yr` },
];

export function CompareSourceAccordion({
  countries,
  weights,
  rawIndicesByCountry,
}: CompareSourceAccordionProps) {
  return (
    <Accordion>
      {DIMENSIONS.filter((dim) => weights[dim.key] !== 0).map((dim) => {
        const isClimate = dim.key === 'climate';
        const indicators = DIMENSION_INDICATORS[dim.key];

        return (
          <AccordionItem key={dim.key} value={dim.key}>
            <AccordionTrigger className="gap-3">
              <div className="flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pr-2">
                <span>{dim.name}</span>
                <div className="flex items-center gap-3">
                  {countries.map((c, i) => {
                    const score = c.dimensionScores[dim.key]?.score;
                    return (
                      <div key={c.iso} className={`flex items-center gap-1 ${COLORS[i]}`}>
                        <span className="text-xs">{c.flagEmoji}</span>
                        {score != null ? (
                          <ScoreBadge score={score} />
                        ) : (
                          <span className="text-xs text-zinc-400">no data</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 px-2">
                <p className="text-xs text-zinc-500">{dim.description}</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="py-1.5 pr-3 text-left font-normal text-zinc-400">
                          Source
                        </th>
                        {countries.map((c, i) => (
                          <th
                            key={c.iso}
                            className={`py-1.5 pl-3 text-right font-medium ${COLORS[i]}`}
                          >
                            {c.flagEmoji} {c.iso}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isClimate
                        ? CLIMATE_ROWS.map((row) => {
                            const values = countries.map(
                              (c) => c.dimensionScores.climate?.components?.[row.key] ?? null,
                            );
                            if (values.every((v) => v == null)) return null;
                            return (
                              <tr key={row.key} className="border-b border-zinc-50">
                                <td className="py-1.5 pr-3 text-zinc-500">{row.label}</td>
                                {countries.map((c, i) => {
                                  const v = values[i];
                                  return (
                                    <td
                                      key={c.iso}
                                      className="py-1.5 pl-3 text-right text-zinc-700 tabular-nums"
                                    >
                                      {v != null ? row.format(v) : 'N/A'}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        : indicators.map((indKey) => {
                            const [source, indicator] = indKey.split('.');
                            const label = INDICATOR_LABELS[indKey] ?? indKey;
                            const tooltipText = INDICATOR_TOOLTIPS[indKey];

                            return (
                              <tr key={indKey} className="border-b border-zinc-50">
                                <td className="py-1.5 pr-3 text-zinc-500">
                                  {tooltipText ? (
                                    <Tooltip>
                                      <TooltipTrigger className="cursor-default border-b border-dotted border-zinc-300 text-left">
                                        {label}
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-64 text-xs">
                                        {tooltipText}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    label
                                  )}
                                </td>
                                {countries.map((c) => {
                                  const raw = getRawValue(
                                    rawIndicesByCountry[c.id] ?? [],
                                    source,
                                    indicator,
                                  );
                                  const interpretation = getInterpretation(
                                    indKey,
                                    raw?.value ?? null,
                                  );
                                  return (
                                    <td
                                      key={c.iso}
                                      className="py-1.5 pl-3 text-right text-zinc-700 tabular-nums"
                                    >
                                      {raw ? formatValue(raw) : 'N/A'}
                                      {raw?.year ? ` (${raw.year})` : ''}
                                      {interpretation && (
                                        <span className="block text-zinc-400">
                                          {interpretation}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
