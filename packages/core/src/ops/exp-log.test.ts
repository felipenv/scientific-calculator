// Tests for the exp/log operators (CALC-F02): AC4 (ln/log10 domain), AC7
// (no NaN/Infinity), AC10 (exp(1) ≈ e).

import { describe, expect, it } from 'vitest';

import { exp, ln, log10 } from './exp-log.js';
import { ErrorKind } from '../contract/errors.js';
import { approxEqual, unwrap } from '../test/tolerance.js';

describe('exp() (FR7)', () => {
  it('exp(0) = 1', () => {
    expect(unwrap(exp(0))).toBe(1);
  });

  it('exp(1) ≈ e (AC10)', () => {
    expect(approxEqual(unwrap(exp(1)), Math.E)).toBe(true);
  });

  it('exp(-1) ≈ 1/e', () => {
    expect(approxEqual(unwrap(exp(-1)), 1 / Math.E)).toBe(true);
  });

  it('overflows to Overflow for a large input rather than leaking Infinity (AC7)', () => {
    // exp(710) exceeds the double range (Math.exp(710) === Infinity).
    expect(exp(710)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });
});

describe('ln() (FR8)', () => {
  it('ln(1) = 0', () => {
    expect(unwrap(ln(1))).toBe(0);
  });

  it('ln(e) ≈ 1', () => {
    expect(approxEqual(unwrap(ln(Math.E)), 1)).toBe(true);
  });

  it('is the inverse of exp on a sample point', () => {
    expect(approxEqual(unwrap(ln(unwrap(exp(2)))), 2)).toBe(true);
  });

  it('ln(0) is DomainError (AC4, Q1 — pole kept under one kind)', () => {
    expect(ln(0)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });

  it('ln(negative) is DomainError (AC4)', () => {
    expect(ln(-2)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });
});

describe('log10() (FR9)', () => {
  it('log10(1) = 0', () => {
    expect(unwrap(log10(1))).toBe(0);
  });

  it('log10(1000) ≈ 3', () => {
    expect(approxEqual(unwrap(log10(1000)), 3)).toBe(true);
  });

  it('log10(0) is DomainError (AC4)', () => {
    expect(log10(0)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });

  it('log10(negative) is DomainError (AC4)', () => {
    expect(log10(-10)).toEqual({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
  });
});
