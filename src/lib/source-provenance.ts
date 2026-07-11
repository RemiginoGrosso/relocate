import type { DimensionKey, RawIndex } from './types';

interface SourceInfo {
  key: string;
  label: string;
  tier: 'key' | 'directional';
}

const DIMENSION_SOURCES: Record<DimensionKey, SourceInfo[]> = {
  purchasing_power: [
    { key: 'worldbank.oecd_ppp_aic', label: 'OECD PPP', tier: 'key' },
    { key: 'worldbank.price_level_ratio', label: 'World Bank Price Level', tier: 'directional' },
    { key: 'worldbank.who_oop_pct', label: 'WHO OOP Health Expenditure', tier: 'directional' },
  ],
  civic_culture: [
    { key: 'worldbank.wgi_rule_of_law', label: 'WGI Rule of Law', tier: 'key' },
    { key: 'worldbank.wgi_corruption_control', label: 'WGI Corruption Control', tier: 'key' },
    { key: 'numbeo.crime_index', label: 'Numbeo Crime Index', tier: 'directional' },
  ],
  safety: [
    { key: 'gpi.gpi_score', label: 'Global Peace Index', tier: 'key' },
  ],
  warmth: [
    { key: 'hofstede.ivr', label: 'Hofstede IVR', tier: 'key' },
    { key: 'internations.ease_rank', label: 'InterNations', tier: 'key' },
    { key: 'gallup.mai', label: 'Gallup MAI', tier: 'directional' },
  ],
  school_culture: [
    { key: 'pisa.pisa_reading', label: 'PISA Reading', tier: 'key' },
    { key: 'pisa.pisa_maths', label: 'PISA Maths', tier: 'key' },
    { key: 'pisa.pisa_science', label: 'PISA Science', tier: 'key' },
    { key: 'pisa.pisa_belonging', label: 'PISA Belonging', tier: 'directional' },
    { key: 'pisa.pisa_bullying', label: 'PISA Bullying', tier: 'directional' },
    { key: 'pisa.pisa_safety', label: 'PISA Safety', tier: 'directional' },
  ],
  healthcare: [
    { key: 'worldbank.who_uhc_coverage', label: 'WHO UHC Coverage', tier: 'key' },
    { key: 'ihme.haq_index', label: 'IHME HAQ Index', tier: 'directional' },
    { key: 'oecd.physicians_per_1000', label: 'Physicians/1k', tier: 'directional' },
    { key: 'oecd.beds_per_1000', label: 'Beds/1k', tier: 'directional' },
    { key: 'oecd.nurses_per_1000', label: 'Nurses/1k', tier: 'directional' },
  ],
  infrastructure: [
    { key: 'imd.infrastructure_score', label: 'IMD Infrastructure', tier: 'key' },
  ],
  climate: [],
  religious_freedom: [
    { key: 'pew.govt_restrictions', label: 'Pew Govt Restrictions', tier: 'key' },
    { key: 'pew.social_hostility', label: 'Pew Social Hostilities', tier: 'key' },
  ],
  english_proficiency: [
    { key: 'ef.epi_score', label: 'EF EPI', tier: 'key' },
  ],
};

export interface SourceStatus {
  label: string;
  present: boolean;
  tier: 'key' | 'directional';
}

export function getSourceStatuses(
  dimensionKey: DimensionKey,
  rawIndices: RawIndex[],
): SourceStatus[] {
  const sources = DIMENSION_SOURCES[dimensionKey];
  if (!sources.length) return [];

  const rawMap = new Set(
    rawIndices
      .filter((r) => r.value != null)
      .map((r) => `${r.source}.${r.indicator}`),
  );

  return sources.map((src) => ({
    label: src.label,
    present: rawMap.has(src.key),
    tier: src.tier,
  }));
}
