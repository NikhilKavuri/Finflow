"use client";

import { formatINR } from "@/lib/utils";

interface Props {
  totalIncome: number;
  dailyAvg: number;
}

export default function QuickStats({ totalIncome, dailyAvg }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 mb-4">
      <div className="bg-[#1e1e28] border border-white/[0.06] rounded-2xl p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#2ce88a,transparent)" }} />
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2"
          style={{ background: "rgba(44,232,138,0.1)" }}>💰</div>
        <div className="font-syne text-xl font-bold text-white">{formatINR(totalIncome)}</div>
        <div className="text-[11px] text-[#5a5a6e] mt-0.5">This Month Income</div>
      </div>
      <div className="bg-[#1e1e28] border border-white/[0.06] rounded-2xl p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#ff4f6b,transparent)" }} />
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2"
          style={{ background: "rgba(255,79,107,0.1)" }}>📉</div>
        <div className="font-syne text-xl font-bold text-white">{formatINR(dailyAvg)}<span className="text-sm font-normal text-[#9898aa]">/day</span></div>
        <div className="text-[11px] text-[#5a5a6e] mt-0.5">Daily Avg Spend</div>
      </div>
    </div>
  );
}
