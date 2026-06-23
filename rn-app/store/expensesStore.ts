import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/lib/firebase";
import type { AppState, Transaction, Bank, PaymentMethodConfig, SubExpense } from "@/lib/types";
import { syncGroupTransactionFields } from "@/lib/transactions";
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

function isReservedPeriodCardTx(
  tx: Pick<Transaction, "date" | "paymentMethod" | "paymentMethodId">,
  paymentMethods: PaymentMethodConfig[]
): boolean {
  if (tx.paymentMethod !== "credit_card") return false;
  const card = paymentMethods.find((pm) => pm.id === tx.paymentMethodId)
    || paymentMethods.find((pm) => pm.type === "credit_card");
  if (!card) return false;

  const cycleEnd = card.billingCycleStart ?? 15;
  const payDay = card.paymentDueDay ?? 5;
  const txDay = Number(tx.date.slice(8, 10));

  if (payDay < cycleEnd) {
    return txDay > cycleEnd || txDay <= payDay;
  } else {
    return txDay > cycleEnd && txDay <= payDay;
  }
}

function getBankBalanceDelta(
  tx: Pick<Transaction, "amount" | "type" | "paymentMethod" | "paymentMethodId" | "date">,
  paymentMethods: PaymentMethodConfig[]
): number {
  if (tx.type === "expense" && tx.paymentMethod === "credit_card") {
    if (isReservedPeriodCardTx(tx, paymentMethods)) return -tx.amount;
    return 0;
  }
  return tx.type === "expense" ? -tx.amount : tx.amount;
}

function applySubExpenseBankDeltas(
  banks: Bank[],
  subExpenses: SubExpense[],
  paymentMethods: PaymentMethodConfig[],
  direction: 1 | -1
): Bank[] {
  let updated = banks;
  for (const sub of subExpenses) {
    const delta = getBankBalanceDelta(sub, paymentMethods) * direction;
    if (delta === 0) continue;
    updated = updated.map((bank) =>
      bank.id === sub.bankId ? { ...bank, balance: (bank.balance ?? 0) + delta } : bank
    );
  }
  return updated;
}

function applyGroupBankDeltas(
  tx: Transaction,
  banks: Bank[],
  paymentMethods: PaymentMethodConfig[],
  direction: 1 | -1
): Bank[] {
  if (tx.isGroup && tx.subExpenses?.length) {
    return applySubExpenseBankDeltas(banks, tx.subExpenses, paymentMethods, direction);
  }
  const delta = getBankBalanceDelta(tx, paymentMethods) * direction;
  if (delta === 0) return banks;
  return banks.map((bank) =>
    bank.id === tx.bankId ? { ...bank, balance: (bank.balance ?? 0) + delta } : bank
  );
}

