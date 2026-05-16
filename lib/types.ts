export interface Bank {
  id: string;
  name: string;
  balance?: number;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  date: string; // ISO yyyy-mm-dd
  bankId: string;
}

export interface AppState {
  budget: number;
  transactions: Transaction[];
  onboarded: boolean;
  banks: Bank[];
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
