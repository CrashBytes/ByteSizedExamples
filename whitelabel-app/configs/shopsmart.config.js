/**
 * ShopSmart E-commerce App Configuration
 * 
 * Modern, trendy colors for retail shopping
 */

module.exports = {
  // App Identity
  appName: 'ShopSmart',
  slug: 'shopsmart',
  scheme: 'shopsmart',
  version: '1.0.0',

  // Assets
  icon: './assets/shopsmart/icon.png',
  splash: {
    image: './assets/shopsmart/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0891B2', // Modern Teal
  },

  // iOS Configuration
  ios: {
    bundleIdentifier: 'com.shopsmart.app',
    icon: './assets/shopsmart/icon.png',
  },

  // Android Configuration
  android: {
    package: 'com.shopsmart.app',
    adaptiveIcon: {
      foregroundImage: './assets/shopsmart/adaptive-icon.png',
      backgroundColor: '#0891B2',
    },
  },

  // Web Configuration
  web: {
    favicon: './assets/shopsmart/favicon.png',
  },

  // Brand Colors - Modern retail theme
  brandColors: {
    primary: '#0891B2',    // Modern Teal
    secondary: '#EC4899',  // Vibrant Pink
    accent: '#8B5CF6',     // Purple Accent
    background: '#FFFFFF', // Clean White
    text: '#1F2937',       // Dark Gray
    error: '#EF4444',      // Error Red
    success: '#10B981',    // Success Green
  },

  // Feature Flags
  features: {
    auth: true,
    cart: true,
    wishlist: true,
    productReviews: true,
    recommendations: true,
    orders: true,
    payments: true,
    shipping: true,
    darkMode: true,
    notifications: true,
    barcode: true,
  },

  // API Configuration
  apiUrl: 'https://api.shopsmart.com',
  supportEmail: 'support@shopsmart.com',

  // Localization
  locale: 'en',
};
