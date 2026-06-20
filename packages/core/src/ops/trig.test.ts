// Tests for the angle-mode-aware trig operators (CALC-F02): AC1 (degrees
// default golden values + radians), AC2 (inverse-trig output in active mode),
// AC4 (asin/acos domain), AC7 (no NaN/Infinity, incl. tan singularities).

import { describe, expect, it } from 'vitest';

import { sin, cos, tan, asin, acos, atan } from './trig.js';
import { AngleMode } from '../contract/angle-mode.js';
import { ErrorKind } from '../contract/errors.js';
import { approxEqual, unwrap } from '../test/tolerance.js';

const DEG = AngleMode.Degrees;
const RAD = AngleMode.Radians;

describe('sin / cos / tan in Degrees (AC1)', () => {
  it('sin(90°) = 1', () => {
    expect(approxEqual(unwrap(sin(90, DEG)), 1)).toBe(true);
  });

  it('sin(0°) = 0', () => {
    expect(approxEqual(unwrap(sin(0, DEG)), 0)).toBe(true);
  });

  it('sin(180°) ≈ 0 (near-zero handled by the absolute floor)', () => {
    expect(approxEqual(unwrap(sin(180, DEG)), 0)).toBe(true);
  });

  it('cos(0°) = 1', () => {
    expect(approxEqual(unwrap(cos(0, DEG)), 1)).toBe(true);
  });

  it('cos(90°) ≈ 0', () => {
    expect(approxEqual(unwrap(cos(90, DEG)), 0)).toBe(true);
  });

  it('tan(45°) ≈ 1', () => {
    expect(approxEqual(unwrap(tan(45, DEG)), 1)).toBe(true);
  });
});

describe('sin / cos / tan in Radians (AC1)', () => {
  it('sin(π/2) = 1', () => {
    expect(approxEqual(unwrap(sin(Math.PI / 2, RAD)), 1)).toBe(true);
  });

  it('cos(π) ≈ -1', () => {
    expect(approxEqual(unwrap(cos(Math.PI, RAD)), -1)).toBe(true);
  });

  it('tan(π/4) ≈ 1', () => {
    expect(approxEqual(unwrap(tan(Math.PI / 4, RAD)), 1)).toBe(true);
  });
});

describe('tan singularities never leak Infinity (FR10, AC7)', () => {
  // Across the singularities the result must be finite (a very large double) or
  // a typed Overflow — never NaN/Infinity. Math.tan returns a huge finite value
  // at the representable-double approximation of these angles.
  const cases: Array<[number, AngleMode]> = [
    [90, DEG],
    [270, DEG],
    [-90, DEG],
    [Math.PI / 2, RAD],
    [(3 * Math.PI) / 2, RAD],
  ];

  for (const [angle, mode] of cases) {
    it(`tan(${angle}, ${mode}) is finite or Overflow, never NaN/Infinity`, () => {
      const r = tan(angle, mode);
      if (r.ok) {
        expect(Number.isFinite(r.value)).toBe(true);
      } else {
        expect(r.error.kind).toBe(ErrorKind.Overflow);
      }
    });
  }
});

describe('inverse trig outputs in the active mode (AC2)', () => {
  it('asin(1) = 90 in Degrees', () => {
    expect(approxEqual(unwrap(asin(1, DEG)), 90)).toBe(true);
  });

  it('asin(1) ≈ 1.5708 in Radians', () => {
    expect(approxEqual(unwrap(asin(1, RAD)), Math.PI / 2)).toBe(true);
  });

  it('acos(0) = 90 in Degrees', () => {
    expect(approxEqual(unwrap(acos(0, DEG)), 90)).toBe(true);
  });

  it('acos(-1) ≈ π in Radians', () => {
    expect(approxEqual(unwrap(acos(-1, RAD)), Math.PI)).toBe(true);
  });

  it('atan(1) = 45 in Degrees', () => {
    expect(approxEqual(unwrap(atan(1, DEG)), 45)).toBe(true);
  });

  it('atan(1) ≈ π/4 in Radians', () => {
    expect(approxEqual(unwrap(atan(1, RAD)), Math.PI / 4)).toBe(true);
  });

  it('atan is defined for all reals, including large magnitudes (FR12)', () => {
    expect(approxEqual(unwrap(atan(1e300, DEG)), 90)).toBe(true);
  });
});

describe('angle-mode symmetry (FR13)', () => {
  // sin consumes an angle in the mode; asin produces one in the same mode — so
  // asin(sin(θ)) round-trips back to θ within the principal range, per mode.
  it('asin(sin(30°)) round-trips to 30° in Degrees', () => {
    const s = unwrap(sin(30, DEG));
    expect(approxEqual(unwrap(asin(s, DEG)), 30)).toBe(true);
  });

  it('asin(sin(0.4 rad)) round-trips to 0.4 in Radians', () => {
    const s = unwrap(sin(0.4, RAD));
    expect(approxEqual(unwrap(asin(s, RAD)), 0.4)).toBe(true);
  });
});

describe('asin / acos domain (FR11, AC4)', () => {
  it('asin(2) is DomainError', () => {
    expect(asin(2, DEG)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });

  it('acos(-2) is DomainError', () => {
    expect(acos(-2, DEG)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });

  it('accepts the inclusive boundaries -1 and 1', () => {
    expect(asin(-1, RAD).ok).toBe(true);
    expect(asin(1, RAD).ok).toBe(true);
    expect(acos(-1, RAD).ok).toBe(true);
    expect(acos(1, RAD).ok).toBe(true);
  });

  it('rejects values just outside the boundary', () => {
    expect(asin(1.0000001, DEG).ok).toBe(false);
    expect(acos(-1.0000001, DEG).ok).toBe(false);
  });
});
