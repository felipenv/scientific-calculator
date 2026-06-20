import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Build + test config for @calc/web.
//
// The web package is a Vite app: `index.html` (package root) is the default
// entry and loads `src/main.ts`, which renders the v0 empty shell. The real
// calculator UI arrives in later web features (CALC-F04+).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Browser-targeted package: render the shell against a DOM.
    environment: 'jsdom',
    // Resolve the workspace dependency to its TypeScript source during tests so
    // the suite runs without first building @calc/core (its package entrypoint
    // points at the un-committed dist/ output).
    alias: {
      '@calc/core': fileURLToPath(
        new URL('../core/src/index.ts', import.meta.url),
      ),
    },
  },
});
