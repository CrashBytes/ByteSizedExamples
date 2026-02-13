# ⚡ Zod Validation Quick Reference

## Validation Workflow

```bash
# 1. Create client
npm run new-client myapp "My App"
# → Auto-validated config created ✅

# 2. Customize config
vim configs/myapp.config.js

# 3. Validate changes
npm run validate myapp
# → Shows errors if any ❌

# 4. Run app
CLIENT=myapp npm start
# → Validated on startup ✅
```

## Common Errors & Fixes

### ❌ Bundle Identifier Error

```
ios.bundleIdentifier: Must be a valid bundle identifier
```

**Common causes:**
```javascript
// ❌ Wrong
bundleIdentifier: 'com.ACME.app'        // Uppercase not allowed
bundleIdentifier: 'com.acme_app'        // Underscores not allowed (iOS)
bundleIdentifier: 'acme.app'            // Missing reverse domain

// ✅ Correct
bundleIdentifier: 'com.acme.app'
```

### ❌ Color Format Error

```
brandColors.primary: Must be a valid hex color (e.g., #FF5733)
```

**Common causes:**
```javascript
// ❌ Wrong
primary: 'FF5733'                       // Missing #
primary: '#F57'                         // Too short (need 6 digits)
primary: 'rgb(255, 87, 51)'            // Not hex format

// ✅ Correct
primary: '#FF5733'
```

### ❌ Android Package Error

```
android.package: Must be a valid Android package name
```

**Common causes:**
```javascript
// ❌ Wrong
package: 'com.ACME.app'                 // Uppercase not allowed
package: 'com.acme-app'                 // Hyphens not allowed (Android)

// ✅ Correct
package: 'com.acme.app'
package: 'com.acme_app'                 // Underscores OK for Android
```

### ❌ Asset Path Error

```
icon: Expected string to start with './assets/'
```

**Common causes:**
```javascript
// ❌ Wrong
icon: '/assets/icon.png'                // Absolute path
icon: 'assets/icon.png'                 // Missing ./

// ✅ Correct
icon: './assets/myapp/icon.png'
```

### ❌ URL Format Error

```
apiUrl: Must be a valid URL
```

**Common causes:**
```javascript
// ❌ Wrong
apiUrl: 'api.acme.com'                  // Missing protocol
apiUrl: 'ftp://api.acme.com'           // Wrong protocol

// ✅ Correct
apiUrl: 'https://api.acme.com'
```

### ❌ Email Format Error

```
supportEmail: Must be a valid email address
```

**Common causes:**
```javascript
// ❌ Wrong
supportEmail: 'support'                 // Not an email
supportEmail: 'support@'                // Incomplete
supportEmail: '@acme.com'               // Missing local part

// ✅ Correct
supportEmail: 'support@acme.com'
```

### ❌ Slug Format Error

```
slug: Must be lowercase, start with letter...
```

**Common causes:**
```javascript
// ❌ Wrong
slug: 'ACME'                           // Uppercase not allowed
slug: '1acme'                          // Can't start with number
slug: 'acme_business'                  // Underscores not allowed

// ✅ Correct
slug: 'acme-business'
slug: 'acme'
```

### ❌ Version Format Error

```
version: Must be semantic version format (e.g., 1.0.0)
```

**Common causes:**
```javascript
// ❌ Wrong
version: '1.0'                         // Missing patch version
version: 'v1.0.0'                      // No 'v' prefix
version: '1.0.0-beta'                  // No pre-release tags

// ✅ Correct
version: '1.0.0'
version: '2.3.14'
```

## Field Requirements

### Required Fields ✅

These fields MUST be present:

```javascript
{
  appName: string,           // 1-30 characters
  slug: string,              // Lowercase, hyphens OK
  scheme: string,            // Lowercase, hyphens OK
  icon: string,              // Asset path
  
  splash: {
    image: string,           // Asset path
    backgroundColor: string, // Hex color
  },
  
  ios: {
    bundleIdentifier: string, // Reverse domain
  },
  
  android: {
    package: string,         // Reverse domain
    adaptiveIcon: {
      foregroundImage: string, // Asset path
      backgroundColor: string, // Hex color
    },
  },
  
  brandColors: {
    primary: string,         // Hex color
    secondary: string,       // Hex color
    accent: string,          // Hex color
    background: string,      // Hex color
    text: string,            // Hex color
    error: string,           // Hex color
    success: string,         // Hex color
  },
}
```

### Optional Fields 📝

These fields are optional but validated if present:

```javascript
{
  version: string,           // Semantic version
  theme: 'light' | 'dark' | 'automatic',
  
  web: {
    favicon: string,         // Asset path
  },
  
  features: {
    [key: string]: boolean,  // Any feature flags
  },
  
  apiUrl: string,            // Valid URL
  supportEmail: string,      // Valid email
  locale: string,            // ISO code (en, es, etc.)
  supportedLocales: string[], // Array of ISO codes
}
```

## Format Reference

| Field Type | Format | Example |
|------------|--------|---------|
| Bundle ID | `[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+` | `com.acme.app` |
| Package | `[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+` | `com.acme.app` |
| Hex Color | `#[0-9A-Fa-f]{6}` | `#1E3A8A` |
| Slug | `[a-z][a-z0-9-]*` | `acme-business` |
| Version | `\d+\.\d+\.\d+` | `1.0.0` |
| Email | Standard email | `support@acme.com` |
| URL | `https?://...` | `https://api.acme.com` |
| Locale | `[a-z]{2}(-[A-Z]{2})?` | `en` or `en-US` |

## Validation Commands

```bash
# Validate specific client
npm run validate acme

# Validate before running
npm run validate myapp && CLIENT=myapp npm start

# List all clients (shows validation status)
npm run clients

# Create new client (auto-validated)
npm run new-client myapp "My App"
```

## Exit Codes

- **0**: Validation passed ✅
- **1**: Validation failed ❌

Use in CI/CD:
```bash
npm run validate acme && echo "Deploy!" || echo "Fix errors first!"
```

## Tips

1. **Copy from working configs**: Use `configs/default.config.js` as template
2. **Validate early**: Run validation before making changes
3. **Use consistent naming**: Keep bundle IDs same for iOS/Android
4. **Test immediately**: Validate → Test → Commit
5. **Read error messages**: They tell you exactly what's wrong

## Learn More

- [Full Validation Guide](ZOD_VALIDATION.md)
- [Zod Documentation](https://zod.dev)
- [Main README](../README.md)
