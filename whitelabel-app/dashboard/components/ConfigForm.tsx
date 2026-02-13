'use client';

import { useState } from 'react';
import { AppConfig } from '../types/config';
import ColorPicker from './ColorPicker';
import ImageUploader from './ImageUploader';
import { generateConfigFile } from '../utils/configGenerator';
import JSZip from 'jszip';
import { AppImages } from '../app/page';

interface ConfigFormProps {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
  images: AppImages;
  onImagesChange: (images: AppImages) => void;
}

export default function ConfigForm({ config, onChange, images, onImagesChange }: ConfigFormProps) {
  const [localAppName, setLocalAppName] = useState(config.appName);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    colors: true,
    assets: false,
    typography: false,
    features: false,
    content: false,
    navigation: false,
    api: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateField = (field: keyof AppConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const updateBrandColor = (colorKey: string, value: string) => {
    onChange({
      ...config,
      brandColors: {
        ...config.brandColors,
        [colorKey]: value,
      },
    });
  };

  const updateTypography = (category: string, key: string, value: string | number) => {
    onChange({
      ...config,
      typography: {
        ...config.typography,
        [category as keyof typeof config.typography]: {
          ...config.typography[category as keyof typeof config.typography],
          [key]: value,
        },
      },
    });
  };

  const updateFeature = (featureKey: string, value: boolean) => {
    onChange({
      ...config,
      features: {
        ...config.features,
        [featureKey]: value,
      },
    });
  };

  const updateSocialLogin = (provider: string, value: boolean) => {
    onChange({
      ...config,
      features: {
        ...config.features,
        socialLogin: {
          ...config.features.socialLogin,
          [provider]: value,
        },
      },
    });
  };

  const updateContent = (section: string, key: string, field: string, value: string) => {
    onChange({
      ...config,
      content: {
        ...config.content,
        [section]: {
          ...config.content[section as keyof typeof config.content],
          [key]: {
            ...(config.content[section as keyof typeof config.content] as any)[key],
            [field]: value,
          },
        },
      },
    });
  };

  const updateContentSimple = (section: string, key: string, value: string) => {
    onChange({
      ...config,
      content: {
        ...config.content,
        [section]: {
          ...config.content[section as keyof typeof config.content],
          [key]: value,
        },
      },
    });
  };

  const updateNavigation = (key: string, value: any) => {
    onChange({
      ...config,
      navigation: {
        ...config.navigation,
        [key]: value,
      },
    });
  };

  const updateNavigationTabBar = (key: string, value: any) => {
    onChange({
      ...config,
      navigation: {
        ...config.navigation,
        tabBar: {
          ...config.navigation.tabBar,
          [key]: value,
        },
      },
    });
  };

  const updateNavigationTab = (index: number, key: string, value: any) => {
    const newTabs = [...config.navigation.tabs];
    newTabs[index] = {
      ...newTabs[index],
      [key]: value,
    };
    updateNavigation('tabs', newTabs);
  };

  const updateImage = (key: keyof AppImages, file: File | null) => {
    onImagesChange({
      ...images,
      [key]: file,
    });
  };

  const saveToProject = async () => {
    try {
      const formData = new FormData();
      formData.append('slug', config.slug);
      formData.append('configContent', generateConfigFile(config));
      
      if (images.icon) formData.append('icon', images.icon);
      if (images.splash) formData.append('splash', images.splash);
      if (images.adaptiveIcon) formData.append('adaptiveIcon', images.adaptiveIcon);
      if (images.favicon) formData.append('favicon', images.favicon);

      const response = await fetch('/api/save-config', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Configuration saved successfully!\n\nFiles created:\n• ${result.paths.config}\n• ${result.paths.assets}\n\nRun: CLIENT=${config.slug} npx expo start --clear`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ Failed to save: ${error.message}`);
    }
  };

  const downloadConfig = async () => {
    const zip = new JSZip();
    
    // Add config file
    const configContent = generateConfigFile(config);
    zip.file(`${config.slug}.config.js`, configContent);
    
    // Add images if present
    const assetsFolder = zip.folder(`assets/${config.slug}`);
    if (assetsFolder) {
      if (images.icon) {
        assetsFolder.file('icon.png', images.icon);
      }
      if (images.splash) {
        assetsFolder.file('splash.png', images.splash);
      }
      if (images.adaptiveIcon) {
        assetsFolder.file('adaptive-icon.png', images.adaptiveIcon);
      }
      if (images.favicon) {
        assetsFolder.file('favicon.png', images.favicon);
      }
    }
    
    // Add README
    const readme = `# ${config.appName} Configuration

## Installation

1. Copy \`${config.slug}.config.js\` to \`/configs/\`
2. Copy \`assets/${config.slug}/\` folder to \`/assets/\`
3. Run: \`npm run validate ${config.slug}\`
4. Run: \`CLIENT=${config.slug} npx expo start --clear\`
`;
    zip.file('README.md', readme);
    
    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.slug}-config.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-3 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
    >
      <span>{title}</span>
      <span className="text-2xl">{expandedSections[section] ? '−' : '+'}</span>
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">App Configuration</h2>

      {/* App Identity */}
      <section className="mb-6 border-b border-gray-200 pb-6">
        <SectionHeader title="App Identity" section="identity" />
        
        {expandedSections.identity && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Name
              </label>
              <input
                type="text"
                value={localAppName}
                onChange={(e) => setLocalAppName(e.target.value)}
                onBlur={(e) => {
                  const appName = e.target.value;
                  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'myapp';
                  const bundleId = `com.${slug}.app`;
                  onChange({
                    ...config,
                    appName,
                    slug,
                    scheme: slug,
                    bundleIdentifier: bundleId,
                    androidPackage: bundleId,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Awesome App"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (auto-generated)
              </label>
              <input
                type="text"
                value={config.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="myawesomeapp"
              />
              <p className="mt-1 text-sm text-gray-500">
                Used in URLs and file names
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                iOS Bundle Identifier
              </label>
              <input
                type="text"
                value={config.bundleIdentifier}
                onChange={(e) => updateField('bundleIdentifier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="com.mycompany.app"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Android Package
              </label>
              <input
                type="text"
                value={config.androidPackage}
                onChange={(e) => updateField('androidPackage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="com.mycompany.app"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <input
                type="text"
                value={config.version}
                onChange={(e) => updateField('version', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.0.0"
              />
            </div>
          </div>
        )}
      </section>

      {/* Brand Colors */}
      <section className="mb-6 border-b border-gray-200 pb-6">
        <SectionHeader title="Brand Colors" section="colors" />
        
        {expandedSections.colors && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <ColorPicker
              label="Primary"
              color={config.brandColors.primary}
              onChange={(color) => updateBrandColor('primary', color)}
            />
            <ColorPicker
              label="Secondary"
              color={config.brandColors.secondary}
              onChange={(color) => updateBrandColor('secondary', color)}
            />
            <ColorPicker
              label="Accent"
              color={config.brandColors.accent}
              onChange={(color) => updateBrandColor('accent', color)}
            />
            <ColorPicker
              label="Background"
              color={config.brandColors.background}
              onChange={(color) => updateBrandColor('background', color)}
            />
            <ColorPicker
              label="Text"
              color={config.brandColors.text}
              onChange={(color) => updateBrandColor('text', color)}
            />
            <ColorPicker
              label="Error"
              color={config.brandColors.error}
              onChange={(color) => updateBrandColor('error', color)}
            />
            <ColorPicker
              label="Success"
              color={config.brandColors.success}
              onChange={(color) => updateBrandColor('success', color)}
            />
          </div>
        )}
      </section>

      {/* App Assets */}
      <section className="mb-6 border-b border-gray-200 pb-6">
        <SectionHeader title="App Assets" section="assets" />
        
        {expandedSections.assets && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <ImageUploader
              label="App Icon"
              description="Main app icon"
              recommendedSize="1024x1024 px"
              image={images.icon}
              onChange={(file) => updateImage('icon', file)}
            />
            <ImageUploader
              label="Splash Screen"
              description="App loading screen"
              recommendedSize="1242x2688 px (portrait)"
              image={images.splash}
              onChange={(file) => updateImage('splash', file)}
            />
            <ImageUploader
              label="Adaptive Icon (Android)"
              description="Android adaptive icon"
              recommendedSize="1024x1024 px"
              image={images.adaptiveIcon}
              onChange={(file) => updateImage('adaptiveIcon', file)}
            />
            <ImageUploader
              label="Favicon"
              description="Website favicon"
              recommendedSize="48x48 px"
              image={images.favicon}
              onChange={(file) => updateImage('favicon', file)}
            />
          </div>
        )}
      </section>

      {/* Typography */}
      <section className="mb-6 border-b border-gray-200 pb-6">
        <SectionHeader title="Typography" section="typography" />
        
        {expandedSections.typography && (
          <div className="space-y-6 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Font Families</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Heading</label>
                  <input
                    type="text"
                    value={config.typography.fontFamily.heading}
                    onChange={(e) => updateTypography('fontFamily', 'heading', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Body</label>
                  <input
                    type="text"
                    value={config.typography.fontFamily.body}
                    onChange={(e) => updateTypography('fontFamily', 'body', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Monospace</label>
                  <input
                    type="text"
                    value={config.typography.fontFamily.monospace}
                    onChange={(e) => updateTypography('fontFamily', 'monospace', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Font Sizes (px)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(config.typography.fontSize).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1 capitalize">{key}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => updateTypography('fontSize', key, parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Font Weights</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(config.typography.fontWeight).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1 capitalize">{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateTypography('fontWeight', key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="mb-6 border-b border-gray-200 pb-6">
        <SectionHeader title="Features" section="features" />
        
        {expandedSections.features && (
          <div className="space-y-4 mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.features.auth}
                onChange={(e) => updateFeature('auth', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Authentication</span>
            </label>

            {config.features.auth && (
              <div className="ml-6 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.features.socialLogin.google}
                    onChange={(e) => updateSocialLogin('google', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Google Login</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.features.socialLogin.apple}
                    onChange={(e) => updateSocialLogin('apple', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Apple Login</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.features.socialLogin.facebook}
                    onChange={(e) => updateSocialLogin('facebook', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Facebook Login</span>
                </label>
              </div>
            )}

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.features.biometric}
                onChange={(e) => updateFeature('biometric', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Biometric Authentication</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.features.notifications}
                onChange={(e) => updateFeature('notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Push Notifications</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.features.darkMode}
                onChange={(e) => updateFeature('darkMode', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Dark Mode</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.features.chat}
                onChange={(e) => updateFeature('chat', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">In-App Chat</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.features.fileUpload}
                onChange={(e) => updateFeature('fileUpload', e.target.checked)}
                className="w-full h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">File Upload</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.features.offlineMode}
                onChange={(e) => updateFeature('offlineMode', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Offline Mode</span>
            </label>
          </div>
        )}
      </section>

      {/* Content & Copy */}
      <section className="mb-6 border-b border-gray-200 pb-6">
        <SectionHeader title="Content & Copy" section="content" />
        
        {expandedSections.content && (
          <div className="space-y-6 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Onboarding Steps</h4>
              {['step1', 'step2', 'step3'].map((step) => (
                <div key={step} className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h5 className="text-xs font-medium text-gray-700 mb-2 capitalize">{step.replace('step', 'Step ')}</h5>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={(config.content.onboarding as any)[step].title}
                      onChange={(e) => updateContent('onboarding', step, 'title', e.target.value)}
                      placeholder="Title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={(config.content.onboarding as any)[step].description}
                      onChange={(e) => updateContent('onboarding', step, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={(config.content.onboarding as any)[step].icon}
                      onChange={(e) => updateContent('onboarding', step, 'icon', e.target.value)}
                      placeholder="Icon (emoji)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Button Labels</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(config.content.buttons).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1 capitalize">{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateContentSimple('buttons', key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tab Labels</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(config.content.tabs).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1 capitalize">{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateContentSimple('tabs', key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Navigation */}
      <section className="mb-6 border-b border-gray-200 pb-6">
        <SectionHeader title="Navigation" section="navigation" />
        
        {expandedSections.navigation && (
          <div className="space-y-6 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tab Bar Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Position</label>
                  <select
                    value={config.navigation.tabBar.position}
                    onChange={(e) => updateNavigationTabBar('position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                  </select>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.navigation.tabBar.showLabels}
                    onChange={(e) => updateNavigationTabBar('showLabels', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Tab Labels</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tabs</h4>
              {config.navigation.tabs.map((tab, index) => (
                <div key={tab.id} className="mb-4 p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <input
                      type="text"
                      value={tab.icon}
                      onChange={(e) => updateNavigationTab(index, 'icon', e.target.value)}
                      placeholder="Icon"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={tab.label}
                      onChange={(e) => updateNavigationTab(index, 'label', e.target.value)}
                      placeholder="Label"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={tab.id}
                      onChange={(e) => updateNavigationTab(index, 'id', e.target.value)}
                      placeholder="ID"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={tab.enabled}
                        onChange={(e) => updateNavigationTab(index, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enabled</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* API Configuration */}
      <section className="mb-8">
        <SectionHeader title="API Configuration" section="api" />
        
        {expandedSections.api && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="url"
                value={config.apiUrl}
                onChange={(e) => updateField('apiUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.myapp.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) => updateField('supportEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="support@myapp.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locale
              </label>
              <select
                value={config.locale}
                onChange={(e) => updateField('locale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Export Buttons */}
      <div className="pt-6 border-t border-gray-200 space-y-3">
        <button
          onClick={saveToProject}
          className="w-full bg-green-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-green-700 transition-colors"
        >
          💾 Save to Project
        </button>
        <p className="text-sm text-gray-500 text-center">
          Automatically saves to /configs/ and /assets/
        </p>
        
        <button
          onClick={downloadConfig}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
        >
          📦 Download Package (ZIP)
        </button>
        <p className="text-sm text-gray-500 text-center">
          For manual installation
        </p>
      </div>
    </div>
  );
}
