"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import { formatINR, formatDate, groupByDate } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function SpendFeed({ transactions, onDelete, onClearAll }: Props) {
  const groups = groupByDate(transactions);
  const dates = Object.keys(groups).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-syne text-[15px] font-bold text-white">Spend Feed</h2>
        {transactions.length > 0 && (
          <button onClick={onClearAll} className="text-xs text-[#5a5a6e] hover:text-[#ff4f6b] transition-colors">
            Clear All
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🧾</div>
          <p className="font-syne text-sm font-bold text-white">No transactions</p>
          <p className="text-xs text-[#5a5a6e] mt-1">Tap + to log your first expense</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          <AnimatePresence>
            {dates.map((date) => (
              <div key={date}>
                <div className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase py-2">
                  {formatDate(date)}
                </div>
                <div className="flex flex-col gap-1.5">
                  {groups[date].map((tx, i) => (
                    <TxItem key={tx.id} tx={tx} index={i} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TxItem({ tx, index, onDelete }: { tx: Transaction; index: number; onDelete: (id: string) => void }) {
  const cat = getCategoryById(tx.category);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group flex items-center gap-3 px-3 py-3 bg-[#1e1e28] border border-white/[0.06] rounded-xl hover:bg-[#252533] hover:border-white/10 transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: cat.color + "22" }}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-white truncate">{tx.name}</div>
        <div className="text-[11px] text-[#5a5a6e] mt-0.5">{cat.name}</div>
      </div>
      <div className={`font-syne text-[15px] font-bold flex-shrink-0 ${tx.type === "income" ? "text-[#2ce88a]" : "text-[#ff4f6b]"}`}>
        {tx.type === "income" ? "+" : "-"}{formatINR(tx.amount)}
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onDelete(tx.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-[#ff4f6b]"
        style={{ background: "rgba(255,79,107,0.1)" }}
        aria-label="Delete"
      >
        <Trash2 size={13} />
      </motion.button>
    </motion.div>
  );
}
