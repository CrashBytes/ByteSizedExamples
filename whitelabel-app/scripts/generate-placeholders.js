#!/usr/bin/env node

/**
 * Asset Generator Helper
 * 
 * Creates placeholder SVG files that can be used for testing.
 * These should be replaced with real assets before production.
 * 
 * Usage:
 *   node scripts/generate-placeholders.js <client-name>
 *   node scripts/generate-placeholders.js acme
 */

const fs = require('fs');
const path = require('path');

const clientName = process.argv[2];

if (!clientName) {
  console.error('❌ Error: Please provide a client name');
  console.log('Usage: node scripts/generate-placeholders.js <client-name>');
  process.exit(1);
}

const configPath = path.join(__dirname, '..', 'configs', `${clientName}.config.js`);
const assetsPath = path.join(__dirname, '..', 'assets', clientName);

// Check if config exists
if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found: ${configPath}`);
  console.log('Create the client first with: npm run new-client');
  process.exit(1);
}

// Load config to get brand colors
let config;
try {
  config = require(configPath);
} catch (error) {
  console.error('❌ Error loading config:', error.message);
  process.exit(1);
}

console.log(`\n🎨 Generating placeholder assets for: ${clientName}\n`);

// Ensure assets directory exists
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
  console.log(`✅ Created assets directory: assets/${clientName}/`);
}

const primaryColor = config.brandColors?.primary || '#007AFF';
const backgroundColor = config.brandColors?.background || '#FFFFFF';
const textColor = config.brandColors?.text || '#000000';

// Generate icon.png (1024x1024)
const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${primaryColor}" rx="180"/>
  <text x="512" y="650" font-family="Arial, sans-serif" font-size="400" font-weight="bold" 
        text-anchor="middle" fill="${backgroundColor}">
    ${config.appName?.charAt(0)?.toUpperCase() || 'A'}
  </text>
</svg>`;

// Generate splash.png (1242x2436 - iPhone X resolution)
const splashSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1242" height="2436" xmlns="http://www.w3.org/2000/svg">
  <rect width="1242" height="2436" fill="${config.splash?.backgroundColor || primaryColor}"/>
  <circle cx="621" cy="1000" r="200" fill="${backgroundColor}" opacity="0.2"/>
  <text x="621" y="1250" font-family="Arial, sans-serif" font-size="120" font-weight="bold" 
        text-anchor="middle" fill="${backgroundColor}">
    ${config.appName || 'App'}
  </text>
</svg>`;

// Generate adaptive-icon.png (1024x1024)
const adaptiveIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <circle cx="512" cy="512" r="400" fill="${primaryColor}"/>
  <text x="512" y="650" font-family="Arial, sans-serif" font-size="400" font-weight="bold" 
        text-anchor="middle" fill="${backgroundColor}">
    ${config.appName?.charAt(0)?.toUpperCase() || 'A'}
  </text>
</svg>`;

// Generate favicon.png (48x48)
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="${primaryColor}" rx="8"/>
  <text x="24" y="36" font-family="Arial, sans-serif" font-size="30" font-weight="bold" 
        text-anchor="middle" fill="${backgroundColor}">
    ${config.appName?.charAt(0)?.toUpperCase() || 'A'}
  </text>
</svg>`;

// Save SVG files
const assets = [
  { name: 'icon.png', content: iconSvg, size: '1024x1024' },
  { name: 'splash.png', content: splashSvg, size: '1242x2436' },
  { name: 'adaptive-icon.png', content: adaptiveIconSvg, size: '1024x1024' },
  { name: 'favicon.png', content: faviconSvg, size: '48x48' },
];

assets.forEach(({ name, content, size }) => {
  const filePath = path.join(assetsPath, name);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Generated ${name} (${size}) - SVG placeholder`);
});

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANT: These are SVG placeholders!\n');
console.log('SVG files work for development and testing, but you should:');
console.log('1. Convert to PNG for production builds');
console.log('2. Use proper design tools (Figma, Sketch, etc.)');
console.log('3. Follow exact size requirements');
console.log('4. Compress final PNG files\n');
console.log('For now, you can test the app with these placeholders.');
console.log('\nNext steps:');
console.log(`1. Validate: npm run validate ${clientName}`);
console.log(`2. Test: CLIENT=${clientName} npm start`);
console.log('\n' + '='.repeat(60) + '\n');
