import { create } from 'zustand';

interface CompareStore {
  compareIsos: string[];
  toggleCompare: (iso: string) => void;
  removeCompare: (iso: string) => void;
  clearCompare: () => void;
  isComparing: (iso: string) => boolean;
  canAddMore: () => boolean;
}

export const useCompareStore = create<CompareStore>()((set, get) => ({
  compareIsos: [],

  toggleCompare: (iso) => {
    const upper = iso.toUpperCase();
    set((state) => {
      if (state.compareIsos.includes(upper)) {
        return { compareIsos: state.compareIsos.filter((i) => i !== upper) };
      }
      if (state.compareIsos.length >= 3) return state;
      return { compareIsos: [...state.compareIsos, upper] };
    });
  },

  removeCompare: (iso) => {
    const upper = iso.toUpperCase();
    set((state) => ({
      compareIsos: state.compareIsos.filter((i) => i !== upper),
    }));
  },

  clearCompare: () => set({ compareIsos: [] }),

  isComparing: (iso) => get().compareIsos.includes(iso.toUpperCase()),

  canAddMore: () => get().compareIsos.length < 3,
}));
