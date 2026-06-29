'use client';

import { DIMENSIONS } from '@/lib/constants';
import type { UserWeights } from '@/lib/types';

interface WeightSummaryProps {
  weights: UserWeights;
  onContinue: () => void;
  onAdjust: () => void;
}

export function WeightSummary({ weights, onContinue, onAdjust }: WeightSummaryProps) {
  const maxWeight = Math.max(...Object.values(weights));

  const sorted = [...DIMENSIONS].sort(
    (a, b) => weights[b.key] - weights[a.key],
  );

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-medium tracking-tight text-zinc-900">
          Your priorities
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Based on your answers, here&apos;s what matters most to you.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-3">
        {sorted.map((dim) => {
          const w = weights[dim.key];
          const pct = maxWeight > 0 ? (w / maxWeight) * 100 : 0;
          return (
            <div key={dim.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">{dim.name}</span>
                <span className="text-xs tabular-nums text-zinc-400">
                  {w === 0 ? 'Excluded' : w}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-teal-700 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={onContinue}
          className="w-full rounded-lg bg-teal-700 px-5 py-3 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          See my ranking
        </button>
        <button
          onClick={onAdjust}
          className="w-full text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Adjust weights manually first
        </button>
      </div>
    </div>
  );
}
