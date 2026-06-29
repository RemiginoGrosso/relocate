import type { DimensionDefinition, DimensionKey, Region, ScoreTier, UserWeights } from './types';

export const DIMENSION_KEYS: DimensionKey[] = [
  'purchasing_power',
  'civic_culture',
  'safety',
  'warmth',
  'school_culture',
  'healthcare',
  'infrastructure',
  'climate',
  'religious_freedom',
  'english_proficiency',
];

export const DIMENSIONS: DimensionDefinition[] = [
  {
    key: 'purchasing_power',
    name: 'Purchasing Power',
    description: 'How far your income stretches after adjusting for local price levels and out-of-pocket health costs.',
    methodology: 'purchasing_power = oecd_ppp_normalised × 0.55 + cost_affordability × 0.30 + (100 − oop_burden) × 0.15',
    category: 'economic',
    sources: ['OECD PPP', 'World Bank Price Level', 'WHO OOP Health Expenditure'],
    defaultWeight: 25,
    sortOrder: 1,
    confidence: 'high',
    knownLimitation: 'Country-level only — no city-level granularity until Numbeo added in V2.',
  },
  {
    key: 'civic_culture',
    name: 'Civic Culture',
    description: 'Rule of law, corruption control, and interpersonal trust — how well institutions and people behave.',
    methodology: 'civic_culture = wgi_rule_of_law × 0.40 + wgi_corruption_control × 0.35 + wvs_trust × 0.25',
    category: 'social',
    sources: ['World Bank WGI Rule of Law', 'World Bank WGI Control of Corruption', 'World Values Survey'],
    defaultWeight: 25,
    sortOrder: 2,
    confidence: 'high',
    knownLimitation: 'WVS has 5-year refresh lag. Falls back to WGI-only formula (55/45 split) when WVS data is missing.',
  },
  {
    key: 'safety',
    name: 'Safety',
    description: 'Overall peace and security based on conflict risk, political instability, and societal safety.',
    methodology: 'safety = gpi_normalised (inverted, min-max across 1.0–3.5)',
    category: 'safety',
    sources: ['Global Peace Index'],
    defaultWeight: 20,
    sortOrder: 3,
    confidence: 'high',
    knownLimitation: 'Single-source in V1 — less robust than a blend. Numbeo crime perception planned for V2.',
  },
  {
    key: 'warmth',
    name: 'Warmth',
    description: 'How welcoming and sociable the culture is — combining cultural permissiveness with expat experience.',
    methodology: 'warmth = ivr × 0.40 + internations_score × 0.60',
    category: 'social',
    sources: ['Hofstede IVR', 'InterNations Ease of Settling In'],
    defaultWeight: 20,
    sortOrder: 4,
    confidence: 'medium',
    knownLimitation: 'InterNations has ~260 respondents per country. Mismatch flag when abs(IVR − InterNations) > 30.',
  },
  {
    key: 'school_culture',
    name: 'School Culture',
    description: 'Academic quality plus student wellbeing — belonging, bullying rates, and school safety.',
    methodology: 'school_culture = pisa_academic × 0.25 + pisa_belonging × 0.30 + pisa_bullying_inv × 0.30 + pisa_safety × 0.15',
    category: 'social',
    sources: ['OECD PISA 2022'],
    defaultWeight: 10,
    sortOrder: 5,
    confidence: 'high',
    knownLimitation: 'PISA 2022 is the latest edition. Next update expected 2025.',
  },
  {
    key: 'healthcare',
    name: 'Healthcare',
    description: 'Health system capability and financial protection — service coverage minus out-of-pocket burden.',
    methodology: 'healthcare = who_uhc_normalised × 0.55 + (100 − who_oop_normalised) × 0.45',
    category: 'economic',
    sources: ['WHO UHC Service Coverage Index', 'WHO OOP Health Expenditure'],
    defaultWeight: 15,
    sortOrder: 6,
    confidence: 'high',
    knownLimitation: 'WHO OOP has 1-2 year lag. Measures system-level coverage, not individual experience.',
  },
  {
    key: 'infrastructure',
    name: 'Infrastructure',
    description: 'Quality of physical and digital infrastructure — transport, energy, communications, technology.',
    methodology: 'infrastructure = imd_infra_score (direct pass-through, already 0–100)',
    category: 'economic',
    sources: ['IMD World Competitiveness Infrastructure Score'],
    defaultWeight: 15,
    sortOrder: 7,
    confidence: 'high',
    knownLimitation: 'IMD uses 300+ indicators per country. Well-validated but only covers ~60 countries.',
  },
  {
    key: 'climate',
    name: 'Climate',
    description: 'Temperature, sunshine, and rainfall. V1 uses a simple comfort heuristic biased toward temperate climates.',
    methodology: 'climate = 100 − (|avg_temp − 20| × 3) − (rain_days > 150 ? 10 : 0) − (sunshine < 1500 ? 15 : 0)',
    category: 'lifestyle',
    sources: ['Open-Meteo ERA5'],
    defaultWeight: 10,
    sortOrder: 8,
    confidence: 'high',
    knownLimitation: 'Simple heuristic biased toward temperate climates. No user preference matching in V1.',
  },
  {
    key: 'religious_freedom',
    name: 'Religious Freedom',
    description: 'Government restrictions and social hostility toward religious practice.',
    methodology: 'religious_freedom = (100 − pew_govt_normalised) × 0.50 + (100 − pew_social_normalised) × 0.50',
    category: 'identity',
    sources: ['Pew Government Restrictions Index', 'Pew Social Hostilities Index'],
    defaultWeight: 5,
    sortOrder: 9,
    confidence: 'medium',
    knownLimitation: 'Expert-assessed, not survey-based. Captures state/social level, not neighbourhood level.',
  },
  {
    key: 'english_proficiency',
    name: 'English Proficiency',
    description: 'Population-level English ability. English-native countries are scored at 100.',
    methodology: 'english_proficiency = ef_epi_normalised (min-max across 300–700). Native countries hardcoded to 100.',
    category: 'lifestyle',
    sources: ['EF English Proficiency Index'],
    defaultWeight: 10,
    sortOrder: 10,
    confidence: 'high',
    knownLimitation: 'EF EPI tests self-selected online test-takers, which skews slightly upward.',
  },
];

