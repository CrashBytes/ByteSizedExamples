/**
 * FitZone Fitness App Configuration
 * 
 * A vibrant fitness and wellness app with energetic branding
 */

module.exports = {
  // App Identity
  appName: 'FitZone',
  slug: 'fitzone',
  scheme: 'fitzone',
  version: '1.0.0',

  // Assets
  icon: './assets/fitzone/icon.png',
  splash: {
    image: './assets/fitzone/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#10B981',
  },

  // iOS Configuration
  ios: {
    bundleIdentifier: 'com.fitzone.app',
    icon: './assets/fitzone/icon.png',
  },

  // Android Configuration
  android: {
    package: 'com.fitzone.app',
    adaptiveIcon: {
      foregroundImage: './assets/fitzone/adaptive-icon.png',
      backgroundColor: '#10B981',
    },
  },

  // Web Configuration
  web: {
    favicon: './assets/fitzone/favicon.png',
  },

  // Brand Colors
  brandColors: {
    primary: '#10B981',
    secondary: '#F59E0B',
    accent: '#EF4444',
    background: '#FFFFFF',
    text: '#1F2937',
    error: '#DC2626',
    success: '#059669',
  },

  // Typography
  typography: {
    fontFamily: {
      heading: 'System',
      body: 'System',
      monospace: 'Courier',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Feature Flags
  features: {
    auth: true,
    socialLogin: {
      google: true,
      apple: true,
      facebook: false,
    },
    biometric: true,
    workoutTracking: true,
    socialSharing: true,
    nutritionPlans: true,
    personalTrainer: true,
    challenges: true,
    notifications: true,
    darkMode: false,
    chat: true,
    fileUpload: true,
    offlineMode: true,
  },

  // Content & Copy
  content: {
    onboarding: {
      step1: {
        title: 'Welcome to FitZone',
        description: 'Track your workouts and reach your fitness goals',
        icon: '💪',
      },
      step2: {
        title: 'Stay Motivated',
        description: 'Join challenges and compete with friends',
        icon: '🏆',
      },
      step3: {
        title: 'Get Started',
        description: 'Your fitness journey begins now',
        icon: '🚀',
      },
    },
    buttons: {
      primary: 'Get Started',
      secondary: 'Learn More',
      login: 'Sign In',
      signup: 'Join FitZone',
    },
    tabs: {
      home: 'Home',
      search: 'Discover',
      notifications: 'Activity',
      profile: 'Profile',
    },
  },

  // Navigation
  navigation: {
    tabBar: {
      position: 'bottom',
      showLabels: true,
    },
    tabs: [
      { id: 'home', icon: '🏠', label: 'Home', enabled: true },
      { id: 'search', icon: '🔍', label: 'Discover', enabled: true },
      { id: 'notifications', icon: '📊', label: 'Activity', enabled: true },
      { id: 'profile', icon: '👤', label: 'Profile', enabled: true },
    ],
  },

  // API Configuration
  apiUrl: 'https://api.fitzone.app',
  supportEmail: 'support@fitzone.app',

  // Localization
  locale: 'en',
};
