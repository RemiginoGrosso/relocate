import type { Metadata } from 'next';
import Link from 'next/link';
import { DIMENSIONS } from '@/lib/constants';
import { JsonLd } from '@/components/seo/JsonLd';
import { CtaButtons } from '@/components/landing/CtaButtons';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Relocate Index — Find your ideal country',
  description:
    'Rank 60 countries across 10 data-driven dimensions. Set your priorities, see your ranking. Built on public institutional data from OECD, World Bank, and WHO.',
  openGraph: {
    title: 'Relocate Index — Find your ideal country',
    description: 'Rank 60 countries across 10 data-driven dimensions. Set your priorities. See your ranking.',
    url: '/',
  },
  alternates: { canonical: '/' },
};

// Source trust bar (hero) — names only, low opacity
const SOURCE_NAMES = [
  'OECD',
  'World Bank',
  'WHO',
  'Global Peace Index',
  'PISA 2022',
  'Hofstede',
  'InterNations',
  'IMD',
  'Pew Research',
  'EF EPI',
  'Open-Meteo',
];

// Sources with descriptions for the trust section
const SOURCES_DETAIL = [
  { name: 'OECD', note: 'Purchasing power parity, PISA education data' },
  { name: 'World Bank', note: 'Governance indicators, rule of law, price levels' },
  { name: 'WHO', note: 'Healthcare coverage index (UHC). Out-of-pocket data used in purchasing power.' },
  { name: 'Global Peace Index', note: 'Safety, conflict risk, political stability' },
  { name: 'PISA 2022', note: 'Academic quality, belonging, bullying, school safety' },
  { name: 'Hofstede Insights', note: 'Indulgence vs. Restraint (IVR) cultural dimension' },
  { name: 'InterNations', note: 'Expat ease of settling in, rated annually' },
  { name: 'IMD', note: 'Physical and digital infrastructure score' },
  { name: 'Pew Research', note: 'Government restrictions and social hostility indexes' },
  { name: 'EF EPI', note: 'Population-level English proficiency, 100+ countries' },
  { name: 'Open-Meteo ERA5', note: 'Historical climate reanalysis — temperature, sunshine, and rainfall by city' },
];

const CATEGORY_LABELS: Record<string, string> = {
  economic: 'Economic',
  social: 'Social',
  safety: 'Safety',
  lifestyle: 'Lifestyle',
  identity: 'Identity',
};

const STEPS = [
  {
    number: '1',
    title: 'Answer 6 questions about your priorities',
    description:
      'The questions surface dimensions you may not have considered — civic culture, warmth, school environment, religious freedom. The tool educates before it ranks.',
  },
  {
    number: '2',
    title: 'Get a ranked list of 60 countries',
    description:
      'Your weights drive the ranking. Every score traces to an institutional data source. We have no editorial view on which country is best.',
  },
  {
    number: '3',
    title: 'Explore and adjust in real time',
    description:
      'Move any slider to re-rank instantly. Open a country to see its full dimension breakdown, data sources, and the exact formula behind each score.',
  },
];

const NOT_THIS = [
  'Visa advice or immigration guidance',
  'Tax planning or financial advice',
  'City-level data outside of climate — country averages for all other dimensions',
  'A final decision — a shortlist of candidates worth investigating further',
  'A match score or compatibility percentage',
  'Comprehensive liveability coverage — each of the 10 dimensions covers one angle',
];

export default function Home() {
  const email = ['info', 'relocateindex.com'].join('@');

  return (
    <main className="flex min-h-screen flex-col">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://relocateindex.com' },
        ],
      }} />
      {/* Minimal nav — Header returns null on "/" so we render our own */}
      <header className="border-b border-zinc-200 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={24} height={24} className="rounded-full" />
            Relocate Index
          </span>
          <Link
            href="/methodology"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Methodology
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-medium tracking-tight text-zinc-900 sm:text-4xl">
            Where in the world should you live?
          </h1>
          <p className="mt-5 text-base text-zinc-500 sm:text-lg">
            Most relocation research starts and ends with cost of living. Relocate Index
            surfaces 9 other dimensions — so you rank countries by what actually
            matters to you, not just what is easy to Google.
          </p>
          <CtaButtons />
        </div>

        {/* Trust bar */}
        <div className="mx-auto mt-16 max-w-xl">
          <p className="text-center text-xs text-zinc-400">
            Built on institutional data from
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {SOURCE_NAMES.map((src) => (
              <span key={src} className="text-xs text-zinc-400 opacity-50">
                {src}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-medium tracking-tight text-zinc-900">
            How it works
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            From &ldquo;I&rsquo;m thinking about relocating&rdquo; to a shortlist worth
            researching — three steps.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700 text-xs font-medium text-teal-700">
                  {step.number}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{step.title}</p>
                  <p className="mt-2 text-sm text-zinc-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10 DIMENSIONS ── */}
      <section className="border-t border-zinc-200 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-medium tracking-tight text-zinc-900">
            10 dimensions, every score traceable
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Each dimension is a weighted composite of institutional indices. You set
            the weights. Slider to zero excludes a dimension entirely.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((dim) => (
              <Card key={dim.key} size="sm">
                <CardHeader>
                  <CardTitle>{dim.name}</CardTitle>
                  <CardDescription>{dim.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {dim.sources.join(' · ')}
                    </p>
                    <span className="shrink-0 rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">
                      {CATEGORY_LABELS[dim.category]}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY TRUST THIS ── */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-medium tracking-tight text-zinc-900">
            Built on institutional data
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Every score traces to a public, peer-reviewed, or government-issued
            source. No editorial opinion. No proprietary black boxes. All sources are
            free and updated annually.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES_DETAIL.map((src) => (
              <div
                key={src.name}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-zinc-900">{src.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{src.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT THIS IS NOT ── */}
      <section className="border-t border-zinc-200 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-zinc-900">
                What this tool is not
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Being clear about limits is part of the product. Relocate Index narrows the
                field. It does not make the decision.
              </p>
              <ul className="mt-6 space-y-3">
                {NOT_THIS.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-zinc-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
              <p className="text-sm font-medium text-zinc-900">
                What you leave with
              </p>
              <p className="mt-3 text-sm text-zinc-500">
                A shortlist of 5 to 8 candidate countries ranked by your actual
                priorities — not cost of living alone, not a publisher&rsquo;s opinion. From
                here: visa research, housing search, boots on the ground.
              </p>
              <p className="mt-4 text-sm text-zinc-500">
                Every score is traceable. If a dimension&rsquo;s weight does not fit your
                situation, adjust it. If you want to understand a formula, the
                methodology page explains every calculation in plain language.
              </p>
              <Link
                href="/methodology"
                className="mt-6 inline-block text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
              >
                Read the methodology &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto border-t border-zinc-200 px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-400">
            Relocate Index narrows the field. It does not make the decision.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
            <span className="text-xs text-zinc-300">·</span>
            <Link
              href="/methodology"
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-600"
            >
              Methodology
            </Link>
            <span className="text-xs text-zinc-300">·</span>
            <a
              href={`mailto:${email}`}
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-600"
            >
              {email}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
