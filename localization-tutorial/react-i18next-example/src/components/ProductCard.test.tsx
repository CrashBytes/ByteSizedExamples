import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithI18n, screen, waitForI18n } from '../test/test-utils';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  beforeEach(async () => {
    await waitForI18n();
  });

  describe('Product Information Display', () => {
    it('renders product name and price', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={10}
        />
      );

      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('renders product description when provided', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={10}
          description="High-quality wireless audio"
        />
      );

      expect(screen.getByText('High-quality wireless audio')).toBeInTheDocument();
    });
  });

  describe('Stock Status Display', () => {
    it('shows in stock message when stock count is greater than 5', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={10}
        />
      );

      expect(screen.getByText(/10 items in stock/i)).toBeInTheDocument();
    });

    it('shows low stock message when stock count is 1-5', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={3}
        />
      );

      expect(screen.getByText(/only 3 items left/i)).toBeInTheDocument();
    });

    it('shows out of stock message when stock count is 0', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={0}
        />
      );

      expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    });

    it('handles singular form for 1 item', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={1}
        />
      );

      expect(screen.getByText(/only 1 item left/i)).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats USD currency correctly', () => {
      renderWithI18n(
        <ProductCard
          name="Product"
          price={1234.56}
          currency="USD"
          stockCount={10}
        />,
        { locale: 'en-US' }
      );

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('formats EUR currency correctly', () => {
      renderWithI18n(
        <ProductCard
          name="Product"
          price={1234.56}
          currency="EUR"
          stockCount={10}
        />,
        { locale: 'de-DE' }
      );

      // German locale formats EUR as "1.234,56 €"
      expect(screen.getByText(/1\.234,56\s*€/)).toBeInTheDocument();
    });

    it('formats JPY currency correctly', () => {
      renderWithI18n(
        <ProductCard
          name="Product"
          price={1234}
          currency="JPY"
          stockCount={10}
        />,
        { locale: 'ja-JP' }
      );

      // Japanese Yen has no decimal places
      // Accept both ASCII and full-width Yen symbols for robustness
      expect(screen.getByText(/(¥|￥)1,234/)).toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    it('displays content in Spanish', () => {
      renderWithI18n(
        <ProductCard
          name="Auriculares"
          price={99.99}
          currency="EUR"
          stockCount={10}
        />,
        { locale: 'es-ES' }
      );

      expect(screen.getByText(/10 artículos en stock/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /añadir al carrito/i })).toBeInTheDocument();
    });

    it('displays content in French', () => {
      renderWithI18n(
        <ProductCard
          name="Écouteurs"
          price={99.99}
          currency="EUR"
          stockCount={3}
        />,
        { locale: 'fr-FR' }
      );

      expect(screen.getByText(/seulement 3 articles restants/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ajouter au panier/i })).toBeInTheDocument();
    });

    it('displays content in German', () => {
      renderWithI18n(
        <ProductCard
          name="Kopfhörer"
          price={99.99}
          currency="EUR"
          stockCount={0}
        />,
        { locale: 'de-DE' }
      );

      expect(screen.getByText(/ausverkauft/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /benachrichtigen/i })).toBeInTheDocument();
    });

    it('displays content in Japanese', () => {
      renderWithI18n(
        <ProductCard
          name="ヘッドフォン"
          price={9999}
          currency="JPY"
          stockCount={10}
        />,
        { locale: 'ja-JP' }
      );

      expect(screen.getByText(/10個の在庫あり/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /カートに追加/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible button labels', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={10}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName(/add to cart/i);
    });

    it('has accessible button label when out of stock', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={0}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName(/notify me when back in stock/i);
    });

    it('has proper ARIA label for stock status', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={10}
        />
      );

      const stockElement = screen.getByLabelText(/stock availability/i);
      expect(stockElement).toBeInTheDocument();
    });
  });

  describe('Button Behavior', () => {
    it('shows "Add to Cart" button when in stock', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={10}
        />
      );

      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });

    it('shows "Notify Me" button when out of stock', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={0}
        />
      );

      expect(screen.getByRole('button', { name: /notify me/i })).toBeInTheDocument();
    });

    it('disables button when out of stock', () => {
      renderWithI18n(
        <ProductCard
          name="Wireless Headphones"
          price={99.99}
          currency="USD"
          stockCount={0}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});
