#!/usr/bin/env node

/**
 * Client Configuration Validator with Zod
 * 
 * Validates that a client config has all required fields and assets
 * Uses Zod schema for comprehensive type checking
 * 
 * Usage:
 *   node scripts/validate-config.js <client-name>
 *   node scripts/validate-config.js acme
 */

const fs = require('fs');
const path = require('path');
const { validateClientConfig, formatZodErrors } = require('../validation/configSchema');

const clientName = process.argv[2];

if (!clientName) {
  console.error('❌ Error: Please provide a client name');
  console.log('Usage: node scripts/validate-config.js <client-name>');
  process.exit(1);
}

const configPath = path.join(__dirname, '..', 'configs', `${clientName}.config.js`);

// Check if config exists
if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found: ${configPath}`);
  process.exit(1);
}

console.log(`\n🔍 Validating client: ${clientName}\n`);

// Load config
let config;
try {
  config = require(configPath);
  console.log('✅ Config file loaded successfully');
} catch (error) {
  console.error('❌ Error loading config:', error.message);
  process.exit(1);
}

const errors = [];
const warnings = [];

// Validate with Zod schema
console.log('🔍 Running Zod schema validation...');
const validation = validateClientConfig(config);

if (!validation.success) {
  console.log('❌ Zod validation failed\n');
  const zodErrors = formatZodErrors(validation.error);
  zodErrors.forEach(error => errors.push(error));
} else {
  console.log('✅ Zod schema validation passed');
}

// Check if assets exist
console.log('🔍 Checking asset files...');

const assetChecks = [
  { path: config.icon, name: 'icon.png', required: true },
  { path: config.splash?.image, name: 'splash.png', required: true },
  { path: config.android?.adaptiveIcon?.foregroundImage, name: 'adaptive-icon.png', required: true },
  { path: config.web?.favicon, name: 'favicon.png', required: false },
];

assetChecks.forEach(({ path: assetPath, name, required }) => {
  if (assetPath) {
    const fullPath = path.join(__dirname, '..', assetPath);
    if (!fs.existsSync(fullPath)) {
      const message = `Asset file not found: ${assetPath} (${name})`;
      if (required) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    } else {
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`✅ Found ${name} (${sizeKB} KB)`);
      
      // Warn about file sizes
      if (name === 'icon.png' && stats.size > 500 * 1024) {
        warnings.push(`${name} is large (${sizeKB} KB). Consider optimizing to under 500 KB`);
      }
      if (name === 'splash.png' && stats.size > 1000 * 1024) {
        warnings.push(`${name} is large (${sizeKB} KB). Consider optimizing to under 1 MB`);
      }
    }
  } else if (required) {
    errors.push(`Missing required asset path: ${name}`);
  }
});

// Additional best practice checks
console.log('🔍 Checking best practices...');

if (config.appName && config.appName.length > 15) {
  warnings.push(`App name is long (${config.appName.length} chars). Short names display better on home screens.`);
}

if (config.ios?.bundleIdentifier === config.android?.package) {
  console.log('✅ iOS bundle identifier matches Android package (good for consistency)');
}

if (config.supportedLocales && config.supportedLocales.length > 0) {
  console.log(`✅ Supports ${config.supportedLocales.length} locale(s): ${config.supportedLocales.join(', ')}`);
}

if (config.features) {
  const enabledFeatures = Object.entries(config.features).filter(([, enabled]) => enabled);
  console.log(`✅ ${enabledFeatures.length} feature(s) enabled: ${enabledFeatures.map(([name]) => name).join(', ')}`);
}

// Check for common mistakes
if (config.ios?.bundleIdentifier?.includes('_')) {
  warnings.push('iOS bundle identifiers should not contain underscores. Use dots or hyphens instead.');
}

if (config.android?.package?.includes('-')) {
  warnings.push('Android package names should not contain hyphens. Use underscores or dots instead.');
}

// Check color contrast for accessibility
if (config.brandColors) {
  const primary = config.brandColors.primary;
  const background = config.brandColors.background;
  
  if (primary && background) {
    // Simple luminance check (basic version)
    if (primary.toLowerCase() === background.toLowerCase()) {
      errors.push('Primary color and background color are the same. This will cause visibility issues.');
    }
  }
}

// Print results
console.log('\n' + '='.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ Validation passed! Config is ready to use.\n');
  console.log('Configuration Summary:');
  console.log(`  App Name: ${config.appName}`);
  console.log(`  Bundle ID (iOS): ${config.ios?.bundleIdentifier}`);
  console.log(`  Package (Android): ${config.android?.package}`);
  console.log(`  Scheme: ${config.scheme}`);
  console.log(`  Primary Color: ${config.brandColors?.primary}`);
  console.log('');
  console.log(`To run this client:\n  CLIENT=${clientName} npm start\n`);
  process.exit(0);
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:\n');
  errors.forEach(error => console.log(`  - ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach(warning => console.log(`  - ${warning}`));
}

console.log('\n' + '='.repeat(60) + '\n');

if (errors.length > 0) {
  console.log('Fix errors before using this configuration.\n');
  process.exit(1);
} else {
  console.log('✅ Validation passed with warnings.\n');
  console.log('Warnings are recommendations and won\'t prevent the app from running.\n');
  console.log(`To run this client:\n  CLIENT=${clientName} npm start\n`);
  process.exit(0);
}
