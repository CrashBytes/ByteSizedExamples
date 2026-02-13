# Web Application Localization Tutorial

[![Storybook](https://img.shields.io/badge/Storybook-Live%20Demo-FF4785?style=for-the-badge&logo=storybook&logoColor=white)](https://crashbytes.github.io/localization-tutorial/)
[![Tutorial](https://img.shields.io/badge/Read-Tutorial-0066CC?style=for-the-badge&logo=read-the-docs&logoColor=white)](https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025)
[![Tests](https://github.com/crashbytes/localization-tutorial/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/crashbytes/localization-tutorial/actions/workflows/tests.yml)

> Complete examples for implementing internationalization (i18n) in web applications using JSON key-value pairs

## Try the Interactive Demo

**Experience localization in action!** Explore all components with real-time language switching:

### **[Launch Interactive Storybook →](https://crashbytes.github.io/localization-tutorial/)**

Features:
- **5 languages**: English, Spanish, French, German, Japanese
- **Currency formatting**: See prices in different locales
- **Product states**: In stock, low stock, out of stock
- **Accessibility**: ARIA labels, screen reader support
- **Documentation**: Auto-generated component docs

---

This repository contains working code examples from the [CrashBytes Localization Tutorial](https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025).

## What's Included

- **React + i18next Example**: Product catalog with language switching, currency formatting, and accessibility
- **Next.js 14 + next-intl Example**: Blog application with localized routing and server components
- **Translation Files**: 6 languages (en-US, es-ES, fr-FR, de-DE, ja-JP, ar-SA)
- **Storybook Demo**: Interactive component testing with 5 languages (en-US, es-ES, fr-FR, de-DE, ja-JP)
- **Validation Scripts**: Automated translation completeness checking
- **Accessibility Examples**: ARIA labels, form validation, screen reader announcements
- **CI/CD Integration**: GitHub Actions workflow for translation validation
- **Performance Benchmarks**: Loading time comparisons across strategies

## Quick Start

### React Example (i18next)

```bash
cd react-i18next-example
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Interactive Component Demo (Storybook)

Explore and test all localization components interactively:

```bash
# From the repository root
npm run storybook

# Or from the react-i18next-example directory
cd react-i18next-example
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006)

Storybook provides:
- **Interactive component testing** - Try all components with different props and languages
- **Language switcher** - Toggle between all supported locales in real-time
- **Accessibility testing** - Verify ARIA labels and screen reader behavior
- **Documentation** - Auto-generated docs for each component
- **Edge cases** - Test scenarios like low stock, out of stock, different currencies

**[Complete Storybook Setup Guide →](STORYBOOK.md)**

### Next.js Example (next-intl)

```bash
cd nextjs-next-intl-example
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Repository Structure

```
localization-tutorial/
├── react-i18next-example/          # React + i18next product catalog
│   ├── src/
│   │   ├── components/             # UI components
│   │   ├── i18n/                   # i18n configuration
│   │   └── locales/                # Translation JSON files
│   └── package.json
├── nextjs-next-intl-example/       # Next.js 14 + next-intl blog
│   ├── app/
│   │   ├── [locale]/               # Localized routes
│   │   └── i18n.ts                 # i18n configuration
│   ├── messages/                   # Translation JSON files
│   ├── middleware.ts               # Locale detection
│   └── package.json
├── accessibility-examples/         # Standalone accessibility components
│   ├── SearchBar.tsx               # Localized ARIA labels
│   ├── SignupForm.tsx              # Accessible form validation
│   ├── ScreenReaderAnnouncements.tsx
│   └── AccessibleImage.tsx
├── scripts/                        # Utility scripts
│   ├── validate-translations.ts   # Check translation completeness
│   └── extract-keys.js            # Extract translation keys
├── .github/
│   └── workflows/
│       └── validate-translations.yml  # CI/CD pipeline
└── README.md
```

## Supported Languages

- **en-US**: English (United States)
- **es-ES**: Spanish (Spain)
- **fr-FR**: French (France)
- **de-DE**: German (Germany)
- **ja-JP**: Japanese (Japan)
- **ar-SA**: Arabic (Saudi Arabia)

## Storybook Integration

This tutorial includes a full Storybook setup that lets you test localization components interactively in your browser. Perfect for:

- **Testing components** without running the full application
- **Demonstrating localization** to stakeholders
- **Verifying translations** across all supported languages
- **Accessibility testing** with screen readers
- **Learning by example** through documented stories

### Available Stories

1. **ProductCard** - Demonstrates currency formatting, plural forms, and stock status
   - In Stock, Low Stock, Single Item, Out of Stock scenarios
   - Multiple currencies (USD, EUR)
   - Price range examples

2. **LanguageSwitcher** - Shows language selection across all 5 languages
   - English, Spanish, French, German, Japanese variants
   - Real-time language switching

3. **SearchBar** - Illustrates accessible search with localized ARIA labels
   - Placeholder text localization
   - Screen reader announcements
   - Loading states
   - Results count pluralization

### Language Toolbar

Storybook includes a global language switcher in the toolbar. Change the locale and watch all components update in real-time:

- English (en-US)
- Español (es-ES)
- Français (fr-FR)
- Deutsch (de-DE)
- 日本語 (ja-JP)

## Features Demonstrated

### Core Localization
- JSON key-value translation files
- Nested namespace organization
- Variable interpolation (`{{name}}`)
- Pluralization handling
- Language detection and switching
- TypeScript type safety

### Formatting
- Date formatting with `Intl.DateTimeFormat`
- Number formatting with `Intl.NumberFormat`
- Currency formatting (locale-aware)
- Relative time formatting

### Accessibility
- Localized ARIA labels and attributes
- Screen reader announcements (`aria-live` regions)
- Accessible form validation
- Image alt text localization
- Keyboard navigation in RTL layouts
- WCAG 2.1 Level AA compliance

### Right-to-Left (RTL) Support
- CSS logical properties
- Automatic layout flipping
- RTL language detection (Arabic, Hebrew)

### Production Features
- Code splitting by locale
- CDN caching strategies
- Translation validation in CI/CD
- Missing translation detection
- SEO optimization (hreflang tags)

## Testing

Each example includes:
- Unit tests for translation utilities
- Integration tests for language switching
- Accessibility tests with @testing-library
- E2E tests with Playwright

```bash
# Run all tests
npm test

# Run accessibility tests
npm run test:a11y

# Run E2E tests
npm run test:e2e
```

## Performance Benchmarks

Included benchmarks compare:
- Direct import vs dynamic import
- Lazy loading strategies
- CDN caching impact
- Bundle size by locale

Run benchmarks:
```bash
npm run benchmark
```

## Scripts

### Validate Translations

Check all translation files for completeness:

```bash
npm run validate-translations
```

Validates:
- Missing keys compared to base language (en-US)
- Extra keys (potentially outdated)
- Proper JSON formatting
- Variable consistency

### Extract Translation Keys

Automatically extract translation keys from source code:

```bash
npm run extract-keys
```

## Configuration

### i18next Configuration (React)

See `react-i18next-example/src/i18n/config.ts` for:
- Language detection setup
- Resource loading
- Fallback language configuration
- Interpolation options

### next-intl Configuration (Next.js)

See `nextjs-next-intl-example/app/i18n.ts` for:
- Locale validation
- Message loading
- Middleware configuration
- Routing strategies

## Tutorial Reference

Full tutorial: [Building Multilingual Web Applications](https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025)

Topics covered:
1. Localization fundamentals (i18n vs l10n)
2. JSON key-value architecture
3. React implementation with i18next
4. Next.js App Router with next-intl
5. Date, number, and currency formatting
6. RTL language support
7. Accessibility integration
8. Production best practices
9. Performance optimization
10. SEO for multilingual sites

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines including how to add new Storybook stories.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Related Resources

- [i18next Documentation](https://www.i18next.com/)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [MDN Intl API Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [BCP 47 Language Tags](https://www.rfc-editor.org/info/bcp47)

## Questions?

- Blog: [crashbytes.com](https://crashbytes.com)
- Tutorial: [Localization Guide](https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025)

---

**Built by [CrashBytes](https://crashbytes.com)**
