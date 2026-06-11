// Flat ESLint config covering the rag-core and server TypeScript sources.
// The Expo app has its own (Babel/Metro) toolchain and is linted via tsc.
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "app/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
