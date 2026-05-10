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
