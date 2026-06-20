// Tests for the four-function arithmetic operators (CALC-F02): AC3 (the
// 1/0 vs 0/0 distinction), AC7 (no NaN/Infinity — overflow becomes a typed
// error).

import { describe, expect, it } from 'vitest';

import { add, subtract, multiply, divide } from './arithmetic.js';
import { ErrorKind } from '../contract/errors.js';
import { unwrap } from '../test/tolerance.js';

const overflow = { ok: false, error: { kind: ErrorKind.Overflow } } as const;

describe('add() (FR1)', () => {
  const cases: [number, number, number][] = [
    [1, 2, 3],
    [-5, 5, 0],
    [0.1, 0.2, 0.1 + 0.2], // raw doubles: no rounding owned here
    [-3, -4, -7],
  ];
  it.each(cases)('add(%d, %d) = %d', (x, y, expected) => {
    expect(unwrap(add(x, y))).toBe(expected);
  });

  it('overflows to Overflow rather than leaking Infinity (AC7)', () => {
    expect(add(Number.MAX_VALUE, Number.MAX_VALUE)).toEqual(overflow);
  });
});

describe('subtract() (FR1)', () => {
  const cases: [number, number, number][] = [
    [5, 3, 2],
    [3, 5, -2],
    [0, 0, 0],
    [-2, -2, 0],
  ];
  it.each(cases)('subtract(%d, %d) = %d', (x, y, expected) => {
    expect(unwrap(subtract(x, y))).toBe(expected);
  });

  it('overflows to Overflow rather than leaking -Infinity (AC7)', () => {
    expect(subtract(-Number.MAX_VALUE, Number.MAX_VALUE)).toEqual(overflow);
  });
});

describe('multiply() (FR1)', () => {
  const cases: [number, number, number][] = [
    [3, 4, 12],
    [-3, 4, -12],
    [-3, -4, 12],
    [0, 7, 0],
  ];
  it.each(cases)('multiply(%d, %d) = %d', (x, y, expected) => {
    expect(unwrap(multiply(x, y))).toBe(expected);
  });

  it('overflows to Overflow rather than leaking Infinity (AC7)', () => {
    expect(multiply(Number.MAX_VALUE, 2)).toEqual(overflow);
  });
});

describe('divide() (FR2)', () => {
  const cases: [number, number, number][] = [
    [6, 3, 2],
    [1, 4, 0.25],
    [-6, 3, -2],
    [0, 5, 0],
  ];
  it.each(cases)('divide(%d, %d) = %d', (x, y, expected) => {
    expect(unwrap(divide(x, y))).toBe(expected);
  });

  it('1/0 is DivideByZero (AC3)', () => {
    expect(divide(1, 0)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DivideByZero },
    });
  });

  it('a negative numerator over zero is DivideByZero (AC3)', () => {
    expect(divide(-3, 0)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DivideByZero },
    });
  });

  it('0/0 is Indeterminate, distinct from DivideByZero (AC3)', () => {
    expect(divide(0, 0)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Indeterminate },
    });
  });

  it('treats -0 denominator the same as +0 (AC3)', () => {
    expect(divide(1, -0)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DivideByZero },
    });
  });

  it('overflows to Overflow rather than leaking Infinity (AC7)', () => {
    expect(divide(Number.MAX_VALUE, Number.MIN_VALUE)).toEqual(overflow);
  });
});
