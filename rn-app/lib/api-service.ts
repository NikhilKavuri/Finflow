/**
 * API Service - Handles all Firestore and Firebase operations
 * with error handling, retry logic, and offline support
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  QueryConstraint,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Expense, Split, Account } from "./types";
import { logger, AppError, handleFirebaseError } from "./error-handler";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Attempt ${attempt + 1} failed:`, { error: lastError.message });

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw lastError;
}

// ===== EXPENSE OPERATIONS =====

export async function addExpenseAPI(
  expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
) {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const docRef = await addDoc(collection(db, "users", user.uid, "expenses"), {
        ...expense,
        date: Timestamp.fromDate(expense.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      logger.info("Expense added", { id: docRef.id });
      return docRef.id;
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

export async function updateExpenseAPI(
  expenseId: string,
  updates: Partial<Expense>
) {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const expenseRef = doc(db, "users", user.uid, "expenses", expenseId);
      await updateDoc(expenseRef, {
        ...updates,
        date: updates.date ? Timestamp.fromDate(updates.date) : undefined,
        updatedAt: Timestamp.now(),
      });
      logger.info("Expense updated", { id: expenseId });
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

export async function deleteExpenseAPI(expenseId: string) {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const expenseRef = doc(db, "users", user.uid, "expenses", expenseId);
      await deleteDoc(expenseRef);
      logger.info("Expense deleted", { id: expenseId });
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

export async function getExpensesAPI(constraints: QueryConstraint[] = []) {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const q = query(
        collection(db, "users", user.uid, "expenses"),
        ...constraints
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as (Expense & { id: string })[];
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

// ===== SPLIT OPERATIONS =====

export async function createSplitAPI(
  split: Omit<Split, "id" | "createdAt" | "updatedAt">
) {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const docRef = await addDoc(collection(db, "users", user.uid, "splits"), {
        ...split,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      logger.info("Split created", { id: docRef.id });
      return docRef.id;
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

export async function updateSplitAPI(
  splitId: string,
  updates: Partial<Split>
) {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const splitRef = doc(db, "users", user.uid, "splits", splitId);
      await updateDoc(splitRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      logger.info("Split updated", { id: splitId });
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

export async function deleteSplitAPI(splitId: string) {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const splitRef = doc(db, "users", user.uid, "splits", splitId);
      await deleteDoc(splitRef);
      logger.info("Split deleted", { id: splitId });
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

// ===== ACCOUNT OPERATIONS =====

export async function addAccountAPI(account: Omit<Account, "id" | "createdAt" | "updatedAt">) {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const docRef = await addDoc(collection(db, "users", user.uid, "accounts"), {
        ...account,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      logger.info("Account added", { id: docRef.id });
      return docRef.id;
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

export async function getAccountsAPI() {
  const user = auth.currentUser;
  if (!user) throw new AppError("User not authenticated", "NOT_AUTHENTICATED");

  try {
    return await withRetry(async () => {
      const snapshot = await getDocs(collection(db, "users", user.uid, "accounts"));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (Account & { id: string })[];
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

// ===== UTILITY FUNCTIONS =====

export async function validateUserAccess(userId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || user.uid !== userId) {
    return false;
  }
  return true;
}

export async function syncData(userId: string) {
  if (!userId) return;

  logger.info("Starting data sync", { userId });

  try {
    await Promise.all([
      getExpensesAPI(),
      getAccountsAPI(),
    ]);
    logger.info("Data sync completed");
  } catch (error) {
    logger.error("Data sync failed", error instanceof Error ? error : new Error(String(error)));
  }
}
