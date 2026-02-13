# White Label App Screens & Features

## 📱 Complete Screen Structure

### Authentication & Onboarding

#### Onboarding Flow (`/app/(onboarding)/`)
- **Welcome Screen** - 3-step onboarding with swipe navigation
  - Introduction to the app
  - Feature highlights
  - Call to action to get started
  - Themed with client's primary color

#### Authentication (`/app/(auth)/`)
- **Login Screen** - Email/password authentication
  - Form validation
  - Forgot password link
  - Sign up redirect
  - Themed buttons using client colors

- **Sign Up Screen** - New user registration
  - Full name, email, password, confirm password
  - Form validation
  - Back to login option
  - Uses secondary brand color

- **Forgot Password Screen** - Password recovery
  - Email input
  - Success confirmation
  - Themed success messages

### Core Navigation (`/app/(tabs)/`)

#### Home/Dashboard
- **Welcome header** with client's primary color
- **Quick Actions grid** - 4 feature cards
  - Analytics
  - Messages
  - Tasks
  - Calendar
- **Recent Activity feed**
- **Statistics card** showing weekly metrics
  - Views, Conversions, New Users
  - Uses brand colors for different metrics

#### Search
- **Search bar** at the top
- **Categories section** with icons and counts
  - Technology, Business, Design, Marketing
- **Popular searches** as tags
  - Themed with client's primary color

#### Notifications
- **Header** with "Mark all as read" option
- **Notification list** with different types:
  - Messages (💬)
  - Orders (📦)
  - Payments (💳)
  - Social (👤)
- **Unread indicator** dot using primary color
- **Timestamp** for each notification

#### Profile/Settings
- **Profile header** with avatar
  - Name and email
  - Primary color background
- **Statistics row**
  - Posts, Followers, Following
  - Uses primary color
- **Settings sections**:
  - **Account**: Edit Profile, Security, Notification Settings
  - **Preferences**: Theme, Language (from config)
  - **Support**: Help, Contact (uses supportEmail from config), About (shows version)
- **Logout button** with confirmation

## 🎨 Theming System

### useTheme Hook (`/hooks/useTheme.ts`)
Provides access to:
```typescript
{
  colors: {
    primary,
    secondary,
    accent,
    background,
    text,
    error,
    success
  },
  config: {
    appName,
    clientName,
    features,
    apiUrl,
    supportEmail,
    locale,
    version
  }
}
```

### Themed Components (`/components/`)

#### Button Component
- **Variants**: primary, secondary, outline
- **States**: loading, disabled
- **Auto-themed** with client colors

#### Input Component
- **Features**: label, error messages
- **Validation** error state uses error color
- **Consistent styling** across all forms

#### Card Component
- **Consistent** shadow and border radius
- **Reusable** across all screens

## 🚀 How Theming Works

1. **Configuration loaded** from `configs/[client].config.js`
2. **Zod validates** all configuration values
3. **Theme hook** exposes colors and config
4. **Components automatically** use client colors
5. **No code changes** needed to switch clients

### Example: ACME vs TechStartup

**ACME Business:**
- Primary: `#1E3A8A` (Blue)
- Secondary: `#DC2626` (Red)
- Accent: `#F59E0B` (Gold)

**TechStartup:**
- Primary: `#6366F1` (Purple)
- Secondary: `#8B5CF6` (Violet)
- Accent: `#EC4899` (Pink)

**Same code, different branding!**

## 🔄 User Flow

```
Start
  ↓
Onboarding (3 screens)
  ↓
Login/Sign Up
  ↓
Main App (Tabs)
  ├── Home (Dashboard)
  ├── Search (Browse)
  ├── Notifications
  └── Profile (Settings)
```

## 📝 Testing Different Clients

```bash
# ACME (Blue theme)
CLIENT=acme npm start

# TechStartup (Purple theme)
CLIENT=techstartup npm start

# Default (Blue theme)
CLIENT=default npm start
```

## 🎯 Next Steps to Add

Potential additions:
- [ ] Transactional screens (Cart, Checkout, Payment)
- [ ] Messaging/Chat screens
- [ ] Content creation/editing screens
- [ ] Detailed item views
- [ ] User-generated content feeds
- [ ] Help/FAQ screens
- [ ] Terms of Service / Privacy Policy
- [ ] Biometric authentication
- [ ] Dark mode support
- [ ] Multi-language support (i18n already configured)

## 🛠️ Customization Guide

### Adding a New Screen

1. Create screen file in appropriate directory
2. Import `useTheme` hook
3. Use `colors` and `config` for theming
4. Add to navigation if needed

```typescript
import { useTheme } from '../hooks/useTheme';

export default function MyScreen() {
  const { colors, config } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.primary }}>
      <Text>{config.appName}</Text>
    </View>
  );
}
```

### Modifying Client Branding

Edit `configs/[client].config.js`:
```javascript
module.exports = {
  brandColors: {
    primary: '#YOUR_COLOR',
    secondary: '#YOUR_COLOR',
    // ... more colors
  },
  // ... rest of config
};
```

No code changes needed - restart the app!

## ✅ Features Implemented

- ✅ Onboarding flow
- ✅ Authentication (Login, Sign Up, Forgot Password)
- ✅ Tab navigation (Home, Search, Notifications, Profile)
- ✅ Dashboard with quick actions
- ✅ Search with categories
- ✅ Notifications feed
- ✅ Profile with settings
- ✅ Fully themed with client colors
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive layouts
- ✅ Zod configuration validation
