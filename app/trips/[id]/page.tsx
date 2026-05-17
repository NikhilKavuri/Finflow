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
} from "lucide-react";
import { useTrips, calculateBalances, getTripTotal, getMemberSpending } from "@/hooks/useTrips";
import { formatINR, formatDate } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import BalanceChart from "@/components/trips/BalanceChart";
import TripExpenseDrawer from "@/components/trips/TripExpenseDrawer";
import Toast from "@/components/Toast";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const {
    getTrip,
    addTripExpense,
    deleteTripExpense,
    addMember,
    settleDebt,
    archiveTrip,
    deleteTrip,
    hydrated,
  } = useTrips();

  const trip = getTrip(tripId);

  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState("😊");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expenses" | "balances">("expenses");
  const [toast, setToast] = useState<string | null>(null);

  const AVATAR_OPTIONS = ["😎", "🤩", "😊", "🥳", "🧐", "😈", "🦊", "🐻", "🦁", "🐸", "🌸", "⭐"];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const balances = useMemo(() => (trip ? calculateBalances(trip) : []), [trip]);
  const total = useMemo(() => (trip ? getTripTotal(trip) : 0), [trip]);
  const memberSpending = useMemo(() => (trip ? getMemberSpending(trip) : {}), [trip]);
  const perPersonAvg = trip && trip.members.length > 0 ? total / trip.members.length : 0;

  if (!hydrated) return null;

  if (!trip) {
    return (
      <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col items-center justify-center text-center px-6">
        <div className="text-4xl mb-4">🤔</div>
        <h2 className="font-syne text-lg font-bold text-white mb-2">Trip not found</h2>
        <p className="text-sm text-[#5a5a6e] mb-6">
          This trip may have been deleted or the link is invalid.
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/trips")}
          className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[#6c47ff]"
        >
          Back to Trips
        </motion.button>
      </div>
    );
  }

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    addMember(tripId, { name: newMemberName.trim(), avatar: newMemberAvatar });
    setNewMemberName("");
    setAddMemberOpen(false);
    showToast("Member added");
  };

  return (
    <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-30 glass-nav border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/trips")}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </motion.button>

          <div className="flex-1 min-w-0 mx-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{trip.emoji}</span>
              <h1 className="font-syne text-base font-bold text-white truncate">
                {trip.name}
              </h1>
            </div>
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
                    <button
                      onClick={() => {
                        archiveTrip(tripId);
                        setMenuOpen(false);
                        showToast(trip.archived ? "Trip restored" : "Trip archived");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/[0.04] transition-colors"
                    >
                      {trip.archived ? (
                        <>
                          <ArchiveRestore size={15} className="text-[#b8ff57]" />
                          Restore Trip
                        </>
                      ) : (
                        <>
                          <Archive size={15} className="text-[#facc15]" />
                          Archive Trip
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        deleteTrip(tripId);
                        setMenuOpen(false);
                        router.push("/trips");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/[0.06] transition-colors"
                    >
                      <Trash2 size={15} />
                      Delete Trip
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Member strip */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
          {trip.members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-full bg-[#252533] border border-white/[0.06] flex items-center justify-center text-sm">
                {member.avatar}
              </div>
              <span className="text-[9px] font-semibold text-[#5a5a6e] max-w-[48px] truncate">
                {member.name}
              </span>
            </div>
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
                  {trip.expenses.map((expense, i) => {
                    const payer = trip.members.find((m) => m.id === expense.paidBy);
                    const splitCount = expense.splitAmong.length;
                    const perPerson = splitCount > 0 ? expense.amount / splitCount : 0;

                    return (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        className="rounded-xl border border-white/[0.06] bg-[#1a1a24] p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#6c47ff]/15 flex items-center justify-center text-sm flex-shrink-0">
                            {payer?.avatar || "👤"}
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
                                  {payer?.name}
                                </span>
                                {" · "}
                                {formatDate(expense.date)}
                              </span>
                              <span className="text-[10px] text-[#5a5a6e]">
                                ₹{Math.round(perPerson)} × {splitCount}
                              </span>
                            </div>

                            {/* Split members */}
                            <div className="flex -space-x-1 mt-2">
                              {expense.splitAmong
                                .map((id) => trip.members.find((m) => m.id === id))
                                .filter(Boolean)
                                .slice(0, 6)
                                .map((member, idx) => (
                                  <div
                                    key={member!.id}
                                    className="w-5 h-5 rounded-full bg-[#252533] border border-[#1a1a24] flex items-center justify-center text-[8px]"
                                    style={{ zIndex: 6 - idx }}
                                    title={member!.name}
                                  >
                                    {member!.avatar}
                                  </div>
                                ))}
                            </div>
                          </div>

                          {!trip.archived && (
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => {
                                deleteTripExpense(tripId, expense.id);
                                showToast("Expense removed");
                              }}
                              className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5"
                            >
                              <Trash2 size={11} />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
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
                onSettle={
                  trip.archived
                    ? undefined
                    : (from, to, amount) => {
                        settleDebt(tripId, from, to, amount);
                        showToast("Debt settled! 🤝");
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
                          <span>paid</span>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-[400px] rounded-2xl border border-white/[0.08] bg-[#18181f] p-5"
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

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddMember}
                className="w-full py-3 rounded-xl font-syne text-sm font-bold text-white bg-[#6c47ff]"
              >
                Add Member
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav
        disabled={trip.archived}
        onAddClick={() => setExpenseDrawerOpen(true)}
      />

      <AnimatePresence>
        {expenseDrawerOpen && (
          <TripExpenseDrawer
            members={trip.members}
            onClose={() => setExpenseDrawerOpen(false)}
            onSubmit={(expense) => {
              addTripExpense(tripId, expense);
              setExpenseDrawerOpen(false);
              showToast("Expense added! 💰");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </div>
  );
}
