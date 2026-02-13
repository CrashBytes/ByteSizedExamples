import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  name: string;
  price: number;
  currency: string;
  stockCount: number;
  description?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  name, 
  price, 
  currency, 
  stockCount,
  description 
}) => {
  const { t, i18n } = useTranslation();
  
  // Format currency based on current locale
  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };
  
  const getStockStatus = () => {
    if (stockCount === 0) {
      return t('product.outOfStock');
    } else if (stockCount <= 5) {
      return t('product.lowStock', { count: stockCount });
    } else {
      return t('product.inStock', { count: stockCount });
    }
  };

  const isInStock = stockCount > 0;
  
  return (
    <div className="product-card">
      <h3>{name}</h3>
      {description && <p>{description}</p>}
      
      <div className="product-price">
        {formatCurrency(price, currency)}
      </div>
      
      <div className="product-stock" aria-label={t('product.stockAvailability')}>
        {getStockStatus()}
      </div>
      
      <button 
        disabled={!isInStock}
        aria-label={isInStock ? t('product.addToCart') : t('product.notifyMe')}
      >
        {isInStock ? t('product.addToCart') : t('product.notifyMe')}
      </button>
    </div>
  );
};
