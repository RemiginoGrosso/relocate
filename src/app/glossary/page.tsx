import type { Metadata } from 'next';
import Link from 'next/link';
import { DIMENSION_SLUGS } from '@/lib/constants';
import { JsonLd } from '@/components/seo/JsonLd';
import { FooterLinks } from '@/components/seo/FooterLinks';
import type { DimensionKey } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export const metadata: Metadata = {
  title: 'Glossary',
  description: 'Plain-language definitions of the indices and data sources Relocate Index uses to score countries for relocation — UHC, HAQ, GPI, PPP, PISA, WGI, and more.',
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
    definition: "Measures a country's peacefulness based on conflict, political instability, and militarisation. Lower scores mean more peaceful. Produced annually by the Institute for Economics and Peace, and the sole source for the safety dimension.",
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
    term: 'IMD (International Institute for Management Development)',
    definition: "A composite score of transport, energy, telecoms, and digital infrastructure quality from IMD's World Competitiveness rankings, built from 300+ indicators per country. Covers around 60 countries.",
    dimensionKey: 'infrastructure',
  },
  {
    term: 'InterNations Ease of Settling In',
    definition: 'How easy expats report it is to settle in, make local friends, and feel at home, based on surveys of roughly 260 respondents per country. Lower rank means easier settling in. Required alongside Hofstede IVR to produce a warmth score — no fallback if either is missing.',
    dimensionKey: 'warmth',
  },
  {
    term: 'Numbeo Crime Index',
    definition: 'A crowdsourced measure of crime perception, based on surveys about safety walking alone at night and worry about property crime. Provides the street-level safety component of the Rule of Law dimension.',
    dimensionKey: 'civic_culture',
  },
  {
    term: 'Open-Meteo ERA5',
    definition: "A global weather reanalysis dataset combining historical observations and modelling to produce consistent temperature, rainfall, and sunshine data back to 1940. Relocate Index uses ERA5 climate normals to score how well a country's actual weather matches your selected climate preference.",
    dimensionKey: 'climate',
  },
  {
    term: 'PISA (Programme for International Student Assessment)',
    definition: "The OECD's triennial assessment of 15-year-olds' reading, maths, and science ability, extended here with survey questions on school belonging, bullying, and safety. The 2022 edition is the latest scored; 2025 results are expected late 2026 or early 2027.",
    dimensionKey: 'school_culture',
  },
  {
    term: 'PPP (Purchasing Power Parity)',
    definition: "How much a basket of goods and services costs relative to the OECD average, using World Bank and OECD price-level data. Higher purchasing power means your money buys more day-to-day, regardless of your salary.",
    dimensionKey: 'purchasing_power',
  },
  {
    term: 'UHC (Universal Health Coverage Index)',
    definition: 'The share of essential health services effectively covered for a population, published by the WHO. A score of 100 means full coverage. One of three pillars in the healthcare formula, alongside HAQ and capacity.',
    dimensionKey: 'healthcare',
  },
  {
    term: 'WGI (Worldwide Governance Indicators)',
    definition: "The World Bank's Rule of Law and Control of Corruption indicators — how much people trust and follow society's rules, and how well public power is kept in check. Combined with the Numbeo Crime Index to form the Rule of Law dimension.",
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
