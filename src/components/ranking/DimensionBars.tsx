import type { DimensionKey, DimensionScore, UserWeights } from '@/lib/types';
import { DIMENSIONS } from '@/lib/constants';

const BAR_COLORS = [
  'bg-teal-700',
  'bg-zinc-700',
  'bg-zinc-500',
  'bg-zinc-300',
];

interface DimensionBarsProps {
  dimensionScores: Partial<Record<DimensionKey, DimensionScore>>;
  weights: UserWeights;
  count?: number;
}

export function DimensionBars({ dimensionScores, weights, count = 4 }: DimensionBarsProps) {
  const allActiveEntries = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a);

  const totalActive = allActiveEntries.length;
  const activeKeys = allActiveEntries.slice(0, count).map(([k]) => k as DimensionKey);
  const remaining = totalActive - activeKeys.length;

  return (
    <div className="flex flex-col gap-1.5">
      {activeKeys.length > 0 && (
        <span className="text-xs text-zinc-400">Your top priorities</span>
      )}
      {activeKeys.map((key, i) => {
        const dim = DIMENSIONS.find((d) => d.key === key);
        const score = dimensionScores[key]?.score;
        if (score == null || !dim) return null;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-16 truncate text-xs text-zinc-500">
              {dim.name.split(' ')[0]}
            </span>
            <div className="h-2 flex-1 rounded-full bg-zinc-100">
              <div
                className={`h-2 rounded-full ${BAR_COLORS[i] ?? BAR_COLORS[3]}`}
                style={{ width: `${Math.max(score, 2)}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs tabular-nums text-zinc-500">
              {Math.round(score)}
            </span>
          </div>
        );
      })}
      {remaining > 0 && (
        <span className="text-xs text-zinc-400">+{remaining} more</span>
      )}
    </div>
  );
}
