"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/categories";
import { classifyExpense } from "@/lib/classifier";
import type { Transaction } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, "id" | "date">) => void;
}

type TxType = "expense" | "income";

export default function ExpenseDrawer({ onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [txType, setTxType] = useState<TxType>("expense");
  const [aiSuggest, setAiSuggest] = useState<Category | null>(null);
  const [error, setError] = useState("");

  const handleNameChange = useCallback((val: string) => {
    setName(val);
    const cat = classifyExpense(val);
    setAiSuggest(cat);
  }, []);

  const applyAiSuggest = () => {
    if (!aiSuggest) return;
    setSelectedCat(aiSuggest.id);
    setAiSuggest(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) { setError("Please enter a description."); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }
    const cat = selectedCat ?? aiSuggest?.id ?? "other";
    onSubmit({ name: name.trim(), amount: amt, category: cat, type: txType });
  };

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
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] bg-[#18181f] rounded-t-3xl border border-white/10 border-b-0"
        style={{ x: "-50%" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2 max-h-[88vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne text-lg font-bold text-white">Log Expense</h2>
            <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa]">
              <X size={16} />
            </motion.button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-[#ff4f6b]/10 border border-[#ff4f6b]/20 rounded-xl text-xs text-[#ff4f6b]">
              {error}
            </div>
          )}

          {/* Description */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Event / Description
            </label>
            <input
              className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-[15px] text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
              placeholder="e.g. Dinner at Ichiraku, Vercel Pro..."
              value={name}
              onChange={(e) => { handleNameChange(e.target.value); setError(""); }}
              autoFocus
            />

            {/* AI Suggest */}
            {aiSuggest && name.length > 2 && !selectedCat && (
              <motion.button
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={applyAiSuggest}
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border text-left w-full"
                style={{ background: "rgba(108,71,255,0.1)", borderColor: "rgba(108,71,255,0.25)" }}
              >
                <span className="text-sm">🤖</span>
                <span className="text-xs text-[#8b6fff]">AI suggests:</span>
                <span className="text-xs font-bold text-white bg-[#6c47ff] px-2 py-0.5 rounded-full">
                  {aiSuggest.emoji} {aiSuggest.name}
                </span>
                <span className="text-[11px] text-[#5a5a6e] ml-auto">Tap →</span>
              </motion.button>
            )}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-[15px] text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
              placeholder="0.00"
              min={0}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
            />
          </div>

          {/* Type */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">Type</label>
            <div className="flex gap-2">
              {(["expense", "income"] as TxType[]).map((t) => (
                <button key={t} onClick={() => setTxType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                    ${txType === t ? "bg-[#6c47ff]/20 border-[#8b6fff] text-[#8b6fff]" : "bg-[#1e1e28] border-white/10 text-[#9898aa]"}`}>
                  {t === "expense" ? "💸 Expense" : "💰 Income"}
                </button>
              ))}
            </div>
          </div>

          {/* Category Picker */}
          <div className="mb-6">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all
                    ${selectedCat === cat.id
                      ? "border-[#6c47ff] bg-[#6c47ff]/12"
                      : "bg-[#1e1e28] border-white/[0.06] hover:border-white/15"}`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[10px] text-[#9898aa] leading-tight">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl font-syne text-base font-bold text-white glow-accent transition-all"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
          >
            Add to Feed ✦
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
