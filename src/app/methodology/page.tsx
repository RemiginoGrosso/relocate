import type { Metadata } from 'next';
import Link from 'next/link';
import { DIMENSIONS, DIMENSION_SLUGS, TIE_THRESHOLD } from '@/lib/constants';
import type { Confidence } from '@/lib/types';

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: 'well',
  medium: 'reasonably, with gaps',
  low: 'roughly',
  no_data: 'not measured',
};
import { FooterLinks } from '@/components/seo/FooterLinks';
import { JsonLd } from '@/components/seo/JsonLd';
import { DownloadCsvButton } from './DownloadCsvButton';
import { MethodologyTracker } from './MethodologyTracker';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How Relocate Index scores 60 countries across 10 dimensions — formulas, data sources, and known limitations explained.',
  openGraph: {
    title: 'Methodology — Relocate Index',
    description: 'How Relocate Index scores 60 countries across 10 dimensions — formulas, data sources, and known limitations explained.',
    url: '/methodology',
  },
  alternates: { canonical: '/methodology' },
};

export const METHODOLOGY_FAQS = [
  {
    question: 'How does Relocate Index score countries?',
    answer: 'Each country receives a composite score calculated as a weighted sum of 10 dimension scores. The formula is: composite = Σ (dimension_score × normalised_weight). Users set the weights to match their priorities. Dimensions set to zero are excluded and remaining weights re-normalise automatically.',
  },
  {
    question: 'What are the 10 dimensions used to rank countries for relocation?',
    answer: 'Purchasing Power, Rule of Law, Safety, Warmth, School Culture, Healthcare, Infrastructure, Climate, Religious Freedom, and English Proficiency. Each dimension uses institutional data sources and is scored 0-100.',
  },
  {
    question: 'What data sources does Relocate Index use?',
    answer: 'World Bank (governance indicators, price levels, income per person, and UNODC homicide rates), Numbeo (crime as residents report it), OECD (health workforce and hospital beds, PISA 2022 school data), WHO (universal health coverage), IHME GBD (healthcare access and quality), Hofstede Insights and InterNations (warmth), IMD (infrastructure), Pew Research (religious freedom), EF EPI (English proficiency), and Open-Meteo (modelled climate data). The Global Peace Index is shown on country pages as context but is not scored.',
  },
  {
    question: 'How many countries does Relocate Index cover?',
    answer: '60 countries across all major world regions: Western Europe, Northern Europe, Southern Europe, Eastern Europe, North America, Latin America, East Asia, Southeast Asia, South Asia, Middle East, Oceania, and Africa.',
  },
  {
    question: 'How are country scores normalised?',
    answer: 'All raw values are converted to a 0-100 scale where higher is always better. For indices where a lower raw value is better (e.g., homicide rates, Pew restrictions), the scale is inverted. Each indicator has fixed bounds written into the method, so a score does not move just because another country was added. Homicide rates and income use a log scale, so going from 20 to 10 homicides per 100,000 counts as much as going from 2 to 1.',
  },
  {
    question: 'Is Relocate Index free to use?',
    answer: 'Yes. Relocate Index is completely free. All underlying data sources are publicly available from institutions like the World Bank, OECD, and WHO. There is no login wall, paywall, or premium tier.',
  },
  {
    question: 'How often is the data updated?',
    answer: 'Most underlying sources (World Bank, WHO, PISA, Pew) publish once a year or less often, so scores change rarely. Each country page shows the year of every value it uses. Scores are recomputed when a source publishes a new edition.',
  },
  {
    question: 'Can I download the raw data?',
    answer: 'Yes. A CSV export of all normalised scores for all 60 countries is available on the methodology page. Use it for your own analysis.',
  },
  {
    question: 'What is the difference between safety and rule of law?',
    answer: 'Safety measures crime: half from homicide rates (UNODC), half from how residents rate crime in their area (Numbeo). Rule of law measures institutions: whether courts and contracts work and how well corruption is controlled (World Bank governance indicators). A country can have low crime but weak institutions, or the reverse.',
  },
  {
    question: 'Why are some countries shown with limited data?',
    answer: 'When the missing dimensions account for more than 30% of your total weight budget, a country is moved to the "Limited data" section. Its partial score is shown, but it does not rank among countries with more complete data. This prevents countries with few data points from appearing artificially high or low.',
  },
  {
    question: 'What does the warmth dimension measure?',
    answer: 'Warmth captures how easily newcomers can build a social life and feel welcomed. It blends the Hofstede Indulgence vs Restraint score (cultural openness) with the InterNations Ease of Settling In survey (expat-reported experience). Both sources must be available for a country to receive a warmth score — 18 countries lack this data.',
  },
  {
    question: 'How does the climate scoring work?',
    answer: 'Climate is scored differently from other dimensions. You select a climate preference (tropical heat, sunny warm, four seasons, etc.) and countries are scored on how well their actual climate data matches that preference. Temperature, sunshine hours, and rainfall come from Open-Meteo\'s climate API, which serves modelled climate data rather than weather-station records. If you select "no preference," a simple heuristic score is used.',
  },
  {
    question: 'Why doesn\'t the index cover visa, tax, or job markets?',
    answer: 'Relocate Index narrows the field to a shortlist of candidate countries. Visa pathways, tax systems, housing costs, and job markets are highly personal — they depend on your nationality, profession, family situation, and income. These are best researched once you have a short list of 5-8 countries. The "What this tool does NOT cover" section lists what to research next.',
  },
  {
    question: 'How are missing dimensions handled?',
    answer: 'If a country has no data for a dimension, that dimension is excluded from its composite score. The remaining dimension weights re-normalise to sum to 1.0, so the score reflects only available data. The country receives a "Limited data" badge showing which dimensions are missing.',
  },
  {
    question: 'What does the healthcare score include?',
    answer: 'Healthcare uses a three-pillar formula: WHO Universal Health Coverage index (35%), IHME Healthcare Access and Quality index (35%), and healthcare capacity (30%). Capacity combines physicians per 1,000 (40%), hospital beds per 1,000 (35%), and nurses per 1,000 (25%). If some capacity data is missing, available sources are reweighted proportionally.',
  },
];

