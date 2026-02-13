/**
 * Default Client Configuration
 * 
 * This is the base template for all client configs.
 * Copy this file to create new client configurations.
 * 
 * All fields are validated with Zod schema.
 */

module.exports = {
  // App Identity (Required)
  appName: 'WhiteLabel App',
  slug: 'whitelabel-app',
  version: '1.0.0',
  scheme: 'whitelabel',
  
  // Assets (Required)
  icon: './assets/default/icon.png',
  
  splash: {
    image: './assets/default/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  
  // iOS Configuration (Required)
  ios: {
    bundleIdentifier: 'com.whitelabel.app',
    icon: './assets/default/icon.png',
    infoPlist: {
      LSApplicationQueriesSchemes: ['whitelabel'],
    },
  },
  
  // Android Configuration (Required)
  android: {
    package: 'com.whitelabel.app',
    icon: './assets/default/icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/default/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  
  // Web Configuration (Optional)
  web: {
    favicon: './assets/default/favicon.png',
  },
  
  // Brand Colors (Required)
  brandColors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#FF9500',
    background: '#FFFFFF',
    text: '#000000',
    error: '#FF3B30',
    success: '#34C759',
  },
  
  // Theme (Optional)
  theme: 'automatic',
  
  // Features (Optional)
  features: {
    auth: true,
    darkMode: true,
    analytics: true,
    pushNotifications: true,
  },
  
  // API & Support (Optional)
  apiUrl: 'https://api.whitelabel.com',
  supportEmail: 'support@whitelabel.com',
  
  // Localization (Optional)
  locale: 'en',
  supportedLocales: ['en', 'es', 'fr'],
};
