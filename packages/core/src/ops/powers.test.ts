// Tests for the power/root operators (CALC-F02): AC5 (0^0 → Indeterminate,
// 0^neg → DivideByZero, negative base ^ non-integer → DomainError), AC7 (no
// NaN/Infinity), plus square/sqrt/nthRoot domain and golden values.

import { describe, expect, it } from 'vitest';

import { power, square, sqrt, nthRoot } from './powers.js';
import { ErrorKind } from '../contract/errors.js';
import { approxEqual, unwrap } from '../test/tolerance.js';

const domainError = {
  ok: false,
  error: { kind: ErrorKind.DomainError },
} as const;
const overflow = { ok: false, error: { kind: ErrorKind.Overflow } } as const;

describe('power() (FR3)', () => {
  const cases: [number, number, number][] = [
    [2, 10, 1024],
    [2, -1, 0.5],
    [9, 0.5, 3], // fractional exponent on a positive base
    [5, 0, 1],
    [0, 5, 0], // 0^positive = 0
    [-8, 2, 64], // negative base, integer exponent is fine
    [-2, 3, -8],
  ];
  it.each(cases)('power(%d, %d) = %d', (base, exp, expected) => {
    expect(approxEqual(unwrap(power(base, exp)), expected)).toBe(true);
  });

  it('0^0 is Indeterminate, overriding native pow(0,0)=1 (AC5)', () => {
    expect(power(0, 0)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Indeterminate },
    });
  });

  it('0^(-1) is DivideByZero, overriding native pow(0,-1)=Infinity (AC5)', () => {
    expect(power(0, -1)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DivideByZero },
    });
  });

  it('(-8)^(1/3): negative base, non-integer exponent is DomainError (AC5)', () => {
    expect(power(-8, 1 / 3)).toEqual(domainError);
  });

  it('overflows to Overflow rather than leaking Infinity (AC7)', () => {
    expect(power(10, 400)).toEqual(overflow);
  });
});

describe('square() (FR4)', () => {
  const cases: [number, number][] = [
    [3, 9],
    [-3, 9],
    [0, 0],
    [1.5, 2.25],
  ];
  it.each(cases)('square(%d) = %d', (x, expected) => {
    expect(unwrap(square(x))).toBe(expected);
  });

  it('overflows to Overflow rather than leaking Infinity (AC7)', () => {
    expect(square(Number.MAX_VALUE)).toEqual(overflow);
  });
});

describe('sqrt() (FR5)', () => {
  const cases: [number, number][] = [
    [9, 3],
    [0, 0],
    [2, Math.SQRT2],
  ];
  it.each(cases)('sqrt(%d) = %d', (x, expected) => {
    expect(approxEqual(unwrap(sqrt(x)), expected)).toBe(true);
  });

  it('sqrt(-1) is DomainError (AC4-style domain rule)', () => {
    expect(sqrt(-1)).toEqual(domainError);
  });
});

describe('nthRoot() (FR6)', () => {
  const cases: [number, number, number][] = [
    [8, 3, 2],
    [16, 2, 4],
    [-8, 3, -2], // odd-integer root of a negative is the real negative root
    [-32, 5, -2],
    [1, 100, 1],
    [0, 3, 0],
  ];
  it.each(cases)('nthRoot(%d, %d) = %d', (x, n, expected) => {
    expect(approxEqual(unwrap(nthRoot(x, n)), expected)).toBe(true);
  });

  it('the 0th root is DomainError', () => {
    expect(nthRoot(8, 0)).toEqual(domainError);
  });

  it('an even root of a negative is DomainError (no real result)', () => {
    expect(nthRoot(-16, 2)).toEqual(domainError);
  });

  it('a non-integer root of a negative is DomainError (no real result)', () => {
    expect(nthRoot(-8, 2.5)).toEqual(domainError);
  });
});

// Matrix sweep asserting the AC7 invariant directly: no input combination over
// these operators leaks NaN or Infinity — every outcome is a finite double or a
// typed error.
describe('no operation leaks NaN/Infinity (AC7)', () => {
  const samples = [-1e308, -8, -1, -0.5, 0, 0.5, 1, 8, 1e308];
  it('power over a sample grid', () => {
    for (const base of samples) {
      for (const exp of samples) {
        const r = power(base, exp);
        if (r.ok) expect(Number.isFinite(r.value)).toBe(true);
      }
    }
  });
  it('square / sqrt / nthRoot over a sample grid', () => {
    for (const x of samples) {
      for (const op of [square, sqrt]) {
        const r = op(x);
        if (r.ok) expect(Number.isFinite(r.value)).toBe(true);
      }
      for (const n of samples) {
        const r = nthRoot(x, n);
        if (r.ok) expect(Number.isFinite(r.value)).toBe(true);
      }
    }
  });
});
