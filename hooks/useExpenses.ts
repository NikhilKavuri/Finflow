"use client";

import { useState, useEffect, useCallback } from "react";
import type { AppState, Transaction } from "@/lib/types";
import { SAMPLE_TRANSACTIONS } from "@/lib/sampleData";
import { getTodayISO } from "@/lib/utils";

const STORAGE_KEY = "finflow_state";

const DEFAULT_STATE: AppState = {
  budget: 80000,
  transactions: [],
  onboarded: false,
};

function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useExpenses() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(
    (budget: number) => {
      updateState((prev) => ({
        ...prev,
        budget,
        onboarded: true,
        transactions: prev.transactions.length === 0 ? SAMPLE_TRANSACTIONS : prev.transactions,
      }));
    },
    [updateState]
  );

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id" | "date">) => {
      const newTx: Transaction = {
        ...tx,
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: getTodayISO(),
      };
      updateState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
      return newTx;
    },
    [updateState]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }));
    },
    [updateState]
  );

  const clearAll = useCallback(() => {
    updateState((prev) => ({ ...prev, transactions: [] }));
  }, [updateState]);

  const updateBudget = useCallback(
    (budget: number) => {
      updateState((prev) => ({ ...prev, budget }));
    },
    [updateState]
  );

  return {
    state,
    hydrated,
    completeOnboarding,
    addTransaction,
    deleteTransaction,
    clearAll,
    updateBudget,
  };
}
