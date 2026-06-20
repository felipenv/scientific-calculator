// Unit tests for the unary / misc operators (CALC-F02): factorial (AC6),
// reciprocal (AC8), sign change, and percent (AC9). The no-NaN/Infinity
// invariant (AC7) is asserted across every error path here.

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import { isOk, type Result } from '../contract/result.js';
import { factorial, negate, percent, reciprocal } from './unary.js';

/** Assert a result is a failure carrying exactly the expected kind. */
function expectErr(result: Result<number>, kind: ErrorKind): void {
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.kind).toBe(kind);
  }
}

/** Assert a result is a success and return its (finite) value. */
function expectOk(result: Result<number>): number {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('expected ok result');
  }
  expect(Number.isFinite(result.value)).toBe(true);
  return result.value;
}

describe('factorial (FR14 / AC6)', () => {
  it('0! = 1 and 1! = 1', () => {
    expect(factorial(0)).toEqual({ ok: true, value: 1 });
    expect(factorial(1)).toEqual({ ok: true, value: 1 });
  });

  it('5! = 120', () => {
    expect(factorial(5)).toEqual({ ok: true, value: 120 });
  });

  it('matches a small golden table', () => {
    expect(factorial(3)).toEqual({ ok: true, value: 6 });
    expect(factorial(4)).toEqual({ ok: true, value: 24 });
    expect(factorial(10)).toEqual({ ok: true, value: 3628800 });
  });

  it('170! is a finite double; 171! is DomainError (overflow boundary)', () => {
    const value = expectOk(factorial(170));
    expect(value).toBeGreaterThan(0);
    expectErr(factorial(171), ErrorKind.DomainError);
    expectErr(factorial(172), ErrorKind.DomainError);
  });

  it('negative input is DomainError', () => {
    expectErr(factorial(-1), ErrorKind.DomainError);
    expectErr(factorial(-10), ErrorKind.DomainError);
  });

  it('non-integer input is DomainError', () => {
    expectErr(factorial(2.5), ErrorKind.DomainError);
    expectErr(factorial(0.1), ErrorKind.DomainError);
  });

  it('never leaks NaN or Infinity across the matrix (AC7)', () => {
    for (const x of [-2.5, -1, 0, 5, 170, 171, 1000]) {
      const result = factorial(x);
      if (isOk(result)) {
        expect(Number.isFinite(result.value)).toBe(true);
      }
    }
  });
});

describe('reciprocal (FR15 / AC8)', () => {
  it('reciprocal of zero is DivideByZero', () => {
    expectErr(reciprocal(0), ErrorKind.DivideByZero);
    expectErr(reciprocal(-0), ErrorKind.DivideByZero);
  });

  it('reciprocal of a non-zero value is 1/x', () => {
    expect(reciprocal(2)).toEqual({ ok: true, value: 0.5 });
    expect(reciprocal(-4)).toEqual({ ok: true, value: -0.25 });
    expect(reciprocal(0.5)).toEqual({ ok: true, value: 2 });
  });

  it('maps a non-finite magnitude to Overflow', () => {
    // 1 / Number.MIN_VALUE overflows the finite double range.
    expectErr(reciprocal(Number.MIN_VALUE), ErrorKind.Overflow);
  });
});

describe('sign change (FR16)', () => {
  it('returns -x and is total over finite inputs', () => {
    expect(negate(5)).toEqual({ ok: true, value: -5 });
    expect(negate(-3)).toEqual({ ok: true, value: 3 });
    expect(negate(0)).toEqual({ ok: true, value: -0 });
  });
});

describe('percent (FR17 / AC9)', () => {
  it('50 -> 0.5', () => {
    expect(percent(50)).toEqual({ ok: true, value: 0.5 });
  });

  it('x -> x / 100', () => {
    expect(percent(100)).toEqual({ ok: true, value: 1 });
    expect(percent(0)).toEqual({ ok: true, value: 0 });
    expect(percent(-25)).toEqual({ ok: true, value: -0.25 });
  });
});
