import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  writeBatch,
  Firestore,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { AppState, SplitSession, SplitNotification, UserProfile } from "./types";

// Legacy alias kept for backwards compatibility
import type { TripSession } from "./types";

// Debounce helpers
let expenseTimer: ReturnType<typeof setTimeout> | null = null;
let pendingExpenseSync: (() => void) | null = null;
let splitTimer: ReturnType<typeof setTimeout> | null = null;
let splitInvitesReadable = true;

/** Flush any pending expense sync immediately */
function flushPendingExpenseSync() {
  if (expenseTimer) {
    clearTimeout(expenseTimer);
    expenseTimer = null;
  }
  if (pendingExpenseSync) {
    pendingExpenseSync();
  }
}

if (typeof window !== "undefined") {
  // Flush on page close — fires the setDoc (fire-and-forget, Firestore SDK
  // keeps the connection alive long enough for this to succeed in most cases)
  window.addEventListener("beforeunload", flushPendingExpenseSync);

  // Also flush when the tab is hidden — more reliable on mobile and
  // triggers before beforeunload in most browsers
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPendingExpenseSync();
    }
  });
}

// ── Expense sync ────────────────────────────────────────────

/**
 * Save app state (expenses) to Firestore, debounced (500ms).
 * Pending writes are auto-flushed on beforeunload / visibilitychange.
 */
export function syncExpensesToFirestore(uid: string, state: AppState) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  if (expenseTimer) clearTimeout(expenseTimer);

  pendingExpenseSync = () => {
    pendingExpenseSync = null;
    try {
      const ref = doc(firestore, "users", uid, "data", "expenses");
      const payload = {
        budget: state.budget,
        budgetCycleStartDay: state.budgetCycleStartDay,
        transactions: state.transactions,
        onboarded: state.onboarded,
        banks: state.banks,
        paymentMethods: state.paymentMethods,
        monthlyBudgets: state.monthlyBudgets || {},
        updatedAt: state.updatedAt || Date.now(),
      };
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      setDoc(ref, cleanPayload);
    } catch (error) {
      console.warn("Firestore expense sync failed:", error);
    }
  };

  expenseTimer = setTimeout(() => {
    if (pendingExpenseSync) {
      pendingExpenseSync();
    }
  }, 500); // 500ms debounce — fast enough to survive most reloads
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
        budgetCycleStartDay: data.budgetCycleStartDay ?? 5,
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        onboarded: data.onboarded ?? false,
        banks: Array.isArray(data.banks) ? data.banks : [{ id: "default", name: "Default Bank" }],
        paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
        monthlyBudgets: data.monthlyBudgets && typeof data.monthlyBudgets === "object" ? data.monthlyBudgets : {},
        updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : undefined,
      };
    }
    return null;
  } catch (error) {
    console.warn("Firestore expense load failed:", error);
    return null;
  }
}

/**
 * Subscribe to app state (expenses) from Firestore
 */
export function subscribeToExpenses(
  uid: string,
  callback: (state: AppState) => void
): () => void {
  if (!db || !isFirebaseConfigured()) return () => { };

  const firestore = db as Firestore;
  const ref = doc(firestore, "users", uid, "data", "expenses");

  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          budget: data.budget ?? 80000,
          budgetCycleStartDay: data.budgetCycleStartDay ?? 5,
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          onboarded: data.onboarded ?? false,
          banks: Array.isArray(data.banks) ? data.banks : [{ id: "default", name: "Default Bank" }],
          paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
          monthlyBudgets: data.monthlyBudgets && typeof data.monthlyBudgets === "object" ? data.monthlyBudgets : {},
          updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : undefined,
        });
      }
    },
    (error) => {
      console.warn("Firestore expense subscription error:", error);
    }
  );

  return unsubscribe;
}

// ── Split sync (renamed from trip sync) ─────────────────────

/**
 * Save splits to Firestore, debounced
 */
