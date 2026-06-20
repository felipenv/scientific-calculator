// The non-finite interceptor (CALC-F02).
//
// Native math yields `1` for `0 ** 0`, `+Infinity` for `1 / 0` and `tan(90deg)`,
// and `NaN` for `0 / 0`. The core's invariant (FR20) is that none of those ever
// leak to a consumer: every numeric exit routes through `finite()`, which maps
// any non-finite value to a typed error. Operations that need a more specific
// kind for a known case (e.g. `0 / 0` -> Indeterminate) detect it up front and
// pass the kind in, falling back to `Overflow` for any other stray non-finite.

import { ErrorKind } from '../contract/errors.js';
import { ok, err, type Result } from '../contract/result.js';

/**
 * Pass a finite double through unchanged; convert any `NaN`/`±Infinity` to a
 * typed error.
 *
 * @param x    the value to check — typically the raw result of a native `Math`
 *             call or arithmetic expression.
 * @param kind the kind to report when `x` is non-finite. Defaults to
 *             `Overflow`, the right answer for a finite-input computation whose
 *             result simply left double range.
 */
export function finite(
  x: number,
  kind: ErrorKind = ErrorKind.Overflow,
): Result<number> {
  return Number.isFinite(x) ? ok(x) : err(kind);
}

/** True iff `x` is an exact integer (and finite). `NaN`/`±Infinity` are not. */
export function isInteger(x: number): boolean {
  return Number.isInteger(x);
}

/** True iff `x < 0`. `-0` is not negative; `NaN` is not negative. */
export function isNegative(x: number): boolean {
  return x < 0;
}

/** True iff `x >= 0`. `NaN` is not non-negative. */
export function isNonNegative(x: number): boolean {
  return x >= 0;
}
