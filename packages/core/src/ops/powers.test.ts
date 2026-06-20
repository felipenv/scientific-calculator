// Unit tests for the powers & roots operators (CALC-F02, FR3–FR6).
// Covers golden values, the deliberate native-pow overrides (AC5), domain
// failures, and the no-NaN/Infinity invariant for these ops (AC7).

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import { nthRoot, power, sqrt, square } from './powers.js';

const MAX = Number.MAX_VALUE;

function expectValue(result: { ok: boolean }, expected: number): void {
  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    expect(result.value).toBeCloseTo(expected, 12);
    expect(Number.isFinite(result.value)).toBe(true);
  }
}

describe('power (FR3, y^x)', () => {
  it.each([
    [2, 10, 1024],
    [5, 0, 1],
    [9, 0.5, 3],
    [-2, 3, -8], // negative base, integer exponent is fine
    [-2, 2, 4],
    [2, -1, 0.5],
    [0, 3, 0],
  ])('power(%d, %d) ≈ %d', (base, exp, expected) => {
    expectValue(power(base, exp), expected);
  });

  it('0 ^ 0 → Indeterminate (AC5), overriding native pow(0,0)=1', () => {
    expect(power(0, 0)).toEqual({
      ok: false,
      error: {
        kind: ErrorKind.Indeterminate,
        detail: '0 ^ 0 is indeterminate',
      },
    });
  });

  it('0 ^ negative → DivideByZero (AC5)', () => {
    expect(power(0, -1)).toMatchObject({
      ok: false,
      error: { kind: ErrorKind.DivideByZero },
    });
    expect(power(0, -3.5)).toMatchObject({
      error: { kind: ErrorKind.DivideByZero },
    });
  });

  it('negative base with non-integer exponent → DomainError (AC5)', () => {
    expect(power(-8, 1 / 3)).toMatchObject({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
    expect(power(-2, 0.5)).toMatchObject({
      error: { kind: ErrorKind.DomainError },
    });
  });

  it('true result beyond double range → Overflow (AC7)', () => {
    expect(power(10, 1000)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });
});

describe('square (FR4)', () => {
  it.each([
    [3, 9],
    [-4, 16],
    [0, 0],
    [1.5, 2.25],
  ])('square(%d) = %d', (x, expected) => {
    expectValue(square(x), expected);
  });

  it('overflowing square → Overflow (AC7)', () => {
    expect(square(MAX)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });
});

describe('sqrt (FR5)', () => {
  it.each([
    [9, 3],
    [2, Math.SQRT2],
    [0, 0],
  ])('sqrt(%d) ≈ %d', (x, expected) => {
    expectValue(sqrt(x), expected);
  });

  it('sqrt of a negative → DomainError', () => {
    expect(sqrt(-1)).toMatchObject({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });
});

describe('nthRoot (FR6)', () => {
  it.each([
    [27, 3, 3],
    [16, 2, 4],
    [32, 5, 2],
    [-8, 3, -2], // odd root of a negative is real
    [-32, 5, -2],
    [8, -3, 0.5], // negative degree on a positive radicand
  ])('nthRoot(%d, %d) ≈ %d', (radicand, degree, expected) => {
    expectValue(nthRoot(radicand, degree), expected);
  });

  it('0th root → DomainError', () => {
    expect(nthRoot(5, 0)).toMatchObject({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });

  it('even root of a negative → DomainError', () => {
    expect(nthRoot(-16, 2)).toMatchObject({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });

  it('non-integer root of a negative → DomainError', () => {
    expect(nthRoot(-8, 2.5)).toMatchObject({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });
});

// AC7: across a broad input matrix no powers/roots op ever returns NaN/Infinity
// — every outcome is either a finite double or a typed error kind.
describe('no operation leaks NaN or Infinity (AC7)', () => {
  const samples = [-1e308, -8, -1, -0.5, -0, 0, 0.5, 1, 3, 1e308];
  const binary = [power, nthRoot];
  const unary = [square, sqrt];

  it('binary ops over the matrix', () => {
    for (const op of binary) {
      for (const a of samples) {
        for (const b of samples) {
          const result = op(a, b);
          if (result.ok) {
            expect(Number.isFinite(result.value)).toBe(true);
          } else {
            expect(Object.values(ErrorKind)).toContain(result.error.kind);
          }
        }
      }
    }
  });

  it('unary ops over the matrix', () => {
    for (const op of unary) {
      for (const a of samples) {
        const result = op(a);
        if (result.ok) {
          expect(Number.isFinite(result.value)).toBe(true);
        } else {
          expect(Object.values(ErrorKind)).toContain(result.error.kind);
        }
      }
    }
  });
});
