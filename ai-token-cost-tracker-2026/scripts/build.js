/**
 * Build Script for Chrome Extension
 * 
 * This script:
 * 1. Creates dist directory structure
 * 2. Copies static files (HTML, CSS, icons, manifest)
 * 3. Runs Rollup to bundle JavaScript
 * 
 * Run: node scripts/build.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('🔨 Building Chrome Extension...\n');

// Step 1: Clean dist directory
console.log('🧹 Cleaning dist directory...');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

// Step 2: Create subdirectories
console.log('📁 Creating directory structure...');
const dirs = ['popup', 'options', 'icons'];
dirs.forEach(dir => {
  fs.mkdirSync(path.join(distDir, dir), { recursive: true });
});

// Step 3: Copy static files
console.log('📋 Copying static files...');

// Copy manifest.json (update paths to point to dist files)
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
// Manifest paths are already correct (relative from dist root)
fs.writeFileSync(
  path.join(distDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('  ✅ manifest.json');

// Copy HTML files
const htmlFiles = [
  { src: 'popup/popup.html', dest: 'popup/popup.html' },
  { src: 'options/options.html', dest: 'options/options.html' }
];
htmlFiles.forEach(({ src, dest }) => {
  const content = fs.readFileSync(path.join(rootDir, src), 'utf8');
  // Update script src to point to bundled JS
  const updated = content
    .replace('src="popup.js"', 'src="popup.js"')
    .replace('src="options.js"', 'src="options.js"');
  fs.writeFileSync(path.join(distDir, dest), updated);
  console.log(`  ✅ ${dest}`);
});

// Copy CSS files
const cssFiles = [
  { src: 'popup/popup.css', dest: 'popup/popup.css' },
  { src: 'options/options.css', dest: 'options/options.css' }
];
cssFiles.forEach(({ src, dest }) => {
  fs.copyFileSync(path.join(rootDir, src), path.join(distDir, dest));
  console.log(`  ✅ ${dest}`);
});

// Copy all icons
console.log('  🎨 Copying icons...');
const iconsDir = path.join(rootDir, 'icons');
const distIconsDir = path.join(distDir, 'icons');
fs.readdirSync(iconsDir).forEach(file => {
  if (file.endsWith('.svg') || file.endsWith('.png')) {
    fs.copyFileSync(
      path.join(iconsDir, file),
      path.join(distIconsDir, file)
    );
    console.log(`    ✅ icons/${file}`);
  }
});

// Step 4: Run Rollup to bundle JavaScript
console.log('\n📦 Bundling JavaScript with Rollup...');
try {
  execSync('npx rollup -c', { stdio: 'inherit', cwd: rootDir });
  console.log('  ✅ JavaScript bundled successfully');
} catch (error) {
  console.error('  ❌ Rollup bundling failed');
  process.exit(1);
}

// Step 5: Verify build
console.log('\n✅ Build complete!\n');
console.log('📦 Extension files ready in: dist/');
console.log('\n🚀 To load in Chrome:');
console.log('  1. Open chrome://extensions/');
console.log('  2. Enable "Developer mode"');
console.log('  3. Click "Load unpacked"');
console.log('  4. Select the "dist" folder\n');

// List dist contents
console.log('📁 Build output:');
const listDir = (dir, prefix = '') => {
  const files = fs.readdirSync(dir);
  files.forEach((file, index) => {
    const isLast = index === files.length - 1;
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    const icon = stats.isDirectory() ? '📁' : '📄';
    console.log(`${prefix}${isLast ? '└──' : '├──'} ${icon} ${file}`);
    if (stats.isDirectory() && file !== 'node_modules') {
      listDir(fullPath, prefix + (isLast ? '    ' : '│   '));
    }
  });
};
listDir(distDir);

console.log('\n✨ Ready to test!\n');
