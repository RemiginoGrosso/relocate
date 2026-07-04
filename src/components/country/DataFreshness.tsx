import type { RawIndex, ClimateData } from '@/lib/types';

interface DataFreshnessProps {
  rawIndices: RawIndex[];
  climate: ClimateData | null;
}

function getSourceYears(rawIndices: RawIndex[]): Record<string, number | null> {
  const sourceYears: Record<string, number | null> = {};

  for (const raw of rawIndices) {
    const label = sourceLabel(raw.source);
    const existing = sourceYears[label];
    if (existing === undefined || (raw.year !== null && (existing === null || raw.year > existing))) {
      sourceYears[label] = raw.year;
    }
  }

  return sourceYears;
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    worldbank: 'World Bank',
    hofstede: 'Hofstede',
    gallup: 'Gallup MAI',
    pisa: 'PISA',
    gpi: 'GPI',
    internations: 'InterNations',
    imd: 'IMD',
    pew: 'Pew Research',
    ef: 'EF EPI',
  };
  return labels[source] ?? source;
}

export function DataFreshness({ rawIndices, climate }: DataFreshnessProps) {
  const sourceYears = getSourceYears(rawIndices);

  if (climate?.dataYear) {
    sourceYears['Open-Meteo'] = climate.dataYear;
  }

  const entries = Object.entries(sourceYears).sort((a, b) => a[0].localeCompare(b[0]));

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-zinc-900">Data freshness</h3>
      <div className="flex flex-wrap gap-2">
        {entries.map(([source, year]) => (
          <span
            key={source}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
          >
            {source}: {year ?? 'stable'}
          </span>
        ))}
      </div>
    </div>
  );
}
