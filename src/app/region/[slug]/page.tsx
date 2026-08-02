import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchAllCountryScores, fetchLatestDataDate } from '@/lib/supabase';
import {
  DIMENSIONS,
  DIMENSION_SLUGS,
  REGIONS,
  REGION_SLUGS,
  SLUG_TO_REGION,
  DEFAULT_WEIGHTS,
  MIN_COVERAGE_RATIO,
} from '@/lib/constants';
import { computeComposite, normaliseWeights } from '@/lib/scoring';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { generateComparisonPairs } from '@/lib/comparison-pairs';
import { JsonLd } from '@/components/seo/JsonLd';
import { FooterLinks } from '@/components/seo/FooterLinks';
import { DataFreshnessNote } from '@/components/seo/DataFreshnessNote';
import type { CountryScores, DimensionKey, Region } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export const revalidate = 86400;
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.values(REGION_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const region = SLUG_TO_REGION[slug];
  if (!region) return { title: 'Not found' };

  const title = `Best Countries in ${region} for Relocation ${new Date().getFullYear()}`;

  return {
    title,
    description: `${title} — ranked by composite score across purchasing power, safety, healthcare, and 7 other relocation dimensions.`,
    openGraph: {
      title: `${title} — Relocate Index`,
      description: `See which ${region} countries score highest for relocation based on institutional data.`,
      url: `/region/${slug}`,
    },
    alternates: { canonical: `/region/${slug}` },
  };
}

interface RankedRegionCountry extends CountryScores {
  compositeScore: number;
  limitedData: boolean;
}

function rankRegionCountries(countries: CountryScores[]): { ranked: RankedRegionCountry[]; limited: RankedRegionCountry[] } {
  const normW = normaliseWeights(DEFAULT_WEIGHTS);
  const all = countries.map((c) => {
    const { score, coverageRatio } = computeComposite(c, normW);
    return { ...c, compositeScore: score, limitedData: coverageRatio < MIN_COVERAGE_RATIO };
  });
  const ranked = all.filter((c) => !c.limitedData).sort((a, b) => b.compositeScore - a.compositeScore);
  const limited = all.filter((c) => c.limitedData).sort((a, b) => b.compositeScore - a.compositeScore);
  return { ranked, limited };
}

