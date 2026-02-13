/**
 * HomeFinder Real Estate App Configuration
 * 
 * Professional navy and gold for luxury real estate
 */

module.exports = {
  // App Identity
  appName: 'HomeFinder',
  slug: 'homefinder',
  scheme: 'homefinder',
  version: '1.0.0',

  // Assets
  icon: './assets/homefinder/icon.png',
  splash: {
    image: './assets/homefinder/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1E3A8A', // Professional Navy
  },

  // iOS Configuration
  ios: {
    bundleIdentifier: 'com.homefinder.app',
    icon: './assets/homefinder/icon.png',
  },

  // Android Configuration
  android: {
    package: 'com.homefinder.app',
    adaptiveIcon: {
      foregroundImage: './assets/homefinder/adaptive-icon.png',
      backgroundColor: '#1E3A8A',
    },
  },

  // Web Configuration
  web: {
    favicon: './assets/homefinder/favicon.png',
  },

  // Brand Colors - Professional real estate theme
  brandColors: {
    primary: '#1E3A8A',    // Professional Navy
    secondary: '#D97706',  // Luxury Gold
    accent: '#059669',     // Success Green
    background: '#FFFFFF', // Clean White
    text: '#1F2937',       // Dark Gray
    error: '#DC2626',      // Error Red
    success: '#10B981',    // Success Green
  },

  // Feature Flags
  features: {
    auth: true,
    propertySearch: true,
    mapView: true,
    favorites: true,
    virtualTours: true,
    mortgage: true,
    agentChat: true,
    scheduling: true,
    darkMode: false,
    notifications: true,
    savedSearches: true,
  },

  // API Configuration
  apiUrl: 'https://api.homefinder.com',
  supportEmail: 'support@homefinder.com',

  // Localization
  locale: 'en',
};
