// Tests for the unary/misc operators (CALC-F02): AC6 (factorial table), AC8
// (reciprocal), AC9 (percent 50 → 0.5), and AC7 (no NaN/Infinity).

import { describe, expect, it } from 'vitest';

import { factorial, reciprocal, negate, percent } from './unary.js';
import { ErrorKind } from '../contract/errors.js';
import { approxEqual, unwrap } from '../test/tolerance.js';

const domainError = {
  ok: false,
  error: { kind: ErrorKind.DomainError },
} as const;
const divideByZero = {
  ok: false,
  error: { kind: ErrorKind.DivideByZero },
} as const;

describe('factorial() (FR14, AC6)', () => {
  const cases: [number, number][] = [
    [0, 1], // 0! = 1 by definition
    [1, 1],
    [5, 120],
    [10, 3628800],
    [13, 6227020800],
  ];
  it.each(cases)('factorial(%d) = %d', (x, expected) => {
    expect(unwrap(factorial(x))).toBe(expected);
  });

  it('170! is a finite double (the largest factorial that fits)', () => {
    const r = factorial(170);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Number.isFinite(r.value)).toBe(true);
  });

  it('171! is DomainError, not Overflow (Q2 — one kind for factorial)', () => {
    expect(factorial(171)).toEqual(domainError);
  });

  it('a negative input is DomainError', () => {
    expect(factorial(-1)).toEqual(domainError);
  });

  it('a non-integer input is DomainError', () => {
    expect(factorial(2.5)).toEqual(domainError);
  });
});

describe('reciprocal() (FR15, AC8)', () => {
  const cases: [number, number][] = [
    [2, 0.5],
    [-4, -0.25],
    [0.5, 2],
    [1, 1],
  ];
  it.each(cases)('reciprocal(%d) = %d', (x, expected) => {
    expect(approxEqual(unwrap(reciprocal(x)), expected)).toBe(true);
  });

  it('reciprocal(0) is DivideByZero', () => {
    expect(reciprocal(0)).toEqual(divideByZero);
  });
});

describe('negate() (FR16)', () => {
  const cases: [number, number][] = [
    [5, -5],
    [-5, 5],
    [0, -0],
    [1.5, -1.5],
  ];
  it.each(cases)('negate(%d) = %d', (x, expected) => {
    expect(unwrap(negate(x))).toBe(expected);
  });

  it('is total over finite inputs (always ok, never errors)', () => {
    for (const x of [-1e308, -1, 0, 1, 1e308]) {
      expect(negate(x).ok).toBe(true);
    }
  });
});

describe('percent() (FR17, AC9)', () => {
  const cases: [number, number][] = [
    [50, 0.5],
    [100, 1],
    [0, 0],
    [-25, -0.25],
  ];
  it.each(cases)('percent(%d) = %d', (x, expected) => {
    expect(approxEqual(unwrap(percent(x)), expected)).toBe(true);
  });
});

// Matrix sweep asserting the AC7 invariant directly: no input over these
// operators leaks NaN or Infinity — every outcome is a finite double or a typed
// error.
describe('no operation leaks NaN/Infinity (AC7)', () => {
  const samples = [-1e308, -171, -5, -1, -0.5, 0, 0.5, 1, 5, 170, 171, 1e308];
  it('factorial / reciprocal / negate / percent over a sample grid', () => {
    for (const x of samples) {
      for (const op of [factorial, reciprocal, negate, percent]) {
        const r = op(x);
        if (r.ok) expect(Number.isFinite(r.value)).toBe(true);
      }
    }
  });
});
