// Tests for the golden-test tolerance helper (CALC-F02, Q4). The helper gates
// every transcendental assertion, so its own behavior — especially the
// near-zero floor and the non-finite rejection — is pinned here.

import { describe, expect, it } from 'vitest';

import {
  approxEqual,
  unwrap,
  REL_TOLERANCE,
  ABS_TOLERANCE,
} from './tolerance.js';
import { ok, err } from '../contract/result.js';
import { ErrorKind } from '../contract/errors.js';

describe('approxEqual()', () => {
  it('is true for exactly equal values', () => {
    expect(approxEqual(1, 1)).toBe(true);
    expect(approxEqual(0, -0)).toBe(true);
  });

  it('accepts last-ULP drift within the relative tolerance', () => {
    expect(approxEqual(1, 1 + REL_TOLERANCE / 2)).toBe(true);
    expect(approxEqual(1e6, 1e6 + 1e-7)).toBe(true);
  });

  it('rejects a difference beyond the relative tolerance', () => {
    expect(approxEqual(1, 1.01)).toBe(false);
    expect(approxEqual(1e6, 1e6 + 1)).toBe(false);
  });

  it('uses the absolute floor for near-zero expected values', () => {
    // A purely relative bound (scale 0) would be impossible to satisfy here.
    expect(approxEqual(6.1e-17, 0)).toBe(true);
    expect(approxEqual(ABS_TOLERANCE / 2, 0)).toBe(true);
  });

  it('rejects a near-zero value beyond the absolute floor', () => {
    expect(approxEqual(1e-6, 0)).toBe(false);
  });

  it('never treats non-finite values as close', () => {
    expect(approxEqual(Infinity, Infinity)).toBe(false);
    expect(approxEqual(NaN, NaN)).toBe(false);
    expect(approxEqual(Infinity, 1)).toBe(false);
  });

  it('honors caller-supplied tolerances', () => {
    expect(approxEqual(1, 1.5, 1)).toBe(true);
    expect(approxEqual(0.4, 0, 0, 0.5)).toBe(true);
  });
});

describe('unwrap()', () => {
  it('returns the value of an ok Result', () => {
    expect(unwrap(ok(42))).toBe(42);
  });

  it('throws with the error kind for a failed Result', () => {
    expect(() => unwrap(err(ErrorKind.DomainError))).toThrow(/DomainError/);
  });
});
