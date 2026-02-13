/**
 * Jest Configuration for AI Token Cost Tracker
 * Target: 100% code coverage for CrashBytes tutorial
 */

export default {
  // Use Node environment (not jsdom) since this is a Chrome extension
  testEnvironment: 'node',

  // Inject jest globals (needed for ES modules)
  injectGlobals: true,

  // Don't transform ES modules (we're using native ESM)
  transform: {},

  // Handle .js imports in ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Files to collect coverage from
  collectCoverageFrom: [
    'lib/**/*.js',
    'background/cost-calculator.js',
    // Exclude Chrome extension runtime files (not unit testable)
    '!background/request-interceptor.js',
    '!background/service-worker.js',
    '!**/*.test.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],

  // 100% coverage thresholds - CrashBytes tutorial standard
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js',
  ],

  // Verbose output for learning
  verbose: true,

  // Setup files (for Chrome API mocks)
  setupFilesAfterEnv: ['<rootDir>/__mocks__/chrome-setup.js'],
};
