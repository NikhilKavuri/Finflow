"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plane, Search } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import BottomNav from "@/components/BottomNav";
import TripCard from "@/components/TripCard";
import CreateTripDrawer from "@/components/CreateTripDrawer";
import Toast from "@/components/Toast";
import PageLoader from "@/components/PageLoader";

export default function TripsPage() {
  const router = useRouter();
  const { trips, hydrated, createTrip } = useTrips();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const activeTrips = trips.filter((t) => !t.archived);
  const archivedTrips = trips.filter((t) => t.archived);

  const filteredActive = search.trim()
    ? activeTrips.filter((t) =>
        t.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : activeTrips;
  const filteredArchived = search.trim()
    ? archivedTrips.filter((t) =>
        t.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : archivedTrips;

  if (!hydrated) return <PageLoader message="Loading trips..." />;

  return (
    <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-30 px-5 py-4 glass-nav border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plane size={20} className="text-[#8b6fff]" />
            <span className="font-syne text-xl font-black gradient-text">Trips</span>
          </div>
          <span className="text-xs font-semibold text-[#5a5a6e]">
            {activeTrips.length} active
          </span>
        </div>

        {/* Search */}
        {trips.length > 0 && (
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6e]"
            />
            <input
              type="text"
              placeholder="Search trips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e1e28] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]/40 transition-colors"
            />
          </div>
        )}
      </nav>

      <main className="flex-1 px-4 pt-4">
        {/* Empty State */}
        {trips.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center py-16"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6c47ff]/20 to-[#8b6fff]/10 flex items-center justify-center text-3xl mb-4">
              ✈️
            </div>
            <h3 className="font-syne text-lg font-bold text-white mb-2">
              No trips yet
            </h3>
            <p className="text-sm text-[#5a5a6e] max-w-[240px] mb-6">
              Create a trip to split expenses with friends. Track who paid what and settle up easily.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setDrawerOpen(true)}
              className="px-6 py-3 rounded-2xl font-syne text-sm font-bold text-white glow-accent"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6fff)" }}
            >
              Create Your First Trip ✈️
            </motion.button>
          </motion.div>
        )}

        {/* Active Trips */}
        {filteredActive.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-3 px-1">
              Active Trips
            </h3>
            <div className="space-y-2">
              {filteredActive.map((trip, i) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={i}
                  onClick={() => router.push(`/trips/${trip.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived Trips */}
        {filteredArchived.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-semibold text-[#5a5a6e] tracking-widest uppercase mb-3 px-1">
              Archived
            </h3>
            <div className="space-y-2">
              {filteredArchived.map((trip, i) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={i}
                  onClick={() => router.push(`/trips/${trip.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {search.trim() && filteredActive.length === 0 && filteredArchived.length === 0 && (
          <div className="text-center py-12 text-sm text-[#5a5a6e]">
            No trips matching &quot;{search}&quot;
          </div>
        )}
      </main>

      <BottomNav onAddClick={() => setDrawerOpen(true)} />

      <AnimatePresence>
        {drawerOpen && (
          <CreateTripDrawer
            onClose={() => setDrawerOpen(false)}
            onSubmit={(name, emoji, members) => {
              createTrip(name, emoji, members);
              setDrawerOpen(false);
              showToast("Trip created! 🎉");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </div>
  );
}
