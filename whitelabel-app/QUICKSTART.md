# ⚡ Quick Start

Get your white-label app running in 5 minutes.

## 1. Install (2 minutes)

```bash
cd ~/github/whitelabel-app
npm install
```

## 2. Run Default App (30 seconds)

```bash
npm start
```

Scan QR code with:
- **iOS**: Camera app → opens in Expo Go
- **Android**: Expo Go app ([download](https://expo.dev/go))

Press:
- `i` for iOS Simulator
- `a` for Android Emulator
- `w` for Web Browser

## 3. Try Different Clients (30 seconds each)

```bash
# ACME (corporate blue/red theme)
CLIENT=acme npm start

# TechStartup (modern gradient theme)
CLIENT=techstartup npm start

# Back to Default
npm start
```

## 4. Create Your Client (2 minutes)

```bash
# Generate configuration
npm run new-client myclient "My Company"

# This creates:
# ✅ configs/myclient.config.js
# ✅ assets/myclient/ directory
```

## 5. Add Your Assets (varies)

Add these files to `assets/myclient/`:

- `icon.png` (1024x1024px)
- `splash.png` (1242x2436px)
- `adaptive-icon.png` (1024x1024px)
- `favicon.png` (48x48px)

See `assets/myclient/README.md` for specs.

## 6. Customize Config (5 minutes)

Edit `configs/myclient.config.js`:

```javascript
module.exports = {
  appName: 'My Company',
  
  brandColors: {
    primary: '#YOUR_COLOR',    // ← Change this
    secondary: '#YOUR_COLOR',  // ← And this
    // ...
  },
  
  apiUrl: 'https://api.mycompany.com',  // ← Your API
  supportEmail: 'support@mycompany.com', // ← Your email
};
```

## 7. Test Your Client (30 seconds)

```bash
# Validate
npm run validate myclient

# Run
CLIENT=myclient npm start
```

## Next Steps

- [Full Setup Guide](SETUP.md) - Detailed instructions
- [README](README.md) - Complete documentation
- [Build for Production](#building) - Deploy to app stores

## Common Commands

```bash
# List all clients
npm run clients

# Create new client
npm run new-client <slug> <name>

# Validate config
npm run validate <slug>

# Run specific client
CLIENT=<slug> npm start

# Clear cache
CLIENT=<slug> npm start -- -c
```

## Building

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Build App

```bash
# iOS
CLIENT=myclient eas build --platform ios

# Android  
CLIENT=myclient eas build --platform android

# Both
CLIENT=myclient eas build --platform all
```

## Troubleshooting

### Can't find config?
- Check file exists: `configs/myclient.config.js`
- Restart server after creating config

### Assets not showing?
- Verify files in `assets/myclient/`
- Clear cache: `npm start -- -c`

### Build failed?
- Validate first: `npm run validate myclient`
- Check bundle IDs are unique

## Need Help?

1. Check [SETUP.md](SETUP.md) for detailed guide
2. Read [README.md](README.md) for full docs
3. Run `npm run clients` to see examples
4. Validate config: `npm run validate <client>`

## That's It! 🎉

You now have a working white-label app that can be deployed as any client's branded application.
