export type DimensionKey =
  | 'purchasing_power'
  | 'civic_culture'
  | 'safety'
  | 'warmth'
  | 'school_culture'
  | 'healthcare'
  | 'infrastructure'
  | 'climate'
  | 'religious_freedom'
  | 'english_proficiency';

export type Region =
  | 'Western Europe'
  | 'Northern Europe'
  | 'Southern Europe'
  | 'Eastern Europe'
  | 'North America'
  | 'Latin America'
  | 'East Asia'
  | 'Southeast Asia'
  | 'South Asia'
  | 'Middle East'
  | 'Oceania'
  | 'Africa';

export type Confidence = 'high' | 'medium' | 'low' | 'no_data';

export type ScoreTier = 'excellent' | 'good' | 'fair' | 'poor';

export type DimensionCategory = 'economic' | 'social' | 'safety' | 'lifestyle' | 'identity';

export interface DimensionScore {
  score: number | null;
  confidence: Confidence;
  components: Record<string, number>;
}

export interface CountryScores {
  id: string;
  name: string;
  iso: string;
  region: Region;
  flagEmoji: string;
  capitalCity: string;
  dimensionScores: Partial<Record<DimensionKey, DimensionScore>>;
}

export interface RankedCountry extends CountryScores {
  compositeScore: number;
  rank: number;
  nullDimensions: DimensionKey[];
  hasLimitedData: boolean;
}

export type UserWeights = Record<DimensionKey, number>;

export interface DimensionDefinition {
  key: DimensionKey;
  name: string;
  description: string;
  methodology: string;
  category: DimensionCategory;
  sources: string[];
  defaultWeight: number;
  sortOrder: number;
  confidence: Confidence;
  knownLimitation: string;
}

export type HouseholdSituation = 'solo' | 'couple' | 'family_young' | 'family_teen' | 'retiring';
export type IncomeSource = 'remote' | 'local_job' | 'pension';
export type CivicImportance = 'top_priority' | 'very_important' | 'nice_to_have' | 'not_important';
export type WarmthImportance = 'essential' | 'matters' | 'not_priority';
export type ClimatePreference = 'warm_sunny' | 'hot_tropical' | 'mild_green' | 'cold_crisp' | 'no_preference';

export interface ClimateProfile {
  label: string;
  description: string;
  referenceTemp: number;
  tempPenalty: number;
  rainThreshold: number;
  rainPenalty: number;
  sunshineThreshold: number;
  sunshinePenalty: number;
}
export type ReligiousNeeds = 'important' | 'not_priority';

export interface OnboardingAnswers {
  household: HouseholdSituation;
  income: IncomeSource;
  civicImportance: CivicImportance;
  warmthImportance: WarmthImportance;
  climatePreference: ClimatePreference;
  religiousNeeds: ReligiousNeeds;
}

export interface SeedCountry {
  name: string;
  iso_alpha2: string;
  iso_alpha3: string;
  region: Region;
  capital_city: string;
  capital_lat: number;
  capital_lon: number;
  flag_emoji: string;
}

export interface NormalisationParam {
  indicator: string;
  min_value: number;
  max_value: number;
  direction: 'higher_is_better' | 'lower_is_better';
}

export interface ClimateData {
  avgTempAnnual: number | null;
  avgTempWinter: number | null;
  avgTempSummer: number | null;
  sunshineHoursAnnual: number | null;
  rainDaysAnnual: number | null;
  dataYear: number | null;
}

export interface RawIndex {
  source: string;
  indicator: string;
  value: number | null;
  unit: string | null;
  year: number | null;
  sourceUrl: string | null;
}

export interface CountryDetail {
  country: CountryScores;
  rawIndices: RawIndex[];
  climate: ClimateData | null;
}
