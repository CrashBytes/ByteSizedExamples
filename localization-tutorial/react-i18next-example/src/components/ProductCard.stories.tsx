import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { useTranslation } from 'react-i18next';

/**
 * ProductCard displays product information with localized pricing,
 * stock status, and actions. It demonstrates:
 * - Number formatting (currency)
 * - Plural handling (stock count)
 * - Button text localization
 * - Accessibility labels
 */
const meta = {
  title: 'Components/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      description: 'Product name',
    },
    price: {
      description: 'Product price',
    },
    currency: {
      description: 'Currency code',
    },
    stockCount: {
      description: 'Stock quantity',
    },
    description: {
      description: 'Product description',
    },
  },
  decorators: [
    (Story, context) => {
      const { i18n } = useTranslation();
      const locale = context.globals.locale || 'en-US';
      
      useEffect(() => {
        i18n.changeLanguage(locale);
      }, [locale, i18n]);
      
      return <Story />;
    },
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Product with stock available
 */
export const InStock: Story = {
  args: {
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling wireless headphones with 30-hour battery life',
    price: 299.99,
    currency: 'USD',
    stockCount: 15,
  },
};

/**
 * Product with low stock (tests plural forms)
 */
export const LowStock: Story = {
  args: {
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor',
    price: 199.99,
    currency: 'USD',
    stockCount: 3,
  },
};

/**
 * Product with single item in stock (tests singular form)
 */
export const SingleItem: Story = {
  args: {
    name: 'Bluetooth Speaker',
    description: 'Portable waterproof speaker with 360-degree sound',
    price: 89.99,
    currency: 'USD',
    stockCount: 1,
  },
};

/**
 * Out of stock product (button disabled)
 */
export const OutOfStock: Story = {
  args: {
    name: 'Gaming Mouse',
    description: 'High-precision gaming mouse with customizable RGB lighting',
    price: 79.99,
    currency: 'USD',
    stockCount: 0,
  },
};

/**
 * Product with EUR pricing (shows currency formatting)
 */
export const EuropeanPricing: Story = {
  args: {
    name: 'Mechanical Keyboard',
    description: 'Premium mechanical keyboard with tactile switches',
    price: 149.99,
    currency: 'EUR',
    stockCount: 25,
  },
};

/**
 * High-priced luxury item
 */
export const LuxuryItem: Story = {
  args: {
    name: 'Professional Camera',
    description: 'Full-frame mirrorless camera with 4K video recording',
    price: 2499.99,
    currency: 'USD',
    stockCount: 5,
  },
};
