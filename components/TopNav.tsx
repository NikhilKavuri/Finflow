"use client";

export default function TopNav() {
  const now = new Date();
  const label = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 glass-nav border-b border-white/[0.06]">
      <span className="font-syne text-xl font-black gradient-text">FinFlow</span>
      <span className="text-xs font-semibold text-[#9898aa] bg-[#1e1e28] border border-white/10 rounded-full px-3 py-1.5">
        {label}
      </span>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #6c47ff, #c147ff)" }}>
        HY
      </div>
    </nav>
  );
}
