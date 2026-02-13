/**
 * ACME Corp Client Configuration
 * 
 * Example client configuration showing customization options.
 * All fields validated with Zod schema.
 * 
 * Usage: CLIENT=acme expo start
 */

module.exports = {
  // App Identity
  appName: 'ACME Business',
  slug: 'acme-business',
  version: '1.0.0',
  scheme: 'acme',
  
  // Assets
  icon: './assets/acme/icon.png',
  
  splash: {
    image: './assets/acme/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#1E3A8A', // ACME Blue
  },
  
  // iOS Configuration
  ios: {
    bundleIdentifier: 'com.acme.business',
    icon: './assets/acme/icon.png',
    infoPlist: {
      LSApplicationQueriesSchemes: ['acme'],
      CFBundleDisplayName: 'ACME',
    },
  },
  
  // Android Configuration
  android: {
    package: 'com.acme.business',
    icon: './assets/acme/icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/acme/adaptive-icon.png',
      backgroundColor: '#1E3A8A',
    },
  },
  
  // Web Configuration
  web: {
    favicon: './assets/acme/favicon.png',
  },
  
  // ACME Brand Colors
  brandColors: {
    primary: '#1E3A8A',      // ACME Blue
    secondary: '#DC2626',    // ACME Red
    accent: '#F59E0B',       // ACME Gold
    background: '#F8FAFC',
    text: '#0F172A',
    error: '#DC2626',
    success: '#059669',
  },
  
  // Theme
  theme: 'light',
  
  // Features
  features: {
    auth: true,
    darkMode: false,         // ACME doesn't want dark mode
    analytics: true,
    pushNotifications: true,
    customDashboard: true,   // ACME-specific feature
  },
  
  // API & Support
  apiUrl: 'https://api.acme.com',
  supportEmail: 'support@acme.com',
  
  // Localization
  locale: 'en',
  supportedLocales: ['en'],
};
