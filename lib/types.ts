export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  date: string; // ISO yyyy-mm-dd
}

export interface AppState {
  budget: number;
  transactions: Transaction[];
  onboarded: boolean;
}
