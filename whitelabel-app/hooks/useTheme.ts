import Constants from 'expo-constants';

/**
 * Theme Hook - Access brand colors and configuration
 * 
 * Returns the current client's theme configuration including
 * brand colors, app name, features, and other settings.
 */
export function useTheme() {
  const extra = Constants.expoConfig?.extra;
  
  const colors = extra?.brandColors || {
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#FF9500',
    background: '#FFFFFF',
    text: '#000000',
    error: '#FF3B30',
    success: '#34C759',
  };

  const config = {
    appName: extra?.appName || 'White Label App',
    clientName: extra?.clientName || 'default',
    features: extra?.features || {},
    apiUrl: extra?.apiUrl || '',
    supportEmail: extra?.supportEmail || '',
    locale: extra?.locale || 'en',
    version: extra?.version || '1.0.0',
  };

  return {
    colors,
    config,
  };
}
