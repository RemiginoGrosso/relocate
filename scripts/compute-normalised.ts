import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { minMaxNormalise, pisaAcademicNormalise } from '../src/lib/normalisation';
import { computeClimateScore } from '../src/lib/scoring';
import { ENGLISH_NATIVE_COUNTRIES } from '../src/lib/constants';
import { computeInfrastructure, computePurchasingPower, computeRuleOfLaw, computeSafety } from '../src/lib/dimension-formulas';

config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface RawRow {
  country_id: string;
  source: string;
  indicator: string;
  value: number | null;
  year: number;
}

interface CountryRow {
  id: string;
  iso_alpha2: string;
}

interface ClimateRow {
  country_id: string;
  avg_temp_annual: number | null;
  avg_temp_winter: number | null;
  sunshine_hours_annual: number | null;
  rain_days_annual: number | null;
}

type RawMap = Record<string, number | null>;

// Latest year wins when an indicator has rows for several years.
function getRaw(rawByCountry: Record<string, RawRow[]>, countryId: string): RawMap {
  const map: RawMap = {};
  const years: Record<string, number> = {};
  for (const row of rawByCountry[countryId] ?? []) {
    const key = `${row.source}.${row.indicator}`;
    if (years[key] != null && years[key] >= row.year) continue;
    years[key] = row.year;
    map[key] = row.value;
  }
  return map;
}

function safeNum(val: number | null | undefined): number | null {
  return val != null && !isNaN(val) ? val : null;
}

