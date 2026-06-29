import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCountryDetail } from '@/lib/supabase';
import { CountryDetailView } from './CountryDetailView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ iso: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { iso } = await params;
  const detail = await fetchCountryDetail(iso);
  if (!detail) return { title: 'Country not found — Relocator' };
  const name = detail.country.name;
  return {
    title: `${name} — Relocator`,
    description: `Relocation profile for ${name}: purchasing power, civic culture, safety, warmth, and 6 more dimensions scored on data from OECD, World Bank, and WHO.`,
    openGraph: {
      title: `${name} — Relocator`,
      description: `See how ${name} scores across 10 relocation dimensions.`,
      type: 'website',
    },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { iso } = await params;
  const detail = await fetchCountryDetail(iso);

  if (!detail) notFound();

  return <CountryDetailView detail={detail} />;
}
