export interface Bank {
  id: string;
  name: string;
  balance?: number;
  initialBalance?: number;
}

export type PaymentMethod = "credit_card" | "upi" | "cash" | "bank_transfer" | "other";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  date: string; // ISO yyyy-mm-dd
  bankId: string;
  paymentMethod?: PaymentMethod;
  paymentMethodId?: string;
}

export interface AppState {
  budget: number;
  budgetCycleStartDay: number;
  transactions: Transaction[];
  onboarded: boolean;
  banks: Bank[];
  paymentMethods: PaymentMethodConfig[];
}

// ── Payment Method Config ───────────────────────────────────

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: PaymentMethod;
  emoji: string;
  /** For credit cards: billing cycle start day (1-28). e.g. 15 means cycle is 15th-14th */
  billingCycleStart?: number;
  /** For credit cards: payment due day (1-28). e.g. 5 means bill is due on the 5th */
  paymentDueDay?: number;
}

// ── Trip / Splitwise Types ──────────────────────────────────

export interface TripMember {
  id: string;
  name: string;
  avatar: string; // emoji avatar
}

export interface TripExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;       // member id
  splitAmong: string[]; // member ids (equal split)
  date: string;         // ISO date
  category?: string;
}

export interface TripSettlement {
  id: string;
  from: string;   // member id who pays
  to: string;     // member id who receives
  amount: number;
  settled: boolean;
  date: string;
}

export interface TripSession {
  id: string;
  name: string;
  emoji: string;
  members: TripMember[];
  expenses: TripExpense[];
  settlements: TripSettlement[];
  createdAt: string;
  archived: boolean;
}
