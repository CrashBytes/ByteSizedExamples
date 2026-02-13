/**
 * SVG to PNG Converter for Extension Icons
 * 
 * This script provides instructions for converting SVG icons to PNG.
 * For the tutorial, we'll use a manual approach since it's more educational.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📝 SVG to PNG Conversion Guide\n');
console.log('Your SVG icons are ready at: icons/icon-{16,48,128}.svg\n');
console.log('🔧 Quick Conversion Options:\n');
console.log('Option 1 - Online (Easiest):');
console.log('  1. Visit https://svgtopng.com/');
console.log('  2. Upload each SVG file');
console.log('  3. Download the PNG');
console.log('  4. Save as icon-16.png, icon-48.png, icon-128.png\n');

console.log('Option 2 - Command Line (macOS/Linux):');
console.log('  brew install librsvg');
console.log('  rsvg-convert icons/icon-16.svg -o icons/icon-16.png');
console.log('  rsvg-convert icons/icon-48.svg -o icons/icon-48.png');
console.log('  rsvg-convert icons/icon-128.svg -o icons/icon-128.png\n');

console.log('Option 3 - Design Tools:');
console.log('  - Open each SVG in Photoshop/GIMP/Figma');
console.log('  - Export/Save as PNG at correct size');
console.log('  - Ensure background is transparent\n');

console.log('💡 For Development: SVG files work in Chrome during testing!');
console.log('   Just update manifest.json to use .svg instead of .png');
console.log('   For production, use PNG files for best compatibility.\n');

// Create a simple HTML converter as fallback
const htmlConverter = `<!DOCTYPE html>
<html>
<head>
  <title>SVG to PNG Converter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    .converter {
      border: 2px dashed #ccc;
      padding: 30px;
      text-align: center;
      margin: 20px 0;
    }
    canvas {
      border: 1px solid #ddd;
      margin: 10px;
    }
    button {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      border-radius: 4px;
      margin: 5px;
    }
    button:hover {
      background: #45a049;
    }
  </style>
</head>
<body>
  <h1>🎨 SVG to PNG Icon Converter</h1>
  <p>This tool converts your SVG icons to PNG format for the Chrome extension.</p>
  
  <div class="converter">
    <h2>Drop SVG files here or click to upload</h2>
    <input type="file" id="fileInput" accept=".svg" multiple style="display: none;">
    <button onclick="document.getElementById('fileInput').click()">Choose SVG Files</button>
    <div id="canvasContainer"></div>
  </div>

  <script>
    const fileInput = document.getElementById('fileInput');
    const container = document.getElementById('canvasContainer');

    fileInput.addEventListener('change', (e) => {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // Determine size from filename
            const match = file.name.match(/icon-(\\d+)/);
            const size = match ? parseInt(match[1]) : 128;
            
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);
            
            container.appendChild(canvas);
            
            const btn = document.createElement('button');
            btn.textContent = \`Download icon-\${size}.png\`;
            btn.onclick = () => {
              canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`icon-\${size}.png\`;
                a.click();
              });
            };
            container.appendChild(btn);
            container.appendChild(document.createElement('br'));
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    // Drag and drop
    document.querySelector('.converter').addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.querySelector('.converter').addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event('change'));
    });
  </script>
</body>
</html>`;

const htmlPath = path.join(__dirname, '../icons/convert.html');
fs.writeFileSync(htmlPath, htmlConverter);
console.log('✅ Created icons/convert.html - Open in browser to convert SVG to PNG!');
