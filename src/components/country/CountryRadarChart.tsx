'use client';

import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  ResponsiveContainer,
} from 'recharts';
import { DIMENSIONS } from '@/lib/constants';
import type { CountryScores, DimensionKey } from '@/lib/types';

interface CountryRadarChartProps {
  country: CountryScores;
}

export function CountryRadarChart({ country }: CountryRadarChartProps) {
  const data = DIMENSIONS.map((dim) => ({
    dimension: dim.name,
    value: country.dimensionScores[dim.key]?.score ?? 0,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart cx="55%" cy="50%" outerRadius="65%" data={data}>
        <PolarGrid stroke="#E4E4E7" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11, fill: '#71717A' }}
          tickLine={false}
        />
        <Radar
          dataKey="value"
          stroke="#0F766E"
          strokeWidth={2}
          fill="#0F766E"
          fillOpacity={0.15}
          dot={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
