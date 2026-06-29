import { create } from 'zustand';
import type { DimensionKey, UserWeights } from '@/lib/types';
import { DEFAULT_WEIGHTS } from '@/lib/constants';

interface WeightStore {
  weights: UserWeights;
  fromOnboarding: boolean;
  setWeight: (key: DimensionKey, value: number) => void;
  resetToDefaults: () => void;
  setAllWeights: (weights: UserWeights, fromOnboarding?: boolean) => void;
}

export const useWeightStore = create<WeightStore>((set) => ({
  weights: { ...DEFAULT_WEIGHTS },
  fromOnboarding: false,
  setWeight: (key, value) =>
    set((state) => ({
      weights: { ...state.weights, [key]: value },
    })),
  resetToDefaults: () =>
    set({ weights: { ...DEFAULT_WEIGHTS }, fromOnboarding: false }),
  setAllWeights: (weights, fromOnboarding = false) =>
    set({ weights: { ...weights }, fromOnboarding }),
}));
