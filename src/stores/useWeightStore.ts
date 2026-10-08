import { create } from 'zustand';
import type { ClimatePreference, DimensionKey, IncomeType, UserWeights } from '@/lib/types';
import { DEFAULT_WEIGHTS } from '@/lib/constants';

const STORAGE_KEY = 'relocator-weights';
const STORAGE_VERSION = 4;

interface PersistedState {
  weights: UserWeights;
  climateType: ClimatePreference;
  fromOnboarding: boolean;
  selectedCities: Record<string, string>;
  incomeType: IncomeType;
}

interface WeightStore extends PersistedState {
  _hydrated: boolean;
  setWeight: (key: DimensionKey, value: number) => void;
  setClimateType: (type: ClimatePreference) => void;
  setSelectedCity: (iso: string, cityName: string) => void;
  setIncomeType: (type: IncomeType) => void;
  resetToDefaults: () => void;
  setAllWeights: (weights: UserWeights, fromOnboarding?: boolean) => void;
}

function saveToStorage(state: PersistedState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state, version: STORAGE_VERSION }),
    );
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function migrateV1Weights(weights: UserWeights): UserWeights {
  return Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, Math.round((v as number) / 10)]),
  ) as UserWeights;
}

const CLIMATE_V3_TO_V4: Record<string, ClimatePreference> = {
  warm_sunny: 'sunny_warm',
  hot_tropical: 'tropical_heat',
  mild_green: 'green_rainy',
  cold_crisp: 'four_seasons',
};

function migrateClimatePreference(pref: string): ClimatePreference {
  return (CLIMATE_V3_TO_V4[pref] ?? pref) as ClimatePreference;
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state: PersistedState; version: number };
    if (parsed.version === 1) {
      return { ...parsed.state, weights: migrateV1Weights(parsed.state.weights), selectedCities: {}, climateType: migrateClimatePreference(parsed.state.climateType) };
    }
    if (parsed.version === 2) {
      return { ...parsed.state, selectedCities: {}, climateType: migrateClimatePreference(parsed.state.climateType) };
    }
    if (parsed.version === 3) {
      return { ...parsed.state, climateType: migrateClimatePreference(parsed.state.climateType) };
    }
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export const useWeightStore = create<WeightStore>()((set, get) => ({
  weights: { ...DEFAULT_WEIGHTS },
  climateType: 'no_preference' as ClimatePreference,
  fromOnboarding: false,
  selectedCities: {} as Record<string, string>,
  incomeType: 'abroad' as IncomeType,
  _hydrated: false,

  setWeight: (key, value) => {
    set((state) => {
      const next = { weights: { ...state.weights, [key]: value } };
      saveToStorage({ ...get(), ...next });
      return next;
    });
  },

  setClimateType: (type) => {
    set({ climateType: type });
    const s = get();
    saveToStorage({ weights: s.weights, climateType: type, fromOnboarding: s.fromOnboarding, selectedCities: s.selectedCities, incomeType: s.incomeType });
  },

  setIncomeType: (type) => {
    set({ incomeType: type });
    const s = get();
    saveToStorage({ weights: s.weights, climateType: s.climateType, fromOnboarding: s.fromOnboarding, selectedCities: s.selectedCities, incomeType: type });
  },

  setSelectedCity: (iso, cityName) => {
    set((state) => {
      const next = { selectedCities: { ...state.selectedCities, [iso.toUpperCase()]: cityName } };
      saveToStorage({ ...get(), ...next });
      return next;
    });
  },

  resetToDefaults: () => {
    const defaults: PersistedState = {
      weights: { ...DEFAULT_WEIGHTS },
      climateType: 'no_preference',
      fromOnboarding: false,
      selectedCities: {},
      incomeType: 'abroad',
    };
    set({ ...defaults });
    saveToStorage(defaults);
  },

  setAllWeights: (weights, fromOnboarding = false) => {
    set({ weights: { ...weights }, fromOnboarding });
    const s = get();
    saveToStorage({ weights, climateType: s.climateType, fromOnboarding, selectedCities: s.selectedCities, incomeType: s.incomeType });
  },
}));

export function hydrateWeightStore() {
  if (useWeightStore.getState()._hydrated) return;
  const saved = loadFromStorage();
  if (saved) {
    // incomeType was added without a version bump; older saved state defaults to income from abroad
    useWeightStore.setState({ ...saved, incomeType: saved.incomeType ?? 'abroad', _hydrated: true });
  } else {
    useWeightStore.setState({ _hydrated: true });
  }
}
