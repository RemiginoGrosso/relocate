import Link from 'next/link';

const SOURCES = [
  'OECD',
  'World Bank',
  'PISA',
  'Hofstede',
  'Global Peace Index',
  'WHO',
  'IMD',
  'Pew Research',
  'EF EPI',
  'Open-Meteo',
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-xl text-center">
          <h1 className="text-4xl font-medium tracking-tight text-zinc-900 sm:text-5xl">
            Where in the world should you live?
          </h1>
          <p className="mt-4 text-lg text-zinc-500">
            Set your priorities. See your ranking. Backed by 10 validated data
            sources.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="rounded-lg bg-teal-700 px-6 py-3 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
            >
              Find my ideal country
            </Link>
            <Link
              href="/ranking"
              className="rounded-lg border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Skip to ranking
            </Link>
          </div>
        </div>

        <div className="mt-16 max-w-lg">
          <p className="text-center text-xs text-zinc-400 mb-4">
            Built on institutional data from
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {SOURCES.map((src) => (
              <span key={src} className="text-xs text-zinc-400 opacity-50">
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-200 px-4 py-6 text-center">
        <p className="text-xs text-zinc-400">
          Relocator narrows the field. It does not make the decision.
        </p>
      </footer>
    </main>
  );
}
