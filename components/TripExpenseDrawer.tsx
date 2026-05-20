"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Check } from "lucide-react";
import type { TripMember, TripExpense } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";

interface Props {
  members: TripMember[];
  onClose: () => void;
  onSubmit: (expense: Omit<TripExpense, "id">) => void;
  initialExpense?: Omit<TripExpense, "id">;
}

export default function TripExpenseDrawer({ members, onClose, onSubmit, initialExpense }: Props) {
  const [description, setDescription] = useState(initialExpense?.description || "");
  const [amount, setAmount] = useState(initialExpense?.amount.toString() || "");
  const [date, setDate] = useState(initialExpense?.date || getTodayISO());
  const [paidBy, setPaidBy] = useState(initialExpense?.paidBy || members[0]?.id || "");
  const [splitAmong, setSplitAmong] = useState<string[]>(initialExpense?.splitAmong || members.map((m) => m.id));
  const [paidByOpen, setPaidByOpen] = useState(false);
  const [error, setError] = useState("");
  const paidByRef = useRef<HTMLDivElement>(null);

  const payer = members.find((m) => m.id === paidBy);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paidByRef.current && !paidByRef.current.contains(event.target as Node)) {
        setPaidByOpen(false);
      }
    };
    if (paidByOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [paidByOpen]);

  const toggleSplit = (memberId: string) => {
    setSplitAmong((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length <= 1) return prev; // Must have at least 1
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      setError("Add a description");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (splitAmong.length === 0) {
      setError("Select at least one person to split with");
      return;
    }
    onSubmit({
      description: description.trim(),
      amount: amt,
      paidBy,
      splitAmong,
      date,
    });
  };

  const perPerson = splitAmong.length > 0 ? parseFloat(amount || "0") / splitAmong.length : 0;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60"
        style={{ backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto flex flex-col rounded-2xl border border-white/[0.08] bg-[#18181f] p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne text-lg font-bold text-white">
            {initialExpense ? "Edit Expense" : "Add Expense"}
          </h2>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9898aa]"
          >
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
            What was it for?
          </label>
          <input
            className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff] transition-colors"
            placeholder="e.g. Dinner, Cab ride, Hotel..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError("");
            }}
          />
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
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
            Date
          </label>
          <input
            type="date"
            className="w-full bg-[#1e1e28] border border-white/10 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-[#8b6fff] transition-colors"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
            }}
          />
        </div>

        {/* Paid By */}
        <div className="mb-4 relative" ref={paidByRef}>
          <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
            Paid By
          </label>
          <motion.button
            type="button"
            onClick={() => setPaidByOpen((v) => !v)}
            whileTap={{ scale: 0.98 }}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
              paidByOpen
                ? "border-[#8b6fff]/60 bg-[#1e1e28] shadow-[0_0_20px_rgba(108,71,255,0.12)]"
                : "border-white/10 bg-[#1e1e28] hover:border-white/20"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#6c47ff]/15 flex items-center justify-center text-sm">
              {payer?.avatar}
            </div>
            <span className="flex-1 text-base text-white font-medium">
              {payer?.name || "Select person"}
            </span>
            <motion.div
              animate={{ rotate: paidByOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} className="text-[#5a5a6e]" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {paidByOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141419]/95 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              >
                {members.map((member) => {
                  const active = member.id === paidBy;
                  return (
                    <motion.button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setPaidBy(member.id);
                        setPaidByOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all ${
                        active
                          ? "bg-gradient-to-r from-[#6c47ff]/15 to-transparent border-l-2 border-[#8b6fff]"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#6c47ff]/10 flex items-center justify-center text-sm">
                        {member.avatar}
                      </div>
                      <span className="flex-1 text-sm font-semibold text-white">
                        {member.name}
                      </span>
                      {active && <Check size={16} className="text-[#8b6fff]" />}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Split Among */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase">
              Split Among
            </label>
            {amount && splitAmong.length > 0 && (
              <span className="text-[11px] font-bold text-[#8b6fff]">
                ₹{Math.round(parseFloat(amount) / splitAmong.length).toLocaleString()} each
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {members.map((member) => {
              const selected = splitAmong.includes(member.id);
              return (
                <motion.button
                  key={member.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSplitAmong((prev) => {
                      if (prev.includes(member.id)) {
                        if (prev.length <= 1) return prev;
                        return prev.filter((id) => id !== member.id);
                      }
                      return [...prev, member.id];
                    });
                  }}
                  type="button"
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                    selected
                      ? "border-[#6c47ff] bg-[#6c47ff]/12"
                      : "border-white/[0.06] bg-[#1e1e28] hover:border-white/15"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#252533] flex items-center justify-center text-sm">
                    {member.avatar}
                  </div>
                  <span className="text-xs font-semibold text-white truncate">
                    {member.name}
                  </span>
                  {selected && (
                    <Check size={12} className="text-[#8b6fff] ml-auto flex-shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ translateY: -1 }}
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl font-syne text-base font-bold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
        >
          {initialExpense ? "Update Expense" : "Add Expense"} 💰
        </motion.button>
        </motion.div>
      </div>
    </>
  );
}

