"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { formatMonthLabel } from "@/lib/utils";

interface Props {
  currentMonth: string;
  previousMonth: string;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export default function TopNav({ currentMonth, previousMonth, selectedMonth, onMonthChange }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);
  const months = [
    { value: currentMonth, label: formatMonthLabel(currentMonth), hint: "Editable" },
    { value: previousMonth, label: formatMonthLabel(previousMonth), hint: "View only" },
  ];
  const selected = months.find((month) => month.value === selectedMonth) ?? months[0];

  const selectMonth = (month: string) => {
    onMonthChange(month);
    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 glass-nav border-b border-white/[0.06]">
      <span className="font-syne text-xl font-black gradient-text">FinFlow</span>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-9 min-w-[148px] items-center justify-between gap-2 rounded-full border border-white/10 bg-[#1e1e28] px-3 text-left text-[#9898aa] outline-none transition-colors focus:border-[#8b6fff]"
          aria-label="Select month"
          aria-expanded={open}
        >
          <CalendarDays size={15} className="text-[#8b6fff]" />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold">{selected.label}</span>
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#18181f] shadow-2xl"
            >
              {months.map((month) => {
                const active = month.value === selectedMonth;
                return (
                  <button
                    key={month.value}
                    type="button"
                    onClick={() => selectMonth(month.value)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                      active ? "bg-[#6c47ff]/15" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{month.label}</div>
                      <div className="text-[11px] font-semibold text-[#5a5a6e]">{month.hint}</div>
                    </div>
                    {active && <Check size={16} className="text-[#8b6fff]" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #6c47ff, #c147ff)" }}>
        HY
      </div>
    </nav>
  );
}
