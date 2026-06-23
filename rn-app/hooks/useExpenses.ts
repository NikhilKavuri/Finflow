import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useExpensesStore } from "@/store/expensesStore";

export function useExpenses() {
  const store = useExpensesStore();
  const user = auth.currentUser;

  useEffect(() => {
    // Only init if not hydrated or if auth state changes
    store.init(user?.uid || null);
  }, [user?.uid]);

  return store;
}
