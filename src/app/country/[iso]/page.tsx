import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchAllCountryScores, fetchCountryDetail } from '@/lib/supabase';
import { DIMENSIONS, MIN_COVERAGE_RATIO } from '@/lib/constants';
import { computeComposite, normaliseWeights } from '@/lib/scoring';
import { DEFAULT_WEIGHTS } from '@/lib/constants';
import { generateCountryProse } from '@/lib/country-prose';
import { generateCountryFaq, faqToJsonLd } from '@/lib/country-faq';
import { compositeRank } from '@/lib/prose-helpers';
import { JsonLd } from '@/components/seo/JsonLd';
import { CountryDetailView } from './CountryDetailView';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

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

  const { country } = detail;
  const normW = normaliseWeights(DEFAULT_WEIGHTS);
  const { score, coverageRatio } = computeComposite(country, normW);
  const isLimited = coverageRatio < MIN_COVERAGE_RATIO;
  const scored = DIMENSIONS
    .map((d) => ({ name: d.name, score: country.dimensionScores[d.key]?.score }))
    .filter((d): d is { name: string; score: number } => d.score != null)
    .sort((a, b) => b.score - a.score);

  const topDims = scored.slice(0, 3).map((d) => `${d.name} ${Math.round(d.score)}`).join(', ');
  const description = isLimited
    ? `${country.name} has limited data in the Relocate Index, with a partial score of ${score.toFixed(1)}/100. Available dimensions: ${topDims}.`
    : `${country.name} scores ${score.toFixed(1)}/100 overall. Top dimensions: ${topDims}. Data from OECD, World Bank, WHO across 10 relocation dimensions.`;

  return {
    title: country.name,
    description,
    openGraph: {
      title: `${country.name} — Relocate Index`,
      description,
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

  const normW = normaliseWeights(DEFAULT_WEIGHTS);
  const { score: compositeScore } = computeComposite(detail.country, normW);
  const overall = compositeRank(detail.country.iso, allCountries);

  const prose = generateCountryProse(
    detail.country,
    detail.rawIndices,
    detail.climate,
    allCountries,
  );

  const faqs = generateCountryFaq(
    detail.country,
    detail.rawIndices,
    detail.climate,
    allCountries,
  );

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Ranking', item: `${BASE_URL}/ranking` },
          { '@type': 'ListItem', position: 3, name: detail.country.name, item: `${BASE_URL}/country/${iso}` },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: detail.country.name,
        identifier: detail.country.iso.toUpperCase(),
        containedInPlace: { '@type': 'Place', name: detail.country.region },
        description: overall.limitedData
          ? `${detail.country.name} has limited data in the Relocate Index, with a partial composite score of ${compositeScore.toFixed(1)} out of 100.`
          : `${detail.country.name} ranks ${overall.rank} out of ${overall.total} in the Relocate Index with a composite score of ${compositeScore.toFixed(1)} out of 100 across 10 relocation dimensions.`,
      }} />
      <JsonLd data={faqToJsonLd(faqs)} />
      <CountryDetailView detail={detail} allCountries={allCountries} prose={prose} faqs={faqs} />
    </>
  );
}
