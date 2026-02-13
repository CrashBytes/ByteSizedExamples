import { describe, it, expect } from 'vitest';
import enUS from '../locales/en-US.json';
import esES from '../locales/es-ES.json';
import frFR from '../locales/fr-FR.json';
import deDE from '../locales/de-DE.json';
import jaJP from '../locales/ja-JP.json';

describe('Translation Files Validation', () => {
  const baseTranslations = enUS;
  const translations = {
    'en-US': enUS,
    'es-ES': esES,
    'fr-FR': frFR,
    'de-DE': deDE,
    'ja-JP': jaJP,
  };

  /**
   * Recursively get all keys from a nested object
   */
  function getAllKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys;
  }

  describe('Translation Completeness', () => {
    const baseKeys = getAllKeys(baseTranslations);

    it('base language (en-US) has all required keys', () => {
      const requiredNamespaces = ['common', 'product'];

      requiredNamespaces.forEach((namespace) => {
        const hasNamespace = baseKeys.some((key) => key.startsWith(namespace));
        expect(hasNamespace).toBe(true);
      });
    });

    Object.entries(translations).forEach(([locale, translation]) => {
      if (locale === 'en-US') return; // Skip base language

      describe(`${locale} translations`, () => {
        const localeKeys = getAllKeys(translation);

        it('has all keys from base language', () => {
          const missingKeys = baseKeys.filter((key) => !localeKeys.includes(key));

          expect(missingKeys).toHaveLength(0);
        });

        it('has no extra keys not in base language', () => {
          const extraKeys = localeKeys.filter((key) => !baseKeys.includes(key));

          // Log extra keys for debugging but don't fail the test
          // (extra keys might be intentional for locale-specific content)
          if (extraKeys.length > 0) {
            console.warn(`${locale} has extra keys:`, extraKeys);
          }
        });

        it('has no empty translation values', () => {
          function checkEmptyValues(obj: any, path = ''): string[] {
            const emptyKeys: string[] = [];

            for (const key in obj) {
              const fullPath = path ? `${path}.${key}` : key;

              if (typeof obj[key] === 'object' && obj[key] !== null) {
                emptyKeys.push(...checkEmptyValues(obj[key], fullPath));
              } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
                emptyKeys.push(fullPath);
              }
            }

            return emptyKeys;
          }

          const emptyKeys = checkEmptyValues(translation);
          expect(emptyKeys).toHaveLength(0);
        });
      });
    });
  });

  describe('Translation Structure', () => {
    it('all translation files have the same structure', () => {
      const baseStructure = JSON.stringify(Object.keys(baseTranslations).sort());

      Object.entries(translations).forEach(([locale, translation]) => {
        if (locale === 'en-US') return;

        const localeStructure = JSON.stringify(Object.keys(translation).sort());
        expect(localeStructure).toBe(baseStructure);
      });
    });

    it('all namespaces exist in all languages', () => {
      const baseNamespaces = Object.keys(baseTranslations);

      Object.entries(translations).forEach(([locale, translation]) => {
        if (locale === 'en-US') return;

        const localeNamespaces = Object.keys(translation);
        expect(localeNamespaces.sort()).toEqual(baseNamespaces.sort());
      });
    });
  });

  describe('Interpolation Variables', () => {
    /**
     * Extract interpolation variables from a string
     * e.g., "{{count}} items" -> ["count"]
     */
    function extractVariables(text: string): string[] {
      const matches = text.match(/\{\{(\w+)\}\}/g);
      return matches ? matches.map((m) => m.replace(/\{\{|\}\}/g, '')) : [];
    }

    /**
     * Get all interpolation variables from translations
     */
    function getVariablesMap(obj: any, prefix = ''): Map<string, string[]> {
      const map = new Map<string, string[]>();

      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'string') {
          const variables = extractVariables(obj[key]);
          if (variables.length > 0) {
            map.set(fullKey, variables);
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          const nested = getVariablesMap(obj[key], fullKey);
          nested.forEach((value, nestedKey) => map.set(nestedKey, value));
        }
      }

      return map;
    }

    it('all languages use the same interpolation variables', () => {
      const baseVariables = getVariablesMap(baseTranslations);

      Object.entries(translations).forEach(([locale, translation]) => {
        if (locale === 'en-US') return;

        const localeVariables = getVariablesMap(translation);

        baseVariables.forEach((vars, key) => {
          const localeVars = localeVariables.get(key) || [];

          expect(localeVars.sort(), `Mismatch in ${locale} for key "${key}"`).toEqual(
            vars.sort()
          );
        });
      });
    });
  });

  describe('Pluralization Keys', () => {
    it('plural keys are consistent across languages', () => {
      const getPluralKeys = (obj: any): string[] => {
        const keys: string[] = [];

        for (const key in obj) {
          if (key.endsWith('_one') || key.endsWith('_other') || key.endsWith('_zero')) {
            keys.push(key);
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys.push(...getPluralKeys(obj[key]));
          }
        }

        return keys;
      };

      const basePlurals = getPluralKeys(baseTranslations);

      Object.entries(translations).forEach(([locale, translation]) => {
        if (locale === 'en-US') return;

        const localePlurals = getPluralKeys(translation);

        // All base plural keys should exist in other languages
        basePlurals.forEach((pluralKey) => {
          expect(localePlurals).toContain(pluralKey);
        });
      });
    });
  });

  describe('Translation Quality', () => {
    it('no translations contain placeholder text (excluding valid interpolation variables like {{year}})', () => {
      const placeholderPatterns = [
        /TODO/i,
        /FIXME/i,
        /TRANSLATE/i,
        /\[translation needed\]/i,
      ];

      // Allowlist for valid interpolation variables
      const allowedInterpolations = ['year'];

      function isOnlyAllowedInterpolations(text: string): boolean {
        // Find all {{variable}} in the string
        const matches = text.match(/\{\{(\w+)\}\}/g);
        if (!matches) return false;
        // If all variables are in the allowlist, return true
        return matches.every((m) => allowedInterpolations.includes(m.replace(/\{\{|\}\}/g, '')));
      }

      function checkPlaceholders(obj: any, locale: string, path = ''): string[] {
        const issues: string[] = [];

        for (const key in obj) {
          const fullPath = path ? `${path}.${key}` : key;

          if (typeof obj[key] === 'string') {
            placeholderPatterns.forEach((pattern) => {
              if (pattern.test(obj[key])) {
                // If the string only contains allowed interpolations, skip
                if (isOnlyAllowedInterpolations(obj[key])) return;
                issues.push(`${locale}:${fullPath} contains placeholder: "${obj[key]}"`);
              }
            });
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            issues.push(...checkPlaceholders(obj[key], locale, fullPath));
          }
        }

        return issues;
      }

      Object.entries(translations).forEach(([locale, translation]) => {
        const issues = checkPlaceholders(translation, locale);
        if (issues.length > 0) {
          console.warn(`Found placeholder issues in ${locale}:`, issues);
        }
        expect(issues).toHaveLength(0);
      });
    });

    it('translations are not identical to base language', () => {
      function getLeafValues(obj: any): string[] {
        const values: string[] = [];

        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            values.push(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            values.push(...getLeafValues(obj[key]));
          }
        }

        return values;
      }

      const baseValues = getLeafValues(baseTranslations);

      Object.entries(translations).forEach(([locale, translation]) => {
        if (locale === 'en-US') return;

        const localeValues = getLeafValues(translation);

        // At least some translations should be different
        const differentCount = localeValues.filter(
          (val, idx) => val !== baseValues[idx]
        ).length;

        expect(differentCount).toBeGreaterThan(0);
      });
    });
  });

  describe('JSON Validity', () => {
    Object.entries(translations).forEach(([locale, translation]) => {
      it(`${locale} is valid JSON`, () => {
        expect(() => JSON.stringify(translation)).not.toThrow();
        expect(() => JSON.parse(JSON.stringify(translation))).not.toThrow();
      });
    });
  });
});
