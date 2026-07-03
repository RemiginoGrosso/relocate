import type { ClimatePreference, ClimateProfile, DimensionDefinition, DimensionKey, Region, ScoreTier, UserWeights } from './types';

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
    description: 'How far money stretches in each country — based on price levels, purchasing parity, and healthcare costs. Uses country-level data, not your personal salary.',
    context: 'When you move abroad, your salary or savings buy different amounts depending on local prices. A country can have high wages but high costs, or moderate wages with remarkable purchasing power. This dimension captures what your money actually buys day-to-day, not just what you earn.',
    methodology: 'purchasing_power = oecd_ppp_normalised × 0.55 + cost_affordability × 0.30 + (100 − oop_burden) × 0.15',
    category: 'economic',
    sources: ['OECD PPP', 'World Bank Price Level', 'WHO OOP Health Expenditure'],
    defaultWeight: 5,
    sortOrder: 1,
    confidence: 'high',
    knownLimitation: 'Country-level only — no city-level granularity until Numbeo added in V2.',
  },
  {
    key: 'civic_culture',
    name: 'Civic Culture',
    description: 'Whether people follow rules and respect others, whether corruption is tolerated, and whether strangers can be trusted. Covers both social behaviour and institutional quality.',
    context: 'Civic culture shapes the texture of daily life. It determines whether people queue honestly, drive within the rules, respect shared spaces, and deal fairly — or whether cutting corners and bending rules is normalised. It also measures whether institutions work: will the police respond, will a contract hold up, can you trust a handshake? Countries where both social norms and legal systems uphold fairness are dramatically easier to live in long-term.',
    methodology: 'civic_culture = wgi_rule_of_law × 0.40 + wgi_corruption_control × 0.35 + wvs_trust × 0.25',
    category: 'social',
    sources: ['World Bank WGI Rule of Law', 'World Bank WGI Control of Corruption', 'World Values Survey'],
    defaultWeight: 5,
    sortOrder: 2,
    confidence: 'high',
    knownLimitation: 'WVS has 5-year refresh lag. Falls back to WGI-only formula (55/45 split) when WVS data is missing.',
  },
  {
    key: 'safety',
    name: 'Safety',
    description: 'Overall peace and security based on conflict risk, political instability, and societal safety.',
    context: 'Safety shapes everything from where you walk at night to whether you feel comfortable letting your children explore independently. This dimension captures country-level peace and security — conflict risk, political stability, and societal safety — not neighbourhood-level crime.',
    methodology: 'safety = gpi_normalised (inverted, min-max across 1.0–3.5)',
    category: 'safety',
    sources: ['Global Peace Index'],
    defaultWeight: 5,
    sortOrder: 3,
    confidence: 'high',
    knownLimitation: 'Single-source in V1 — less robust than a blend. Numbeo crime perception planned for V2.',
  },
  {
    key: 'warmth',
    name: 'Warmth',
    description: 'How welcoming and sociable the culture is — combining cultural permissiveness with expat experience.',
    context: 'Cultural warmth determines how quickly you build a social life. Some cultures are genuinely open to newcomers; others are polite but reserved. This dimension blends academic measures of cultural openness with real expat experiences of settling in.',
    methodology: 'warmth = mai_normalised × 0.40 + internations_score × 0.60',
    category: 'social',
    sources: ['Gallup MAI (Migrant Acceptance Index)', 'InterNations Ease of Settling In'],
    defaultWeight: 5,
    sortOrder: 4,
    confidence: 'medium',
    knownLimitation: 'InterNations has ~260 respondents per country. MAI data from 2018 (latest published). Mismatch flag when abs(MAI − InterNations) > 30.',
  },
  {
    key: 'school_culture',
    name: 'School Culture',
    description: 'Academic quality plus student wellbeing — belonging, bullying rates, and school safety.',
    context: 'For families, the school environment is often the deciding factor. This goes beyond test scores to measure whether students feel they belong, whether bullying is common, and whether schools are safe spaces. Academic quality matters, but a child\'s daily experience matters more.',
    methodology: 'school_culture = pisa_academic × 0.25 + pisa_belonging × 0.30 + pisa_bullying_inv × 0.30 + pisa_safety × 0.15',
    category: 'social',
    sources: ['OECD PISA 2022'],
    defaultWeight: 5,
    sortOrder: 5,
    confidence: 'high',
    knownLimitation: 'PISA 2022 is the latest edition. Next update expected 2025.',
  },
  {
    key: 'healthcare',
    name: 'Healthcare',
    description: 'Health system capability and financial protection — service coverage minus out-of-pocket burden.',
    context: 'Access to quality healthcare without financial ruin is non-negotiable for long-term residents. This dimension measures both the capability of the health system (can it treat you?) and the financial protection it offers (will treatment bankrupt you?).',
    methodology: 'healthcare = who_uhc_normalised × 0.55 + (100 − who_oop_normalised) × 0.45',
    category: 'economic',
    sources: ['WHO UHC Service Coverage Index', 'WHO OOP Health Expenditure'],
    defaultWeight: 5,
    sortOrder: 6,
    confidence: 'high',
    knownLimitation: 'WHO OOP has 1-2 year lag. Measures system-level coverage, not individual experience.',
  },
  {
    key: 'infrastructure',
    name: 'Infrastructure',
    description: 'Quality of physical and digital infrastructure — transport, energy, communications, technology.',
    context: 'Reliable transport, stable electricity, fast internet, and modern communications infrastructure affect daily life in ways you stop noticing — until they break. This dimension captures the physical and digital backbone that makes a country function smoothly.',
    methodology: 'infrastructure = imd_infra_score (direct pass-through, already 0–100)',
    category: 'economic',
    sources: ['IMD World Competitiveness Infrastructure Score'],
    defaultWeight: 5,
    sortOrder: 7,
    confidence: 'high',
    knownLimitation: 'IMD uses 300+ indicators per country. Well-validated but only covers ~60 countries.',
  },
  {
    key: 'climate',
    name: 'Climate',
    description: 'Temperature, sunshine, and rainfall scored against your preferred weather type. Select your preference during onboarding or adjust in the ranking view.',
    context: 'Climate is personal — there is no objectively best weather. Your preference for warmth, seasons, rainfall, and sunshine drives this score. Unlike other dimensions, climate varies dramatically within large countries; this score uses capital city weather as a proxy.',
    methodology: 'climate = 100 − (|avg_temp − ref| × penalty) − rain_penalty − sunshine_penalty. Reference temp and thresholds vary by weather type.',
    category: 'lifestyle',
    sources: ['Open-Meteo ERA5'],
    defaultWeight: 5,
    sortOrder: 8,
    confidence: 'high',
    knownLimitation: 'Uses capital city weather as proxy for the whole country. Heuristic scoring, not a climate model.',
  },
  {
    key: 'religious_freedom',
    name: 'Religious Freedom',
    description: 'Government restrictions and social hostility toward religious practice.',
    context: 'For people of faith, the ability to practise openly without government restrictions or social hostility is fundamental. This dimension measures both state-level restrictions (laws, regulations) and social-level hostility (harassment, discrimination by neighbours or communities).',
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
    context: 'For non-native English speakers relocating abroad, the population\'s English ability determines how easily you can navigate daily life, work, and social connections without learning the local language. A high score means English gets you far; a low score means significant language investment.',
    methodology: 'english_proficiency = ef_epi_normalised (min-max across 300–700). Native countries hardcoded to 100.',
    category: 'lifestyle',
    sources: ['EF English Proficiency Index'],
    defaultWeight: 5,
    sortOrder: 10,
    confidence: 'high',
    knownLimitation: 'EF EPI tests self-selected online test-takers, which skews slightly upward.',
  },
];

