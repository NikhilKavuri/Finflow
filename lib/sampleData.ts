import type { Transaction } from "./types";

const today = new Date();
const d = (daysAgo: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString().slice(0, 10);
};

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: "s1",  name: "Salary Credit – May",           amount: 185000, category: "other",     type: "income",  date: d(8) },
  { id: "s2",  name: "Paradise Biryani – Banjara Hills", amount: 450,  category: "dining",    type: "expense", date: d(0) },
  { id: "s3",  name: "Hyderabad Metro – Monthly Pass",  amount: 200,  category: "metro",     type: "expense", date: d(0) },
  { id: "s4",  name: "Vercel Pro Plan",                amount: 1800,  category: "cloud",     type: "expense", date: d(1) },
  { id: "s5",  name: "Sri Fit Pro Gym – Monthly",      amount: 2500,  category: "gym",       type: "expense", date: d(1) },
  { id: "s6",  name: "Skyline Bar – Friday Night Out", amount: 1200,  category: "drinks",    type: "expense", date: d(2) },
  { id: "s7",  name: "Swiggy – Chicken Tikka Roll",    amount: 380,   category: "swiggy",    type: "expense", date: d(2) },
  { id: "s8",  name: "Playo – Badminton Court (2hr)",  amount: 600,   category: "sports",    type: "expense", date: d(3) },
  { id: "s9",  name: "KTM Petrol – Somajiguda Shell",  amount: 800,   category: "petrol",    type: "expense", date: d(4) },
  { id: "s10", name: "Nykaa – Dot & Key SPF 50",       amount: 890,   category: "skincare",  type: "expense", date: d(4) },
  { id: "s11", name: "Uber – Office Commute",           amount: 230,   category: "cab",       type: "expense", date: d(5) },
  { id: "s12", name: "Render.com – Hobby Plan",        amount: 750,   category: "cloud",     type: "expense", date: d(5) },
  { id: "s13", name: "F1 Screening – Makau Bar",       amount: 500,   category: "f1",        type: "expense", date: d(6) },
  { id: "s14", name: "Zepto – Groceries",              amount: 960,   category: "swiggy",    type: "expense", date: d(6) },
  { id: "s15", name: "House Rent – Jubilee Hills",     amount: 22000, category: "rent",      type: "expense", date: d(7) },
  { id: "s16", name: "Airtel Broadband – 1 Gbps",      amount: 1199,  category: "utilities", type: "expense", date: d(7) },
  { id: "s17", name: "Keychron K8 Pro Keyboard",       amount: 8500,  category: "gear",      type: "expense", date: d(8) },
  { id: "s18", name: "Urban Company – AC Service",     amount: 799,   category: "urbanclap", type: "expense", date: d(8) },
];
