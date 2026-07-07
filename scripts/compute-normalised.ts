import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { minMaxNormalise, pisaAcademicNormalise } from '../src/lib/normalisation';
import { computeClimateScore } from '../src/lib/scoring';
import { ENGLISH_NATIVE_COUNTRIES } from '../src/lib/constants';

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
}

interface CountryRow {
  id: string;
  iso_alpha2: string;
}

interface ClimateRow {
  country_id: string;
  avg_temp_annual: number | null;
  sunshine_hours_annual: number | null;
  rain_days_annual: number | null;
}

type RawMap = Record<string, number | null>;

function getRaw(rawByCountry: Record<string, RawRow[]>, countryId: string): RawMap {
  const map: RawMap = {};
  for (const row of rawByCountry[countryId] ?? []) {
    map[`${row.source}.${row.indicator}`] = row.value;
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
      .select('country_id, source, indicator, value')
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
    .select('country_id, avg_temp_annual, sunshine_hours_annual, rain_days_annual');

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

    // Purchasing Power (needs live data from World Bank/OECD — placeholder from seed)
    const oecdPpp = safeNum(raw['worldbank.oecd_ppp_aic']);
    const priceLevel = safeNum(raw['worldbank.price_level_ratio']);
    const oopPct = safeNum(raw['worldbank.who_oop_pct']);
    if (oecdPpp != null || priceLevel != null) {
      const pppNorm = oecdPpp != null ? minMaxNormalise(oecdPpp, 8000, 160000) : null;
      const affordNorm = priceLevel != null ? minMaxNormalise(priceLevel, 0.10, 1.50, true) : null;
      const oopNorm = oopPct != null ? minMaxNormalise(oopPct, 5, 65, true) : null;
      const parts = [
        pppNorm != null ? pppNorm * 0.55 : null,
        affordNorm != null ? affordNorm * 0.30 : null,
        oopNorm != null ? oopNorm * 0.15 : null,
      ].filter((v): v is number => v != null);
      const weightSum = (pppNorm != null ? 0.55 : 0) + (affordNorm != null ? 0.30 : 0) + (oopNorm != null ? 0.15 : 0);
      const score = weightSum > 0 ? parts.reduce((a, b) => a + b, 0) / weightSum : null;
      scores.push({
        country_id: country.id,
        dimension_key: 'purchasing_power',
        score: score != null ? Math.round(score * 100) / 100 : null,
        confidence: score != null ? 'high' : 'no_data',
        component_scores: { oecd_ppp: pppNorm, cost_affordability: affordNorm, oop_burden: oopNorm },
      });
    }

    // Civic Culture (WGI governance × 0.60 + Numbeo street safety × 0.40)
    const wgiRol = safeNum(raw['worldbank.wgi_rule_of_law']);
    const wgiCc = safeNum(raw['worldbank.wgi_corruption_control']);
    const numbeoCrime = safeNum(raw['numbeo.crime_index']);
    if (wgiRol != null && wgiCc != null) {
      const governance = wgiRol * 0.55 + wgiCc * 0.45;
      const streetSafety = numbeoCrime != null ? 100 - numbeoCrime : null;
      let civicScore: number;
      let confidence: string;
      if (streetSafety != null) {
        civicScore = governance * 0.60 + streetSafety * 0.40;
        confidence = 'medium';
      } else {
        civicScore = governance;
        confidence = 'high';
      }
      scores.push({
        country_id: country.id,
        dimension_key: 'civic_culture',
        score: Math.round(civicScore * 100) / 100,
        confidence,
        component_scores: {
          wgi_rule_of_law: wgiRol,
          wgi_corruption: wgiCc,
          governance: Math.round(governance * 100) / 100,
          street_safety: streetSafety != null ? Math.round(streetSafety * 100) / 100 : null,
        },
      });
    }

    // Safety
    const gpi = safeNum(raw['gpi.gpi_score']);
    if (gpi != null) {
      const gpiNorm = minMaxNormalise(gpi, 1.00, 3.50, true);
      scores.push({
        country_id: country.id,
        dimension_key: 'safety',
        score: gpiNorm,
        confidence: 'high',
        component_scores: { gpi: gpiNorm },
      });
    }

    // Warmth (IVR × 0.40 + InterNations × 0.60, fallback to Gallup MAI)
    const ivr = safeNum(raw['hofstede.ivr']);
    const internations = safeNum(raw['internations.ease_rank']);
    const gallupMai = safeNum(raw['gallup.mai']);
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
    } else if (ivr != null || internations != null) {
      const intScore = internations != null ? ((53 - internations) / (53 - 1)) * 100 : null;
      const available: number[] = [];
      if (ivr != null) available.push(ivr);
      if (intScore != null) available.push(intScore);
      const warmthScore = available.reduce((a, b) => a + b, 0) / available.length;
      scores.push({
        country_id: country.id,
        dimension_key: 'warmth',
        score: Math.round(warmthScore * 100) / 100,
        confidence: 'low',
        component_scores: { ivr, internations_score: intScore != null ? Math.round(intScore * 100) / 100 : null },
      });
    } else if (gallupMai != null) {
      const maiNorm = minMaxNormalise(gallupMai, 1.0, 9.0, false);
      if (maiNorm != null) {
        scores.push({
          country_id: country.id,
          dimension_key: 'warmth',
          score: Math.round(maiNorm * 100) / 100,
          confidence: 'low',
          component_scores: { gallup_mai: Math.round(maiNorm * 100) / 100 },
        });
      }
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

    // Infrastructure
    const imd = safeNum(raw['imd.infrastructure_score']);
    if (imd != null) {
      scores.push({
        country_id: country.id,
        dimension_key: 'infrastructure',
        score: imd,
        confidence: 'high',
        component_scores: { imd_score: imd },
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
        confidence: govtNorm != null && socialNorm != null ? 'medium' : 'low',
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
