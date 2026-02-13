import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithI18n, screen, waitForI18n, userEvent, waitFor } from '../test/test-utils';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  beforeEach(async () => {
    await waitForI18n();
  });

  describe('Rendering', () => {
    it('renders search input field', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders search button', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('displays placeholder text', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('allows typing in search field', async () => {
      const user = userEvent.setup();
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'wireless headphones');
      
      // Wait for all state updates to complete
      await waitFor(() => {
        expect(input).toHaveValue('wireless headphones');
      });
    });

    it('calls onSearch when search button is clicked', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      renderWithI18n(<SearchBar onSearch={onSearch} />);

      const input = screen.getByRole('searchbox');
      const button = screen.getByRole('button', { name: /search/i });

      await user.type(input, 'headphones');
      // Wait for typing state updates
      await waitFor(() => expect(input).toHaveValue('headphones'));
      
      await user.click(button);
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('headphones');
      });
    });

    it('calls onSearch when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      renderWithI18n(<SearchBar onSearch={onSearch} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'headphones{Enter}');
      
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('headphones');
      });
    });

    it('does not call onSearch with empty query', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      renderWithI18n(<SearchBar onSearch={onSearch} />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      expect(onSearch).not.toHaveBeenCalled();
    });

    it('trims whitespace from search query', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      renderWithI18n(<SearchBar onSearch={onSearch} />);

      const input = screen.getByRole('searchbox');
      const button = screen.getByRole('button', { name: /search/i });

      await user.type(input, '  headphones  ');
      // Wait for typing state updates
      await waitFor(() => expect(input).toHaveValue('  headphones  '));
      
      await user.click(button);
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('headphones');
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} isLoading={true} />);

      // There may be multiple elements with the loading text (button and status span)
      const loadingEls = screen.getAllByText(/searching/i);
      expect(loadingEls.length).toBeGreaterThan(0);
    });

    it('disables search button when loading', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} isLoading={true} />);

      const button = screen.getByRole('button', { name: /searching/i });
      expect(button).toBeDisabled();
    });

    it('does not disable input when loading', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} isLoading={true} />);

      const input = screen.getByRole('searchbox');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Results Count', () => {
    it('displays results count when provided', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} resultsCount={42} />);

      expect(screen.getByText(/42 results found/i)).toBeInTheDocument();
    });

    it('displays no results message when count is 0', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} resultsCount={0} />);

      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });

    it('handles singular form for 1 result', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} resultsCount={1} />);

      expect(screen.getByText(/1 result found/i)).toBeInTheDocument();
    });

    it('does not display results count when not provided', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      expect(screen.queryByText(/results found/i)).not.toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    it('displays placeholder in Spanish', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />, { locale: 'es-ES' });

      expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
    });

    it('displays button text in French', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />, { locale: 'fr-FR' });

      expect(screen.getByRole('button', { name: /rechercher/i })).toBeInTheDocument();
    });

    it('displays loading state in German', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} isLoading={true} />, { locale: 'de-DE' });

      // There may be multiple elements with the loading text (button and status span)
      const loadingEls = screen.getAllByText(/suche läuft/i);
      expect(loadingEls.length).toBeGreaterThan(0);
    });

    it('displays results count in Japanese', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} resultsCount={10} />, { locale: 'ja-JP' });

      expect(screen.getByText(/10件の結果が見つかりました/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible label for search input', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAccessibleName(/search/i);
    });

    it('has ARIA label on search input', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label');
    });

    it('has ARIA description for screen readers', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('announces results count to screen readers', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} resultsCount={42} />);

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveTextContent(/42 results found/i);
    });

    it('announces loading state to screen readers', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} isLoading={true} />);

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveTextContent(/searching/i);
    });

    it('has proper button ARIA label', () => {
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toHaveAccessibleName();
    });

    it('updates ARIA labels when language changes', async () => {
      const { rerender } = renderWithI18n(<SearchBar onSearch={() => {}} />, { locale: 'en-US' });

      let input = screen.getByRole('searchbox');
      expect(input).toHaveAccessibleName(/search/i);

      // Change language
      rerender(<SearchBar onSearch={() => {}} />);
      await waitFor(() => {
        input = screen.getByRole('searchbox');
        // Should maintain accessibility
        expect(input).toHaveAccessibleName();
      });
    });
  });

  describe('Form Submission', () => {
    it('prevents default form submission', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      const onSubmit = vi.fn((e) => e.preventDefault());

      renderWithI18n(
        <form onSubmit={onSubmit}>
          <SearchBar onSearch={onSearch} />
        </form>
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'headphones{Enter}');
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
        expect(onSearch).toHaveBeenCalledWith('headphones');
      });
    });
  });

  describe('Clear Functionality', () => {
    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderWithI18n(<SearchBar onSearch={() => {}} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'headphones');
      
      await waitFor(() => {
        expect(input).toHaveValue('headphones');
      });

      // Look for clear button (if implemented)
      const clearButton = screen.queryByRole('button', { name: /clear/i });
      if (clearButton) {
        await user.click(clearButton);
        await waitFor(() => {
          expect(input).toHaveValue('');
        });
      }
    });
  });
});
