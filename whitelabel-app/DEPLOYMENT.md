# Deployment Guide - Version 1.0.0

This guide covers deploying the White Label Multi-Brand App System to production for iOS and Android app stores.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Single Client Deployment](#single-client-deployment)
- [Multi-Client Batch Deployment](#multi-client-batch-deployment)
- [Automated Deployment Script](#automated-deployment-script)
- [App Store Submission](#app-store-submission)
- [Version Management](#version-management)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- **Expo Account**: Sign up at [expo.dev](https://expo.dev)
- **Apple Developer Program**: For iOS ($99/year) - [developer.apple.com](https://developer.apple.com)
- **Google Play Console**: For Android (one-time $25 fee) - [play.google.com/console](https://play.google.com/console)

### Required Tools

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Verify installation
eas --version
```

### EAS Configuration

Ensure your `eas.json` is properly configured:

```json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "autoIncrement": true
    }
  }
}
```

---

## Pre-Deployment Checklist

### 1. Configuration Validation

Validate all client configurations before building:

```bash
# Validate individual client
npm run validate acme

# Validate all demo clients
npm run validate acme
npm run validate fitzone
npm run validate tastybites
npm run validate shopsmart
npm run validate homefinder
npm run validate medicare
npm run validate techstartup
```

**Expected Output:**
```
✅ Configuration validated successfully
✓ Config file: configs/acme.config.js
✓ App name: ACME Business
✓ Bundle ID: com.acme.app
✓ All required fields present
✓ Brand colors valid
✓ Feature flags valid
```

### 2. Asset Generation

Ensure all assets are generated:

```bash
# Generate assets for specific client
npm run generate-assets acme

# Check assets exist
ls -la assets/acme/
# Should show: icon.png, splash.png, adaptive-icon.png
```

### 3. Local Testing

Test the app locally before deployment:

```bash
# Start development server
CLIENT=acme npx expo start --clear

# Test on physical device using Expo Go
# Or run on simulator:
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

**Critical Flows to Test:**
- ✅ App launches without crashes
- ✅ Correct branding/colors displayed
- ✅ Onboarding flow works
- ✅ Authentication screens function
- ✅ Navigation between tabs works
- ✅ All custom features enabled for client work

### 4. Version Verification

Confirm version is correct:

```bash
# Check package.json
cat package.json | grep version
# Should show: "version": "1.0.0"

# Check app.config.js dynamic version
node -e "const config = require('./app.config.js'); console.log(config({config: {}}).version);"
```

---

## Single Client Deployment

### iOS App Store Build

```bash
# Set client environment variable
CLIENT=acme

# Build for iOS
eas build --platform ios --profile production

# Follow prompts:
# - Select iOS bundle identifier (auto-generated from config)
# - Choose provisioning profile (auto-managed)
# - Confirm build
```

**Build Process:**
1. EAS uploads your code to Expo servers
2. Build runs on Expo's infrastructure
3. You receive a notification when complete
4. Download IPA file or submit directly

**Expected Build Time:** 10-20 minutes

### Android Play Store Build

```bash
# Set client environment variable
CLIENT=acme

# Build for Android
eas build --platform android --profile production

# Follow prompts:
# - Select Android package name (auto-generated from config)
# - Choose keystore (auto-managed)
# - Confirm build
```

**Build Process:**
1. EAS uploads your code to Expo servers
2. Build runs on Expo's infrastructure
3. You receive a notification when complete
4. Download AAB file or submit directly

**Expected Build Time:** 15-25 minutes

---

## Multi-Client Batch Deployment

### Deploy All Seven Demo Clients

**iOS Batch Build:**

```bash
#!/bin/bash
# Build all clients for iOS
for client in acme fitzone tastybites shopsmart homefinder medicare techstartup; do
  echo "Building $client for iOS..."
  CLIENT=$client eas build --platform ios --profile production --non-interactive
  sleep 5  # Prevent rate limiting
done
```

**Android Batch Build:**

```bash
#!/bin/bash
# Build all clients for Android
for client in acme fitzone tastybites shopsmart homefinder medicare techstartup; do
  echo "Building $client for Android..."
  CLIENT=$client eas build --platform android --profile production --non-interactive
  sleep 5  # Prevent rate limiting
done
```

**Both Platforms:**

```bash
#!/bin/bash
# Build all clients for both platforms
for client in acme fitzone tastybites shopsmart homefinder medicare techstartup; do
  echo "Building $client for iOS and Android..."
  CLIENT=$client eas build --platform all --profile production --non-interactive
  sleep 10
done
```

**Note:** Batch builds can take 2-4 hours for all 7 clients × 2 platforms = 14 builds

---

## Automated Deployment Script

Use the included deployment script for streamlined deployment:

```bash
# Make script executable
chmod +x scripts/deploy-v1.0.0.sh

# Deploy single client to both platforms
./scripts/deploy-v1.0.0.sh acme all

# Deploy single client to iOS only
./scripts/deploy-v1.0.0.sh acme ios

# Deploy single client to Android only
./scripts/deploy-v1.0.0.sh acme android

# Deploy all clients to both platforms
./scripts/deploy-v1.0.0.sh all all
```

**Script Features:**
- ✅ Pre-deployment validation
- ✅ Asset verification
- ✅ Interactive confirmation
- ✅ Colored output for status
- ✅ Error handling
- ✅ Post-deployment instructions

---

## App Store Submission

### iOS App Store

**After build completes:**

```bash
# Submit to App Store Connect
eas submit --platform ios --latest

# Or specify build ID
eas submit --platform ios --id [build-id]
```

**Follow prompts:**
1. Enter Apple ID
2. Select App Store Connect app
3. Confirm submission

**Manual Submission (Alternative):**
1. Download IPA from Expo dashboard
2. Upload using Transporter app
3. Process in App Store Connect

**App Store Connect Steps:**
1. Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create new app with bundle ID from config
3. Fill in app information:
   - Name: From `appName` in config
   - Category: Based on client industry
   - Privacy policy URL
   - Screenshots (iPhone, iPad)
4. Add build from TestFlight
5. Submit for review

### Google Play Store

**After build completes:**

```bash
# Submit to Play Console
eas submit --platform android --latest

# Or specify build ID
eas submit --platform android --id [build-id]
```

**Manual Submission (Alternative):**
1. Download AAB from Expo dashboard
2. Upload to Play Console
3. Create release

**Play Console Steps:**
1. Log in to [play.google.com/console](https://play.google.com/console)
2. Create new app
3. Fill in store listing:
   - App name: From `appName` in config
   - Description
   - Category: Based on client industry
   - Screenshots (phone, tablet)
4. Upload AAB to production track
5. Submit for review

---

## Version Management

### Current Version: 1.0.0

Version is defined in `package.json`:

```json
{
  "version": "1.0.0"
}
```

### Updating Version

```bash
# Patch version (1.0.0 -> 1.0.1) - Bug fixes
npm version patch

# Minor version (1.0.0 -> 1.1.0) - New features
npm version minor

# Major version (1.0.0 -> 2.0.0) - Breaking changes
npm version major
```

### Build Numbers

Build numbers are auto-incremented by EAS (configured in `eas.json`):

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

**iOS:** Build number increments automatically
**Android:** Version code increments automatically

---

## Post-Deployment

### 1. Git Tagging

Tag the release in git:

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Version 1.0.0 - Initial Production Release"

# Push tag to remote
git push origin v1.0.0

# Push all tags
git push origin --tags
```

### 2. GitHub Release

Create a GitHub release:

1. Go to repository releases page
2. Click "Draft a new release"
3. Select tag: `v1.0.0`
4. Release title: "Version 1.0.0 - Initial Production Release"
5. Copy CHANGELOG content into description
6. Attach build artifacts (optional)
7. Publish release

### 3. Documentation Updates

Update docs if needed:

```bash
# Update README with release info
# Update CHANGELOG with actual release date
# Update any configuration examples
```

### 4. Monitoring

Monitor app performance:

- **Expo Dashboard**: [expo.dev](https://expo.dev) - Build status, crashes
- **App Store Connect**: Download analytics, crash reports
- **Play Console**: Download analytics, crash reports, ANRs

### 5. Notifications

Set up monitoring:

```bash
# Enable Expo notifications for builds
eas build:configure

# Configure webhooks for build status
# Add Slack/Discord notifications if desired
```

---

## Troubleshooting

### Build Failures

**Problem:** Build fails with configuration error

```bash
# Solution: Validate configuration
npm run validate [client-name]

# Check for:
# - Missing required fields
# - Invalid color formats
# - Incorrect bundle IDs
```

**Problem:** Build fails with asset error

```bash
# Solution: Regenerate assets
npm run generate-assets [client-name]

# Verify assets exist
ls -la assets/[client-name]/
```

### Submission Issues

**Problem:** iOS submission rejected - missing info

```
# Solution: Check App Store Connect
# - Privacy policy URL required
# - Age rating required
# - Export compliance required
```

**Problem:** Android submission rejected - permissions

```
# Solution: Review AndroidManifest.xml
# - Only include necessary permissions
# - Provide permission justifications
```

### Environment Variable Issues

**Problem:** CLIENT variable not working

```bash
# Solution: Clear Metro bundler cache
CLIENT=acme npx expo start --clear

# Or set in different ways:
export CLIENT=acme
npm start

# Windows:
set CLIENT=acme && npm start
```

### Version Conflicts

**Problem:** Version mismatch between package.json and build

```bash
# Solution: Verify version consistency
cat package.json | grep version
node -e "const config = require('./app.config.js'); console.log(config({config: {}}).version);"

# Update if needed
npm version [major|minor|patch]
```

---

## Build Monitoring

### Check Build Status

```bash
# List all builds
eas build:list

# Check specific build
eas build:view [build-id]

# Get build logs
eas build:logs [build-id]
```

### Build Dashboard

Monitor builds at: [expo.dev/accounts/[username]/projects](https://expo.dev)

**Build Statuses:**
- 🟡 **Queued** - Waiting to start
- 🔵 **In Progress** - Currently building
- 🟢 **Finished** - Successful build
- 🔴 **Errored** - Build failed

---

## Support

For deployment issues:

- **EAS Build Docs**: [docs.expo.dev/build](https://docs.expo.dev/build)
- **EAS Submit Docs**: [docs.expo.dev/submit](https://docs.expo.dev/submit)
- **GitHub Issues**: [Create an issue](https://github.com/MichaelEakins/whitelabel-app/issues)
- **Email**: contact@crashbytes.com

---

**Happy Deploying! 🚀**

*Version 1.0.0 - December 2025*
