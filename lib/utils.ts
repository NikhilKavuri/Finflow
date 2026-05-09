import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
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
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentMonthPrefix(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
