// Unit tests for the full-precision constants (CALC-F02, FR18 / AC10).

import { describe, expect, it } from 'vitest';

import { E, PI } from './constants.js';

describe('constants (FR18 / AC10)', () => {
  it('exposes π and e as full-precision doubles', () => {
    expect(PI).toBe(Math.PI);
    expect(E).toBe(Math.E);
  });

  it('are finite, unformatted doubles', () => {
    expect(Number.isFinite(PI)).toBe(true);
    expect(Number.isFinite(E)).toBe(true);
  });

  it('exp(1) equals the e constant within tolerance (AC10)', () => {
    expect(Math.exp(1)).toBeCloseTo(E, 12);
  });
});
