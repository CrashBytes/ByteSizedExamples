#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const placeholderPatterns = [
  /TODO/i,
  /FIXME/i,
  /TRANSLATE/i,
  /\[translation needed\]/i,
];

function checkPlaceholders(obj, locale, basePath = '') {
  const issues = [];
  
  for (const key in obj) {
    const fullPath = basePath ? `${basePath}.${key}` : key;
    
    if (typeof obj[key] === 'string') {
      placeholderPatterns.forEach((pattern) => {
        if (pattern.test(obj[key])) {
          issues.push(`${locale}:${fullPath} contains placeholder: "${obj[key]}"`);
        }
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      issues.push(...checkPlaceholders(obj[key], locale, fullPath));
    }
  }
  
  return issues;
}

console.log('Checking for placeholders in translation files...\n');

files.forEach(file => {
  const locale = path.basename(file, '.json');
  const content = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  const issues = checkPlaceholders(content, locale);
  
  if (issues.length > 0) {
    console.log(`❌ ${locale}:`);
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  } else {
    console.log(`✓ ${locale}: No placeholders found`);
  }
});
