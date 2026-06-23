# FinFlow – AI Expense Tracker

A premium, mobile-first AI expense tracker built for the Hyderabad developer lifestyle.

## Tech Stack
- **Next.js 14** (App Router)
- **Tailwind CSS** – glassmorphic dark UI
- **Framer Motion** – spring animations & micro-interactions
- **LocalStorage** – zero-backend, all data stays on device

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open http://localhost:3000
```

## Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (one command)
vercel
```

Or push to GitHub and import at https://vercel.com/new

## Deploy to Netlify

```bash
npm run build
# Upload the .next folder, or connect your GitHub repo at netlify.com
```

## Project Structure

```
finflow/
├── app/
│   ├── globals.css         # Tailwind + custom CSS vars
│   ├── layout.tsx          # Root layout + metadata
│   └── page.tsx            # Main dashboard
├── components/
│   ├── Onboarding.tsx      # Budget setup screen
│   ├── TopNav.tsx          # Sticky glass navbar
│   ├── BalanceCard.tsx     # Ring + progress bar card
│   ├── QuickStats.tsx      # Income & daily avg cards
│   ├── CategoryBreakdown.tsx # Animated bar chart
│   ├── SpendFeed.tsx       # Date-grouped transaction list
│   ├── ExpenseDrawer.tsx   # Spring bottom drawer + AI suggest
│   ├── BottomNav.tsx       # Tab navigation
│   └── Toast.tsx           # Animated notification
├── hooks/
│   └── useExpenses.ts      # State + localStorage
├── lib/
│   ├── categories.ts       # 16 Hyderabad lifestyle categories
│   ├── classifier.ts       # AI keyword-based categorizer
│   ├── sampleData.ts       # Pre-loaded transactions
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Formatting helpers
└── public/
    ├── favicon.svg
    └── manifest.json       # PWA manifest
```

## Features

- 🤖 **AI Categorization** – type "Dinner at Ichiraku" and it auto-suggests Dining
- 💳 **16 Categories** – Metro, KTM Petrol, Swiggy, Playo, Vercel, Nykaa & more
- 📊 **Live Analytics** – animated ring, progress bar, category breakdown
- 💾 **LocalStorage** – no backend needed, data persists in browser
- 📱 **PWA Ready** – add to home screen on mobile
- 🎨 **Glassmorphic UI** – deep charcoal dark mode with Electric Indigo + Cyber Lime accents
