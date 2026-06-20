// Unit tests for the angle-mode-aware trig operators (CALC-F02).
// Covers FR10–FR13, AC1 (default Degrees golden values), AC2 (inverse-trig in
// active mode), AC4 (asin/acos domain), AC7 (tan never leaks Infinity).

import { describe, expect, it } from 'vitest';

import { AngleMode } from '../contract/angle-mode.js';
import { ErrorKind } from '../contract/errors.js';
import { isErr, isOk, type Result } from '../contract/result.js';
import { isCloseEnough } from '../test/tolerance.js';
import { acos, asin, atan, cos, sin, tan } from './trig.js';

const DEG = AngleMode.Degrees;
const RAD = AngleMode.Radians;

/** Assert a result is ok and within transcendental tolerance of `expected`. */
function expectClose(result: Result<number>, expected: number): void {
  expect(isOk(result)).toBe(true);
  if (isOk(result)) {
    expect(isCloseEnough(result.value, expected)).toBe(true);
  }
}

/** Assert a result is an error of the given kind. */
function expectError(result: Result<number>, kind: ErrorKind): void {
  expect(isErr(result)).toBe(true);
  if (isErr(result)) {
    expect(result.error.kind).toBe(kind);
  }
}

describe('forward trig — Degrees is the default-mode contract (AC1)', () => {
  it('sin(90°) = 1', () => {
    expectClose(sin(90, DEG), 1);
  });

  it('cos(0°) = 1', () => {
    expectClose(cos(0, DEG), 1);
  });

  it('cos(90°) ≈ 0 (near-zero handled by the absolute floor)', () => {
    expectClose(cos(90, DEG), 0);
  });

  it('sin(30°) = 0.5', () => {
    expectClose(sin(30, DEG), 0.5);
  });

  it('tan(45°) = 1', () => {
    expectClose(tan(45, DEG), 1);
  });
});

describe('forward trig — Radians mode (AC1)', () => {
  it('sin(π/2) = 1', () => {
    expectClose(sin(Math.PI / 2, RAD), 1);
  });

  it('cos(0) = 1', () => {
    expectClose(cos(0, RAD), 1);
  });

  it('sin(π/6) = 0.5', () => {
    expectClose(sin(Math.PI / 6, RAD), 0.5);
  });
});

describe('angle-mode symmetry (FR13): same value, different interpretation', () => {
  it('sin(90) differs between Degrees and Radians', () => {
    // 90° → 1; 90 rad → sin(90 rad) ≈ 0.894..., proving the mode is read.
    expectClose(sin(90, DEG), 1);
    expectClose(sin(90, RAD), Math.sin(90));
  });
});

describe('tan never leaks Infinity (FR10 / AC7)', () => {
  it('tan(90°) is a finite double or Overflow, never Infinity', () => {
    const result = tan(90, DEG);
    if (isOk(result)) {
      expect(Number.isFinite(result.value)).toBe(true);
    } else {
      expect(result.error.kind).toBe(ErrorKind.Overflow);
    }
  });
});

describe('inverse trig — output expressed in the active mode (AC2)', () => {
  it('asin(1) = 90 in Degrees', () => {
    expectClose(asin(1, DEG), 90);
  });

  it('asin(1) ≈ π/2 in Radians', () => {
    expectClose(asin(1, RAD), Math.PI / 2);
  });

  it('acos(0) = 90 in Degrees', () => {
    expectClose(acos(0, DEG), 90);
  });

  it('acos(1) = 0 in both modes', () => {
    expectClose(acos(1, DEG), 0);
    expectClose(acos(1, RAD), 0);
  });

  it('atan(1) = 45 in Degrees and π/4 in Radians', () => {
    expectClose(atan(1, DEG), 45);
    expectClose(atan(1, RAD), Math.PI / 4);
  });
});

describe('inverse trig domain failures (AC4)', () => {
  it('asin(2) → DomainError', () => {
    expectError(asin(2, DEG), ErrorKind.DomainError);
  });

  it('acos(-2) → DomainError', () => {
    expectError(acos(-2, DEG), ErrorKind.DomainError);
  });

  it('asin/acos accept the closed boundary [-1, 1]', () => {
    expect(isOk(asin(-1, RAD))).toBe(true);
    expect(isOk(acos(1, RAD))).toBe(true);
  });
});

describe('round-trip: inverse-then-forward returns the input', () => {
  it('sin(asin(x)) ≈ x in Degrees', () => {
    for (const x of [-0.9, -0.5, 0, 0.25, 0.8, 1]) {
      const angle = asin(x, DEG);
      expect(isOk(angle)).toBe(true);
      if (isOk(angle)) {
        expectClose(sin(angle.value, DEG), x);
      }
    }
  });
});
