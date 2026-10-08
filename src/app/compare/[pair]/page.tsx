import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchAllCountryScores } from '@/lib/supabase';
import { DIMENSIONS, DIMENSION_SLUGS, DEFAULT_WEIGHTS, REGION_SLUGS, MIN_COVERAGE_RATIO, TIE_THRESHOLD } from '@/lib/constants';
import { computeComposite, normaliseWeights } from '@/lib/scoring';
import { generateComparisonPairs, findComparisonPair } from '@/lib/comparison-pairs';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { JsonLd } from '@/components/seo/JsonLd';
import { FooterLinks } from '@/components/seo/FooterLinks';
import type { CountryScores, DimensionKey, Region } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export const revalidate = 86400;
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ pair: string }>;
}

export async function generateStaticParams() {
  const countries = await fetchAllCountryScores();
  const pairs = generateComparisonPairs(countries);
  return pairs.map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair: slug } = await params;
  const countries = await fetchAllCountryScores();
  const match = findComparisonPair(slug, countries);
  if (!match) return { title: 'Not found' };

  const title = `${match.a.name} vs ${match.b.name} for Relocation ${new Date().getFullYear()}`;
  return {
    title,
    description: `Compare ${match.a.name} and ${match.b.name} across 10 relocation dimensions — purchasing power, safety, healthcare, climate, and more.`,
    openGraph: {
      title: `${title} — Relocate Index`,
      description: `Side-by-side relocation comparison of ${match.a.name} and ${match.b.name}.`,
      url: `/compare/${slug}`,
    },
    alternates: { canonical: `/compare/${slug}` },
  };
}

interface DimensionDelta {
  key: DimensionKey;
  name: string;
  scoreA: number | null;
  scoreB: number | null;
  delta: number | null;
  leader: 'a' | 'b' | 'tie' | 'none';
}

function computeDeltas(a: CountryScores, b: CountryScores): DimensionDelta[] {
  return DIMENSIONS.map((dim) => {
    const scoreA = a.dimensionScores[dim.key]?.score ?? null;
    const scoreB = b.dimensionScores[dim.key]?.score ?? null;
    let delta: number | null = null;
    let leader: 'a' | 'b' | 'tie' | 'none' = 'none';

    if (scoreA != null && scoreB != null) {
      delta = scoreA - scoreB;
      leader = delta > 0 ? 'a' : delta < 0 ? 'b' : 'tie';
    }

    return { key: dim.key, name: dim.name, scoreA, scoreB, delta, leader };
  });
}

