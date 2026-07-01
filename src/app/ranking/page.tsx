import type { Metadata } from 'next';
import { fetchAllCountryScores } from '@/lib/supabase';
import { RankingView } from './RankingView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Country ranking — Relocator',
  description:
    'Rank 59 countries by purchasing power, civic culture, safety, warmth, and 6 more dimensions. Adjust weights to match your priorities.',
  openGraph: {
    title: 'Country ranking — Relocator',
    description: 'Rank 59 countries across 10 data-driven dimensions for relocation.',
    type: 'website',
  },
};

export default async function RankingPage() {
  const countries = await fetchAllCountryScores();

  return <RankingView countries={countries} />;
}
