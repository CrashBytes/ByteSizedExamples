import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

/**
 * LanguageSwitcher allows users to change the application language.
 * This component demonstrates:
 * - Language selection dropdown
 * - Real-time language switching
 * - Integration with i18next
 */
const meta = {
  title: 'Components/LanguageSwitcher',
  component: LanguageSwitcher,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const { i18n, t } = useTranslation();
      const locale = context.globals.locale || 'en-US';
      
      useEffect(() => {
        i18n.changeLanguage(locale);
      }, [locale, i18n]);
      
      return (
        <div style={{ padding: '2rem' }}>
          <Story />
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <p><strong>{t('common.currentLanguage', 'Current Language')}:</strong> {i18n.language}</p>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              {t('common.languageSwitcherHelp', 'Use the dropdown to switch languages. You can also use the toolbar at the top to change the global locale.')}
            </p>
          </div>
        </div>
      );
    },
  ],
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default language switcher
 */
export const Default: Story = {};

/**
 * Language switcher starting with Spanish
 */
export const Spanish: Story = {
  globals: { locale: 'es-ES' },
};

/**
 * Language switcher starting with French
 */
export const French: Story = {
  globals: { locale: 'fr-FR' },
};

/**
 * Language switcher starting with German
 */
export const German: Story = {
  globals: { locale: 'de-DE' },
};

/**
 * Language switcher starting with Japanese
 */
export const Japanese: Story = {
  globals: { locale: 'ja-JP' },
};
