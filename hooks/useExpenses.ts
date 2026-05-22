"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AppState, Transaction, Bank, PaymentMethodConfig } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";
import { syncExpensesToFirestore, loadExpensesFromFirestore } from "@/lib/firestore";

const STORAGE_KEY = "finflow_state";
const UID_KEY = "finflow_uid";

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: "pm_card", name: "Credit Card", type: "credit_card", emoji: "💳", billingCycleStart: 15, paymentDueDay: 5 },
  { id: "pm_upi", name: "UPI", type: "upi", emoji: "📱" },
  { id: "pm_cash", name: "Cash", type: "cash", emoji: "💵" },
];

const DEFAULT_STATE: AppState = {
  budget: 80000,
  budgetCycleStartDay: 5,
  transactions: [],
  onboarded: false,
  banks: [{ id: "default", name: "Default Bank", balance: 0, initialBalance: 0 }],
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  monthlyBudgets: {},
};

function normalizeDay(value: unknown, fallback: number): number {
  const day = Number(value);
  if (!Number.isFinite(day)) return fallback;
  return Math.min(28, Math.max(1, Math.round(day)));
}

function normalizePaymentMethods(methods: unknown): PaymentMethodConfig[] {
  if (!Array.isArray(methods) || methods.length === 0) return DEFAULT_PAYMENT_METHODS;

  return methods.map((pm: any, index) => ({
    id: pm.id || `pm_${index}`,
    name: pm.name || "Payment Method",
    type: pm.type || "other",
    emoji: pm.emoji || "💳",
    billingCycleStart: pm.type === "credit_card" ? normalizeDay(pm.billingCycleStart, 15) : undefined,
    paymentDueDay: pm.type === "credit_card" ? normalizeDay(pm.paymentDueDay, 5) : undefined,
  }));
}

/**
 * Check if a credit card transaction falls in the "reserved" period:
 * After the billing cycle ends but before the pay date.
 * Reserved transactions are deducted from bank immediately.
 */
function isReservedPeriodCardTx(
  tx: Pick<Transaction, "date" | "paymentMethod" | "paymentMethodId">,
  paymentMethods: PaymentMethodConfig[]
): boolean {
  if (tx.paymentMethod !== "credit_card") return false;
  const card = paymentMethods.find((pm) => pm.id === tx.paymentMethodId)
    || paymentMethods.find((pm) => pm.type === "credit_card");
  if (!card) return false;

  const cycleEnd = card.billingCycleStart ?? 15; // cycle ends on this day (next cycle starts)
  const payDay = card.paymentDueDay ?? 5;
  const txDay = Number(tx.date.slice(8, 10));

  // Reserved period: after cycle end day, up to pay day
  // e.g. cycle ends 15th, pay day 3rd → reserved is 16th-31st of current month + 1st-3rd of next
  if (payDay < cycleEnd) {
    // Pay day is in the next month relative to cycle end (e.g., cycle end 15th, pay 3rd)
    return txDay > cycleEnd || txDay <= payDay;
  } else {
    // Pay day is same month as cycle end (e.g., cycle end 5th, pay 20th)
    return txDay > cycleEnd && txDay <= payDay;
  }
}

function getBankBalanceDelta(
  tx: Pick<Transaction, "amount" | "type" | "paymentMethod" | "paymentMethodId" | "date">,
  paymentMethods: PaymentMethodConfig[]
): number {
  if (tx.type === "expense" && tx.paymentMethod === "credit_card") {
    // Reserved period card transactions DO deduct from bank
    if (isReservedPeriodCardTx(tx, paymentMethods)) return -tx.amount;
    return 0; // Normal billing cycle card transactions don't affect bank
  }
  return tx.type === "expense" ? -tx.amount : tx.amount;
}

