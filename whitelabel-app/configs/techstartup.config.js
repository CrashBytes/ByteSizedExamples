/**
 * TechStartup Client Configuration
 * 
 * Example showing a modern tech startup configuration
 * with different design choices than ACME.
 * All fields validated with Zod schema.
 * 
 * Usage: CLIENT=techstartup expo start
 */

module.exports = {
  // App Identity
  appName: 'TechStartup',
  slug: 'techstartup-app',
  version: '1.0.0',
  scheme: 'techstartup',
  
  // Assets
  icon: './assets/techstartup/icon.png',
  
  splash: {
    image: './assets/techstartup/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0F172A', // Dark slate background
  },
  
  // iOS Configuration
  ios: {
    bundleIdentifier: 'com.techstartup.app',
    icon: './assets/techstartup/icon.png',
    infoPlist: {
      LSApplicationQueriesSchemes: ['techstartup'],
      CFBundleDisplayName: 'TechStartup',
    },
  },
  
  // Android Configuration
  android: {
    package: 'com.techstartup.app',
    icon: './assets/techstartup/icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/techstartup/adaptive-icon.png',
      backgroundColor: '#0F172A',
    },
  },
  
  // Web Configuration
  web: {
    favicon: './assets/techstartup/favicon.png',
  },
  
  // Modern Gradient-Based Brand Colors
  brandColors: {
    primary: '#6366F1',      // Indigo
    secondary: '#8B5CF6',    // Purple
    accent: '#EC4899',       // Pink
    background: '#F8FAFC',   // Light gray
    text: '#0F172A',         // Slate
    error: '#EF4444',        // Red
    success: '#10B981',      // Green
  },
  
  // Theme
  theme: 'automatic',
  
  // Features - Different from ACME
  features: {
    auth: true,
    darkMode: true,          // TechStartup wants dark mode
    analytics: true,
    pushNotifications: true,
    aiAssistant: true,       // Startup-specific feature
    gamification: true,      // Another custom feature
  },
  
  // API & Support
  apiUrl: 'https://api.techstartup.io',
  supportEmail: 'hello@techstartup.io',
  
  // Localization - Startup targets global market
  locale: 'en',
  supportedLocales: ['en', 'es', 'fr'],
};
