// Tests for the arithmetic operators (CALC-F02).
//
// Golden-value tables for the happy path plus the edge cases the spec pins:
// the two distinct divide-by-zero forms (AC3), overflow of finite inputs, and
// the no-NaN/Infinity invariant across the matrix (AC7).

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import type { Result } from '../contract/result.js';
import { add, subtract, multiply, divide } from './arithmetic.js';

/** Assert a successful result carrying exactly `value`. */
function expectOk(r: Result<number>, value: number): void {
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value).toBe(value);
  }
}

/** Assert a failure carrying exactly `kind`. */
function expectErr(r: Result<number>, kind: ErrorKind): void {
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.kind).toBe(kind);
  }
}

describe('add()', () => {
  it.each([
    [0, 0, 0],
    [1, 2, 3],
    [-5, 5, 0],
    [-3, -4, -7],
    [0.1, 0.2, 0.1 + 0.2],
    [Number.MAX_VALUE, -Number.MAX_VALUE, 0],
  ])('add(%d, %d) = %d', (x, y, expected) => {
    expectOk(add(x, y), expected);
  });

  it('maps a non-finite magnitude to Overflow', () => {
    expectErr(add(Number.MAX_VALUE, Number.MAX_VALUE), ErrorKind.Overflow);
  });
});

describe('subtract()', () => {
  it.each([
    [0, 0, 0],
    [5, 3, 2],
    [3, 5, -2],
    [-3, -4, 1],
  ])('subtract(%d, %d) = %d', (x, y, expected) => {
    expectOk(subtract(x, y), expected);
  });

  it('maps a non-finite magnitude to Overflow', () => {
    expectErr(
      subtract(-Number.MAX_VALUE, Number.MAX_VALUE),
      ErrorKind.Overflow,
    );
  });
});

describe('multiply()', () => {
  it.each([
    [0, 5, 0],
    [2, 3, 6],
    [-2, 3, -6],
    [-2, -3, 6],
    [0.5, 8, 4],
  ])('multiply(%d, %d) = %d', (x, y, expected) => {
    expectOk(multiply(x, y), expected);
  });

  it('maps a non-finite magnitude to Overflow', () => {
    expectErr(multiply(Number.MAX_VALUE, 2), ErrorKind.Overflow);
  });
});

describe('divide()', () => {
  it.each([
    [6, 2, 3],
    [1, 4, 0.25],
    [-6, 2, -3],
    [0, 5, 0],
    [7, 1, 7],
  ])('divide(%d, %d) = %d', (x, y, expected) => {
    expectOk(divide(x, y), expected);
  });

  // AC3: the two divide-by-zero forms are distinct kinds.
  it('divide(1, 0) → DivideByZero (AC3)', () => {
    expectErr(divide(1, 0), ErrorKind.DivideByZero);
  });

  it('divide(-1, 0) → DivideByZero', () => {
    expectErr(divide(-1, 0), ErrorKind.DivideByZero);
  });

  it('divide(0, 0) → Indeterminate (AC3)', () => {
    expectErr(divide(0, 0), ErrorKind.Indeterminate);
  });

  it('maps a non-finite magnitude to Overflow', () => {
    expectErr(divide(Number.MAX_VALUE, Number.MIN_VALUE), ErrorKind.Overflow);
  });
});

// AC7: no arithmetic operation leaks NaN or Infinity over the input matrix.
describe('no NaN/Infinity leaks (AC7)', () => {
  const samples = [
    0,
    -0,
    1,
    -1,
    2.5,
    -2.5,
    Number.MAX_VALUE,
    -Number.MAX_VALUE,
    Number.MIN_VALUE,
  ];

  it.each([
    ['add', add],
    ['subtract', subtract],
    ['multiply', multiply],
    ['divide', divide],
  ] as const)('%s never returns a non-finite value', (_name, op) => {
    for (const x of samples) {
      for (const y of samples) {
        const r = op(x, y);
        if (r.ok) {
          expect(Number.isFinite(r.value)).toBe(true);
        }
      }
    }
  });
});
