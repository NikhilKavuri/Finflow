"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, X, ChevronLeft, ChevronRight, Plus, Trash2, Check, ChevronDown } from "lucide-react";
import type { TripMember, TripExpense } from "@/lib/types";
import { formatDate, formatMonthLabel, getCurrentMonthPrefix, getDaysInMonth, getTodayISO } from "@/lib/utils";

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
  const [displayedMonth, setDisplayedMonth] = useState((initialExpense?.date || getTodayISO()).slice(0, 7));
  const [contributors, setContributors] = useState<{ memberId: string; amount: string }[]>(() => {
    const initialAmount = initialExpense?.amount?.toString() || "";
    if (initialExpense?.contributors && initialExpense.contributors.length > 0) {
      return initialExpense.contributors.map((c) => ({
        memberId: c.memberId,
        amount: c.amount.toString(),
      }));
    }
    const fallbackMember = initialExpense?.paidBy || members[0]?.id || "";
    return [{ memberId: fallbackMember, amount: initialAmount }];
  });
  const [splitAmong, setSplitAmong] = useState<string[]>(initialExpense?.splitAmong || members.map((m) => m.id));
  const [error, setError] = useState("");
  const [contributorPickerOpenIdx, setContributorPickerOpenIdx] = useState<number | null>(null);
  const contributorPickerRootRef = useRef<HTMLDivElement>(null);
  const today = getTodayISO();
  const currentMonth = getCurrentMonthPrefix();
  const currentDay = Number(today.slice(8, 10));
  const selectedDay = Number(date.slice(8, 10));
  const daysInDisplayedMonth = getDaysInMonth(displayedMonth);
  const selectableDayCount = displayedMonth === currentMonth ? currentDay : daysInDisplayedMonth;
  const monthDays = Array.from({ length: selectableDayCount }, (_, index) => selectableDayCount - index);
  const canGoNextMonth = displayedMonth < currentMonth;

  const contributorTotal = contributors.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const contributorsValid =
    contributors.length > 0 &&
    contributors.every((c) => c.memberId && (parseFloat(c.amount) || 0) > 0) &&
    new Set(contributors.map((c) => c.memberId)).size === contributors.length;

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

  useEffect(() => {
    if (!initialExpense) return;
    // If members list changes and a contributor disappears, keep the row but blank the memberId.
    setContributors((prev) =>
      prev.map((c) => (members.some((m) => m.id === c.memberId) ? c : { ...c, memberId: "" }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

  useEffect(() => {
    if (contributorPickerOpenIdx === null) return;
    const handleClickOutside = (event: MouseEvent) => {
      const root = contributorPickerRootRef.current;
      if (!root) return;
      const target = event.target as Node;
      if (root.contains(target)) return;
      setContributorPickerOpenIdx(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contributorPickerOpenIdx]);

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
    if (!contributorsValid) {
      setError("Add contributors with unique people and valid amounts");
      return;
    }
    const roundedContrib = Math.round(contributorTotal * 100) / 100;
    const roundedAmt = Math.round(amt * 100) / 100;
    if (Math.abs(roundedContrib - roundedAmt) > 0.01) {
      setError("Contributions must add up to the expense amount");
      return;
    }
    if (splitAmong.length === 0) {
      setError("Select at least one person to split with");
      return;
    }

    const contributorsPayload = contributors.map((c) => ({
      memberId: c.memberId,
      amount: parseFloat(c.amount),
    }));
    const paidBy = contributorsPayload[0]?.memberId || members[0]?.id || "";
    onSubmit({
      description: description.trim(),
      amount: amt,
      paidBy,
      contributors: contributorsPayload,
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
          <div className="rounded-2xl border border-white/[0.06] bg-[#1e1e28] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#6c47ff]/15 text-[#8b6fff]">
                  <CalendarDays size={17} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{formatDate(date)}</div>
                  <div className="truncate text-[11px] font-semibold text-[#5a5a6e]">
                    {formatMonthLabel(displayedMonth)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
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
                const active = date === value || (date.startsWith(displayedMonth) && day === selectedDay);
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

        {/* Paid By */}
        <div className="mb-4" ref={contributorPickerRootRef}>
          <label className="block text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-2">
            Contributors
          </label>

          <div className="space-y-2">
            {contributors.map((c, idx) => {
              const selectedMember = members.find((m) => m.id === c.memberId);
              const pickerOpen = contributorPickerOpenIdx === idx;
              return (
                <div
                  key={`${idx}-${c.memberId}`}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-[#1e1e28] px-3 py-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#252533] flex items-center justify-center text-sm flex-shrink-0">
                    {selectedMember?.avatar || "👤"}
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <motion.button
                      type="button"
                      onClick={() => setContributorPickerOpenIdx((v) => (v === idx ? null : idx))}
                      whileTap={{ scale: 0.98 }}
                      title={!pickerOpen ? selectedMember?.name : undefined}
                      className={`flex w-full min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all duration-300 ${
                        pickerOpen
                          ? "border-[#8b6fff]/60 bg-[#1e1e28] shadow-[0_0_20px_rgba(108,71,255,0.12)]"
                          : "border-white/10 bg-[#1e1e28] hover:border-white/20"
                      }`}
                    >
                      <span
                        className={`min-w-0 flex-1 text-sm text-white font-semibold ${
                          pickerOpen ? "whitespace-normal break-words" : "truncate"
                        }`}
                      >
                        {selectedMember?.name || "Select person"}
                      </span>
                      <motion.div
                        className="flex-shrink-0"
                        animate={{ rotate: pickerOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} className="text-[#5a5a6e]" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {pickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#141419]/95 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                        >
                          {members.map((member) => {
                            const active = member.id === c.memberId;
                            const alreadyPickedByOtherRow = contributors.some(
                              (row, rowIdx) => rowIdx !== idx && row.memberId === member.id
                            );
                            const disabled = alreadyPickedByOtherRow;
                            return (
                              <motion.button
                                key={member.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (disabled) return;
                                  setContributors((prev) =>
                                    prev.map((row, i) => (i === idx ? { ...row, memberId: member.id } : row))
                                  );
                                  setContributorPickerOpenIdx(null);
                                  setError("");
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all ${
                                  active
                                    ? "bg-gradient-to-r from-[#6c47ff]/15 to-transparent border-l-2 border-[#8b6fff]"
                                    : disabled
                                      ? "opacity-40 cursor-not-allowed"
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

                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="₹0"
                    value={c.amount}
                    onChange={(e) => {
                      setContributors((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, amount: e.target.value } : row))
                      );
                      setError("");
                    }}
                    className="w-24 flex-shrink-0 bg-[#141419] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-[#8b6fff]"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    disabled={contributors.length <= 1}
                    onClick={() => {
                      if (contributors.length <= 1) return;
                      setContributors((prev) => prev.filter((_, i) => i !== idx));
                      setContributorPickerOpenIdx((open) => (open === idx ? null : open));
                      setError("");
                    }}
                    className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-[#9898aa] disabled:opacity-40"
                    title="Remove contributor"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              );
            })}

            <div className="flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => {
                  const remaining = members.find((m) => !contributors.some((c) => c.memberId === m.id))?.id || "";
                  setContributors((prev) => [...prev, { memberId: remaining, amount: "" }]);
                  setError("");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} className="text-[#8b6fff]" />
                Add contributor
              </motion.button>

              {amount && (
                <span
                  className={`text-[11px] font-bold ${
                    Math.abs((parseFloat(amount) || 0) - contributorTotal) <= 0.01
                      ? "text-[#2ce88a]"
                      : "text-[#facc15]"
                  }`}
                >
                  Contributed: ₹{Math.round(contributorTotal).toLocaleString()} / ₹
                  {Math.round(parseFloat(amount || "0")).toLocaleString()}
                </span>
              )}
            </div>
          </div>
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
