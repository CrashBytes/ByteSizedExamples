/**
 * Dynamic App Configuration with Zod Validation
 * 
 * Usage:
 * - Default: expo start (uses configs/default.config.js)
 * - Client: CLIENT=acme expo start (uses configs/acme.config.js)
 * 
 * To add a new client:
 * 1. Create configs/[client-name].config.js
 * 2. Add assets to assets/[client-name]/
 * 3. Run: CLIENT=[client-name] expo start
 * 
 * The configuration is validated using Zod to catch errors early.
 * 
 * IMPORTANT: EAS Build requires a fixed slug across all clients.
 * The slug is always "whitelabel-app" regardless of client.
 * The appName changes per client for display purposes.
 */

const { validateClientConfig, formatZodErrors } = require('./validation/configSchema');

const clientName = process.env.CLIENT || 'default';

let clientConfig;
try {
  clientConfig = require(`./configs/${clientName}.config.js`);
  console.log(`✅ Loaded config for client: ${clientName}`);
} catch (error) {
  console.warn(`⚠️  Config not found for client: ${clientName}, falling back to default`);
  clientConfig = require('./configs/default.config.js');
}

// Validate configuration with Zod
const validation = validateClientConfig(clientConfig);

if (!validation.success) {
  console.error('\n❌ Configuration validation failed!\n');
  console.error('Client:', clientName);
  console.error('Config file:', `configs/${clientName}.config.js\n`);
  console.error('Errors:');
  formatZodErrors(validation.error).forEach(error => {
    console.error(`  - ${error}`);
  });
  console.error('\nPlease fix the configuration errors and try again.\n');
  process.exit(1);
}

console.log(`✅ Configuration validated successfully`);

// Use the validated config (with proper types)
const validatedConfig = validation.data;

export default ({ config }) => ({
  ...config,
  name: validatedConfig.appName,
  slug: 'whitelabel-app', // Fixed slug for EAS Build - DO NOT CHANGE
  version: validatedConfig.version || '1.0.0',
  orientation: 'portrait',
  icon: validatedConfig.icon,
  userInterfaceStyle: validatedConfig.theme || 'automatic',
  scheme: validatedConfig.scheme,
  
  splash: {
    image: validatedConfig.splash.image,
    resizeMode: validatedConfig.splash.resizeMode || 'contain',
    backgroundColor: validatedConfig.splash.backgroundColor,
  },
  
  assetBundlePatterns: ['**/*'],
  
  ios: {
    supportsTablet: true,
    bundleIdentifier: validatedConfig.ios.bundleIdentifier,
    icon: validatedConfig.ios.icon || validatedConfig.icon,
    infoPlist: {
      CFBundleDisplayName: validatedConfig.appName,
      ...validatedConfig.ios.infoPlist,
    },
  },
  
  android: {
    adaptiveIcon: {
      foregroundImage: validatedConfig.android.adaptiveIcon.foregroundImage,
      backgroundColor: validatedConfig.android.adaptiveIcon.backgroundColor,
    },
    package: validatedConfig.android.package,
    icon: validatedConfig.android.icon || validatedConfig.icon,
    permissions: validatedConfig.android.permissions || [],
  },
  
  web: {
    favicon: validatedConfig.web?.favicon || validatedConfig.icon,
    bundler: 'metro',
  },
  
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: validatedConfig.splash.backgroundColor,
        image: validatedConfig.splash.image,
        resizeMode: validatedConfig.splash.resizeMode || 'contain',
      },
    ],
  ],
  
  experiments: {
    typedRoutes: true,
  },
  
  extra: {
    eas: {
      projectId: 'bd36674c-bc24-445c-b55d-909f5187e704',
    },
    clientName,
    appName: validatedConfig.appName,
    slug: validatedConfig.slug,
    brandColors: validatedConfig.brandColors,
    features: validatedConfig.features || {},
    apiUrl: validatedConfig.apiUrl,
    supportEmail: validatedConfig.supportEmail,
    locale: validatedConfig.locale || 'en',
    version: validatedConfig.version,
  },
});
