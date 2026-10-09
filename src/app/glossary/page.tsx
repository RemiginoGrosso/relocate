import type { Metadata } from 'next';
import Link from 'next/link';
import { DIMENSION_SLUGS } from '@/lib/constants';
import { JsonLd } from '@/components/seo/JsonLd';
import { FooterLinks } from '@/components/seo/FooterLinks';
import type { DimensionKey } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export const metadata: Metadata = {
  title: 'Glossary',
  description: 'Plain-language definitions of the indices and data sources Relocate Index uses to score countries for relocation — UHC, HAQ, UNODC, PPP, PISA, WGI, and more.',
  openGraph: {
    title: 'Glossary — Relocate Index',
    description: 'Plain-language definitions of the indices and data sources Relocate Index uses to score countries for relocation.',
    url: '/glossary',
  },
  alternates: { canonical: '/glossary' },
};

interface GlossaryTerm {
  term: string;
  definition: string;
  dimensionKey: DimensionKey;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'EF EPI (EF English Proficiency Index)',
    definition: 'How well adults in a country speak English as a second language, based on standardised test results from EF Education First. Used to score English proficiency for non-native English speakers relocating abroad.',
    dimensionKey: 'english_proficiency',
  },
  {
    term: 'GPI (Global Peace Index)',
    definition: "Measures a country's peacefulness based on conflict, political instability, and militarisation. Lower scores mean more peaceful. Produced annually by the Institute for Economics and Peace. Shown on country pages as context only: it is not part of the safety score, because it mostly measures war, militarisation and politics rather than everyday crime.",
    dimensionKey: 'safety',
  },
  {
    term: 'HAQ (Healthcare Access and Quality Index)',
    definition: 'How well a health system actually treats preventable and treatable conditions, based on amenable mortality data across 32 causes rather than spending levels. Published by IHME as part of the Global Burden of Disease study.',
    dimensionKey: 'healthcare',
  },
  {
    term: 'Hofstede IVR (Indulgence vs. Restraint)',
    definition: 'How much a culture values leisure, fun, and personal freedom versus social restraint and strict norms. One of Hofstede Insights\' six cultural dimensions, static since 2010. Combined with InterNations survey data to score warmth.',
    dimensionKey: 'warmth',
  },
  {
    term: 'World Bank Logistics Performance Index (LPI)',
    definition: 'A World Bank survey in which freight professionals rate the quality of a country\'s trade and transport infrastructure (ports, railways, roads, IT) from 1 to 5. Half of the infrastructure score. The latest edition is from 2023.',
    dimensionKey: 'infrastructure',
  },
  {
    term: 'ITU internet use and fixed broadband',
    definition: 'The share of people using the internet and the number of fixed broadband subscriptions per 100 people, collected by the International Telecommunication Union and published by the World Bank. Together they make the other half of the infrastructure score.',
    dimensionKey: 'infrastructure',
  },
  {
    term: 'InterNations Ease of Settling In',
    definition: 'How easy expats report it is to settle in, make local friends, and feel at home, based on surveys of roughly 260 respondents per country. Lower rank means easier settling in. Required alongside Hofstede IVR to produce a warmth score — no fallback if either is missing.',
    dimensionKey: 'warmth',
  },
  {
    term: 'Numbeo Crime Index',
    definition: 'A crowdsourced measure of crime perception, based on surveys about safety walking alone at night and worry about property crime. Half of the Safety score, alongside UNODC homicide rates. Sample sizes vary by country.',
    dimensionKey: 'safety',
  },
  {
    term: 'Open-Meteo',
    definition: "A free weather data service. Relocate Index uses its climate API, which serves modelled climate data (the EC-Earth3P-HR model) rather than weather-station records, to score how well a country's typical weather matches your selected climate preference.",
    dimensionKey: 'climate',
  },
  {
    term: 'PISA (Programme for International Student Assessment)',
    definition: "The OECD's triennial assessment of 15-year-olds' reading, maths, and science ability, extended here with survey questions on school belonging, bullying, and safety. The 2022 edition is the latest scored; 2025 results are expected late 2026 or early 2027.",
    dimensionKey: 'school_culture',
  },
  {
    term: 'PPP (Purchasing Power Parity)',
    definition: "A way to compare prices and incomes across countries. Relocate Index uses two World Bank measures built on it: the price level ratio (how expensive a country is compared with the US), which scores purchasing power for income from abroad, and GDP per person adjusted for local prices, which scores it for a local salary.",
    dimensionKey: 'purchasing_power',
  },
  {
    term: 'UHC (Universal Health Coverage Index)',
    definition: 'The share of essential health services effectively covered for a population, published by the WHO. A score of 100 means full coverage. One of three pillars in the healthcare formula, alongside HAQ and capacity.',
    dimensionKey: 'healthcare',
  },
  {
    term: 'UNODC Intentional Homicides',
    definition: 'Murders per 100,000 people per year, compiled by the United Nations Office on Drugs and Crime and published by the World Bank. The hardest crime statistic available across countries, because a homicide is rarely unrecorded. Half of the Safety score, alongside the Numbeo Crime Index.',
    dimensionKey: 'safety',
  },
  {
    term: 'WGI (Worldwide Governance Indicators)',
    definition: "The World Bank's Rule of Law and Control of Corruption indicators — how much people trust and follow society's rules, and how well public power is kept in check. The only source of the Rule of Law dimension.",
    dimensionKey: 'civic_culture',
  },
  {
    term: 'Yale EPI (Environmental Performance Index)',
    definition: "Yale's Environmental Performance Index waste management score, shown as context under the Rule of Law dimension on country pages. It reflects waste and recycling infrastructure quality, which is strongly tied to national wealth. Shown for context only — it never affects any score or ranking.",
    dimensionKey: 'civic_culture',
  },
];

export default function GlossaryPage() {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Glossary', item: `${BASE_URL}/glossary` },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: 'Relocate Index Glossary',
        description: 'Definitions of indices and data sources used to score countries for relocation.',
        hasDefinedTerm: GLOSSARY_TERMS.map((t) => ({
          '@type': 'DefinedTerm',
          name: t.term,
          description: t.definition,
          url: `${BASE_URL}/best-countries-for/${DIMENSION_SLUGS[t.dimensionKey]}`,
        })),
      }} />

      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <nav className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-900">Glossary</span>
        </nav>

        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-4">
          Glossary
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 mb-10">
          Plain-language definitions of the indices, surveys, and data sources behind Relocate
          Index scoring. Each term links to the dimension page where it is used.
        </p>

        <dl className="space-y-6">
          {GLOSSARY_TERMS.map((t) => (
            <div key={t.term} className="rounded-lg border border-zinc-200 px-5 py-4">
              <dt className="text-base font-medium text-zinc-900">{t.term}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-600">{t.definition}</dd>
              <dd className="mt-3">
                <Link
                  href={`/best-countries-for/${DIMENSION_SLUGS[t.dimensionKey]}`}
                  className="text-sm text-teal-700 hover:text-teal-900 transition-colors"
                >
                  See countries ranked by this dimension
                </Link>
              </dd>
            </div>
          ))}
        </dl>

        <FooterLinks />
      </main>
    </>
  );
}
