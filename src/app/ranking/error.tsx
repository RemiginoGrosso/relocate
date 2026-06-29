'use client';

export default function RankingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-medium text-zinc-900">
          Failed to load ranking data
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          There was a problem connecting to the database. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
