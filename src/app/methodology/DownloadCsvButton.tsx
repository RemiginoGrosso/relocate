'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchAllCountryScores } from '@/lib/supabase';
import { DIMENSION_KEYS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import type { DimensionKey } from '@/lib/types';

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  purchasing_power: 'Purchasing Power',
  civic_culture: 'Rule of Law',
  safety: 'Safety',
  warmth: 'Warmth',
  school_culture: 'School Culture',
  healthcare: 'Healthcare',
  infrastructure: 'Infrastructure',
  climate: 'Climate',
  religious_freedom: 'Religious Freedom',
  english_proficiency: 'English Proficiency',
};

export function DownloadCsvButton() {
  const [loading, setLoading] = useState(false);
  const mountedAt = useRef<number>(0);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  async function handleDownload() {
    setLoading(true);
    try {
      const countries = await fetchAllCountryScores();
      countries.sort((a, b) => a.name.localeCompare(b.name));

      const headers = ['Country', 'ISO', 'Region', ...DIMENSION_KEYS.map((k) => DIMENSION_LABELS[k])];
      const rows = countries.map((c) => [
        c.name,
        c.iso,
        c.region,
        ...DIMENSION_KEYS.map((k) => {
          const ds = c.dimensionScores[k];
          return ds?.score != null ? String(Math.round(ds.score)) : '';
        }),
      ]);

      const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relocator-scores.csv';
      a.click();
      trackEvent('csv_downloaded', {
        file_name: 'relocator-scores.csv',
        time_on_methodology_ms: mountedAt.current ? Date.now() - mountedAt.current : null,
        country_count: countries.length,
      });
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Preparing...' : 'Download CSV'}
    </button>
  );
}
