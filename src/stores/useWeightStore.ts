import { create } from 'zustand';
import type { ClimatePreference, DimensionKey, UserWeights } from '@/lib/types';
import { DEFAULT_WEIGHTS } from '@/lib/constants';

interface WeightStore {
  weights: UserWeights;
  climateType: ClimatePreference;
  fromOnboarding: boolean;
  setWeight: (key: DimensionKey, value: number) => void;
  setClimateType: (type: ClimatePreference) => void;
  resetToDefaults: () => void;
  setAllWeights: (weights: UserWeights, fromOnboarding?: boolean) => void;
}

export const useWeightStore = create<WeightStore>((set) => ({
  weights: { ...DEFAULT_WEIGHTS },
  climateType: 'no_preference',
  fromOnboarding: false,
  setWeight: (key, value) =>
    set((state) => ({
      weights: { ...state.weights, [key]: value },
    })),
  setClimateType: (type) =>
    set({ climateType: type }),
  resetToDefaults: () =>
    set({ weights: { ...DEFAULT_WEIGHTS }, climateType: 'no_preference', fromOnboarding: false }),
  setAllWeights: (weights, fromOnboarding = false) =>
    set({ weights: { ...weights }, fromOnboarding }),
}));
