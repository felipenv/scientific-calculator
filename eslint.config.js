// @ts-check
//
// Flat ESLint config for the scientific-calculator workspace (ESLint v9+).
//
// Note on ignores: flat config does NOT read a `.eslintignore` file (ESLint v9
// rejects it). The equivalent lives in the `ignores` block below — that is the
// canonical place to exclude paths under flat config.

import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Repo-wide ignores (flat-config replacement for .eslintignore).
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.tsbuildinfo'],
  },

  // Base recommended rule sets.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // Repo-wide language options.
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

  {
    // core/web boundary (CALC-F01): the UI-agnostic core package must never
    // import from the web package, in either its package-name or relative form.
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@calc/web',
                '@calc/web/**',
                '**/packages/web/**',
                '**/web/*',
              ],
              message:
                'core is UI-agnostic and must not import from web (CALC-F01 core/web boundary).',
            },
          ],
        },
      ],
    },
  },

  {
    // The web package targets a browser runtime.
    files: ['packages/web/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // Disable stylistic rules that would conflict with Prettier. Keep last.
  prettier,
);
