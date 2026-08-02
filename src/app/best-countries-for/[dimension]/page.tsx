import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchAllCountryScores, fetchLatestDataDate } from '@/lib/supabase';
import {
  DIMENSIONS,
  DIMENSION_SLUGS,
  SLUG_TO_DIMENSION,
  DIMENSION_SEO_TITLES,
} from '@/lib/constants';
import { computeComposite, normaliseWeights } from '@/lib/scoring';
import { DEFAULT_WEIGHTS } from '@/lib/constants';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { JsonLd } from '@/components/seo/JsonLd';
import { FooterLinks } from '@/components/seo/FooterLinks';
import { DataFreshnessNote } from '@/components/seo/DataFreshnessNote';
import type { CountryScores, DimensionKey } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export const revalidate = 86400;
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ dimension: string }>;
}

export async function generateStaticParams() {
  return Object.values(DIMENSION_SLUGS).map((slug) => ({ dimension: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dimension: slug } = await params;
  const dimKey = SLUG_TO_DIMENSION[slug];
  if (!dimKey) return { title: 'Not found' };

  const title = `${DIMENSION_SEO_TITLES[dimKey]} ${new Date().getFullYear()}`;
  const dim = DIMENSIONS.find((d) => d.key === dimKey)!;

  return {
    title,
    description: `${title} — ranked by ${dim.name.toLowerCase()} score across 60 countries. Data from ${dim.sources.join(', ')}.`,
    openGraph: {
      title: `${title} — Relocate Index`,
      description: `See which countries score highest for ${dim.name.toLowerCase()} based on institutional data.`,
      url: `/best-countries-for/${slug}`,
    },
    alternates: { canonical: `/best-countries-for/${slug}` },
  };
}

function rankCountriesByDimension(
  countries: CountryScores[],
  dimKey: DimensionKey,
): { scored: (CountryScores & { dimScore: number; compositeScore: number })[]; unscored: CountryScores[] } {
  const normW = normaliseWeights(DEFAULT_WEIGHTS);
  const scored: (CountryScores & { dimScore: number; compositeScore: number })[] = [];
  const unscored: CountryScores[] = [];

  for (const c of countries) {
    const s = c.dimensionScores[dimKey]?.score;
    if (s != null) {
      scored.push({ ...c, dimScore: s, compositeScore: computeComposite(c, normW).score });
    } else {
      unscored.push(c);
    }
  }

  scored.sort((a, b) => b.dimScore - a.dimScore);
  return { scored, unscored };
}

export default async function DimensionLandingPage({ params }: PageProps) {
  const { dimension: slug } = await params;
  const dimKey = SLUG_TO_DIMENSION[slug];
  if (!dimKey) notFound();

  const dim = DIMENSIONS.find((d) => d.key === dimKey)!;
  const [allCountries, dataUpdated] = await Promise.all([
    fetchAllCountryScores(),
    fetchLatestDataDate(),
  ]);
  const { scored, unscored } = rankCountriesByDimension(allCountries, dimKey);
  const top15 = scored.slice(0, 15);
  const bottom5 = scored.length > 20 ? scored.slice(-5).reverse() : [];
  const title = `${DIMENSION_SEO_TITLES[dimKey]} ${new Date().getFullYear()}`;

  const faqItems = [
    {
      question: `Which country has the best ${dim.name.toLowerCase()}?`,
      answer: top15.length > 0
        ? `${top15[0].name} ranks 1st for ${dim.name.toLowerCase()} with a score of ${Math.round(top15[0].dimScore)} out of 100, based on data from ${dim.sources.join(', ')}.`
        : `No countries have data available for ${dim.name.toLowerCase()}.`,
    },
    {
      question: `How is the ${dim.name.toLowerCase()} score calculated?`,
      answer: `${dim.context} Formula: ${dim.methodology}`,
    },
    {
      question: `How many countries are ranked for ${dim.name.toLowerCase()}?`,
      answer: `${scored.length} countries have ${dim.name.toLowerCase()} scores in the Relocate Index. ${unscored.length > 0 ? `${unscored.length} countries lack sufficient data for this dimension.` : ''}`,
    },
  ];

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Ranking', item: `${BASE_URL}/ranking` },
          { '@type': 'ListItem', position: 3, name: title, item: `${BASE_URL}/best-countries-for/${slug}` },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }} />

      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <nav className="mb-6 text-sm text-zinc-500">
          <Link href="/ranking" className="hover:text-zinc-900 transition-colors">Ranking</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-900">{dim.name}</span>
        </nav>

        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-4">
          {title}
        </h1>

        <p className="text-sm leading-relaxed text-zinc-600 mb-2">
          {dim.context}
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 mb-8">
          Scored using data from {dim.sources.join(', ')}. {scored.length} countries ranked.
          {unscored.length > 0 && ` ${unscored.length} countries lack data for this dimension.`}
        </p>
        <DataFreshnessNote date={dataUpdated} />

        <section>
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Top 15 countries for {dim.name.toLowerCase()}
          </h2>
          <div className="space-y-3">
            {top15.map((c, i) => (
              <Link
                key={c.iso}
                href={`/country/${c.iso.toLowerCase()}`}
                className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
              >
                <span className="shrink-0 text-xs text-zinc-400 tabular-nums w-5">
                  {i + 1}
                </span>
                <span className="text-2xl" aria-hidden>{c.flagEmoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                  <p className="text-xs text-zinc-500">{c.region} · Overall: {c.compositeScore.toFixed(1)}</p>
                </div>
                <ScoreBadge score={c.dimScore} />
              </Link>
            ))}
          </div>
        </section>

        {bottom5.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-medium text-zinc-900">
              Lowest-scoring countries
            </h2>
            <div className="space-y-3">
              {bottom5.map((c) => {
                const rank = scored.findIndex((s) => s.iso === c.iso) + 1;
                return (
                  <Link
                    key={c.iso}
                    href={`/country/${c.iso.toLowerCase()}`}
                    className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
                  >
                    <span className="shrink-0 text-xs text-zinc-400 tabular-nums w-5">
                      {rank}
                    </span>
                    <span className="text-2xl" aria-hidden>{c.flagEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.region}</p>
                    </div>
                    <ScoreBadge score={c.dimScore} />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            How {dim.name.toLowerCase()} is calculated
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed mb-2">{dim.description}</p>
          <p className="text-sm text-zinc-500 font-mono leading-relaxed mb-2">{dim.methodology}</p>
          {dim.knownLimitation && (
            <p className="text-sm text-zinc-400">Limitation: {dim.knownLimitation}</p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqItems.map((faq, i) => (
              <details key={i} className="rounded-lg border border-zinc-200">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors">
                  {faq.question}
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-zinc-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <FooterLinks currentDimension={dimKey} />
      </main>
    </>
  );
}
