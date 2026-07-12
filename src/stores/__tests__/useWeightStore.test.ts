import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_WEIGHTS } from '@/lib/constants';
import type { ClimatePreference, UserWeights } from '@/lib/types';

// --- localStorage mock ---
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { storage.set(key, value); }),
  removeItem: vi.fn((key: string) => { storage.delete(key); }),
  clear: vi.fn(() => { storage.clear(); }),
  get length() { return storage.size; },
  key: vi.fn(() => null),
};
vi.stubGlobal('localStorage', localStorageMock);

// Import AFTER stubbing localStorage so the module sees it
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useWeightStore, hydrateWeightStore } = await import('../useWeightStore');

const STORAGE_KEY = 'relocator-weights';

function resetStore() {
  useWeightStore.setState({
    weights: { ...DEFAULT_WEIGHTS },
    climateType: 'no_preference' as ClimatePreference,
    fromOnboarding: false,
    selectedCities: {},
    _hydrated: false,
  });
}

describe('useWeightStore persistence & migrations', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    resetStore();
  });

  // --- v1 migration ---
  it('migrates v1 blob: divides weights by 10 and rounds, adds selectedCities, migrates climate type', () => {
    const v1Blob = {
      state: {
        weights: {
          purchasing_power: 50, civic_culture: 80, safety: 35, warmth: 70,
          school_culture: 100, healthcare: 60, infrastructure: 45, climate: 90,
          religious_freedom: 20, english_proficiency: 15,
        },
        climateType: 'warm_sunny',
        fromOnboarding: true,
      },
      version: 1,
    };
    storage.set(STORAGE_KEY, JSON.stringify(v1Blob));
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state._hydrated).toBe(true);
    expect(state.weights.purchasing_power).toBe(5);
    expect(state.weights.civic_culture).toBe(8);
    expect(state.weights.safety).toBe(4);
    expect(state.weights.school_culture).toBe(10);
    expect(state.weights.infrastructure).toBe(5);
    expect(state.weights.english_proficiency).toBe(2);
    expect(state.climateType).toBe('sunny_warm');
    expect(state.fromOnboarding).toBe(true);
    expect(state.selectedCities).toEqual({});
  });

  // --- v2 migration ---
  it('migrates v2 blob: preserves weights, adds empty selectedCities, migrates climate type', () => {
    const v2Blob = {
      state: {
        weights: {
          purchasing_power: 8, civic_culture: 3, safety: 7, warmth: 2,
          school_culture: 9, healthcare: 6, infrastructure: 4, climate: 1,
          religious_freedom: 5, english_proficiency: 10,
        },
        climateType: 'mild_green',
        fromOnboarding: false,
      },
      version: 2,
    };
    storage.set(STORAGE_KEY, JSON.stringify(v2Blob));
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state._hydrated).toBe(true);
    expect(state.weights.purchasing_power).toBe(8);
    expect(state.weights.civic_culture).toBe(3);
    expect(state.climateType).toBe('green_rainy');
    expect(state.fromOnboarding).toBe(false);
    expect(state.selectedCities).toEqual({});
  });

  // --- v3 migration ---
  it('migrates v3 blob: maps old climate preference keys to new ones', () => {
    const v3Blob = {
      state: {
        weights: { ...DEFAULT_WEIGHTS },
        climateType: 'cold_crisp',
        fromOnboarding: true,
        selectedCities: { US: 'Chicago' },
      },
      version: 3,
    };
    storage.set(STORAGE_KEY, JSON.stringify(v3Blob));
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state._hydrated).toBe(true);
    expect(state.climateType).toBe('four_seasons');
    expect(state.selectedCities).toEqual({ US: 'Chicago' });
  });

  it('migrates v3 hot_tropical to tropical_heat', () => {
    const v3Blob = {
      state: {
        weights: { ...DEFAULT_WEIGHTS },
        climateType: 'hot_tropical',
        fromOnboarding: false,
        selectedCities: {},
      },
      version: 3,
    };
    storage.set(STORAGE_KEY, JSON.stringify(v3Blob));
    hydrateWeightStore();

    expect(useWeightStore.getState().climateType).toBe('tropical_heat');
  });

  // --- corrupted JSON ---
  it('falls back to defaults on corrupted JSON', () => {
    storage.set(STORAGE_KEY, 'not-json{{{invalid');
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state._hydrated).toBe(true);
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
    expect(state.climateType).toBe('no_preference');
    expect(state.fromOnboarding).toBe(false);
    expect(state.selectedCities).toEqual({});
  });

  // --- empty / missing storage ---
  it('falls back to defaults when storage key is missing', () => {
    // storage is empty from beforeEach
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state._hydrated).toBe(true);
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
    expect(state.climateType).toBe('no_preference');
    expect(state.selectedCities).toEqual({});
  });

  // --- unknown future version ---
  it('falls back to defaults for unknown version', () => {
    const futureBlob = {
      state: {
        weights: { ...DEFAULT_WEIGHTS, purchasing_power: 9 },
        climateType: 'warm_sunny',
        fromOnboarding: true,
        selectedCities: { US: 'NYC' },
      },
      version: 99,
    };
    storage.set(STORAGE_KEY, JSON.stringify(futureBlob));
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state._hydrated).toBe(true);
    // Should NOT have loaded the v99 data
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
  });

  // --- round-trip ---
  it('round-trip: save via store methods, then load preserves all fields', () => {
    // Hydrate from empty (defaults)
    hydrateWeightStore();

    // Modify state through store actions
    useWeightStore.getState().setWeight('safety', 9);
    useWeightStore.getState().setWeight('warmth', 2);
    useWeightStore.getState().setClimateType('four_seasons');
    useWeightStore.getState().setSelectedCity('us', 'Chicago');
    useWeightStore.getState().setAllWeights(
      { ...DEFAULT_WEIGHTS, purchasing_power: 10, healthcare: 1 },
      true,
    );

    // Verify something was written to storage
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Simulate new session: reset store, re-hydrate from localStorage
    resetStore();
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state._hydrated).toBe(true);
    expect(state.weights.purchasing_power).toBe(10);
    expect(state.weights.healthcare).toBe(1);
    // setAllWeights was called last, so safety/warmth revert to default
    expect(state.weights.safety).toBe(DEFAULT_WEIGHTS.safety);
    expect(state.climateType).toBe('four_seasons');
    expect(state.fromOnboarding).toBe(true);
    expect(state.selectedCities).toEqual({ US: 'Chicago' });
  });

  // --- round-trip with individual weight changes ---
  it('round-trip: individual weight changes persist correctly', () => {
    hydrateWeightStore();

    useWeightStore.getState().setWeight('civic_culture', 10);
    useWeightStore.getState().setWeight('english_proficiency', 0);

    resetStore();
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state.weights.civic_culture).toBe(10);
    expect(state.weights.english_proficiency).toBe(0);
    // Other weights remain default
    expect(state.weights.safety).toBe(DEFAULT_WEIGHTS.safety);
  });

  // --- hydrateWeightStore is idempotent ---
  it('hydration is idempotent: calling twice does not re-read storage', () => {
    const blob = {
      state: {
        weights: { ...DEFAULT_WEIGHTS, safety: 8 },
        climateType: 'no_preference' as ClimatePreference,
        fromOnboarding: false,
        selectedCities: {},
      },
      version: 4,
    };
    storage.set(STORAGE_KEY, JSON.stringify(blob));
    hydrateWeightStore();
    expect(useWeightStore.getState().weights.safety).toBe(8);

    // Change storage behind the store's back
    blob.state.weights.safety = 1;
    storage.set(STORAGE_KEY, JSON.stringify(blob));

    // Second hydrate should be a no-op
    hydrateWeightStore();
    expect(useWeightStore.getState().weights.safety).toBe(8);
  });

  // --- resetToDefaults clears persisted state ---
  it('resetToDefaults writes defaults back to storage', () => {
    hydrateWeightStore();
    useWeightStore.getState().setWeight('safety', 10);
    useWeightStore.getState().resetToDefaults();

    resetStore();
    hydrateWeightStore();

    const state = useWeightStore.getState();
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
    expect(state.climateType).toBe('no_preference');
    expect(state.fromOnboarding).toBe(false);
    expect(state.selectedCities).toEqual({});
  });
});
