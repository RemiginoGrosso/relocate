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
    description: 'How far income earned abroad (remote work, pension, savings) goes at local prices. If you will earn a local salary, choose "Local salary" and the score switches to local income levels. Country averages, not your personal salary.',
    context: 'Two different questions hide behind "purchasing power". If your income comes from abroad, what matters is how cheap local prices are. If you will earn locally, what matters is how high local incomes are once local prices are taken into account. Relocator scores the first by default and switches to the second when you choose a local salary.',
    methodology: 'Income from abroad: purchasing_power = price level ratio vs the US, inverted and scaled from 0.10 (100) to 1.50 (0). Local salary: purchasing_power = GDP per person at local prices (PPP), log-scaled from 8,000 (0) to 160,000 (100) international dollars.',
    category: 'economic',
    sources: ['World Bank Price Level Ratio', 'World Bank GDP per capita (PPP)'],
    defaultWeight: 5,
    sortOrder: 1,
    confidence: 'medium',
    knownLimitation: 'Country averages only, no city prices. Price levels move with exchange rates, so a sharp devaluation can make a country look cheaper than it feels. Argentina\'s price level is from 2021, the latest year with both price and exchange-rate data. GDP per person is an average and says nothing about how income is shared.',
  },
  {
    key: 'civic_culture',
    name: 'Rule of Law',
    description: 'How well courts, contracts and anti-corruption controls work, based on World Bank governance ratings. Street crime is scored under Safety.',
    context: 'Rule of law decides whether contracts are enforced, whether you can trust the police and courts, and how often officials expect a bribe. It does not measure everyday etiquette (queuing, littering, noise norms) because no reliable cross-country data for those behaviours exists.',
    methodology: 'civic_culture = wgi_rule_of_law × 0.55 + wgi_corruption_control × 0.45 (both World Bank percentile ranks, 0 to 100).',
    category: 'social',
    sources: ['World Bank WGI Rule of Law', 'World Bank WGI Control of Corruption'],
    defaultWeight: 5,
    sortOrder: 2,
    confidence: 'high',
    knownLimitation: 'WGI combines expert, business and household surveys, so it reflects how institutions are perceived. It measures institutions, not how people behave day to day.',
  },
  {
    key: 'safety',
    name: 'Safety',
    description: 'How likely you are to meet violent or street crime: the murder rate plus residents\' reported worry about everyday crime. Country averages, not neighbourhood level.',
    context: 'Safety shapes where you walk at night and how freely your children move around. This score blends a hard measure (murders per 100,000 people, from UNODC) with residents\' reported experience of everyday crime (Numbeo). It does not measure war or political risk.',
    methodology: 'safety = homicide_norm × 0.50 + (100 − numbeo_crime_index) × 0.50. homicide_norm is log-scaled: 0.3 or fewer homicides per 100,000 people = 100, 40 or more = 0. If one source is missing, the other is used alone.',
    category: 'safety',
    sources: ['UNODC Intentional Homicides (via World Bank)', 'Numbeo Crime Index'],
    defaultWeight: 5,
    sortOrder: 3,
    confidence: 'medium',
    knownLimitation: 'Homicide data is missing for Taiwan, Thailand and Vietnam, so their score uses Numbeo alone. Numbeo is crowdsourced and its sample sizes vary by country. National averages hide large differences between cities and neighbourhoods. The Global Peace Index is shown as context but not scored, because it mostly measures conflict and militarisation.',
  },
  {
    key: 'warmth',
    name: 'Warmth',
    description: 'How easily expats report settling in, combined with how much the culture values leisure and openness. A rough signal, not a measure of how people will treat you.',
    context: 'Warmth affects how quickly you build a social life. This score blends one cultural values survey (Hofstede indulgence) with an expat survey about settling in (InterNations). Both are thin, so treat this as a hint to explore, not a verdict.',
    methodology: 'warmth = IVR × 0.40 + internations_score × 0.60. Both sources required, no fallback.',
    category: 'social',
    sources: ['Hofstede IVR', 'InterNations Ease of Settling In'],
    defaultWeight: 5,
    sortOrder: 4,
    confidence: 'low',
    knownLimitation: 'InterNations has about 260 respondents per country, mostly expats in professional jobs. Hofstede IVR dates from 2010 and measures cultural values, not friendliness to newcomers. Countries missing either source show no warmth score. Mismatch flag when abs(IVR − InterNations) > 30.',
  },
  {
    key: 'school_culture',
    name: 'School Culture',
    description: 'How 15-year-olds in the local school system do: test scores plus belonging, bullying and safety at school. It does not cover international schools.',
    context: 'For families, the school environment is often the deciding factor. This score comes from PISA, which tests and surveys 15-year-olds in each country\'s mainstream schools, mostly public. If your children will attend an international school, this score says little about their experience.',
    methodology: 'school_culture = pisa_academic × 0.25 + pisa_belonging × 0.30 + pisa_bullying_inv × 0.30 + pisa_safety × 0.15',
    category: 'social',
    sources: ['OECD PISA 2022'],
    defaultWeight: 5,
    sortOrder: 5,
    confidence: 'medium',
    knownLimitation: 'PISA 2022 is the latest scored edition. It samples local 15-year-olds only: no data on primary schools, international schools or expat children. 60% of the score is students\' own reports of belonging and bullying, which vary with culture as well as with schools.',
  },
  {
    key: 'healthcare',
    name: 'Healthcare',
    description: 'How well the national health system covers and treats the people who live there: service coverage (UHC), treatment outcomes (HAQ), and doctors, beds and nurses. It does not measure access for newcomers. The badge shows what it means for your budget.',
    context: 'The score combines which essential services the population can use (UHC), how well the system prevents deaths from treatable conditions (HAQ, 32 causes), and whether there are enough doctors, beds and nurses. These describe the system for residents, not how easily a newcomer gets in or how long the waits are. The badge tells you what to expect financially: public coverage, mandatory insurance, employer-dependent, or budget for private.',
    methodology: 'healthcare = UHC × 0.35 + HAQ × 0.35 + capacity × 0.30. capacity = physicians_norm × 0.40 + beds_norm × 0.35 + nurses_norm × 0.25.',
    category: 'economic',
    sources: ['WHO UHC Service Coverage Index', 'IHME GBD Healthcare Access & Quality', 'OECD Health Statistics'],
    defaultWeight: 5,
    sortOrder: 6,
    confidence: 'medium',
    knownLimitation: 'Data is several years old: UHC is from 2021, HAQ from GBD 2019, capacity from OECD 2022 (WHO for non-members). Scores are national averages; care in capital cities is usually better than in rural areas. Nothing here measures private insurance, wait times or cost.',
  },
  {
    key: 'infrastructure',
    name: 'Infrastructure',
    description: 'Quality of physical and digital infrastructure: transport, energy, communications, technology.',
    context: 'Reliable transport, stable electricity, fast internet, and modern communications infrastructure affect daily life in ways you stop noticing until they break. This dimension captures the physical and digital backbone that makes a country function smoothly.',
    methodology: 'infrastructure = imd_infra_score (direct pass-through, already 0 to 100)',
    category: 'economic',
    sources: ['IMD World Competitiveness Infrastructure Score'],
    defaultWeight: 5,
    sortOrder: 7,
    confidence: 'medium',
    knownLimitation: 'For Czechia, Vietnam, Panama, Uruguay and Costa Rica the value is an estimate based on the World Bank Logistics Performance Index, a different measure. These are marked as estimates on the country page.',
  },
  {
    key: 'climate',
    name: 'Climate',
    description: 'Temperature, sunshine, and rainfall scored against your preferred weather type. Select your preference during onboarding or adjust in the ranking view.',
    context: 'Climate is personal: there is no objectively best weather. Your preference for warmth, seasons, rainfall, and sunshine drives this score. Unlike other dimensions, climate varies dramatically within large countries; for large countries you can select a specific city, and the default is the largest city by population.',
    methodology: 'climate = 100 − (|avg_temp − ref| × penalty) − rain_penalty − sunshine_penalty. Reference temp and thresholds vary by weather type.',
    category: 'lifestyle',
    sources: ['Open-Meteo'],
    defaultWeight: 5,
    sortOrder: 8,
    confidence: 'medium',
    knownLimitation: 'For about 35 large countries you can pick a city; all others use one representative city. Heuristic scoring, not a climate model.',
  },
  {
    key: 'religious_freedom',
    name: 'Religious Freedom',
    description: 'How much the state restricts religious practice and how much hostility religious groups face from society. It does not measure how secular or how religious a country is.',
    context: 'For people of faith, the ability to practise openly without government restrictions or social hostility is fundamental. This dimension measures both state-level restrictions (laws, regulations) and social-level hostility (harassment, discrimination by neighbours or communities).',
    methodology: 'religious_freedom = (100 − pew_govt_normalised) × 0.50 + (100 − pew_social_normalised) × 0.50',
    category: 'identity',
    sources: ['Pew Government Restrictions Index', 'Pew Social Hostilities Index'],
    defaultWeight: 5,
    sortOrder: 9,
    confidence: 'medium',
    knownLimitation: 'Coded by Pew researchers from published reports, not a survey of residents. A high score means few restrictions and little hostility; it says nothing about whether daily life is secular or devout. Captures state and society level, not neighbourhood level.',
  },
  {
    key: 'english_proficiency',
    name: 'English Proficiency',
    description: 'Adult English ability as measured by the EF English Proficiency Index. English-native countries are scored at 100.',
    context: 'For non-native English speakers relocating abroad, the population\'s English ability determines how easily you can navigate daily life, work, and social connections without learning the local language. A high score means English gets you far; a low score means significant language investment.',
    methodology: 'english_proficiency = ef_epi_normalised. Native countries hardcoded to 100.',
    category: 'lifestyle',
    sources: ['EF English Proficiency Index'],
    defaultWeight: 5,
    sortOrder: 10,
    confidence: 'medium',
    knownLimitation: 'EF EPI tests people who chose to take a free online test, who are more educated and urban than average, so scores skew upward. Native-English countries are set to 100 rather than measured.',
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
export const MIN_COVERAGE_RATIO = 0.7;

/** Scores closer than this are treated as tied in user-facing copy. */
export const TIE_THRESHOLD = 2;

/**
 * Raw values the team filled in from a different source, keyed by `source.indicator`.
 * Shown as estimates in country detail and given 'low' confidence.
 */
export const ESTIMATED_VALUES: Record<string, string[]> = {
  'imd.infrastructure_score': ['CZ', 'VN', 'PA', 'UY', 'CR'],
  'gpi.gpi_score': ['LU'],
};

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
      { max: 20000, label: 'Low income' },
      { max: 40000, label: 'Middle income' },
      { max: 60000, label: 'High income' },
      { max: 160000, label: 'Very high income' },
    ],
  },
  'worldbank.homicide_rate': {
    ranges: [
      { max: 1, label: 'Very low' },
      { max: 3, label: 'Low' },
      { max: 10, label: 'Moderate' },
      { max: 1000, label: 'High' },
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
  'worldbank.oecd_ppp_aic': 'GDP per person, adjusted for local prices (World Bank, international dollars). A rough guide to local income levels. Used only when you choose "Local salary".',
  'worldbank.homicide_rate': 'Intentional homicides per 100,000 people (UNODC, published by the World Bank). Lower is safer.',
  'worldbank.price_level_ratio': 'Local price levels compared to the US. Below 1.0 means cheaper; above 1.0 means more expensive.',
  'worldbank.who_oop_pct': 'Share of health costs paid directly by individuals, not covered by insurance or government. Lower is better.',
  'worldbank.wgi_rule_of_law': 'How much people trust and follow society\'s rules — courts, contracts, police, property rights.',
  'worldbank.wgi_corruption_control': 'How well public power is kept in check. Higher means less corruption in government and institutions.',
  'numbeo.crime_index': 'Crowdsourced perception of crime levels. Based on surveys about safety walking alone, worry about property crime, etc.',
  'gpi.gpi_score': 'Measures a country\'s peacefulness based on conflict, political instability, and militarisation. Lower is more peaceful. Shown as context; not part of the Safety score.',
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
  'gelfand.tightness': 'How strictly a society enforces its social norms and expects conformity. Tight societies have low tolerance for rule-bending; loose societies are more permissive. Neither is better — it is a matter of personal fit.',
  'uz.tightness': 'How strictly a society enforces its social norms and expects conformity. Tight societies have low tolerance for rule-bending; loose societies are more permissive. Neither is better — it is a matter of personal fit.',
  'epi.waste_mgmt': 'How well a country manages waste and recycling infrastructure. Strongly tied to national wealth, so it reflects state capacity as much as citizen behaviour.',
  'whr.wallet_return': 'The share of people who believe a lost wallet would be returned if found by a stranger (2019 World Risk Poll, via the World Happiness Report). A measure of perceived trust, not a tested outcome.',
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

export const DIMENSION_SLUGS: Record<DimensionKey, string> = {
  purchasing_power: 'purchasing-power',
  civic_culture: 'rule-of-law',
  safety: 'safety',
  warmth: 'warmth',
  school_culture: 'school-culture',
  healthcare: 'healthcare',
  infrastructure: 'infrastructure',
  climate: 'climate',
  religious_freedom: 'religious-freedom',
  english_proficiency: 'english-proficiency',
};

export const SLUG_TO_DIMENSION: Record<string, DimensionKey> = Object.fromEntries(
  Object.entries(DIMENSION_SLUGS).map(([k, v]) => [v, k as DimensionKey]),
) as Record<string, DimensionKey>;

export const DIMENSION_SEO_TITLES: Record<DimensionKey, string> = {
  purchasing_power: 'Most Affordable Countries to Live In',
  civic_culture: 'Best Countries for Rule of Law',
  safety: 'Safest Countries to Live In',
  warmth: 'Most Welcoming Countries for Expats',
  school_culture: 'Best Countries for Schools and Education',
  healthcare: 'Best Countries for Healthcare',
  infrastructure: 'Best Countries for Infrastructure',
  climate: 'Best Countries by Climate',
  religious_freedom: 'Best Countries for Religious Freedom',
  english_proficiency: 'Best Countries for English Proficiency',
};

export const REGION_SLUGS: Record<Region, string> = {
  'Western Europe': 'western-europe',
  'Northern Europe': 'northern-europe',
  'Southern Europe': 'southern-europe',
  'Eastern Europe': 'eastern-europe',
  'North America': 'north-america',
  'Latin America': 'latin-america',
  'East Asia': 'east-asia',
  'Southeast Asia': 'southeast-asia',
  'South Asia': 'south-asia',
  'Middle East': 'middle-east',
  'Oceania': 'oceania',
  'Africa': 'africa',
};

export const SLUG_TO_REGION: Record<string, Region> = Object.fromEntries(
  Object.entries(REGION_SLUGS).map(([k, v]) => [v, k as Region]),
) as Record<string, Region>;