export function syncSplitsToFirestore(uid: string, splits: SplitSession[]) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  if (splitTimer) clearTimeout(splitTimer);
  splitTimer = setTimeout(async () => {
    try {
      const ref = doc(firestore, "users", uid, "data", "trips");
      await setDoc(ref, {
        trips: splits,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Firestore split sync failed:", error);
    }
  }, 2000);
}

/**
 * Save splits to Firestore immediately (no debounce).
 * Use for destructive operations like delete where we need
 * the data persisted before navigating away.
 */
export async function syncSplitsToFirestoreImmediate(uid: string, splits: SplitSession[]) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  // Cancel any pending debounced sync
  if (splitTimer) clearTimeout(splitTimer);

  try {
    const ref = doc(firestore, "users", uid, "data", "trips");
    await setDoc(ref, {
      trips: splits,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Firestore immediate split sync failed:", error);
  }
}

/**
 * Load splits from Firestore
 */
export async function loadSplitsFromFirestore(uid: string): Promise<SplitSession[] | null> {
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
    console.warn("Firestore split load failed:", error);
    return null;
  }
}

// ── User Profile ────────────────────────────────────────────

/**
 * Save or update a user profile in the `userProfiles` collection
 */
export async function saveUserProfile(
  uid: string,
  profile: { email: string; displayName: string; photoURL?: string }
) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "userProfiles", uid);
    const data: UserProfile = {
      uid,
      email: profile.email.trim().toLowerCase(),
      displayName: profile.displayName || "User",
    };

    if (profile.photoURL) {
      data.photoURL = profile.photoURL;
    }

    await setDoc(ref, data, { merge: true });
  } catch (error) {
    console.warn("Firestore saveUserProfile failed:", error);
  }
}

/**
 * Find a user profile by email address
 */
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  if (!db || !isFirebaseConfigured()) return null;

  const firestore = db as Firestore;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const q = query(
      collection(firestore, "userProfiles"),
      where("email", "==", normalizedEmail),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserProfile;
  } catch (error) {
    console.warn("Firestore findUserByEmail failed:", error);
    return null;
  }
}

// ── Shared Splits ───────────────────────────────────────────

/**
 * Create a shared split in the top-level `splits` collection
 */
export async function createSharedSplit(split: SplitSession) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "splits", split.id);
    await setDoc(ref, split);
  } catch (error) {
    console.warn("Firestore createSharedSplit failed:", error);
  }
}

/**
 * Load a shared split by ID
 */
export async function loadSharedSplit(splitId: string): Promise<SplitSession | null> {
  if (!db || !isFirebaseConfigured()) return null;

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "splits", splitId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return snapshot.data() as SplitSession;
    }
    return null;
  } catch (error) {
    console.warn("Firestore loadSharedSplit failed:", error);
    return null;
  }
}

/**
 * Update a shared split with partial data (merge)
 */
export async function updateSharedSplit(splitId: string, data: Partial<SplitSession>) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "splits", splitId);
    await setDoc(ref, data, { merge: true });
  } catch (error) {
    console.warn("Firestore updateSharedSplit failed:", error);
  }
}

/**
 * Delete a shared split
 */
export async function deleteSharedSplit(splitId: string) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "splits", splitId);
    await deleteDoc(ref);
  } catch (error) {
    console.warn("Firestore deleteSharedSplit failed:", error);
  }
}

// ── User Shared Split IDs ───────────────────────────────────

/**
 * Load the list of shared split IDs for a user
 */
export async function loadUserSharedSplitIds(uid: string): Promise<string[]> {
  if (!db || !isFirebaseConfigured()) return [];

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "users", uid, "data", "sharedSplits");
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return Array.isArray(data.splitIds) ? data.splitIds : [];
    }
    return [];
  } catch (error) {
    console.warn("Firestore loadUserSharedSplitIds failed:", error);
    return [];
  }
}

