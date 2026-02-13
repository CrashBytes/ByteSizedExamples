import React from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, type SupportedLocale } from '../i18n/config';

export const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: SupportedLocale) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div className="language-switcher">
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value as SupportedLocale)}
        aria-label={t('languageSwitcher.label')}
      >
        {Object.entries(supportedLanguages).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <p className="help-text">
        {t('languageSwitcher.currentLanguage')}: {supportedLanguages[i18n.language as SupportedLocale]}
      </p>
    </div>
  );
};
