// Tests for the powers & roots operators (CALC-F02).
//
// Golden-value tables plus the boundary cases the spec pins: the `pow` special
// forms (AC5), domain failures for roots, overflow of finite inputs, and the
// no-NaN/Infinity invariant across the matrix (AC7).

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import type { Result } from '../contract/result.js';
import { power, square, sqrt, nthRoot } from './powers.js';

/** Assert a successful result carrying exactly `value`. */
function expectOk(r: Result<number>, value: number): void {
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value).toBe(value);
  }
}

/** Assert a successful result within `tol` of `value` (for transcendental roots). */
function expectClose(r: Result<number>, value: number, tol = 1e-12): void {
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(Math.abs(r.value - value)).toBeLessThanOrEqual(tol);
  }
}

/** Assert a failure carrying exactly `kind`. */
function expectErr(r: Result<number>, kind: ErrorKind): void {
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.kind).toBe(kind);
  }
}

describe('power()', () => {
  it.each([
    [2, 10, 1024],
    [2, -1, 0.5],
    [5, 0, 1],
    [10, 2, 100],
    [-2, 3, -8],
    [-2, 2, 4],
    [9, 0.5, 3],
    [0, 5, 0],
    [1, 0, 1],
  ])('power(%d, %d) = %d', (y, x, expected) => {
    expectOk(power(y, x), expected);
  });

  // AC5: the pow special forms.
  it('power(0, 0) → Indeterminate (AC5)', () => {
    expectErr(power(0, 0), ErrorKind.Indeterminate);
  });

  it('power(0, -1) → DivideByZero (AC5)', () => {
    expectErr(power(0, -1), ErrorKind.DivideByZero);
  });

  it('power(-8, 1/3) → DomainError (negative base, non-integer exponent) (AC5)', () => {
    expectErr(power(-8, 1 / 3), ErrorKind.DomainError);
  });

  it('power(-2, 0.5) → DomainError', () => {
    expectErr(power(-2, 0.5), ErrorKind.DomainError);
  });

  it('maps a non-finite magnitude to Overflow', () => {
    expectErr(power(10, 309), ErrorKind.Overflow);
  });
});

describe('square()', () => {
  it.each([
    [0, 0],
    [2, 4],
    [-3, 9],
    [1.5, 2.25],
  ])('square(%d) = %d', (x, expected) => {
    expectOk(square(x), expected);
  });

  it('maps a non-finite magnitude to Overflow', () => {
    expectErr(square(1e200), ErrorKind.Overflow);
  });
});

describe('sqrt()', () => {
  it.each([
    [0, 0],
    [4, 2],
    [9, 3],
    [0.25, 0.5],
  ])('sqrt(%d) = %d', (x, expected) => {
    expectOk(sqrt(x), expected);
  });

  it('sqrt(2) ≈ 1.41421356', () => {
    expectClose(sqrt(2), Math.SQRT2);
  });

  it('sqrt(-1) → DomainError', () => {
    expectErr(sqrt(-1), ErrorKind.DomainError);
  });
});

describe('nthRoot()', () => {
  it.each([
    [8, 3, 2],
    [16, 4, 2],
    [27, 3, 3],
    [32, 5, 2],
  ])('nthRoot(%d, %d) = %d', (x, n, expected) => {
    expectClose(nthRoot(x, n), expected);
  });

  it('nthRoot(-8, 3) = -2 (odd root of a negative is real)', () => {
    expectClose(nthRoot(-8, 3), -2);
  });

  it('nthRoot(x, 0) → DomainError (0-th root)', () => {
    expectErr(nthRoot(5, 0), ErrorKind.DomainError);
  });

  it('nthRoot(-1, 2) → DomainError (even root of a negative)', () => {
    expectErr(nthRoot(-1, 2), ErrorKind.DomainError);
  });

  it('nthRoot(-16, 4) → DomainError (even root of a negative)', () => {
    expectErr(nthRoot(-16, 4), ErrorKind.DomainError);
  });

  it('nthRoot(-8, 1.5) → DomainError (non-integer root of a negative)', () => {
    expectErr(nthRoot(-8, 1.5), ErrorKind.DomainError);
  });
});

// AC7: no powers/roots operation leaks NaN or Infinity over the input matrix.
describe('no NaN/Infinity leaks (AC7)', () => {
  const samples = [0, -0, 1, -1, 2, -2, 0.5, -0.5, 3, 1e200, -1e200];

  it('power never returns a non-finite value', () => {
    for (const y of samples) {
      for (const x of samples) {
        const r = power(y, x);
        if (r.ok) {
          expect(Number.isFinite(r.value)).toBe(true);
        }
      }
    }
  });

  it.each([
    ['square', square],
    ['sqrt', sqrt],
  ] as const)('%s never returns a non-finite value', (_name, op) => {
    for (const x of samples) {
      const r = op(x);
      if (r.ok) {
        expect(Number.isFinite(r.value)).toBe(true);
      }
    }
  });

  it('nthRoot never returns a non-finite value', () => {
    for (const x of samples) {
      for (const n of samples) {
        const r = nthRoot(x, n);
        if (r.ok) {
          expect(Number.isFinite(r.value)).toBe(true);
        }
      }
    }
  });
});
