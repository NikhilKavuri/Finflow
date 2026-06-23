import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Expense } from "@/lib/types";

interface ExpenseStore {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearExpenses: () => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  devtools(
    persist(
      immer((set) => ({
        expenses: [],
        loading: false,
        error: null,

        setExpenses: (expenses) => set({ expenses }),
        
        addExpense: (expense) =>
          set((state) => {
            state.expenses.unshift(expense);
          }),

        updateExpense: (id, updates) =>
          set((state) => {
            const index = state.expenses.findIndex((e) => e.id === id);
            if (index !== -1) {
              state.expenses[index] = { ...state.expenses[index], ...updates };
            }
          }),

        deleteExpense: (id) =>
          set((state) => {
            state.expenses = state.expenses.filter((e) => e.id !== id);
          }),

        setLoading: (loading) => set({ loading }),
        
        setError: (error) => set({ error }),

        clearExpenses: () => set({ expenses: [], error: null }),
      })),
      {
        name: "expense-store",
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
