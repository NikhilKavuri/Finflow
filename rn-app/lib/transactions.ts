import type { SubExpense, Transaction } from "@/lib/types";

/** Sum of sub-expense amounts (expenses add, income subtracts). */
export function computeGroupAmount(subExpenses: SubExpense[]): number {
  return subExpenses.reduce((sum, sub) => {
    return sub.type === "income" ? sum - sub.amount : sum + sub.amount;
  }, 0);
}

/** Latest date among sub-expenses, or fallback. */
export function computeGroupDate(subExpenses: SubExpense[], fallback: string): string {
  if (subExpenses.length === 0) return fallback;
  return subExpenses.reduce((latest, sub) => (sub.date > latest ? sub.date : latest), subExpenses[0].date);
}

export function getTransactionDisplayAmount(tx: Transaction): number {
  if (tx.isGroup && tx.subExpenses && tx.subExpenses.length > 0) {
    return computeGroupAmount(tx.subExpenses);
  }
  return tx.amount;
}

export function syncGroupTransactionFields(
  tx: Transaction,
  fallbackDate: string
): Transaction {
  if (!tx.isGroup || !tx.subExpenses?.length) {
    return { ...tx, date: tx.date || fallbackDate };
  }
  const amount = computeGroupAmount(tx.subExpenses);
  const date = computeGroupDate(tx.subExpenses, tx.date || fallbackDate);
  return { ...tx, amount, date };
}

export function transactionMatchesSearch(tx: Transaction, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (tx.name.toLowerCase().includes(q)) return true;
  if (tx.isGroup && tx.subExpenses?.some((s) => s.name.toLowerCase().includes(q))) return true;
  return false;
}

export function createSubExpenseId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
