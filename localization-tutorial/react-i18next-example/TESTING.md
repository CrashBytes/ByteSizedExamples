# Testing Guide

This project uses **Vitest** and **React Testing Library** for comprehensive unit and integration testing.

## Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

### Component Tests

**ProductCard.test.tsx** - Tests for the ProductCard component
- Product information display
- Stock status handling (in stock, low stock, out of stock)
- Currency formatting across locales
- Pluralization (singular/plural forms)
- Localization in all 5 languages
- Accessibility (ARIA labels, button states)

**LanguageSwitcher.test.tsx** - Tests for the LanguageSwitcher component
- Language selector rendering
- Language switching functionality
- Localized labels in all languages
- Accessibility (ARIA attributes, keyboard navigation)
- Help text updates

**SearchBar.test.tsx** - Tests for the SearchBar component
- User input and search submission
- Loading states
- Results count display and pluralization
- Localization in all languages
- Accessibility (ARIA labels, live regions, screen reader announcements)
- Keyboard interactions (Enter key submission)

### Configuration Tests

**i18n.test.ts** - Tests for i18n configuration
- i18next initialization
- Language switching
- Translation key existence
- Interpolation variables
- Pluralization rules
- Currency formatting
- Fallback behavior
- Event emissions

**translations.test.ts** - Translation file validation
- Completeness (all keys present in all languages)
- Structure consistency
- Interpolation variable matching
- Pluralization key consistency
- No empty translations
- No placeholder text (TODO, FIXME)
- JSON validity

## Test Utilities

**test-utils.tsx** - Custom testing utilities
- `renderWithI18n()` - Renders components with i18n provider
- `waitForI18n()` - Waits for i18next initialization
- Re-exports all testing library functions

## Coverage Goals

Target coverage: **80%+**

Current coverage areas:
- Components: All major components
- i18n configuration: Core functionality
- Translation validation: Completeness checks

## Writing New Tests

### Component Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithI18n, screen, waitForI18n } from '../test/test-utils';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  beforeEach(async () => {
    await waitForI18n();
  });

  describe('Rendering', () => {
    it('renders correctly', () => {
      renderWithI18n(<YourComponent />);
      expect(screen.getByRole('...')).toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    it('displays content in Spanish', () => {
      renderWithI18n(<YourComponent />, { locale: 'es-ES' });
      expect(screen.getByText(/spanish text/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels', () => {
      renderWithI18n(<YourComponent />);
      const element = screen.getByRole('...');
      expect(element).toHaveAccessibleName();
    });
  });
});
```

### Testing Localized Content

```typescript
// Test in multiple languages
const languages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'];

languages.forEach((locale) => {
  it(`works in ${locale}`, () => {
    renderWithI18n(<Component />, { locale });
    // Your assertions
  });
});
```

### Testing User Interactions

```typescript
import { userEvent } from '../test/test-utils';

it('handles user interaction', async () => {
  const user = userEvent.setup();
  renderWithI18n(<Component />);
  
  const button = screen.getByRole('button');
  await user.click(button);
  
  expect(/* something changed */).toBeTruthy();
});
```

## Best Practices

1. **Always wait for i18n initialization**
   ```typescript
   beforeEach(async () => {
     await waitForI18n();
   });
   ```

2. **Use semantic queries** (prefer `getByRole` over `getByTestId`)
   ```typescript
   screen.getByRole('button', { name: /submit/i })
   screen.getByRole('textbox', { name: /search/i })
   ```

3. **Test accessibility**
   - Check ARIA labels
   - Verify keyboard navigation
   - Test screen reader announcements

4. **Test localization**
   - Test all supported languages
   - Verify currency formatting
   - Check pluralization
   - Validate interpolation

5. **Test edge cases**
   - Empty states
   - Loading states
   - Error states
   - Boundary values (0, 1, max)

## Continuous Integration

Tests run automatically in CI/CD:
- On every commit
- On pull requests
- Before deployment

## Debugging Tests

### Visual debugging with Vitest UI

```bash
npm run test:ui
```

Opens a browser interface showing:
- Test results
- Component snapshots
- Console output
- Coverage visualization

### Debug specific test

```bash
npm test -- SearchBar.test.tsx
```

### Watch specific file

```bash
npm test -- --watch SearchBar.test.tsx
```

## Coverage Reports

After running `npm run test:coverage`:

1. **Terminal output** - Summary of coverage percentages
2. **HTML report** - Open `coverage/index.html` in browser for detailed view
3. **JSON report** - Machine-readable at `coverage/coverage-final.json`

## Common Issues

### "Cannot find module '@testing-library/jest-dom'"

```bash
npm install @testing-library/jest-dom --save-dev
```

### "ReferenceError: expect is not defined"

Make sure vitest.config.ts has `globals: true`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    // ...
  },
});
```

### "i18n is not initialized"

Always use `waitForI18n()` before tests:

```typescript
beforeEach(async () => {
  await waitForI18n();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)