export default async function ComparisonPage({ params }: PageProps) {
  const { pair: slug } = await params;
  const countries = await fetchAllCountryScores();
  const match = findComparisonPair(slug, countries);
  if (!match) notFound();

  const { a, b } = match;
  const normW = normaliseWeights(DEFAULT_WEIGHTS);
  const resultA = computeComposite(a, normW);
  const resultB = computeComposite(b, normW);
  const compositeA = resultA.score;
  const compositeB = resultB.score;
  const limitedA = resultA.coverageRatio < MIN_COVERAGE_RATIO;
  const limitedB = resultB.coverageRatio < MIN_COVERAGE_RATIO;
  const hasLimited = limitedA || limitedB;
  const deltas = computeDeltas(a, b);

  const aWins = deltas.filter((d) => d.leader === 'a');
  const bWins = deltas.filter((d) => d.leader === 'b');
  const biggestDelta = [...deltas].filter((d) => d.delta != null).sort((x, y) => Math.abs(y.delta!) - Math.abs(x.delta!))[0];

  const title = `${a.name} vs ${b.name} for Relocation ${new Date().getFullYear()}`;
  const regionSlug = REGION_SLUGS[a.region as Region];

  const limitedCaveat = hasLimited
    ? ` Note: ${limitedA && limitedB ? 'both countries have' : limitedA ? `${a.name} has` : `${b.name} has`} limited data coverage — composite scores are partial and may not be directly comparable.`
    : '';

  const faqItems = [
    {
      question: `Is ${a.name} or ${b.name} better for relocation?`,
      answer: (compositeA > compositeB
        ? `${a.name} scores ${compositeA.toFixed(1)} overall compared to ${b.name}'s ${compositeB.toFixed(1)} across 10 relocation dimensions. ${a.name} leads on ${aWins.length} dimensions while ${b.name} leads on ${bWins.length}.`
        : compositeB > compositeA
          ? `${b.name} scores ${compositeB.toFixed(1)} overall compared to ${a.name}'s ${compositeA.toFixed(1)} across 10 relocation dimensions. ${b.name} leads on ${bWins.length} dimensions while ${a.name} leads on ${aWins.length}.`
          : `${a.name} and ${b.name} are tied at ${compositeA.toFixed(1)} overall. ${a.name} leads on ${aWins.length} dimensions while ${b.name} leads on ${bWins.length}.`) + limitedCaveat,
    },
    {
      question: `Which is safer, ${a.name} or ${b.name}?`,
      answer: (() => {
        const safetyA = a.dimensionScores.safety?.score;
        const safetyB = b.dimensionScores.safety?.score;
        if (safetyA != null && safetyB != null) {
          const safer = Math.abs(safetyA - safetyB) < TIE_THRESHOLD ? 'Both' : safetyA > safetyB ? a.name : b.name;
          return `${safer === 'Both' ? 'They are effectively tied' : `${safer} scores higher`} on safety: ${a.name} ${Math.round(safetyA)} vs ${b.name} ${Math.round(safetyB)}, based on homicide rates (UNODC) and residents' crime reports (Numbeo).`;
        }
        return `Safety data is not available for both countries.`;
      })(),
    },
    {
      question: `What is the biggest difference between ${a.name} and ${b.name}?`,
      answer: biggestDelta
        ? `The largest gap is in ${biggestDelta.name.toLowerCase()}: ${biggestDelta.leader === 'a' ? a.name : b.name} scores ${Math.abs(Math.round(biggestDelta.delta!))} points higher (${biggestDelta.leader === 'a' ? Math.round(biggestDelta.scoreA!) : Math.round(biggestDelta.scoreB!)} vs ${biggestDelta.leader === 'a' ? Math.round(biggestDelta.scoreB!) : Math.round(biggestDelta.scoreA!)}).`
        : `Insufficient data to determine the biggest difference.`,
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
          { '@type': 'ListItem', position: 3, name: `${a.name} vs ${b.name}`, item: `${BASE_URL}/compare/${slug}` },
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
          <span className="text-zinc-900">{a.name} vs {b.name}</span>
        </nav>

        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-4">
          {title}
        </h1>

        <p className="text-sm leading-relaxed text-zinc-600 mb-2">
          {a.name} scores {compositeA.toFixed(1)} overall
          {compositeA !== compositeB && <> vs {b.name}&apos;s {compositeB.toFixed(1)}</>}.
          {aWins.length > 0 && <> {a.name} leads on {aWins.map((d) => d.name.toLowerCase()).join(', ')}.</>}
          {bWins.length > 0 && <> {b.name} leads on {bWins.map((d) => d.name.toLowerCase()).join(', ')}.</>}
        </p>
        {hasLimited && (
          <p className="text-xs text-amber-700 mb-2">
            {limitedA && limitedB ? 'Both countries have' : limitedA ? `${a.name} has` : `${b.name} has`} limited data coverage — composite scores are partial.
          </p>
        )}
        <p className="text-xs text-zinc-400 mb-8">
          Both countries are in {a.region}.
          {regionSlug && <> <Link href={`/region/${regionSlug}`} className="text-teal-700 hover:text-teal-900 transition-colors">See all countries in {a.region}</Link>.</>}
        </p>

        <section>
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Score comparison
          </h2>

          <div className="flex gap-4 mb-6">
            <Link href={`/country/${a.iso.toLowerCase()}`} className="flex-1 rounded-lg border border-zinc-200 p-4 text-center hover:bg-zinc-50 transition-colors">
              <span className="text-2xl block mb-1">{a.flagEmoji}</span>
              <p className="text-sm font-medium text-zinc-900">{a.name}</p>
              <p className="text-2xl font-medium text-zinc-900 mt-1">{compositeA.toFixed(1)}</p>
            </Link>
            <Link href={`/country/${b.iso.toLowerCase()}`} className="flex-1 rounded-lg border border-zinc-200 p-4 text-center hover:bg-zinc-50 transition-colors">
              <span className="text-2xl block mb-1">{b.flagEmoji}</span>
              <p className="text-sm font-medium text-zinc-900">{b.name}</p>
              <p className="text-2xl font-medium text-zinc-900 mt-1">{compositeB.toFixed(1)}</p>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-2 pr-4 text-left text-xs font-medium text-zinc-500">Dimension</th>
                  <th className="py-2 px-3 text-right text-xs font-medium text-zinc-500">{a.name}</th>
                  <th className="py-2 px-3 text-right text-xs font-medium text-zinc-500">{b.name}</th>
                  <th className="py-2 pl-3 text-right text-xs font-medium text-zinc-400">Delta</th>
                </tr>
              </thead>
              <tbody>
                {deltas.map((d) => (
                  <tr key={d.key} className="border-b border-zinc-100">
                    <td className="py-2 pr-4 text-xs text-zinc-600">
                      <Link href={`/best-countries-for/${DIMENSION_SLUGS[d.key]}`} className="hover:text-teal-700 transition-colors">
                        {d.name}
                      </Link>
                    </td>
                    <td className={`py-2 px-3 text-right text-xs tabular-nums ${d.leader === 'a' ? 'font-medium text-zinc-900' : 'text-zinc-600'}`}>
                      {d.scoreA != null ? Math.round(d.scoreA) : '—'}
                    </td>
                    <td className={`py-2 px-3 text-right text-xs tabular-nums ${d.leader === 'b' ? 'font-medium text-zinc-900' : 'text-zinc-600'}`}>
                      {d.scoreB != null ? Math.round(d.scoreB) : '—'}
                    </td>
                    <td className={`py-2 pl-3 text-right text-xs tabular-nums ${
                      d.delta == null ? 'text-zinc-300' :
                      d.delta > 0 ? 'text-emerald-700' :
                      d.delta < 0 ? 'text-rose-700' : 'text-zinc-400'
                    }`}>
                      {d.delta != null ? `${d.delta > 0 ? '+' : ''}${Math.round(d.delta)}` : '—'}
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

        <FooterLinks />
      </main>
    </>
  );
}
