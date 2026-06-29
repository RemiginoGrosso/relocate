import { createClient } from '@supabase/supabase-js';
import type { CountryScores, CountryDetail, DimensionKey, DimensionScore, RawIndex, ClimateData, Region } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface VCountryScoresRow {
  id: string;
  name: string;
  iso_alpha2: string;
  region: string;
  flag_emoji: string;
  capital_city: string;
  dimension_scores: Record<string, {
    score: number | null;
    confidence: string;
    components: Record<string, number>;
  }>;
}

function mapRowToCountryScores(row: VCountryScoresRow): CountryScores {
  const dimensionScores: Partial<Record<DimensionKey, DimensionScore>> = {};

  if (row.dimension_scores) {
    for (const [key, val] of Object.entries(row.dimension_scores)) {
      dimensionScores[key as DimensionKey] = {
        score: val.score,
        confidence: val.confidence as DimensionScore['confidence'],
        components: val.components ?? {},
      };
    }
  }

  return {
    id: row.id,
    name: row.name,
    iso: row.iso_alpha2,
    region: row.region as Region,
    flagEmoji: row.flag_emoji ?? '',
    capitalCity: row.capital_city,
    dimensionScores,
  };
}

export async function fetchAllCountryScores(): Promise<CountryScores[]> {
  const { data, error } = await supabase
    .from('v_country_scores')
    .select('*');

  if (error) throw new Error(`Failed to fetch country scores: ${error.message}`);
  if (!data) return [];

  return (data as VCountryScoresRow[]).map(mapRowToCountryScores);
}

export async function fetchCountryDetail(iso: string): Promise<CountryDetail | null> {
  const { data: countryData, error: countryError } = await supabase
    .from('v_country_scores')
    .select('*')
    .eq('iso_alpha2', iso.toUpperCase())
    .single();

  if (countryError || !countryData) return null;

  const country = mapRowToCountryScores(countryData as VCountryScoresRow);

  const { data: rawData } = await supabase
    .from('raw_indices')
    .select('source, indicator, value, unit, year, source_url')
    .eq('country_id', country.id)
    .order('source');

  const rawIndices: RawIndex[] = (rawData ?? []).map((r) => ({
    source: r.source,
    indicator: r.indicator,
    value: r.value,
    unit: r.unit,
    year: r.year,
    sourceUrl: r.source_url,
  }));

  const { data: climateRow } = await supabase
    .from('climate_data')
    .select('*')
    .eq('country_id', country.id)
    .order('data_year', { ascending: false })
    .limit(1)
    .single();

  const climate: ClimateData | null = climateRow
    ? {
        avgTempAnnual: climateRow.avg_temp_annual,
        avgTempWinter: climateRow.avg_temp_winter,
        avgTempSummer: climateRow.avg_temp_summer,
        sunshineHoursAnnual: climateRow.sunshine_hours_annual,
        rainDaysAnnual: climateRow.rain_days_annual,
        dataYear: climateRow.data_year,
      }
    : null;

  return { country, rawIndices, climate };
}
