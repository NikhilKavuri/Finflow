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

export default function TopNav({ 
  currentMonth, 
  previousMonth, 
  selectedMonth, 
  onMonthChange,
}: Props) {
  const [monthOpen, setMonthOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMonthOpen(false);
      }
    };

    if (monthOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [monthOpen]);

  const months = [
    { value: currentMonth, label: formatMonthLabel(currentMonth), hint: "Editable" },
    { value: previousMonth, label: formatMonthLabel(previousMonth), hint: "View only" },
  ];
  const selected = months.find((month) => month.value === selectedMonth) ?? months[0];

  const selectMonth = (month: string) => {
    onMonthChange(month);
    setMonthOpen(false);
  };

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 glass-nav border-b border-white/[0.06] gap-3">
      <span className="font-syne text-xl font-black gradient-text flex-shrink-0">FinFlow</span>

      <div className="flex items-center gap-3 ml-auto">
        {/* Month Selector */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            type="button"
            onClick={() => setMonthOpen((value) => !value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex h-9 items-center justify-between gap-2 rounded-full border px-3 text-left outline-none transition-all duration-300 ${
              monthOpen
                ? "border-[#8b6fff]/60 bg-[#6c47ff]/10 shadow-[0_0_16px_rgba(108,71,255,0.15)]"
                : "border-white/10 bg-[#1e1e28] hover:border-white/20 hover:bg-[#252533]"
            }`}
            aria-label="Select month"
            aria-expanded={monthOpen}
          >
            <CalendarDays size={15} className="text-[#8b6fff] flex-shrink-0" />
            <span className="min-w-0 truncate text-xs font-semibold text-[#9898aa]">{selected.label}</span>
            <motion.div
              animate={{ rotate: monthOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronDown size={14} className="text-[#5a5a6e]" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {monthOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141419]/95 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              >
                {months.map((month) => {
                  const active = month.value === selectedMonth;
                  return (
                    <motion.button
                      key={month.value}
                      type="button"
                      onClick={() => selectMonth(month.value)}
                      whileHover={{ x: -2 }}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 ${
                        active 
                          ? "bg-gradient-to-r from-transparent to-[#6c47ff]/15 border-r-2 border-[#8b6fff]" 
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{month.label}</div>
                        <div className="text-[10px] font-semibold text-[#5a5a6e]">{month.hint}</div>
                      </div>
                      {active && <Check size={16} className="text-[#8b6fff]" />}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
