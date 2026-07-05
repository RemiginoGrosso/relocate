import type { Metadata } from 'next';
import { Suspense } from 'react';
import { fetchAllCountryScores } from '@/lib/supabase';
import { CompareView } from './CompareView';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Compare countries',
  description: 'Compare 2-3 countries side by side across 10 dimensions.',
  robots: { index: false },
};

export default async function ComparePage() {
  const countries = await fetchAllCountryScores();

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-zinc-400">Loading comparison...</div>}>
      <CompareView allCountries={countries} />
    </Suspense>
  );
}
