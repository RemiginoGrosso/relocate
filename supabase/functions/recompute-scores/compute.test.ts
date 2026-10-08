import { describe, it, expect } from 'vitest';
import {
  fetchAllRows,
  getRaw,
  staleScoreKeys,
  type DimensionScore,
  type RawRow,
} from './compute.ts';

// Fake PostgREST: serves `total` rows but never more than `cap` per request, like the live API.
function fakeTable(total: number, cap = 1000, reportedCount: number | null = total) {
  const rows = Array.from({ length: total }, (_, i) => i);
  return async (from: number, to: number) => ({
    rows: rows.slice(from, Math.min(to + 1, from + cap)),
    count: reportedCount,
  });
}

describe('fetchAllRows', () => {
  it('reads every row of a table larger than one page', async () => {
    const rows = await fetchAllRows(fakeTable(1986));
    expect(rows).toHaveLength(1986);
  });

  it('reads a table that is an exact multiple of the page size', async () => {
    expect(await fetchAllRows(fakeTable(2000))).toHaveLength(2000);
  });

  it('throws when the rows read do not match the table count', async () => {
    // Server caps pages at 500 while the caller asks for 1000: the loop stops early
    await expect(fetchAllRows(fakeTable(1986, 500))).rejects.toThrow('Read 500 rows but the table holds 1986');
  });

  it('throws when the count is unavailable', async () => {
    await expect(fetchAllRows(fakeTable(10, 1000, null))).rejects.toThrow('Row count unavailable');
  });
});

describe('getRaw', () => {
  const row = (value: number, year: number): RawRow => ({
    country_id: 'c1',
    source: 'worldbank',
    indicator: 'homicide_rate',
    value,
    year,
  });

  it('keeps the latest year whatever the row order', () => {
    expect(getRaw({ c1: [row(1, 2021), row(2, 2023), row(3, 2022)] }, 'c1')['worldbank.homicide_rate']).toBe(2);
    expect(getRaw({ c1: [row(2, 2023), row(1, 2021)] }, 'c1')['worldbank.homicide_rate']).toBe(2);
  });
});

describe('staleScoreKeys', () => {
  it('returns stored scores that no longer compute', () => {
    const stored = [
      { id: 'a', country_id: 'c1', dimension_key: 'warmth' },
      { id: 'b', country_id: 'c1', dimension_key: 'safety' },
    ];
    const computed: DimensionScore[] = [
      { country_id: 'c1', dimension_key: 'safety', score: 50, confidence: 'high', component_scores: {} },
    ];
    expect(staleScoreKeys(stored, computed)).toEqual([{ id: 'a', country_id: 'c1', dimension_key: 'warmth' }]);
  });
});
