"use client";

import { motion } from "framer-motion";
import type { TripSession } from "@/lib/types";
import { getTripTotal } from "@/hooks/useTrips";
import { formatINR } from "@/lib/utils";

interface Props {
  trip: TripSession;
  index: number;
  onClick: () => void;
}

export default function TripCard({ trip, index, onClick }: Props) {
  const total = getTripTotal(trip);
  const memberCount = trip.members.length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full text-left group"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
          trip.archived
            ? "border-white/[0.04] bg-[#13131a]"
            : "border-white/[0.08] bg-[#1a1a24] hover:border-[#6c47ff]/30 hover:bg-[#1e1e2a]"
        }`}
      >
        {/* Subtle gradient accent */}
        {!trip.archived && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#6c47ff]/10 to-transparent rounded-bl-full" />
        )}

        <div className="relative flex items-start gap-3">
          {/* Emoji badge */}
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl ${
              trip.archived
                ? "bg-white/[0.04]"
                : "bg-gradient-to-br from-[#6c47ff]/20 to-[#8b6fff]/10"
            }`}
          >
            {trip.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`font-syne font-bold truncate ${
                  trip.archived ? "text-[#5a5a6e]" : "text-white"
                }`}
              >
                {trip.name}
              </h3>
              {trip.archived && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.04] text-[#5a5a6e]">
                  Archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              {/* Member avatars */}
              <div className="flex -space-x-1.5">
                {trip.members.slice(0, 4).map((member, i) => (
                  <div
                    key={member.id}
                    className="w-6 h-6 rounded-full bg-[#252533] border border-[#1a1a24] flex items-center justify-center text-[10px]"
                    style={{ zIndex: 4 - i }}
                    title={member.name}
                  >
                    {member.avatar}
                  </div>
                ))}
                {trip.members.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-[#252533] border border-[#1a1a24] flex items-center justify-center text-[9px] font-bold text-[#5a5a6e]">
                    +{trip.members.length - 4}
                  </div>
                )}
              </div>

              <span className="text-[11px] text-[#5a5a6e]">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="text-right flex-shrink-0">
            <div
              className={`font-syne text-sm font-bold ${
                trip.archived ? "text-[#5a5a6e]" : "text-white"
              }`}
            >
              {formatINR(total)}
            </div>
            <div className="text-[10px] text-[#5a5a6e] mt-0.5">
              {trip.expenses.length} {trip.expenses.length === 1 ? "expense" : "expenses"}
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
