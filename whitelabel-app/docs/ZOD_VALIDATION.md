# Zod Validation Guide

This white-label app uses [Zod](https://zod.dev) for runtime configuration validation. All client configs are validated when the app starts, catching errors early and providing helpful error messages.

## Why Zod?

- ✅ **Type Safety**: Ensures configs have correct data types
- ✅ **Format Validation**: Validates bundle IDs, colors, URLs, etc.
- ✅ **Clear Errors**: Provides specific, actionable error messages
- ✅ **Early Detection**: Catches config issues before deployment
- ✅ **Auto-completion**: Schema can generate TypeScript types

## Quick Examples

### Valid Configuration

```javascript
module.exports = {
  appName: 'ACME Business',
  slug: 'acme-business',
  scheme: 'acme',
  version: '1.0.0',
  
  icon: './assets/acme/icon.png',
  
  splash: {
    image: './assets/acme/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1E3A8A',
  },
  
  ios: {
    bundleIdentifier: 'com.acme.business',
  },
  
  android: {
    package: 'com.acme.business',
    adaptiveIcon: {
      foregroundImage: './assets/acme/adaptive-icon.png',
      backgroundColor: '#1E3A8A',
    },
  },
  
  brandColors: {
    primary: '#1E3A8A',
    secondary: '#DC2626',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#000000',
    error: '#FF3B30',
    success: '#34C759',
  },
};
```

### Common Errors

```javascript
// ❌ Bad bundle identifier (uppercase not allowed)
ios: {
  bundleIdentifier: 'com.ACME.business',
}

// ✅ Fixed
ios: {
  bundleIdentifier: 'com.acme.business',
}

// ❌ Bad color format (missing #)
brandColors: {
  primary: '1E3A8A',
}

// ✅ Fixed
brandColors: {
  primary: '#1E3A8A',
}

// ❌ Bad Android package (hyphens not allowed)
android: {
  package: 'com.acme-business',
}

// ✅ Fixed
android: {
  package: 'com.acme.business',
}
```

## Validation Rules Summary

| Field | Format | Example |
|-------|--------|---------|
| `appName` | 1-30 chars | `"ACME Business"` |
| `slug` | Lowercase, hyphens OK | `"acme-business"` |
| `scheme` | Lowercase, hyphens OK | `"acme"` |
| `version` | Semantic (X.Y.Z) | `"1.0.0"` |
| `icon` | Asset path | `"./assets/acme/icon.png"` |
| `ios.bundleIdentifier` | Reverse domain, lowercase | `"com.acme.app"` |
| `android.package` | Reverse domain, underscores OK | `"com.acme.app"` |
| `brandColors.*` | Hex color #RRGGBB | `"#1E3A8A"` |
| `apiUrl` | Valid URL | `"https://api.acme.com"` |
| `supportEmail` | Valid email | `"support@acme.com"` |
| `locale` | ISO code | `"en"` or `"en-US"` |

## How to Validate

### 1. Automatic (on app start)

```bash
CLIENT=acme npm start

# ✅ If valid:
✅ Loaded config for client: acme
✅ Configuration validated successfully

# ❌ If invalid:
❌ Configuration validation failed!
Errors:
  - ios.bundleIdentifier: Must be a valid bundle identifier
  - brandColors.primary: Must be a valid hex color
```

### 2. Manual Validation

```bash
npm run validate acme

# Shows detailed validation results
```

### 3. During Client Creation

```bash
npm run new-client myapp "My App"

# Automatically validates generated config
🔍 Validating generated configuration with Zod...
✅ Generated config passed Zod validation
```

## Common Issues & Fixes

### Bundle Identifier Errors

**Error**: `Must be a valid bundle identifier`

| ❌ Wrong | ✅ Correct | Why |
|---------|-----------|-----|
| `com.ACME.app` | `com.acme.app` | No uppercase |
| `com.acme_app` | `com.acme.app` | No underscores in iOS |
| `acme.app` | `com.acme.app` | Need reverse domain |

### Color Format Errors

**Error**: `Must be a valid hex color`

| ❌ Wrong | ✅ Correct | Why |
|---------|-----------|-----|
| `FF5733` | `#FF5733` | Missing # |
| `#F57` | `#FF5733` | Need 6 digits |
| `rgb(255,87,51)` | `#FF5733` | Must be hex |

### Asset Path Errors

**Error**: `Expected string to start with './assets/'`

| ❌ Wrong | ✅ Correct | Why |
|---------|-----------|-----|
| `/assets/icon.png` | `./assets/icon.png` | Use relative path |
| `assets/icon.png` | `./assets/icon.png` | Need ./ prefix |

## Best Practices

1. **Always validate before committing**
   ```bash
   npm run validate myapp
   git add configs/myapp.config.js
   git commit -m "Add myapp config"
   ```

2. **Keep bundle IDs consistent**
   ```javascript
   ios: { bundleIdentifier: 'com.acme.business' },
   android: { package: 'com.acme.business' }, // Same!
   ```

3. **Use uppercase hex colors**
   ```javascript
   primary: '#1E3A8A',  // ✅ Consistent
   // Not: '#1e3a8a'     // ❌ Works but inconsistent
   ```

4. **Test after config changes**
   ```bash
   npm run validate acme && CLIENT=acme npm start
   ```

## Full Documentation

For complete validation rules and examples, see the main [README](../README.md) and configuration examples in `configs/`.

## Resources

- [Zod Documentation](https://zod.dev)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Guidelines](https://play.google.com/console/about/guides/)
