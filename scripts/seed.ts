import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

config({ path: join(__dirname, '..', '.env.local') });
import { DIMENSIONS } from '../src/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  console.error('Set them in .env.local or export them before running this script');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function loadJson<T>(filename: string): T {
  const path = join(__dirname, '..', 'src', 'lib', 'seed', filename);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

interface SeedCountry {
  name: string;
  iso_alpha2: string;
  iso_alpha3: string;
  region: string;
  capital_city: string;
  capital_lat: number;
  capital_lon: number;
  flag_emoji: string;
}

interface HofstedeEntry {
  iso_alpha2: string;
  pdi: number;
  idv: number;
  mas: number;
  uai: number;
  lto: number;
  ivr: number;
}

interface GallupMaiEntry {
  iso_alpha2: string;
  mai: number;
}

interface WvsEntry {
  iso_alpha2: string;
  trust_pct: number;
}

interface NumbeoCrimeEntry {
  iso_alpha2: string;
  crime_index: number;
}

interface HaqEntry {
  iso_alpha2: string;
  haq_score: number;
}

interface HealthCapacityEntry {
  iso_alpha2: string;
  physicians_per_1000: number;
  beds_per_1000: number;
  nurses_per_1000: number;
}

interface PisaEntry {
  iso_alpha2: string;
  reading: number;
  maths: number;
  science: number;
  belonging_index: number;
  bullying_index: number;
  safety_index: number;
}

interface NormParam {
  indicator: string;
  min_value: number;
  max_value: number;
  direction: string;
}

type ExternalIndices = Record<string, Record<string, number>>;

interface ClimateEntry {
  avg_temp_annual: number;
  avg_temp_winter: number;
  avg_temp_summer: number;
  sunshine_hours_annual: number;
  rain_days_annual: number;
  avg_humidity_pct: number;
}

type ClimateData = Record<string, ClimateEntry>;

async function seedCountries(countries: SeedCountry[]) {
  console.log(`Seeding ${countries.length} countries...`);
  const { error } = await supabase
    .from('countries')
    .upsert(
      countries.map((c) => ({
        name: c.name,
        iso_alpha2: c.iso_alpha2,
        iso_alpha3: c.iso_alpha3,
        region: c.region,
        capital_city: c.capital_city,
        capital_lat: c.capital_lat,
        capital_lon: c.capital_lon,
        flag_emoji: c.flag_emoji,
        is_active: true,
      })),
      { onConflict: 'iso_alpha2' },
    );
  if (error) throw new Error(`Countries seed failed: ${error.message}`);
  console.log('  Countries seeded.');
}

async function seedDimensions() {
  console.log(`Seeding ${DIMENSIONS.length} dimensions...`);
  const { error } = await supabase
    .from('dimensions')
    .upsert(
      DIMENSIONS.map((d) => ({
        key: d.key,
        name: d.name,
        description: d.description,
        methodology: d.methodology,
        icon: '',
        default_weight: d.defaultWeight,
        category: d.category,
        sources: d.sources,
        sort_order: d.sortOrder,
      })),
      { onConflict: 'key' },
    );
  if (error) throw new Error(`Dimensions seed failed: ${error.message}`);
  console.log('  Dimensions seeded.');
}

async function getCountryIdMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('countries')
    .select('id, iso_alpha2');
  if (error) throw new Error(`Failed to fetch country IDs: ${error.message}`);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.iso_alpha2] = row.id;
  }
  return map;
}

async function seedHofstede(hofstede: HofstedeEntry[], countryIds: Record<string, string>) {
  console.log(`Seeding Hofstede data for ${hofstede.length} countries...`);
  const rows = [];
  for (const h of hofstede) {
    const countryId = countryIds[h.iso_alpha2];
    if (!countryId) continue;
    const dims = [
      { indicator: 'pdi', value: h.pdi },
      { indicator: 'idv', value: h.idv },
      { indicator: 'mas', value: h.mas },
      { indicator: 'uai', value: h.uai },
      { indicator: 'lto', value: h.lto },
      { indicator: 'ivr', value: h.ivr },
    ];
    for (const d of dims) {
      rows.push({
        country_id: countryId,
        source: 'hofstede',
        indicator: d.indicator,
        value: d.value,
        unit: 'index_0_100',
        year: 2010,
        source_url: 'https://hofstede-insights.com',
      });
    }
  }
  const { error } = await supabase
    .from('raw_indices')
    .upsert(rows, { onConflict: 'country_id,source,indicator,year' });
  if (error) throw new Error(`Hofstede seed failed: ${error.message}`);
  console.log(`  Hofstede seeded: ${rows.length} rows.`);
}

