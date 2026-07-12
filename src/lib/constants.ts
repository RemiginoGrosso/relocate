import type { ClimatePreference, ClimateProfile, DimensionDefinition, DimensionKey, HealthcareSystemType, Region, ScoreTier, UserWeights } from './types';

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
    description: 'How far money stretches in each country — based on price levels, purchasing power parity (PPP), and out-of-pocket healthcare costs. Uses country-level data, not your personal salary.',
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
    description: 'How well institutions work and how safe the streets actually feel — combining governance quality with street-level crime perception.',
    context: 'Civic culture captures two things: institutional quality (do courts work, is corruption controlled?) and street-level reality (do people feel safe walking around?). Some countries have great institutions but rough streets; others have modest governance but feel very safe day-to-day. This dimension measures both, so your ranking reflects the full picture.',
    methodology: 'civic_culture = governance × 0.60 + street_safety × 0.40. governance = wgi_rule_of_law × 0.55 + wgi_corruption_control × 0.45. street_safety = 100 − numbeo_crime_index.',
    category: 'social',
    sources: ['World Bank WGI Rule of Law', 'World Bank WGI Control of Corruption', 'Numbeo Crime Index'],
    defaultWeight: 5,
    sortOrder: 2,
    confidence: 'medium',
    knownLimitation: 'Governance data is institutional (WGI). Street safety is crowdsourced perception (Numbeo). Neither captures behavioural civicness (queuing, littering, social norms) directly.',
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
    knownLimitation: 'Single-source — measures country-level peace/conflict (GPI). Street-level crime perception is captured in Civic Culture via Numbeo.',
  },
  {
    key: 'warmth',
    name: 'Warmth',
    description: 'How welcoming and sociable the culture is — combining cultural permissiveness with expat experience.',
    context: 'Cultural warmth determines how quickly you build a social life. Some cultures are genuinely open to newcomers; others are polite but reserved. This dimension blends academic measures of cultural openness with real expat experiences of settling in.',
    methodology: 'warmth = IVR × 0.40 + internations_score × 0.60. Both sources required — no fallback.',
    category: 'social',
    sources: ['Hofstede IVR', 'InterNations Ease of Settling In'],
    defaultWeight: 5,
    sortOrder: 4,
    confidence: 'high',
    knownLimitation: 'InterNations has ~260 respondents per country. Hofstede IVR is static (2010). Countries missing either source show no warmth score. Mismatch flag when abs(IVR − InterNations) > 30.',
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
    knownLimitation: 'PISA 2022 is the latest scored edition. PISA 2025 results expected late 2026 or early 2027.',
  },
  {
    key: 'healthcare',
    name: 'Healthcare',
    description: 'Three-pillar health system score: coverage breadth (UHC), care quality and outcomes (HAQ), and workforce capacity (physicians, beds, nurses). The badge shows what it means for your budget.',
    context: 'The score combines what healthcare services exist (UHC), how good outcomes are (HAQ — amenable mortality across 32 causes), and whether the system has enough doctors, beds, and nurses. The badge tells you what that means financially: public coverage, mandatory insurance, employer-dependent, or budget for private.',
    methodology: 'healthcare = UHC × 0.35 + HAQ × 0.35 + capacity × 0.30. capacity = physicians_norm × 0.40 + beds_norm × 0.35 + nurses_norm × 0.25.',
    category: 'economic',
    sources: ['WHO UHC Service Coverage Index', 'IHME GBD Healthcare Access & Quality', 'OECD Health Statistics'],
    defaultWeight: 5,
    sortOrder: 6,
    confidence: 'high',
    knownLimitation: 'HAQ is from GBD 2019 — next update pending. Capacity data is OECD 2022 for member countries, WHO GHO for others.',
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
    context: 'Climate is personal — there is no objectively best weather. Your preference for warmth, seasons, rainfall, and sunshine drives this score. Unlike other dimensions, climate varies dramatically within large countries; for large countries you can select a specific city — the default is the largest city by population.',
    methodology: 'climate = 100 − (|avg_temp − ref| × penalty) − rain_penalty − sunshine_penalty. Reference temp and thresholds vary by weather type.',
    category: 'lifestyle',
    sources: ['Open-Meteo ERA5'],
    defaultWeight: 5,
    sortOrder: 8,
    confidence: 'high',
    knownLimitation: 'For 8 large countries, city-level data is available. For all others, a single representative city is used. Heuristic scoring, not a climate model.',
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
    description: 'Population-level English ability. English-native countries are scored at 10.',
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
  tropical_heat: {
    label: 'Tropical Heat',
    description: 'Warm and humid weather all year round, perfect for beach and jungle climates',
    referenceTemp: 27,
    tempPenalty: 2.5,
    rainThreshold: 200,
    rainPenalty: 5,
    sunshineThreshold: 1800,
    sunshinePenalty: 10,
    winterTempThreshold: 20,
    winterTempPenalty: 2,
  },
  desert_dry: {
    label: 'Desert Dry',
    description: 'Hot, arid days with maximum sunshine and virtually zero humidity or rain',
    referenceTemp: 30,
    tempPenalty: 2,
    rainThreshold: 30,
    rainPenalty: 20,
    sunshineThreshold: 3000,
    sunshinePenalty: 15,
  },
  sunny_warm: {
    label: 'Sunny & Warm',
    description: 'Long, hot summers and pleasant, mild winters that rarely see frost or snow',
    referenceTemp: 22,
    tempPenalty: 3,
    rainThreshold: 80,
    rainPenalty: 15,
    sunshineThreshold: 2500,
    sunshinePenalty: 15,
    winterTempThreshold: 12,
    winterTempPenalty: 2,
  },
  mild_scenic: {
    label: 'Mild & Scenic',
    description: 'Lush, green nature and comfortable temperatures, featuring gorgeous, dry, and sunny summers',
    referenceTemp: 15,
    tempPenalty: 2.5,
    rainThreshold: 120,
    rainPenalty: 10,
    sunshineThreshold: 2000,
    sunshinePenalty: 15,
    winterTempThreshold: 5,
    winterTempPenalty: 2,
  },
  green_rainy: {
    label: 'Green & Rainy',
    description: 'Cozy, overcast weather with consistent rainfall and misty landscapes throughout the year',
    referenceTemp: 12,
    tempPenalty: 3,
    rainThreshold: 220,
    rainPenalty: 5,
    sunshineThreshold: 1200,
    sunshinePenalty: 5,
    winterTempThreshold: 3,
    winterTempPenalty: 3,
  },
  four_seasons: {
    label: '4 Clear Seasons',
    description: 'A predictable yearly cycle of hot summers, crisp autumn leaves, spring blooms, and snowy winters',
    referenceTemp: 11,
    tempPenalty: 2,
    rainThreshold: 150,
    rainPenalty: 10,
    sunshineThreshold: 1600,
    sunshinePenalty: 10,
    winterTempThreshold: -5,
    winterTempPenalty: 1.5,
  },
  freezing_cold: {
    label: 'Freezing Cold',
    description: 'Long, snowy winters and brief, cool summers tailored for winter sports and glacial landscapes',
    referenceTemp: 3,
    tempPenalty: 2.5,
    rainThreshold: 200,
    rainPenalty: 5,
    sunshineThreshold: 1000,
    sunshinePenalty: 3,
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
  'numbeo.crime_index': {
    ranges: [
      { max: 20, label: 'Very low crime' },
      { max: 35, label: 'Low crime' },
      { max: 50, label: 'Moderate' },
      { max: 65, label: 'High crime' },
      { max: 100, label: 'Very high crime' },
    ],
  },
  'hofstede.ivr': {
    ranges: [
      { max: 30, label: 'Restrained' },
      { max: 50, label: 'Moderate' },
      { max: 70, label: 'Indulgent' },
      { max: 100, label: 'Very indulgent' },
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
  'ihme.haq_index': {
    ranges: [
      { max: 50, label: 'Low quality' },
      { max: 70, label: 'Moderate' },
      { max: 85, label: 'High quality' },
      { max: 100, label: 'Excellent' },
    ],
  },
  'oecd.physicians_per_1000': {
    ranges: [
      { max: 1.5, label: 'Shortage' },
      { max: 3.0, label: 'Moderate' },
      { max: 4.5, label: 'Well staffed' },
      { max: 7.0, label: 'Very well staffed' },
    ],
  },
  'oecd.beds_per_1000': {
    ranges: [
      { max: 2.0, label: 'Limited' },
      { max: 4.0, label: 'Moderate' },
      { max: 7.0, label: 'Well resourced' },
      { max: 14.0, label: 'Very high' },
    ],
  },
  'oecd.nurses_per_1000': {
    ranges: [
      { max: 3.0, label: 'Shortage' },
      { max: 8.0, label: 'Moderate' },
      { max: 12.0, label: 'Well staffed' },
      { max: 20.0, label: 'Very well staffed' },
    ],
  },
};

export const INDICATOR_TOOLTIPS: Record<string, string> = {
  'worldbank.oecd_ppp_aic': 'How much a basket of goods and services costs relative to the OECD average. Higher means your money buys more.',
  'worldbank.price_level_ratio': 'Local price levels compared to the US. Below 1.0 means cheaper; above 1.0 means more expensive.',
  'worldbank.who_oop_pct': 'Share of health costs paid directly by individuals, not covered by insurance or government. Lower is better.',
  'worldbank.wgi_rule_of_law': 'How much people trust and follow society\'s rules — courts, contracts, police, property rights.',
  'worldbank.wgi_corruption_control': 'How well public power is kept in check. Higher means less corruption in government and institutions.',
  'numbeo.crime_index': 'Crowdsourced perception of crime levels. Based on surveys about safety walking alone, worry about property crime, etc.',
  'gpi.gpi_score': 'Measures a country\'s peacefulness based on conflict, political instability, and militarisation. Lower is more peaceful.',
  'hofstede.ivr': 'How much a culture values leisure, fun, and personal freedom vs social restraint and strict norms.',
  'internations.ease_rank': 'How easy expats report it is to settle in, make local friends, and feel at home. Lower rank is better.',
  'gallup.mai': 'Measures public attitudes toward migrants and refugees. Higher means more accepting of newcomers.',
  'pisa.pisa_reading': 'Average score of 15-year-olds on the OECD reading assessment. OECD average is around 476.',
  'pisa.pisa_maths': 'Average score of 15-year-olds on the OECD maths assessment. OECD average is around 472.',
  'pisa.pisa_science': 'Average score of 15-year-olds on the OECD science assessment. OECD average is around 485.',
  'pisa.pisa_belonging': 'How much students feel they belong at school. Based on survey questions about fitting in and feeling accepted.',
  'pisa.pisa_bullying': 'How often students report being bullied. Lower values mean less bullying exposure.',
  'pisa.pisa_safety': 'How safe students feel at school. Based on survey questions about feeling threatened or unsafe.',
  'worldbank.who_uhc_coverage': 'Share of essential health services effectively covered for the population. 100 means full coverage.',
  'ihme.haq_index': 'How well the health system actually treats preventable and treatable conditions. Based on mortality data, not spending.',
  'oecd.physicians_per_1000': 'Number of practising doctors per 1,000 people. OECD average is around 3.7.',
  'oecd.beds_per_1000': 'Number of hospital beds per 1,000 people. Measures physical healthcare capacity.',
  'oecd.nurses_per_1000': 'Number of practising nurses per 1,000 people. OECD average is around 9.2.',
  'imd.infrastructure_score': 'Composite score of transport, energy, telecoms, and digital infrastructure quality.',
  'ef.epi_score': 'How well adults in the country speak English as a second language. Based on standardised test results.',
  'pew.govt_restrictions': 'Government laws, policies, and actions that restrict religious practice. Lower is more free.',
  'pew.social_hostility': 'Hostility toward religion by individuals or social groups — harassment, violence, discrimination. Lower is more tolerant.',
};

export const HEALTHCARE_SYSTEM_LABELS: Record<HealthcareSystemType, { label: string; short: string; tooltip: string; color: string }> = {
  public: {
    label: 'Covered',
    short: 'Covered',
    tooltip: 'Working legally means you\'re covered. Healthcare is funded through payroll or taxes — no separate budget needed.',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  regulated_buyin: {
    label: 'Must buy insurance',
    short: 'Must buy insurance',
    tooltip: 'You must purchase health insurance yourself from regulated insurers. Everyone does it, costs are predictable.',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  employer_provided: {
    label: 'Tied to employer',
    short: 'Tied to employer',
    tooltip: 'Your employer provides coverage. Verify it\'s in your offer — no employer means no coverage or very expensive self-purchase.',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  budget_private: {
    label: 'Budget for private',
    short: 'Budget for private',
    tooltip: 'A public system exists but most relocating professionals use private healthcare.',
    color: 'text-red-700 bg-red-50 border-red-200',
  },
};

export const HEALTHCARE_SYSTEM_MAP: Record<string, HealthcareSystemType> = {
  AT: 'public', BE: 'public', CA: 'public', CR: 'public', HR: 'public',
  CY: 'public', CZ: 'public', DK: 'public', EE: 'public', FI: 'public',
  FR: 'public', DE: 'public', HU: 'public', IS: 'public', IT: 'public',
  JP: 'public', LT: 'public', LU: 'public', NZ: 'public', NO: 'public',
  PL: 'public', PT: 'public', SK: 'public', SI: 'public', KR: 'public',
  ES: 'public', SE: 'public', TW: 'public', TR: 'public', GB: 'public',
  UY: 'public',
  CL: 'regulated_buyin', NL: 'regulated_buyin', CH: 'regulated_buyin',
  MY: 'employer_provided', PE: 'employer_provided', QA: 'employer_provided',
  SA: 'employer_provided', SG: 'employer_provided', AE: 'employer_provided',
  US: 'employer_provided',
  AR: 'budget_private', AU: 'budget_private', BR: 'budget_private', BG: 'budget_private', CO: 'budget_private',
  CN: 'budget_private', GR: 'budget_private', IN: 'budget_private', ID: 'budget_private',
  IE: 'budget_private', LV: 'budget_private', MX: 'budget_private', MA: 'budget_private',
  PA: 'budget_private', PH: 'budget_private', RO: 'budget_private', ZA: 'budget_private',
  TH: 'budget_private', VN: 'budget_private',
};
