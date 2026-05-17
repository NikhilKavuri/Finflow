"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AppState, Transaction, Bank } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";
import { syncExpensesToFirestore, loadExpensesFromFirestore } from "@/lib/firestore";

const STORAGE_KEY = "finflow_state";
const UID_KEY = "finflow_uid";
const MIGRATED_KEY = "finflow_migrated";

const DEFAULT_STATE: AppState = {
  budget: 80000,
  transactions: [],
  onboarded: false,
  banks: [{ id: "default", name: "Default Bank", balance: 0, initialBalance: 0 }],
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
      banks: Array.isArray(parsed.banks)
        ? parsed.banks.map((b: any) => ({
            ...b,
            balance: b.balance ?? 0,
            initialBalance: b.initialBalance ?? b.balance ?? 0,
          }))
        : DEFAULT_STATE.banks,
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
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const uidRef = useRef<string | null>(null);

  // Hydrate from localStorage first, then attempt Firebase sync
  useEffect(() => {
    const init = async () => {
      // 1. Load from localStorage
      const localState = loadState();
      const hasLocalData = localState.onboarded && localState.transactions.length > 0;

      // 2. Get uid from localStorage (set by AuthContext when user logs in)
      const uid = user?.uid || localStorage.getItem(UID_KEY);
      if (uid) {
        uidRef.current = uid;
      }

      // 3. Sync logic
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
        // No uid (user not logged in) or no data — just use localStorage
        setState(localState);
        setHydrated(true);
      }
    };

    init();
  }, [user?.uid]);

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
      updateState((prev) => {
        // Update bank balance
        const updatedBanks = prev.banks.map((bank) => {
          if (bank.id === newTx.bankId) {
            const currentBalance = bank.balance ?? 0;
            const newBalance = newTx.type === "expense"
              ? currentBalance - newTx.amount
              : currentBalance + newTx.amount;
            return { ...bank, balance: newBalance };
          }
          return bank;
        });

        return {
          ...prev,
          transactions: [newTx, ...prev.transactions],
          banks: updatedBanks,
        };
      });
      return newTx;
    },
    [updateState]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      updateState((prev) => {
        const tx = prev.transactions.find((t) => t.id === id);
        let updatedBanks = prev.banks;

        // Reverse the balance change
        if (tx) {
          updatedBanks = prev.banks.map((bank) => {
            if (bank.id === tx.bankId) {
              const currentBalance = bank.balance ?? 0;
              const newBalance = tx.type === "expense"
                ? currentBalance + tx.amount
                : currentBalance - tx.amount;
              return { ...bank, balance: newBalance };
            }
            return bank;
          });
        }

        return {
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
          banks: updatedBanks,
        };
      });
    },
    [updateState]
  );

  const clearAll = useCallback((monthPrefix?: string) => {
    updateState((prev) => {
      const toRemove = monthPrefix
        ? prev.transactions.filter((tx) => tx.date.startsWith(monthPrefix))
        : prev.transactions;

      // Reverse all balance changes
      let updatedBanks = [...prev.banks];
      for (const tx of toRemove) {
        updatedBanks = updatedBanks.map((bank) => {
          if (bank.id === tx.bankId) {
            const currentBalance = bank.balance ?? 0;
            const newBalance = tx.type === "expense"
              ? currentBalance + tx.amount
              : currentBalance - tx.amount;
            return { ...bank, balance: newBalance };
          }
          return bank;
        });
      }

      return {
        ...prev,
        transactions: monthPrefix
          ? prev.transactions.filter((tx) => !tx.date.startsWith(monthPrefix))
          : [],
        banks: updatedBanks,
      };
    });
  }, [updateState]);

  const clearCategory = useCallback(
    (categoryId: string, monthPrefix?: string) => {
      updateState((prev) => {
        const toRemove = prev.transactions.filter(
          (tx) => tx.category === categoryId && (!monthPrefix || tx.date.startsWith(monthPrefix))
        );

        // Reverse balance changes
        let updatedBanks = [...prev.banks];
        for (const tx of toRemove) {
          updatedBanks = updatedBanks.map((bank) => {
            if (bank.id === tx.bankId) {
              const currentBalance = bank.balance ?? 0;
              const newBalance = tx.type === "expense"
                ? currentBalance + tx.amount
                : currentBalance - tx.amount;
              return { ...bank, balance: newBalance };
            }
            return bank;
          });
        }

        return {
          ...prev,
          transactions: prev.transactions.filter(
            (tx) => tx.category !== categoryId || (monthPrefix ? !tx.date.startsWith(monthPrefix) : false)
          ),
          banks: updatedBanks,
        };
      });
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
        balance: bank.balance ?? 0,
        initialBalance: bank.balance ?? 0,
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
        banks: prev.banks.map((bank) => {
          if (bank.id === id) {
            const updated = { ...bank, ...updates };
            // If balance is being explicitly updated (from accounts page), also update initialBalance
            if (updates.balance !== undefined && updates.initialBalance === undefined) {
              updated.initialBalance = updates.balance;
            }
            return updated;
          }
          return bank;
        }),
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
