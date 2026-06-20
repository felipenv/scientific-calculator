// Tests for the non-finite guard (CALC-F02).
//
// Core invariant (FR20, AC7): no operation leaks NaN/Infinity. `finite()` is
// the chokepoint that enforces it, so it carries the heaviest coverage here —
// finite passthrough, every flavor of non-finite, the default Overflow kind,
// and caller-supplied kind override.

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import { finite, isInteger, isNegative, isNonNegative } from './finite.js';

describe('finite()', () => {
  it('passes finite values through unchanged', () => {
    for (const x of [0, -0, 1, -1, 3.14, 1e308, -1e308, Number.MIN_VALUE]) {
      const r = finite(x);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.value).toBe(x);
      }
    }
  });

  it('maps non-finite values to Overflow by default (AC7)', () => {
    for (const x of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      1 / 0,
      -1 / 0,
      0 / 0,
    ]) {
      const r = finite(x);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.kind).toBe(ErrorKind.Overflow);
      }
    }
  });

  it('uses the caller-supplied kind for known special cases', () => {
    // e.g. 0/0 -> Indeterminate, 1/0 -> DivideByZero detected by the operator.
    const indeterminate = finite(0 / 0, ErrorKind.Indeterminate);
    expect(indeterminate.ok).toBe(false);
    if (!indeterminate.ok) {
      expect(indeterminate.error.kind).toBe(ErrorKind.Indeterminate);
    }

    const divByZero = finite(1 / 0, ErrorKind.DivideByZero);
    expect(divByZero.ok).toBe(false);
    if (!divByZero.ok) {
      expect(divByZero.error.kind).toBe(ErrorKind.DivideByZero);
    }
  });

  it('still passes finite values through even when a kind is supplied', () => {
    const r = finite(2, ErrorKind.DivideByZero);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBe(2);
    }
  });
});

describe('isInteger()', () => {
  it('is true for exact integers including signed zero', () => {
    for (const x of [0, -0, 1, -1, 170, -170, 1e15]) {
      expect(isInteger(x)).toBe(true);
    }
  });

  it('is false for non-integers and non-finite values', () => {
    for (const x of [
      2.5,
      -0.1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expect(isInteger(x)).toBe(false);
    }
  });
});

describe('isNegative() / isNonNegative()', () => {
  it('classifies the sign of finite values', () => {
    expect(isNegative(-1)).toBe(true);
    expect(isNegative(-0.0001)).toBe(true);
    expect(isNegative(0)).toBe(false);
    expect(isNegative(-0)).toBe(false);
    expect(isNegative(1)).toBe(false);

    expect(isNonNegative(0)).toBe(true);
    expect(isNonNegative(-0)).toBe(true);
    expect(isNonNegative(1)).toBe(true);
    expect(isNonNegative(-1)).toBe(false);
  });

  it('treats NaN as neither negative nor non-negative', () => {
    expect(isNegative(Number.NaN)).toBe(false);
    expect(isNonNegative(Number.NaN)).toBe(false);
  });
});
