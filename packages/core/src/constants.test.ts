// Tests for the exposed mathematical constants (CALC-F02, FR18, AC10).

import { describe, expect, it } from 'vitest';

import { PI, E } from './constants.js';

describe('constants', () => {
  it('exposes pi and e as full-precision doubles', () => {
    expect(PI).toBe(Math.PI);
    expect(E).toBe(Math.E);
  });

  it('are finite doubles', () => {
    expect(Number.isFinite(PI)).toBe(true);
    expect(Number.isFinite(E)).toBe(true);
  });

  it('e equals exp(1) within tolerance (AC10)', () => {
    expect(Math.exp(1)).toBeCloseTo(E, 12);
    // Full precision: the double nearest to e is exactly Math.exp(1) here.
    expect(Math.exp(1)).toBe(E);
  });
});
