import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string;
}

/**
 * Custom render function that wraps components with I18nextProvider
 * @param ui - React component to render
 * @param options - Render options including locale
 */
export function renderWithI18n(
  ui: ReactElement,
  { locale = 'en-US', ...renderOptions }: CustomRenderOptions = {}
) {
  // Change language before rendering
  if (locale !== i18n.language) {
    i18n.changeLanguage(locale);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for i18next to be initialized
 */
export async function waitForI18n() {
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => {
      i18n.on('initialized', () => resolve());
    });
  }
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
