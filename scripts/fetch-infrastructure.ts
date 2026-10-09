/**
 * Writes src/lib/seed/infrastructure.json from the World Bank API: LPI infrastructure,
 * internet users (% of population) and fixed broadband subscriptions per 100 people,
 * latest value per country in the last five years (the same window as refresh-world-bank).
 * Re-run to update the seed; production is kept current by the monthly refresh.
 *
 * Usage: npx tsx scripts/fetch-infrastructure.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SEED_DIR = join(__dirname, '..', 'src', 'lib', 'seed');
const INDICATORS = {
  lpi_infrastructure: 'LP.LPI.INFR.XQ',
  internet_users_pct: 'IT.NET.USER.ZS',
  fixed_broadband_per100: 'IT.NET.BBND.P2',
} as const;

type Latest = Record<string, { value: number; year: number }>;

async function fetchLatest(isoCodes: string[], wbId: string, dateRange: string): Promise<Latest> {
  const url = `https://api.worldbank.org/v2/country/${isoCodes.join(';')}/indicator/${wbId}?date=${dateRange}&format=json&per_page=1000`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`World Bank API error for ${wbId}: ${resp.status}`);
  const json = await resp.json();
  const out: Latest = {};
  for (const e of json[1] ?? []) {
    if (e.value == null) continue;
    const iso = e.country?.id;
    const year = parseInt(e.date, 10);
    if (!iso || isNaN(year)) continue;
    if (!out[iso] || year > out[iso].year) out[iso] = { value: e.value, year };
  }
  return out;
}

async function main() {
  const countries: { iso_alpha2: string }[] = JSON.parse(readFileSync(join(SEED_DIR, 'countries.json'), 'utf8'));
  // Taiwan is not a World Bank economy
  const isoCodes = countries.map((c) => c.iso_alpha2).filter((iso) => iso !== 'TW');
  const currentYear = new Date().getFullYear();
  const dateRange = `${currentYear - 5}:${currentYear}`;

  const results: Record<string, Latest> = {};
  for (const [key, wbId] of Object.entries(INDICATORS)) {
    results[key] = await fetchLatest(isoCodes, wbId, dateRange);
    console.log(`${key}: ${Object.keys(results[key]).length} countries`);
  }

  const rows = isoCodes.map((iso) => ({
    iso_alpha2: iso,
    ...Object.fromEntries(
      Object.keys(INDICATORS).flatMap((key) => [
        [key, results[key][iso]?.value ?? null],
        [`${key}_year`, results[key][iso]?.year ?? null],
      ]),
    ),
  }));
  writeFileSync(join(SEED_DIR, 'infrastructure.json'), JSON.stringify(rows, null, 2) + '\n');
  console.log(`Wrote ${rows.length} countries to src/lib/seed/infrastructure.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
