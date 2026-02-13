import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { useTranslation } from 'react-i18next';

/**
 * SearchBar provides product search functionality with:
 * - Localized placeholder text
 * - Accessible labels and ARIA attributes
 * - Screen reader announcements
 * - Loading states
 */
const meta = {
  title: 'Components/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const { i18n } = useTranslation();
      const locale = context.globals.locale || 'en-US';
      
      useEffect(() => {
        i18n.changeLanguage(locale);
      }, [locale, i18n]);
      
      return (
        <div style={{ width: '500px', padding: '2rem' }}>
          <Story />
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
              <strong>Try searching:</strong> Type text in the search box and submit. 
              Notice how the placeholder, button text, and screen reader announcements change with language selection.
            </p>
          </div>
        </div>
      );
    },
  ],
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default search bar in English
 */
export const Default: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
  },
};

/**
 * Search bar in Spanish
 */
export const Spanish: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
  },
  globals: { locale: 'es-ES' },
};

/**
 * Search bar in French
 */
export const French: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
  },
  globals: { locale: 'fr-FR' },
};

/**
 * Search bar in German
 */
export const German: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
  },
  globals: { locale: 'de-DE' },
};

/**
 * Search bar in Japanese
 */
export const Japanese: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
  },
  globals: { locale: 'ja-JP' },
};

/**
 * Demonstrates accessibility features:
 * - Hidden labels for screen readers
 * - ARIA descriptions
 * - Live region announcements
 */
export const AccessibilityFeatures: Story = {
  args: {
    onSearch: (query) => console.log('Search:', query),
  },
  parameters: {
    docs: {
      description: {
        story: `This story highlights the accessibility features:
        
- **Screen reader labels**: Hidden text that describes the input
- **ARIA attributes**: Proper labeling and descriptions
- **Live region**: Announces search results to screen readers
- **Button states**: Disabled states for clear UX
        
Try using a screen reader to interact with this component.`,
      },
    },
  },
};
