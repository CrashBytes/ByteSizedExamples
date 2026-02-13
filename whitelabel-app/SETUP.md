# 🚀 Setup Guide

Complete setup instructions for the White Label Expo App.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (will be installed automatically)
- iOS Simulator (Mac only) or Android Studio for testing

## Initial Setup

### 1. Install Dependencies

```bash
cd ~/github/whitelabel-app
npm install
```

### 2. Verify Installation

```bash
# List available clients
npm run clients

# Should show "default" and "acme" clients
```

### 3. Test Default App

```bash
npm start
# or
expo start
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app ([download](https://expo.dev/go))

## Creating Your First Client

### Option 1: Use Generator Script (Recommended)

```bash
# Create new client configuration
npm run new-client yourclient "Your Company Name"

# This creates:
# - configs/yourclient.config.js
# - assets/yourclient/ directory
# - assets/yourclient/README.md
```

### Option 2: Manual Creation

1. Copy `configs/default.config.js` to `configs/yourclient.config.js`
2. Edit the config file
3. Create `assets/yourclient/` directory
4. Add required assets

## Adding Assets

Each client needs these assets in `assets/[client]/`:

### Required Files

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024x1024px | App icon (iOS & Android) |
| `splash.png` | 1242x2436px | Splash screen |
| `adaptive-icon.png` | 1024x1024px | Android adaptive icon |
| `favicon.png` | 48x48px | Web favicon |

### Asset Guidelines

- Use PNG format
- Include transparency for icons
- Test on multiple device sizes
- Compress with [TinyPNG](https://tinypng.com)

### Quick Asset Setup

```bash
# Create assets directory
mkdir -p assets/yourclient

# Copy from design tools or download
cp ~/Downloads/icon.png assets/yourclient/
cp ~/Downloads/splash.png assets/yourclient/
cp ~/Downloads/adaptive-icon.png assets/yourclient/
cp ~/Downloads/favicon.png assets/yourclient/
```

## Configuring Client

Edit `configs/yourclient.config.js`:

### 1. Basic Information

```javascript
module.exports = {
  appName: 'Your Company',
  slug: 'yourcompany-app',
  scheme: 'yourcompany',
  version: '1.0.0',
  // ...
};
```

### 2. Platform Identifiers

```javascript
ios: {
  bundleIdentifier: 'com.yourcompany.app',
},
android: {
  package: 'com.yourcompany.app',
},
```

**Important**: Bundle identifiers must be unique across all apps!

### 3. Brand Colors

```javascript
brandColors: {
  primary: '#YOUR_BRAND_COLOR',
  secondary: '#SECONDARY_COLOR',
  accent: '#ACCENT_COLOR',
  // ... more colors
},
```

Use hex color codes (#RRGGBB format).

### 4. Features

```javascript
features: {
  auth: true,
  darkMode: true,
  analytics: false,  // Disable if not needed
  pushNotifications: true,
},
```

### 5. API Configuration

```javascript
apiUrl: 'https://api.yourcompany.com',
supportEmail: 'support@yourcompany.com',
locale: 'en',
supportedLocales: ['en', 'es'],
```

## Validation

Validate your client configuration:

```bash
# Validate specific client
npm run validate yourclient

# Checks:
# ✅ Config file syntax
# ✅ Required fields present
# ✅ Asset files exist
# ✅ Bundle identifiers valid
# ✅ Color codes correct
```

## Testing

### Development Server

```bash
# Run specific client
CLIENT=yourclient npm start

# Run with clear cache
CLIENT=yourclient npm start -- -c

# Run on specific port
CLIENT=yourclient npm start -- --port 19001
```

### iOS Simulator

```bash
CLIENT=yourclient npm run ios
```

### Android Emulator

```bash
CLIENT=yourclient npm run android
```

### Web Browser

```bash
CLIENT=yourclient npm run web
```

## Building for Production

### Setup EAS (Expo Application Services)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure project
eas build:configure
```

### Build Commands

```bash
# iOS Build
CLIENT=yourclient eas build --platform ios --profile production

# Android Build
CLIENT=yourclient eas build --platform android --profile production

# Both platforms
CLIENT=yourclient eas build --platform all --profile production
```

### Build Profiles

Defined in `eas.json`:

