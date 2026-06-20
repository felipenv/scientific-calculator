// Power and root operators (CALC-F02): power `y^x`, square, square root, and
// the real principal nth root.
//
// These are where native `Math.pow` disagrees with the spec's error model, so
// the boundary cases are special-cased *before* the guard: `pow(0, 0)` is `1`
// natively but must be `Indeterminate`, and `pow(0, negative)` is `Infinity`
// but must be `DivideByZero` (FR3/AC5). Inputs with no real result — a negative
// base raised to a non-integer power, an even/non-integer root of a negative,
// or a 0th root — are rejected up front as `DomainError`. Every surviving
// numeric exit routes through `finite()`, so an out-of-range magnitude becomes
// `Overflow` rather than leaking Infinity (FR20/AC7).

import type { Result } from '../contract/result.js';
import { err } from '../contract/result.js';
import { ErrorKind } from '../contract/errors.js';
import { finite, isInteger, isNegative } from '../guard/finite.js';

/** True iff `n` is an even integer (used to reject even roots of negatives). */
function isEvenInteger(n: number): boolean {
  return isInteger(n) && n % 2 === 0;
}

/**
 * `base ^ exponent` (FR3). Special cases the native-`pow` disagreements before
 * computing:
 * - `0 ^ 0` → `Indeterminate` (native `pow` returns `1`).
 * - `0 ^ negative` → `DivideByZero` (native `pow` returns `Infinity`).
 * - negative base with a non-integer exponent (no real result) → `DomainError`.
 *
 * Otherwise the power, with a non-finite magnitude reported as `Overflow`.
 */
export function power(base: number, exponent: number): Result<number> {
  if (base === 0) {
    if (exponent === 0) return err(ErrorKind.Indeterminate);
    if (exponent < 0) return err(ErrorKind.DivideByZero);
    // exponent > 0: 0^positive = 0.
  } else if (isNegative(base) && !isInteger(exponent)) {
    return err(ErrorKind.DomainError);
  }
  return finite(Math.pow(base, exponent));
}

/** `x²` (FR4). Non-finite magnitude (overflow of the square) → `Overflow`. */
export function square(x: number): Result<number> {
  return finite(x * x);
}

/**
 * `√x` (FR5). Domain is `x >= 0`: a negative input has no real square root and
 * is `DomainError`. Otherwise the non-negative principal root.
 */
export function sqrt(x: number): Result<number> {
  if (isNegative(x)) return err(ErrorKind.DomainError);
  return finite(Math.sqrt(x));
}

/**
 * The real principal `n`th root of `x` (FR6), i.e. `x^(1/n)`. Rejected as
 * `DomainError` where no real principal root exists:
 * - `n == 0` (the 0th root is undefined).
 * - `x < 0` with anything but an odd-integer `n` — an even or non-integer root
 *   of a negative has no real value.
 *
 * For a negative `x` with odd-integer `n` the principal root is the real
 * negative root (e.g. `nthRoot(-8, 3) = -2`), computed from the positive
 * magnitude to avoid `Math.pow`'s `NaN` on negative bases. A non-finite
 * magnitude is reported as `Overflow`.
 */
export function nthRoot(x: number, n: number): Result<number> {
  if (n === 0) return err(ErrorKind.DomainError);
  if (isNegative(x)) {
    if (!isInteger(n) || isEvenInteger(n)) return err(ErrorKind.DomainError);
    // Odd-integer n: the real root is the negative of the positive root.
    return finite(-Math.pow(-x, 1 / n));
  }
  return finite(Math.pow(x, 1 / n));
}
