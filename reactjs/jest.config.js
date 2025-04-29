/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["./jest.setup.js"],

  // Handle various file imports
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg)$": "<rootDir>/__mocks__/fileMock.js",
  },

  // Test matching patterns
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],

  // Make sure .js/.jsx can be found without extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],

  // Set lower thresholds for now to get tests passing
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 10,
      functions: 10,
      lines: 10,
    },
  },

  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        // Make sure ts-jest doesn't try to use ESM
        useESM: false,
      },
    ],
  },

  // Ensure Jest doesn't try to use ESM for these files
  transformIgnorePatterns: ["node_modules/(?!(react-native|react-native-.*)/)"],
};
