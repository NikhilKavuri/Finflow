# FinFlow - React Native Edition

A production-ready React Native version of FinFlow, an AI-powered expense tracker with advanced payment planning and split expense management.

## 📱 Prerequisites

- Node.js >= 18.0
- npm or yarn
- Expo CLI: `npm install -g eas-cli`
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio with SDK 24+ (for Android development)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Start Development Server

```bash
# For iOS (requires macOS)
npm run ios

# For Android
npm run android

# For Web (experimental)
npm run web

# Universal (choose platform)
npm start
```

### 3. Build for Production

**iOS:**
```bash
npm run build:ios
```

**Android:**
```bash
npm run build:android
```

**Both Platforms:**
```bash
npm run build
```

### 4. Submit to App Stores

```bash
npm run submit
```

## 📁 Project Structure

```
finflow/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout & navigation
│   ├── index.tsx                # Home/Overview screen
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth navigation stack
│   │   ├── login.tsx            # Login screen
│   │   └── onboarding.tsx       # Onboarding
│   ├── (app)/
│   │   ├── _layout.tsx          # Main app tabs
│   │   ├── overview.tsx         # Dashboard
│   │   ├── expenses.tsx         # Expense list
│   │   ├── splits.tsx           # Split management
│   │   ├── [id].tsx             # Split details
│   │   ├── accounts.tsx         # Bank accounts
│   │   └── profile.tsx          # User profile
│   └── +html.tsx                # Web-specific
├── components/                  # Reusable components
│   ├── common/                  # UI components
│   ├── drawers/                 # Bottom sheet drawers
│   ├── cards/                   # Card components
│   └── modals/                  # Modal dialogs
├── contexts/                    # React Context
│   ├── AuthContext.tsx          # Auth state
│   ├── ThemeContext.tsx         # Theme & styling
│   └── NotificationContext.tsx  # Notifications
├── hooks/                       # Custom React hooks
├── lib/                         # Utilities & services
│   ├── firebase.ts              # Firebase config
│   ├── firestore.ts             # Firestore services
│   ├── types.ts                 # TypeScript types
│   ├── categories.ts            # Expense categories
│   ├── classifier.ts            # AI categorizer
│   ├── payment-planning.ts      # Payment logic
│   └── utils.ts                 # Helper functions
├── store/                       # Zustand state management
│   ├── expenseStore.ts
│   ├── userStore.ts
│   ├── splitStore.ts
│   └── uiStore.ts
├── assets/                      # Images & icons
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── icons/                   # Icon assets
├── app.json                     # Expo configuration
├── eas.json                     # EAS build config
├── tsconfig.json                # TypeScript config
├── babel.config.js              # Babel config
├── metro.config.js              # Metro bundler config
└── tailwind.config.js           # NativeWind config
```

## 🏗️ Architecture

### Navigation
- **Expo Router**: File-based routing similar to Next.js
- **Bottom Tabs**: Main navigation (Overview, Expenses, Splits, Accounts, Profile)
- **Native Stack**: Authentication flow
- **Modal Presentation**: Bottom sheets for forms

### State Management
- **Zustand**: Global state (expenses, users, splits)
- **React Context**: Authentication & theme
- **AsyncStorage**: Persistent local data
- **Firestore**: Real-time sync & backup

### UI/Styling
- **NativeWind**: Tailwind CSS for React Native
- **React Native Reanimated**: Smooth animations
- **Gesture Handler**: Drag, swipe, gesture support
- **Custom theme**: Dark mode with Electric Indigo + Cyber Lime

## 🔑 Key Features

### Expense Tracking
- ✅ Automatic expense categorization with AI
- ✅ Multiple payment methods (Card, UPI, Cash, Bank)
- ✅ Inline calculator for quick math
- ✅ Batch edit expenses
- ✅ Real-time category breakdown charts

### Payment Planning
- ✅ Credit card billing cycle management
- ✅ Bill due date tracking
- ✅ Reserved expenses tracking
- ✅ Payment settlement UI
- ✅ Bank account balance sync

### Split Management
- ✅ Create expense splits with friends
- ✅ Multiple split types (equal, percentage, exact)
- ✅ Settle up interface
- ✅ Payment tracking & history
- ✅ Trip-based splits

### Budget Management
- ✅ Monthly budget setup (salary day triggered)
- ✅ Budget cycle management
- ✅ Spending progress tracking
- ✅ Budget alerts & notifications

### Authentication
- ✅ Email/password auth
- ✅ Biometric login (fingerprint/face)
- ✅ Session persistence
- ✅ Social auth ready (Google, Apple)

## 🔒 Firebase Configuration

### Setup

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project

2. **Enable Services**
   - Authentication (Email/Password, Google, Apple)
   - Firestore Database
   - Cloud Storage
   - Cloud Functions (optional)

