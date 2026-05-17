"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Trash2 } from "lucide-react";
import type { Transaction, Bank } from "@/lib/types";
import { getCategoryById, CATEGORIES } from "@/lib/categories";
import { formatINR, formatDate, groupByDate } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  banks: Bank[];
  editable?: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function ViewExpensesDrawer({
  transactions,
  banks,
  editable = true,
  onClose,
  onDelete,
  onClearAll,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = transactions;
    if (selectedCatFilter) {
      result = result.filter((t) => t.category === selectedCatFilter);
    }
    const trimmed = query.trim().toLowerCase();
    if (trimmed) {
      result = result.filter((t) => t.name.toLowerCase().includes(trimmed));
    }
    return result;
  }, [transactions, query, selectedCatFilter]);

  const groups = groupByDate(filtered);
  const dates = Object.keys(groups).sort((a, b) => (a > b ? -1 : 1));
  const totalExpenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  // Get unique categories from transactions
  const activeCats = useMemo(() => {
    const catIds = new Set(transactions.map((t) => t.category));
    return CATEGORIES.filter((c) => catIds.has(c.id));
  }, [transactions]);

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/60"
        style={{ backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
        style={{ x: "-50%", maxHeight: "90vh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-syne text-lg font-bold text-white">All Expenses</h2>
            <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa]">
              <X size={16} />
            </motion.button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="px-3 py-2 rounded-xl bg-[#ff4f6b]/10 border border-[#ff4f6b]/15">
              <div className="text-[10px] font-semibold text-[#ff4f6b]/60 uppercase tracking-wider">Spent</div>
              <div className="font-syne text-base font-bold text-[#ff4f6b]">{formatINR(totalExpenses)}</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#2ce88a]/10 border border-[#2ce88a]/15">
              <div className="text-[10px] font-semibold text-[#2ce88a]/60 uppercase tracking-wider">Income</div>
              <div className="font-syne text-base font-bold text-[#2ce88a]">{formatINR(totalIncome)}</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6e]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#1e1e28] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]/40 transition-colors"
              placeholder="Search expenses..."
            />
          </div>

          {/* Category chips */}
          {activeCats.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => setSelectedCatFilter(null)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 border transition-all ${
                  !selectedCatFilter
                    ? "border-[#8b6fff]/40 bg-[#6c47ff]/15 text-[#8b6fff]"
                    : "border-white/[0.06] bg-[#1e1e28] text-[#5a5a6e]"
                }`}
              >
                All
              </button>
              {activeCats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatFilter(selectedCatFilter === cat.id ? null : cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 border transition-all ${
                    selectedCatFilter === cat.id
                      ? "border-[#8b6fff]/40 bg-[#6c47ff]/15 text-[#8b6fff]"
                      : "border-white/[0.06] bg-[#1e1e28] text-[#5a5a6e]"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">🧾</div>
              <p className="text-sm text-[#5a5a6e]">
                {query || selectedCatFilter ? "No matching transactions" : "No transactions yet"}
              </p>
            </div>
          ) : (
            <>
              {editable && filtered.length > 0 && (
                <div className="flex justify-end mb-2">
                  <button onClick={onClearAll} className="text-[10px] text-[#5a5a6e] hover:text-[#ff4f6b] transition-colors">
                    Clear All
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-0">
                {dates.map((date) => (
                  <div key={date}>
                    <div className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase py-2">
                      {formatDate(date)}
                    </div>
                    <div className="flex flex-col gap-1">
                      {groups[date].map((tx, i) => {
                        const cat = getCategoryById(tx.category);
                        const bank = banks.find((b) => b.id === tx.bankId);
                        return (
                          <motion.div
                            key={tx.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.02 }}
                            className="group flex items-center gap-2 px-3 py-2.5 bg-[#1e1e28] border border-white/[0.06] rounded-xl hover:bg-[#252533] transition-all"
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                              style={{ background: cat.color + "22" }}>
                              {cat.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium text-white truncate">{tx.name}</div>
                              <div className="text-[10px] text-[#5a5a6e] mt-0.5 flex items-center gap-1.5">
                                <span>{cat.name}</span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#6c47ff]/15 text-[9px] font-semibold text-[#8b6fff]">
                                  🏦 {bank?.name || "Bank"}
                                </span>
                              </div>
                            </div>
                            <div className={`font-syne text-sm font-bold flex-shrink-0 ${tx.type === "income" ? "text-[#2ce88a]" : "text-[#ff4f6b]"}`}>
                              {tx.type === "income" ? "+" : "-"}{formatINR(tx.amount)}
                            </div>
                            {editable && (
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => onDelete(tx.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 w-6 h-6 rounded-lg flex items-center justify-center text-[#ff4f6b]"
                                style={{ background: "rgba(255,79,107,0.1)" }}
                              >
                                <Trash2 size={11} />
                              </motion.button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