/**
 * Save the list of shared split IDs for a user
 */
export async function saveUserSharedSplitIds(uid: string, splitIds: string[]) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    const ref = doc(firestore, "users", uid, "data", "sharedSplits");
    await setDoc(ref, { splitIds, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Firestore saveUserSharedSplitIds failed:", error);
  }
}

// ── Notifications ───────────────────────────────────────────

/**
 * Add a notification for a target user
 */
export async function addNotification(
  targetUid: string,
  notification: Omit<SplitNotification, "id">
) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    const colRef = collection(firestore, "users", targetUid, "notifications");
    await addDoc(colRef, notification);
  } catch (error) {
    console.warn("Firestore addNotification failed:", error);
  }
}

/**
 * Add a split invite in a top-level collection so invited users can discover it
 * even when rules block writes to another user's notifications subcollection.
 */
export async function addSplitInvite(
  targetUid: string,
  targetEmail: string | undefined,
  notification: Omit<SplitNotification, "id" | "targetUid" | "targetEmail" | "source" | "inviteId">
) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  const invite = {
    ...notification,
    targetUid,
    targetEmail: targetEmail?.trim().toLowerCase() || "",
    read: false,
  };

  try {
    const colRef = collection(firestore, "splitInvites");
    await addDoc(colRef, invite);
  } catch (error) {
    console.warn("Firestore addSplitInvite failed:", error);
  }
}

/**
 * Get notifications for a user, ordered by createdAt desc, limit 50
 */
export async function getNotifications(uid: string): Promise<SplitNotification[]> {
  if (!db || !isFirebaseConfigured()) return [];

  const firestore = db as Firestore;

  const notifications: SplitNotification[] = [];

  try {
    const q = query(
      collection(firestore, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snapshot = await getDocs(q);
    notifications.push(
      ...snapshot.docs.map((d) => ({ id: d.id, source: "user", ...d.data() } as SplitNotification))
    );
  } catch (error) {
    console.warn("Firestore getNotifications failed:", error);
  }

  if (splitInvitesReadable) {
    try {
      const inviteQuery = query(
        collection(firestore, "splitInvites"),
        where("targetUid", "==", uid),
        where("read", "==", false),
        limit(50)
      );
      const inviteSnapshot = await getDocs(inviteQuery);
      const inviteNotifications = inviteSnapshot.docs.map((d) => ({
        id: `splitInvite:${d.id}`,
        inviteId: d.id,
        source: "splitInvite",
        ...d.data(),
      } as SplitNotification));

      notifications.push(...inviteNotifications);
    } catch (error: any) {
      if (error?.code === "permission-denied") {
        splitInvitesReadable = false;
      } else {
        console.warn("Firestore getSplitInvites failed:", error);
      }
    }
  }

  const seenInvites = new Set<string>();
  return notifications
    .filter((notification) => {
      if (notification.type !== "split_invite") return true;
      const key = notification.splitId;
      if (seenInvites.has(key)) return false;
      seenInvites.add(key);
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(uid: string, notifId: string) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    if (notifId.startsWith("splitInvite:")) {
      const inviteId = notifId.replace("splitInvite:", "");
      const inviteRef = doc(firestore, "splitInvites", inviteId);
      await updateDoc(inviteRef, { read: true });
      return;
    }

    const ref = doc(firestore, "users", uid, "notifications", notifId);
    await setDoc(ref, { read: true }, { merge: true });
  } catch (error) {
    console.warn("Firestore markNotificationRead failed:", error);
  }
}

/**
 * Mark fallback split invite docs for a specific split as read.
 */
export async function markSplitInviteRead(uid: string, splitId: string) {
  if (!db || !isFirebaseConfigured() || !splitInvitesReadable) return;

  const firestore = db as Firestore;

  try {
    const q = query(
      collection(firestore, "splitInvites"),
      where("targetUid", "==", uid),
      where("splitId", "==", splitId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(firestore);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      splitInvitesReadable = false;
    } else {
      console.warn("Firestore markSplitInviteRead failed:", error);
    }
  }
}

/**
 * Mark all unread notifications as read using a batch write
 */
export async function markAllNotificationsRead(uid: string) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    const q = query(
      collection(firestore, "users", uid, "notifications"),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const batch = writeBatch(firestore);
      snapshot.docs.forEach((d) => {
        batch.update(d.ref, { read: true });
      });
      await batch.commit();
    }
  } catch (error) {
    console.warn("Firestore markAllNotificationsRead failed:", error);
  }

  if (!splitInvitesReadable) return;

  try {
    const inviteQuery = query(
      collection(firestore, "splitInvites"),
      where("targetUid", "==", uid),
      where("read", "==", false)
    );
    const inviteSnapshot = await getDocs(inviteQuery);
    if (inviteSnapshot.empty) return;

    const batch = writeBatch(firestore);
    inviteSnapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      splitInvitesReadable = false;
    } else {
      console.warn("Firestore markAllSplitInvitesRead failed:", error);
    }
  }
}

/**
 * Delete read notifications for a user.
 */
export async function deleteReadNotifications(uid: string) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;

  try {
    const q = query(
      collection(firestore, "users", uid, "notifications"),
      where("read", "==", true)
    );
    const snapshot = await getDocs(q);
    const readSplitIds = snapshot.docs
      .map((d) => d.data() as Partial<SplitNotification>)
      .filter((notification) => notification.type === "split_invite" && notification.splitId)
      .map((notification) => notification.splitId as string);

    if (!snapshot.empty) {
      const batch = writeBatch(firestore);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }

    await Promise.all(readSplitIds.map((splitId) => markSplitInviteRead(uid, splitId)));
  } catch (error) {
    console.warn("Firestore deleteReadNotifications failed:", error);
  }
}

