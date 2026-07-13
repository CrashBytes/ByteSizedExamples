import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests are pure and offline (the Anthropic client is mocked), so the
    // default node environment is all we need.
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      // Report coverage of the core logic. The demo entrypoint (index.ts) is
      // an I/O harness and is excluded from the coverage denominator.
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
    },
  },
});
