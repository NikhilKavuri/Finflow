"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transaction } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import { formatINR } from "@/lib/utils";

interface Props {
  expenses: Transaction[];
  selectedCategoryId?: string | null;
  onCategorySelect?: (id: string) => void;
}

export default function CategoryBreakdown({ expenses, selectedCategoryId, onCategorySelect }: Props) {
  const [showAll, setShowAll] = useState(false);

  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([id, amount]) => ({ id, amount, cat: getCategoryById(id) }));
  }, [expenses]);

  const totalAmount = catData.reduce((sum, item) => sum + item.amount, 0) || 1;
  const maxAmt = Math.max(...catData.map((item) => item.amount), 1);
  const displayed = showAll ? catData : catData.slice(0, 5);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-syne text-[15px] font-bold text-white">Category Breakdown</h2>
          <p className="text-[11px] text-[#8b6fff] mt-1">Tap a category to open its spend feed.</p>
        </div>
        {catData.length > 5 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-[#8b6fff] font-semibold"
          >
            {showAll ? "Show Less" : "Show All"}
          </button>
        )}
      </div>

      {catData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-syne text-sm font-bold text-white">No expenses yet</p>
          <p className="text-xs text-[#5a5a6e] mt-1">Add your first expense to see breakdown</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {displayed.map(({ id, amount, cat }, i) => {
              const barW = Math.round((amount / maxAmt) * 100);
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                    selectedCategoryId === id ? "border-white/[0.16] bg-white/[0.03]" : "bg-[#1e1e28] border-white/[0.06]"
                  } ${onCategorySelect ? "cursor-pointer hover:bg-white/[0.04]" : ""}`}
                  onClick={() => onCategorySelect?.(id)}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: cat.color + "22" }}>
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-white mb-1">{cat.name}</div>
                    <div className="h-[4px] bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: cat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: barW + "%" }}
                        transition={{ duration: 0.9, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                      />
                    </div>
                    <div className="text-[11px] text-[#8b6fff] mt-1">
                      {Math.round((amount / totalAmount) * 100)}% of expenses
                    </div>
                  </div>
                  <div className="font-syne text-[13px] font-bold flex-shrink-0" style={{ color: cat.color }}>
                    {formatINR(amount)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
