import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface UIStore {
  activeTab: string;
  showAddExpenseModal: boolean;
  showCategoryPicker: boolean;
  selectedCategory: string | null;
  filterDateRange: { start: Date; end: Date } | null;
  theme: "light" | "dark";

  setActiveTab: (tab: string) => void;
  setShowAddExpenseModal: (show: boolean) => void;
  setShowCategoryPicker: (show: boolean) => void;
  setSelectedCategory: (category: string | null) => void;
  setFilterDateRange: (range: { start: Date; end: Date } | null) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    activeTab: "overview",
    showAddExpenseModal: false,
    showCategoryPicker: false,
    selectedCategory: null,
    filterDateRange: null,
    theme: "dark",

    setActiveTab: (tab) => set({ activeTab: tab }),

    setShowAddExpenseModal: (show) => set({ showAddExpenseModal: show }),

    setShowCategoryPicker: (show) => set({ showCategoryPicker: show }),

    setSelectedCategory: (category) => set({ selectedCategory: category }),

    setFilterDateRange: (range) => set({ filterDateRange: range }),

    setTheme: (theme) => set({ theme }),
  }))
);
