import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number, maxFractionDigits: number = 0): string {
  const safeMaxFractionDigits = Math.min(Math.max(0, Math.floor(maxFractionDigits)), 2);
  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: safeMaxFractionDigits,
    })
  );
}

export function sanitizeBankBalanceInput(raw: string): string {
  // Keep digits and a single dot, and cap decimals to 2 places.
  const normalized = raw.replace(/,/g, ".");
  let out = "";
  let dotSeen = false;

  for (const ch of normalized) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "." && !dotSeen) {
      dotSeen = true;
      out += ch;
    }
  }

  if (!dotSeen) return out;
  const [whole, frac = ""] = out.split(".");
  return `${whole}.${frac.slice(0, 2)}`;
}

export function parseBankBalance(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formatDate(dateStr: string): string {
  const dt = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dt.getTime() === today.getTime()) return "Today";
  if (dt.getTime() === yesterday.getTime()) return "Yesterday";
  return dt.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getCurrentMonthPrefix(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getPreviousMonthPrefix(): string {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthPrefix: string): string {
  const [year, month] = monthPrefix.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function getDaysInMonth(monthPrefix: string): number {
  const [year, month] = monthPrefix.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function groupByDate(
  transactions: import("./types").Transaction[]
): Record<string, import("./types").Transaction[]> {
  return transactions.reduce(
    (acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = [];
      acc[tx.date].push(tx);
      return acc;
    },
    {} as Record<string, import("./types").Transaction[]>
  );
}
