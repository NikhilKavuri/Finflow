import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  email: string;
  name: string;
  budgetCycleStartDay: number;
  billingCycleStart: number;
  paymentDueDay: number;
  monthlyBudget: number;
}

interface UserStore {
  user: User | null;
  loading: boolean;
  error: string | null;

  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        loading: false,
        error: null,

        setUser: (user) => set({ user, error: null }),

        updateUser: (updates) =>
          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...updates };
            }
          }),

        clearUser: () => set({ user: null, error: null }),

        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error }),
      })),
      {
        name: "user-store",
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
