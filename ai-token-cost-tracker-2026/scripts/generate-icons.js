/**
 * Simple Icon Generator for AI Token Cost Tracker
 * Creates SVG icons at 16x16, 48x48, and 128x128
 * 
 * Run: node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SVG icon with clean design
function createSVGIcon(size) {
  const strokeWidth = Math.max(1, size / 32);
  const fontSize = size * 0.55;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background circle with gradient -->
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#45a049;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Main circle background -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - strokeWidth}" fill="url(#grad${size})"/>
  
  <!-- Dollar sign -->
  <text x="50%" y="52%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="white">$</text>
  
  <!-- AI indicator dots (top right) -->
  <circle cx="${size * 0.72}" cy="${size * 0.28}" r="${size * 0.08}" fill="#FFD700"/>
  <circle cx="${size * 0.82}" cy="${size * 0.38}" r="${size * 0.06}" fill="#FFD700" opacity="0.8"/>
  <circle cx="${size * 0.78}" cy="${size * 0.20}" r="${size * 0.05}" fill="#FFD700" opacity="0.6"/>
</svg>`;
}

// Generate SVG files for each size
const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '../icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating extension icons...\n');

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✅ Created icon-${size}.svg`);
});

console.log('\n✨ Icons generated successfully!\n');
console.log('📝 Note: These are SVG files. Chrome extensions prefer PNG.');
console.log('\n🔄 To convert SVG to PNG:');
console.log('   1. Online: https://svgtopng.com/');
console.log('   2. CLI: brew install librsvg && rsvg-convert icon.svg > icon.png');
console.log('   3. Design tool: Open in Photoshop/GIMP and export as PNG');
console.log('\n💡 For the tutorial, SVG files work fine in Chrome!');
