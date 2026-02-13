import { describe, it, expect, beforeEach } from 'vitest';
import i18n from './config';
import { waitForI18n } from '../test/test-utils';

describe('i18n Configuration', () => {
  beforeEach(async () => {
    await waitForI18n();
  });

  describe('Initialization', () => {
    it('initializes i18next successfully', () => {
      expect(i18n.isInitialized).toBe(true);
    });

    it('has default language set', () => {
      expect(i18n.language).toBeDefined();
      expect(i18n.language).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    });

    it('has fallback language configured', () => {
      expect(i18n.options.fallbackLng).toContain('en-US');
    });
  });

  describe('Supported Languages', () => {
    const supportedLanguages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'];

    it('has all required languages available', () => {
      supportedLanguages.forEach((lang) => {
        expect(i18n.hasResourceBundle(lang, 'translation')).toBe(true);
      });
    });

    it('can switch to all supported languages', async () => {
      for (const lang of supportedLanguages) {
        await i18n.changeLanguage(lang);
        expect(i18n.language).toBe(lang);
      }
    });
  });

  describe('Translation Keys', () => {
    it('has product namespace translations', () => {
      const productKeys = [
        'product.addToCart',
        'product.notifyMe',
        'product.inStock_one',
        'product.inStock_other',
        'product.lowStock_one',
        'product.lowStock_other',
        'product.outOfStock',
      ];

      productKeys.forEach((key) => {
        expect(i18n.exists(key)).toBe(true);
      });
    });

    it('has common namespace translations', () => {
      const commonKeys = [
        'common.search',
        'common.searching',
        'common.resultsFound',
        'common.noResults',
        'common.selectLanguage',
      ];

      commonKeys.forEach((key) => {
        expect(i18n.exists(key)).toBe(true);
      });
    });
  });

  describe('Interpolation', () => {
    it('interpolates variables correctly', () => {
      const result = i18n.t('product.inStock', { count: 10 });
      expect(result).toContain('10');
    });

    it('handles missing interpolation values gracefully', () => {
      const result = i18n.t('product.inStock');
      expect(result).toBeDefined();
      expect(result).not.toContain('{{count}}');
    });
  });

  describe('Pluralization', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('en-US');
    });

    it('handles singular form correctly', () => {
      const result = i18n.t('product.inStock', { count: 1 });
      expect(result).toMatch(/1 item/i);
    });

    it('handles plural form correctly', () => {
      const result = i18n.t('product.inStock', { count: 10 });
      expect(result).toMatch(/10 items/i);
    });

    it('handles zero count', () => {
      const result = i18n.t('product.outOfStock');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Currency Formatting', () => {
    it('formats USD correctly', () => {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });
      expect(formatter.format(99.99)).toBe('$99.99');
    });

    it('formats EUR correctly', () => {
      const formatter = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      });
      const result = formatter.format(99.99);
      expect(result).toContain('99,99');
      expect(result).toContain('€');
    });

    it('formats JPY correctly (no decimals)', () => {
      const formatter = new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
      });
      const result = formatter.format(9999);
        expect(result).toContain('9,999');
        // Accept both ASCII and full-width Yen symbols for robustness
        expect(result).toMatch(/[¥￥]/);
    });
  });

  describe('Language Detection', () => {
    it('detects browser language', () => {
      // i18next should have detected some language
      expect(i18n.language).toBeTruthy();
    });

    it('falls back to default language for unsupported locales', async () => {
      await i18n.changeLanguage('xx-XX'); // Invalid language code
      
      // Should fall back to en-US
      const result = i18n.t('common.search');
      expect(result).toBe('Search');
    });
  });

  describe('Namespace Loading', () => {
    it('has translation namespace loaded', () => {
      expect(i18n.hasResourceBundle('en-US', 'translation')).toBe(true);
    });

    it('can access translations from namespace', () => {
      const result = i18n.t('product.addToCart');
      expect(result).toBeDefined();
      expect(result).not.toContain('product.addToCart'); // Should not return key
    });
  });

  describe('Translation Completeness', () => {
    it('all languages have the same keys as base language', async () => {
      const baseLanguage = 'en-US';
      const supportedLanguages = ['es-ES', 'fr-FR', 'de-DE', 'ja-JP'];

      await i18n.changeLanguage(baseLanguage);
      const baseKeys = Object.keys(i18n.getResourceBundle(baseLanguage, 'translation'));

      for (const lang of supportedLanguages) {
        await i18n.changeLanguage(lang);
        const langKeys = Object.keys(i18n.getResourceBundle(lang, 'translation'));

        expect(langKeys.length).toBeGreaterThan(0);
        // All base keys should exist in other languages
        baseKeys.forEach((key) => {
          expect(langKeys).toContain(key);
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('returns key when translation is missing', () => {
      const result = i18n.t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('handles invalid namespace gracefully', () => {
      const result = i18n.t('invalid:namespace.key');
      expect(result).toBeDefined();
    });
  });

  describe('Language Change Events', () => {
      it('emits event when language changes', () => {
        const originalLang = i18n.language;
        return new Promise((resolve, reject) => {
          i18n.on('languageChanged', (lng) => {
            try {
              expect(lng).not.toBe(originalLang);
              resolve(undefined);
            } catch (err) {
              reject(err);
            }
          });
          i18n.changeLanguage('fr-FR');
        });
      });
  });
});
