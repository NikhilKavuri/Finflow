"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, X, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/categories";
import { classifyExpense } from "@/lib/classifier";
import type { Transaction, Bank, PaymentMethodConfig } from "@/lib/types";
import { formatDate, formatMonthLabel, getCurrentMonthPrefix, getDaysInMonth, getTodayISO } from "@/lib/utils";
import { useMobileDrawerViewport } from "@/hooks/useMobileDrawerViewport";
import InlineCalculator from "./InlineCalculator";

interface Props {
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, "id">) => void;
  onEdit?: (id: string, data: Partial<Omit<Transaction, "id">>) => void;
  banks: Bank[];
  paymentMethods: PaymentMethodConfig[];
  editingTransaction?: Transaction | null;
  /** Sub-expense inside a category group — same fields, different chrome. */
  variant?: "default" | "sub";
  drawerTitle?: string;
  defaultCategory?: string;
}

type TxType = "expense" | "income";

export default function ExpenseDrawer({
  onClose,
  onSubmit,
  onEdit,
  banks,
  paymentMethods,
  editingTransaction,
  variant = "default",
  drawerTitle,
  defaultCategory,
}: Props) {
  const isEditing = !!editingTransaction;
  const isSub = variant === "sub";

  const [name, setName] = useState(editingTransaction?.name || "");
  const [amount, setAmount] = useState(editingTransaction ? String(editingTransaction.amount) : "");
  const [date, setDate] = useState(editingTransaction?.date || getTodayISO());
  const [displayedMonth, setDisplayedMonth] = useState((editingTransaction?.date || getTodayISO()).slice(0, 7));
  const [selectedCat, setSelectedCat] = useState<string | null>(
    editingTransaction?.category || defaultCategory || null
  );
  const [txType, setTxType] = useState<TxType>(editingTransaction?.type || "expense");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(
    editingTransaction?.paymentMethodId || paymentMethods[0]?.id || ""
  );
  const [selectedBankId, setSelectedBankId] = useState<string>(
    editingTransaction?.bankId || banks[0]?.id || "default"
  );
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);
  const [aiSuggest, setAiSuggest] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const currentMonth = getCurrentMonthPrefix();
  const today = getTodayISO();
  const currentDay = Number(today.slice(8, 10));
  const selectedDay = Number(date.slice(8, 10));
  const daysInDisplayedMonth = getDaysInMonth(displayedMonth);
  const selectableDayCount = displayedMonth === currentMonth ? currentDay : daysInDisplayedMonth;
  const monthDays = Array.from({ length: selectableDayCount }, (_, index) => selectableDayCount - index);
  const canGoNextMonth = displayedMonth < currentMonth;

  const selectedBank = banks.find((b) => b.id === selectedBankId) ?? banks[0];
  const selectedPaymentMethod = paymentMethods.find((p) => p.id === selectedPaymentMethodId);

  // Get card billing info for the selected date
  const getCardStatusMessage = () => {
    if (selectedPaymentMethod?.type !== "credit_card") return null;
    const card = selectedPaymentMethod;
    const cycleStart = card.billingCycleStart ?? 15;
    const payDay = card.paymentDueDay ?? 5;
    const txDay = selectedDay;

    // Check if in reserved period
    let isReserved = false;
    if (payDay < cycleStart) {
      isReserved = txDay > cycleStart || txDay <= payDay;
    } else {
      isReserved = txDay > cycleStart && txDay <= payDay;
    }

    if (isReserved) {
      return {
        type: "reserved" as const,
        message: `Reserved — after billing cycle (day ${cycleStart}), before pay date (day ${payDay}). This will be deducted from your bank.`,
        color: "#ff6b35",
      };
    }

    return {
      type: "bill" as const,
      message: `Card bill — within billing cycle (starting day ${cycleStart}). Will appear on your card statement, due on day ${payDay}.`,
      color: "#ffb830",
    };
  };

  const cardStatus = getCardStatusMessage();

  const shiftMonth = (delta: number) => {
    const [year, month] = displayedMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    if (nextMonth > currentMonth) return;
    setDisplayedMonth(nextMonth);

    if (!date.startsWith(nextMonth)) {
      const day = Math.min(Number(date.slice(8, 10)), nextMonth === currentMonth ? currentDay : getDaysInMonth(nextMonth));
      setDate(`${nextMonth}-${String(day).padStart(2, "0")}`);
    }
  };

  useMobileDrawerViewport(true);

  // Close bank dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
        setBankDropdownOpen(false);
      }
    };
    if (bankDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [bankDropdownOpen]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.some((pm) => pm.id === selectedPaymentMethodId)) {
      setSelectedPaymentMethodId(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethodId]);

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
    const pm = paymentMethods.find((p) => p.id === selectedPaymentMethodId);

    const txData = {
      name: name.trim(),
      amount: amt,
      category: cat,
      type: txType,
      date,
      bankId: selectedBankId,
      paymentMethod: pm?.type || "other",
      paymentMethodId: pm?.id,
    };

    if (isEditing && editingTransaction && onEdit) {
      onEdit(editingTransaction.id, txData);
    } else {
      onSubmit(txData);
    }
  };

  const overlayZ = isSub ? "z-[60]" : "z-40";
  const panelZ = isSub ? "z-[70]" : "z-50";

  return (
    <>
      {/* Overlay */}
      <motion.div
        className={`fixed inset-0 ${overlayZ} bg-black/60`}
        style={{ backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className={`keyboard-panel fixed left-1/2 ${panelZ} flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#18181f]`}
        style={{ x: "-50%", bottom: "var(--keyboard-offset, 0)" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2 sm:px-5">
          <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
            <h2 className="truncate font-syne text-base font-bold text-white sm:text-lg">
              {drawerTitle ?? (isEditing ? "Edit Expense" : isSub ? "Add Sub-Expense" : "Log Expense")}
            </h2>
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
              <div className="mb-3 flex flex-col gap-2.5 sm:mb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#6c47ff]/15 text-[#8b6fff] sm:h-9 sm:w-9">
                    <CalendarDays size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{formatDate(date)}</div>
                    <div className="truncate text-[11px] font-semibold text-[#5a5a6e]">
                      {formatMonthLabel(displayedMonth)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#9898aa] transition-colors hover:text-white"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    disabled={!canGoNextMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#9898aa] transition-colors hover:text-white disabled:opacity-35"
                  >
                    <ChevronRight size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayedMonth(currentMonth);
                      setDate(today);
                      setError("");
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[#9898aa] transition-colors hover:text-white"
                  >
                    Today
                  </button>
                </div>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {monthDays.map((day) => {
                  const value = `${displayedMonth}-${String(day).padStart(2, "0")}`;
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
                      className={`flex h-14 w-11 flex-shrink-0 flex-col items-center justify-center rounded-2xl border transition-colors sm:h-16 sm:w-12 ${
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
            {/* Inline Calculator */}
            <InlineCalculator
              currentValue={amount}
              onResult={(val) => {
                setAmount(String(val));
                setError("");
              }}
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

          {/* Payment Method */}
          {paymentMethods.length > 0 && (
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">Payment Method</label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {paymentMethods.map((pm) => (
                <button key={pm.id} onClick={() => setSelectedPaymentMethodId(pm.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all
                    ${selectedPaymentMethodId === pm.id ? "bg-[#6c47ff]/20 border-[#8b6fff] text-[#8b6fff]" : "bg-[#1e1e28] border-white/10 text-[#9898aa]"}`}>
                  <span className="text-sm">{pm.emoji}</span>
                  {pm.name}
                </button>
              ))}
            </div>
            {/* Card status banner */}
            {cardStatus && (
              <div
                className="mt-2 rounded-xl px-3 py-2 border"
                style={{
                  borderColor: `${cardStatus.color}33`,
                  background: `${cardStatus.color}15`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs">
                    {cardStatus.type === "reserved" ? "🔒" : "💳"}
                  </span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: cardStatus.color }}
                  >
                    {cardStatus.type === "reserved" ? "Reserved from Bank" : "Card Bill"}
                  </span>
                </div>
                <div className="text-[10px] leading-relaxed text-[#9898aa]">
                  {cardStatus.message}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Bank - Custom Dropdown */}
          <div className="mb-4 relative" ref={bankDropdownRef}>
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">Bank Account</label>
            <motion.button
              type="button"
              onClick={() => setBankDropdownOpen((v) => !v)}
              whileTap={{ scale: 0.98 }}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                bankDropdownOpen
                  ? "border-[#8b6fff]/60 bg-[#1e1e28] shadow-[0_0_20px_rgba(108,71,255,0.12)] ring-2 ring-[#6c47ff]/20"
                  : "border-white/10 bg-[#1e1e28] hover:border-white/20"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6c47ff]/15 text-sm flex-shrink-0">
                🏦
              </div>
              <span className="flex-1 text-base text-white font-medium truncate">{selectedBank?.name}</span>
              <motion.div
                animate={{ rotate: bankDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <ChevronDown size={18} className="text-[#5a5a6e]" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {bankDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141419]/95 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                >
                  {banks.map((bank, i) => {
                    const active = bank.id === selectedBankId;
                    return (
                      <motion.button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setSelectedBankId(bank.id);
                          setBankDropdownOpen(false);
                        }}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.12, delay: i * 0.03 }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
                          active
                            ? "bg-gradient-to-r from-[#6c47ff]/15 to-transparent border-l-2 border-[#8b6fff]"
                            : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6c47ff]/10 text-sm">
                          🏦
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{bank.name}</div>
                          {bank.balance !== undefined && (
                            <div className="text-[10px] font-medium text-[#5a5a6e]">₹{bank.balance.toLocaleString()}</div>
                          )}
                        </div>
                        {active && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          >
                            <Check size={16} className="text-[#8b6fff]" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category Picker */}
          <div className="mb-6">
            <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">Category</label>
            <div className="grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 sm:max-h-52 sm:gap-2 sm:pr-1">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all sm:gap-1.5 sm:p-3
                    ${selectedCat === cat.id
                      ? "border-[#6c47ff] bg-[#6c47ff]/12"
                      : "bg-[#1e1e28] border-white/[0.06] hover:border-white/15"}`}
                >
                  <span className="text-lg sm:text-xl">{cat.emoji}</span>
                  <span className="line-clamp-2 text-[9px] leading-tight text-[#9898aa] sm:text-[10px]">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ translateY: -1 }}
            onClick={handleSubmit}
            className="w-full rounded-2xl py-3.5 font-syne text-sm font-bold text-white glow-accent transition-all sm:py-4 sm:text-base"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
          >
            {isEditing ? "Save Changes ✦" : isSub ? "Add to Group ✦" : "Add to Feed ✦"}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
