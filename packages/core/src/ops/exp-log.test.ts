// Tests for the exponential / logarithm operators (CALC-F02).
//
// Covers the happy path (golden values within the pinned tolerance), the shared
// domain rule for `ln`/`log10` (AC4), magnitude overflow, and the no-NaN/no-Inf
// invariant (AC7). `exp(1) ≈ e` is AC10.

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import { closeTo } from '../test/tolerance.js';
import { exp, ln, log10 } from './exp-log.js';

/** Unwrap a successful result or fail the test with the error kind. */
function value(r: ReturnType<typeof exp>): number {
  expect(r.ok).toBe(true);
  if (!r.ok) {
    throw new Error(`expected ok, got ${r.error.kind}`);
  }
  return r.value;
}

describe('exp()', () => {
  it('matches golden values', () => {
    expect(closeTo(value(exp(0)), 1)).toBe(true);
    expect(closeTo(value(exp(1)), Math.E)).toBe(true); // AC10
    expect(closeTo(value(exp(-1)), 1 / Math.E)).toBe(true);
    expect(closeTo(value(exp(2)), Math.E * Math.E)).toBe(true);
  });

  it('overflows to Overflow past double range (AC7)', () => {
    const r = exp(1000);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe(ErrorKind.Overflow);
    }
  });

  it('underflows to a finite 0, not an error', () => {
    expect(value(exp(-1000))).toBe(0);
  });
});

describe('ln()', () => {
  it('matches golden values', () => {
    expect(value(ln(1))).toBe(0);
    expect(closeTo(value(ln(Math.E)), 1)).toBe(true);
    expect(closeTo(value(ln(Math.E * Math.E)), 2)).toBe(true);
  });

  it('reports DomainError for non-positive input (AC4)', () => {
    for (const x of [0, -0, -1, -1e308]) {
      const r = ln(x);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.kind).toBe(ErrorKind.DomainError);
      }
    }
  });
});

describe('log10()', () => {
  it('matches golden values', () => {
    expect(value(log10(1))).toBe(0);
    expect(closeTo(value(log10(10)), 1)).toBe(true);
    expect(closeTo(value(log10(1000)), 3)).toBe(true);
  });

  it('reports DomainError for non-positive input (AC4)', () => {
    for (const x of [0, -0, -1, -1e308]) {
      const r = log10(x);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.kind).toBe(ErrorKind.DomainError);
      }
    }
  });
});
