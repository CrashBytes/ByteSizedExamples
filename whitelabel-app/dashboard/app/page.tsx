'use client';

import { useState } from 'react';
import ConfigForm from '../components/ConfigForm';
import LivePreview from '../components/LivePreview';
import { AppConfig } from '../types/config';

export interface AppImages {
  icon: File | null;
  splash: File | null;
  adaptiveIcon: File | null;
  favicon: File | null;
}

export default function Home() {
  const [config, setConfig] = useState<AppConfig>({
    appName: 'My App',
    slug: 'myapp',
    scheme: 'myapp',
    version: '1.0.0',
    bundleIdentifier: 'com.myapp.app',
    androidPackage: 'com.myapp.app',
    brandColors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      background: '#FFFFFF',
      text: '#1F2937',
      error: '#EF4444',
      success: '#10B981',
    },
    typography: {
      fontFamily: {
        heading: 'System',
        body: 'System',
        monospace: 'Courier',
      },
      fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 24,
        xxl: 32,
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    features: {
      auth: true,
      socialLogin: {
        google: true,
        apple: true,
        facebook: false,
      },
      biometric: false,
      notifications: true,
      darkMode: false,
      chat: false,
      fileUpload: false,
      offlineMode: false,
    },
    content: {
      onboarding: {
        step1: {
          title: 'Welcome',
          description: 'Discover amazing features tailored just for you',
          icon: '👋',
        },
        step2: {
          title: 'Stay Connected',
          description: 'Connect with your community and share experiences',
          icon: '🤝',
        },
        step3: {
          title: 'Get Started',
          description: 'Everything you need in one place',
          icon: '🚀',
        },
      },
      buttons: {
        primary: 'Get Started',
        secondary: 'Learn More',
        login: 'Sign In',
        signup: 'Create Account',
      },
      tabs: {
        home: 'Home',
        search: 'Search',
        notifications: 'Notifications',
        profile: 'Profile',
      },
    },
    navigation: {
      tabBar: {
        position: 'bottom',
        showLabels: true,
      },
      tabs: [
        { id: 'home', icon: '🏠', label: 'Home', enabled: true },
        { id: 'search', icon: '🔍', label: 'Search', enabled: true },
        { id: 'notifications', icon: '🔔', label: 'Notifications', enabled: true },
        { id: 'profile', icon: '👤', label: 'Profile', enabled: true },
      ],
    },
    apiUrl: 'https://api.myapp.com',
    supportEmail: 'support@myapp.com',
    locale: 'en',
  });

  const [images, setImages] = useState<AppImages>({
    icon: null,
    splash: null,
    adaptiveIcon: null,
    favicon: null,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            White-Label App Configurator
          </h1>
          <p className="mt-2 text-gray-600">
            Configure your branded mobile app with live preview
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="overflow-y-auto">
            <ConfigForm 
              config={config} 
              onChange={setConfig}
              images={images}
              onImagesChange={setImages}
            />
          </div>
          <div className="lg:sticky lg:top-8 lg:h-screen">
            <LivePreview config={config} />
          </div>
        </div>
      </main>
    </div>
  );
}
