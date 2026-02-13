const { z } = require('zod');

/**
 * Comprehensive Zod Schema for Client Configuration
 * 
 * This schema validates all client config files to ensure:
 * - Required fields are present
 * - Data types are correct
 * - Values follow proper formats (bundle IDs, colors, etc.)
 * - Asset paths are specified
 */

// Helper schemas
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: "Must be a valid hex color (e.g., #FF5733)",
});

const bundleIdentifierSchema = z.string().regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/, {
  message: "Must be a valid bundle identifier (e.g., com.company.app)",
});

const androidPackageSchema = z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, {
  message: "Must be a valid Android package name (e.g., com.company.app)",
});

const slugSchema = z.string().regex(/^[a-z][a-z0-9-]*$/, {
  message: "Must be lowercase, start with letter, and contain only letters, numbers, and hyphens",
});

const schemeSchema = z.string().regex(/^[a-z][a-z0-9-]*$/, {
  message: "Must be lowercase, start with letter, and contain only letters, numbers, and hyphens",
});

const assetPathSchema = z.string().startsWith('./assets/', {
  message: "Asset path must start with './assets/'",
});

const versionSchema = z.string().regex(/^\d+\.\d+\.\d+$/, {
  message: "Must be semantic version format (e.g., 1.0.0)",
});

const emailSchema = z.string().email({
  message: "Must be a valid email address",
});

const urlSchema = z.string().url({
  message: "Must be a valid URL starting with http:// or https://",
});

const localeSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, {
  message: "Must be a valid locale code (e.g., en, en-US, es, fr)",
});

// Brand colors schema
const brandColorsSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  accent: hexColorSchema,
  background: hexColorSchema,
  text: hexColorSchema,
  error: hexColorSchema,
  success: hexColorSchema,
}).passthrough();

// Typography schema
const typographySchema = z.object({
  fontFamily: z.object({
    heading: z.string(),
    body: z.string(),
    monospace: z.string(),
  }),
  fontSize: z.object({
    xs: z.number().positive(),
    sm: z.number().positive(),
    md: z.number().positive(),
    lg: z.number().positive(),
    xl: z.number().positive(),
    xxl: z.number().positive(),
  }),
  fontWeight: z.object({
    normal: z.string(),
    medium: z.string(),
    semibold: z.string(),
    bold: z.string(),
  }),
}).optional();

// Social login schema
const socialLoginSchema = z.object({
  google: z.boolean(),
  apple: z.boolean(),
  facebook: z.boolean(),
}).optional();

// Features schema (now more structured)
const featuresSchema = z.object({
  auth: z.boolean().optional(),
  socialLogin: socialLoginSchema,
  biometric: z.boolean().optional(),
  notifications: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  chat: z.boolean().optional(),
  fileUpload: z.boolean().optional(),
  offlineMode: z.boolean().optional(),
}).passthrough().optional();

// Onboarding step schema
const onboardingStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});

// Content schema
const contentSchema = z.object({
  onboarding: z.object({
    step1: onboardingStepSchema,
    step2: onboardingStepSchema,
    step3: onboardingStepSchema,
  }),
  buttons: z.object({
    primary: z.string(),
    secondary: z.string(),
    login: z.string(),
    signup: z.string(),
  }),
  tabs: z.object({
    home: z.string(),
    search: z.string(),
    notifications: z.string(),
    profile: z.string(),
  }),
}).optional();

// Tab config schema
const tabConfigSchema = z.object({
  id: z.string(),
  icon: z.string(),
  label: z.string(),
  enabled: z.boolean(),
});

// Navigation schema
const navigationSchema = z.object({
  tabBar: z.object({
    position: z.enum(['bottom', 'top']),
    showLabels: z.boolean(),
  }),
  tabs: z.array(tabConfigSchema),
}).optional();

// Splash screen schema
const splashSchema = z.object({
  image: assetPathSchema,
  resizeMode: z.enum(['contain', 'cover', 'native']).optional(),
  backgroundColor: hexColorSchema,
});

// iOS configuration schema
const iosSchema = z.object({
  bundleIdentifier: bundleIdentifierSchema,
  icon: assetPathSchema.optional(),
  infoPlist: z.record(z.unknown()).optional(),
});

// Android adaptive icon schema
const adaptiveIconSchema = z.object({
  foregroundImage: assetPathSchema,
  backgroundColor: hexColorSchema,
});

// Android configuration schema
const androidSchema = z.object({
  package: androidPackageSchema,
  icon: assetPathSchema.optional(),
  adaptiveIcon: adaptiveIconSchema,
  permissions: z.array(z.string()).optional(),
});

// Web configuration schema
const webSchema = z.object({
  favicon: assetPathSchema.optional(),
}).optional();

// Main client configuration schema
const clientConfigSchema = z.object({
  // App Identity
  appName: z.string().min(1, "App name is required").max(30, "App name too long (max 30 chars)"),
  slug: slugSchema,
  version: versionSchema.optional(),
  scheme: schemeSchema,
  
  // Assets
  icon: assetPathSchema,
  splash: splashSchema,
  
  // Platform configurations
  ios: iosSchema,
  android: androidSchema,
  web: webSchema,
  
  // Branding
  brandColors: brandColorsSchema,
  typography: typographySchema,
  theme: z.enum(['light', 'dark', 'automatic']).optional(),
  
  // Features
  features: featuresSchema,
  
  // Content
  content: contentSchema,
  
  // Navigation
  navigation: navigationSchema,
  
  // API & Support
  apiUrl: urlSchema.optional(),
  supportEmail: emailSchema.optional(),
  
  // Localization
  locale: localeSchema.optional(),
  supportedLocales: z.array(localeSchema).optional(),
}).passthrough(); // Allow additional custom fields

/**
 * Validates a client configuration object
 * 
 * @param {object} config - The client configuration to validate
 * @returns {{ success: true, data: object } | { success: false, error: ZodError }}
 */
function validateClientConfig(config) {
  return clientConfigSchema.safeParse(config);
}

/**
 * Validates and throws if invalid
 * 
 * @param {object} config - The client configuration to validate
 * @returns {object} The validated configuration
 * @throws {ZodError} If validation fails
 */
function validateClientConfigStrict(config) {
  return clientConfigSchema.parse(config);
}

/**
 * Formats Zod errors into human-readable messages
 * 
 * @param {ZodError} error - The Zod error object
 * @returns {string[]} Array of formatted error messages
 */
function formatZodErrors(error) {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return `${path ? path + ': ' : ''}${err.message}`;
  });
}

module.exports = {
  clientConfigSchema,
  validateClientConfig,
  validateClientConfigStrict,
  formatZodErrors,
  
  // Export individual schemas for testing or custom validation
  schemas: {
    hexColor: hexColorSchema,
    bundleIdentifier: bundleIdentifierSchema,
    androidPackage: androidPackageSchema,
    slug: slugSchema,
    scheme: schemeSchema,
    assetPath: assetPathSchema,
    version: versionSchema,
    email: emailSchema,
    url: urlSchema,
    locale: localeSchema,
    brandColors: brandColorsSchema,
    typography: typographySchema,
    splash: splashSchema,
    ios: iosSchema,
    android: androidSchema,
    web: webSchema,
    features: featuresSchema,
    content: contentSchema,
    navigation: navigationSchema,
  },
};
