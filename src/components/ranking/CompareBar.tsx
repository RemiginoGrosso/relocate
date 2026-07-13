'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useCompareStore } from '@/stores/useCompareStore';
import type { CountryScores } from '@/lib/types';

interface CompareBarProps {
  countries: CountryScores[];
}

export function CompareBar({ countries }: CompareBarProps) {
  const router = useRouter();
  const { compareIsos, removeCompare, clearCompare } = useCompareStore();

  if (compareIsos.length === 0) return null;

  const selected = compareIsos
    .map((iso) => countries.find((c) => c.iso.toUpperCase() === iso))
    .filter(Boolean) as CountryScores[];

  function handleCompare() {
    const params = compareIsos.map((iso) => iso.toLowerCase()).join(',');
    router.push(`/compare?countries=${params}`);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 hidden border-t border-zinc-200 bg-white px-4 py-3 shadow-lg lg:block lg:left-80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {selected.map((c) => (
            <span
              key={c.iso}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
            >
              <span>{c.flagEmoji}</span>
              <span className="hidden sm:inline">{c.name}</span>
              <button
                onClick={() => removeCompare(c.iso)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200"
                aria-label={`Remove ${c.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={clearCompare}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            Clear
          </button>
          <button
            onClick={handleCompare}
            disabled={compareIsos.length < 2}
            className="rounded-md bg-teal-700 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compare{compareIsos.length >= 2 ? ` (${compareIsos.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
