import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The OpenTelemetry global tracer provider is process-wide singleton state.
    // Run test files in a single fork (no parallel files) so each test's
    // setupTelemetry() owns the global provider for its duration without racing
    // another file's registration.
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
