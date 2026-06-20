// Tests for the non-finite guard (CALC-F02): the chokepoint enforcing the
// "never leak NaN/Infinity" invariant (FR20, AC7).

import { describe, expect, it } from 'vitest';

import { finite, isInteger, isNegative } from './finite.js';
import { ErrorKind } from '../contract/errors.js';

describe('finite()', () => {
  it('passes finite values through as success, including 0 and negatives', () => {
    for (const x of [0, -0, 1, -1, 3.14, -2.5, Number.MAX_VALUE]) {
      expect(finite(x)).toEqual({ ok: true, value: x });
    }
  });

  it('converts +Infinity to Overflow by default', () => {
    expect(finite(Infinity)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });

  it('converts -Infinity to Overflow by default', () => {
    expect(finite(-Infinity)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });

  it('converts NaN to Overflow by default', () => {
    expect(finite(NaN)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });

  it('honors a caller-supplied kind for non-finite values', () => {
    // e.g. reciprocal/divide route a non-finite result to DivideByZero instead.
    expect(finite(Infinity, ErrorKind.DivideByZero)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DivideByZero },
    });
    expect(finite(NaN, ErrorKind.Indeterminate)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Indeterminate },
    });
  });

  it('keeps the supplied kind only on the error path — finite ignores it', () => {
    expect(finite(5, ErrorKind.DivideByZero)).toEqual({ ok: true, value: 5 });
  });

  it('models the real overflow boundary: MAX_VALUE ok, 2× it Overflow', () => {
    expect(finite(Number.MAX_VALUE).ok).toBe(true);
    expect(finite(Number.MAX_VALUE * 2)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });
});

describe('isInteger()', () => {
  it('is true for integer-valued doubles', () => {
    for (const x of [0, -0, 1, -7, 170, 1e21]) {
      expect(isInteger(x)).toBe(true);
    }
  });

  it('is false for non-integers and non-finite values', () => {
    for (const x of [2.5, -0.1, NaN, Infinity, -Infinity]) {
      expect(isInteger(x)).toBe(false);
    }
  });
});

describe('isNegative()', () => {
  it('is true only for values strictly below zero', () => {
    expect(isNegative(-1)).toBe(true);
    expect(isNegative(-Infinity)).toBe(true);
    expect(isNegative(-1e-300)).toBe(true);
  });

  it('treats 0, -0, and positives as non-negative', () => {
    expect(isNegative(0)).toBe(false);
    expect(isNegative(-0)).toBe(false);
    expect(isNegative(1)).toBe(false);
  });

  it('treats NaN as non-negative (all NaN comparisons are false)', () => {
    expect(isNegative(NaN)).toBe(false);
  });
});
