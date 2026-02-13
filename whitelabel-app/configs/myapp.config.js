/**
 * My App Client Configuration
 * 
 * Generated: 2025-12-01T01:12:58.690Z
 * Validated with Zod schema
 * 
 * Usage: CLIENT=myapp expo start
 */

module.exports = {
  "appName": "My App",
  "slug": "myapp-app",
  "version": "1.0.0",
  "scheme": "myapp",
  "icon": "./assets/myapp/icon.png",
  "splash": {
    "image": "./assets/myapp/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "ios": {
    "bundleIdentifier": "com.myapp.app",
    "icon": "./assets/myapp/icon.png",
    "infoPlist": {
      "LSApplicationQueriesSchemes": [
        "myapp"
      ]
    }
  },
  "android": {
    "package": "com.myapp.app",
    "icon": "./assets/myapp/icon.png",
    "adaptiveIcon": {
      "foregroundImage": "./assets/myapp/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  },
  "web": {
    "favicon": "./assets/myapp/favicon.png"
  },
  "brandColors": {
    "primary": "#007AFF",
    "secondary": "#5856D6",
    "accent": "#FF9500",
    "background": "#FFFFFF",
    "text": "#000000",
    "error": "#FF3B30",
    "success": "#34C759"
  },
  "features": {
    "auth": true,
    "darkMode": true,
    "analytics": true,
    "pushNotifications": true
  },
  "apiUrl": "https://api.myapp.com",
  "supportEmail": "support@myapp.com",
  "locale": "en",
  "supportedLocales": [
    "en"
  ]
};
