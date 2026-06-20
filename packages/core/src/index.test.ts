// Scaffolding smoke test for @calc/core (CALC-F01).
//
// Placeholder only: this verifies the test runner is wired up and the package's
// public entrypoint is importable. NO calculator behavior is asserted here —
// arithmetic, scientific functions, and the RPN engine arrive in CALC-F02+.

import { describe, expect, it } from 'vitest';

import { CORE_PACKAGE } from './index.js';

describe('@calc/core scaffold', () => {
  it('exposes its package marker', () => {
    expect(CORE_PACKAGE).toBe('@calc/core');
  });
});
