import { getScoreTier } from '@/lib/scoring';
import type { ScoreTier } from '@/lib/types';

const TIER_STYLES: Record<ScoreTier, string> = {
  excellent: 'bg-emerald-100 text-emerald-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-amber-100 text-amber-800',
  poor: 'bg-rose-100 text-rose-800',
};

const SIZE_STYLES = {
  sm: 'px-2.5 py-1 text-sm',
  lg: 'px-3.5 py-1.5 text-lg',
} as const;

export function ScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const tier = getScoreTier(score);
  return (
    <span
      className={`inline-flex items-center rounded-lg font-medium tabular-nums ${SIZE_STYLES[size]} ${TIER_STYLES[tier]}`}
    >
      {score.toFixed(1)}
    </span>
  );
}