async function loadStateAsync(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
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

async function saveStateAsync(state: AppState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

interface ExpensesStore {
  state: AppState;
  hydrated: boolean;
  init: (uid: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  updateState: (updater: (prev: AppState) => AppState) => void;
  completeOnboarding: (budget: number) => void;
  addTransaction: (tx: Omit<Transaction, "id">) => Transaction;
  deleteTransaction: (id: string) => void;
  clearAll: (monthPrefix?: string) => void;
  clearCategory: (categoryId: string, monthPrefix?: string) => void;
  updateBudget: (budget: number, budgetCycleStartDay?: number) => void;
  editTransaction: (id: string, updates: Partial<Omit<Transaction, "id">>) => void;
  updateMonthlyBudget: (monthPrefix: string, amount: number) => void;
  getBudgetForMonth: (monthPrefix: string) => number;
  addBank: (bank: Omit<Bank, "id">) => Bank;
  updateBank: (id: string, updates: Partial<Bank>) => void;
  deleteBank: (id: string) => void;
  addPaymentMethod: (pm: Omit<PaymentMethodConfig, "id">) => PaymentMethodConfig;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  deletePaymentMethod: (id: string) => void;
}

export const useExpensesStore = create<ExpensesStore>((set, get) => ({
  state: DEFAULT_STATE,
  hydrated: false,

  reset: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(UID_KEY);
    set({ state: DEFAULT_STATE, hydrated: false });
  },

  refresh: async () => {
    const uid = await AsyncStorage.getItem(UID_KEY);
    if (uid) {
      const firestoreState = await loadExpensesFromFirestore(uid);
      if (firestoreState && firestoreState.onboarded) {
        set({ state: firestoreState, hydrated: true });
        await saveStateAsync(firestoreState);
      }
    }
  },

  init: async (uid: string | null) => {
    let resolvedUid = uid;
    if (!resolvedUid) {
      resolvedUid = await AsyncStorage.getItem(UID_KEY);
    } else {
      await AsyncStorage.setItem(UID_KEY, resolvedUid);
    }

    // 1. Try Firebase First (Source of Truth)
    if (resolvedUid) {
      try {
        const firestoreState = await loadExpensesFromFirestore(resolvedUid);
        if (firestoreState && firestoreState.onboarded) {
          const restoredState: AppState = {
            ...firestoreState,
            budgetCycleStartDay: normalizeDay(
              firestoreState.budgetCycleStartDay,
              DEFAULT_STATE.budgetCycleStartDay
            ),
            paymentMethods: normalizePaymentMethods(firestoreState.paymentMethods),
          };
          set({ state: restoredState, hydrated: true });
          await saveStateAsync(restoredState);
          return;
        }
      } catch (err) {
        console.warn("Firestore fetch failed, falling back to local state", err);
      }
    }

    // 2. Fallback to Local State
    const localState = await loadStateAsync();
    if (localState.onboarded) {
      set({ state: localState, hydrated: true });
      // If we got here, Firebase might be out of sync or offline, try to sync local -> firebase
      if (resolvedUid) syncExpensesToFirestore(resolvedUid, localState);
      return;
    }

    // 3. Default (Fresh install)
    set({ state: DEFAULT_STATE, hydrated: true });
  },

  updateState: (updater) => {
    set((store) => {
      const next = updater(store.state);
      saveStateAsync(next);
      AsyncStorage.getItem(UID_KEY).then(uid => {
        if (uid) syncExpensesToFirestore(uid, next);
      });
      return { state: next };
    });
  },

  completeOnboarding: (budget) => {
    get().updateState((prev) => ({
      ...prev,
      budget,
      onboarded: true,
      transactions: [],
    }));
  },

  addTransaction: (tx) => {
    const base: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: tx.date || getTodayISO(),
      bankId: tx.bankId || "default",
    };
    const newTx: Transaction = tx.isGroup
      ? syncGroupTransactionFields(base, getTodayISO())
      : base;

    get().updateState((prev) => {
      const updatedBanks = applyGroupBankDeltas(newTx, prev.banks, prev.paymentMethods, 1);
      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        banks: updatedBanks,
      };
    });
    return newTx;
  },

  deleteTransaction: (id) => {
    get().updateState((prev) => {
      const tx = prev.transactions.find((t) => t.id === id);
      const updatedBanks = tx
        ? applyGroupBankDeltas(tx, prev.banks, prev.paymentMethods, -1)
        : prev.banks;

      return {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        banks: updatedBanks,
      };
    });
  },

  clearAll: (monthPrefix) => {
    get().updateState((prev) => {
      const toRemove = monthPrefix
        ? prev.transactions.filter((tx) => tx.date.startsWith(monthPrefix))
        : prev.transactions;

      let updatedBanks = [...prev.banks];
      for (const tx of toRemove) {
        updatedBanks = applyGroupBankDeltas(tx, updatedBanks, prev.paymentMethods, -1);
      }

      return {
        ...prev,
        transactions: monthPrefix
          ? prev.transactions.filter((tx) => !tx.date.startsWith(monthPrefix))
          : [],
        banks: updatedBanks,
      };
    });
  },

  clearCategory: (categoryId, monthPrefix) => {
    get().updateState((prev) => {
      const toRemove = prev.transactions.filter(
        (tx) => tx.category === categoryId && (!monthPrefix || tx.date.startsWith(monthPrefix))
      );

      let updatedBanks = [...prev.banks];
      for (const tx of toRemove) {
        updatedBanks = applyGroupBankDeltas(tx, updatedBanks, prev.paymentMethods, -1);
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

  updateBudget: (budget, budgetCycleStartDay) => {
    get().updateState((prev) => ({
      ...prev,
      budget,
      budgetCycleStartDay: budgetCycleStartDay
        ? normalizeDay(budgetCycleStartDay, prev.budgetCycleStartDay)
        : prev.budgetCycleStartDay,
    }));
  },

  editTransaction: (id, updates) => {
    get().updateState((prev) => {
      const oldTx = prev.transactions.find((t) => t.id === id);
      if (!oldTx) return prev;

      const merged = { ...oldTx, ...updates };
      const newTx: Transaction = merged.isGroup
        ? syncGroupTransactionFields(merged, getTodayISO())
        : merged;

      let updatedBanks = applyGroupBankDeltas(oldTx, prev.banks, prev.paymentMethods, -1);
      updatedBanks = applyGroupBankDeltas(newTx, updatedBanks, prev.paymentMethods, 1);

      return {
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === id ? newTx : t)),
        banks: updatedBanks,
      };
    });
  },

  updateMonthlyBudget: (monthPrefix, amount) => {
    get().updateState((prev) => ({
      ...prev,
      monthlyBudgets: {
        ...(prev.monthlyBudgets || {}),
        [monthPrefix]: amount,
      },
    }));
  },

  getBudgetForMonth: (monthPrefix) => {
    const state = get().state;
    const monthly = state.monthlyBudgets?.[monthPrefix];
    if (monthly !== undefined) return monthly;
    return state.budget;
  },

  addBank: (bank) => {
    const newBank: Bank = {
      ...bank,
      id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      balance: bank.balance ?? 0,
      initialBalance: bank.balance ?? 0,
    };
    get().updateState((prev) => ({
      ...prev,
      banks: [...prev.banks, newBank],
    }));
    return newBank;
  },

  updateBank: (id, updates) => {
    get().updateState((prev) => ({
      ...prev,
      banks: prev.banks.map((bank) => {
        if (bank.id === id) {
          const updated = { ...bank, ...updates };
          if (updates.balance !== undefined && updates.initialBalance === undefined) {
            updated.initialBalance = updates.balance;
          }
          return updated;
        }
        return bank;
      }),
    }));
  },

  deleteBank: (id) => {
    get().updateState((prev) => ({
      ...prev,
      banks: prev.banks.filter((bank) => bank.id !== id),
      transactions: prev.transactions.map((tx) =>
        tx.bankId === id ? { ...tx, bankId: "default" } : tx
      ),
    }));
  },

  addPaymentMethod: (pm) => {
    const newPm: PaymentMethodConfig = {
      ...pm,
      id: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    get().updateState((prev) => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, newPm],
    }));
    return newPm;
  },

  updatePaymentMethod: (id, updates) => {
    get().updateState((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((pm) =>
        pm.id === id ? { ...pm, ...updates } : pm
      ),
    }));
  },

  deletePaymentMethod: (id) => {
    get().updateState((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((pm) => pm.id !== id),
    }));
  },
}));
