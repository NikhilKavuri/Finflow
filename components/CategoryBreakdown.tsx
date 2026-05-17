"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transaction } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import { formatINR } from "@/lib/utils";

interface Props {
  expenses: Transaction[];
  selectedCategoryId?: string | null;
  onCategorySelect?: (id: string) => void;
}

// SVG full pie chart helpers
const CHART_SIZE = 220;
const CENTER = CHART_SIZE / 2;
const RADIUS = 95; // Leave room for scale on hover

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeWedge(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (Math.abs(endAngle - startAngle) >= 359.9) {
    // Draw a full circle if there's only 1 category (100%)
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

export default function CategoryBreakdown({ expenses, selectedCategoryId, onCategorySelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([id, amount]) => ({ id, amount, cat: getCategoryById(id) }));
  }, [expenses]);

  const totalAmount = catData.reduce((sum, item) => sum + item.amount, 0) || 1;

  // Compute wedges
  const arcs = useMemo(() => {
    let currentAngle = 0;
    return catData.map(({ id, amount, cat }) => {
      const pct = amount / totalAmount;
      const sweep = pct * 360;
      
      const arc = {
        id,
        amount,
        cat,
        pct,
        startAngle: currentAngle,
        endAngle: currentAngle + sweep,
        path: describeWedge(CENTER, CENTER, RADIUS, currentAngle, currentAngle + sweep),
      };
      currentAngle += sweep;
      return arc;
    });
  }, [catData, totalAmount]);

  const activeItem = hoveredId
    ? catData.find((c) => c.id === hoveredId)
    : selectedCategoryId
    ? catData.find((c) => c.id === selectedCategoryId)
    : null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-syne text-[15px] font-bold text-white">Category Breakdown</h2>
          <p className="text-[11px] text-[#8b6fff] mt-1">Tap a category to view its spend feed.</p>
        </div>
      </div>

      {catData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-syne text-sm font-bold text-white">No expenses yet</p>
          <p className="text-xs text-[#5a5a6e] mt-1">Add your first expense to see breakdown</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/[0.06] bg-[#121218] p-5 shadow-lg">
          {/* Active Info Card */}
          <div className="mb-6 flex justify-center">
            <AnimatePresence mode="wait">
              {activeItem ? (
                <motion.div
                  key={activeItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 px-5 py-3 rounded-2xl border"
                  style={{ 
                    backgroundColor: activeItem.cat.color + "15",
                    borderColor: activeItem.cat.color + "30"
                  }}
                >
                  <div className="text-3xl filter drop-shadow-md">{activeItem.cat.emoji}</div>
                  <div>
                    <div className="font-syne text-[15px] font-bold text-white">{activeItem.cat.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-syne text-lg font-black" style={{ color: activeItem.cat.color }}>
                        {formatINR(activeItem.amount)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold text-white/80" 
                            style={{ backgroundColor: activeItem.cat.color + "40" }}>
                        {Math.round((activeItem.amount / totalAmount) * 100)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="total"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 px-5 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c47ff] to-[#8b6fff] flex items-center justify-center text-xl shadow-[0_0_15px_rgba(108,71,255,0.4)]">
                    💸
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#5a5a6e] uppercase tracking-widest">Total Spent</div>
                    <div className="font-syne text-xl font-black text-white">{formatINR(totalAmount)}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Full Pie Chart */}
          <div className="flex justify-center mb-6">
            <div className="relative" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
              {/* Outer glowing ring for aesthetics */}
              <div 
                className="absolute inset-0 rounded-full border border-white/[0.03] pointer-events-none"
                style={{ scale: 1.05 }}
              />
              
              <svg
                width={CHART_SIZE}
                height={CHART_SIZE}
                viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
                className="overflow-visible"
              >
                {/* Wedges */}
                {arcs.map((arc, i) => {
                  const isActive = hoveredId === arc.id || selectedCategoryId === arc.id;
                  return (
                    <motion.path
                      key={arc.id}
                      d={arc.path}
                      fill={arc.cat.color}
                      stroke="#121218" // Matches the container background to create natural gaps
                      strokeWidth={3}
                      strokeLinejoin="round"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: isActive ? 1.08 : 1,
                        opacity: (hoveredId || selectedCategoryId) && !isActive ? 0.3 : 1,
                      }}
                      transition={{
                        scale: { type: "spring", stiffness: 300, damping: 20 },
                        opacity: { duration: 0.2 },
                        default: { duration: 0.5, delay: i * 0.05 }
                      }}
                      style={{ 
                        transformOrigin: "50% 50%", 
                        cursor: "pointer", 
                        filter: isActive ? `drop-shadow(0 4px 12px ${arc.cat.color}60)` : "none" 
                      }}
                      onMouseEnter={() => setHoveredId(arc.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => onCategorySelect?.(arc.id)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2">
            {catData.map(({ id, amount, cat }) => {
              const isActive = selectedCategoryId === id || hoveredId === id;
              return (
                <motion.button
                  key={id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onCategorySelect?.(id)}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-300 ${
                    isActive
                      ? "border-white/[0.15] bg-white/[0.06] shadow-sm"
                      : "border-white/[0.03] bg-transparent hover:bg-white/[0.03]"
                  }`}
                  style={{
                    boxShadow: isActive ? `0 0 20px ${cat.color}15` : "none"
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ background: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px]">{cat.emoji}</span>
                      <span className="text-xs font-semibold text-white/90 truncate">{cat.name}</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold flex-shrink-0" style={{ color: cat.color }}>
                    {Math.round((amount / totalAmount) * 100)}%
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
