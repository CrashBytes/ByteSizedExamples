import type { Meta, StoryObj } from '@storybook/react';


// Empty component for docs-only story
const IntroductionDocs = () => null;

const meta = {
  title: 'Introduction',
  component: IntroductionDocs,
  parameters: {
    previewTabs: {
      canvas: { hidden: true },
    },
    viewMode: 'docs',
    docs: {
      page: () => (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
          <h1>Web Application Localization Tutorial - Interactive Demo</h1>
          <p>
            Welcome to the interactive component library for the{' '}
            <a 
              href="https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025"
              target="_blank"
              rel="noopener noreferrer"
            >
              CrashBytes Localization Tutorial
            </a>.
          </p>

          <h2>What You'll Find Here</h2>
          <p>
            This Storybook showcases production-ready React components implementing internationalization (i18n) 
            using <strong>i18next</strong> and <strong>JSON key-value pairs</strong>.
          </p>

          <h3>Available Components</h3>
          <ul>
            <li>
              <strong>ProductCard</strong> - E-commerce product display with:
              <ul>
                <li>Currency formatting (locale-aware)</li>
                <li>Plural handling for stock counts</li>
                <li>Localized button text and ARIA labels</li>
              </ul>
            </li>
            <li>
              <strong>LanguageSwitcher</strong> - Language selection dropdown supporting:
              <ul>
                <li>5 languages (English, Spanish, French, German, Japanese)</li>
                <li>Real-time language switching</li>
                <li>i18next integration</li>
              </ul>
            </li>
            <li>
              <strong>SearchBar</strong> - Accessible search component featuring:
              <ul>
                <li>Localized placeholder text</li>
                <li>Screen reader announcements</li>
                <li>ARIA labels and descriptions</li>
                <li>Loading states</li>
              </ul>
            </li>
          </ul>

          <h2>How to Use This Demo</h2>

          <h3>1. Navigate Components</h3>
          <p>Use the sidebar to explore different components and their variations (stories).</p>

          <h3>2. Switch Languages</h3>
          <p>
            Click the <strong>globe icon</strong> in the top toolbar to change the language. 
            Watch how all text, formatting, and ARIA labels update in real-time.
          </p>

          <h3>3. Test Scenarios</h3>
          <p>Each component has multiple stories demonstrating:</p>
          <ul>
            <li>Different data states (in stock, out of stock, low stock)</li>
            <li>Edge cases (single item, high prices)</li>
            <li>Language variations</li>
            <li>Accessibility features</li>
          </ul>

          <h3>4. Inspect Props</h3>
          <p>Use the <strong>Controls</strong> panel to modify component props and see how they affect rendering.</p>

          <h3>5. Read Documentation</h3>
          <p>Switch to the <strong>Docs</strong> tab for detailed component documentation and implementation notes.</p>

          <h2>Supported Languages</h2>
          <p>This demo supports 5 languages with full translations:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Language</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Locale Code</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '0.5rem' }}>English (US)</td>
                <td style={{ padding: '0.5rem' }}>en-US</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '0.5rem' }}>Spanish (Spain)</td>
                <td style={{ padding: '0.5rem' }}>es-ES</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '0.5rem' }}>French (France)</td>
                <td style={{ padding: '0.5rem' }}>fr-FR</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '0.5rem' }}>German (Germany)</td>
                <td style={{ padding: '0.5rem' }}>de-DE</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '0.5rem' }}>Japanese (Japan)</td>
                <td style={{ padding: '0.5rem' }}>ja-JP</td>
              </tr>
            </tbody>
          </table>

          <h2>Key Features Demonstrated</h2>

          <h3>Localization</h3>
          <ul>
            <li><strong>JSON key-value translations</strong> - Organized namespaces for scalability</li>
            <li><strong>Variable interpolation</strong> - Dynamic values in translated strings</li>
            <li><strong>Plural forms</strong> - Language-specific plural rules</li>
            <li><strong>Nested keys</strong> - Logical organization of translation keys</li>
          </ul>

          <h3>Formatting</h3>
          <ul>
            <li><strong>Currency</strong> - Intl.NumberFormat with locale-aware symbols</li>
            <li><strong>Numbers</strong> - Thousands separators, decimal points</li>
          </ul>

          <h3>Accessibility</h3>
          <ul>
            <li><strong>ARIA labels</strong> - All interactive elements properly labeled</li>
            <li><strong>Screen reader support</strong> - Live regions and announcements</li>
            <li><strong>Keyboard navigation</strong> - Full keyboard accessibility</li>
            <li><strong>Semantic HTML</strong> - Proper use of form elements and buttons</li>
          </ul>

          <h2>Learn More</h2>
          <ul>
            <li>
              <strong>Tutorial Article</strong>:{' '}
              <a 
                href="https://crashbytes.com/articles/web-application-localization-i18n-tutorial-json-key-value-implementation-2025"
                target="_blank"
                rel="noopener noreferrer"
              >
                Web Application Localization Guide
              </a>
            </li>
            <li>
              <strong>GitHub Repository</strong>:{' '}
              <a 
                href="https://github.com/CrashBytes/localization-tutorial"
                target="_blank"
                rel="noopener noreferrer"
              >
                localization-tutorial
              </a>
            </li>
            <li>
              <strong>CrashBytes Blog</strong>:{' '}
              <a href="https://crashbytes.com" target="_blank" rel="noopener noreferrer">
                crashbytes.com
              </a>
            </li>
          </ul>

          <h2>Get Started</h2>
          <p>Ready to explore? Start with:</p>
          <ol>
            <li><strong>Components → ProductCard → In Stock</strong> - See basic localization</li>
            <li><strong>Components → LanguageSwitcher → Default</strong> - Try switching languages</li>
            <li><strong>Components → SearchBar → Accessibility Features</strong> - Explore ARIA labels</li>
          </ol>

          <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
          <p style={{ textAlign: 'center', color: '#666' }}>
            <strong>Built by <a href="https://crashbytes.com" target="_blank" rel="noopener noreferrer">CrashBytes</a></strong> | MIT License
          </p>
        </div>
      ),
    },
  },
} satisfies Meta<typeof IntroductionDocs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Introduction: Story = {};
