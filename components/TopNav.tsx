"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, ChevronDown, User, LogOut } from "lucide-react";
import { formatMonthLabel } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMonthOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    if (monthOpen || profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [monthOpen, profileOpen]);

  const handleLogout = async () => {
    await signOut();
    setProfileOpen(false);
    router.push("/login");
  };

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

        {/* Profile Icon */}
        <div className="relative" ref={profileRef}>
          <motion.button
            onClick={() => setProfileOpen((value) => !value)}
            aria-label="Profile menu"
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            className="relative"
          >
            <motion.div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md profile-icon-glow"
              style={{
                background: "linear-gradient(135deg, #6c47ff 0%, #8b6fff 50%, #c147ff 100%)",
              }}
            >
              <div className="absolute inset-[-1.5px] rounded-full profile-ring-rotate opacity-50" />
              <User size={15} className="text-white relative z-10" strokeWidth={2.2} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141419]/95 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              >
                <div className="p-3 border-b border-white/[0.08]">
                  <p className="text-xs text-[#5a5a6e] font-semibold">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate mt-1">{user?.email || user?.displayName || "User"}</p>
                </div>
                
                <motion.button
                  type="button"
                  onClick={() => {
                    router.push("/profile");
                    setProfileOpen(false);
                  }}
                  whileHover={{ x: -2 }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-all duration-200 text-white"
                >
                  <User size={16} />
                  <span className="text-sm font-medium">Profile</span>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleLogout}
                  whileHover={{ x: -2 }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-all duration-200 text-red-400 border-t border-white/[0.08]"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-medium">Sign out</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