3. **Configure SDK**
   Edit `lib/firebase.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### Firestore Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /expenses/{expense} {
        allow read, write: if request.auth.uid == userId;
      }
      
      match /splits/{split} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

## 📊 Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  budgetCycleStartDay: number;
  billingCycleStart: number;
  paymentDueDay: number;
  monthlyBudget: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Expense
```typescript
interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  paymentMethod: 'card' | 'upi' | 'cash' | 'bank';
  cardNumber?: string;
  bankAccount?: string;
  notes?: string;
  receipt?: string; // Cloud Storage URL
  createdAt: Date;
  updatedAt: Date;
}
```

### Split
```typescript
interface Split {
  id: string;
  createdBy: string;
  title: string;
  description?: string;
  category: string;
  totalAmount: number;
  currency: string;
  participants: Participant[];
  expenses: SplitExpense[];
  status: 'active' | 'settled' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎨 Theming

The app uses a consistent dark theme with dynamic accent colors.

### Colors
- **Background**: `#0a0e27` (Deep Indigo)
- **Surface**: `#121a3a` (Dark Blue)
- **Primary**: `#6366f1` (Electric Indigo)
- **Success**: `#10b981` (Cyber Lime)
- **Danger**: `#ef4444` (Bright Red)
- **Warning**: `#f59e0b` (Amber)

Edit `lib/theme.ts` to customize.

## 🧪 Testing

### Run Tests
```bash
npm test

# Watch mode
npm run test:watch
```

### Test Structure
- `__tests__/` folder at each level
- Unit tests for utilities & hooks
- Integration tests for stores
- Component tests with React Native Testing Library

## 📦 Building & Deployment

### EAS Build Configuration

1. **Link your project**:
   ```bash
   eas build:configure
   ```

2. **Build locally** (requires build machine):
   ```bash
   npm run build
   ```

3. **Build on EAS cloud**:
   ```bash
   npm run build:ios  # iOS only
   npm run build:android  # Android only
   npm run build  # Both
   ```

### App Store Requirements

**iOS App Store:**
- Apple Developer account ($99/year)
- Privacy policy URL
- App screenshots (5)
- Minimum iOS 14.0

**Google Play Store:**
- Google Play Developer account ($25 one-time)
- Privacy policy URL
- App screenshots (8)
- Minimum Android 6.0 (API 24)

## 🚨 Error Handling

The app includes comprehensive error handling:

- **Network errors**: Offline mode with sync on reconnect
- **Firebase errors**: Retry logic with exponential backoff
- **Permission errors**: User-friendly prompts
- **Validation errors**: Real-time form validation
- **Crash reporting**: Sentry integration ready

## 📱 Permissions Required

### iOS
- Camera (for receipt photos)
- Photo Library (for expense attachments)
- Biometric (Face ID / Touch ID)

### Android
- CAMERA
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE
- BIOMETRIC (for fingerprint)

## 🔄 Syncing Strategy

- **Real-time**: Firestore listeners for live updates
- **Offline-first**: AsyncStorage as cache layer
- **Background**: Sync pending changes when online
- **Conflict resolution**: Last-write-wins with timestamps

## 🐛 Debugging

### Development
```bash
npm start
# Press i for iOS, a for Android, or w for web
# Press j to open debugger
```

### React DevTools
```bash
npm install -g react-devtools
react-devtools
```

### Flipper
Download from https://fbflipper.com for native debugging.

## 📚 Dependencies Overview

| Package | Purpose |
|---------|---------|
| expo-router | File-based routing |
| react-native-reanimated | Smooth animations |
| zustand | State management |
| firebase | Backend services |
| react-native-toast-notifications | Toast messages |
| dayjs | Date manipulation |
| zod | Schema validation |
| react-native-vector-icons | Icon library |

## 🎯 Performance Tips

1. **Lazy load screens**: Use `React.lazy()` for heavy screens
2. **Memoize components**: Use `React.memo()` for pure components
3. **Optimize lists**: Use `FlashList` for large lists
4. **Image optimization**: Use `expo-image` for better caching
5. **Code splitting**: Let Hermes handle bytecode compilation

## 📈 Monitoring

### Analytics Setup
1. Add Expo Analytics
2. Integration: Google Analytics / Segment
3. Track: User flows, feature usage, errors

### Crash Reporting
1. Sentry integration for error tracking
2. Automatic native crash detection
3. Source map upload for debugging

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Commit: `git commit -m 'feat: description'`
4. Push: `git push origin feature/your-feature`
5. Open PR for review

## 📄 License

MIT License - See LICENSE file

## 🆘 Support

For issues and questions:
- Open GitHub Issues
- Check existing documentation
- Contact: support@finflow.app

## 🔗 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Expo Router Guide](https://expo.github.io/router)
- [Firebase React Native](https://rnfirebase.io)
- [React Native Reanimated](https://react-native-reanimated.dev)

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained**: FinFlow Team