- **development**: Development builds with dev client
- **preview**: Internal testing builds
- **production**: App Store/Play Store releases

## Deployment

### iOS App Store

```bash
# Submit to App Store
CLIENT=yourclient eas submit --platform ios

# You'll need:
# - Apple Developer account
# - App Store Connect app created
# - App-specific password
```

### Android Play Store

```bash
# Submit to Play Store
CLIENT=yourclient eas submit --platform android

# You'll need:
# - Google Play Developer account
# - Service account JSON key
# - App created in Play Console
```

## Managing Multiple Clients

### Directory Structure

```
configs/
  ├── default.config.js
  ├── acme.config.js
  ├── techcorp.config.js
  └── startup.config.js

assets/
  ├── default/
  ├── acme/
  ├── techcorp/
  └── startup/
```

### Switching Between Clients

```bash
# Stop current server (Ctrl+C)
# Start with new client
CLIENT=newclient npm start
```

### Testing Multiple Clients Simultaneously

```bash
# Terminal 1
CLIENT=client1 npm start

# Terminal 2
CLIENT=client2 npm start -- --port 19001

# Terminal 3
CLIENT=client3 npm start -- --port 19002
```

## Troubleshooting

### Config Not Loading

**Problem**: Default config loads instead of client config

**Solution**:
- Verify file exists: `configs/yourclient.config.js`
- Check for syntax errors in config
- Restart dev server
- Check CLIENT variable is set

### Assets Not Showing

**Problem**: Placeholder or broken images

**Solution**:
- Verify asset paths in config match actual files
- Check file extensions (case-sensitive)
- Clear cache: `expo start -c`
- Ensure assets meet size requirements

### Build Failures

**Problem**: EAS build fails

**Solution**:
- Validate config: `npm run validate yourclient`
- Check bundle identifiers are unique
- Verify all assets exist
- Review build logs in EAS dashboard

### Module Not Found

**Problem**: Cannot find module errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

### Metro Bundler Issues

**Problem**: Bundler won't start or crashes

**Solution**:
```bash
# Kill existing Metro processes
killall -9 node

# Start fresh
npm start -- --reset-cache
```

## Advanced Configuration

### Custom Fonts

Add fonts to `assets/fonts/`:

```javascript
// In app.config.js extra section
fonts: {
  'CustomFont-Regular': require('./assets/fonts/CustomFont-Regular.ttf'),
},
```

### Environment Variables

Create `.env` files per client:

```bash
# .env.yourclient
API_URL=https://api.yourclient.com
API_KEY=your-api-key
```

Load in config:

```javascript
require('dotenv').config({ path: `.env.${process.env.CLIENT}` });
```

### Multiple Schemes

Support multiple URL schemes:

```javascript
// In client config
scheme: 'yourclient',
ios: {
  infoPlist: {
    CFBundleURLTypes: [
      {
        CFBundleURLSchemes: ['yourclient', 'yourclient-prod'],
      },
    ],
  },
},
```

## Best Practices

### Version Control

```bash
# .gitignore already includes:
- node_modules/
- .expo/
- .env files

# Consider using git-lfs for assets:
git lfs track "*.png"
git lfs track "*.jpg"
```

### Asset Management

- Keep high-res originals separate
- Use automated image optimization
- Consider CDN for large assets
- Version control asset updates

### Configuration

- Document client-specific features
- Keep configs DRY (use shared constants)
- Validate before committing
- Use semantic versioning

### Testing

- Test on multiple devices
- Check both light and dark modes
- Verify all features work
- Test deep linking
- Performance profiling

## Next Steps

1. ✅ Install dependencies
2. ✅ Create client configuration
3. ✅ Add required assets
4. ✅ Validate configuration
5. ✅ Test in development
6. ✅ Build for production
7. ✅ Submit to app stores

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Guidelines](https://play.google.com/console/about/guides/releasewithconfidence/)

## Getting Help

- Check [Expo Forums](https://forums.expo.dev)
- Read [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)
- Review project README.md
- Validate config with scripts

## Quick Reference

```bash
# List clients
npm run clients

# Create client
npm run new-client <slug> <name>

# Validate client
npm run validate <slug>

# Run client
CLIENT=<slug> npm start

# Build production
CLIENT=<slug> eas build --platform all
```
