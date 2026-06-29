'use client';

import Link from 'next/link';

export default function CountryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-medium text-zinc-900">
          Failed to load country data
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          There was a problem loading this country&apos;s details.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/ranking"
            className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Back to ranking
          </Link>
        </div>
      </div>
    </div>
  );
}
