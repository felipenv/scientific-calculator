// Tests for the golden-value tolerance helper (CALC-F02, Q4).
//
// The helper underpins every transcendental assertion, so its own behavior is
// pinned here: exact matches, the absolute floor near zero, the relative band
// for large magnitudes, and rejection of genuinely-wrong values.

import { describe, expect, it } from 'vitest';

import { ABS_TOLERANCE, REL_TOLERANCE, closeTo } from './tolerance.js';

describe('closeTo()', () => {
  it('accepts exact equality, including signed zero', () => {
    expect(closeTo(1, 1)).toBe(true);
    expect(closeTo(0, -0)).toBe(true);
    expect(closeTo(-2.5, -2.5)).toBe(true);
  });

  it('uses the absolute floor for values near zero', () => {
    expect(closeTo(0, ABS_TOLERANCE / 2)).toBe(true);
    expect(closeTo(0, ABS_TOLERANCE * 10)).toBe(false);
  });

  it('uses the relative band for large magnitudes', () => {
    const big = 1e6;
    expect(closeTo(big, big * (1 + REL_TOLERANCE / 2))).toBe(true);
    expect(closeTo(big, big * (1 + REL_TOLERANCE * 10))).toBe(false);
  });

  it('rejects clearly-wrong values', () => {
    expect(closeTo(1, 1.1)).toBe(false);
    expect(closeTo(90, 1.5708)).toBe(false);
  });

  it('honors caller-supplied tolerances', () => {
    expect(closeTo(1, 1.05, 0.1)).toBe(true);
    expect(closeTo(1, 1.05, 1e-9)).toBe(false);
  });
});
