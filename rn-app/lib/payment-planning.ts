import type { PaymentMethodConfig, Transaction } from "./types";

export interface BudgetWindow {
  start: string;
  end: string;
}

export interface CardBill {
  paymentMethodId: string;
  name: string;
  emoji: string;
  cycleStart: string;
  cycleEnd: string;
  dueDate: string;
  amount: number;
  transactionCount: number;
}

export interface PaymentPlan {
  window: BudgetWindow;
  directSpend: number;
  cardDueTotal: number;
  cardFutureTotal: number;
  /** Card expenses in the reserved period (after cycle end, before pay date) */
  reservedCardSpend: number;
  totalPlannedSpend: number;
  income: number;
  budgetLeft: number;
  cardBills: CardBill[];
}

function parseISODate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function makeDate(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex)));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  return makeDate(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function monthCursor(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function getPaymentDueDate(cycleEnd: Date, paymentDueDay: number): Date {
  const sameMonthDueDate = makeDate(cycleEnd.getFullYear(), cycleEnd.getMonth(), paymentDueDay);
  if (sameMonthDueDate > cycleEnd) return sameMonthDueDate;
  return makeDate(cycleEnd.getFullYear(), cycleEnd.getMonth() + 1, paymentDueDay);
}

function isCreditCardTransaction(tx: Transaction, paymentMethods: PaymentMethodConfig[]): boolean {
  if (tx.paymentMethod === "credit_card") return true;
  if (!tx.paymentMethodId) return false;
  return paymentMethods.find((pm) => pm.id === tx.paymentMethodId)?.type === "credit_card";
}

function belongsToMethod(
  tx: Transaction,
  method: PaymentMethodConfig,
  creditCards: PaymentMethodConfig[]
): boolean {
  if (tx.paymentMethodId) return tx.paymentMethodId === method.id;
  if (tx.paymentMethod !== method.type) return false;
  if (method.type !== "credit_card") return true;
  return creditCards[0]?.id === method.id;
}

/**
 * Check if a transaction date is in the reserved period for a given card:
 * After the billing cycle end day, before the pay day.
 * Reserved expenses are committed but not yet billed — they're deducted from bank.
 */
export function isInReservedPeriod(txDate: string, card: PaymentMethodConfig): boolean {
  const cycleEnd = card.billingCycleStart ?? 15;
  const payDay = card.paymentDueDay ?? 5;
  const txDay = Number(txDate.slice(8, 10));

  if (payDay < cycleEnd) {
    // Pay day is in the next month relative to cycle end (e.g., cycle end 15th, pay 3rd)
    return txDay > cycleEnd || txDay <= payDay;
  } else {
    // Pay day is same month as cycle end (e.g., cycle end 5th, pay 20th)
    return txDay > cycleEnd && txDay <= payDay;
  }
}

export function getBudgetWindowForMonth(monthPrefix: string, budgetCycleStartDay: number): BudgetWindow {
  const [year, month] = monthPrefix.split("-").map(Number);
  const start = makeDate(year, month - 1, budgetCycleStartDay);
  const nextStart = makeDate(year, month, budgetCycleStartDay);

  return {
    start: toISODate(start),
    end: toISODate(addDays(nextStart, -1)),
  };
}

export function getPaymentPlan({
  transactions,
  paymentMethods,
  budget,
  budgetCycleStartDay,
  selectedMonth,
}: {
  transactions: Transaction[];
  paymentMethods: PaymentMethodConfig[];
  budget: number;
  budgetCycleStartDay: number;
  selectedMonth: string;
}): PaymentPlan {
  const window = getBudgetWindowForMonth(selectedMonth, budgetCycleStartDay);
  const creditCards = paymentMethods.filter((pm) => pm.type === "credit_card");

  const directSpend = transactions
    .filter(
      (tx) =>
        tx.type === "expense" &&
        isInRange(tx.date, window.start, window.end) &&
        !isCreditCardTransaction(tx, paymentMethods)
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  const income = transactions
    .filter((tx) => tx.type === "income" && isInRange(tx.date, window.start, window.end))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const cardBills: CardBill[] = [];

  for (const card of creditCards) {
    const cycleStartDay = card.billingCycleStart ?? 15;
    const paymentDueDay = card.paymentDueDay ?? 5;
    let cursor = monthCursor(addMonths(parseISODate(window.start), -3));
    const lastMonth = monthCursor(addMonths(parseISODate(window.end), 2));

    while (cursor <= lastMonth) {
      const cycleStart = makeDate(cursor.getFullYear(), cursor.getMonth(), cycleStartDay);
      const cycleEnd = addDays(addMonths(cycleStart, 1), -1);
      const dueDate = getPaymentDueDate(cycleEnd, paymentDueDay);
      const dueDateISO = toISODate(dueDate);

      if (isInRange(dueDateISO, window.start, window.end)) {
        const cycleStartISO = toISODate(cycleStart);
        const cycleEndISO = toISODate(cycleEnd);
        const cycleTransactions = transactions.filter(
          (tx) =>
            tx.type === "expense" &&
            belongsToMethod(tx, card, creditCards) &&
            isInRange(tx.date, cycleStartISO, cycleEndISO)
        );

        cardBills.push({
          paymentMethodId: card.id,
          name: card.name,
          emoji: card.emoji,
          cycleStart: cycleStartISO,
          cycleEnd: cycleEndISO,
          dueDate: dueDateISO,
          amount: cycleTransactions.reduce((sum, tx) => sum + tx.amount, 0),
          transactionCount: cycleTransactions.length,
        });
      }

      cursor = addMonths(cursor, 1);
    }
  }

  // Calculate reserved card spend: credit card expenses in the budget window
  // that fall in the reserved period (after cycle end, before pay date)
  const reservedCardSpend = transactions
    .filter((tx) => {
      if (tx.type !== "expense" || !isInRange(tx.date, window.start, window.end)) return false;
      if (!isCreditCardTransaction(tx, paymentMethods)) return false;
      const card = creditCards.find((method) => belongsToMethod(tx, method, creditCards));
      if (!card) return false;
      return isInReservedPeriod(tx.date, card);
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const cardDueTotal = cardBills.reduce((sum, bill) => sum + bill.amount, 0);
  const cardFutureTotal = transactions
    .filter((tx) => {
      if (tx.type !== "expense" || !isInRange(tx.date, window.start, window.end)) return false;
      if (!isCreditCardTransaction(tx, paymentMethods)) return false;

      const card = creditCards.find((method) => belongsToMethod(tx, method, creditCards));
      // Exclude if it's in a known card bill cycle
      const inBill = cardBills.some(
        (bill) =>
          bill.paymentMethodId === card?.id &&
          isInRange(tx.date, bill.cycleStart, bill.cycleEnd)
      );
      if (inBill) return false;
      // Exclude if it's in the reserved period (already counted separately)
      if (card && isInReservedPeriod(tx.date, card)) return false;
      return true;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalPlannedSpend = directSpend + cardDueTotal + cardFutureTotal + reservedCardSpend;

  return {
    window,
    directSpend,
    cardDueTotal,
    cardFutureTotal,
    reservedCardSpend,
    totalPlannedSpend,
    income,
    budgetLeft: budget - totalPlannedSpend,
    cardBills: cardBills.sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1)),
  };
}
