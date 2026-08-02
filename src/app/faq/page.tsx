import type { Metadata } from 'next';
import Link from 'next/link';
import { METHODOLOGY_FAQS } from '@/app/methodology/page';
import { JsonLd } from '@/components/seo/JsonLd';
import { FooterLinks } from '@/components/seo/FooterLinks';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about Relocate Index — how scoring works, what data is used, and how to find the right country for relocation.',
  openGraph: {
    title: 'Frequently Asked Questions — Relocate Index',
    description: 'Answers to common questions about Relocate Index — how scoring works, what data is used, and how to find the right country for relocation.',
    url: '/faq',
  },
  alternates: { canonical: '/faq' },
};

const GENERAL_FAQS = [
  {
    question: 'What is Relocate Index?',
    answer: 'Relocate Index is a free tool that ranks 60 countries across 10 weighted dimensions — purchasing power, safety, healthcare, climate, and more — to help you narrow down where to relocate. It uses public institutional data and does not require login or payment. See the full ranking at /ranking.',
  },
  {
    question: 'How do I compare two countries side by side?',
    answer: 'Use the comparison tool at /compare to see up to 3 countries side by side with a radar chart and per-dimension delta table. You can also browse pre-built comparisons for countries in the same region, such as country-vs-country pages linked from each country\'s detail page.',
  },
  {
    question: 'Which countries score highest overall?',
    answer: 'The full ranking at /ranking shows all 60 countries sorted by composite score using default equal weights. You can adjust the weight sliders to match your own priorities — the ranking recalculates instantly.',
  },
  {
    question: 'What if I care about one dimension more than others?',
    answer: 'Browse dimension-specific rankings under "Explore by dimension" below, such as the safest countries to live in or the best countries for healthcare. Each page ranks all 60 countries by that single dimension and links to country detail for more context.',
  },
  {
    question: 'Does Relocate Index cover every country in the world?',
    answer: 'No — it covers 60 countries across 12 world regions, selected for data availability across all 10 dimensions. Browse countries by region to see coverage for a specific part of the world, such as Western Europe or Southeast Asia.',
  },
  {
    question: 'What do the technical terms and acronyms mean?',
    answer: 'See the glossary for plain-language definitions of terms like UHC, HAQ, GPI, PPP, PISA, and other indices used throughout Relocate Index scoring.',
  },
  {
    question: 'Can I see the data behind a specific country?',
    answer: 'Yes. Every country has its own detail page showing dimension scores, underlying raw indicator values, source links, and a plain-language summary. Search for a country from the ranking page or visit its page directly, e.g. /country/de for Germany.',
  },
];

const ALL_FAQS = [...GENERAL_FAQS, ...METHODOLOGY_FAQS];

export default function FaqPage() {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${BASE_URL}/faq` },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ALL_FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }} />

      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <nav className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-900">FAQ</span>
        </nav>

        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 mb-10">
          Common questions about how Relocate Index works, what data it uses, and how to use it to
          narrow your relocation shortlist.
        </p>

        <section>
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Using Relocate Index
          </h2>
          <div className="space-y-3">
            {GENERAL_FAQS.map((faq, i) => (
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

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Methodology and scoring
          </h2>
          <div className="space-y-3">
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
          <p className="mt-4 text-sm">
            <Link href="/methodology" className="text-teal-700 hover:text-teal-900 transition-colors">
              Read the full methodology
            </Link>
          </p>
        </section>

        <FooterLinks />
      </main>
    </>
  );
}
