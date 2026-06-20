// Tests for the exposed mathematical constants (CALC-F02, AC10): π and e are
// full-precision doubles, and `exp(1)` equals the e constant within tolerance.

import { describe, expect, it } from 'vitest';

import { PI, E } from './constants.js';
import { exp } from './ops/exp-log.js';
import { approxEqual, unwrap } from './test/tolerance.js';

describe('constants (FR18, AC10)', () => {
  it('PI is the full-precision π double', () => {
    expect(PI).toBe(Math.PI);
    expect(Number.isFinite(PI)).toBe(true);
    expect(approxEqual(PI, 3.141592653589793)).toBe(true);
  });

  it('E is the full-precision e double', () => {
    expect(E).toBe(Math.E);
    expect(Number.isFinite(E)).toBe(true);
    expect(approxEqual(E, 2.718281828459045)).toBe(true);
  });

  it('exp(1) equals the E constant within tolerance (AC10)', () => {
    expect(approxEqual(unwrap(exp(1)), E)).toBe(true);
  });
});