async function main() {
  console.log('Fetching raw data...');

  const { data: countries } = await supabase
    .from('countries')
    .select('id, iso_alpha2')
    .eq('is_active', true);

  const allRawIndices: RawRow[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('raw_indices')
      .select('country_id, source, indicator, value, year')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to fetch raw_indices: ${error.message}`);
    if (!data || data.length === 0) break;
    allRawIndices.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const rawIndices = allRawIndices;

  const { data: climateData } = await supabase
    .from('climate_data')
    .select('country_id, avg_temp_annual, avg_temp_winter, sunshine_hours_annual, rain_days_annual');

  if (!countries || !rawIndices) {
    console.error('No data found. Run seed.ts first.');
    process.exit(1);
  }

  const rawByCountry: Record<string, RawRow[]> = {};
  for (const row of rawIndices) {
    if (!rawByCountry[row.country_id]) rawByCountry[row.country_id] = [];
    rawByCountry[row.country_id].push(row);
  }

  const climateByCountry: Record<string, ClimateRow> = {};
  for (const row of (climateData ?? [])) {
    climateByCountry[row.country_id] = row;
  }

  const scores: {
    country_id: string;
    dimension_key: string;
    score: number | null;
    confidence: string;
    component_scores: Record<string, number | null>;
  }[] = [];

  for (const country of countries as CountryRow[]) {
    const raw = getRaw(rawByCountry, country.id);
    const iso = country.iso_alpha2;

    // Purchasing Power: score = cost affordability (income from abroad); local_income component for local-job users
    const pp = computePurchasingPower(
      safeNum(raw['worldbank.oecd_ppp_aic']), // GDP per capita PPP (NY.GDP.PCAP.PP.CD); key name is historical
      safeNum(raw['worldbank.price_level_ratio']),
    );
    if (pp) {
      scores.push({
        country_id: country.id,
        dimension_key: 'purchasing_power',
        score: pp.score,
        confidence: pp.confidence,
        component_scores: pp.components,
      });
    }

    // Rule of Law (key civic_culture): WGI only
    const rol = computeRuleOfLaw(
      safeNum(raw['worldbank.wgi_rule_of_law']),
      safeNum(raw['worldbank.wgi_corruption_control']),
    );
    if (rol) {
      scores.push({
        country_id: country.id,
        dimension_key: 'civic_culture',
        score: rol.score,
        confidence: rol.confidence,
        component_scores: rol.components,
      });
    }

    // Safety: UNODC homicide (log) × 0.50 + Numbeo street crime × 0.50
    const safetyResult = computeSafety(
      safeNum(raw['worldbank.homicide_rate']),
      safeNum(raw['numbeo.crime_index']),
    );
    if (safetyResult) {
      scores.push({
        country_id: country.id,
        dimension_key: 'safety',
        score: safetyResult.score,
        confidence: safetyResult.confidence,
        component_scores: safetyResult.components,
      });
    }

    // Warmth (IVR × 0.40 + InterNations × 0.60) — both sources required
    const ivr = safeNum(raw['hofstede.ivr']);
    const internations = safeNum(raw['internations.ease_rank']);
    if (ivr != null && internations != null) {
      const intScore = ((53 - internations) / (53 - 1)) * 100;
      const warmthScore = ivr * 0.40 + intScore * 0.60;
      scores.push({
        country_id: country.id,
        dimension_key: 'warmth',
        score: Math.round(warmthScore * 100) / 100,
        confidence: 'high',
        component_scores: { ivr, internations_score: Math.round(intScore * 100) / 100 },
      });
    }

    // School Culture
    const pisaReading = safeNum(raw['pisa.pisa_reading']);
    const pisaMaths = safeNum(raw['pisa.pisa_maths']);
    const pisaScience = safeNum(raw['pisa.pisa_science']);
    const pisaBelonging = safeNum(raw['pisa.pisa_belonging']);
    const pisaBullying = safeNum(raw['pisa.pisa_bullying']);
    const pisaSafety = safeNum(raw['pisa.pisa_safety']);

    if (pisaReading != null || pisaMaths != null || pisaScience != null) {
      const academic = pisaAcademicNormalise(pisaReading, pisaMaths, pisaScience);
      const belonging = pisaBelonging != null ? minMaxNormalise(pisaBelonging, -0.30, 0.50) : null;
      const bullying = pisaBullying != null ? minMaxNormalise(pisaBullying, 0.05, 0.30, true) : null;
      const safety = pisaSafety != null ? minMaxNormalise(pisaSafety, 0.10, 0.55) : null;

      const parts: { val: number; weight: number }[] = [];
      if (academic != null) parts.push({ val: academic, weight: 0.25 });
      if (belonging != null) parts.push({ val: belonging, weight: 0.30 });
      if (bullying != null) parts.push({ val: bullying, weight: 0.30 });
      if (safety != null) parts.push({ val: safety, weight: 0.15 });

      if (parts.length > 0) {
        const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
        const score = parts.reduce((s, p) => s + p.val * (p.weight / totalWeight), 0);
        scores.push({
          country_id: country.id,
          dimension_key: 'school_culture',
          score: Math.round(score * 100) / 100,
          confidence: parts.length >= 3 ? 'high' : 'medium',
          component_scores: { academic, belonging, bullying_inv: bullying, safety },
        });
      }
    }

    // Healthcare V2: UHC × 0.35 + HAQ × 0.35 + capacity × 0.30
    const uhc = safeNum(raw['worldbank.who_uhc_coverage']);
    const haq = safeNum(raw['ihme.haq_index']);
    const physicians = safeNum(raw['oecd.physicians_per_1000']);
    const beds = safeNum(raw['oecd.beds_per_1000']);
    const nurses = safeNum(raw['oecd.nurses_per_1000']);
    if (uhc != null) {
      const uhcNorm = minMaxNormalise(uhc, 0, 100);

      let capacityScore: number | null = null;
      if (physicians != null && beds != null && nurses != null) {
        const physNorm = minMaxNormalise(physicians, 0, 6);
        const bedsNorm = minMaxNormalise(beds, 0, 13);
        const nursesNorm = minMaxNormalise(nurses, 0, 18);
        if (physNorm != null && bedsNorm != null && nursesNorm != null) {
          capacityScore = Math.round((physNorm * 0.40 + bedsNorm * 0.35 + nursesNorm * 0.25) * 100) / 100;
        }
      }

      let healthScore: number;
      let confidence: string;
      if (haq != null && capacityScore != null) {
        healthScore = uhcNorm! * 0.35 + haq * 0.35 + capacityScore * 0.30;
        confidence = 'high';
      } else if (haq != null) {
        healthScore = uhcNorm! * 0.50 + haq * 0.50;
        confidence = 'medium';
      } else {
        healthScore = uhcNorm!;
        confidence = 'medium';
      }

      scores.push({
        country_id: country.id,
        dimension_key: 'healthcare',
        score: Math.round(healthScore * 100) / 100,
        confidence,
        component_scores: {
          who_uhc: uhcNorm,
          haq_index: haq,
          capacity: capacityScore,
          physicians: physicians != null ? minMaxNormalise(physicians, 0, 6) : null,
          beds: beds != null ? minMaxNormalise(beds, 0, 13) : null,
          nurses: nurses != null ? minMaxNormalise(nurses, 0, 18) : null,
        },
      });
    }

    // Infrastructure: World Bank LPI infrastructure + internet users + fixed broadband
    const infra = computeInfrastructure(
      safeNum(raw['worldbank.lpi_infrastructure']),
      safeNum(raw['worldbank.internet_users_pct']),
      safeNum(raw['worldbank.fixed_broadband_per100']),
    );
    if (infra) {
      scores.push({
        country_id: country.id,
        dimension_key: 'infrastructure',
        score: infra.score,
        confidence: infra.confidence,
        component_scores: infra.components,
      });
    }

    // Climate
    const climateRow = climateByCountry[country.id];
    if (climateRow) {
      const climateScore = computeClimateScore(
        climateRow.avg_temp_annual,
        climateRow.rain_days_annual,
        climateRow.sunshine_hours_annual,
      );
      scores.push({
        country_id: country.id,
        dimension_key: 'climate',
        score: climateScore,
        confidence: 'high',
        component_scores: {
          avg_temp: climateRow.avg_temp_annual,
          avg_temp_winter: climateRow.avg_temp_winter,
          rain_days: climateRow.rain_days_annual,
          sunshine_hours: climateRow.sunshine_hours_annual,
        },
      });
    }

    // Religious Freedom
    const pewGovt = safeNum(raw['pew.govt_restrictions']);
    const pewSocial = safeNum(raw['pew.social_hostility']);
    if (pewGovt != null || pewSocial != null) {
      const govtNorm = pewGovt != null ? (100 - (pewGovt / 10) * 100) : null;
      const socialNorm = pewSocial != null ? (100 - (pewSocial / 10) * 100) : null;
      let rfScore: number | null = null;
      if (govtNorm != null && socialNorm != null) {
        rfScore = govtNorm * 0.50 + socialNorm * 0.50;
      } else if (govtNorm != null) {
        rfScore = govtNorm;
      } else if (socialNorm != null) {
        rfScore = socialNorm;
      }
      scores.push({
        country_id: country.id,
        dimension_key: 'religious_freedom',
        score: rfScore != null ? Math.round(rfScore * 100) / 100 : null,
        confidence: govtNorm != null && socialNorm != null ? 'high' : 'medium',
        component_scores: { pew_govt: govtNorm, pew_social: socialNorm },
      });
    }

    // English Proficiency
    const efEpi = safeNum(raw['ef.epi_score']);
    const isNative = (ENGLISH_NATIVE_COUNTRIES as readonly string[]).includes(iso);
    if (isNative) {
      scores.push({
        country_id: country.id,
        dimension_key: 'english_proficiency',
        score: 100,
        confidence: 'high',
        component_scores: { ef_epi: null, native_speaker: 1 },
      });
    } else if (efEpi != null) {
      const epiNorm = minMaxNormalise(efEpi, 400, 650);
      scores.push({
        country_id: country.id,
        dimension_key: 'english_proficiency',
        score: epiNorm,
        confidence: 'high',
        component_scores: { ef_epi: epiNorm },
      });
    }
  }

  console.log(`Computed ${scores.length} dimension scores for ${(countries as CountryRow[]).length} countries.`);

  // Delete all existing scores before writing — ensures stale rows from removed formula branches are cleaned
  const { error: deleteError } = await supabase.from('normalised_scores').delete().neq('country_id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) throw new Error(`Failed to clear normalised_scores: ${deleteError.message}`);
  console.log('Cleared existing normalised scores.');

  // Upsert in batches
  const batchSize = 50;
  for (let i = 0; i < scores.length; i += batchSize) {
    const batch = scores.slice(i, i + batchSize);
    const { error } = await supabase
      .from('normalised_scores')
      .upsert(
        batch.map((s) => ({
          country_id: s.country_id,
          dimension_key: s.dimension_key,
          score: s.score,
          confidence: s.confidence,
          component_scores: s.component_scores,
          computed_at: new Date().toISOString(),
        })),
        { onConflict: 'country_id,dimension_key' },
      );
    if (error) throw new Error(`Failed to upsert scores batch: ${error.message}`);
  }

  console.log('Normalised scores written to database.');

  // Refresh materialised view
  console.log('Refreshing materialised view...');
  const { error: refreshError } = await supabase.rpc('refresh_country_scores');
  if (refreshError) {
    console.warn('Could not refresh view via RPC. Run this SQL manually:');
    console.warn('  REFRESH MATERIALIZED VIEW CONCURRENTLY v_country_scores;');
    console.warn(`  Error: ${refreshError.message}`);
  } else {
    console.log('Materialised view refreshed.');
  }

  console.log('\nDone. All normalised scores computed and stored.');
}

main().catch((err) => {
  console.error('Compute failed:', err);
  process.exit(1);
});