async function seedGallupMai(data: GallupMaiEntry[], countryIds: Record<string, string>) {
  console.log(`Seeding Gallup MAI data for ${data.length} countries...`);
  const rows = data
    .filter((g) => countryIds[g.iso_alpha2])
    .map((g) => ({
      country_id: countryIds[g.iso_alpha2],
      source: 'gallup',
      indicator: 'mai',
      value: g.mai,
      unit: 'index_0_9',
      year: 2018,
      source_url: 'https://worldhappiness.report/ed/2018/',
    }));
  const { error } = await supabase
    .from('raw_indices')
    .upsert(rows, { onConflict: 'country_id,source,indicator,year' });
  if (error) throw new Error(`Gallup MAI seed failed: ${error.message}`);
  console.log(`  Gallup MAI seeded: ${rows.length} rows.`);
}

async function seedNumbeoCrime(data: NumbeoCrimeEntry[], countryIds: Record<string, string>) {
  console.log(`Seeding Numbeo Crime data for ${data.length} countries...`);
  const rows = data
    .filter((n) => countryIds[n.iso_alpha2])
    .map((n) => ({
      country_id: countryIds[n.iso_alpha2],
      source: 'numbeo',
      indicator: 'crime_index',
      value: n.crime_index,
      unit: 'index_0_100',
      year: 2026,
      source_url: 'https://www.numbeo.com/crime/rankings_by_country.jsp',
    }));
  const { error } = await supabase
    .from('raw_indices')
    .upsert(rows, { onConflict: 'country_id,source,indicator,year' });
  if (error) throw new Error(`Numbeo Crime seed failed: ${error.message}`);
  console.log(`  Numbeo Crime seeded: ${rows.length} rows.`);
}

async function seedWvs(wvs: WvsEntry[], countryIds: Record<string, string>) {
  console.log(`Seeding WVS data for ${wvs.length} countries...`);
  const rows = wvs
    .filter((w) => countryIds[w.iso_alpha2])
    .map((w) => ({
      country_id: countryIds[w.iso_alpha2],
      source: 'wvs',
      indicator: 'trust_pct',
      value: w.trust_pct,
      unit: 'percentage',
      year: 2022,
      source_url: 'https://worldvaluessurvey.org',
    }));
  const { error } = await supabase
    .from('raw_indices')
    .upsert(rows, { onConflict: 'country_id,source,indicator,year' });
  if (error) throw new Error(`WVS seed failed: ${error.message}`);
  console.log(`  WVS seeded: ${rows.length} rows.`);
}

async function seedHaq(data: HaqEntry[], countryIds: Record<string, string>) {
  console.log(`Seeding HAQ Index data for ${data.length} countries...`);
  const rows = data
    .filter((h) => countryIds[h.iso_alpha2])
    .map((h) => ({
      country_id: countryIds[h.iso_alpha2],
      source: 'ihme',
      indicator: 'haq_index',
      value: h.haq_score,
      unit: 'index_0_100',
      year: 2019,
      source_url: 'https://ghdx.healthdata.org/record/ihme-data/gbd-2019-healthcare-access-and-quality-1990-2019',
    }));
  const { error } = await supabase
    .from('raw_indices')
    .upsert(rows, { onConflict: 'country_id,source,indicator,year' });
  if (error) throw new Error(`HAQ seed failed: ${error.message}`);
  console.log(`  HAQ seeded: ${rows.length} rows.`);
}

async function seedHealthCapacity(data: HealthCapacityEntry[], countryIds: Record<string, string>) {
  console.log(`Seeding health capacity data for ${data.length} countries...`);
  const rows: Array<Record<string, unknown>> = [];
  for (const entry of data) {
    const countryId = countryIds[entry.iso_alpha2];
    if (!countryId) continue;
    const source = 'oecd';
    const indicators = [
      { indicator: 'physicians_per_1000', value: entry.physicians_per_1000 },
      { indicator: 'beds_per_1000', value: entry.beds_per_1000 },
      { indicator: 'nurses_per_1000', value: entry.nurses_per_1000 },
    ];
    for (const ind of indicators) {
      rows.push({
        country_id: countryId,
        source,
        indicator: ind.indicator,
        value: ind.value,
        unit: 'per_1000_population',
        year: 2022,
        source_url: 'https://www.oecd.org/health/health-data.htm',
      });
    }
  }
  const { error } = await supabase
    .from('raw_indices')
    .upsert(rows, { onConflict: 'country_id,source,indicator,year' });
  if (error) throw new Error(`Health capacity seed failed: ${error.message}`);
  console.log(`  Health capacity seeded: ${rows.length} rows.`);
}

