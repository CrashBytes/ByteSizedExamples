import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';

const i18n = new I18n({
  en,
  es,
  fr,
});

// Set the locale from client config or device
const clientLocale = Constants.expoConfig?.extra?.locale;
i18n.locale = clientLocale || Localization.getLocales()[0]?.languageCode || 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function useTranslation() {
  return {
    t: (key: string, options?: any) => i18n.t(key, options),
    locale: i18n.locale,
    setLocale: (locale: string) => {
      i18n.locale = locale;
    },
  };
}
