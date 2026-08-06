"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Trash2, Pencil, Receipt, Sparkles, Layers, ChevronDown, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { getCategoryById, CATEGORIES } from "@/lib/categories";
import { formatINR, formatDate, groupByDate } from "@/lib/utils";
import { getTransactionDisplayAmount, transactionMatchesSearch } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

import BottomNav from "@/components/BottomNav";
import ExpenseDrawer from "@/components/ExpenseDrawer";
import AddExpenseChooser from "@/components/AddExpenseChooser";
import CategoryGroupDrawer from "@/components/CategoryGroupDrawer";
import Toast from "@/components/Toast";
import PageLoader, { DashboardSkeleton } from "@/components/PageLoader";

export default function ExpensesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    state,
    hydrated,
    addTransaction,
    editTransaction,
    deleteTransaction,
    clearAll,
    resetAll,
  } = useExpenses();

  type AddFlow = "chooser" | "individual" | "group" | null;
  const [addFlow, setAddFlow] = useState<AddFlow>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  // Auth gate: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const filtered = useMemo(() => {
    let result = state.transactions;
    if (selectedCatFilter) {
      result = result.filter((t) => t.category === selectedCatFilter);
    }
    if (query.trim()) {
      result = result.filter((t) => transactionMatchesSearch(t, query));
    }
    return result;
  }, [state.transactions, query, selectedCatFilter]);

  const groups = groupByDate(filtered);
  const dates = Object.keys(groups).sort((a, b) => (a > b ? -1 : 1));

  const totalExpenses = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + getTransactionDisplayAmount(t), 0),
    [filtered]
  );

  const totalIncome = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + getTransactionDisplayAmount(t), 0),
    [filtered]
  );

  // Get unique categories from transactions
  const activeCats = useMemo(() => {
    const catIds = new Set(state.transactions.map((t) => t.category));
    return CATEGORIES.filter((c) => catIds.has(c.id));
  }, [state.transactions]);

  const openAddChooser = () => {
    setEditingTransaction(null);
    setAddFlow("chooser");
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAddFlow(tx.isGroup ? "group" : "individual");
  };

  const toggleGroupExpanded = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeAllDrawers = () => {
    setAddFlow(null);
    setEditingTransaction(null);
  };

  // Show loader while auth or data is loading
  if (loading) return <PageLoader message="Signing you in..." />;
  if (!user) return null;
  if (!hydrated) return <DashboardSkeleton />;

  return (
    <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-30 border-b border-white/[0.06] px-4 py-3.5 glass-nav sm:px-5 sm:py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt size={20} className="text-[#8b6fff]" />
            <span className="font-syne text-xl font-black gradient-text">Expenses</span>
          </div>
          <span className="text-xs font-semibold text-[#5a5a6e] flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
            <Sparkles size={11} className="text-yellow-400" />
            {state.transactions.length} total
          </span>
        </div>

        {/* Reset All Data Button */}
        {state.transactions.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setResetConfirmText(""); setResetModalOpen(true); }}
            className="w-full flex items-center justify-center gap-2 mb-3 py-2.5 rounded-xl border border-red-500/15 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-400 transition-all"
          >
            <RotateCcw size={13} />
            Reset All Data
          </motion.button>
        )}

        {/* Search */}
        {state.transactions.length > 0 && (
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6e]"
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#1e1e28] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]/40 transition-colors"
            />
          </div>
        )}
      </nav>

      <main className="flex-1 space-y-4 px-3 pt-4 sm:px-4">
        {state.transactions.length > 0 && (
          <>
            {/* Quick Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="px-4 py-3 rounded-2xl bg-[#ff4f6b]/10 border border-[#ff4f6b]/15 shadow-sm">
                <div className="text-[10px] font-semibold text-[#ff4f6b]/60 uppercase tracking-widest mb-0.5">Total Spent</div>
                <div className="font-syne text-lg font-bold text-[#ff4f6b]">{formatINR(totalExpenses)}</div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#2ce88a]/10 border border-[#2ce88a]/15 shadow-sm">
                <div className="text-[10px] font-semibold text-[#2ce88a]/60 uppercase tracking-widest mb-0.5">Total Income</div>
                <div className="font-syne text-lg font-bold text-[#2ce88a]">{formatINR(totalIncome)}</div>
              </div>
            </motion.div>

            {/* Category horizontal scrolling filters */}
            {activeCats.length > 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar"
              >
                <button
                  onClick={() => setSelectedCatFilter(null)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap flex-shrink-0 border transition-all ${
                    !selectedCatFilter
                      ? "border-[#8b6fff]/40 bg-[#6c47ff]/15 text-[#8b6fff]"
                      : "border-white/[0.06] bg-[#1e1e28] text-[#5a5a6e] hover:border-white/10"
                  }`}
                >
                  All Categories
                </button>
                {activeCats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatFilter(selectedCatFilter === cat.id ? null : cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap flex-shrink-0 border transition-all ${
                      selectedCatFilter === cat.id
                        ? "border-[#8b6fff]/40 bg-[#6c47ff]/15 text-[#8b6fff]"
                        : "border-white/[0.06] bg-[#1e1e28] text-[#5a5a6e] hover:border-white/10"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-16"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6c47ff]/20 to-[#8b6fff]/10 flex items-center justify-center text-3xl mb-4">
                🧾
              </div>
              <h3 className="font-syne text-lg font-bold text-white mb-2">
                {state.transactions.length === 0 ? "No transactions yet" : "No matching results"}
              </h3>
              <p className="text-sm text-[#5a5a6e] max-w-[240px] mb-6">
                {state.transactions.length === 0 
                  ? "Log your first expense or income by tapping the floating '+' button at the bottom right."
                  : "Try adjusting your filters or search keywords to find what you are looking for."}
              </p>
              {state.transactions.length === 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={openAddChooser}
                  className="px-6 py-3 rounded-2xl font-syne text-sm font-bold text-white glow-accent"
                  style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
                >
                  Log Your First Expense 💰
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-[#5a5a6e] tracking-widest uppercase">
                  History
                </span>
                <button
                  onClick={() => {
                    setResetConfirmText("");
                    setResetModalOpen(true);
                  }}
                  className="text-[10px] font-bold text-[#5a5a6e] hover:text-[#ff4f6b] transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {dates.map((date) => (
                  <div key={date} className="space-y-1.5">
                    <div className="text-[10px] font-bold text-[#5a5a6e] tracking-widest uppercase pl-1">
                      {formatDate(date)}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {groups[date].map((tx, i) => {
                        const cat = getCategoryById(tx.category);
                        const bank = state.banks.find((b) => b.id === tx.bankId);
                        const displayAmount = getTransactionDisplayAmount(tx);
                        const isGroup = !!tx.isGroup;
                        const isExpanded = expandedGroups.has(tx.id);
                        const subCount = tx.subExpenses?.length ?? 0;

                        return (
                          <div key={tx.id} className="flex flex-col gap-1">
                            <motion.div
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: i * 0.01 }}
                              className={`group rounded-2xl border bg-[#1e1e28] px-3 py-3 transition-all active:bg-[#252533] sm:px-3.5 ${
                                isGroup
                                  ? "border-[#ffb830]/15"
                                  : "border-white/[0.04]"
                              }`}
                            >
                              <div className="flex gap-2.5 sm:gap-3">
                                {isGroup ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleGroupExpanded(tx.id)}
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#ffb830]/12 text-[#ffb830] sm:h-10 sm:w-10"
                                    aria-label={isExpanded ? "Collapse group" : "Expand group"}
                                  >
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <ChevronDown size={16} />
                                    </motion.div>
                                  </button>
                                ) : (
                                  <div
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base sm:h-10 sm:w-10 sm:text-lg"
                                    style={{ background: cat.color + "18" }}
                                  >
                                    {cat.emoji}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <div className="truncate text-sm font-semibold text-white">
                                          {tx.name}
                                        </div>
                                        {isGroup && (
                                          <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full border border-[#ffb830]/25 bg-[#ffb830]/10 px-1.5 py-0.5 text-[8px] font-bold text-[#ffb830]">
                                            <Layers size={9} />
                                            {subCount}
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-[#5a5a6e]">
                                        <span className="truncate">{cat.name}</span>
                                        {!isGroup && bank?.name && (
                                          <>
                                            <span>·</span>
                                            <span className="truncate">{bank.name}</span>
                                          </>
                                        )}
                                        {isGroup && (
                                          <>
                                            <span>·</span>
                                            <span className="text-[#ffb830]/70">Group</span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                                      <div
                                        className={`font-syne text-xs font-black sm:text-sm ${
                                          tx.type === "income" ? "text-[#2ce88a]" : "text-[#ff4f6b]"
                                        }`}
                                      >
                                        {tx.type === "income" ? "+" : "-"}
                                        {formatINR(displayAmount)}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <motion.button
                                          whileTap={{ scale: 0.85 }}
                                          onClick={() => handleEditTransaction(tx)}
                                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8b6fff] sm:rounded-xl"
                                          style={{ background: "rgba(108,71,255,0.08)" }}
                                          aria-label="Edit"
                                        >
                                          <Pencil size={11} />
                                        </motion.button>
                                        <motion.button
                                          whileTap={{ scale: 0.85 }}
                                          onClick={() => {
                                            if (confirm(`Delete "${tx.name}"?`)) {
                                              deleteTransaction(tx.id);
                                              showToast("Transaction deleted");
                                            }
                                          }}
                                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#ff4f6b] sm:rounded-xl"
                                          style={{ background: "rgba(255,79,107,0.08)" }}
                                          aria-label="Delete"
                                        >
                                          <Trash2 size={11} />
                                        </motion.button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>

                            <AnimatePresence>
                              {isGroup && isExpanded && tx.subExpenses && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="ml-2 flex flex-col gap-1 overflow-hidden border-l-2 border-[#ffb830]/20 pl-2.5 sm:ml-4 sm:pl-3"
                                >
                                  {tx.subExpenses.map((sub) => {
                                    const subCat = getCategoryById(sub.category);
                                    const subBank = state.banks.find((b) => b.id === sub.bankId);
                                    return (
                                      <div
                                        key={sub.id}
                                        className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-[#15151d] px-2.5 py-2 sm:gap-2.5 sm:px-3 sm:py-2.5"
                                      >
                                        <div
                                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm sm:h-8 sm:w-8"
                                          style={{ background: subCat.color + "18" }}
                                        >
                                          {subCat.emoji}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="truncate text-[11px] font-semibold text-white sm:text-xs">
                                            {sub.name}
                                          </div>
                                          <div className="truncate text-[9px] text-[#5a5a6e]">
                                            {subCat.name}
                                            {subBank?.name ? ` · ${subBank.name}` : ""}
                                          </div>
                                        </div>
                                        <div
                                          className={`flex-shrink-0 font-syne text-[11px] font-bold sm:text-xs ${
                                            sub.type === "income" ? "text-[#2ce88a]" : "text-[#ff4f6b]"
                                          }`}
                                        >
                                          {sub.type === "income" ? "+" : "-"}
                                          {formatINR(sub.amount)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav onAddClick={openAddChooser} />

      <AnimatePresence>
        {addFlow === "chooser" && (
          <AddExpenseChooser
            onClose={closeAllDrawers}
            onSelectIndividual={() => setAddFlow("individual")}
            onSelectCategory={() => setAddFlow("group")}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addFlow === "individual" && (
          <ExpenseDrawer
            banks={state.banks}
            paymentMethods={state.paymentMethods || []}
            editingTransaction={editingTransaction}
            onClose={closeAllDrawers}
            onSubmit={(data) => {
              addTransaction(data);
              closeAllDrawers();
              showToast("Expense logged");
            }}
            onEdit={(id, data) => {
              editTransaction(id, data);
              closeAllDrawers();
              showToast("Expense updated");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addFlow === "group" && (
          <CategoryGroupDrawer
            banks={state.banks}
            paymentMethods={state.paymentMethods || []}
            editingGroup={editingTransaction?.isGroup ? editingTransaction : null}
            onClose={closeAllDrawers}
            onSubmit={(data) => {
              addTransaction(data);
              closeAllDrawers();
              showToast("Category group created");
            }}
            onEdit={(id, data) => {
              editTransaction(id, data);
              closeAllDrawers();
              showToast("Category group updated");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>

      {/* Reset All Data Confirmation Modal */}
      <AnimatePresence>
        {resetModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setResetModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative z-10 w-full max-w-[380px] rounded-2xl border border-white/[0.08] bg-[#18181f] p-5"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3">
                  <RotateCcw size={24} className="text-red-400" />
                </div>
                <h3 className="font-syne text-base font-bold text-white mb-1">Reset All Data?</h3>
                <p className="text-xs text-[#5a5a6e] leading-relaxed">
                  This will permanently delete <span className="text-white font-semibold">{state.transactions.length} transactions</span>, reset all bank balances, and clear your budget data. This cannot be undone.
                </p>
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider block mb-1.5">
                  Type <span className="text-red-400 font-bold">RESET</span> to confirm
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Type RESET here"
                  className="w-full bg-[#1e1e28] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e]/50 outline-none focus:border-red-500/40 transition-colors text-center font-mono tracking-widest"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/[0.08]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    resetAll();
                    setResetModalOpen(false);
                    setResetConfirmText("");
                    showToast("All data has been reset 🔄");
                  }}
                  disabled={resetConfirmText !== "RESET"}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all ${
                    resetConfirmText === "RESET"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-red-500/20 text-red-400/50 cursor-not-allowed"
                  }`}
                >
                  Reset Everything
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