export const DEFAULT_WEIGHTS: UserWeights = {
  purchasing_power: 5,
  civic_culture: 5,
  safety: 5,
  warmth: 5,
  school_culture: 5,
  healthcare: 5,
  infrastructure: 5,
  climate: 5,
  religious_freedom: 5,
  english_proficiency: 5,
};

export const SCORE_THRESHOLDS: Record<ScoreTier, number> = {
  excellent: 70,
  good: 50,
  fair: 30,
  poor: 0,
};

export const ENGLISH_NATIVE_COUNTRIES = ['GB', 'IE', 'AU', 'NZ', 'CA', 'US'] as const;

export const WARMTH_MISMATCH_THRESHOLD = 30;

export const MAX_NULL_DIMENSIONS = 3;

export const CLIMATE_REFERENCE_TEMP = 20;

export const CLIMATE_PROFILES: Record<ClimatePreference, ClimateProfile> = {
  warm_sunny: {
    label: 'Warm & sunny',
    description: 'Mediterranean, dry summers, mild winters',
    referenceTemp: 22,
    tempPenalty: 3,
    rainThreshold: 120,
    rainPenalty: 15,
    sunshineThreshold: 2000,
    sunshinePenalty: 15,
  },
  hot_tropical: {
    label: 'Hot & tropical',
    description: 'Year-round heat, humidity and rain are fine',
    referenceTemp: 27,
    tempPenalty: 2.5,
    rainThreshold: 200,
    rainPenalty: 5,
    sunshineThreshold: 1800,
    sunshinePenalty: 10,
  },
  mild_green: {
    label: 'Mild & green',
    description: 'Temperate, four seasons, rain is welcome',
    referenceTemp: 13,
    tempPenalty: 3,
    rainThreshold: 200,
    rainPenalty: 5,
    sunshineThreshold: 1200,
    sunshinePenalty: 10,
  },
  cold_crisp: {
    label: 'Cold & crisp',
    description: 'Cold winters, snow, Nordic or alpine',
    referenceTemp: 5,
    tempPenalty: 2.5,
    rainThreshold: 180,
    rainPenalty: 10,
    sunshineThreshold: 1000,
    sunshinePenalty: 5,
  },
  no_preference: {
    label: "I don't mind",
    description: 'No specific climate preference',
    referenceTemp: 20,
    tempPenalty: 3,
    rainThreshold: 150,
    rainPenalty: 10,
    sunshineThreshold: 1500,
    sunshinePenalty: 15,
  },
};

