"use client";

import { motion } from "framer-motion";
import { Plus, Home, Split, Wallet, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  disabled?: boolean;
  onAddClick: () => void;
}

export default function BottomNav({ disabled = false, onAddClick }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isHome = pathname === "/";
  const isAccounts = pathname === "/accounts";
  const isTrips = pathname?.startsWith("/splits");
  const isProfile = pathname === "/profile";

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: isHome },
    { href: "/accounts", label: "Accounts", icon: Wallet, active: isAccounts },
    { href: "/splits", label: "Splits", icon: Split, active: isTrips },
    { href: "/profile", label: "Profile", icon: User, active: isProfile, isProfileTab: true },
  ];

  return (
    <nav className="mobile-footer fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-[480px] glass-footer border-t border-white/[0.06]">
      <div className="relative flex items-center justify-around h-14 px-2">
        {/* Home */}
        <NavTab tab={tabs[0]} />

        {/* Accounts */}
        <NavTab tab={tabs[1]} />

        {/* Center Add Button */}
        <div className="flex justify-center" style={{ flex: "0 0 auto" }}>
          <motion.button
            className="relative -mt-7 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white disabled:cursor-not-allowed disabled:opacity-45 shadow-lg"
            style={{
              background: disabled
                ? "linear-gradient(135deg, #343444, #242430)"
                : "linear-gradient(135deg, #6c47ff, #8b6fff)",
            }}
            whileTap={disabled ? undefined : { scale: 0.9 }}
            whileHover={disabled ? undefined : { scale: 1.08 }}
            onClick={onAddClick}
            disabled={disabled}
            aria-label="Add"
          >
            {!disabled && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #6c47ff, #8b6fff)",
                  filter: "blur(12px)",
                  opacity: 0.4,
                }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            <Plus size={22} strokeWidth={2.4} className="relative z-10" />
          </motion.button>
        </div>

        {/* Trips */}
        <NavTab tab={tabs[2]} />

        {/* Profile */}
        <NavTab tab={tabs[3]} user={user} />
      </div>
    </nav>
  );
}

function NavTab({
  tab,
  user,
}: {
  tab: { href: string; label: string; icon: any; active: boolean | undefined; isProfileTab?: boolean };
  user?: any;
}) {
  const Icon = tab.icon;

  return (
    <Link href={tab.href} className="flex-1 flex justify-center">
      <motion.div
        className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors"
        whileTap={{ scale: 0.9 }}
      >
        <div className="relative">
          {tab.isProfileTab && user?.photoURL ? (
            <div className="relative">
              <img
                src={user.photoURL}
                alt="Profile"
                className={`w-5 h-5 rounded-full object-cover ${tab.active ? "ring-1 ring-[#8b6fff]" : ""}`}
              />
            </div>
          ) : (
            <Icon
              size={20}
              strokeWidth={tab.active ? 2.4 : 1.8}
              className={tab.active ? "text-[#8b6fff]" : "text-[#5a5a6e]"}
            />
          )}
          {tab.active && (
            <motion.div
              layoutId="nav-glow"
              className="absolute -inset-2 rounded-full bg-[#6c47ff]/15 -z-10"
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </div>
        <span
          className={`text-[10px] font-semibold ${
            tab.active ? "text-[#8b6fff]" : "text-[#5a5a6e]"
          }`}
        >
          {tab.label}
        </span>
      </motion.div>
    </Link>
  );
}
