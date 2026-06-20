// Unit tests for the non-finite guard (CALC-F02).

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import {
  finite,
  isInteger,
  isNegative,
  isNonNegative,
  isZero,
} from './finite.js';

describe('finite()', () => {
  it('passes finite values through as ok', () => {
    for (const value of [0, -0, 1, -1, 3.14, 1.7976931348623157e308]) {
      expect(finite(value)).toEqual({ ok: true, value });
    }
  });

  it('converts NaN to Overflow by default (AC7)', () => {
    expect(finite(NaN)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });

  it('converts +Infinity and -Infinity to Overflow by default', () => {
    expect(finite(Infinity)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
    expect(finite(-Infinity)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });

  it('honors a caller-supplied kind for non-finite values', () => {
    expect(finite(Infinity, ErrorKind.DivideByZero)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DivideByZero },
    });
    expect(finite(NaN, ErrorKind.Indeterminate)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Indeterminate },
    });
  });

  it('keeps the success branch for finite values even when a kind is given', () => {
    expect(finite(42, ErrorKind.DivideByZero)).toEqual({ ok: true, value: 42 });
  });
});

describe('numeric predicates', () => {
  it('isInteger is true only for exact finite integers', () => {
    expect(isInteger(0)).toBe(true);
    expect(isInteger(-5)).toBe(true);
    expect(isInteger(2.5)).toBe(false);
    expect(isInteger(NaN)).toBe(false);
    expect(isInteger(Infinity)).toBe(false);
  });

  it('isNegative is true only for values below zero', () => {
    expect(isNegative(-0.001)).toBe(true);
    expect(isNegative(0)).toBe(false);
    expect(isNegative(1)).toBe(false);
    expect(isNegative(NaN)).toBe(false);
  });

  it('isNonNegative is the complement for ordered values', () => {
    expect(isNonNegative(0)).toBe(true);
    expect(isNonNegative(2)).toBe(true);
    expect(isNonNegative(-2)).toBe(false);
    expect(isNonNegative(NaN)).toBe(false);
  });

  it('isZero matches both +0 and -0', () => {
    expect(isZero(0)).toBe(true);
    expect(isZero(-0)).toBe(true);
    expect(isZero(0.0000001)).toBe(false);
  });
});
