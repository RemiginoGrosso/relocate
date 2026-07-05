'use client';

import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DIMENSIONS } from '@/lib/constants';
import type { CountryScores } from '@/lib/types';

const COLORS = [
  { stroke: '#0F766E', fill: '#0F766E' },
  { stroke: '#4F46E5', fill: '#4F46E5' },
  { stroke: '#D97706', fill: '#D97706' },
];

interface CompareRadarChartProps {
  countries: CountryScores[];
}

export function CompareRadarChart({ countries }: CompareRadarChartProps) {
  const data = DIMENSIONS.map((dim) => {
    const point: Record<string, string | number> = { dimension: dim.name };
    countries.forEach((c, i) => {
      point[`country_${i}`] = c.dimensionScores[dim.key]?.score ?? 0;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
        <PolarGrid stroke="#E4E4E7" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11, fill: '#71717A' }}
          tickLine={false}
        />
        {countries.map((c, i) => (
          <Radar
            key={c.iso}
            name={c.name}
            dataKey={`country_${i}`}
            stroke={COLORS[i].stroke}
            strokeWidth={2}
            fill={COLORS[i].fill}
            fillOpacity={0.12}
            dot={false}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="line"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