const NOT_COVERED = [
  'Visa and immigration pathways',
  'Housing costs and availability',
  'Tax systems and take-home pay',
  'Job market strength by industry',
  'Language courses and integration programmes',
];

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: METHODOLOGY_FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Methodology', item: `${BASE_URL}/methodology` },
        ],
      }} />
      <MethodologyTracker />
      <h1 className="text-3xl font-medium tracking-tight text-zinc-900">
        Methodology
      </h1>
      <p className="mt-4 text-zinc-500">
        Relocate Index ranks 60 countries across 10 data-driven dimensions. It
        narrows the field to a shortlist — it does not make the decision for
        you.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-medium text-zinc-900">
          Composite scoring
        </h2>
        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          Your composite score is a weighted sum of all dimension scores. Each
          slider weight is normalised so they sum to 1.0. Dimensions set to 0
          are excluded. If a country is missing data for a dimension, that
          dimension is excluded and the remaining weights re-normalise
          automatically. If the missing dimensions account for more than 30%
          of your total weight budget, that country is moved to a separate
          &quot;Limited data&quot; section below the main ranking — its partial
          score is still shown, but it won&apos;t rank above countries with
          more complete data. When a dimension has partial data (some
          but not all sources available), the available sources are reweighted
          proportionally.
        </p>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <code className="text-sm text-zinc-700">
            composite = Σ (dimension_score × normalised_weight)
          </code>
        </div>
        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          The data behind each score is approximate. Treat countries whose
          scores are within {TIE_THRESHOLD} points of each other as tied: the
          order between them is not meaningful.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium text-zinc-900">
          Normalisation
        </h2>
        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          All raw values are normalised to a 0–100 scale where higher is always
          better. For indices where a lower raw value is better (e.g., homicide
          rates, Pew restrictions), the scale is inverted. Each indicator has
          fixed bounds written into the method, so adding a country does not
          move anyone else&apos;s score. Homicide rates and income use a log
          scale.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium text-zinc-900">
          The 10 dimensions
        </h2>
        <div className="mt-6 flex flex-col gap-8">
          {DIMENSIONS.map((dim) => (
            <div
              key={dim.key}
              className="rounded-lg border border-zinc-200 px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-medium text-zinc-900">
                  <Link href={`/best-countries-for/${DIMENSION_SLUGS[dim.key]}`} className="hover:text-teal-700 transition-colors">
                    {dim.name}
                  </Link>
                </h3>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
                  {dim.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{dim.description}</p>
              <p className="mt-2 text-xs text-zinc-500">
                How well the data measures this:{' '}
                <span className="font-medium text-zinc-700">{CONFIDENCE_LABELS[dim.confidence]}</span>
              </p>
              <div className="mt-3 rounded bg-zinc-50 px-3 py-2">
                <code className="text-xs text-zinc-700 break-all">
                  {dim.methodology}
                </code>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {dim.sources.map((src) => (
                  <span
                    key={src}
                    className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-500"
                  >
                    {src}
                  </span>
                ))}
              </div>
              {dim.knownLimitation && (
                <p className="mt-3 text-xs text-zinc-400 italic">
                  {dim.knownLimitation}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium text-zinc-900">
          Context data — shown, never scored
        </h2>
        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          Some country pages show additional context rows that do not enter any
          score or ranking. Under Rule of Law these are: Cultural
          Tightness–Looseness (Gelfand 2011 / Uz 2015 — how strictly a society
          enforces social norms, a matter of personal fit rather than quality),
          Yale EPI Waste Management (waste infrastructure, strongly tied to
          national wealth), and the World Happiness Report&apos;s expected
          wallet return (perceived trust from the 2019 World Risk Poll, not a
          measured outcome). Under Warmth, Gallup&apos;s Migrant Acceptance
          Index plays the same role, and under Safety, the Global Peace Index
          (which mostly measures war, militarisation and politics). These rows exist to help you build your
          own picture of everyday life — they never move a country up or down
          the ranking.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium text-zinc-900">
          What this tool does NOT cover
        </h2>
        <p className="mt-3 text-sm text-zinc-600">
          Once you have your shortlist, here&apos;s what to research next:
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {NOT_COVERED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-600">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-lg border border-zinc-200 px-5 py-5">
        <h2 className="text-base font-medium text-zinc-900">
          Download raw data
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          CSV of all normalised scores for all 60 countries. Use it for your
          own analysis.
        </p>
        <div className="mt-4">
          <DownloadCsvButton />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium text-zinc-900">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-3">
          {METHODOLOGY_FAQS.map((faq, i) => (
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

      <footer className="mt-8 pb-8 text-center">
        <p className="text-xs text-zinc-400">
          Relocate Index narrows the field. It does not make the decision.
        </p>
      </footer>
    </main>
  );
}
