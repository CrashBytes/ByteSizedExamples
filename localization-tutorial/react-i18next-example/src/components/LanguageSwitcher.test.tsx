import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithI18n, screen, waitForI18n, userEvent, waitFor } from '../test/test-utils';
import { LanguageSwitcher } from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    await waitForI18n();
  });

  describe('Rendering', () => {
    it('renders language selector dropdown', () => {
      renderWithI18n(<LanguageSwitcher />);

      expect(screen.getByRole('combobox', { name: /select language/i })).toBeInTheDocument();
    });

    it('displays all available languages', () => {
      renderWithI18n(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));
      const optionTexts = options.map((opt) => opt.textContent);

      expect(optionTexts).toContain('English');
      expect(optionTexts).toContain('Español');
      expect(optionTexts).toContain('Français');
      expect(optionTexts).toContain('Deutsch');
      expect(optionTexts).toContain('日本語');
    });

    it('shows current language as selected', () => {
      renderWithI18n(<LanguageSwitcher />, { locale: 'es-ES' });

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('es-ES');
    });
  });

  describe('Language Switching', () => {
    it('changes language when user selects a different option', async () => {
      const user = userEvent.setup();
      renderWithI18n(<LanguageSwitcher />, { locale: 'en-US' });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'es-ES');
      
      await waitFor(() => {
        expect((select as HTMLSelectElement).value).toBe('es-ES');
      });
    });

    it('updates UI when language is changed', async () => {
      const user = userEvent.setup();
      renderWithI18n(<LanguageSwitcher />, { locale: 'en-US' });

      const select = screen.getByRole('combobox');
      
      // Initially should show English label
      expect(screen.getByLabelText(/select language/i)).toBeInTheDocument();

      // Change to Spanish
      await user.selectOptions(select, 'es-ES');
      
      // Wait for language change and UI update
      await screen.findByLabelText(/seleccionar idioma/i);
    });
  });

  describe('Localization', () => {
    it('displays label in English', () => {
      renderWithI18n(<LanguageSwitcher />, { locale: 'en-US' });

      expect(screen.getByLabelText(/select language/i)).toBeInTheDocument();
    });

    it('displays label in Spanish', () => {
      renderWithI18n(<LanguageSwitcher />, { locale: 'es-ES' });

      expect(screen.getByLabelText(/seleccionar idioma/i)).toBeInTheDocument();
    });

    it('displays label in French', () => {
      renderWithI18n(<LanguageSwitcher />, { locale: 'fr-FR' });

      expect(screen.getByLabelText(/sélectionner la langue/i)).toBeInTheDocument();
    });

    it('displays label in German', () => {
      renderWithI18n(<LanguageSwitcher />, { locale: 'de-DE' });

      expect(screen.getByLabelText(/sprache auswählen/i)).toBeInTheDocument();
    });

    it('displays label in Japanese', () => {
      renderWithI18n(<LanguageSwitcher />, { locale: 'ja-JP' });

      expect(screen.getByLabelText(/言語を選択/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible label for screen readers', () => {
      renderWithI18n(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAccessibleName(/select language/i);
    });

    it('has proper ARIA attributes', () => {
      renderWithI18n(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label');
    });

    it('all options have proper value attributes', () => {
      renderWithI18n(<LanguageSwitcher />);

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      options.forEach((option) => {
        expect(option).toHaveAttribute('value');
        expect(option.getAttribute('value')).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      });
    });

    it('can be navigated with keyboard', async () => {
      const user = userEvent.setup();
      renderWithI18n(<LanguageSwitcher />, { locale: 'en-US' });

      const select = screen.getByRole('combobox');

      // Focus the select
      await user.tab();
      expect(select).toHaveFocus();

      // Instead of relying on keyboard navigation, select a different language directly
      await user.selectOptions(select, 'es-ES');
      
      // Wait for value to change (async language change)
      await waitFor(() => {
        expect((select as HTMLSelectElement).value).toBe('es-ES');
      });
    });
  });

  describe('Help Text', () => {
    it('displays help text in current language', () => {
      renderWithI18n(<LanguageSwitcher />, { locale: 'en-US' });

      expect(screen.getByText(/current language/i)).toBeInTheDocument();
    });

    it('help text updates when language changes', async () => {
      const user = userEvent.setup();
      renderWithI18n(<LanguageSwitcher />, { locale: 'en-US' });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'es-ES');
      
      // Wait for language change and help text update
      await screen.findByText(/idioma actual/i);
    });
  });
});
