"use client";

import { useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface Props {
  balance: number;
  totalSpent: number;
  budget: number;
  pct: number;
  editable?: boolean;
  onEditBudget: () => void;
}

const CIRC = 2 * Math.PI * 32;

export default function BalanceCard({ balance, totalSpent, budget, pct, editable = true, onEditBudget }: Props) {
  const ringRef = useRef<SVGCircleElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const ringColor =
    pct > 90 ? "#ff4f6b" : pct > 70 ? "#ffb830" : "url(#rg)";
  const barGradient =
    pct > 90
      ? "linear-gradient(90deg,#ff4f6b,#ff6b35)"
      : pct > 70
      ? "linear-gradient(90deg,#ffb830,#f97316)"
      : "linear-gradient(90deg,#6c47ff,#b8ff57)";

  useEffect(() => {
    if (!ringRef.current || !barRef.current) return;
    const target = CIRC * (1 - pct / 100);
    ringRef.current.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)";
    ringRef.current.style.strokeDashoffset = String(target);
    barRef.current.style.transition = "width 1.2s cubic-bezier(0.4,0,0.2,1)";
    barRef.current.style.width = pct + "%";
  }, [pct]);

  return (
    <div
      className="mx-0 my-4 rounded-3xl p-6 relative overflow-hidden border"
      style={{
        background: "linear-gradient(135deg,#1a1030 0%,#0d1525 50%,#0f1a10 100%)",
        borderColor: "rgba(108,71,255,0.2)",
      }}
    >
      {/* Glow blobs */}
      <div className="absolute -top-14 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(108,71,255,0.18),transparent 70%)" }} />
      <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(184,255,87,0.07),transparent 70%)" }} />

      <div className="relative z-10 flex items-end justify-between">
        {/* Left */}
        <div className="min-w-0 pr-3">
          <div className="mb-1 flex items-center gap-2">
            <div className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase">
              Balance Left
            </div>
            {editable && (
              <button
                type="button"
                onClick={onEditBudget}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#9898aa] transition-colors hover:text-white"
                aria-label="Edit budget"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
          <div className="font-syne text-4xl font-black text-white leading-none mb-1">
            {formatINR(balance)}
          </div>
          <div className="text-sm text-[#9898aa]">of {formatINR(budget)} budget</div>
        </div>

        {/* Ring */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
            <defs>
              <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6c47ff" />
                <stop offset="100%" stopColor="#b8ff57" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
            <circle
              ref={ringRef}
              cx="40" cy="40" r="32"
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-syne text-base font-black text-white leading-none">{pct}%</span>
            <span className="text-[9px] text-[#5a5a6e] uppercase tracking-widest">spent</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mt-5">
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div ref={barRef} className="h-full rounded-full w-0" style={{ background: barGradient }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-[#5a5a6e]">{formatINR(totalSpent)} spent</span>
          <span className="text-[11px] text-[#5a5a6e]">{formatINR(budget)} budget</span>
        </div>
      </div>
    </div>
  );
}
