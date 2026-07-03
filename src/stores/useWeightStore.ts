import { create } from 'zustand';
import type { ClimatePreference, DimensionKey, UserWeights } from '@/lib/types';
import { DEFAULT_WEIGHTS } from '@/lib/constants';

const STORAGE_KEY = 'relocator-weights';
const STORAGE_VERSION = 3;

interface PersistedState {
  weights: UserWeights;
  climateType: ClimatePreference;
  fromOnboarding: boolean;
  selectedCities: Record<string, string>;
}

interface WeightStore extends PersistedState {
  _hydrated: boolean;
  setWeight: (key: DimensionKey, value: number) => void;
  setClimateType: (type: ClimatePreference) => void;
  setSelectedCity: (iso: string, cityName: string) => void;
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

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state: PersistedState; version: number };
    if (parsed.version === 1) {
      return { ...parsed.state, weights: migrateV1Weights(parsed.state.weights), selectedCities: {} };
    }
    if (parsed.version === 2) {
      return { ...parsed.state, selectedCities: {} };
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
    saveToStorage({ weights: s.weights, climateType: type, fromOnboarding: s.fromOnboarding, selectedCities: s.selectedCities });
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
    };
    set({ ...defaults });
    saveToStorage(defaults);
  },

  setAllWeights: (weights, fromOnboarding = false) => {
    set({ weights: { ...weights }, fromOnboarding });
    const s = get();
    saveToStorage({ weights, climateType: s.climateType, fromOnboarding, selectedCities: s.selectedCities });
  },
}));

export function hydrateWeightStore() {
  if (useWeightStore.getState()._hydrated) return;
  const saved = loadFromStorage();
  if (saved) {
    useWeightStore.setState({ ...saved, _hydrated: true });
  } else {
    useWeightStore.setState({ _hydrated: true });
  }
}
