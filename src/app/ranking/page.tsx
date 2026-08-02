import type { Metadata } from 'next';
import { fetchAllCountryScores } from '@/lib/supabase';
import { DIMENSIONS } from '@/lib/constants';
import { JsonLd } from '@/components/seo/JsonLd';
import { FooterLinks } from '@/components/seo/FooterLinks';
import { RankingView } from './RankingView';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Country ranking',
  description:
    'Rank 60 countries by purchasing power, rule of law, safety, warmth, and 6 more dimensions. Adjust weights to match your priorities.',
  openGraph: {
    title: 'Country ranking — Relocate Index',
    description: 'Rank 60 countries across 10 data-driven dimensions for relocation.',
    url: '/ranking',
  },
  alternates: { canonical: '/ranking' },
};

export default async function RankingPage() {
  const countries = await fetchAllCountryScores();

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Relocate Index Country Rankings',
        description: '60 countries scored across 10 dimensions for relocation suitability, weighted by user priorities.',
        url: `${BASE_URL}/ranking`,
        creator: { '@type': 'Organization', name: 'Relocate Index' },
        variableMeasured: DIMENSIONS.map((d) => d.name),
        spatialCoverage: '60 countries worldwide',
        temporalCoverage: '2024/..',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Ranking', item: `${BASE_URL}/ranking` },
        ],
      }} />
      <RankingView countries={countries} />
      <div className="mx-auto max-w-5xl px-4">
        <FooterLinks />
      </div>
    </>
  );
}