function dimensionAverage(countries: CountryScores[], dimKey: DimensionKey): number | null {
  const scores = countries
    .map((c) => c.dimensionScores[dimKey]?.score)
    .filter((s): s is number => s != null);
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export default async function RegionLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const region = SLUG_TO_REGION[slug] as Region | undefined;
  if (!region) notFound();

  const [allCountries, dataUpdated] = await Promise.all([
    fetchAllCountryScores(),
    fetchLatestDataDate(),
  ]);

  const regionCountries = allCountries.filter((c) => c.region === region);
  const { ranked, limited } = rankRegionCountries(regionCountries);

  const normW = normaliseWeights(DEFAULT_WEIGHTS);
  const globalAvg =
    allCountries.reduce((sum, c) => sum + computeComposite(c, normW).score, 0) / allCountries.length;
  const regionAvg = ranked.length > 0
    ? ranked.reduce((sum, c) => sum + c.compositeScore, 0) / ranked.length
    : 0;

  const dimensionDeltas = DIMENSIONS.map((dim) => {
    const regionAvgDim = dimensionAverage(regionCountries, dim.key);
    const globalAvgDim = dimensionAverage(allCountries, dim.key);
    const delta = regionAvgDim != null && globalAvgDim != null ? regionAvgDim - globalAvgDim : null;
    return { key: dim.key, name: dim.name, regionAvgDim, globalAvgDim, delta };
  }).filter((d): d is typeof d & { delta: number } => d.delta != null);

  const standoutHigh = [...dimensionDeltas].sort((a, b) => b.delta - a.delta).slice(0, 2);
  const standoutLow = [...dimensionDeltas].sort((a, b) => a.delta - b.delta).slice(0, 2);

  const title = `Best Countries in ${region} for Relocation ${new Date().getFullYear()}`;
  const otherRegions = REGIONS.filter((r) => r !== region);
  const regionPairsRaw = generateComparisonPairs(regionCountries).slice(0, 6);
  const countryByIso = new Map(regionCountries.map((c) => [c.iso, c]));
  const regionPairs = regionPairsRaw.map((p) => ({
    slug: p.slug,
    nameA: countryByIso.get(p.isoA)?.name ?? p.isoA,
    nameB: countryByIso.get(p.isoB)?.name ?? p.isoB,
  }));

  const faqItems = [
    {
      question: `What are the best countries in ${region}?`,
      answer: ranked.length > 0
        ? `${ranked[0].name} ranks highest in ${region} with a composite score of ${ranked[0].compositeScore.toFixed(1)} out of 100, followed by ${ranked.slice(1, 3).map((c) => c.name).join(' and ')}.${limited.length > 0 ? ` ${limited.length} additional ${limited.length === 1 ? 'country has' : 'countries have'} limited data and ${limited.length === 1 ? 'is' : 'are'} not ranked.` : ''}`
        : `No countries with sufficient data are currently ranked in ${region}.`,
    },
    {
      question: `How many countries in ${region} does Relocate Index cover?`,
      answer: `Relocate Index covers ${regionCountries.length} countries in ${region}, each scored across 10 relocation dimensions using institutional data sources.`,
    },
    {
      question: `What dimensions does ${region} score highest on?`,
      answer: standoutHigh.length > 0
        ? `${region} scores highest relative to the global average on ${standoutHigh.map((d) => d.name.toLowerCase()).join(' and ')}.`
        : `${region}'s dimension scores are close to the global average across the board.`,
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
          { '@type': 'ListItem', position: 3, name: region, item: `${BASE_URL}/region/${slug}` },
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
          <span className="text-zinc-900">{region}</span>
        </nav>

        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-4">
          {title}
        </h1>

        <p className="text-sm leading-relaxed text-zinc-600 mb-2">
          Relocate Index covers {regionCountries.length} countries in {region}. The region
          averages {regionAvg.toFixed(1)} out of 100 on composite score, {regionAvg >= globalAvg ? 'above' : 'below'} the
          global average of {globalAvg.toFixed(1)}.
          {standoutHigh.length > 0 && ` It scores highest, relative to the global average, on ${standoutHigh.map((d) => d.name.toLowerCase()).join(' and ')}.`}
          {standoutLow.length > 0 && ` It lags most on ${standoutLow.map((d) => d.name.toLowerCase()).join(' and ')}.`}
        </p>
        <DataFreshnessNote date={dataUpdated} />

        <section>
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Countries in {region}
          </h2>
          <div className="space-y-3">
            {ranked.map((c, i) => (
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
                  <p className="text-xs text-zinc-500">{c.capitalCity}</p>
                </div>
                <ScoreBadge score={c.compositeScore} />
              </Link>
            ))}
          </div>
          {limited.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-medium text-zinc-500">
                Limited data ({limited.length})
              </h3>
              <div className="space-y-3">
                {limited.map((c) => (
                  <Link
                    key={c.iso}
                    href={`/country/${c.iso.toLowerCase()}`}
                    className="flex items-center gap-4 rounded-lg border border-dashed border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
                  >
                    <span className="shrink-0 text-xs text-zinc-300 tabular-nums w-5">—</span>
                    <span className="text-2xl" aria-hidden>{c.flagEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                      <p className="text-xs text-zinc-400">{c.capitalCity} · Limited data</p>
                    </div>
                    <span className="text-xs text-zinc-400">{c.compositeScore.toFixed(1)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            {region} vs global average by dimension
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-2 pr-4 text-left text-xs font-medium text-zinc-500">Dimension</th>
                  <th className="py-2 px-3 text-right text-xs font-medium text-zinc-500">{region}</th>
                  <th className="py-2 px-3 text-right text-xs font-medium text-zinc-500">Global avg</th>
                  <th className="py-2 pl-3 text-right text-xs font-medium text-zinc-400">Delta</th>
                </tr>
              </thead>
              <tbody>
                {dimensionDeltas.map((d) => (
                  <tr key={d.key} className="border-b border-zinc-100">
                    <td className="py-2 pr-4 text-xs text-zinc-600">
                      <Link href={`/best-countries-for/${DIMENSION_SLUGS[d.key]}`} className="hover:text-teal-700 transition-colors">
                        {d.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-right text-xs tabular-nums text-zinc-900">
                      {Math.round(d.regionAvgDim ?? 0)}
                    </td>
                    <td className="py-2 px-3 text-right text-xs tabular-nums text-zinc-600">
                      {Math.round(d.globalAvgDim ?? 0)}
                    </td>
                    <td className={`py-2 pl-3 text-right text-xs tabular-nums ${d.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {d.delta >= 0 ? '+' : ''}{Math.round(d.delta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

        {regionPairs.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-medium text-zinc-900">
              Compare countries in {region}
            </h2>
            <div className="flex flex-wrap gap-2">
              {regionPairs.map((p) => (
                <Link
                  key={p.slug}
                  href={`/compare/${p.slug}`}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  {p.nameA} vs {p.nameB}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Other regions
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherRegions.map((r) => (
              <Link
                key={r}
                href={`/region/${REGION_SLUGS[r]}`}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                {r}
              </Link>
            ))}
          </div>
        </section>

        <FooterLinks />
      </main>
    </>
  );
}
