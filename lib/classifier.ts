import { CATEGORIES, type Category } from "./categories";

export function classifyExpense(text: string): Category | null {
  if (!text || text.trim().length < 2) return null;
  const lower = text.toLowerCase();
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) return cat;
    }
  }
  return null;
}
