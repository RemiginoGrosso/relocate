import { DIMENSIONS } from '@/lib/constants';
import { DownloadCsvButton } from './DownloadCsvButton';
import { MethodologyTracker } from './MethodologyTracker';

export const metadata = {
  title: 'Methodology — Relocator',
  description: 'How Relocator scores 59 countries across 10 dimensions — formulas, data sources, and known limitations explained.',
  openGraph: {
    title: 'Methodology — Relocator',
    description: 'How Relocator scores 59 countries across 10 dimensions — formulas, data sources, and known limitations explained.',
  },
};

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
      <MethodologyTracker />
      <h1 className="text-3xl font-medium tracking-tight text-zinc-900">
        Methodology
      </h1>
      <p className="mt-4 text-zinc-500">
        Relocator ranks 59 countries across 10 data-driven dimensions. It
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
          automatically. Countries missing more than 3 dimensions are flagged
          as &quot;limited data.&quot; When a dimension has partial data (some
          but not all sources available), the available sources are reweighted
          proportionally. These scores are marked as limited data.
        </p>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <code className="text-sm text-zinc-700">
            composite = Σ (dimension_score × normalised_weight)
          </code>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium text-zinc-900">
          Normalisation
        </h2>
        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          All raw values are normalised to a 0–100 scale where higher is always
          better. For indices where a lower raw value is better (e.g., GPI,
          Pew restrictions), the scale is inverted. Min-max boundaries are set
          from observed data across the 59-country panel.
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
                  {dim.name}
                </h3>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
                  {dim.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{dim.description}</p>
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
          CSV of all normalised scores for all 59 countries. Use it for your
          own analysis.
        </p>
        <div className="mt-4">
          <DownloadCsvButton />
        </div>
      </section>

      <footer className="mt-16 border-t border-zinc-200 pt-6 pb-8 text-center">
        <p className="text-xs text-zinc-400">
          Relocator narrows the field. It does not make the decision.
        </p>
      </footer>
    </main>
  );
}
