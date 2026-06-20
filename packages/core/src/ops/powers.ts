// Powers & roots operators for @calc/core (CALC-F02).
//
// power (`y^x`), square, square root, and nth root of the v0 set (FR3–FR6).
// Each returns a `Result<number>` — a finite double or a typed error, never a
// raw `NaN`/`Infinity` (FR20). Native `Math.pow` is not a faithful match for
// the spec at its boundary cases (it yields `1` for `0 ** 0` and `+Infinity`
// for `0 ** negative`), so those forms are detected and overridden before the
// universal `finite()` post-check.

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite, isInteger, isNegative } from '../guard/finite.js';

/**
 * `y ^ x` (FR3), with `y` the base and `x` the exponent.
 *
 * Special forms detected up front, since native `Math.pow` does not match the
 * spec:
 * - `0 ^ 0` → `Indeterminate` (native yields `1`).
 * - `0 ^ negative` → `DivideByZero` (native yields `+Infinity`).
 * - negative base with a non-integer exponent → `DomainError` (no real result;
 *   native yields `NaN`).
 *
 * Otherwise the power, with any non-finite magnitude mapped to `Overflow`.
 */
export function power(y: number, x: number): Result<number> {
  if (y === 0) {
    if (x === 0) return err(ErrorKind.Indeterminate);
    if (isNegative(x)) return err(ErrorKind.DivideByZero);
  }
  if (isNegative(y) && !isInteger(x)) {
    return err(ErrorKind.DomainError);
  }
  return finite(Math.pow(y, x));
}

/** `x²` (FR4) — `x * x`, with non-finite magnitude mapped to `Overflow`. */
export function square(x: number): Result<number> {
  return finite(x * x);
}

/**
 * `√x` (FR5).
 *
 * `x < 0` → `DomainError` (no real root). Otherwise the non-negative principal
 * root; `√` of an in-range value is always finite, but the guard keeps the
 * invariant uniform.
 */
export function sqrt(x: number): Result<number> {
  if (isNegative(x)) return err(ErrorKind.DomainError);
  return finite(Math.sqrt(x));
}

/**
 * The real principal `n`-th root of `x` (FR6): `x ^ (1/n)`.
 *
 * `DomainError` where no real principal root exists:
 * - `n == 0` (the 0-th root is undefined).
 * - an even root of a negative radicand (e.g. `√-1`, 4th root of `-1`).
 *
 * Odd roots of negatives are real and are computed on the magnitude with the
 * sign reapplied, since `Math.pow(negative, 1/3)` yields `NaN` rather than the
 * real root. Any non-finite magnitude maps to `Overflow`.
 */
export function nthRoot(x: number, n: number): Result<number> {
  if (n === 0) return err(ErrorKind.DomainError);

  if (isNegative(x)) {
    // A real root of a negative radicand exists only for odd integer degrees.
    if (!isInteger(n) || n % 2 === 0) {
      return err(ErrorKind.DomainError);
    }
    // Compute on the magnitude and reapply the sign: Math.pow(-8, 1/3) is NaN.
    const root = Math.pow(-x, 1 / n);
    return finite(-root);
  }

  return finite(Math.pow(x, 1 / n));
}
