export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  error: string;
  success: string;
}

export interface Typography {
  fontFamily: {
    heading: string;
    body: string;
    monospace: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

export interface SocialLogin {
  google: boolean;
  apple: boolean;
  facebook: boolean;
}

export interface Features {
  auth: boolean;
  socialLogin: SocialLogin;
  biometric: boolean;
  notifications: boolean;
  darkMode: boolean;
  chat: boolean;
  fileUpload: boolean;
  offlineMode: boolean;
  [key: string]: boolean | SocialLogin;
}

export interface OnboardingStep {
  title: string;
  description: string;
  icon?: string;
}

export interface Content {
  onboarding: {
    step1: OnboardingStep;
    step2: OnboardingStep;
    step3: OnboardingStep;
  };
  buttons: {
    primary: string;
    secondary: string;
    login: string;
    signup: string;
  };
  tabs: {
    home: string;
    search: string;
    notifications: string;
    profile: string;
  };
}

export interface TabConfig {
  id: string;
  icon: string;
  label: string;
  enabled: boolean;
}

export interface Navigation {
  tabBar: {
    position: 'bottom' | 'top';
    showLabels: boolean;
  };
  tabs: TabConfig[];
}

export interface AppConfig {
  appName: string;
  slug: string;
  scheme: string;
  version: string;
  bundleIdentifier: string;
  androidPackage: string;
  brandColors: BrandColors;
  typography: Typography;
  features: Features;
  content: Content;
  navigation: Navigation;
  apiUrl: string;
  supportEmail: string;
  locale: string;
}
