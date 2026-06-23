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
let splitTimer: ReturnType<typeof setTimeout> | null = null;
let splitInvitesReadable = true;

// ── Expense sync ────────────────────────────────────────────

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
      const payload = {
        budget: state.budget,
        budgetCycleStartDay: state.budgetCycleStartDay,
        transactions: state.transactions,
        onboarded: state.onboarded,
        banks: state.banks,
        paymentMethods: state.paymentMethods,
        monthlyBudgets: state.monthlyBudgets || {},
        updatedAt: new Date().toISOString(),
      };
      
      // Firestore throws an error if any field is strictly undefined.
      // JSON serialization safely strips undefined keys from the object tree.
      const cleanPayload = JSON.parse(JSON.stringify(payload));

      await setDoc(ref, cleanPayload);
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
        budgetCycleStartDay: data.budgetCycleStartDay ?? 5,
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        onboarded: data.onboarded ?? false,
        banks: Array.isArray(data.banks) ? data.banks : [{ id: "default", name: "Default Bank" }],
        paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
        monthlyBudgets: data.monthlyBudgets && typeof data.monthlyBudgets === "object" ? data.monthlyBudgets : {},
      };
    }
    return null;
  } catch (error) {
    console.warn("Firestore expense load failed:", error);
    return null;
  }
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
  if (!db || !isFirebaseConfigured()) return () => {};

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
