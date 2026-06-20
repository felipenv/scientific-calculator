// Four-function arithmetic operators (CALC-F02): add, subtract, multiply,
// divide.
//
// Pure functions of one or two doubles. The additive/multiplicative operators
// have no input-domain failures — their only failure is an out-of-range result,
// caught by the non-finite guard as `Overflow` (FR1). Division adds the two
// zero-denominator distinctions the spec calls out: a finite numerator over
// zero is `DivideByZero`, while `0/0` is `Indeterminate` (FR2/AC3). Every
// numeric exit routes through `finite()` so no operation leaks NaN/Infinity
// (FR20/AC7).

import type { Result } from '../contract/result.js';
import { err } from '../contract/result.js';
import { ErrorKind } from '../contract/errors.js';
import { finite } from '../guard/finite.js';

/** `x + y` (FR1). Non-finite magnitude (overflow of the sum) → `Overflow`. */
export function add(x: number, y: number): Result<number> {
  return finite(x + y);
}

/** `x - y` (FR1). Non-finite magnitude → `Overflow`. */
export function subtract(x: number, y: number): Result<number> {
  return finite(x - y);
}

/** `x * y` (FR1). Non-finite magnitude → `Overflow`. */
export function multiply(x: number, y: number): Result<number> {
  return finite(x * y);
}

/**
 * `x / y` (FR2). The two zero-denominator forms are distinguished before the
 * guard runs (AC3):
 * - `y == 0`, `x != 0` → `DivideByZero` (an infinite true result).
 * - `x == 0`, `y == 0` → `Indeterminate` (`0/0` has no defined value).
 *
 * Otherwise the quotient, with a non-finite magnitude (e.g. a finite numerator
 * over a tiny denominator that overflows) reported as `Overflow`.
 */
export function divide(x: number, y: number): Result<number> {
  if (y === 0) {
    return err(x === 0 ? ErrorKind.Indeterminate : ErrorKind.DivideByZero);
  }
  return finite(x / y);
}
