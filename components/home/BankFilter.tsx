"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers, Wallet } from "lucide-react";
import type { Bank } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface Props {
  banks: Bank[];
  selectedBankId: string;
  onBankChange: (bankId: string) => void;
}

export default function BankFilter({ banks, selectedBankId, onBankChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

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

  const totalBankBalance = banks.reduce((sum, bank) => sum + (bank.balance ?? 0), 0);
  const selectedBank =
    selectedBankId !== "all" ? banks.find((b) => b.id === selectedBankId) : null;

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

      {banks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#1e1e28]/90 px-4 py-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6c47ff]/15 text-[#8b6fff]">
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
                {selectedBank ? `${selectedBank.name} balance` : "Total across banks"}
              </div>
              <div className="font-syne truncate text-xl font-bold text-white">
                {formatINR(selectedBank ? (selectedBank.balance ?? 0) : totalBankBalance)}
              </div>
            </div>
          </div>
          {selectedBank && (
            <div className="shrink-0 pl-3 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#5a5a6e]">
                All banks
              </div>
              <div className="text-sm font-semibold text-[#9898aa]">
                {formatINR(totalBankBalance)}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
