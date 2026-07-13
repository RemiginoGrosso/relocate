import { INDICATOR_INTERPRETATIONS } from './constants';
import type { DimensionKey, RawIndex } from './types';

export const INDICATOR_LABELS: Record<string, string> = {
  'worldbank.wgi_rule_of_law': 'WGI Rule of Law',
  'worldbank.wgi_corruption_control': 'WGI Corruption Control',
  'numbeo.crime_index': 'Numbeo Crime Index',
  'gpi.gpi_score': 'GPI Score',
  'hofstede.ivr': 'Hofstede IVR',
  'gallup.mai': 'Gallup MAI',
  'internations.ease_rank': 'InterNations Ease Rank',
  'pisa.pisa_reading': 'PISA Reading',
  'pisa.pisa_maths': 'PISA Maths',
  'pisa.pisa_science': 'PISA Science',
  'pisa.pisa_belonging': 'PISA Belonging Index',
  'pisa.pisa_bullying': 'PISA Bullying Index',
  'pisa.pisa_safety': 'PISA Safety Index',
  'worldbank.who_uhc_coverage': 'WHO UHC Coverage',
  'worldbank.who_oop_pct': 'WHO Out-of-Pocket %',
  'ihme.haq_index': 'HAQ Index (GBD 2019)',
  'oecd.physicians_per_1000': 'Physicians per 1,000',
  'oecd.beds_per_1000': 'Hospital beds per 1,000',
  'oecd.nurses_per_1000': 'Nurses per 1,000',
  'worldbank.oecd_ppp_aic': 'OECD PPP (AIC)',
  'worldbank.price_level_ratio': 'Price Level Ratio',
  'imd.infrastructure_score': 'IMD Infrastructure Score',
  'pew.govt_restrictions': 'Pew Govt Restrictions',
  'pew.social_hostility': 'Pew Social Hostilities',
  'ef.epi_score': 'EF EPI Score',
};

export const DIMENSION_INDICATORS: Record<DimensionKey, string[]> = {
  purchasing_power: ['worldbank.oecd_ppp_aic', 'worldbank.price_level_ratio', 'worldbank.who_oop_pct'],
  civic_culture: ['worldbank.wgi_rule_of_law', 'worldbank.wgi_corruption_control', 'numbeo.crime_index'],
  safety: ['gpi.gpi_score'],
  warmth: ['hofstede.ivr', 'internations.ease_rank', 'gallup.mai'],
  school_culture: ['pisa.pisa_reading', 'pisa.pisa_maths', 'pisa.pisa_science', 'pisa.pisa_belonging', 'pisa.pisa_bullying', 'pisa.pisa_safety'],
  healthcare: ['worldbank.who_uhc_coverage', 'ihme.haq_index', 'oecd.physicians_per_1000', 'oecd.beds_per_1000', 'oecd.nurses_per_1000'],
  infrastructure: ['imd.infrastructure_score'],
  climate: [],
  religious_freedom: ['pew.govt_restrictions', 'pew.social_hostility'],
  english_proficiency: ['ef.epi_score'],
};

export function getRawValue(rawIndices: RawIndex[], source: string, indicator: string): RawIndex | undefined {
  return rawIndices.find((r) => `${r.source}.${r.indicator}` === `${source}.${indicator}`);
}

export function getInterpretation(indicatorKey: string, value: number | null): string | null {
  if (value === null) return null;
  const interp = INDICATOR_INTERPRETATIONS[indicatorKey];
  if (!interp) return null;
  const range = interp.ranges.find((r) => value <= r.max);
  return range?.label ?? null;
}

export function formatValue(raw: RawIndex): string {
  if (raw.value === null) return 'N/A';
  const v = raw.value;
  const key = `${raw.source}.${raw.indicator}`;
  if (key === 'worldbank.who_oop_pct') return `${v.toFixed(1)}%`;
  if (key === 'worldbank.price_level_ratio') return v.toFixed(2);
  if (key === 'gpi.gpi_score') return v.toFixed(3);
  if (key.startsWith('pisa.') && !['pisa.reading', 'pisa.maths', 'pisa.science'].includes(key)) return v.toFixed(2);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
