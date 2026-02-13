# Quick Reference - Version 1.0.0

## 🚀 Essential Commands

### Validation
```bash
npm run validate [client-name]          # Validate single client
npm run validate acme                   # Example: validate ACME
```

### Asset Generation
```bash
npm run generate-assets [client-name]   # Generate placeholder assets
npm run generate-assets fitzone         # Example: FitZone assets
```

### Local Development
```bash
CLIENT=acme npm start                   # Start development server
CLIENT=acme npx expo start --clear      # Start with cache cleared
```

### Production Builds
```bash
# Single client - iOS
CLIENT=acme eas build --platform ios --profile production

# Single client - Android
CLIENT=acme eas build --platform android --profile production

# Single client - Both platforms
CLIENT=acme eas build --platform all --profile production
```

### Automated Deployment
```bash
# Make script executable (first time only)
chmod +x scripts/deploy-v1.0.0.sh

# Deploy single client to both platforms
./scripts/deploy-v1.0.0.sh acme all

# Deploy all clients to both platforms
./scripts/deploy-v1.0.0.sh all all

# Deploy single client to iOS only
./scripts/deploy-v1.0.0.sh acme ios

# Deploy single client to Android only
./scripts/deploy-v1.0.0.sh acme android
```

### App Store Submission
```bash
# Submit to iOS App Store
eas submit --platform ios --latest

# Submit to Google Play Store
eas submit --platform android --latest
```

### Version Management
```bash
# Check current version
cat package.json | grep version

# Update version
npm version patch    # 1.0.0 -> 1.0.1
npm version minor    # 1.0.0 -> 1.1.0
npm version major    # 1.0.0 -> 2.0.0
```

### Git & GitHub
```bash
# Commit changes
git add .
git commit -m "Release v1.0.0"
git push origin main

# Create and push version tag
git tag -a v1.0.0 -m "Version 1.0.0 Release"
git push origin v1.0.0

# Push all tags
git push origin --tags
```

### Build Monitoring
```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# Get build logs
eas build:logs [build-id]
```

---

## 📦 Available Clients

```bash
CLIENT=acme         # ACME Business (B2B SaaS)
CLIENT=fitzone      # FitZone (Fitness & Wellness)
CLIENT=tastybites   # TastyBites (Food Delivery)
CLIENT=shopsmart    # ShopSmart (E-commerce)
CLIENT=homefinder   # HomeFinder (Real Estate)
CLIENT=medicare     # MediCare (Healthcare)
CLIENT=techstartup  # TechStartup (Technology)
```

---

## 📋 Pre-Deployment Checklist

```bash
# 1. Validate configurations
for client in acme fitzone tastybites shopsmart homefinder medicare techstartup; do
  npm run validate $client
done

# 2. Generate assets (if missing)
for client in acme fitzone tastybites shopsmart homefinder medicare techstartup; do
  npm run generate-assets $client
done

# 3. Test locally
CLIENT=acme npm start
```

---

## 🔧 Troubleshooting

### Clear Metro Cache
```bash
CLIENT=acme npx expo start --clear
```

### Reset Node Modules
```bash
rm -rf node_modules
npm install
```

### Check EAS CLI Version
```bash
eas --version
eas whoami
```

### Update EAS CLI
```bash
npm install -g eas-cli@latest
```

---

## 📚 Documentation Links

| Document | Command to Open |
|----------|----------------|
| README | `cat README.md` |
| CHANGELOG | `cat CHANGELOG.md` |
| DEPLOYMENT | `cat DEPLOYMENT.md` |
| CHECKLIST | `cat RELEASE-CHECKLIST.md` |
| SUMMARY | `cat DEPLOYMENT-SUMMARY.md` |

---

## 🌐 Important URLs

- **Expo Dashboard**: https://expo.dev
- **GitHub Repo**: https://github.com/MichaelEakins/whitelabel-app
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console

---

## 📞 Support

- **Email**: contact@crashbytes.com
- **Issues**: https://github.com/MichaelEakins/whitelabel-app/issues
- **Docs**: See DEPLOYMENT.md

---

**Version 1.0.0** | December 2025