function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    return {
      ...parsed,
      budgetCycleStartDay: normalizeDay(parsed.budgetCycleStartDay, DEFAULT_STATE.budgetCycleStartDay),
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
      paymentMethods: normalizePaymentMethods(parsed.paymentMethods),
      monthlyBudgets: parsed.monthlyBudgets && typeof parsed.monthlyBudgets === "object" ? parsed.monthlyBudgets : {},
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

  // Hydrate: localStorage-first, Firestore as recovery fallback
  useEffect(() => {
    const init = async () => {
      const uid = user?.uid || localStorage.getItem(UID_KEY);
      if (uid) uidRef.current = uid;

      // 1. Always try localStorage first — it's synchronous and always the freshest
      const localState = loadState();
      const hasLocalData = localState.onboarded;

      if (hasLocalData) {
        setState(localState);
        setHydrated(true);
        // Sync to Firestore as backup
        if (uid) syncExpensesToFirestore(uid, localState);
        return;
      }

      // 2. No local data — try recovering from Firestore (new device / cleared cache)
      if (uid) {
        try {
          const firestoreState = await loadExpensesFromFirestore(uid);
          if (firestoreState && firestoreState.onboarded) {
            const restoredState: AppState = {
              ...firestoreState,
              budgetCycleStartDay: normalizeDay(
                firestoreState.budgetCycleStartDay,
                DEFAULT_STATE.budgetCycleStartDay
              ),
              paymentMethods: normalizePaymentMethods(firestoreState.paymentMethods),
            };
            setState(restoredState);
            saveState(restoredState); // Cache locally
            setHydrated(true);
            return;
          }
        } catch {
          // Firestore failed
        }
      }

      // 3. No data anywhere — fresh start
      setState(DEFAULT_STATE);
      setHydrated(true);
    };

    init();
  }, [user?.uid]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      const uid = uidRef.current || localStorage.getItem(UID_KEY);
      if (uid) syncExpensesToFirestore(uid, next);
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
            const newBalance = currentBalance + getBankBalanceDelta(newTx, prev.paymentMethods);
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
              const newBalance = currentBalance - getBankBalanceDelta(tx, prev.paymentMethods);
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
            const newBalance = currentBalance - getBankBalanceDelta(tx, prev.paymentMethods);
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
              const newBalance = currentBalance - getBankBalanceDelta(tx, prev.paymentMethods);
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
    (budget: number, budgetCycleStartDay?: number) => {
      updateState((prev) => ({
        ...prev,
        budget,
        budgetCycleStartDay: budgetCycleStartDay
          ? normalizeDay(budgetCycleStartDay, prev.budgetCycleStartDay)
          : prev.budgetCycleStartDay,
      }));
    },
    [updateState]
  );

  const editTransaction = useCallback(
    (id: string, updates: Partial<Omit<Transaction, "id">>) => {
      updateState((prev) => {
        const oldTx = prev.transactions.find((t) => t.id === id);
        if (!oldTx) return prev;

        const newTx: Transaction = { ...oldTx, ...updates };

        // Reverse old bank delta, apply new one
        let updatedBanks = prev.banks.map((bank) => {
          if (bank.id === oldTx.bankId) {
            const balance = (bank.balance ?? 0) - getBankBalanceDelta(oldTx, prev.paymentMethods);
            return { ...bank, balance };
          }
          return bank;
        });
        updatedBanks = updatedBanks.map((bank) => {
          if (bank.id === newTx.bankId) {
            const balance = (bank.balance ?? 0) + getBankBalanceDelta(newTx, prev.paymentMethods);
            return { ...bank, balance };
          }
          return bank;
        });

        return {
          ...prev,
          transactions: prev.transactions.map((t) => (t.id === id ? newTx : t)),
          banks: updatedBanks,
        };
      });
    },
    [updateState]
  );

  const updateMonthlyBudget = useCallback(
    (monthPrefix: string, amount: number) => {
      updateState((prev) => ({
        ...prev,
        monthlyBudgets: {
          ...(prev.monthlyBudgets || {}),
          [monthPrefix]: amount,
        },
      }));
    },
    [updateState]
  );

  const getBudgetForMonth = useCallback(
    (monthPrefix: string): number => {
      // Check per-month budget first
      const monthly = state.monthlyBudgets?.[monthPrefix];
      if (monthly !== undefined) return monthly;
      // Fallback to global budget
      return state.budget;
    },
    [state.monthlyBudgets, state.budget]
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

  const addPaymentMethod = useCallback(
    (pm: Omit<PaymentMethodConfig, "id">) => {
      const newPm: PaymentMethodConfig = {
        ...pm,
        id: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      updateState((prev) => ({
        ...prev,
        paymentMethods: [...prev.paymentMethods, newPm],
      }));
      return newPm;
    },
    [updateState]
  );

  const updatePaymentMethod = useCallback(
    (id: string, updates: Partial<PaymentMethodConfig>) => {
      updateState((prev) => ({
        ...prev,
        paymentMethods: prev.paymentMethods.map((pm) =>
          pm.id === id ? { ...pm, ...updates } : pm
        ),
      }));
    },
    [updateState]
  );

  const deletePaymentMethod = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        paymentMethods: prev.paymentMethods.filter((pm) => pm.id !== id),
      }));
    },
    [updateState]
  );

  return {
    state,
    hydrated,
    completeOnboarding,
    addTransaction,
    editTransaction,
    deleteTransaction,
    clearAll,
    clearCategory,
    updateBudget,
    updateMonthlyBudget,
    getBudgetForMonth,
    addBank,
    updateBank,
    deleteBank,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };
}
