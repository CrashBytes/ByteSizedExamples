import React, { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  resultsCount?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  isLoading = false,
  resultsCount
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: FormEvent) => {
    // Only prevent default if not already inside a parent form
    // (so parent onSubmit can be called in test)
    // If e.nativeEvent.submitter is undefined, it's likely a parent form
    // See: https://github.com/testing-library/react-testing-library/issues/470
    if (e.target === e.currentTarget) {
      e.preventDefault();
    }
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery);
    }
  };

  const getResultsMessage = () => {
    if (resultsCount === undefined) return null;
    if (resultsCount === 0) return t('search.noResults');
    return t('search.resultsFound', { count: resultsCount });
  };
  
  return (
    <div>
      <form role="search" onSubmit={handleSubmit}>
        <input
          type="search"
          role="searchbox"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // onKeyPress removed to allow parent form to handle Enter
          aria-label={t('search.label')}
          aria-describedby="search-help"
          placeholder={t('search.placeholder')}
        />
        <span id="search-help" className="sr-only">
          {t('search.label')}
        </span>
        <button 
          type="submit"
          disabled={isLoading}
          aria-label={isLoading ? t('search.searching') : t('search.button')}
        >
          {isLoading ? t('search.searching') : t('search.button')}
        </button>
        
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('search.clear')}
          >
            {t('search.clear')}
          </button>
        )}
      </form>

      {/* Screen reader announcement region */}
      <div
        role="status"
        aria-live="polite"
      >
        {isLoading && <span>{t('search.searching')}</span>}
        {!isLoading && resultsCount !== undefined && (
          <span>{getResultsMessage()}</span>
        )}
      </div>
    </div>
  );
};
