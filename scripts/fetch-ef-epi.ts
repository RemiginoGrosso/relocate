/**
 * Writes src/lib/seed/ef-epi.json from EF's public ranking page (ef.com/wwen/epi/), which
 * embeds every ranked country's score keyed by ISO code. Run once a year after EF publishes
 * a new edition (November), then seed and recompute.
 *
 * A country missing from the new edition keeps its score from the previous edition for one
 * more year, labelled with that year; older scores are dropped. English is a main language
 * countries (ENGLISH_NATIVE_COUNTRIES) are skipped: they score 100 without EF data.
 *
 * Usage: npx tsx scripts/fetch-ef-epi.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ENGLISH_NATIVE_COUNTRIES } from '../src/lib/constants';

const SEED_DIR = join(__dirname, '..', 'src', 'lib', 'seed');
const OUT_FILE = join(SEED_DIR, 'ef-epi.json');
const EF_URL = 'https://www.ef.com/wwen/epi/';

type EfEpiEntry = { iso_alpha2: string; score: number; year: number; source_url: string };

async function main() {
  const resp = await fetch(EF_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (relocateindex.com data refresh)' } });
  if (!resp.ok) throw new Error(`EF page error: ${resp.status}`);
  const html = await resp.text();

  const edition = html.match(/EF EPI (20\d\d)/);
  if (!edition) throw new Error('Edition year not found on the EF page');
  const year = parseInt(edition[1], 10);

  const scores: Record<string, number> = {};
  const re = /\{"([a-z]{2})":\{"countrySlug":"[^"]+","countryUrl":"[^"]+","countryPosition":"\d+","efEpiScore":(\d+)/g;
  for (const m of html.matchAll(re)) scores[m[1].toUpperCase()] = parseInt(m[2], 10);
  // EF ranks over 100 countries; a much smaller count means the page layout changed
  if (Object.keys(scores).length < 100) {
    throw new Error(`Only ${Object.keys(scores).length} countries parsed from the EF page; layout may have changed`);
  }

  const previous: EfEpiEntry[] = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, 'utf8')) : [];
  const countries: { iso_alpha2: string }[] = JSON.parse(readFileSync(join(SEED_DIR, 'countries.json'), 'utf8'));
  const native = new Set<string>(ENGLISH_NATIVE_COUNTRIES);

  const rows: EfEpiEntry[] = [];
  const missing: string[] = [];
  for (const { iso_alpha2: iso } of countries) {
    if (native.has(iso)) continue;
    if (scores[iso] != null) {
      rows.push({ iso_alpha2: iso, score: scores[iso], year, source_url: EF_URL });
      continue;
    }
    const prior = previous.find((p) => p.iso_alpha2 === iso);
    if (prior && prior.year >= year - 1) {
      rows.push(prior);
      console.log(`${iso}: not in EF ${year}, keeping ${prior.year} score ${prior.score}`);
    } else {
      missing.push(iso);
    }
  }

  writeFileSync(OUT_FILE, JSON.stringify(rows, null, 2) + '\n');
  console.log(`EF EPI ${year}: wrote ${rows.length} countries to src/lib/seed/ef-epi.json`);
  console.log(`No score: ${missing.join(', ') || 'none'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
