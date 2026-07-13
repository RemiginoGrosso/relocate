import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchAllCountryScores, fetchCountryDetail } from '@/lib/supabase';
import { JsonLd } from '@/components/seo/JsonLd';
import { CountryDetailView } from './CountryDetailView';

export const revalidate = 86400;
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ iso: string }>;
}

export async function generateStaticParams() {
  const countries = await fetchAllCountryScores();
  return countries.map((c) => ({ iso: c.iso.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { iso } = await params;
  const detail = await fetchCountryDetail(iso);
  if (!detail) return { title: 'Country not found' };
  const name = detail.country.name;
  return {
    title: name,
    description: `Relocation profile for ${name}: purchasing power, rule of law, safety, warmth, and 6 more dimensions scored on data from OECD, World Bank, and WHO.`,
    openGraph: {
      title: `${name} — Relocate Index`,
      description: `See how ${name} scores across 10 relocation dimensions.`,
      url: `/country/${iso}`,
    },
    alternates: { canonical: `/country/${iso}` },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { iso } = await params;
  const [detail, allCountries] = await Promise.all([
    fetchCountryDetail(iso),
    fetchAllCountryScores(),
  ]);

  if (!detail) notFound();

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://relocateindex.com' },
          { '@type': 'ListItem', position: 2, name: 'Ranking', item: 'https://relocateindex.com/ranking' },
          { '@type': 'ListItem', position: 3, name: detail.country.name, item: `https://relocateindex.com/country/${iso}` },
        ],
      }} />
      <CountryDetailView detail={detail} allCountries={allCountries} />
    </>
  );
}
