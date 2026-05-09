"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, X } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/categories";
import { classifyExpense } from "@/lib/classifier";
import type { Transaction } from "@/lib/types";
import { formatDate, formatMonthLabel, getCurrentMonthPrefix, getTodayISO } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, "id">) => void;
}

type TxType = "expense" | "income";

export default function ExpenseDrawer({ onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [txType, setTxType] = useState<TxType>("expense");
  const [aiSuggest, setAiSuggest] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const currentMonth = getCurrentMonthPrefix();
  const today = getTodayISO();
  const currentDay = Number(today.slice(8, 10));
  const selectedDay = Number(date.slice(8, 10));
  const monthDays = Array.from({ length: currentDay }, (_, index) => index + 1);

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;

    const syncViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--visual-viewport-height", `${height}px`);
    };

    syncViewportHeight();
    document.body.style.overflow = "hidden";
    window.visualViewport?.addEventListener("resize", syncViewportHeight);
    window.visualViewport?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);

    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.removeProperty("--visual-viewport-height");
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      window.visualViewport?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
    };
  }, []);

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
    if (!date.startsWith(currentMonth)) { setError("Only the current month can be edited."); return; }
    const cat = selectedCat ?? aiSuggest?.id ?? "other";
    onSubmit({ name: name.trim(), amount: amt, category: cat, type: txType, date });
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
        className="keyboard-panel fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]"
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
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
              className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
              placeholder="e.g. Lunch, groceries, rent..."
              value={name}
              onChange={(e) => { handleNameChange(e.target.value); setError(""); }}
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

          {/* Date */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Date
            </label>
            <div className="rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#6c47ff]/15 text-[#8b6fff]">
                    <CalendarDays size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{formatDate(date)}</div>
                    <div className="truncate text-[11px] font-semibold text-[#5a5a6e]">
                      {formatMonthLabel(currentMonth)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDate(today);
                    setError("");
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[#9898aa] transition-colors hover:text-white"
                >
                  Today
                </button>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {monthDays.map((day) => {
                  const value = `${currentMonth}-${String(day).padStart(2, "0")}`;
                  const active = day === selectedDay;
                  const weekday = new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
                    weekday: "short",
                  });

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setDate(value);
                        setError("");
                      }}
                      className={`flex h-16 w-12 flex-shrink-0 flex-col items-center justify-center rounded-2xl border transition-colors ${
                        active
                          ? "border-[#8b6fff] bg-[#6c47ff]/20 text-white"
                          : "border-white/[0.06] bg-[#252533] text-[#9898aa]"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase text-[#5a5a6e]">{weekday}</span>
                      <span className="font-syne text-lg font-black">{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
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
