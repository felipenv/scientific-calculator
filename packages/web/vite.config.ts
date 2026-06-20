import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Build + test config for @calc/web (CALC-F01 scaffolding).
//
// The web package is bundled by Vite. There is no UI yet (the web interface
// arrives in CALC-F04), so this builds the placeholder entrypoint in library
// mode purely to prove the build pipeline works end to end.
export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
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
