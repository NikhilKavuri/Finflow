import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Split } from "@/lib/types";

interface SplitStore {
  splits: Split[];
  currentSplit: Split | null;
  loading: boolean;
  error: string | null;

  setSplits: (splits: Split[]) => void;
  addSplit: (split: Split) => void;
  updateSplit: (id: string, updates: Partial<Split>) => void;
  deleteSplit: (id: string) => void;
  setCurrentSplit: (split: Split | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSplits: () => void;
}

export const useSplitStore = create<SplitStore>()(
  devtools(
    persist(
      immer((set) => ({
        splits: [],
        currentSplit: null,
        loading: false,
        error: null,

        setSplits: (splits) => set({ splits }),

        addSplit: (split) =>
          set((state) => {
            state.splits.unshift(split);
          }),

        updateSplit: (id, updates) =>
          set((state) => {
            const index = state.splits.findIndex((s) => s.id === id);
            if (index !== -1) {
              state.splits[index] = { ...state.splits[index], ...updates };
            }
          }),

        deleteSplit: (id) =>
          set((state) => {
            state.splits = state.splits.filter((s) => s.id !== id);
          }),

        setCurrentSplit: (split) => set({ currentSplit: split }),

        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error }),

        clearSplits: () => set({ splits: [], currentSplit: null, error: null }),
      })),
      {
        name: "split-store",
        storage: {
          getItem: async (name) => {
            const item = await AsyncStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
      }
    )
  )
);
