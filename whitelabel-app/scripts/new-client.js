#!/usr/bin/env node

/**
 * New Client Generator with Zod Validation
 * 
 * Creates a new client configuration and asset directories
 * Generated configs are pre-validated with Zod schema
 * 
 * Usage:
 *   node scripts/new-client.js <client-name> <app-name>
 *   node scripts/new-client.js techcorp "TechCorp Solutions"
 */

const fs = require('fs');
const path = require('path');
const { validateClientConfig, formatZodErrors } = require('../validation/configSchema');

const [,, clientSlug, appName] = process.argv;

if (!clientSlug || !appName) {
  console.error('❌ Error: Missing required arguments');
  console.log('\nUsage: node scripts/new-client.js <client-slug> <app-name>');
  console.log('Example: node scripts/new-client.js techcorp "TechCorp Solutions"');
  process.exit(1);
}

// Validate client slug format (matches Zod schema)
if (!/^[a-z][a-z0-9-]*$/.test(clientSlug)) {
  console.error('❌ Error: Client slug must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
  process.exit(1);
}

// Validate app name length
if (appName.length > 30) {
  console.error('❌ Error: App name too long (max 30 characters). This is an Apple requirement.');
  process.exit(1);
}

const configPath = path.join(__dirname, '..', 'configs', `${clientSlug}.config.js`);
const assetsPath = path.join(__dirname, '..', 'assets', clientSlug);

// Check if client already exists
if (fs.existsSync(configPath)) {
  console.error(`❌ Error: Client config already exists: ${configPath}`);
  process.exit(1);
}

console.log(`\n🎨 Creating new client: ${clientSlug}\n`);

// Generate bundle identifiers
const bundleId = `com.${clientSlug.replace(/-/g, '')}.app`;
const packageName = bundleId;

// Create config object
const configObject = {
  // App Identity
  appName: appName,
  slug: `${clientSlug}-app`,
  version: '1.0.0',
  scheme: clientSlug,
  
  // Assets
  icon: `./assets/${clientSlug}/icon.png`,
  
  splash: {
    image: `./assets/${clientSlug}/splash.png`,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  
  // Platform-specific
  ios: {
    bundleIdentifier: bundleId,
    icon: `./assets/${clientSlug}/icon.png`,
    infoPlist: {
      LSApplicationQueriesSchemes: [clientSlug],
    },
  },
  
  android: {
    package: packageName,
    icon: `./assets/${clientSlug}/icon.png`,
    adaptiveIcon: {
      foregroundImage: `./assets/${clientSlug}/adaptive-icon.png`,
      backgroundColor: '#ffffff',
    },
  },
  
  web: {
    favicon: `./assets/${clientSlug}/favicon.png`,
  },
  
  // Brand Colors (customize these!)
  brandColors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#FF9500',
    background: '#FFFFFF',
    text: '#000000',
    error: '#FF3B30',
    success: '#34C759',
  },
  
  // Features
  features: {
    auth: true,
    darkMode: true,
    analytics: true,
    pushNotifications: true,
  },
  
  // API & Support
  apiUrl: `https://api.${clientSlug}.com`,
  supportEmail: `support@${clientSlug}.com`,
  
  // Localization
  locale: 'en',
  supportedLocales: ['en'],
};

// Validate the generated config with Zod
console.log('🔍 Validating generated configuration with Zod...');
const validation = validateClientConfig(configObject);

if (!validation.success) {
  console.error('\n❌ Generated config failed validation!\n');
  console.error('This is a bug in the generator. Please report it.\n');
  console.error('Errors:');
  formatZodErrors(validation.error).forEach(error => {
    console.error(`  - ${error}`);
  });
  process.exit(1);
}

console.log('✅ Generated config passed Zod validation');

// Convert config object to file content
const configTemplate = `/**
 * ${appName} Client Configuration
 * 
 * Generated: ${new Date().toISOString()}
 * Validated with Zod schema
 * 
 * Usage: CLIENT=${clientSlug} expo start
 */

module.exports = ${JSON.stringify(configObject, null, 2)};
`;

// Create assets README
const assetsReadme = `# ${appName} Assets

Place ${appName}-branded image files in this directory:

## Required Files

### icon.png
- **Size**: 1024x1024px
- **Format**: PNG with transparency
- **Brand**: ${appName} logo
- **Purpose**: App icon for iOS and Android

### splash.png
- **Size**: 1242x2436px (iPhone X resolution)
- **Format**: PNG
- **Brand**: ${appName} splash screen
- **Purpose**: Launch screen shown while app loads

### adaptive-icon.png
- **Size**: 1024x1024px
- **Format**: PNG with transparency
- **Brand**: ${appName} logo for Android
- **Purpose**: Android adaptive icon foreground
- **Note**: Keep important elements in center 66% circle

### favicon.png
- **Size**: 48x48px
- **Format**: PNG
- **Brand**: Simplified ${appName} icon
- **Purpose**: Web favicon

## Testing

Run with ${appName} config:
\`\`\`bash
CLIENT=${clientSlug} npm start
\`\`\`

## Validation

Validate configuration and assets:
\`\`\`bash
npm run validate ${clientSlug}
\`\`\`

## Asset Checklist

- [ ] icon.png created (1024x1024px)
- [ ] splash.png created (1242x2436px)
- [ ] adaptive-icon.png created (1024x1024px)
- [ ] favicon.png created (48x48px)
- [ ] All assets optimized (compressed)
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator
- [ ] Tested on web browser
- [ ] Validated with npm run validate ${clientSlug}

## Asset Optimization Tips

- Use [TinyPNG](https://tinypng.com) to compress PNG files
- Test on multiple device sizes
- Ensure icons look good at small sizes (60px)
- Verify splash screen on different screen ratios
- Keep file sizes reasonable (icon < 500KB, splash < 1MB)
`;

try {
  // Create config file
  fs.writeFileSync(configPath, configTemplate);
  console.log(`✅ Created config: configs/${clientSlug}.config.js`);
  
  // Create assets directory
  fs.mkdirSync(assetsPath, { recursive: true });
  console.log(`✅ Created assets directory: assets/${clientSlug}/`);
  
  // Create assets README
  fs.writeFileSync(path.join(assetsPath, 'README.md'), assetsReadme);
  console.log(`✅ Created assets README: assets/${clientSlug}/README.md`);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Client created successfully!\n');
  console.log('Configuration validated with Zod ✅\n');
  console.log('Next steps:\n');
  console.log(`1. Customize brand colors in configs/${clientSlug}.config.js`);
  console.log(`2. Add required assets to assets/${clientSlug}/`);
  console.log(`   - icon.png (1024x1024px)`);
  console.log(`   - splash.png (1242x2436px)`);
  console.log(`   - adaptive-icon.png (1024x1024px)`);
  console.log(`   - favicon.png (48x48px)`);
  console.log(`3. Validate config: npm run validate ${clientSlug}`);
  console.log(`4. Test app: CLIENT=${clientSlug} npm start`);
  console.log('\n' + '='.repeat(60) + '\n');
  
} catch (error) {
  console.error('❌ Error creating client:', error.message);
  process.exit(1);
}
