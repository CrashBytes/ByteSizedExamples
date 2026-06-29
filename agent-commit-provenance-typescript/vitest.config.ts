import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Everything here is pure and deterministic (node:crypto + in-memory data),
    // so the default parallel runner is fine — no shared global state to guard.
    include: ['test/**/*.test.ts'],
  },
});
