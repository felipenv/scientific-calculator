// Tests for the unary / misc operators (CALC-F02).
//
// Covers the factorial table (AC6), reciprocal (AC8), percent (AC9), sign
// change (FR16), and the no-NaN/Infinity invariant (AC7) across the operators.

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import { factorial, reciprocal, negate, percent } from './unary.js';

/** Assert a successful result and return its value for further checks. */
function value(r: ReturnType<typeof factorial>): number {
  expect(r.ok).toBe(true);
  if (!r.ok) {
    throw new Error(`expected ok, got ${r.error.kind}`);
  }
  return r.value;
}

/** Assert a failure result of the given kind. */
function errorKind(r: ReturnType<typeof factorial>, kind: ErrorKind): void {
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.kind).toBe(kind);
  }
}

describe('factorial() (AC6)', () => {
  it('0! = 1 and 1! = 1', () => {
    expect(value(factorial(0))).toBe(1);
    expect(value(factorial(1))).toBe(1);
  });

  it('5! = 120', () => {
    expect(value(factorial(5))).toBe(120);
  });

  it('matches a reference table for small n', () => {
    const expected = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
    expected.forEach((want, n) => {
      expect(value(factorial(n))).toBe(want);
    });
  });

  it('170! is finite (largest representable factorial)', () => {
    const r = factorial(170);
    const v = value(r);
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
  });

  it('171! returns DomainError (overflows double)', () => {
    errorKind(factorial(171), ErrorKind.DomainError);
  });

  it('negative input returns DomainError', () => {
    errorKind(factorial(-1), ErrorKind.DomainError);
    errorKind(factorial(-5), ErrorKind.DomainError);
  });

  it('non-integer input returns DomainError', () => {
    errorKind(factorial(2.5), ErrorKind.DomainError);
    errorKind(factorial(0.1), ErrorKind.DomainError);
  });

  it('never leaks NaN or Infinity across the boundary (AC7)', () => {
    for (const n of [171, 200, 1000]) {
      const r = factorial(n);
      expect(r.ok).toBe(false);
    }
  });
});

describe('reciprocal() (AC8)', () => {
  it('reciprocal of 0 returns DivideByZero', () => {
    errorKind(reciprocal(0), ErrorKind.DivideByZero);
    errorKind(reciprocal(-0), ErrorKind.DivideByZero);
  });

  it('reciprocal of non-zero returns 1/x', () => {
    expect(value(reciprocal(2))).toBe(0.5);
    expect(value(reciprocal(-4))).toBe(-0.25);
    expect(value(reciprocal(1))).toBe(1);
  });

  it('maps a non-finite reciprocal to Overflow', () => {
    // 1 / Number.MIN_VALUE overflows to Infinity -> Overflow, never leaked.
    errorKind(reciprocal(Number.MIN_VALUE), ErrorKind.Overflow);
  });
});

describe('negate() (FR16)', () => {
  it('returns -x and is total over finite inputs', () => {
    expect(value(negate(5))).toBe(-5);
    expect(value(negate(-3))).toBe(3);
    expect(value(negate(0))).toBe(-0);
    expect(value(negate(1e308))).toBe(-1e308);
  });
});

describe('percent() (AC9)', () => {
  it('50 -> 0.5', () => {
    expect(value(percent(50))).toBe(0.5);
  });

  it('x -> x / 100 for assorted inputs', () => {
    expect(value(percent(0))).toBe(0);
    expect(value(percent(100))).toBe(1);
    expect(value(percent(-25))).toBe(-0.25);
  });
});
