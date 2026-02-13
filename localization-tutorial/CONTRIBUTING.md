# Contributing to Localization Tutorial

Thank you for your interest in contributing! This repository contains working examples for the [CrashBytes Localization Tutorial](https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025).

## How to Contribute

### Adding New Language Translations

1. **Fork the repository**

2. **Create translation files**:
   - For React example: `react-i18next-example/src/locales/{locale}.json`
   - For Next.js example: `nextjs-next-intl-example/messages/{locale}.json`

3. **Follow the BCP 47 format**: `language-REGION.json` (e.g., `pt-BR.json`, `zh-CN.json`)

4. **Copy the structure from `en-US.json`** and translate all values

5. **Validate your translations**:
   ```bash
   npm run validate-translations
   ```

6. **Test your translation** by running the examples:
   ```bash
   cd react-i18next-example
   npm install
   npm run dev
   ```

7. **Submit a pull request** with:
   - Language added
   - All translation keys present
   - Validation passing

### Adding New Examples

We welcome contributions of new examples that demonstrate:
- Different frameworks (Vue, Svelte, Angular)
- Advanced patterns (lazy loading, code splitting)
- Translation management integrations
- Testing strategies
- Performance optimizations

**Requirements**:
- TypeScript strongly preferred
- Include README.md in the example directory
- Add accessibility support
- Include tests
- Update main README.md

### Improving Documentation

- Fix typos or unclear explanations
- Add more code comments
- Improve examples
- Add troubleshooting guides

### Reporting Issues

When reporting issues, include:
- Which example (React, Next.js, etc.)
- Steps to reproduce
- Expected vs actual behavior
- Browser/Node.js version
- Error messages

## Translation Guidelines

### Translation Quality

- **Accuracy**: Translations should be faithful to the English source
- **Natural Language**: Use natural, idiomatic expressions for the target language
- **Consistency**: Use consistent terminology throughout
- **Context**: Maintain the same tone and formality level

### Technical Terms

Some terms should **not** be translated:
- Brand names (e.g., "YourCompany")
- Technical acronyms (e.g., "API", "URL", "JSON")
- Code-specific terms when referenced literally

### Pluralization

Follow the pluralization rules for your language:
- English: `key` and `key_plural`
- Other rules may vary - check i18next pluralization docs

### Variables

Preserve variable placeholders:
- Keep `{{variable}}` syntax unchanged
- Translate surrounding text only

Example:
```json
// Correct
"welcome": "Bienvenido, {{name}}"

// Wrong
"welcome": "Bienvenido, {{nombre}}"
```

## Code Standards

### TypeScript

- Use strict TypeScript settings
- Define proper types for all props
- Use `interface` for component props
- Export types that might be reused

### Components

- Use functional components with hooks
- Include JSDoc comments for complex components
- Follow accessibility best practices
- Support both LTR and RTL layouts

### Styling

- Use CSS modules or styled-components
- Support dark mode where applicable
- Use CSS logical properties for RTL support

## Storybook Stories

When adding new components, create corresponding Storybook stories:

1. **Create a `.stories.tsx` file** next to your component:
   ```tsx
   // src/components/MyComponent.stories.tsx
   import type { Meta, StoryObj } from '@storybook/react';
   import { MyComponent } from './MyComponent';
   
   const meta = {
     title: 'Components/MyComponent',
     component: MyComponent,
     tags: ['autodocs'],
   } satisfies Meta<typeof MyComponent>;
   
   export default meta;
   type Story = StoryObj<typeof meta>;
   
   export const Default: Story = {
     args: {
       // props here
     },
   };
   ```

2. **Include language variants**:
   - Create stories for each supported language
   - Use the locale decorator pattern (see existing stories)
   - Test that all text updates when language changes

3. **Document edge cases**:
   - Create stories for error states
   - Show loading states
   - Demonstrate different prop combinations
   - Include accessibility-focused stories

4. **Test your stories locally**:
   ```bash
   cd react-i18next-example
   npm run storybook
   ```

5. **Stories should demonstrate**:
   - Component behavior in all languages
   - Accessibility features (ARIA labels)
   - Responsive design
   - Interactive states

## Testing

All contributions should include tests:

```bash
npm test                  # Unit tests
npm run test:a11y        # Accessibility tests
npm run test:e2e         # End-to-end tests
npm run storybook         # Visual/interactive testing
```

### Test Requirements

- Component rendering tests
- Translation switching tests
- Accessibility tests with axe-core
- Form validation tests (if applicable)

## Accessibility Requirements

All contributions must meet WCAG 2.1 Level AA:

- All interactive elements keyboard accessible
- Proper ARIA labels and roles
- Color contrast ratios meet standards
- Form errors announced to screen readers
- Skip links and landmarks
- RTL layout support (if applicable)

## Pull Request Process

1. **Update the README.md** if adding new examples or features

2. **Ensure all tests pass**:
   ```bash
   npm test
   npm run validate-translations
   ```

3. **Follow commit message conventions**:
   ```
   feat: Add Portuguese (Brazil) translations
   fix: Correct Spanish pluralization
   docs: Update accessibility guidelines
   ```

4. **Request review** from maintainers

5. **Address feedback** promptly

6. **Squash commits** if requested before merging

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn

## Questions?

- Open an issue for questions
- Check existing issues first
- Tag with `question` label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
