export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "food",
    name: "Food",
    emoji: "🍔",
    color: "#ff6b35",
    keywords: ["food", "meal", "lunch", "dinner", "breakfast", "restaurant", "cafe", "snack", "coffee", "tea", "zomato", "swiggy"],
  },
  {
    id: "groceries",
    name: "Groceries",
    emoji: "🛒",
    color: "#2ce88a",
    keywords: ["grocery", "groceries", "zepto", "blinkit", "instamart", "bigbasket", "market", "vegetables", "fruit"],
  },
  {
    id: "transport",
    name: "Transport",
    emoji: "🚕",
    color: "#3b82f6",
    keywords: ["uber", "ola", "cab", "auto", "metro", "train", "bus", "fuel", "petrol", "parking", "taxi", "ride"],
  },
  {
    id: "shopping",
    name: "Shopping",
    emoji: "🛍️",
    color: "#a855f7",
    keywords: ["shopping", "amazon", "flipkart", "myntra", "clothes", "shirt", "shoes", "order", "store"],
  },
  {
    id: "bills",
    name: "Bills",
    emoji: "💡",
    color: "#facc15",
    keywords: ["bill", "electricity", "water", "wifi", "internet", "broadband", "gas", "mobile", "recharge", "airtel", "jio"],
  },
  {
    id: "rent",
    name: "Rent",
    emoji: "🏠",
    color: "#64748b",
    keywords: ["rent", "maintenance", "apartment", "flat", "pg", "hostel", "deposit"],
  },
  {
    id: "health",
    name: "Health",
    emoji: "🩺",
    color: "#ef4444",
    keywords: ["doctor", "hospital", "medicine", "medical", "pharmacy", "clinic", "health", "dentist"],
  },
  {
    id: "fitness",
    name: "Fitness",
    emoji: "🏋️",
    color: "#22d3ee",
    keywords: ["gym", "fitness", "workout", "protein", "sports", "badminton", "court", "cricket", "football"],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    emoji: "🎬",
    color: "#8b5cf6",
    keywords: ["movie", "netflix", "prime", "hotstar", "game", "concert", "party", "bar", "pub", "drinks"],
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    emoji: "🔁",
    color: "#6c47ff",
    keywords: ["subscription", "plan", "vercel", "render", "spotify", "youtube", "icloud", "hosting", "domain", "software"],
  },
  {
    id: "personal",
    name: "Personal Care",
    emoji: "✨",
    color: "#f472b6",
    keywords: ["personal", "skincare", "haircut", "salon", "grooming", "nykaa", "sunscreen", "shampoo"],
  },
  {
    id: "other",
    name: "Other",
    emoji: "💳",
    color: "#9898aa",
    keywords: [],
  },
];

export function getCategoryById(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
