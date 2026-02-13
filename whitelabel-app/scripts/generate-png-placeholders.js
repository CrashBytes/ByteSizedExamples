#!/usr/bin/env node

/**
 * PNG Placeholder Generator
 * 
 * Creates simple base64-encoded PNG files for testing
 * 
 * Usage:
 *   node scripts/generate-png-placeholders.js <client-name>
 */

const fs = require('fs');
const path = require('path');

const clientName = process.argv[2];

if (!clientName) {
  console.error('❌ Error: Please provide a client name');
  console.log('Usage: node scripts/generate-png-placeholders.js <client-name>');
  process.exit(1);
}

const assetsPath = path.join(__dirname, '..', 'assets', clientName);

if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
}

console.log(`\n🎨 Generating PNG placeholder assets for: ${clientName}\n`);

// Simple 1024x1024 blue square PNG (base64)
const iconPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Simple 1242x2436 blue square PNG (base64)
const splashPng = iconPng; // Using same for simplicity

// Simple 1024x1024 adaptive icon PNG (base64)
const adaptiveIconPng = iconPng;

// Simple 48x48 favicon PNG (base64)
const faviconPng = iconPng;

const assets = [
  { name: 'icon.png', content: iconPng },
  { name: 'splash.png', content: splashPng },
  { name: 'adaptive-icon.png', content: adaptiveIconPng },
  { name: 'favicon.png', content: faviconPng },
];

assets.forEach(({ name, content }) => {
  const filePath = path.join(assetsPath, name);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Generated ${name} - Simple PNG placeholder`);
});

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  These are minimal 1x1 pixel PNGs for testing only!\n');
console.log('They work but you should replace them with proper assets.');
console.log('\nNext steps:');
console.log(`1. Validate: npm run validate ${clientName}`);
console.log(`2. Test: CLIENT=${clientName} npm start`);
console.log('\n' + '='.repeat(60) + '\n');
