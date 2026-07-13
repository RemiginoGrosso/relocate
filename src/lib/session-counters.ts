'use client';

// Lightweight sessionStorage-backed counters used only to enrich analytics properties
// (e.g. TRACKING_PLAN.md's `countries_explored_before` on `methodology_viewed`). Cleared
// automatically when the browser tab/session ends — no persistence beyond one session.

const COUNTRIES_EXPLORED_KEY = 'relocator-analytics-countries-explored';

function readCount(key: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.sessionStorage.getItem(key);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeCount(key: string, value: number) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

/** Returns the current count without incrementing it. */
export function getCountriesExploredCount(): number {
  return readCount(COUNTRIES_EXPLORED_KEY);
}

/** Increments and persists the countries-explored counter for this session. */
export function incrementCountriesExploredCount(): void {
  writeCount(COUNTRIES_EXPLORED_KEY, readCount(COUNTRIES_EXPLORED_KEY) + 1);
}
