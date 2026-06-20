// Powers & roots operators (CALC-F02, FR3–FR6).
//
// Native `Math.pow`/`Math.sqrt` are not faithful to the spec's error model:
// `Math.pow(0, 0)` returns `1`, `Math.pow(0, -1)` returns `Infinity`, and a
// negative base with a non-integer exponent returns `NaN`. Each operator does
// its domain-specific special-casing first, then routes the remaining numeric
// exit through `finite()` so nothing non-finite leaks (FR20/AC7).

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite, isInteger, isNegative, isZero } from '../guard/finite.js';

/**
 * Raise `base` to `exponent` (FR3, `y^x`). Special cases, in order:
 * `0^0` → `Indeterminate`; `0^negative` → `DivideByZero`; a negative base with
 * a non-integer exponent has no real result → `DomainError` (AC5). Otherwise
 * the power, with non-finite magnitude → `Overflow`.
 */
export function power(base: number, exponent: number): Result<number> {
  if (isZero(base)) {
    if (isZero(exponent)) {
      return err(ErrorKind.Indeterminate, '0 ^ 0 is indeterminate');
    }
    if (isNegative(exponent)) {
      return err(ErrorKind.DivideByZero, '0 raised to a negative exponent');
    }
  }
  if (isNegative(base) && !isInteger(exponent)) {
    return err(
      ErrorKind.DomainError,
      'negative base with a non-integer exponent has no real result',
    );
  }
  return finite(Math.pow(base, exponent));
}

/** Square `x` (FR4, `x²`). Non-finite magnitude → `Overflow`. */
export function square(x: number): Result<number> {
  return finite(x * x);
}

/**
 * Principal square root of `x` (FR5, `√x`). A negative radicand has no real
 * root → `DomainError`; otherwise the non-negative root.
 */
export function sqrt(x: number): Result<number> {
  if (isNegative(x)) {
    return err(ErrorKind.DomainError, 'square root of a negative number');
  }
  return finite(Math.sqrt(x));
}

/**
 * The real principal `degree`-th root of `radicand` (FR6). A `0`-th root is
 * undefined → `DomainError`. For a negative radicand a real root exists only
 * when `degree` is an odd integer (e.g. cube root); an even or non-integer
 * degree → `DomainError`. Otherwise the root, with non-finite magnitude →
 * `Overflow`.
 */
export function nthRoot(radicand: number, degree: number): Result<number> {
  if (isZero(degree)) {
    return err(ErrorKind.DomainError, '0th root is undefined');
  }
  if (isNegative(radicand)) {
    if (!isInteger(degree) || degree % 2 === 0) {
      return err(
        ErrorKind.DomainError,
        'even or non-integer root of a negative number has no real result',
      );
    }
    // Odd-integer degree: the principal real root keeps the radicand's sign.
    return finite(-Math.pow(-radicand, 1 / degree));
  }
  return finite(Math.pow(radicand, 1 / degree));
}