/**
 * Subscribe to real-time notification updates for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  uid: string,
  callback: (notifications: SplitNotification[]) => void
): () => void {
  if (!db || !isFirebaseConfigured()) return () => { };

  const firestore = db as Firestore;

  const q = query(
    collection(firestore, "users", uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as SplitNotification)
      );
      callback(notifications);
    },
    (error) => {
      console.warn("Firestore notification subscription error:", error);
    }
  );

  return unsubscribe;
}

// ── Legacy Aliases (backwards compatibility with useTrips) ───

export const syncTripsToFirestore = syncSplitsToFirestore;
export const syncTripsToFirestoreImmediate = syncSplitsToFirestoreImmediate;
export const loadTripsFromFirestore = loadSplitsFromFirestore;

/**
 * Migrates data from all old UIDs associated with this email into the email document.
 */
export async function migrateAndMergeUserData(uid: string, email: string) {
  if (!db || !isFirebaseConfigured()) return;

  const firestore = db as Firestore;
  const lowerEmail = email.trim().toLowerCase();

  try {
    const migrationRef = doc(firestore, "users", lowerEmail);
    const migrationSnap = await getDoc(migrationRef);
    if (migrationSnap.exists() && migrationSnap.data()?.migrated) {
      return;
    }

    const profilesQuery = query(
      collection(firestore, "userProfiles"),
      where("email", "==", lowerEmail)
    );
    const profilesSnap = await getDocs(profilesQuery);
    if (profilesSnap.empty) return;

    const uidsToMerge = profilesSnap.docs.map(d => d.id);

    let combinedExpenses: AppState | null = null;
    let combinedTrips: SplitSession[] = [];
    let combinedSharedSplitIds: string[] = [];

    for (const oldUid of uidsToMerge) {
      const expenseSnap = await getDoc(doc(firestore, "users", oldUid, "data", "expenses"));
      if (expenseSnap.exists()) {
        const data = expenseSnap.data() as AppState;
        if (!combinedExpenses) {
          combinedExpenses = { ...data };
        } else {
          const txMap = new Map((combinedExpenses.transactions || []).map(t => [t.id, t]));
          for (const tx of (data.transactions || [])) {
            if (!txMap.has(tx.id)) txMap.set(tx.id, tx);
          }
          combinedExpenses.transactions = Array.from(txMap.values());

          const bankMap = new Map((combinedExpenses.banks || []).map(b => [b.id, b]));
          for (const b of (data.banks || [])) {
            if (!bankMap.has(b.id)) bankMap.set(b.id, b);
          }
          combinedExpenses.banks = Array.from(bankMap.values());

          const pmMap = new Map((combinedExpenses.paymentMethods || []).map(pm => [pm.id, pm]));
          for (const pm of (data.paymentMethods || [])) {
            if (!pmMap.has(pm.id)) pmMap.set(pm.id, pm);
          }
          combinedExpenses.paymentMethods = Array.from(pmMap.values());

          combinedExpenses.monthlyBudgets = { ...(combinedExpenses.monthlyBudgets || {}), ...(data.monthlyBudgets || {}) };
          combinedExpenses.budget = Math.max(combinedExpenses.budget || 0, data.budget || 0);
          combinedExpenses.onboarded = combinedExpenses.onboarded || data.onboarded;
          combinedExpenses.updatedAt = Math.max(combinedExpenses.updatedAt || 0, data.updatedAt || 0);
        }
      }

      const tripsSnap = await getDoc(doc(firestore, "users", oldUid, "data", "trips"));
      if (tripsSnap.exists()) {
        const data = tripsSnap.data();
        if (Array.isArray(data.trips)) {
          const tripMap = new Map(combinedTrips.map(t => [t.id, t]));
          for (const t of data.trips) {
            if (!tripMap.has(t.id)) tripMap.set(t.id, t);
          }
          combinedTrips = Array.from(tripMap.values());
        }
      }

      const sharedSplitsSnap = await getDoc(doc(firestore, "users", oldUid, "data", "sharedSplits"));
      if (sharedSplitsSnap.exists()) {
        const data = sharedSplitsSnap.data();
        if (Array.isArray(data.splitIds)) {
          combinedSharedSplitIds = Array.from(new Set([...combinedSharedSplitIds, ...data.splitIds]));
        }
      }
    }

    const batch = writeBatch(firestore);
    batch.set(doc(firestore, "users", lowerEmail), { migrated: true, migratedAt: new Date().toISOString() }, { merge: true });

    if (combinedExpenses) {
      batch.set(doc(firestore, "users", lowerEmail, "data", "expenses"), combinedExpenses);
    }
    if (combinedTrips.length > 0) {
      batch.set(doc(firestore, "users", lowerEmail, "data", "trips"), { trips: combinedTrips, updatedAt: new Date().toISOString() });
    }
    if (combinedSharedSplitIds.length > 0) {
      batch.set(doc(firestore, "users", lowerEmail, "data", "sharedSplits"), { splitIds: combinedSharedSplitIds, updatedAt: new Date().toISOString() });
    }

    await batch.commit();

  } catch (error) {
    console.warn("Firestore migration failed:", error);
  }
}

export async function logUserDataNeatly(uid: string, email: string) {
  const firestore = isFirebaseConfigured() ? db : null;
  if (!firestore) return;

  const lowerEmail = email.trim().toLowerCase();

  try {
    // Try to fetch from UID-based path (which matches standard Firestore rules)
    const expensesSnap = await getDoc(doc(firestore, "users", uid, "data", "expenses"));
    const tripsSnap = await getDoc(doc(firestore, "users", uid, "data", "trips"));
    const splitsSnap = await getDoc(doc(firestore, "users", uid, "data", "sharedSplits"));
  } catch (error) {
    console.warn("Failed to log user data neatly:", error);
  }
}

