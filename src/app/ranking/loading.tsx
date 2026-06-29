export default function RankingLoading() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:block lg:w-80 lg:shrink-0 lg:border-r lg:border-zinc-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-28 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="flex flex-col gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
                  <div className="h-4 w-6 animate-pulse rounded bg-zinc-100" />
                </div>
                <div className="h-2 w-full animate-pulse rounded-full bg-zinc-100" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-pulse rounded bg-zinc-100" />
                    <div className="h-8 w-8 animate-pulse rounded bg-zinc-100" />
                    <div className="h-5 w-32 animate-pulse rounded bg-zinc-200" />
                  </div>
                  <div className="h-7 w-14 animate-pulse rounded-full bg-zinc-100" />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
                      <div className="h-2 flex-1 animate-pulse rounded-full bg-zinc-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
