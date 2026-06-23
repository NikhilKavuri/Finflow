# Production Deployment Guide for FinFlow React Native

## Prerequisites

- Expo account (https://expo.dev)
- Apple Developer account ($99/year) - For iOS
- Google Play Developer account ($25 one-time) - For Android
- Updated `.env.local` with production Firebase credentials

## 1. Pre-Deployment Checklist

### Code Quality
```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Run tests
npm test
```

### Version Management
```bash
# Update version in app.json
# Example: "version": "1.0.1"

# Update build number
# iOS: buildNumber in app.json
# Android: versionCode in app.json
```

### Testing on Device
```bash
# Build on EAS
npm run build

# This creates production builds
```

## 2. iOS App Store Deployment

### Step 1: Generate iOS Build
```bash
npm run build:ios
```

### Step 2: Apple Developer Account Setup
1. Enroll in Apple Developer Program ($99/year)
2. Create App ID in Developer Portal
3. Create Distribution Certificate
4. Create App Store Connect record

### Step 3: Submit to App Store
```bash
# If not auto-submitted
npm run submit -- --platform ios
```

### Requirements
- App Name, Subtitle, Privacy Policy URL
- Screenshots (5 screenshots, 6.7-inch display)
- Keywords
- Support URL
- App Category
- Review Notes

## 3. Google Play Deployment

### Step 1: Generate Android Build
```bash
npm run build:android
```

### Step 2: Google Play Account Setup
1. Create Google Play Developer account ($25)
2. Create app in Google Play Console
3. Complete app information

### Step 3: Submit to Play Store
```bash
npm run submit -- --platform android
```

### Requirements
- App Name, Description, Short Description
- Screenshots (8 screenshots minimum)
- Feature Graphic (1024×500)
- Icon (512×512)
- Privacy Policy URL
- Permissions

## 4. Production Firebase Setup

### Security Rules
Replace `firestore.rules` with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User collection - only accessible by authenticated user
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // User subcollections
      match /expenses/{expense} {
        allow read, write: if request.auth.uid == userId;
        // Validate expense fields
        allow create: if request.resource.data.keys().hasAll(['description', 'amount', 'category', 'date', 'paymentMethod']);
        allow update: if request.resource.data.userId == resource.data.userId;
      }
      
      match /splits/{split} {
        allow read, write: if request.auth.uid == userId;
        allow create: if request.resource.data.createdBy == request.auth.uid;
      }
      
      match /accounts/{account} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

### Enable Production Features
1. **Authentication**: Enable Email/Password, Google, Apple Sign-In
2. **Firestore**: Enable automatic backups
3. **Storage**: Enable signed URLs for receipts
4. **Cloud Functions**: Deploy backup functions
5. **Monitoring**: Enable Cloud Monitoring

### Backup Strategy
```bash
# Enable automated backups in Firestore
# Settings → Backup → Enable automatic backups
```

## 5. Post-Deployment

### Monitoring
1. Set up crash reporting (Sentry)
2. Enable Google Analytics
3. Monitor Firestore usage
4. Track user metrics

### Updates
```bash
# For hotfixes and updates
npm run build
# Update version number
npm run submit
```

### Rollback Plan
- Keep previous version available
- Test beta builds before release
- Have rollback version ready

## 6. CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to App Stores

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build iOS
        run: npm run build:ios
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Android
        run: npm run build:android
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Submit to stores
        run: npm run submit
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 7. Performance Optimization

### Before Release
- [ ] Run Lighthouse audit
- [ ] Check Firebase quota usage
- [ ] Optimize images
- [ ] Remove console logs
- [ ] Enable code splitting
- [ ] Test offline mode

### Production Configuration
Update `eas.json`:
```json
{
  "build": {
    "production": {
      "channel": "production",
      "distribution": "store",
      "ios": {
        "buildType": "archive"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

## 8. Security Checklist

- [ ] Disable debug logging in production
- [ ] Enable code obfuscation
- [ ] Review Firebase security rules
- [ ] Enable API key restrictions
- [ ] Set up rate limiting
- [ ] Enable CORS on backend
- [ ] Use HTTPS everywhere
- [ ] Implement certificate pinning
- [ ] Encrypt sensitive data
- [ ] Regular security audits

## 9. Maintenance

### Monthly
- [ ] Review crash logs
- [ ] Check performance metrics
- [ ] Update dependencies
- [ ] Review user feedback

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature planning
- [ ] User survey

## Support

- **Expo Docs**: https://docs.expo.dev
- **Firebase Docs**: https://firebase.google.com/docs
- **React Native**: https://reactnative.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
