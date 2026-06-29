export default function CountryLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-zinc-100" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded bg-zinc-100" />
          <div>
            <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
            <div className="mt-1 h-4 w-36 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
        <div className="h-10 w-16 animate-pulse rounded-lg bg-zinc-100" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-6">
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 mb-4" />
          <div className="h-64 w-full animate-pulse rounded bg-zinc-50" />
        </div>
        <div>
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-200 mb-4" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3"
              >
                <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
                <div className="h-6 w-12 animate-pulse rounded-full bg-zinc-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
