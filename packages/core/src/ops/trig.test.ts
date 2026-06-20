// Tests for the angle-mode-aware trig / inverse-trig operators (CALC-F02).
//
// Covers the angle-mode default and Radians switch (AC1), inverse-trig output
// expressed in the active mode (AC2), the `[-1, 1]` domain rule (AC4), the
// degree↔radian round-trip symmetry (FR13), and the no-Infinity guarantee at
// `tan`'s singularities (AC7/FR10).

import { describe, expect, it } from 'vitest';

import { ErrorKind } from '../contract/errors.js';
import { AngleMode, DEFAULT_ANGLE_MODE } from '../contract/angle-mode.js';
import { closeTo } from '../test/tolerance.js';
import { acos, asin, atan, cos, sin, tan } from './trig.js';

const { Degrees, Radians } = AngleMode;

/** Unwrap a successful result or fail the test with the error kind. */
function value(r: ReturnType<typeof sin>): number {
  expect(r.ok).toBe(true);
  if (!r.ok) {
    throw new Error(`expected ok, got ${r.error.kind}`);
  }
  return r.value;
}

describe('sin / cos / tan (forward)', () => {
  it('interprets input in Degrees, the default mode (AC1)', () => {
    expect(DEFAULT_ANGLE_MODE).toBe(Degrees);
    expect(closeTo(value(sin(90, Degrees)), 1)).toBe(true);
    expect(closeTo(value(sin(30, Degrees)), 0.5)).toBe(true);
    expect(value(cos(0, Degrees))).toBe(1);
    expect(closeTo(value(cos(90, Degrees)), 0)).toBe(true);
    expect(closeTo(value(tan(45, Degrees)), 1)).toBe(true);
  });

  it('interprets input in Radians when selected (AC1)', () => {
    expect(closeTo(value(sin(Math.PI / 2, Radians)), 1)).toBe(true);
    expect(value(cos(0, Radians))).toBe(1);
    expect(closeTo(value(cos(Math.PI, Radians)), -1)).toBe(true);
    expect(closeTo(value(tan(Math.PI / 4, Radians)), 1)).toBe(true);
  });

  it('returns a finite double at tan singularities, never Infinity (AC7)', () => {
    for (const r of [tan(90, Degrees), tan(Math.PI / 2, Radians)]) {
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(Number.isFinite(r.value)).toBe(true);
      }
    }
  });
});

describe('asin / acos / atan (inverse)', () => {
  it('expresses output in the active mode (AC2)', () => {
    expect(closeTo(value(asin(1, Degrees)), 90)).toBe(true);
    expect(closeTo(value(asin(1, Radians)), Math.PI / 2)).toBe(true);
    expect(closeTo(value(acos(0, Degrees)), 90)).toBe(true);
    expect(closeTo(value(acos(1, Radians)), 0)).toBe(true);
    expect(closeTo(value(atan(1, Degrees)), 45)).toBe(true);
    expect(closeTo(value(atan(1, Radians)), Math.PI / 4)).toBe(true);
  });

  it('reports DomainError outside [-1, 1] for asin/acos (AC4)', () => {
    for (const r of [
      asin(2, Degrees),
      asin(-2, Radians),
      acos(2, Degrees),
      acos(-2, Radians),
    ]) {
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.kind).toBe(ErrorKind.DomainError);
      }
    }
  });

  it('accepts the domain endpoints ±1', () => {
    expect(closeTo(value(asin(-1, Degrees)), -90)).toBe(true);
    expect(closeTo(value(acos(-1, Degrees)), 180)).toBe(true);
  });

  it('atan is defined for all reals', () => {
    expect(closeTo(value(atan(0, Degrees)), 0)).toBe(true);
    expect(closeTo(value(atan(1e300, Degrees)), 90)).toBe(true);
    expect(closeTo(value(atan(-1e300, Radians)), -Math.PI / 2)).toBe(true);
  });
});

describe('angle-mode symmetry (FR13)', () => {
  it('round-trips through forward then inverse in each mode', () => {
    expect(closeTo(value(asin(value(sin(30, Degrees)), Degrees)), 30)).toBe(
      true,
    );
    const a = Math.PI / 5;
    expect(closeTo(value(asin(value(sin(a, Radians)), Radians)), a)).toBe(true);
  });
});
