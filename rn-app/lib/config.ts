/**
 * Production Build Configuration
 * Enable this in app.json for production builds
 */

export const productionConfig = {
  // Crash Reporting
  sentry: {
    enabled: true,
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: "production",
  },

  // Analytics
  analytics: {
    enabled: true,
    googleAnalyticsId: process.env.EXPO_PUBLIC_GA_ID,
  },

  // Performance Monitoring
  performance: {
    enabled: true,
    slowNetworkThreshold: 3000, // ms
    slowRenderThreshold: 16, // ms (60fps)
  },

  // Logging
  logging: {
    level: "info",
    remoteLogging: true,
    maxLocalLogs: 500,
  },

  // Security
  security: {
    enableSSLPinning: true,
    enableBiometric: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },

  // API
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
    backoffMultiplier: 2,
  },

  // Feature Flags
  features: {
    offlineMode: true,
    darkModeOnly: true,
    splitExpenses: true,
    paymentPlanning: true,
  },

  // Database
  database: {
    encryptionEnabled: true,
    autoBackup: true,
    backupInterval: 24 * 60 * 60 * 1000, // Daily
  },
};

// Development config
export const developmentConfig = {
  ...productionConfig,
  logging: {
    level: "debug",
    remoteLogging: false,
    maxLocalLogs: 1000,
  },
  api: {
    timeout: 60000,
    retries: 5,
    backoffMultiplier: 1,
  },
  performance: {
    enabled: false,
  },
};

export const getCurrentConfig = () => {
  return process.env.NODE_ENV === "production" ? productionConfig : developmentConfig;
};
