"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface Props {
  balance: number;
  onClick: () => void;
}

export default function BalanceLeftCard({ balance, onClick }: Props) {
  const isNegative = balance < 0;

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ translateY: -1 }}
      className="mx-0 my-4 rounded-3xl p-6 relative overflow-hidden border cursor-pointer active:scale-[0.99] transition-all"
      style={{
        background: "linear-gradient(135deg, #161224 0%, #0d121c 100%)",
        borderColor: isNegative ? "rgba(255,79,107,0.2)" : "rgba(108,71,255,0.15)",
      }}
    >
      {/* Glow blobs */}
      <div
        className="absolute -top-14 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: isNegative
            ? "radial-gradient(circle,rgba(255,79,107,0.12),transparent 70%)"
            : "radial-gradient(circle,rgba(108,71,255,0.14),transparent 70%)",
        }}
      />
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles size={11} className={isNegative ? "text-[#ff4f6b]" : "text-[#8b6fff]"} />
            <span className="text-[10px] font-bold text-[#5a5a6e] tracking-widest uppercase">
              Balance Left
            </span>
          </div>
          <div className={`font-syne text-3xl font-black leading-none mb-3 ${isNegative ? "text-[#ff4f6b]" : "text-white"}`}>
            {formatINR(balance)}
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8b6fff] bg-[#6c47ff]/10 px-2.5 py-1 rounded-xl">
            View budget details <ArrowRight size={10} className="mt-0.5 animate-pulse" />
          </span>
        </div>
        
        {/* Right side styling */}
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
          💰
        </div>
      </div>
    </motion.div>
  );
}
