"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AppState, Transaction, Bank } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";
import { ensureAnonymousAuth } from "@/lib/firebase";
import { syncExpensesToFirestore, loadExpensesFromFirestore } from "@/lib/firestore";

const STORAGE_KEY = "finflow_state";
const UID_KEY = "finflow_uid";
const MIGRATED_KEY = "finflow_migrated";

const DEFAULT_STATE: AppState = {
  budget: 80000,
  transactions: [],
  onboarded: false,
  banks: [{ id: "default", name: "Default Bank" }],
};

function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    return {
      ...parsed,
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions
            .filter((tx: Transaction) => !/^s\d+$/.test(tx.id))
            .map((tx: any) => ({ ...tx, bankId: tx.bankId || "default" }))
        : [],
      banks: Array.isArray(parsed.banks) ? parsed.banks : DEFAULT_STATE.banks,
    };
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
  const uidRef = useRef<string | null>(null);

  // Hydrate from localStorage first, then attempt Firebase sync
  useEffect(() => {
    const init = async () => {
      // 1. Load from localStorage (always fast, always first)
      const localState = loadState();
      const hasLocalData = localState.onboarded && localState.transactions.length > 0;

      // 2. Try to authenticate with Firebase
      let uid: string | null = null;
      try {
        uid = await ensureAnonymousAuth();
        if (uid) {
          uidRef.current = uid;
          localStorage.setItem(UID_KEY, uid);
        }
      } catch {
        // Firebase not configured or offline — that's fine
      }

      // 3. Migration logic
      if (hasLocalData && uid) {
        // User has local data — use it and sync to Firebase
        setState(localState);
        setHydrated(true);

        const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
        if (!alreadyMigrated) {
          // First-time migration: push localStorage data to Firestore
          syncExpensesToFirestore(uid, localState);
          localStorage.setItem(MIGRATED_KEY, "true");
        } else {
          // Already migrated — still sync current state
          syncExpensesToFirestore(uid, localState);
        }
      } else if (!hasLocalData && uid) {
        // No local data — try recovering from Firestore
        try {
          const firestoreState = await loadExpensesFromFirestore(uid);
          if (firestoreState && firestoreState.onboarded) {
            setState(firestoreState);
            saveState(firestoreState); // Restore to localStorage too
            setHydrated(true);
            return;
          }
        } catch {}
        // No Firestore data either — fresh start
        setState(localState);
        setHydrated(true);
      } else {
        // No Firebase at all — just use localStorage
        setState(localState);
        setHydrated(true);
      }
    };

    init();
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);

      // Sync to Firestore (debounced inside)
      const uid = uidRef.current || localStorage.getItem(UID_KEY);
      if (uid) {
        syncExpensesToFirestore(uid, next);
      }

      return next;
    });
  }, []);

  const completeOnboarding = useCallback(
    (budget: number) => {
      updateState((prev) => ({
        ...prev,
        budget,
        onboarded: true,
        transactions: [],
      }));
    },
    [updateState]
  );

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id">) => {
      const newTx: Transaction = {
        ...tx,
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: tx.date || getTodayISO(),
        bankId: tx.bankId || "default",
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

  const clearAll = useCallback((monthPrefix?: string) => {
    updateState((prev) => ({
      ...prev,
      transactions: monthPrefix
        ? prev.transactions.filter((tx) => !tx.date.startsWith(monthPrefix))
        : [],
    }));
  }, [updateState]);

  const clearCategory = useCallback(
    (categoryId: string, monthPrefix?: string) => {
      updateState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter(
          (tx) => tx.category !== categoryId || (monthPrefix ? !tx.date.startsWith(monthPrefix) : false)
        ),
      }));
    },
    [updateState]
  );

  const updateBudget = useCallback(
    (budget: number) => {
      updateState((prev) => ({ ...prev, budget }));
    },
    [updateState]
  );

  const addBank = useCallback(
    (bank: Omit<Bank, "id">) => {
      const newBank: Bank = {
        ...bank,
        id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      updateState((prev) => ({
        ...prev,
        banks: [...prev.banks, newBank],
      }));
      return newBank;
    },
    [updateState]
  );

  const updateBank = useCallback(
    (id: string, updates: Partial<Bank>) => {
      updateState((prev) => ({
        ...prev,
        banks: prev.banks.map((bank) => (bank.id === id ? { ...bank, ...updates } : bank)),
      }));
    },
    [updateState]
  );

  const deleteBank = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        banks: prev.banks.filter((bank) => bank.id !== id),
        transactions: prev.transactions.map((tx) =>
          tx.bankId === id ? { ...tx, bankId: "default" } : tx
        ),
      }));
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
    clearCategory,
    updateBudget,
    addBank,
    updateBank,
    deleteBank,
  };
}
