# React Native Version - Quick Start Guide

## 📱 What Changed?

The original **Next.js web app** has been converted to a **production-ready React Native app** using **Expo** that works on both iOS and Android with the same UI, functionality, and features.

### Key Differences:
- **Framework**: Next.js 14 → React Native with Expo
- **Styling**: Tailwind CSS → NativeWind (Tailwind for React Native)
- **UI**: Web components → React Native components
- **Navigation**: File-based (Next.js) → Expo Router (similar concept)
- **State**: Zustand (same) with AsyncStorage for persistence
- **Firebase**: Firebase SDK (works the same way)

---

## 🚀 Quick Start

### 1. Install & Setup

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

**Manual Setup:**
```bash
npm install
npm install -g expo-cli
npm install -g eas-cli
cp .env.local.example .env.local
```

### 2. Update Firebase Credentials

Edit `.env.local` with your Firebase project credentials:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Start Development Server

```bash
npm start
```

Then:
- Press `a` for Android (requires Android Studio or Emulator)
- Press `i` for iOS (requires macOS with Xcode)
- Press `w` for Web (experimental)

### 4. Build for Production

**iOS:**
```bash
npm run build:ios
```

**Android:**
```bash
npm run build:android
```

**Both:**
```bash
npm run build
```

---

## 📂 Project Structure

```
finflow/
├── rn-app/                    # Expo Router screens
│   ├── (auth)/               # Authentication flows
│   │   ├── login.tsx
│   │   └── onboarding.tsx
│   ├── (app)/                # Main app screens (tabs)
│   │   ├── overview.tsx      # Dashboard
│   │   ├── expenses.tsx      # Expense list
│   │   ├── splits.tsx        # Split management
│   │   ├── accounts.tsx      # Bank accounts
│   │   └── profile.tsx       # User profile
│   └── _layout.tsx           # Root layout
├── rn-store/                  # Zustand state management
│   ├── expenseStore.ts
│   ├── userStore.ts
│   ├── splitStore.ts
│   └── uiStore.ts
├── rn-components/             # Reusable components
│   ├── cards/                # Card components
│   ├── drawers/              # Bottom sheet modals
│   └── modals/               # Dialog modals
├── lib/                       # Shared utilities & services
│   ├── firebase.ts           # Firebase config
│   ├── firestore.ts          # Firestore operations
│   ├── types.ts              # TypeScript types
│   ├── utils.ts              # Helper functions
│   ├── categories.ts         # Expense categories
│   └── payment-planning.ts   # Payment logic
├── app.json                   # Expo configuration
├── eas.json                   # EAS build config
├── package.json              # Dependencies
└── .env.local                # Firebase credentials
```

---

## 🎯 Core Features

### Authentication
- Email/Password sign-up & login
- Firebase authentication
- Biometric login ready
- Session persistence

### Expense Tracking
- Add, edit, delete expenses
- 14+ expense categories
- Multiple payment methods (Card, UPI, Cash, Bank)
- AI categorization ready
- Category breakdown charts
- Real-time transaction list

### Payment Planning
- Credit card billing cycle management
- Bill due date tracking
- Reserved expenses handling
- Payment settlement UI
- Budget vs spending tracker

### Split Management
- Create expense splits with friends
- Multiple split types (equal, percentage, exact)
- Settlement calculations
- Payment tracking history
- Trip-based splits

### Budget Management
- Monthly budget setup
- Budget cycle management
- Spending progress tracking
- Budget alerts & notifications

---

## 🔧 Common Tasks

### Add a New Screen
1. Create file in `rn-app/(app)/new-screen.tsx`
2. Import in tab navigation
3. Add to `_layout.tsx`

### Create a New Component
```bash
# Create the component file
touch rn-components/YourComponent.tsx

# Use it in your screens
import { YourComponent } from "@/components/YourComponent";
```

### Update State
```typescript
// Access store
import { useExpenseStore } from "@/rn-store/expenseStore";

export default function MyComponent() {
  const { expenses, addExpense } = useExpenseStore();
  // ... use in component
}
```

### Add Firestore Data
```typescript
// In your component
import { addExpense } from "@/lib/firestore";

const handleAddExpense = async (expenseData) => {
  const id = await addExpense(userId, expenseData);
  console.log("Expense added:", id);
};
```

---

## 🚀 Deployment

### Prepare for Release
```bash
# 1. Update version
# Edit app.json: "version": "1.1.0"

# 2. Run tests
npm test

# 3. Build for production
npm run build

# 4. Submit to stores
npm run submit
```

### Full Deployment Guide
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 📊 Performance Tips

1. **Lazy Load Heavy Screens** - Use React.lazy()
2. **Optimize Images** - Use expo-image for caching
3. **Memoize Components** - Use React.memo()
4. **Batch Updates** - Use Zustand for state batching
5. **Code Splitting** - Let Hermes compile efficiently

---

## 🐛 Debugging

### Development Tools
```bash
# Open Expo DevTools
npm start
# Press 'd' for developer menu

# React DevTools
npm install -g react-devtools
react-devtools
```

### Console Logging
```typescript
// In React Native
console.log("Debug:", data);
console.warn("Warning message");
console.error("Error message");
```

### Firebase Debugging
Enable emulator in `lib/firebase.ts`:
```typescript
if (__DEV__) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
}
```

---

## 📚 Resources

- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Firebase React Native](https://rnfirebase.io)
- [Zustand](https://github.com/pmndrs/zustand)
- [Expo Router](https://expo.github.io/router)
- [NativeWind](https://www.nativewind.dev)

---

## ❓ FAQ

**Q: Can I use this code for iOS and Android?**
A: Yes! Expo handles both. Just build for both platforms.

**Q: What about the web version?**
A: Expo supports web, but you might want to keep the Next.js version for better web experience.

**Q: How do I add new features from the web app?**
A: Convert the web components to React Native and use the same Firestore/state management.

**Q: Can I deploy to App Stores?**
A: Yes! See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Q: Is offline mode supported?**
A: Yes, via AsyncStorage caching and Firestore offline persistence.

---

## 🆘 Troubleshooting

### "Module not found" error
```bash
npm install
npm start
```

### Firebase connection issues
- Check `.env.local` credentials
- Ensure Firebase project exists
- Verify internet connection

### Build failures
```bash
# Clear cache and rebuild
npm start --clear
npm run build --clear-cache
```

### Emulator not starting
- Ensure Android Studio/Xcode is installed
- Check emulator settings
- Restart the emulator manually

---

## 📝 Version Info

- **React Native**: 0.74.0
- **Expo**: 51.0.0
- **Firebase**: 12.13.0
- **Zustand**: 4.5.5
- **NativeWind**: Latest

**Last Updated**: 2024

---

## 💬 Need Help?

- Check the [REACT_NATIVE_README.md](./REACT_NATIVE_README.md) for detailed docs
- Review code examples in `rn-app/` and `rn-components/`
- Check Expo documentation for platform-specific issues
- Open an issue in your repository

---

**Happy coding! 🚀**