export const REGIONS: Region[] = [
  'Western Europe',
  'Northern Europe',
  'Southern Europe',
  'Eastern Europe',
  'North America',
  'Latin America',
  'East Asia',
  'Southeast Asia',
  'South Asia',
  'Middle East',
  'Oceania',
  'Africa',
];

export const REGION_FILTER_GROUPS: { label: string; regions: Region[] }[] = [
  { label: 'All', regions: REGIONS },
  { label: 'Europe', regions: ['Western Europe', 'Northern Europe', 'Southern Europe', 'Eastern Europe'] },
  { label: 'Asia-Pacific', regions: ['East Asia', 'Southeast Asia', 'South Asia', 'Oceania'] },
  { label: 'Americas', regions: ['North America', 'Latin America'] },
  { label: 'Middle East', regions: ['Middle East'] },
  { label: 'Africa', regions: ['Africa'] },
];

export const INDICATOR_INTERPRETATIONS: Record<string, { ranges: { max: number; label: string }[] }> = {
  'gpi.gpi_score': {
    ranges: [
      { max: 1.5, label: 'Very peaceful' },
      { max: 2.0, label: 'Peaceful' },
      { max: 2.5, label: 'Moderate' },
      { max: 3.5, label: 'High conflict risk' },
    ],
  },
  'worldbank.wgi_rule_of_law': {
    ranges: [
      { max: 25, label: 'Weak' },
      { max: 50, label: 'Moderate' },
      { max: 75, label: 'Strong' },
      { max: 100, label: 'Very strong' },
    ],
  },
  'worldbank.wgi_corruption_control': {
    ranges: [
      { max: 25, label: 'Weak control' },
      { max: 50, label: 'Moderate' },
      { max: 75, label: 'Strong control' },
      { max: 100, label: 'Very strong control' },
    ],
  },
  'wvs.trust_pct': {
    ranges: [
      { max: 20, label: 'Low trust' },
      { max: 40, label: 'Moderate' },
      { max: 60, label: 'High trust' },
      { max: 100, label: 'Very high trust' },
    ],
  },
  'gallup.mai': {
    ranges: [
      { max: 3.0, label: 'Low acceptance' },
      { max: 5.0, label: 'Moderate' },
      { max: 7.0, label: 'Accepting' },
      { max: 9.0, label: 'Very accepting' },
    ],
  },
  'internations.ease_rank': {
    ranges: [
      { max: 30, label: 'Easy to settle in' },
      { max: 50, label: 'Moderate' },
      { max: 70, label: 'Challenging' },
      { max: 100, label: 'Difficult' },
    ],
  },
  'pisa.pisa_reading': {
    ranges: [
      { max: 420, label: 'Below OECD avg' },
      { max: 480, label: 'OECD average' },
      { max: 520, label: 'Above average' },
      { max: 600, label: 'Top tier' },
    ],
  },
  'pisa.pisa_maths': {
    ranges: [
      { max: 420, label: 'Below OECD avg' },
      { max: 480, label: 'OECD average' },
      { max: 520, label: 'Above average' },
      { max: 600, label: 'Top tier' },
    ],
  },
  'pisa.pisa_science': {
    ranges: [
      { max: 420, label: 'Below OECD avg' },
      { max: 480, label: 'OECD average' },
      { max: 520, label: 'Above average' },
      { max: 600, label: 'Top tier' },
    ],
  },
  'pisa.pisa_belonging': {
    ranges: [
      { max: -0.2, label: 'Low belonging' },
      { max: 0.0, label: 'Below average' },
      { max: 0.2, label: 'Above average' },
      { max: 1.0, label: 'High belonging' },
    ],
  },
  'pisa.pisa_bullying': {
    ranges: [
      { max: -0.2, label: 'Low exposure' },
      { max: 0.0, label: 'Below average' },
      { max: 0.2, label: 'Above average' },
      { max: 1.0, label: 'High exposure' },
    ],
  },
  'pisa.pisa_safety': {
    ranges: [
      { max: -0.2, label: 'Less safe' },
      { max: 0.0, label: 'Average' },
      { max: 0.2, label: 'Safer' },
      { max: 1.0, label: 'Very safe' },
    ],
  },
  'worldbank.who_uhc_coverage': {
    ranges: [
      { max: 50, label: 'Low coverage' },
      { max: 65, label: 'Moderate' },
      { max: 80, label: 'Good coverage' },
      { max: 100, label: 'Excellent' },
    ],
  },
  'worldbank.who_oop_pct': {
    ranges: [
      { max: 15, label: 'Well protected' },
      { max: 30, label: 'Moderate burden' },
      { max: 50, label: 'High burden' },
      { max: 100, label: 'Very high burden' },
    ],
  },
  'worldbank.oecd_ppp_aic': {
    ranges: [
      { max: 20000, label: 'Low purchasing power' },
      { max: 40000, label: 'Moderate' },
      { max: 60000, label: 'High' },
      { max: 160000, label: 'Very high' },
    ],
  },
  'worldbank.price_level_ratio': {
    ranges: [
      { max: 0.5, label: 'Very affordable' },
      { max: 0.8, label: 'Affordable' },
      { max: 1.0, label: 'Average' },
      { max: 1.5, label: 'Expensive' },
    ],
  },
  'imd.infrastructure_score': {
    ranges: [
      { max: 40, label: 'Developing' },
      { max: 60, label: 'Moderate' },
      { max: 80, label: 'Advanced' },
      { max: 100, label: 'World-class' },
    ],
  },
  'ef.epi_score': {
    ranges: [
      { max: 450, label: 'Low proficiency' },
      { max: 500, label: 'Moderate' },
      { max: 550, label: 'High' },
      { max: 700, label: 'Very high' },
    ],
  },
  'pew.govt_restrictions': {
    ranges: [
      { max: 2.0, label: 'Low restrictions' },
      { max: 4.5, label: 'Moderate' },
      { max: 6.6, label: 'High restrictions' },
      { max: 10, label: 'Very high' },
    ],
  },
  'pew.social_hostility': {
    ranges: [
      { max: 2.0, label: 'Low hostility' },
      { max: 4.5, label: 'Moderate' },
      { max: 6.6, label: 'High hostility' },
      { max: 10, label: 'Very high' },
    ],
  },
};