export const DEFAULT_WEIGHTS: UserWeights = {
  purchasing_power: 25,
  civic_culture: 25,
  safety: 20,
  warmth: 20,
  school_culture: 10,
  healthcare: 15,
  infrastructure: 15,
  climate: 10,
  religious_freedom: 5,
  english_proficiency: 10,
};

export const SCORE_THRESHOLDS: Record<ScoreTier, number> = {
  excellent: 70,
  good: 50,
  fair: 30,
  poor: 0,
};

export const ENGLISH_NATIVE_COUNTRIES = ['GB', 'IE', 'AU', 'NZ', 'CA'] as const;

export const WARMTH_MISMATCH_THRESHOLD = 30;

export const MAX_NULL_DIMENSIONS = 3;

export const CLIMATE_REFERENCE_TEMP = 20;

export const REGIONS: Region[] = [
  'Western Europe',
  'Northern Europe',
  'Southern Europe',
  'Eastern Europe',
  'North America',
  'Latin America',
  'East Asia',
  'Southeast Asia',
  'Middle East',
  'Oceania',
];

export const REGION_FILTER_GROUPS: { label: string; regions: Region[] }[] = [
  { label: 'All', regions: REGIONS },
  { label: 'Europe', regions: ['Western Europe', 'Northern Europe', 'Southern Europe', 'Eastern Europe'] },
  { label: 'Asia-Pacific', regions: ['East Asia', 'Southeast Asia', 'Oceania'] },
  { label: 'Americas', regions: ['North America', 'Latin America'] },
  { label: 'Middle East', regions: ['Middle East'] },
];
