export interface Bank {
  id: string;
  name: string;
  balance?: number;
  initialBalance?: number;
}

export type PaymentMethod = "credit_card" | "upi" | "cash" | "bank_transfer" | "other";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  paymentMethod: PaymentMethod | "card" | "bank" | "check";
  accountId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Account {
  id: string;
  bankName: string;
  accountNumber?: string;
  type: "credit" | "debit" | "savings" | "current" | string;
  balance?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SplitParticipant {
  id: string;
  name: string;
  email?: string;
  amount?: number;
  status: "pending" | "settled" | "active" | string;
}

export interface Split {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  participants: SplitParticipant[];
  status: "active" | "settled" | string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Line item inside a category (group) expense. */
export interface SubExpense {
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
  /** Category / group expense with nested sub-expenses. */
  isGroup?: boolean;
  subExpenses?: SubExpense[];
}

export interface AppState {
  budget: number;
  budgetCycleStartDay: number;
  transactions: Transaction[];
  onboarded: boolean;
  banks: Bank[];
  paymentMethods: PaymentMethodConfig[];
  /** Per-month budgets keyed by month prefix e.g. "2026-05" → 80000 */
  monthlyBudgets?: Record<string, number>;
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

// ── Split Types ─────────────────────────────────────────────

export interface SplitMember {
  id: string;
  name: string;
  avatar: string; // emoji avatar
  email?: string;                               // linked email (if registered user)
  uid?: string;                                 // linked Firebase UID
  role?: "admin" | "member";                    // role in the split
  status?: "accepted" | "pending" | "rejected"; // invitation status
}

export interface SplitExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;       // legacy: member id (fallback when contributors not set)
  contributors?: SplitContribution[]; // optional multi-contributor support
  splitAmong: string[]; // member ids (equal split)
  date: string;         // ISO date
  category?: string;
}

export interface SplitContribution {
  memberId: string; // member id
  amount: number;   // contributed amount
}

export interface SplitSettlement {
  id: string;
  from: string;   // member id who pays
  to: string;     // member id who receives
  amount: number;
  settled: boolean;
  date: string;
  isPartialPayment?: boolean;
}

export interface SplitSession {
  id: string;
  name: string;
  emoji: string;
  members: SplitMember[];
  expenses: SplitExpense[];
  settlements: SplitSettlement[];
  createdAt: string;
  archived: boolean;
  creatorUid?: string;       // who created the split
  isCollaborative?: boolean; // true if stored in shared Firestore collection
}

// ── Notification Types ──────────────────────────────────────

export interface SplitNotification {
  id: string;
  type: "split_invite" | "split_update" | "expense_added" | "settlement";
  splitId: string;
  splitName: string;
  splitEmoji: string;
  fromUid: string;
  fromName: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetUid?: string;
  targetEmail?: string;
  inviteId?: string;
  source?: "user" | "splitInvite";
}

// ── User Profile (for email lookup) ─────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

// Legacy aliases for backwards compatibility
export type TripMember = SplitMember;
export type TripExpense = SplitExpense;
export type TripSettlement = SplitSettlement;
export type TripSession = SplitSession;
