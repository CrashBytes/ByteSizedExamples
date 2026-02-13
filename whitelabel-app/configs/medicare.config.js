/**
 * MediCare Healthcare App Configuration
 * 
 * Clean, trustworthy blue and green for medical services
 */

module.exports = {
  // App Identity
  appName: 'MediCare',
  slug: 'medicare',
  scheme: 'medicare',
  version: '1.0.0',

  // Assets
  icon: './assets/medicare/icon.png',
  splash: {
    image: './assets/medicare/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#2563EB', // Medical Blue
  },

  // iOS Configuration
  ios: {
    bundleIdentifier: 'com.medicare.app',
    icon: './assets/medicare/icon.png',
  },

  // Android Configuration
  android: {
    package: 'com.medicare.app',
    adaptiveIcon: {
      foregroundImage: './assets/medicare/adaptive-icon.png',
      backgroundColor: '#2563EB',
    },
  },

  // Web Configuration
  web: {
    favicon: './assets/medicare/favicon.png',
  },

  // Brand Colors - Clean medical theme
  brandColors: {
    primary: '#2563EB',    // Medical Blue
    secondary: '#059669',  // Healthy Green
    accent: '#7C3AED',     // Purple Accent
    background: '#FFFFFF', // Clean White
    text: '#1F2937',       // Dark Gray
    error: '#DC2626',      // Error Red
    success: '#10B981',    // Success Green
  },

  // Feature Flags
  features: {
    auth: true,
    appointments: true,
    telemedicine: true,
    prescriptions: true,
    healthRecords: true,
    labResults: true,
    billing: true,
    insurance: true,
    darkMode: false,
    notifications: true,
    emergencyContact: true,
  },

  // API Configuration
  apiUrl: 'https://api.medicare-app.com',
  supportEmail: 'support@medicare-app.com',

  // Localization
  locale: 'en',
};
