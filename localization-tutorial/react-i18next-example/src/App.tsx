import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProductCard } from './components/ProductCard';
import { SearchBar } from './components/SearchBar';
import './i18n/config';

const sampleProducts = [
  {
    id: '1',
    name: 'Premium Widget',
    description: 'A high-quality widget for all your needs',
    price: 99.99,
    currency: 'USD',
    stock: 15
  },
  {
    id: '2',
    name: 'Deluxe Gadget',
    description: 'The ultimate gadget for professionals',
    price: 149.99,
    currency: 'USD',
    stock: 0
  },
  {
    id: '3',
    name: 'Essential Tool',
    description: 'A must-have tool for every project',
    price: 49.99,
    currency: 'USD',
    stock: 25
  }
];

function App() {
  const { t } = useTranslation();

  return (
    <div className="app">
      <header>
        <h1>{t('hero.title')}</h1>
        <p>{t('hero.subtitle')}</p>
        <LanguageSwitcher />
      </header>

      <main>
        <section className="search-section">
          <h2>{t('products.title')}</h2>
          <SearchBar onSearch={(query) => console.log('Search:', query)} />
        </section>

        <section className="products-section">
          <div className="product-grid">
            {sampleProducts.map(product => (
              <ProductCard 
                key={product.id}
                name={product.name}
                price={product.price}
                currency={product.currency}
                stockCount={product.stock}
                description={product.description}
              />
            ))}
          </div>
        </section>
      </main>

      <footer>
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}

export default App;
