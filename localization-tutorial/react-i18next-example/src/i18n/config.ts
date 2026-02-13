import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enUS from '../locales/en-US.json';
import esES from '../locales/es-ES.json';
import frFR from '../locales/fr-FR.json';
import deDE from '../locales/de-DE.json';
import jaJP from '../locales/ja-JP.json';
import arSA from '../locales/ar-SA.json';

// Define available languages
export const supportedLanguages = {
  'en-US': 'English',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'ja-JP': '日本語',
  'ar-SA': 'العربية'
} as const;

export type SupportedLocale = keyof typeof supportedLanguages;

// Configure i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    debug: import.meta.env.DEV,
    fallbackLng: 'en-US',
    supportedLngs: Object.keys(supportedLanguages),
    
    // Load translations
    resources: {
      'en-US': { translation: enUS },
      'es-ES': { translation: esES },
      'fr-FR': { translation: frFR },
      'de-DE': { translation: deDE },
      'ja-JP': { translation: jaJP },
      'ar-SA': { translation: arSA }
    },
    
    // Language detection options
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng'
    },
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    // Enable pluralization
    pluralSeparator: '_',
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation']
  });

export default i18n;
