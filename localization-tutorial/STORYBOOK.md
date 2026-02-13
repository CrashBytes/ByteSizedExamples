# Storybook Setup Guide

## Quick Start

### From Repository Root

```bash
# Install dependencies
cd react-i18next-example
npm install

# Start Storybook
npm run storybook
```

Visit [http://localhost:6006](http://localhost:6006)

### Alternative: Run from Root

```bash
# From the repository root directory
npm run storybook
```

## What's Included

### Components with Stories

1. **ProductCard** (`src/components/ProductCard.stories.tsx`)
   - In Stock, Low Stock, Single Item, Out of Stock
   - European Pricing (EUR)
   - Luxury Item pricing
   
2. **LanguageSwitcher** (`src/components/LanguageSwitcher.stories.tsx`)
   - Default (English)
   - Spanish, French, German, Chinese variants

3. **SearchBar** (`src/components/SearchBar.stories.tsx`)
   - Default state
   - All language variants
   - Accessibility features demo

### Configuration Files

- `.storybook/main.ts` - Storybook configuration
- `.storybook/preview.tsx` - i18n setup and global decorators

## Building for Production

```bash
cd react-i18next-example
npm run build-storybook
```

Output directory: `storybook-static/`

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow (`.github/workflows/storybook.yml`) that automatically:

1. Builds Storybook on every push to `main`
2. Deploys to GitHub Pages
3. Makes the interactive demo available at: `https://[username].github.io/localization-tutorial/`

### Enabling GitHub Pages

1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. The workflow will automatically deploy on the next push to `main`

## Language Switching

Storybook includes a global language toolbar. Click the globe icon (🌐) in the top toolbar to switch between:

- 🇺🇸 English (en)
- 🇪🇸 Español (es)
- 🇫🇷 Français (fr)
- 🇩🇪 Deutsch (de)
- 🇨🇳 中文 (zh)

All components will update in real-time when you change the language.

## Testing Components

### Using Controls Panel

1. Select a story from the sidebar
2. Switch to the "Canvas" tab
3. Use the "Controls" panel to modify props
4. Watch the component update in real-time

### Using Docs

1. Select a story from the sidebar
2. Switch to the "Docs" tab
3. Read component documentation
4. Try interactive examples

## Troubleshooting

### Port Already in Use

If port 6006 is already taken:

```bash
npm run storybook -- -p 6007
```

### Build Errors

Clear cache and reinstall:

```bash
cd react-i18next-example
rm -rf node_modules package-lock.json
npm install
npm run storybook
```

### i18n Not Working

Make sure the i18n configuration is loaded:

1. Check `src/i18n/config.ts` exists
2. Verify translation files in `src/locales/[lang]/translation.json`
3. Ensure `.storybook/preview.tsx` imports i18n config

## Adding New Stories

### Create a Story File

```tsx
// src/components/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const { i18n } = useTranslation();
      const locale = context.globals.locale || 'en';
      
      useEffect(() => {
        i18n.changeLanguage(locale);
      }, [locale, i18n]);
      
      return <Story />;
    },
  ],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // component props
  },
};
```

### Story Best Practices

1. **Use meaningful names** - `InStock`, `OutOfStock` instead of `Story1`, `Story2`
2. **Document variations** - Create stories for different states and edge cases
3. **Add descriptions** - Use JSDoc comments to explain what each story demonstrates
4. **Include locale variants** - Show the component in different languages
5. **Test accessibility** - Create stories that highlight ARIA labels and screen reader features

## Dependencies

### Required

- `@storybook/react` - React framework
- `@storybook/react-vite` - Vite builder
- `@storybook/addon-essentials` - Essential addons
- `@storybook/addon-interactions` - Interaction testing
- `@storybook/addon-links` - Link between stories
- `@storybook/blocks` - Doc blocks
- `@storybook/test` - Testing utilities

### Optional

- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-viewport` - Responsive testing
- `@storybook/addon-backgrounds` - Background variations

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [i18next Storybook Guide](https://storybook.js.org/recipes/i18next)
- [Accessibility Testing in Storybook](https://storybook.js.org/docs/react/writing-tests/accessibility-testing)
- [Tutorial Article](https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025)

## Questions?

- **Tutorial**: [CrashBytes Localization Guide](https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025)
- **Blog**: [crashbytes.com](https://crashbytes.com)
- **GitHub Issues**: [Report a bug or request a feature](https://github.com/MichaelEakins/crashbytes-tutorials/issues)
