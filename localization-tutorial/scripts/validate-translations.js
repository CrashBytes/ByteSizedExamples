#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../react-i18next-example/src/locales');
const BASE_LOCALE = 'en-US';
const SUPPORTED_LOCALES = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ar-SA'];

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function findMissingKeys(baseKeys, targetKeys) {
  return baseKeys.filter(key => !targetKeys.includes(key));
}

function findExtraKeys(baseKeys, targetKeys) {
  return targetKeys.filter(key => !baseKeys.includes(key));
}

function validateTranslations() {
  console.log('Validating translation files...\n');
  
  const baseFilePath = path.join(LOCALES_DIR, `${BASE_LOCALE}.json`);
  const baseTranslations = loadJSON(baseFilePath);
  
  if (!baseTranslations) {
    console.error(`Failed to load base locale file: ${BASE_LOCALE}.json`);
    process.exit(1);
  }
  
  const baseKeys = getAllKeys(baseTranslations);
  console.log(`Base locale (${BASE_LOCALE}) has ${baseKeys.length} keys\n`);
  
  let hasErrors = false;
  const results = [];
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === BASE_LOCALE) continue;
    
    const localeFilePath = path.join(LOCALES_DIR, `${locale}.json`);
    
    if (!fs.existsSync(localeFilePath)) {
      console.error(`Missing translation file: ${locale}.json`);
      hasErrors = true;
      continue;
    }
    
    const translations = loadJSON(localeFilePath);
    if (!translations) {
      hasErrors = true;
      continue;
    }
    
    const localeKeys = getAllKeys(translations);
    const missingKeys = findMissingKeys(baseKeys, localeKeys);
    const extraKeys = findExtraKeys(baseKeys, localeKeys);
    
    results.push({
      locale,
      totalKeys: localeKeys.length,
      missingKeys,
      extraKeys,
      completeness: ((localeKeys.length - extraKeys.length) / baseKeys.length * 100).toFixed(2)
    });
  }
  
  for (const result of results) {
    console.log(`${result.locale}:`);
    console.log(`  Total keys: ${result.totalKeys}`);
    console.log(`  Completeness: ${result.completeness}%`);
    
    if (result.missingKeys.length > 0) {
      console.log(`  Missing keys (${result.missingKeys.length}):`);
      result.missingKeys.forEach(key => console.log(`    - ${key}`));
      hasErrors = true;
    }
    
    if (result.extraKeys.length > 0) {
      console.log(`  Extra keys (${result.extraKeys.length}):`);
      result.extraKeys.forEach(key => console.log(`    - ${key}`));
    }
    
    console.log('');
  }
  
  if (hasErrors) {
    console.error('Validation failed! Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('All translation files are valid!');
    process.exit(0);
  }
}

validateTranslations();
