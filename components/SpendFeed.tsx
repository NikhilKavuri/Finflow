"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { Transaction, Bank } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import { formatINR, formatDate, groupByDate } from "@/lib/utils";

interface Props {
  editable?: boolean;
  transactions: Transaction[];
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  banks: Bank[];
}

export default function SpendFeed({
  editable = true,
  transactions,
  title,
  searchable = false,
  searchPlaceholder,
  onDelete,
  onClearAll,
  banks,
}: Props) {
  const [query, setQuery] = useState("");
  const filteredTransactions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return transactions;
    return transactions.filter((tx) => tx.name.toLowerCase().includes(trimmed));
  }, [query, transactions]);

  const groups = groupByDate(filteredTransactions);
  const dates = Object.keys(groups).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-syne text-[15px] font-bold text-white">{title ?? "Spend Feed"}</h2>
          {searchable && (
            <p className="text-[11px] text-[#8b6fff] mt-1">
              Filter this category's expenses by name.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {editable && filteredTransactions.length > 0 && (
            <button onClick={onClearAll} className="text-[10px] text-[#5a5a6e] hover:text-[#ff4f6b] transition-colors">
              Clear All
            </button>
          )}
        </div>
      </div>

      {searchable && (
        <div className="mb-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#1e1e28] px-3 py-2.5 text-sm text-white placeholder:text-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
            placeholder={searchPlaceholder ?? "Search expenses..."}
          />
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🧾</div>
          <p className="font-syne text-sm font-bold text-white">No expenses</p>
          <p className="text-xs text-[#5a5a6e] mt-1">
            {query ? "No matching expenses found" : "Tap + to log your first expense"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          <AnimatePresence>
            {dates.map((date) => (
              <div key={date}>
                <div className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase py-1.5">
                  {formatDate(date)}
                </div>
                <div className="flex flex-col gap-1">
                  {groups[date].map((tx, i) => (
                    <TxItem key={tx.id} editable={editable} tx={tx} index={i} onDelete={onDelete} banks={banks} />
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

function TxItem({
  editable,
  tx,
  index,
  onDelete,
  banks,
}: {
  editable: boolean;
  tx: Transaction;
  index: number;
  onDelete: (id: string) => void;
  banks: Bank[];
}) {
  const cat = getCategoryById(tx.category);
  const bank = banks.find((b) => b.id === tx.bankId);
  const bankName = bank?.name || "Bank";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group flex items-center gap-2 px-3 py-2.5 bg-[#1e1e28] border border-white/[0.06] rounded-xl hover:bg-[#252533] hover:border-white/10 transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: cat.color + "22" }}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-white truncate">{tx.name}</div>
        <div className="text-[11px] text-[#5a5a6e] mt-0.5 flex items-center gap-1.5">
          <span>{cat.name}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6c47ff]/15 text-[10px] font-semibold text-[#8b6fff]">🏦 {bankName}</span>
        </div>
      </div>
      <div className={`font-syne text-[15px] font-bold flex-shrink-0 ${tx.type === "income" ? "text-[#2ce88a]" : "text-[#ff4f6b]"}`}>
        {tx.type === "income" ? "+" : "-"}{formatINR(tx.amount)}
      </div>
      {editable && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onDelete(tx.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-[#ff4f6b]"
          style={{ background: "rgba(255,79,107,0.1)" }}
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </motion.button>
      )}
    </motion.div>
  );
}
