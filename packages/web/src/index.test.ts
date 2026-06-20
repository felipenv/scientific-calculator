// Scaffolding smoke test for @calc/web (CALC-F01).
//
// Placeholder only: this verifies the test runner is wired up and that the
// web->core seam compiles and resolves at test time. NO calculator UI or
// behavior is asserted here — the web interface arrives in CALC-F04.

import { describe, expect, it } from 'vitest';

import { CONSUMED_CORE, WEB_PACKAGE } from './index.js';

describe('@calc/web scaffold', () => {
  it('exposes its package marker', () => {
    expect(WEB_PACKAGE).toBe('@calc/web');
  });

  it('consumes @calc/core across the web->core seam', () => {
    expect(CONSUMED_CORE).toBe('@calc/core');
  });
});
