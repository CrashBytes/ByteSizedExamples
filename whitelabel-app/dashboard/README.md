# White-Label App Configuration Dashboard

Visual UI for configuring white-label mobile apps with live preview.

## Features

- Live preview of app theming
- Visual color pickers for all brand colors
- Auto-generation of slugs and bundle identifiers
- Real-time validation
- One-click config file download
- Mobile device preview frame

## Quick Start

### Installation

```bash
cd dashboard
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3001 in your browser.

### Building for Production

```bash
npm run build
npm start
```

## How to Use

1. **Configure Your App**
   - Enter your app name (slug auto-generates)
   - Set bundle identifiers for iOS/Android
   - Choose your brand colors with visual pickers
   - Toggle feature flags
   - Set API URLs and support email

2. **Live Preview**
   - See real-time updates as you configure
   - Preview shows actual app screens with your branding
   - Color palette preview at bottom

3. **Download Configuration**
   - Click "Download Configuration File"
   - Save the file to `configs/yourapp.config.js`
   - Generate assets: `npm run generate-assets yourapp`
   - Validate: `npm run validate yourapp`
   - Run: `CLIENT=yourapp npm start`

## Configuration Options

### App Identity
- **App Name**: Display name in the app
- **Slug**: URL-safe identifier (auto-generated)
- **Bundle Identifier**: iOS app identifier
- **Android Package**: Android app package name
- **Version**: App version number

### Brand Colors
- **Primary**: Main brand color (headers, buttons)
- **Secondary**: Secondary actions and highlights
- **Accent**: Call-to-action elements
- **Background**: Main background color
- **Text**: Primary text color
- **Error**: Error messages and alerts
- **Success**: Success messages and confirmations

### Features
- **Authentication**: Enable login/signup flows
- **Push Notifications**: Enable notification system
- **Dark Mode**: Enable dark mode toggle

### API Configuration
- **API URL**: Backend API endpoint
- **Support Email**: Customer support email
- **Locale**: Default language (en, es, fr, de, ja, zh)

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Validation**: Zod (uses parent project schemas)

## Integration with Main App

The dashboard generates configuration files that are compatible with the main white-label app system. Simply:

1. Download the config file from the dashboard
2. Save it to `../configs/`
3. Generate assets for the new client
4. Run the app with the new client name

## Customization

### Adding New Color Fields

Edit `types/config.ts`:
```typescript
export interface BrandColors {
  primary: string;
  // Add new color here
  newColor: string;
}
```

Edit `components/ConfigForm.tsx` to add color picker.

### Adding New Feature Flags

Edit `types/config.ts`:
```typescript
export interface Features {
  auth: boolean;
  // Add new feature here
  newFeature: boolean;
}
```

Edit `components/ConfigForm.tsx` to add checkbox.

## Future Enhancements

- Asset upload and preview
- Template presets (fitness, food, healthcare, etc.)
- Color scheme suggestions
- Accessibility contrast checker
- Multi-language config export
- Save/load configurations
- Team collaboration features

## Support

For issues or questions about the dashboard:
- Check the main project README
- Create an issue on GitHub
