// Unit tests for the four-function arithmetic operators (CALC-F02, FR1–FR2).
// Covers golden values, the DivideByZero/Indeterminate split (AC3), and the
// no-NaN/Infinity invariant for these ops (AC7).

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import { add, divide, multiply, subtract } from './arithmetic.js';

const MAX = Number.MAX_VALUE;

describe('add / subtract / multiply (FR1)', () => {
  it.each([
    [add, 2, 3, 5],
    [add, -4, 4, 0],
    [add, 0.1, 0.2, 0.1 + 0.2],
    [subtract, 10, 3, 7],
    [subtract, 3, 10, -7],
    [multiply, 6, 7, 42],
    [multiply, -3, 5, -15],
    [multiply, 0, 12345, 0],
  ])('%o(%d, %d) = %d', (op, x, y, expected) => {
    expect(op(x, y)).toEqual({ ok: true, value: expected });
  });

  it('returns Overflow when a finite-input result exceeds double range (AC7)', () => {
    expect(add(MAX, MAX)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
    expect(subtract(-MAX, MAX)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
    expect(multiply(MAX, MAX)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });
});

describe('divide (FR2)', () => {
  it.each([
    [6, 2, 3],
    [7, 2, 3.5],
    [-9, 3, -3],
    [0, 5, 0],
  ])('divide(%d, %d) = %d', (x, y, expected) => {
    expect(divide(x, y)).toEqual({ ok: true, value: expected });
  });

  it('1 / 0 → DivideByZero (AC3)', () => {
    expect(divide(1, 0)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DivideByZero, detail: 'division by zero' },
    });
  });

  it('non-zero / 0 → DivideByZero for negatives and -0 too (AC3)', () => {
    expect(divide(-1, 0).ok).toBe(false);
    expect(divide(-1, 0)).toMatchObject({
      error: { kind: ErrorKind.DivideByZero },
    });
    expect(divide(5, -0)).toMatchObject({
      error: { kind: ErrorKind.DivideByZero },
    });
  });

  it('0 / 0 → Indeterminate, distinct from DivideByZero (AC3)', () => {
    expect(divide(0, 0)).toEqual({
      ok: false,
      error: {
        kind: ErrorKind.Indeterminate,
        detail: '0 / 0 is indeterminate',
      },
    });
    expect(divide(-0, 0)).toMatchObject({
      error: { kind: ErrorKind.Indeterminate },
    });
  });

  it('returns Overflow when the quotient exceeds double range (AC7)', () => {
    expect(divide(MAX, Number.MIN_VALUE)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });
});
