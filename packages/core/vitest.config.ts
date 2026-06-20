import { defineConfig } from 'vitest/config';

// Test runner config for @calc/core (CALC-F01 scaffolding).
//
// core is UI-agnostic, so tests run in the plain Node environment — no DOM.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
