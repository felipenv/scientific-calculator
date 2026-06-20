// Unary / misc operators for the calculator core (CALC-F02): factorial,
// reciprocal, sign change, and percent (FR14–FR17).
//
// Each is a pure function of its single double operand returning a `Result`:
// either a finite double or a typed error — never raw NaN/Infinity (FR20).
// Every numeric exit routes through `guard.finite()` so any would-be non-finite
// value is converted to the appropriate kind. None of these read the angle mode
// (only trig/inverse-trig do).

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite, isInteger, isNegative, isZero } from '../guard/finite.js';

/**
 * The smallest factorial argument that overflows a double: `171!` exceeds the
 * finite double range (`170!` ≈ 7.26e306 is the largest representable). Per the
 * spec (FR14 / Open Question Q2) the whole factorial contract surfaces a single
 * {@link ErrorKind.DomainError}, so this boundary is rejected as a domain
 * failure rather than mixing in `Overflow`.
 */
const FACTORIAL_OVERFLOW_THRESHOLD = 171;

/**
 * Factorial `x!`, defined for non-negative integers only (FR14). Negative,
 * non-integer, or `x >= 171` (would overflow a double) inputs all return
 * {@link ErrorKind.DomainError} — the single kind for the entire factorial
 * contract. `0! = 1`. The finite guard is a defensive backstop; valid inputs in
 * `[0, 170]` always produce a finite product.
 */
export function factorial(x: number): Result<number> {
  if (!isInteger(x)) {
    return err(ErrorKind.DomainError, 'factorial requires an integer');
  }
  if (isNegative(x)) {
    return err(
      ErrorKind.DomainError,
      'factorial requires a non-negative input',
    );
  }
  if (x >= FACTORIAL_OVERFLOW_THRESHOLD) {
    return err(ErrorKind.DomainError, 'factorial overflows beyond 170!');
  }

  let product = 1;
  for (let n = 2; n <= x; n += 1) {
    product *= n;
  }
  return finite(product);
}

/**
 * Reciprocal `1 / x` (FR15). `x == 0` returns {@link ErrorKind.DivideByZero};
 * otherwise the quotient, with a non-finite magnitude (e.g. `1` over a
 * denormal) mapped to {@link ErrorKind.Overflow} by the finite guard.
 */
export function reciprocal(x: number): Result<number> {
  if (isZero(x)) {
    return err(ErrorKind.DivideByZero, 'reciprocal of zero');
  }
  return finite(1 / x);
}

/**
 * Sign change `±` (FR16): returns `-x`. Total over finite inputs — never an
 * error — but the result still routes through the finite guard to uphold the
 * no-NaN/Infinity invariant uniformly.
 */
export function negate(x: number): Result<number> {
  return finite(-x);
}

/**
 * Percent `%` (FR17): the unary form `x → x / 100` for v0. The two-operand
 * markup form is a deferred additive change (Open Question Q3). Routed through
 * the finite guard for invariant uniformity.
 */
export function percent(x: number): Result<number> {
  return finite(x / 100);
}
