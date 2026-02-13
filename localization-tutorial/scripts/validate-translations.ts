import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseLocale = 'en-US';
const localesDir = path.join(__dirname, '../react-i18next-example/src/locales');

const getKeys = (obj: any, prefix = ''): string[] => {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = [...keys, ...getKeys(value, fullKey)];
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
};

const baseFile = JSON.parse(
  fs.readFileSync(path.join(localesDir, `${baseLocale}.json`), 'utf-8')
);
const baseKeys = new Set(getKeys(baseFile));

const localeFiles = fs.readdirSync(localesDir)
  .filter(f => f.endsWith('.json') && f !== `${baseLocale}.json`);

let hasErrors = false;

console.log(`\n📋 Validating translations against base language (${baseLocale})\n`);
console.log(`Base language has ${baseKeys.size} translation keys\n`);

for (const file of localeFiles) {
  const locale = file.replace('.json', '');
  const localeFile = JSON.parse(
    fs.readFileSync(path.join(localesDir, file), 'utf-8')
  );
  const localeKeys = new Set(getKeys(localeFile));
  
  const missingKeys = [...baseKeys].filter(k => !localeKeys.has(k));
  const extraKeys = [...localeKeys].filter(k => !baseKeys.has(k));
  
  if (missingKeys.length > 0) {
    console.error(`❌ ${locale}: Missing ${missingKeys.length} keys`);
    missingKeys.forEach(k => console.error(`  - ${k}`));
    hasErrors = true;
  }
  
  if (extraKeys.length > 0) {
    console.warn(`\n⚠️  ${locale}: ${extraKeys.length} extra keys (may be outdated)`);
    extraKeys.forEach(k => console.warn(`  - ${k}`));
  }
  
  if (missingKeys.length === 0 && extraKeys.length === 0) {
    console.log(`✅ ${locale}: Complete (${localeKeys.size} keys)`);
  }
  
  console.log('');
}

if (hasErrors) {
  console.error('❌ Translation validation failed\n');
  process.exit(1);
} else {
  console.log('✅ All translations are complete\n');
  process.exit(0);
}
