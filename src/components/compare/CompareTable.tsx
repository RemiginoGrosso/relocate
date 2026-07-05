'use client';

import { DIMENSIONS } from '@/lib/constants';
import { computeComposite, normaliseWeights } from '@/lib/scoring';
import type { CountryScores, UserWeights } from '@/lib/types';

const COLORS = ['text-teal-700', 'text-indigo-600', 'text-amber-600'];

interface CompareTableProps {
  countries: CountryScores[];
  weights: UserWeights;
}

function formatScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return Math.round(score).toString();
}

export function CompareTable({ countries, weights }: CompareTableProps) {
  const normWeights = normaliseWeights(weights);
  const composites = countries.map((c) => computeComposite(c, normWeights).score);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="py-2 pr-4 text-left text-xs font-medium text-zinc-500">
              Dimension
            </th>
            {countries.map((c, i) => (
              <th
                key={c.iso}
                className={`py-2 px-3 text-right text-xs font-medium ${COLORS[i]}`}
              >
                <span className="mr-1">{c.flagEmoji}</span>
                {c.name}
              </th>
            ))}
            {countries.length > 1 && (
              <th className="py-2 pl-3 text-right text-xs font-medium text-zinc-400">
                Delta
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-zinc-300 bg-zinc-50">
            <td className="py-2.5 pr-4 text-xs font-semibold text-zinc-900">
              Composite
            </td>
            {composites.map((score, i) => {
              const best = Math.max(...composites);
              const isBest = score === best;
              return (
                <td
                  key={countries[i].iso}
                  className={`py-2.5 px-3 text-right tabular-nums ${isBest ? 'font-semibold text-zinc-900' : 'text-zinc-600'}`}
                >
                  {score.toFixed(1)}
                </td>
              );
            })}
            {countries.length > 1 && (
              <td className="py-2.5 pl-3 text-right text-xs tabular-nums text-zinc-400">
                {(Math.max(...composites) - Math.min(...composites)).toFixed(1)}
              </td>
            )}
          </tr>
          {DIMENSIONS.map((dim) => {
            const scores = countries.map(
              (c) => c.dimensionScores[dim.key]?.score ?? null,
            );
            const numericScores = scores.filter((s): s is number => s != null);
            const best = numericScores.length > 0 ? Math.max(...numericScores) : null;
            const worst = numericScores.length > 0 ? Math.min(...numericScores) : null;
            const delta = best != null && worst != null ? best - worst : null;
            const weight = weights[dim.key];

            if (weight === 0) return null;

            return (
              <tr key={dim.key} className="border-b border-zinc-100">
                <td className="py-2 pr-4 text-xs text-zinc-600">{dim.name}</td>
                {scores.map((score, i) => {
                  const isBest = score != null && score === best && numericScores.length > 1;
                  return (
                    <td
                      key={countries[i].iso}
                      className={`py-2 px-3 text-right tabular-nums text-xs ${isBest ? 'font-semibold text-zinc-900' : 'text-zinc-600'}`}
                    >
                      {formatScore(score)}
                    </td>
                  );
                })}
                {countries.length > 1 && (
                  <td className="py-2 pl-3 text-right text-xs tabular-nums text-zinc-400">
                    {delta != null ? Math.round(delta).toString() : '—'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
