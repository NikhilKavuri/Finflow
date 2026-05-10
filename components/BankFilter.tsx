"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import type { Bank } from "@/lib/types";

interface Props {
  banks: Bank[];
  selectedBankId: string;
  onBankChange: (bankId: string) => void;
}

export default function BankFilter({ banks, selectedBankId, onBankChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active chip
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const chip = activeRef.current;
      const chipLeft = chip.offsetLeft;
      const chipWidth = chip.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;

      if (chipLeft < scrollLeft || chipLeft + chipWidth > scrollLeft + containerWidth) {
        container.scrollTo({
          left: chipLeft - containerWidth / 2 + chipWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [selectedBankId]);

  const isAllBanks = selectedBankId === "all";

  const allBanksOptions = [
    { id: "all", name: "All Banks", isAll: true },
    ...banks.map((b) => ({ ...b, isAll: false })),
  ];

  return (
    <div className="px-4 pt-3 pb-1">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {allBanksOptions.map((bank) => {
          const active = bank.id === selectedBankId;
          return (
            <motion.button
              key={bank.id}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => onBankChange(bank.id)}
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.04 }}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-300 ${
                active
                  ? bank.isAll
                    ? "border-[#b8ff57]/40 bg-[#b8ff57]/12 text-[#b8ff57] shadow-[0_0_16px_rgba(184,255,87,0.1)]"
                    : "border-[#8b6fff]/40 bg-[#6c47ff]/15 text-[#8b6fff] shadow-[0_0_16px_rgba(108,71,255,0.12)]"
                  : "border-white/[0.08] bg-[#1e1e28]/80 text-[#7a7a8e] hover:border-white/15 hover:text-[#9898aa]"
              }`}
            >
              {bank.isAll ? (
                <Layers size={13} className={active ? "text-[#b8ff57]" : "text-[#5a5a6e]"} />
              ) : (
                <span className="text-[11px]">🏦</span>
              )}
              <span>{bank.name}</span>
              {active && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-1.5 h-1.5 rounded-full ${bank.isAll ? "bg-[#b8ff57]" : "bg-[#8b6fff]"}`}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
