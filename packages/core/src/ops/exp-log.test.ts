// Unit tests for the exp/log operators (CALC-F02).
// Covers FR7–FR9, AC4 (ln/log10 domain), AC7 (no NaN/Infinity), AC10 (exp(1)≈e).

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import { isErr, isOk } from '../contract/result.js';
import { isCloseEnough } from '../test/tolerance.js';
import { exp, ln, log10 } from './exp-log.js';

// Full-precision e, the same constant the core exposes (FR18 / AC10). Kept
// local here so this op test does not depend on the constants work item.
const E = Math.E;

describe('exp (FR7)', () => {
  it('exp(0) = 1 exactly', () => {
    expect(exp(0)).toEqual({ ok: true, value: 1 });
  });

  it('exp(1) ≈ e (AC10)', () => {
    const result = exp(1);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(isCloseEnough(result.value, E)).toBe(true);
    }
  });

  it('exp of a negative argument is a small positive double', () => {
    const result = exp(-1);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(isCloseEnough(result.value, 1 / E)).toBe(true);
    }
  });

  it('overflows to Overflow rather than +Infinity (AC7)', () => {
    expect(exp(1000)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
  });
});

describe('ln (FR8)', () => {
  it('ln(1) = 0', () => {
    expect(ln(1)).toEqual({ ok: true, value: 0 });
  });

  it('ln(e) ≈ 1', () => {
    const result = ln(E);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(isCloseEnough(result.value, 1)).toBe(true);
    }
  });

  it('ln(0) → DomainError (AC4, Q1)', () => {
    const result = ln(0);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe(ErrorKind.DomainError);
    }
  });

  it('ln(negative) → DomainError (AC4)', () => {
    const result = ln(-1);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe(ErrorKind.DomainError);
    }
  });
});

describe('log10 (FR9)', () => {
  it('log10(1000) ≈ 3', () => {
    const result = log10(1000);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(isCloseEnough(result.value, 3)).toBe(true);
    }
  });

  it('log10(0) → DomainError (AC4)', () => {
    const result = log10(0);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe(ErrorKind.DomainError);
    }
  });

  it('log10(negative) → DomainError (AC4)', () => {
    const result = log10(-10);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe(ErrorKind.DomainError);
    }
  });
});
