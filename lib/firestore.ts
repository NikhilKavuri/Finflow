import { doc, getDoc, setDoc, Firestore } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { AppState } from "./types";
import type { TripSession } from "./types";

// Debounce helper
let expenseTimer: ReturnType<typeof setTimeout> | null = null;
let tripTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Save app state (expenses) to Firestore, debounced
 */
export function syncExpensesToFirestore(uid: string, state: AppState) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  if (expenseTimer) clearTimeout(expenseTimer);
  expenseTimer = setTimeout(async () => {
    try {
      const ref = doc(firestore, "users", uid, "data", "expenses");
      await setDoc(ref, {
        budget: state.budget,
        transactions: state.transactions,
        onboarded: state.onboarded,
        banks: state.banks,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Firestore expense sync failed:", error);
    }
  }, 2000); // 2s debounce
}

/**
 * Load app state from Firestore
 */
export async function loadExpensesFromFirestore(uid: string): Promise<AppState | null> {
  if (!db || !isFirebaseConfigured()) return null;

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "users", uid, "data", "expenses");
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        budget: data.budget ?? 80000,
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        onboarded: data.onboarded ?? false,
        banks: Array.isArray(data.banks) ? data.banks : [{ id: "default", name: "Default Bank" }],
      };
    }
    return null;
  } catch (error) {
    console.warn("Firestore expense load failed:", error);
    return null;
  }
}

/**
 * Save trips to Firestore, debounced
 */
export function syncTripsToFirestore(uid: string, trips: TripSession[]) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  if (tripTimer) clearTimeout(tripTimer);
  tripTimer = setTimeout(async () => {
    try {
      const ref = doc(firestore, "users", uid, "data", "trips");
      await setDoc(ref, {
        trips,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Firestore trip sync failed:", error);
    }
  }, 2000);
}

/**
 * Load trips from Firestore
 */
export async function loadTripsFromFirestore(uid: string): Promise<TripSession[] | null> {
  if (!db || !isFirebaseConfigured()) return null;

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "users", uid, "data", "trips");
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return Array.isArray(data.trips) ? data.trips : [];
    }
    return null;
  } catch (error) {
    console.warn("Firestore trip load failed:", error);
    return null;
  }
}
