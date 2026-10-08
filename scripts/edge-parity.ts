/**
 * Read-only parity check: runs the recompute-scores edge logic (compute.ts) over
 * live raw_indices and compares every score and confidence with what production
 * serves today (written by scripts/compute-normalised.ts).
 *
 * Run before deploying recompute-scores and before re-enabling its cron.
 * Uses the public anon key only. Exits 1 on any mismatch.
 *
 * Usage: npx tsx scripts/edge-parity.ts
 */
import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  computeAllScores,
  fetchAllRows,
  type ClimateRow,
  type CountryRow,
  type RawRow,
} from '../supabase/functions/recompute-scores/compute';

config({ path: join(__dirname, '..', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}
const supabase = createClient(url, anonKey);

interface LiveRow {
  iso_alpha2: string;
  dimension_scores: Record<string, { score: number | null; confidence: string; components?: Record<string, number | null> } | null>;
}

async function main() {
  const { data: countries, error: cErr } = await supabase
    .from('countries')
    .select('id, iso_alpha2')
    .eq('is_active', true);
  if (cErr) throw new Error(cErr.message);

  const { data: climate, error: clErr } = await supabase
    .from('climate_data')
    .select('country_id, avg_temp_annual, avg_temp_winter, avg_temp_summer, sunshine_hours_annual, rain_days_annual')
    .order('data_year', { ascending: false });
  if (clErr) throw new Error(clErr.message);

  const raw = await fetchAllRows<RawRow>(async (from, to) => {
    const { data, error, count } = await supabase
      .from('raw_indices')
      .select('country_id, source, indicator, value, year', { count: 'exact' })
      .order('id')
      .range(from, to);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as RawRow[], count };
  });

  const { data: live, error: lErr } = await supabase
    .from('v_country_scores')
    .select('iso_alpha2, dimension_scores');
  if (lErr) throw new Error(lErr.message);

  const computed = computeAllScores(countries as CountryRow[], raw, (climate ?? []) as ClimateRow[]);
  const isoOf = Object.fromEntries((countries as CountryRow[]).map((c) => [c.id, c.iso_alpha2]));
  const idOf = Object.fromEntries((countries as CountryRow[]).map((c) => [c.iso_alpha2, c.id]));

  const liveMap = new Map<string, { score: number | null; confidence: string; components?: Record<string, number | null> }>();
  for (const row of live as LiveRow[]) {
    for (const [dim, v] of Object.entries(row.dimension_scores ?? {})) {
      if (v) liveMap.set(`${idOf[row.iso_alpha2] ?? row.iso_alpha2}|${dim}`, v);
    }
  }
  const computedMap = new Map(computed.map((s) => [`${s.country_id}|${s.dimension_key}`, s]));

  const mismatches: string[] = [];
  for (const [key, s] of computedMap) {
    const [cid, dim] = key.split('|');
    const l = liveMap.get(key);
    if (!l) {
      mismatches.push(`${isoOf[cid]} ${dim}: edge ${s.score} / live missing`);
      continue;
    }
    const scoreDiff = s.score == null || l.score == null ? s.score !== l.score : Math.abs(s.score - Number(l.score)) > 0.01;
    if (scoreDiff || s.confidence !== l.confidence) {
      mismatches.push(`${isoOf[cid]} ${dim}: edge ${s.score} ${s.confidence} / live ${l.score} ${l.confidence}`);
    }
    // Components matter too: the client swaps in local_income for local-job users
    const liveComp = l.components ?? {};
    for (const k of new Set([...Object.keys(s.component_scores), ...Object.keys(liveComp)])) {
      const a = s.component_scores[k] ?? null;
      const b = liveComp[k] ?? null;
      const differs = a == null || b == null ? a !== b : Math.abs(a - Number(b)) > 0.01;
      if (differs) mismatches.push(`${isoOf[cid]} ${dim}.${k}: edge ${a} / live ${b}`);
    }
  }
  for (const key of liveMap.keys()) {
    if (!computedMap.has(key)) {
      const [cid, dim] = key.split('|');
      mismatches.push(`${isoOf[cid] ?? cid} ${dim}: edge missing / live ${liveMap.get(key)!.score}`);
    }
  }

  console.log(`raw_indices rows read: ${raw.length}`);
  console.log(`scores: edge ${computedMap.size} / live ${liveMap.size}`);
  console.log(`mismatches: ${mismatches.length}`);
  for (const m of mismatches) console.log(`  ${m}`);
  process.exit(mismatches.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