async function seedPisa(pisa: PisaEntry[], countryIds: Record<string, string>) {
  console.log(`Seeding PISA data for ${pisa.length} countries...`);
  const rows = [];
  for (const p of pisa) {
    const countryId = countryIds[p.iso_alpha2];
    if (!countryId) continue;
    const indicators = [
      { indicator: 'pisa_reading', value: p.reading, unit: 'score' },
      { indicator: 'pisa_maths', value: p.maths, unit: 'score' },
      { indicator: 'pisa_science', value: p.science, unit: 'score' },
      { indicator: 'pisa_belonging', value: p.belonging_index, unit: 'index' },
      { indicator: 'pisa_bullying', value: p.bullying_index, unit: 'index' },
      { indicator: 'pisa_safety', value: p.safety_index, unit: 'index' },
    ];
    for (const ind of indicators) {
      rows.push({
        country_id: countryId,
        source: 'pisa',
        indicator: ind.indicator,
        value: ind.value,
        unit: ind.unit,
        year: 2022,
        source_url: 'https://oecd.org/pisa/data/',
      });
    }
  }
  const { error } = await supabase
    .from('raw_indices')
    .upsert(rows, { onConflict: 'country_id,source,indicator,year' });
  if (error) throw new Error(`PISA seed failed: ${error.message}`);
  console.log(`  PISA seeded: ${rows.length} rows.`);
}

async function seedNormalisationParams(params: NormParam[]) {
  console.log(`Seeding ${params.length} normalisation params...`);
  const { error } = await supabase
    .from('normalisation_params')
    .upsert(
      params.map((p) => ({
        indicator: p.indicator,
        min_value: p.min_value,
        max_value: p.max_value,
        direction: p.direction,
      })),
      { onConflict: 'indicator' },
    );
  if (error) throw new Error(`Normalisation params seed failed: ${error.message}`);
  console.log('  Normalisation params seeded.');
}

async function seedExternalIndices(data: ExternalIndices, countryIds: Record<string, string>) {
  const rows = [];
  for (const [iso, indicators] of Object.entries(data)) {
    if (iso === '_meta') continue;
    const countryId = countryIds[iso];
    if (!countryId) continue;
    for (const [key, value] of Object.entries(indicators)) {
      const [source, indicator] = key.split('.');
      rows.push({
        country_id: countryId,
        source,
        indicator,
        value,
        unit: 'various',
        year: 2023,
        source_url: null,
      });
    }
  }
  console.log(`Seeding ${rows.length} external index rows...`);
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('raw_indices')
      .upsert(batch, { onConflict: 'country_id,source,indicator,year' });
    if (error) throw new Error(`External indices seed failed: ${error.message}`);
  }
  console.log(`  External indices seeded: ${rows.length} rows.`);
}

async function seedClimate(data: ClimateData, countryIds: Record<string, string>) {
  const rows = [];
  for (const [iso, climate] of Object.entries(data)) {
    if (iso === '_meta') continue;
    const countryId = countryIds[iso];
    if (!countryId) continue;
    rows.push({
      country_id: countryId,
      avg_temp_annual: climate.avg_temp_annual,
      avg_temp_winter: climate.avg_temp_winter,
      avg_temp_summer: climate.avg_temp_summer,
      sunshine_hours_annual: climate.sunshine_hours_annual,
      rain_days_annual: climate.rain_days_annual,
      avg_humidity_pct: climate.avg_humidity_pct,
      data_year: 2023,
    });
  }
  console.log(`Seeding climate data for ${rows.length} countries...`);
  const { error } = await supabase
    .from('climate_data')
    .upsert(rows, { onConflict: 'country_id,data_year' });
  if (error) throw new Error(`Climate seed failed: ${error.message}`);
  console.log(`  Climate data seeded.`);
}

async function main() {
  console.log('Loading seed data files...');
  const countries = loadJson<SeedCountry[]>('countries.json');
  const hofstede = loadJson<HofstedeEntry[]>('hofstede.json');
  const gallupMai = loadJson<GallupMaiEntry[]>('gallup-mai.json');
  const wvs = loadJson<WvsEntry[]>('wvs.json');
  const numbeoCrime = loadJson<NumbeoCrimeEntry[]>('numbeo-crime.json');
  const haqIndex = loadJson<HaqEntry[]>('haq-index.json');
  const healthCapacity = loadJson<HealthCapacityEntry[]>('health-capacity.json');
  const pisa = loadJson<PisaEntry[]>('pisa.json');
  const normParams = loadJson<NormParam[]>('normalisation_params.json');
  const externalIndices = loadJson<ExternalIndices>('external-indices.json');
  const climateData = loadJson<ClimateData>('climate.json');

  await seedCountries(countries);
  await seedDimensions();

  const countryIds = await getCountryIdMap();
  console.log(`Found ${Object.keys(countryIds).length} countries in database.`);

  await seedHofstede(hofstede, countryIds);
  await seedGallupMai(gallupMai, countryIds);
  await seedWvs(wvs, countryIds);
  await seedNumbeoCrime(numbeoCrime, countryIds);
  await seedHaq(haqIndex, countryIds);
  await seedHealthCapacity(healthCapacity, countryIds);
  await seedPisa(pisa, countryIds);
  await seedExternalIndices(externalIndices, countryIds);
  await seedClimate(climateData, countryIds);
  await seedNormalisationParams(normParams);

  console.log('\nSeed complete. Run compute-normalised.ts next to populate normalised_scores.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
