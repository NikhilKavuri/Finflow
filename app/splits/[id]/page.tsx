"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Trash2,
  UserPlus,
  MoreVertical,
  X,
  Edit2,
  Crown,
  Shield,
  Search,
  Zap,
  TrendingUp,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { useSplits, calculateBalances, getSplitTotal, getMemberSpending } from "@/hooks/useSplits";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR, formatDate } from "@/lib/utils";
import { getCategoryById } from "@/lib/categories";
import BottomNav from "@/components/BottomNav";
import BalanceChart from "@/components/BalanceChart";
import TripExpenseDrawer from "@/components/SplitExpenseDrawer";
import EditMemberModal from "@/components/EditMemberModal";
import EditTitleModal from "@/components/EditTitleModal";
import Toast from "@/components/Toast";
import PageLoader from "@/components/PageLoader";
import type { SplitMember, SplitExpense } from "@/lib/types";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tripId = params.id as string;
  const {
    getSplit,
    addSplitExpense,
    deleteSplitExpense,
    updateSplitExpense,
    addMember,
    removeMember,
    updateMember,
    settleDebt,
    archiveSplit,
    deleteSplit,
    updateSplit,
    isAdmin,
    assignAdmin,
    hydrated,
  } = useSplits();

  const trip = getSplit(tripId);
  const canEdit = isAdmin(tripId);

  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SplitExpense | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<SplitMember | null>(null);
  const [editTitleOpen, setEditTitleOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState("😊");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expenses" | "balances">("expenses");
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToPromote, setMemberToPromote] = useState<SplitMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<SplitMember | null>(null);
  const [expenseSearch, setExpenseSearch] = useState("");

  const AVATAR_OPTIONS = ["😎", "🤩", "😊", "🥳", "🧐", "😈", "🦊", "🐻", "🦁", "🐸", "🌸", "⭐"];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const balances = useMemo(() => (trip ? calculateBalances(trip) : []), [trip]);
  const total = useMemo(() => (trip ? getSplitTotal(trip) : 0), [trip]);
  const memberSpending = useMemo(() => (trip ? getMemberSpending(trip) : {}), [trip]);
  const perPersonAvg = trip && trip.members.length > 0 ? total / trip.members.length : 0;

  const filteredExpenses = useMemo(() => {
    if (!trip) return [];
    if (!expenseSearch.trim()) return trip.expenses;
    const query = expenseSearch.trim().toLowerCase();
    return trip.expenses.filter((expense) => {
      const matchesDescription = expense.description.toLowerCase().includes(query);
      const matchesAmount = expense.amount.toString().includes(query);
      return matchesDescription || matchesAmount;
    });
  }, [trip, expenseSearch]);

  // ── Analytics Computations ────────────────────────────────

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!trip || trip.expenses.length === 0) return [];
    const catMap: Record<string, number> = {};
    for (const exp of trip.expenses) {
      const catId = exp.category || "other";
      catMap[catId] = (catMap[catId] || 0) + exp.amount;
    }
    return Object.entries(catMap)
      .map(([catId, amount]) => {
        const cat = getCategoryById(catId);
        return { id: catId, name: cat.name, emoji: cat.emoji, color: cat.color, amount, pct: total > 0 ? (amount / total) * 100 : 0 };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [trip, total]);

  // Daily spending timeline
  const dailyTimeline = useMemo(() => {
    if (!trip || trip.expenses.length === 0) return [];
    const dayMap: Record<string, { date: string; total: number; count: number }> = {};
    for (const exp of trip.expenses) {
      if (!dayMap[exp.date]) dayMap[exp.date] = { date: exp.date, total: 0, count: 0 };
      dayMap[exp.date].total += exp.amount;
      dayMap[exp.date].count += 1;
    }
    const days = Object.values(dayMap).sort((a, b) => (a.date > b.date ? 1 : -1));
    const maxDay = Math.max(...days.map((d) => d.total), 1);
    return days.map((d) => ({ ...d, pct: (d.total / maxDay) * 100 }));
  }, [trip]);

  // Trip stats spotlight
  const tripStats = useMemo(() => {
    if (!trip || trip.expenses.length === 0) return null;
    const expCount = trip.expenses.length;
    const avgExpense = total / expCount;
    const highestExpense = trip.expenses.reduce((max, e) => (e.amount > max.amount ? e : max), trip.expenses[0]);
    // Top spender (who paid the most)
    let topSpenderId = "";
    let topSpenderAmount = 0;
    for (const [memberId, spent] of Object.entries(memberSpending)) {
      if (spent > topSpenderAmount) {
        topSpenderId = memberId;
        topSpenderAmount = spent;
      }
    }
    const topSpender = trip.members.find((m) => m.id === topSpenderId);
    const isSolo = trip.members.length === 1;
    return { expCount, avgExpense, highestExpense, topSpender, topSpenderAmount, isSolo };
  }, [trip, total, memberSpending]);

  // Per-member detailed stats
  const memberDetailedStats = useMemo(() => {
    if (!trip || trip.expenses.length === 0) return [];
    return trip.members.map((member) => {
      const paidExpenses = trip.expenses.filter((e) => {
        if (e.contributors && e.contributors.length > 0) {
          return e.contributors.some((c) => c.memberId === member.id);
        }
        return e.paidBy === member.id;
      });
      const totalPaid = memberSpending[member.id] || 0;
      const expenseCount = paidExpenses.length;
      const avgExpense = expenseCount > 0 ? totalPaid / expenseCount : 0;
      const shareOfTotal = total > 0 ? (totalPaid / total) * 100 : 0;
      return { member, totalPaid, expenseCount, avgExpense, shareOfTotal };
    }).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [trip, memberSpending, total]);

  if (!hydrated) return <PageLoader message="Loading split..." />;

  if (!trip) {
    return (
      <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col items-center justify-center text-center px-6">
        <div className="text-4xl mb-4">🤔</div>
        <h2 className="font-syne text-lg font-bold text-white mb-2">Split not found</h2>
        <p className="text-sm text-[#5a5a6e] mb-6">
          This split may have been deleted or the link is invalid.
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/splits")}
          className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[#6c47ff]"
        >
          Back to Splits
        </motion.button>
      </div>
    );
  }

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    addMember(tripId, { 
      name: newMemberName.trim(), 
      avatar: newMemberAvatar,
      email: newMemberEmail.trim() || undefined,
    });
    setNewMemberName("");
    setNewMemberEmail("");
    setAddMemberOpen(false);
    showToast("Member added");
  };

  const handleEditMember = (name: string, avatar: string) => {
    if (!editingMember) return;
    updateMember(tripId, editingMember.id, { name, avatar });
    setEditingMember(null);
    showToast("Member updated");
  };

  const handleRemoveMember = (memberId: string) => {
    const memberToRemoveObj = trip.members.find((m) => m.id === memberId);
    if (!memberToRemoveObj) return;

    const involved = trip.expenses.some(
      (e) =>
        e.paidBy === memberId ||
        (e.contributors?.some((c) => c.memberId === memberId) ?? false) ||
        e.splitAmong.includes(memberId)
    );

    if (involved) {
      showToast("Cannot remove member with expenses");
      return;
    }

    if (memberToRemoveObj.role === "admin") {
      const otherAdmins = trip.members.filter((m) => m.id !== memberId && m.role === "admin");
      if (otherAdmins.length === 0 && trip.members.length > 1) {
        showToast("Assign another admin before removing yourself");
        return;
      }
    }

    removeMember(tripId, memberId);
    setEditingMember(null);
    showToast("Member removed");
  };

  const handleEditTitle = (name: string, emoji: string) => {
    updateSplit(tripId, { name, emoji });
    setEditTitleOpen(false);
    showToast("Split updated");
  };

  const handleAddExpense = (expense: Omit<SplitExpense, "id">) => {
    if (editingExpense) {
      updateSplitExpense(tripId, editingExpense.id, expense);
      showToast("Expense updated");
    } else {
      addSplitExpense(tripId, expense);
      showToast("Expense added");
    }
    setExpenseDrawerOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteSplit = async () => {
    setIsDeleting(true);
    try {
      await deleteSplit(tripId);
      router.push("/splits");
    } catch {
      showToast("Failed to delete. Try again.");
      setIsDeleting(false);
    }
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    if (!canEdit) {
      showToast("Only admins can promote members");
      return;
    }
    try {
      await assignAdmin(tripId, memberId);
      showToast("Member promoted to admin");
      setMemberToPromote(null);
    } catch {
      showToast("Failed to promote member");
    }
  };

  return (
    <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-30 glass-nav border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/splits")}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </motion.button>

          <div className="flex-1 min-w-0 mx-3 text-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditTitleOpen(true)}
              disabled={trip.archived}
              className="flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span className="text-lg">{trip.emoji}</span>
              <h1 className="font-syne text-base font-bold text-white truncate group-hover:text-[#8b6fff] transition-colors">
                {trip.name}
              </h1>
            </motion.button>
          </div>

          {/* Menu */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
            >
              <MoreVertical size={18} />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 z-40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141419]/95 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                  >
                    {canEdit && !trip.archived && (
                      <button
                        onClick={() => {
                          setEditTitleOpen(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <Edit2 size={15} className="text-[#8b6fff]" />
                        Edit Split
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setAddMemberOpen(true);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <UserPlus size={15} className="text-[#8b6fff]" />
                      Add Member
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => {
                          archiveSplit(tripId);
                          setMenuOpen(false);
                          showToast(trip.archived ? "Split restored" : "Split archived");
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/[0.04] transition-colors"
                      >
                        {trip.archived ? (
                          <>
                            <ArchiveRestore size={15} className="text-[#b8ff57]" />
                            Restore Split
                          </>
                        ) : (
                          <>
                            <Archive size={15} className="text-[#facc15]" />
                            Archive Split
                          </>
                        )}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmDeleteOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/[0.06] transition-colors"
                      >
                        <Trash2 size={15} />
                        Delete Split
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Member strip with edit on click */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
          {trip.members.map((member) => (
            <motion.button
              key={member.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => !trip.archived && setEditingMember(member)}
              disabled={trip.archived}
              className="flex flex-col items-center gap-1 flex-shrink-0 group disabled:opacity-50 relative"
            >
              <div className="w-9 h-9 rounded-full bg-[#252533] border border-white/[0.06] flex items-center justify-center text-sm group-hover:border-[#8b6fff]/40 group-hover:bg-[#6c47ff]/15 transition-all">
                {member.avatar}
              </div>
              {member.role === "admin" && (
                <Crown size={12} className="absolute top-0 right-0 text-yellow-400 fill-yellow-400" />
              )}
              <span className="text-[9px] font-semibold text-[#5a5a6e] max-w-[48px] truncate group-hover:text-[#9898aa] transition-colors">
                {member.name}
              </span>
              {member.status === "pending" && (
                <span className="text-[7px] text-yellow-400 font-semibold">pending</span>
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-4 pt-4 space-y-4">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-4">
            <div className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mb-1">
              Total Spent
            </div>
            <div className="font-syne text-xl font-bold text-white">
              {formatINR(total)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-4">
            <div className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mb-1">
              Per Person
            </div>
            <div className="font-syne text-xl font-bold text-[#8b6fff]">
              {formatINR(perPersonAvg)}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-1 p-1 rounded-xl bg-[#15151d] border border-white/[0.06]"
        >
          {(["expenses", "balances"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-[#6c47ff]/20 text-[#8b6fff] shadow-[0_0_12px_rgba(108,71,255,0.15)]"
                  : "text-[#5a5a6e] hover:text-[#9898aa]"
              }`}
            >
              {tab === "expenses" ? `Expenses (${trip.expenses.length})` : `Balances (${balances.length})`}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "expenses" ? (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              {trip.expenses.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-[#15151d] p-8 text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-sm text-[#5a5a6e]">
                    No expenses yet. Add one to get started!
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Search Bar for Expenses */}
                  <div className="relative mb-3">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6e]"
                    />
                    <input
                      type="text"
                      placeholder="Search expenses by name or amount..."
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      className="w-full bg-[#15151d] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]/40 transition-colors"
                    />
                  </div>
                  <div className="h-px bg-white/[0.06] mb-3" />

                  {filteredExpenses.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#5a5a6e]">
                      No expenses matching &quot;{expenseSearch}&quot;
                    </div>
                  ) : (
                    filteredExpenses.map((expense) => {
                    const contributors =
                      expense.contributors && expense.contributors.length > 0
                        ? expense.contributors
                        : [{ memberId: expense.paidBy, amount: expense.amount }];
                    const contributorMembers = contributors
                      .map((c) => trip.members.find((m) => m.id === c.memberId))
                      .filter(Boolean);
                    const contributorIds = new Set(contributors.map((c) => c.memberId));
                    const primaryContributor = contributorMembers[0];
                    const splitCount = expense.splitAmong.length;
                    const perPerson = splitCount > 0 ? expense.amount / splitCount : 0;
                    // Members who owe (everyone in splitAmong except contributors)
                    const owingMembers = expense.splitAmong
                      .filter((id) => !contributorIds.has(id))
                      .map((id) => trip.members.find((m) => m.id === id))
                      .filter(Boolean);
                    const contributorsInSplit = contributorMembers.filter((m) =>
                      expense.splitAmong.includes(m!.id)
                    );
                    const paidByLabel =
                      contributorMembers.length === 0
                        ? "Someone"
                        : contributorMembers.length === 1
                          ? contributorMembers[0]!.name
                          : `${contributorMembers[0]!.name} + ${contributorMembers.length - 1}`;

                    return (
                        <div
                          key={expense.id}
                          className="flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#6c47ff]/15 flex items-center justify-center text-sm flex-shrink-0">
                            {primaryContributor?.avatar || "👤"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-white truncate">
                                {expense.description}
                              </h4>
                              <span className="text-sm font-bold text-white flex-shrink-0">
                                {formatINR(expense.amount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] text-[#5a5a6e]">
                                Paid by{" "}
                                <span className="text-[#9898aa] font-medium">
                                  {paidByLabel}
                                </span>
                                {" · "}
                                {formatDate(expense.date)}
                              </span>
                            </div>

                            {/* Clear split breakdown */}
                            <div className="mt-2 px-2.5 py-2 rounded-lg bg-[#15151d] border border-white/[0.04]">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                                  Split equally · {splitCount} people
                                </span>
                                <span className="text-[10px] font-bold text-[#8b6fff]">
                                  {formatINR(perPerson)} each
                                </span>
                              </div>
                              <div className="space-y-1">
                                {owingMembers.map((member) => (
                                  <div key={member!.id} className="flex items-center gap-1.5">
                                    <span className="text-[10px]">{member!.avatar}</span>
                                    <span className="text-[10px] text-[#9898aa] font-medium">
                                      {member!.name}
                                    </span>
                                    <span className="text-[10px] text-[#ff6b35] ml-auto font-semibold">
                                      owes {formatINR(perPerson)}
                                    </span>
                                  </div>
                                ))}
                                {contributorsInSplit.map((m) => (
                                  <div key={m!.id} className="flex items-center gap-1.5">
                                    <span className="text-[10px]">{m!.avatar}</span>
                                    <span className="text-[10px] text-[#9898aa] font-medium">
                                      {m!.name}
                                    </span>
                                    <span className="text-[10px] text-[#2ce88a] ml-auto font-semibold">
                                      self · {formatINR(perPerson)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {!trip.archived && (
                            <div className="flex gap-1 flex-shrink-0 mt-0.5">
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setExpenseDrawerOpen(true);
                                }}
                                className="w-7 h-7 rounded-full bg-[#6c47ff]/10 flex items-center justify-center text-[#8b6fff]"
                              >
                                <Edit2 size={11} />
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => {
                                  deleteSplitExpense(tripId, expense.id);
                                  showToast("Expense removed");
                                }}
                                className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-red-400"
                              >
                                <Trash2 size={11} />
                              </motion.button>
                            </div>
                          )}
                        </div>
                    );
                  })
                )}
              </div>
            )}

              {/* Member Spending Summary */}
              {trip.expenses.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#15151d] p-4">
                  <h4 className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mb-3">
                    Who Paid What
                  </h4>
                  <div className="space-y-2">
                    {trip.members.map((member) => {
                      const spent = memberSpending[member.id] || 0;
                      const pct = total > 0 ? (spent / total) * 100 : 0;
                      return (
                        <div key={member.id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#252533] flex items-center justify-center text-xs">
                            {member.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-white truncate">
                                {member.name}
                              </span>
                              <span className="text-xs font-bold text-[#9898aa]">
                                {formatINR(spent)}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-[#6c47ff] to-[#8b6fff]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Category Breakdown ─────────────────────── */}
              {trip.expenses.length > 0 && categoryBreakdown.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#15151d] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={13} className="text-[#8b6fff]" />
                    <h4 className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                      Category Breakdown
                    </h4>
                  </div>
                  <div className="space-y-2.5">
                    {categoryBreakdown.map((cat, i) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{cat.emoji}</span>
                            <span className="text-xs font-semibold text-white">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold" style={{ color: cat.color }}>
                              {cat.pct.toFixed(1)}%
                            </span>
                            <span className="text-xs font-bold text-[#9898aa]">
                              {formatINR(cat.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.pct}%` }}
                            transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${cat.color}cc, ${cat.color})` }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Trip Stats Spotlight ───────────────────── */}
              {tripStats && (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#15151d] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={13} className="text-[#ffb830]" />
                    <h4 className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                      {tripStats.isSolo ? "Your Stats" : "Trip Highlights"}
                    </h4>
                  </div>

                  {/* Top Spender Card (hidden for solo) */}
                  {!tripStats.isSolo && tripStats.topSpender && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="mb-3 p-3 rounded-xl border border-[#ffb830]/15 bg-gradient-to-br from-[#ffb830]/5 to-[#ff8c00]/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-[#ffb830]/15 border border-[#ffb830]/25 flex items-center justify-center text-lg">
                            {tripStats.topSpender.avatar}
                          </div>
                          <Crown size={12} className="absolute -top-1 -right-1 text-[#ffb830] fill-[#ffb830]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-semibold text-[#ffb830]/70 uppercase tracking-wider">
                            Top Spender
                          </div>
                          <div className="text-sm font-bold text-white">
                            {tripStats.topSpender.name}
                          </div>
                          <div className="text-xs font-bold text-[#ffb830]">
                            {formatINR(tripStats.topSpenderAmount)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                      <div className="text-lg font-bold text-white font-syne">{tripStats.expCount}</div>
                      <div className="text-[9px] font-semibold text-[#5a5a6e] uppercase tracking-wider mt-0.5">
                        Expenses
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                      <div className="text-sm font-bold text-[#8b6fff] font-syne">{formatINR(tripStats.avgExpense)}</div>
                      <div className="text-[9px] font-semibold text-[#5a5a6e] uppercase tracking-wider mt-0.5">
                        Avg Each
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                      <div className="text-sm font-bold text-[#ff6b35] font-syne">{formatINR(tripStats.highestExpense.amount)}</div>
                      <div className="text-[9px] font-semibold text-[#5a5a6e] uppercase tracking-wider mt-0.5">
                        Biggest
                      </div>
                    </div>
                  </div>

                  {/* Highest expense detail */}
                  <div className="mt-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#5a5a6e]">
                        Biggest expense:
                      </span>
                      <span className="text-[10px] font-bold text-white truncate ml-2">
                        {tripStats.highestExpense.description} — {formatINR(tripStats.highestExpense.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Daily Spending Timeline ────────────────── */}
              {trip.expenses.length > 0 && dailyTimeline.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#15151d] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays size={13} className="text-[#2ce88a]" />
                    <h4 className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                      Daily Spending
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {dailyTimeline.map((day, i) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.06 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-16 flex-shrink-0">
                          <div className="text-[10px] font-bold text-[#9898aa]">
                            {formatDate(day.date)}
                          </div>
                          <div className="text-[9px] text-[#5a5a6e]">
                            {day.count} {day.count === 1 ? "expense" : "expenses"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${day.pct}%` }}
                              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.06 }}
                              className="h-full rounded-full bg-gradient-to-r from-[#2ce88a]/80 to-[#2ce88a]"
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {formatINR(day.total)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {dailyTimeline.length > 1 && (
                    <div className="mt-3 pt-2 border-t border-white/[0.04]">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#5a5a6e]">Daily average</span>
                        <span className="font-bold text-[#2ce88a]">
                          {formatINR(total / dailyTimeline.length)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Per-Member Detailed Stats ──────────────── */}
              {trip.expenses.length > 0 && memberDetailedStats.length > 1 && (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#15151d] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={13} className="text-[#a855f7]" />
                    <h4 className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                      Member Expense Stats
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {memberDetailedStats.map((stat, i) => (
                      <motion.div
                        key={stat.member.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.07 }}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-8 h-8 rounded-full bg-[#252533] border border-white/[0.06] flex items-center justify-center text-sm">
                            {stat.member.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{stat.member.name}</div>
                            <div className="text-[10px] text-[#5a5a6e]">
                              {stat.expenseCount} {stat.expenseCount === 1 ? "expense" : "expenses"} paid
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-[#8b6fff]">
                              {formatINR(stat.totalPaid)}
                            </div>
                            <div className="text-[9px] font-semibold text-[#5a5a6e]">
                              {stat.shareOfTotal.toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="px-2 py-1.5 rounded-lg bg-white/[0.03] text-center">
                            <div className="text-[10px] font-bold text-[#9898aa]">{formatINR(stat.avgExpense)}</div>
                            <div className="text-[8px] text-[#5a5a6e] uppercase tracking-wider">Avg/Expense</div>
                          </div>
                          <div className="px-2 py-1.5 rounded-lg bg-white/[0.03] text-center">
                            <div className="text-[10px] font-bold text-[#9898aa]">{stat.expenseCount}</div>
                            <div className="text-[8px] text-[#5a5a6e] uppercase tracking-wider">Times Paid</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="balances"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <BalanceChart
                balances={balances}
                trip={trip}
                onSettle={
                  trip.archived
                    ? undefined
                    : (from, to, amount) => {
                        const currentBalance = balances.find(
                          (b) => b.from.id === from && b.to.id === to
                        );
                        const isPartial = currentBalance && amount < currentBalance.amount;
                        settleDebt(tripId, from, to, amount);
                        showToast(isPartial ? `₹${amount.toLocaleString()} paid! 💸` : "Debt settled! 🤝");
                      }
                }
                interactive={!trip.archived}
              />

              {/* Settlements History */}
              {trip.settlements.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#15151d] p-4">
                  <h4 className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mb-3">
                    Settlement History
                  </h4>
                  <div className="space-y-2">
                    {trip.settlements.map((s) => {
                      const fromMember = trip.members.find((m) => m.id === s.from);
                      const toMember = trip.members.find((m) => m.id === s.to);
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 text-xs text-[#5a5a6e]"
                        >
                          <span className="text-sm">{fromMember?.avatar}</span>
                          <span className="font-medium text-[#9898aa]">
                            {fromMember?.name}
                          </span>
                          <span>{s.isPartialPayment ? "paid" : "settled"}</span>
                          <span className="font-bold text-[#2ce88a]">
                            {formatINR(s.amount)}
                          </span>
                          <span>to</span>
                          <span className="font-medium text-[#9898aa]">
                            {toMember?.name}
                          </span>
                          <span className="text-sm">{toMember?.avatar}</span>
                          <span className="ml-auto text-[10px]">
                            {formatDate(s.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setConfirmDeleteOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative z-10 w-full max-w-[360px] rounded-2xl border border-white/[0.08] bg-[#18181f] p-5"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center text-2xl mx-auto mb-3">
                  🗑️
                </div>
                <h3 className="font-syne text-base font-bold text-white mb-1">Delete this split?</h3>
                <p className="text-xs text-[#5a5a6e]">
                  This will permanently delete &ldquo;{trip.name}&rdquo; and all its expenses. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDeleteOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteSplit}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {addMemberOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              style={{ backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddMemberOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="w-full max-w-[400px] rounded-2xl border border-white/[0.08] bg-[#18181f] p-5"
              >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne text-base font-bold text-white">Add Member</h3>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setAddMemberOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa]"
                >
                  <X size={14} />
                </motion.button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button
                  className="w-12 h-12 rounded-xl bg-[#252533] border border-white/[0.06] flex items-center justify-center text-xl"
                  onClick={() => {
                    const idx = AVATAR_OPTIONS.indexOf(newMemberAvatar);
                    setNewMemberAvatar(AVATAR_OPTIONS[(idx + 1) % AVATAR_OPTIONS.length]);
                  }}
                >
                  {newMemberAvatar}
                </button>
                <input
                  className="flex-1 bg-[#1e1e28] border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]"
                  placeholder="Member name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>

              <input
                className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] mb-4"
                placeholder="Email (optional)"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddMember}
                className="w-full py-3 rounded-xl font-syne text-sm font-bold text-white bg-[#6c47ff]"
              >
                Add Member
              </motion.button>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <BottomNav
        disabled={trip.archived}
        onAddClick={() => {
          setEditingExpense(null);
          setExpenseDrawerOpen(true);
        }}
      />

      {/* Expense Drawer */}
      <AnimatePresence>
        {expenseDrawerOpen && (
          <TripExpenseDrawer
            members={trip.members}
            onClose={() => {
              setExpenseDrawerOpen(false);
              setEditingExpense(null);
            }}
            onSubmit={handleAddExpense}
            initialExpense={editingExpense ?? undefined}
          />
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <EditMemberModal
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onSubmit={handleEditMember}
            canPromote={canEdit && editingMember.role !== "admin"}
            onPromote={() => setMemberToPromote(editingMember)}
            onRemove={canEdit ? () => setMemberToRemove(editingMember) : undefined}
          />
        )}
      </AnimatePresence>

      {/* Remove Member Confirmation Modal */}
      <AnimatePresence>
        {memberToRemove && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMemberToRemove(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative z-10 w-full max-w-[360px] rounded-2xl border border-white/[0.08] bg-[#18181f] p-5"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center text-2xl mx-auto mb-3">
                  ⚠️
                </div>
                <h3 className="font-syne text-base font-bold text-white mb-1">Remove member?</h3>
                <p className="text-xs text-[#5a5a6e]">
                  Are you sure you want to remove &ldquo;{memberToRemove.name}&rdquo; from this split?
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMemberToRemove(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleRemoveMember(memberToRemove.id);
                    setMemberToRemove(null);
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500"
                >
                  Remove
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promote to Admin Modal */}
      <AnimatePresence>
        {memberToPromote && canEdit && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{ backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMemberToPromote(null)}
              className="absolute inset-0 bg-black/20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative z-50 w-[calc(100%-2rem)] max-w-[340px] rounded-2xl border border-white/[0.08] bg-[#18181f] p-6"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">{memberToPromote.avatar}</div>
                <h3 className="font-syne text-lg font-bold text-white mb-1">
                  Make {memberToPromote.name} Admin?
                </h3>
                <p className="text-sm text-[#5a5a6e]">
                  They'll be able to edit, archive, and delete this split.
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMemberToPromote(null)}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePromoteToAdmin(memberToPromote.id)}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-[#6c47ff] hover:bg-[#7d5bff] transition-colors flex items-center justify-center gap-2"
                >
                  <Crown size={16} />
                  Make Admin
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Title Modal */}
      <AnimatePresence>
        {editTitleOpen && (
          <EditTitleModal
            title={trip.name}
            emoji={trip.emoji}
            onClose={() => setEditTitleOpen(false)}
            onSubmit={handleEditTitle}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </div>
  );
}
