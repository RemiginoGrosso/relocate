'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { DIMENSIONS, WARMTH_MISMATCH_THRESHOLD } from '@/lib/constants';
import type { CountryScores, RawIndex, ClimateData, DimensionKey } from '@/lib/types';

interface DimensionBreakdownProps {
  country: CountryScores;
  rawIndices: RawIndex[];
  climate: ClimateData | null;
}

const INDICATOR_LABELS: Record<string, string> = {
  'worldbank.wgi_rule_of_law': 'WGI Rule of Law',
  'worldbank.wgi_corruption_control': 'WGI Corruption Control',
  'wvs.trust_pct': 'WVS Social Trust',
  'gpi.gpi_score': 'GPI Score',
  'hofstede.ivr': 'Hofstede IVR',
  'internations.ease_rank': 'InterNations Ease Rank',
  'pisa.pisa_reading': 'PISA Reading',
  'pisa.pisa_maths': 'PISA Maths',
  'pisa.pisa_science': 'PISA Science',
  'pisa.pisa_belonging': 'PISA Belonging Index',
  'pisa.pisa_bullying': 'PISA Bullying Index',
  'pisa.pisa_safety': 'PISA Safety Index',
  'worldbank.who_uhc_coverage': 'WHO UHC Coverage',
  'worldbank.who_oop_pct': 'WHO Out-of-Pocket %',
  'worldbank.oecd_ppp_aic': 'OECD PPP (AIC)',
  'worldbank.price_level_ratio': 'Price Level Ratio',
  'imd.infrastructure_score': 'IMD Infrastructure Score',
  'pew.govt_restrictions': 'Pew Govt Restrictions',
  'pew.social_hostility': 'Pew Social Hostilities',
  'ef.epi_score': 'EF EPI Score',
};

const DIMENSION_INDICATORS: Record<DimensionKey, string[]> = {
  purchasing_power: ['worldbank.oecd_ppp_aic', 'worldbank.price_level_ratio', 'worldbank.who_oop_pct'],
  civic_culture: ['worldbank.wgi_rule_of_law', 'worldbank.wgi_corruption_control', 'wvs.trust_pct'],
  safety: ['gpi.gpi_score'],
  warmth: ['hofstede.ivr', 'internations.ease_rank'],
  school_culture: ['pisa.pisa_reading', 'pisa.pisa_maths', 'pisa.pisa_science', 'pisa.pisa_belonging', 'pisa.pisa_bullying', 'pisa.pisa_safety'],
  healthcare: ['worldbank.who_uhc_coverage', 'worldbank.who_oop_pct'],
  infrastructure: ['imd.infrastructure_score'],
  climate: [],
  religious_freedom: ['pew.govt_restrictions', 'pew.social_hostility'],
  english_proficiency: ['ef.epi_score'],
};

function getRawValue(rawIndices: RawIndex[], source: string, indicator: string): RawIndex | undefined {
  return rawIndices.find((r) => `${r.source}.${r.indicator}` === `${source}.${indicator}`);
}

function formatValue(raw: RawIndex): string {
  if (raw.value === null) return 'N/A';
  const v = raw.value;
  const key = `${raw.source}.${raw.indicator}`;
  if (key === 'worldbank.who_oop_pct') return `${v.toFixed(1)}%`;
  if (key === 'worldbank.price_level_ratio') return v.toFixed(2);
  if (key === 'gpi.gpi_score') return v.toFixed(3);
  if (key.startsWith('pisa.') && !['pisa.reading', 'pisa.maths', 'pisa.science'].includes(key)) return v.toFixed(2);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function ClimateSection({ climate }: { climate: ClimateData | null }) {
  if (!climate) return <p className="text-xs text-zinc-500">No climate data available.</p>;

  const rows = [
    { label: 'Avg temp (annual)', value: climate.avgTempAnnual !== null ? `${climate.avgTempAnnual}°C` : 'N/A' },
    { label: 'Winter avg', value: climate.avgTempWinter !== null ? `${climate.avgTempWinter}°C` : 'N/A' },
    { label: 'Summer avg', value: climate.avgTempSummer !== null ? `${climate.avgTempSummer}°C` : 'N/A' },
    { label: 'Sunshine', value: climate.sunshineHoursAnnual !== null ? `${climate.sunshineHoursAnnual.toLocaleString()} hrs/yr` : 'N/A' },
    { label: 'Rain days', value: climate.rainDaysAnnual !== null ? `${climate.rainDaysAnnual}/yr` : 'N/A' },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-xs">
          <span className="text-zinc-500">{r.label}</span>
          <span className="text-zinc-700 tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DimensionBreakdown({ country, rawIndices, climate }: DimensionBreakdownProps) {
  const ivrRaw = rawIndices.find((r) => r.source === 'hofstede' && r.indicator === 'ivr');
  const interNationsRaw = rawIndices.find((r) => r.source === 'internations' && r.indicator === 'ease_rank');

  const warmthMismatch =
    ivrRaw?.value != null &&
    interNationsRaw?.value != null &&
    country.dimensionScores.warmth?.components &&
    Math.abs(
      (country.dimensionScores.warmth.components['ivr'] ?? 0) -
      (country.dimensionScores.warmth.components['internations_score'] ?? 0)
    ) > WARMTH_MISMATCH_THRESHOLD;

  return (
    <Accordion>
      {DIMENSIONS.map((dim) => {
        const dimScore = country.dimensionScores[dim.key];
        const indicators = DIMENSION_INDICATORS[dim.key];
        const isClimate = dim.key === 'climate';

        return (
          <AccordionItem key={dim.key} value={dim.key}>
            <AccordionTrigger className="gap-3">
              <div className="flex flex-1 items-center justify-between pr-2">
                <span>{dim.name}</span>
                {dimScore?.score != null ? (
                  <ScoreBadge score={dimScore.score} />
                ) : (
                  <span className="text-xs text-zinc-400">No data</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 pl-1">
                <p className="text-xs text-zinc-500">{dim.description}</p>

                {isClimate ? (
                  <ClimateSection climate={climate} />
                ) : (
                  <div className="flex flex-col gap-1">
                    {indicators.map((indKey) => {
                      const [source, indicator] = indKey.split('.');
                      const raw = getRawValue(rawIndices, source, indicator);
                      return (
                        <div key={indKey} className="flex justify-between text-xs">
                          <span className="text-zinc-500">
                            {INDICATOR_LABELS[indKey] ?? indKey}
                          </span>
                          <span className="text-zinc-700 tabular-nums">
                            {raw ? formatValue(raw) : 'N/A'}
                            {raw?.year ? ` (${raw.year})` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {dim.key === 'warmth' && warmthMismatch && (
                  <p className="text-xs text-amber-700">
                    Warmth mismatch: cultural permissiveness and expat experience scores differ significantly.
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dim.sources.map((src) => (
                    <span
                      key={src}
                      className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                    >
                      {src}
                    </span>
                  ))}
                </div>

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
