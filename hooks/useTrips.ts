"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { TripSession, TripExpense, TripMember, TripSettlement } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";
import { syncTripsToFirestore, syncTripsToFirestoreImmediate, loadTripsFromFirestore } from "@/lib/firestore";

const TRIPS_KEY = "finflow_trips";
const UID_KEY = "finflow_uid";

function loadTrips(): TripSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTrips(trips: TripSession[]) {
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  } catch {}
}

// ── Balance Calculation ─────────────────────────────────────

export interface BalanceEntry {
  from: TripMember;
  to: TripMember;
  amount: number;
}

/**
 * Calculate simplified debts for a trip.
 * Returns a list of "A owes B ₹X" entries, minimized.
 */
export function calculateBalances(trip: TripSession): BalanceEntry[] {
  const memberMap = new Map(trip.members.map((m) => [m.id, m]));
  // Net balance per member: positive = is owed, negative = owes
  const net: Record<string, number> = {};
  trip.members.forEach((m) => (net[m.id] = 0));

  // Calculate from unsettled expenses
  for (const exp of trip.expenses) {
    const splitCount = exp.splitAmong.length;
    if (splitCount === 0) continue;
    const share = exp.amount / splitCount;

    // Payer is owed
    net[exp.paidBy] = (net[exp.paidBy] || 0) + exp.amount;
    // Each participant owes their share
    for (const memberId of exp.splitAmong) {
      net[memberId] = (net[memberId] || 0) - share;
    }
  }

  // Account for already-settled amounts
  for (const settlement of trip.settlements) {
    if (settlement.settled) {
      net[settlement.from] = (net[settlement.from] || 0) + settlement.amount;
      net[settlement.to] = (net[settlement.to] || 0) - settlement.amount;
    }
  }

  // Separate debtors and creditors
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(net)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded < -0.01) debtors.push({ id, amount: -rounded });
    else if (rounded > 0.01) creditors.push({ id, amount: rounded });
  }

  // Sort for greedy simplification
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // Simplify: greedy matching
  const result: BalanceEntry[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount);
    if (transfer > 0.01) {
      const fromMember = memberMap.get(debtors[i].id);
      const toMember = memberMap.get(creditors[j].id);
      if (fromMember && toMember) {
        result.push({
          from: fromMember,
          to: toMember,
          amount: Math.round(transfer * 100) / 100,
        });
      }
    }
    debtors[i].amount -= transfer;
    creditors[j].amount -= transfer;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return result;
}

/**
 * Get total spent in a trip
 */
export function getTripTotal(trip: TripSession): number {
  return trip.expenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Get per-member spending breakdown
 */
export function getMemberSpending(trip: TripSession): Record<string, number> {
  const spending: Record<string, number> = {};
  trip.members.forEach((m) => (spending[m.id] = 0));
  for (const exp of trip.expenses) {
    spending[exp.paidBy] = (spending[exp.paidBy] || 0) + exp.amount;
  }
  return spending;
}

// ── Hook ────────────────────────────────────────────────────

export function useTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripSession[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const localTrips = loadTrips();
      const uid = user?.uid || localStorage.getItem(UID_KEY);
      uidRef.current = uid;

      if (localTrips.length > 0) {
        setTrips(localTrips);
        setHydrated(true);
        if (uid) syncTripsToFirestore(uid, localTrips);
      } else if (uid) {
        try {
          const firestoreTrips = await loadTripsFromFirestore(uid);
          if (firestoreTrips && firestoreTrips.length > 0) {
            setTrips(firestoreTrips);
            saveTrips(firestoreTrips);
            setHydrated(true);
            return;
          }
        } catch {}
        setTrips([]);
        setHydrated(true);
      } else {
        setTrips([]);
        setHydrated(true);
      }
    };
    init();
  }, [user?.uid]);

  const updateTrips = useCallback((updater: (prev: TripSession[]) => TripSession[]) => {
    setTrips((prev) => {
      const next = updater(prev);
      saveTrips(next);
      const uid = uidRef.current || localStorage.getItem(UID_KEY);
      if (uid) syncTripsToFirestore(uid, next);
      return next;
    });
  }, []);

  const createTrip = useCallback(
    (name: string, emoji: string, members: Omit<TripMember, "id">[]) => {
      const trip: TripSession = {
        id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        emoji,
        members: members.map((m, i) => ({
          ...m,
          id: `m_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
        })),
        expenses: [],
        settlements: [],
        createdAt: getTodayISO(),
        archived: false,
      };
      updateTrips((prev) => [trip, ...prev]);
      return trip;
    },
    [updateTrips]
  );

  const addTripExpense = useCallback(
    (tripId: string, expense: Omit<TripExpense, "id">) => {
      const newExpense: TripExpense = {
        ...expense,
        id: `te_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      updateTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...t, expenses: [newExpense, ...t.expenses] }
            : t
        )
      );
      return newExpense;
    },
    [updateTrips]
  );

  const deleteTripExpense = useCallback(
    (tripId: string, expenseId: string) => {
      updateTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...t, expenses: t.expenses.filter((e) => e.id !== expenseId) }
            : t
        )
      );
    },
    [updateTrips]
  );

  const addMember = useCallback(
    (tripId: string, member: Omit<TripMember, "id">) => {
      const newMember: TripMember = {
        ...member,
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      updateTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...t, members: [...t.members, newMember] }
            : t
        )
      );
      return newMember;
    },
    [updateTrips]
  );

  const removeMember = useCallback(
    (tripId: string, memberId: string) => {
      updateTrips((prev) =>
        prev.map((t) => {
          if (t.id !== tripId) return t;
          // Only allow removal if no expenses involve this member
          const involved = t.expenses.some(
            (e) => e.paidBy === memberId || e.splitAmong.includes(memberId)
          );
          if (involved) return t;
          return { ...t, members: t.members.filter((m) => m.id !== memberId) };
        })
      );
    },
    [updateTrips]
  );

  const settleDebt = useCallback(
    (tripId: string, from: string, to: string, amount: number) => {
      const settlement: TripSettlement = {
        id: `stl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        from,
        to,
        amount,
        settled: true,
        date: getTodayISO(),
      };
      updateTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...t, settlements: [...t.settlements, settlement] }
            : t
        )
      );
    },
    [updateTrips]
  );

  const archiveTrip = useCallback(
    (tripId: string) => {
      updateTrips((prev) =>
        prev.map((t) =>
          t.id === tripId ? { ...t, archived: !t.archived } : t
        )
      );
    },
    [updateTrips]
  );

  const deleteTrip = useCallback(
    async (tripId: string) => {
      const prev = trips;
      const next = prev.filter((t) => t.id !== tripId);
      // Update state and localStorage immediately
      setTrips(next);
      saveTrips(next);
      // Flush to Firestore immediately (no debounce) so data is persisted before navigation
      const uid = uidRef.current || localStorage.getItem(UID_KEY);
      if (uid) {
        await syncTripsToFirestoreImmediate(uid, next);
      }
    },
    [trips]
  );

  const getTrip = useCallback(
    (tripId: string) => trips.find((t) => t.id === tripId) ?? null,
    [trips]
  );

  return {
    trips,
    hydrated,
    createTrip,
    addTripExpense,
    deleteTripExpense,
    addMember,
    removeMember,
    settleDebt,
    archiveTrip,
    deleteTrip,
    getTrip,
  };
}
