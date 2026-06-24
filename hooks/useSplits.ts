"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { SplitSession, SplitExpense, SplitMember, SplitSettlement } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";
import {
  syncSplitsToFirestore,
  syncSplitsToFirestoreImmediate,
  loadSplitsFromFirestore,
  createSharedSplit,
  loadSharedSplit,
  updateSharedSplit,
  deleteSharedSplit,
  loadUserSharedSplitIds,
  saveUserSharedSplitIds,
  addNotification,
  addSplitInvite,
  findUserByEmail,
} from "@/lib/firestore";

const SPLITS_KEY = "finflow_trips"; // Keep original key for backward compat
const UID_KEY = "finflow_uid";

function loadLocalSplits(uid: string | null): SplitSession[] {
  if (typeof window === "undefined" || !uid) return [];
  try {
    const raw = localStorage.getItem(`${SPLITS_KEY}_${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalSplits(splits: SplitSession[], uid: string | null) {
  if (!uid) return;
  try {
    localStorage.setItem(`${SPLITS_KEY}_${uid}`, JSON.stringify(splits));
  } catch {}
}

// ── Balance Calculation ─────────────────────────────────────

export interface BalanceEntry {
  from: SplitMember;
  to: SplitMember;
  amount: number;
}

function getExpenseContributions(exp: SplitExpense): { memberId: string; amount: number }[] {
  if (exp.contributors && exp.contributors.length > 0) {
    return exp.contributors
      .map((c) => ({ memberId: c.memberId, amount: c.amount }))
      .filter((c) => c.memberId && Number.isFinite(c.amount) && c.amount > 0);
  }
  return exp.paidBy ? [{ memberId: exp.paidBy, amount: exp.amount }] : [];
}

/**
 * Calculate simplified debts for a split.
 * Returns a list of "A owes B ₹X" entries, minimized.
 */
export function calculateBalances(split: SplitSession): BalanceEntry[] {
  const memberMap = new Map(split.members.map((m) => [m.id, m]));
  const net: Record<string, number> = {};
  split.members.forEach((m) => (net[m.id] = 0));

  for (const exp of split.expenses) {
    const splitCount = exp.splitAmong.length;
    if (splitCount === 0) continue;
    const share = exp.amount / splitCount;
    for (const c of getExpenseContributions(exp)) {
      net[c.memberId] = (net[c.memberId] || 0) + c.amount;
    }
    for (const memberId of exp.splitAmong) {
      net[memberId] = (net[memberId] || 0) - share;
    }
  }

  for (const settlement of split.settlements) {
    if (settlement.settled) {
      net[settlement.from] = (net[settlement.from] || 0) + settlement.amount;
      net[settlement.to] = (net[settlement.to] || 0) - settlement.amount;
    }
  }

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(net)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded < -0.01) debtors.push({ id, amount: -rounded });
    else if (rounded > 0.01) creditors.push({ id, amount: rounded });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const result: BalanceEntry[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount);
    if (transfer > 0.01) {
      const fromMember = memberMap.get(debtors[i].id);
      const toMember = memberMap.get(creditors[j].id);
      if (fromMember && toMember) {
        result.push({ from: fromMember, to: toMember, amount: Math.round(transfer * 100) / 100 });
      }
    }
    debtors[i].amount -= transfer;
    creditors[j].amount -= transfer;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return result;
}

export function getSplitTotal(split: SplitSession): number {
  return split.expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getMemberSpending(split: SplitSession): Record<string, number> {
  const spending: Record<string, number> = {};
  split.members.forEach((m) => (spending[m.id] = 0));
  for (const exp of split.expenses) {
    const contribs = getExpenseContributions(exp);
    if (contribs.length > 0) {
      for (const c of contribs) {
        spending[c.memberId] = (spending[c.memberId] || 0) + c.amount;
      }
    }
  }
  return spending;
}

// ── Hook ────────────────────────────────────────────────────

export function useSplits() {
  const { user } = useAuth();
  const [splits, setSplits] = useState<SplitSession[]>([]);
  const [sharedSplits, setSharedSplits] = useState<SplitSession[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const uidRef = useRef<string | null>(null);

  // All splits combined (local + shared)
  const allSplits = [...splits, ...sharedSplits];

  // Hydrate: localStorage-first, Firestore as recovery fallback
  useEffect(() => {
    const init = async () => {
      const uid = user?.uid || localStorage.getItem(UID_KEY);
      uidRef.current = uid ?? null;

      // 1. Always try localStorage first — it's synchronous and always the freshest
      const localSplits = loadLocalSplits(uid);

      if (localSplits.length > 0) {
        setSplits(localSplits);
        // Sync to Firestore as backup
        if (uid) syncSplitsToFirestore(uid, localSplits);
      } else if (uid) {
        // 2. No local data — try recovering from Firestore
        try {
          const firestoreSplits = await loadSplitsFromFirestore(uid);
          if (firestoreSplits && firestoreSplits.length > 0) {
            setSplits(firestoreSplits);
            saveLocalSplits(firestoreSplits, uid); // Cache locally
          }
        } catch {}
      }

      // Load shared/collaborative splits
      if (uid) {
        try {
          const sharedIds = await loadUserSharedSplitIds(uid);
          const loadedSharedResult = await Promise.all(
            sharedIds.map(async (splitId) => {
              const shared = await loadSharedSplit(splitId);
              if (shared) {
                const userMember = shared.members.find((m) => m.uid === uid);
                if (userMember?.status === "accepted") {
                  return shared;
                }
              }
              return null;
            })
          );
          const loadedShared = loadedSharedResult.filter(
            (s): s is SplitSession => s !== null
          );
          setSharedSplits(loadedShared);
        } catch {}
      }

      setHydrated(true);
    };
    init();
  }, [user?.uid]);

  // Update local (non-collaborative) splits
  const updateLocalSplits = useCallback((updater: (prev: SplitSession[]) => SplitSession[]) => {
    setSplits((prev) => {
      const next = updater(prev);
      const uid = uidRef.current || localStorage.getItem(UID_KEY);
      saveLocalSplits(next, uid);
      if (uid) syncSplitsToFirestore(uid, next);
      return next;
    });
  }, []);

  // Update a shared/collaborative split
  const updateSharedSplitState = useCallback(async (splitId: string, updater: (prev: SplitSession) => SplitSession) => {
    setSharedSplits((prev) => {
      const next = prev.map((s) => (s.id === splitId ? updater(s) : s));
      // Async save to Firestore
      const updated = next.find((s) => s.id === splitId);
      if (updated) {
        updateSharedSplit(splitId, updated);
      }
      return next;
    });
  }, []);

  const createSplit = useCallback(
    async (name: string, emoji: string, members: Omit<SplitMember, "id">[]) => {
      const uid = uidRef.current || localStorage.getItem(UID_KEY);
      const currentUserEmail = (user?.email || "").trim().toLowerCase();
      const currentUserName = user?.displayName || "You";

      // Check if any member has an email that resolves to a registered user
      const resolvedMembers: SplitMember[] = [];
      let hasCollaborative = false;

      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        const email = m.email?.trim().toLowerCase();
        const memberId = `m_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`;
        const member: SplitMember = {
          ...m,
          email,
          id: memberId,
          role: i === 0 || email === currentUserEmail ? "admin" : "member",
          status: m.uid === uid || email === currentUserEmail ? "accepted" : "accepted",
        };

        if (email && email !== currentUserEmail) {
          try {
            const profile = await findUserByEmail(email);
            if (profile) {
              hasCollaborative = true;
              member.uid = profile.uid;
              member.name = member.name || profile.displayName || email;
              member.status = "pending";
            } else {
              member.name = member.name || email;
            }
          } catch {}
        }

        if (email === currentUserEmail && uid) {
          member.uid = uid;
          member.name = currentUserName;
        }

        resolvedMembers.push(member);
      }

      // Ensure creator is a member with admin role
      const creatorIsMember = resolvedMembers.some((m) => m.uid === uid || m.email === currentUserEmail);
      if (!creatorIsMember && uid) {
        // Add creator as first member with admin role
        resolvedMembers.unshift({
          id: `m_${Date.now()}_creator`,
          name: currentUserName,
          avatar: "😎",
          email: currentUserEmail,
          uid: uid,
          role: "admin",
          status: "accepted",
        });
      } else {
        // Mark creator as admin (always ensure creator is admin)
        const creatorMember = resolvedMembers.find((m) => m.uid === uid || m.email === currentUserEmail);
        if (creatorMember) {
          creatorMember.role = "admin";
          creatorMember.status = "accepted";
        }
      }

      // Final validation: ensure first member is always the creator with admin role
      if (!resolvedMembers.some((m) => m.role === "admin")) {
        // If no admin found, make the creator admin (if they exist)
        const creator = resolvedMembers.find((m) => m.uid === uid);
        if (creator) {
          creator.role = "admin";
        }
      }

      const split: SplitSession = {
        id: `split_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        emoji,
        members: resolvedMembers,
        expenses: [],
        settlements: [],
        createdAt: getTodayISO(),
        archived: false,
        creatorUid: uid || undefined,
        isCollaborative: hasCollaborative,
      };

      if (hasCollaborative && uid) {
        // Store in shared collection
        await createSharedSplit(split);

        // Add to user's shared split IDs
        const existingIds = await loadUserSharedSplitIds(uid);
        if (!existingIds.includes(split.id)) {
          await saveUserSharedSplitIds(uid, [...existingIds, split.id]);
        }

        // Send notifications to invited members
        for (const member of resolvedMembers) {
          if (member.uid && member.uid !== uid && member.status === "pending") {
            try {
              const notification = {
                type: "split_invite",
                splitId: split.id,
                splitName: name,
                splitEmoji: emoji,
                fromUid: uid,
                fromName: currentUserName,
                message: `${currentUserName} invited you to "${name}"`,
                createdAt: new Date().toISOString(),
                read: false,
              } as const;

              await addNotification(member.uid, notification);
              await addSplitInvite(member.uid, member.email, notification);

              // Also add splitId to invited user's list so they can see it
              const theirIds = await loadUserSharedSplitIds(member.uid);
              if (!theirIds.includes(split.id)) {
                await saveUserSharedSplitIds(member.uid, [...theirIds, split.id]);
              }
            } catch {}
          }
        }

        setSharedSplits((prev) => [split, ...prev]);
      } else {
        // Local-only split
        updateLocalSplits((prev) => [split, ...prev]);
      }

      return split;
    },
    [updateLocalSplits, user]
  );

  const addSplitExpense = useCallback(
    (splitId: string, expense: Omit<SplitExpense, "id">) => {
      const newExpense: SplitExpense = {
        ...expense,
        id: `se_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };

      // Check if it's a shared split
      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, (s) => ({
          ...s,
          expenses: [newExpense, ...s.expenses],
        }));

        // Send notification to other members
        const split = sharedSplits.find((s) => s.id === splitId);
        const uid = uidRef.current;
        if (split && uid) {
          const firstContributor = getExpenseContributions(newExpense)[0];
          const payer = split.members.find((m) => m.id === (firstContributor?.memberId || newExpense.paidBy));
          for (const member of split.members) {
            if (member.uid && member.uid !== uid && member.status === "accepted") {
              addNotification(member.uid, {
                type: "expense_added",
                splitId,
                splitName: split.name,
                splitEmoji: split.emoji,
                fromUid: uid,
                fromName: payer?.name || "Someone",
                message: `${payer?.name || "Someone"} added "${newExpense.description}" (₹${newExpense.amount})`,
                createdAt: new Date().toISOString(),
                read: false,
              }).catch(() => {});
            }
          }
        }
      } else {
        updateLocalSplits((prev) =>
          prev.map((t) =>
            t.id === splitId ? { ...t, expenses: [newExpense, ...t.expenses] } : t
          )
        );
      }

      return newExpense;
    },
    [updateLocalSplits, updateSharedSplitState, sharedSplits]
  );

  const deleteSplitExpense = useCallback(
    (splitId: string, expenseId: string) => {
      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, (s) => ({
          ...s,
          expenses: s.expenses.filter((e) => e.id !== expenseId),
        }));
      } else {
        updateLocalSplits((prev) =>
          prev.map((t) =>
            t.id === splitId ? { ...t, expenses: t.expenses.filter((e) => e.id !== expenseId) } : t
          )
        );
      }
    },
    [updateLocalSplits, updateSharedSplitState, sharedSplits]
  );

  const addMember = useCallback(
    async (splitId: string, member: Omit<SplitMember, "id">) => {
      const uid = uidRef.current;
      const email = member.email?.trim().toLowerCase();
      const newMember: SplitMember = {
        ...member,
        email,
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: "member",
        status: "accepted",
      };

      // If email provided, try to resolve to a registered user
      if (email) {
        try {
          const profile = await findUserByEmail(email);
          if (profile) {
            newMember.uid = profile.uid;
            newMember.name = newMember.name || profile.displayName || email;
            newMember.status = "pending";
          } else {
            newMember.name = newMember.name || email;
          }

          if (profile) {
            // Send invitation notification
            if (uid) {
              const currentUserName = user?.displayName || "Someone";
              const split = allSplits.find((s) => s.id === splitId);
              if (split) {
                const notification = {
                  type: "split_invite",
                  splitId,
                  splitName: split.name,
                  splitEmoji: split.emoji,
                  fromUid: uid,
                  fromName: currentUserName,
                  message: `${currentUserName} invited you to "${split.name}"`,
                  createdAt: new Date().toISOString(),
                  read: false,
                } as const;

                await addNotification(profile.uid, notification);
                await addSplitInvite(profile.uid, email, notification);

                // Add splitId to their shared list
                const theirIds = await loadUserSharedSplitIds(profile.uid);
                if (!theirIds.includes(splitId)) {
                  await saveUserSharedSplitIds(profile.uid, [...theirIds, splitId]);
                }
              }
            }
          }
        } catch {}
      }

      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, (s) => ({
          ...s,
          members: [...s.members, newMember],
        }));
      } else {
        // If adding an email-linked member to a local split, convert to collaborative
        if (newMember.uid && uid) {
          const localSplit = splits.find((s) => s.id === splitId);
          if (localSplit) {
            const updatedSplit: SplitSession = {
              ...localSplit,
              members: [...localSplit.members, newMember],
              isCollaborative: true,
              creatorUid: localSplit.creatorUid || uid,
            };

            // Move from local to shared
            updateLocalSplits((prev) => prev.filter((s) => s.id !== splitId));
            await createSharedSplit(updatedSplit);
            const existingIds = await loadUserSharedSplitIds(uid);
            if (!existingIds.includes(splitId)) {
              await saveUserSharedSplitIds(uid, [...existingIds, splitId]);
            }
            setSharedSplits((prev) => [updatedSplit, ...prev]);
            return newMember;
          }
        }

        updateLocalSplits((prev) =>
          prev.map((t) =>
            t.id === splitId ? { ...t, members: [...t.members, newMember] } : t
          )
        );
      }

      return newMember;
    },
    [updateLocalSplits, updateSharedSplitState, sharedSplits, splits, allSplits, user]
  );

  const removeMember = useCallback(
    (splitId: string, memberId: string) => {
      const doRemove = (s: SplitSession): SplitSession => {
        const involved = s.expenses.some(
          (e) =>
            e.paidBy === memberId ||
            (e.contributors?.some((c) => c.memberId === memberId) ?? false) ||
            e.splitAmong.includes(memberId)
        );
        if (involved) return s;
        return { ...s, members: s.members.filter((m) => m.id !== memberId) };
      };

      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, doRemove);
      } else {
        updateLocalSplits((prev) => prev.map((t) => (t.id === splitId ? doRemove(t) : t)));
      }
    },
    [updateLocalSplits, updateSharedSplitState, sharedSplits]
  );

  const settleDebt = useCallback(
    (splitId: string, from: string, to: string, amount: number) => {
      const split = allSplits.find((t) => t.id === splitId);
      if (!split) return;

      const currentBalance = calculateBalances(split).find(
        (b) => b.from.id === from && b.to.id === to
      );
      const isPartialPayment = currentBalance && amount < currentBalance.amount;

      const settlement: SplitSettlement = {
        id: `stl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        from,
        to,
        amount,
        settled: !isPartialPayment,
        date: getTodayISO(),
        isPartialPayment: !!isPartialPayment,
      };

      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, (s) => ({
          ...s,
          settlements: [...s.settlements, settlement],
        }));

        // Send notification
        const uid = uidRef.current;
        if (uid && split) {
          const fromMember = split.members.find((m) => m.id === from);
          const toMember = split.members.find((m) => m.id === to);
          if (toMember?.uid && toMember.uid !== uid) {
            addNotification(toMember.uid, {
              type: "settlement",
              splitId,
              splitName: split.name,
              splitEmoji: split.emoji,
              fromUid: uid,
              fromName: fromMember?.name || "Someone",
              message: `${fromMember?.name} ${isPartialPayment ? "paid" : "settled"} ₹${amount.toLocaleString()}`,
              createdAt: new Date().toISOString(),
              read: false,
            }).catch(() => {});
          }
        }
      } else {
        updateLocalSplits((prev) =>
          prev.map((t) =>
            t.id === splitId ? { ...t, settlements: [...t.settlements, settlement] } : t
          )
        );
      }
    },
    [updateLocalSplits, updateSharedSplitState, allSplits, sharedSplits]
  );

  const archiveSplit = useCallback(
    (splitId: string) => {
      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, (s) => ({ ...s, archived: !s.archived }));
      } else {
        updateLocalSplits((prev) =>
          prev.map((t) => (t.id === splitId ? { ...t, archived: !t.archived } : t))
        );
      }
    },
    [updateLocalSplits, updateSharedSplitState, sharedSplits]
  );

  const deleteSplit = useCallback(
    async (splitId: string) => {
      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        // Remove from shared collection
        await deleteSharedSplit(splitId);
        setSharedSplits((prev) => prev.filter((s) => s.id !== splitId));

        // Remove from user's shared list
        const uid = uidRef.current || localStorage.getItem(UID_KEY);
        if (uid) {
          const ids = await loadUserSharedSplitIds(uid);
          await saveUserSharedSplitIds(uid, ids.filter((id) => id !== splitId));
        }
      } else {
        const next = splits.filter((t) => t.id !== splitId);
        setSplits(next);
        const uid = uidRef.current || localStorage.getItem(UID_KEY);
        saveLocalSplits(next, uid);
        if (uid) {
          await syncSplitsToFirestoreImmediate(uid, next);
        }
      }
    },
    [splits, sharedSplits]
  );

  const getSplit = useCallback(
    (splitId: string) => allSplits.find((t) => t.id === splitId) ?? null,
    [allSplits]
  );

  const updateSplit = useCallback(
    (splitId: string, updates: { name?: string; emoji?: string }) => {
      const doUpdate = (s: SplitSession): SplitSession => ({
        ...s,
        name: updates.name ?? s.name,
        emoji: updates.emoji ?? s.emoji,
      });

      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, doUpdate);
      } else {
        updateLocalSplits((prev) => prev.map((t) => (t.id === splitId ? doUpdate(t) : t)));
      }
    },
    [updateLocalSplits, updateSharedSplitState, sharedSplits]
  );

  const updateSplitExpense = useCallback(
    (splitId: string, expenseId: string, updates: Partial<Omit<SplitExpense, "id">>) => {
      const doUpdate = (s: SplitSession): SplitSession => ({
        ...s,
        expenses: s.expenses.map((e) => (e.id === expenseId ? { ...e, ...updates } : e)),
      });

      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, doUpdate);
      } else {
        updateLocalSplits((prev) => prev.map((t) => (t.id === splitId ? doUpdate(t) : t)));
      }
    },
    [updateLocalSplits, updateSharedSplitState, sharedSplits]
  );

  const updateMember = useCallback(
    (splitId: string, memberId: string, updates: Partial<Omit<SplitMember, "id">>) => {
      const doUpdate = (s: SplitSession): SplitSession => ({
        ...s,
        members: s.members.map((m) => (m.id === memberId ? { ...m, ...updates } : m)),
      });

      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, doUpdate);
      } else {
        updateLocalSplits((prev) => prev.map((t) => (t.id === splitId ? doUpdate(t) : t)));
      }
    },
    [updateLocalSplits, updateSharedSplitState, sharedSplits]
  );

  // Accept a split invitation
  const acceptInvite = useCallback(
    async (splitId: string) => {
      const uid = uidRef.current;
      if (!uid) return;

      const split = sharedSplits.find((s) => s.id === splitId) ?? (await loadSharedSplit(splitId));
      if (split) {
        const currentUserName = user?.displayName || user?.email || "Member";
        const updatedSplit: SplitSession = {
          ...split,
          members: split.members.map((m) =>
            m.uid === uid ? { ...m, name: currentUserName, status: "accepted" as const } : m
          ),
        };

        await updateSharedSplit(splitId, { members: updatedSplit.members });

        const ids = await loadUserSharedSplitIds(uid);
        if (!ids.includes(splitId)) {
          await saveUserSharedSplitIds(uid, [...ids, splitId]);
        }

        setSharedSplits((prev) => {
          const exists = prev.some((s) => s.id === splitId);
          return exists
            ? prev.map((s) => (s.id === splitId ? updatedSplit : s))
            : [updatedSplit, ...prev];
        });
      }
    },
    [sharedSplits, user?.displayName, user?.email]
  );

  // Reject a split invitation
  const rejectInvite = useCallback(
    async (splitId: string) => {
      const uid = uidRef.current;
      if (!uid) return;

      const split = sharedSplits.find((s) => s.id === splitId) ?? (await loadSharedSplit(splitId));
      if (split) {
        const updatedMembers = split.members.map((m) =>
          m.uid === uid ? { ...m, status: "rejected" as const } : m
        );
        await updateSharedSplit(splitId, { members: updatedMembers });
      }

      setSharedSplits((prev) => prev.filter((s) => s.id !== splitId));

      // Remove from user's shared list
      const ids = await loadUserSharedSplitIds(uid);
      await saveUserSharedSplitIds(uid, ids.filter((id) => id !== splitId));
    },
    [sharedSplits]
  );

  // Assign admin role (only admins can do this)
  const assignAdmin = useCallback(
    async (splitId: string, memberId: string) => {
      const uid = uidRef.current;
      if (!uid) return;

      const split = allSplits.find((s) => s.id === splitId);
      if (!split) return;

      // Check if current user is admin
      const currentMember = split.members.find((m) => m.uid === uid);
      if (currentMember?.role !== "admin") return;

      const doUpdate = (s: SplitSession): SplitSession => ({
        ...s,
        members: s.members.map((m) =>
          m.id === memberId ? { ...m, role: "admin" as const } : m
        ),
      });

      const isShared = sharedSplits.some((s) => s.id === splitId);
      if (isShared) {
        updateSharedSplitState(splitId, doUpdate);
      } else {
        updateLocalSplits((prev) => prev.map((t) => (t.id === splitId ? doUpdate(t) : t)));
      }
    },
    [allSplits, sharedSplits, updateLocalSplits, updateSharedSplitState]
  );

  // Check if current user is admin of a split
  const isAdmin = useCallback(
    (splitId: string): boolean => {
      const uid = uidRef.current;
      if (!uid) return true; // Non-collaborative splits: everyone is admin
      const split = allSplits.find((s) => s.id === splitId);
      if (!split) return false;
      if (!split.isCollaborative) return true; // Local splits: always admin
      const member = split.members.find((m) => m.uid === uid);
      return member?.role === "admin";
    },
    [allSplits]
  );

  return {
    splits: allSplits,
    localSplits: splits,
    sharedSplits,
    hydrated,
    createSplit,
    addSplitExpense,
    deleteSplitExpense,
    updateSplitExpense,
    addMember,
    removeMember,
    updateMember,
    settleDebt,
    archiveSplit,
    deleteSplit,
    getSplit,
    updateSplit,
    acceptInvite,
    rejectInvite,
    assignAdmin,
    isAdmin,
  };
}

// Legacy export for backward compatibility
export const useTrips = useSplits;
export const getTripTotal = getSplitTotal;
