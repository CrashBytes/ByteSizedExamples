/**
 * TastyBites Restaurant & Food Delivery App Configuration
 * 
 * Warm, appetizing colors for food delivery service
 */

module.exports = {
  // App Identity
  appName: 'TastyBites',
  slug: 'tastybites',
  scheme: 'tastybites',
  version: '1.0.0',

  // Assets
  icon: './assets/tastybites/icon.png',
  splash: {
    image: './assets/tastybites/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#DC2626', // Appetizing Red
  },

  // iOS Configuration
  ios: {
    bundleIdentifier: 'com.tastybites.app',
    icon: './assets/tastybites/icon.png',
  },

  // Android Configuration
  android: {
    package: 'com.tastybites.app',
    adaptiveIcon: {
      foregroundImage: './assets/tastybites/adaptive-icon.png',
      backgroundColor: '#DC2626',
    },
  },

  // Web Configuration
  web: {
    favicon: './assets/tastybites/favicon.png',
  },

  // Brand Colors - Warm food theme
  brandColors: {
    primary: '#DC2626',    // Appetizing Red
    secondary: '#F59E0B',  // Golden Yellow
    accent: '#059669',     // Fresh Green
    background: '#FFFFFF', // Clean White
    text: '#1F2937',       // Dark Gray
    error: '#EF4444',      // Error Red
    success: '#10B981',    // Success Green
  },

  // Feature Flags
  features: {
    auth: true,
    orderTracking: true,
    liveTracking: true,
    menuBrowser: true,
    favorites: true,
    ratings: true,
    loyaltyProgram: true,
    darkMode: false,
    notifications: true,
    delivery: true,
    pickup: true,
  },

  // API Configuration
  apiUrl: 'https://api.tastybites.com',
  supportEmail: 'support@tastybites.com',

  // Localization
  locale: 'en',
};
