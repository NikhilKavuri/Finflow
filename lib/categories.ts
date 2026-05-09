export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "metro",
    name: "Metro / TSMR",
    emoji: "🚇",
    color: "#3b82f6",
    keywords: ["metro", "tsmr", "hyderabad metro", "l&t metro", "mgbs", "ameerpet", "hitech city metro"],
  },
  {
    id: "petrol",
    name: "Petrol / KTM",
    emoji: "⛽",
    color: "#f97316",
    keywords: ["petrol", "fuel", "ktm", "rtr", "bike", "bunk", "shell", "hp", "ioc", "indian oil", "filling station"],
  },
  {
    id: "cab",
    name: "Uber / Ola",
    emoji: "🚕",
    color: "#eab308",
    keywords: ["uber", "ola", "cab", "auto", "rapido", "ride", "taxi", "indriver"],
  },
  {
    id: "swiggy",
    name: "Swiggy / Zepto",
    emoji: "🛵",
    color: "#ff6b35",
    keywords: ["swiggy", "zepto", "blinkit", "delivery", "zomato", "dunzo", "bigbasket", "instamart", "quick commerce"],
  },
  {
    id: "dining",
    name: "Dining & Japanese",
    emoji: "🍜",
    color: "#ec4899",
    keywords: [
      "dinner", "lunch", "breakfast", "sushi", "ramen", "ichiraku", "pan-asian", "japanese",
      "restaurant", "cafe", "food", "biryani", "hyderabadi", "paradise", "pista house",
      "shah ghouse", "chutneys", "cream stone", "irani cafe", "nimrah", "karachi bakery",
    ],
  },
  {
    id: "drinks",
    name: "Weekend Drinks",
    emoji: "🍸",
    color: "#8b5cf6",
    keywords: [
      "skyline", "makau", "bar", "pub", "drinks", "beer", "cocktail", "alcohol", "wine",
      "whiskey", "weekend", "toit", "singles inferno", "molecule", "lexi's", "xtreme sports bar",
    ],
  },
  {
    id: "gym",
    name: "Sri Fit Pro Gym",
    emoji: "🏋️",
    color: "#2ce88a",
    keywords: ["gym", "sri fit", "fitness", "workout", "protein", "supplement", "cult", "gold's", "anytime fitness"],
  },
  {
    id: "sports",
    name: "Badminton / Playo",
    emoji: "🏸",
    color: "#22d3ee",
    keywords: ["badminton", "playo", "sports", "court", "cricket", "tennis", "basketball", "chess", "turf", "ground booking"],
  },
  {
    id: "f1",
    name: "F1 Community",
    emoji: "🏎️",
    color: "#ef4444",
    keywords: ["f1", "formula 1", "formula one", "race", "grand prix", "silverstone", "monza", "circuit", "f1 meetup", "f1 screening"],
  },
  {
    id: "cloud",
    name: "Cloud / Vercel",
    emoji: "☁️",
    color: "#6c47ff",
    keywords: [
      "vercel", "render", "railway", "aws", "gcp", "azure", "digitalocean", "subscription",
      "cloud", "hosting", "domain", "namecheap", "cloudflare", "supabase", "planetscale",
      "neon", "upstash", "netlify", "heroku", "linode",
    ],
  },
  {
    id: "gear",
    name: "Tech Gear",
    emoji: "💻",
    color: "#a855f7",
    keywords: [
      "keyboard", "mouse", "monitor", "laptop", "macbook", "iphone", "headphone", "earphones",
      "tech", "gadget", "usb", "cable", "hard disk", "ssd", "ram", "amazon", "flipkart", "croma",
    ],
  },
  {
    id: "skincare",
    name: "Skincare / Nykaa",
    emoji: "✨",
    color: "#f472b6",
    keywords: [
      "nykaa", "dot & key", "skincare", "haircare", "moisturizer", "sunscreen", "serum",
      "shampoo", "grooming", "minimalist", "the ordinary", "mamaearth", "plum",
    ],
  },
  {
    id: "rent",
    name: "Rent",
    emoji: "🏠",
    color: "#64748b",
    keywords: ["rent", "maintenance", "society", "apartment", "flat", "pg", "hostel", "deposit", "brokerage"],
  },
  {
    id: "urbanclap",
    name: "Urban Company",
    emoji: "🔧",
    color: "#0ea5e9",
    keywords: [
      "urban company", "urbanclap", "plumber", "electrician", "cleaning", "ac service",
      "repair", "housekeeping", "laundry", "appliance",
    ],
  },
  {
    id: "utilities",
    name: "Utilities",
    emoji: "💡",
    color: "#facc15",
    keywords: [
      "electricity", "water", "internet", "wifi", "airtel", "jio", "broadband", "bill",
      "gas", "lpg", "piped gas", "tsgenco", "hyderabad electricity",
    ],
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
