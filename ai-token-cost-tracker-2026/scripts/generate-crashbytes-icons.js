/**
 * CrashBytes-Branded Icon Generator
 * AI Token Cost Tracker Extension
 * 
 * Run: node scripts/generate-crashbytes-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CrashBytes brand colors
const GRADIENT = {
  start: '#2563eb',  // Blue
  mid: '#7c3aed',    // Purple
  end: '#db2777'     // Pink
};

// Create branded icon with cost indicator
function createBrandedIcon(size) {
  const cornerRadius = Math.max(3, size / 5.3);
  const strokeWidth = Math.max(1.8, size / 8.9);
  const dollarSize = size * 0.4;
  const dollarY = size * 0.58; // Slightly below center
  
  // Scale the C path based on size
  const cScale = size / 16;
  const cPath = `M ${11 * cScale} ${8 * cScale} 
                 A ${4 * cScale} ${4 * cScale} 0 0 1 ${7 * cScale} ${12 * cScale} 
                 A ${4 * cScale} ${4 * cScale} 0 0 1 ${3 * cScale} ${8 * cScale} 
                 A ${4 * cScale} ${4 * cScale} 0 0 1 ${7 * cScale} ${4 * cScale}`;
  
  // Byte dots positions (scaled)
  const dotSize = Math.max(0.8, size / 20);
  const dotX = size * 0.78;
  const dot1Y = size * 0.34;
  const dot2Y = size * 0.50;
  const dot3Y = size * 0.66;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="cbGrad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${GRADIENT.start}"/>
      <stop offset="50%" style="stop-color:${GRADIENT.mid}"/>
      <stop offset="100%" style="stop-color:${GRADIENT.end}"/>
    </linearGradient>
  </defs>
  
  <!-- CrashBytes Background -->
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#cbGrad${size})"/>
  
  <!-- CrashBytes "C" -->
  <path d="${cPath}" 
        fill="none" 
        stroke="white" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        opacity="0.9"/>
  
  <!-- Dollar Sign (Cost Indicator) -->
  <text x="50%" y="${dollarY}" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="${dollarSize}" 
        font-weight="bold" 
        fill="white"
        opacity="0.95">$</text>
  
  <!-- Byte/AI Dots -->
  <circle cx="${dotX}" cy="${dot1Y}" r="${dotSize}" fill="white" opacity="0.8"/>
  <circle cx="${dotX}" cy="${dot2Y}" r="${dotSize}" fill="white" opacity="0.8"/>
  <circle cx="${dotX}" cy="${dot3Y}" r="${dotSize}" fill="white" opacity="0.8"/>
</svg>`;
}

// Generate icons for all sizes
const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '../icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating CrashBytes-branded extension icons...\n');

sizes.forEach(size => {
  const svg = createBrandedIcon(size);
  const filename = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✅ Created icon-${size}.svg (CrashBytes branded)`);
});

console.log('\n✨ CrashBytes-branded icons generated successfully!\n');
console.log('🎨 Design Features:');
console.log('   • CrashBytes gradient (Blue → Purple → Pink)');
console.log('   • "C" brand element');
console.log('   • $ symbol (cost tracking)');
console.log('   • Byte dots (brand identity)\n');
console.log('📝 These SVG files work perfectly in Chrome!');
console.log('💡 For PNG conversion, use: node scripts/convert-icons.js\n');
