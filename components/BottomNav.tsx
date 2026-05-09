"use client";

import { Home, BarChart2, PlusCircle, Target, User } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  const items = [
    { icon: Home, label: "Home", active: true, onClick: () => {} },
    { icon: BarChart2, label: "Analytics", active: false, onClick: () => {} },
    { icon: PlusCircle, label: "Add", active: false, onClick: onAddClick },
    { icon: Target, label: "Goals", active: false, onClick: () => {} },
    { icon: User, label: "Profile", active: false, onClick: () => {} },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[480px] glass-nav border-t border-white/[0.06] flex items-center justify-around py-2 pb-safe">
      {items.map(({ icon: Icon, label, active, onClick }) => (
        <motion.button
          key={label}
          whileTap={{ scale: 0.88 }}
          onClick={onClick}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
        >
          <Icon
            size={20}
            className={active ? "text-[#8b6fff]" : "text-[#5a5a6e]"}
            strokeWidth={active ? 2.5 : 1.8}
          />
          <span className={`text-[10px] font-semibold ${active ? "text-[#8b6fff]" : "text-[#5a5a6e]"}`}>
            {label}
          </span>
        </motion.button>
      ))}
    </nav>
  );
}
