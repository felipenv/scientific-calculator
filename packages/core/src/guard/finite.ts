// The non-finite interceptor (CALC-F02): the single chokepoint that enforces
// the "never leak NaN/Infinity" invariant (FR20).
//
// Native libm yields non-finite values for the boundary cases — `+Infinity` for
// `1/0` and `tan(90°)`, `NaN` for `0/0` — so every numeric exit of an operator
// routes through `finite()`, which converts any non-finite double to a typed
// error. Operators that must distinguish a boundary (e.g. `0^0` → Indeterminate
// vs `1/0` → DivideByZero) special-case it *before* the guard; whatever reaches
// the guard and is still non-finite becomes `Overflow` by default.

import type { Result } from '../contract/result.js';
import { ok, err } from '../contract/result.js';
import { ErrorKind } from '../contract/errors.js';

/**
 * Pass a finite double through as a success; convert any non-finite value
 * (`NaN`, `+Infinity`, `-Infinity`) to a typed error.
 *
 * @param x    the candidate result of a computation
 * @param kind the error kind to emit when `x` is non-finite; defaults to
 *             `Overflow`, the right kind for a finite-input operation whose true
 *             result exceeded the double range. Callers pass a different kind
 *             when a non-finite value means something more specific in context.
 */
export function finite(
  x: number,
  kind: ErrorKind = ErrorKind.Overflow,
): Result<number> {
  return Number.isFinite(x) ? ok(x) : err(kind);
}

/** True iff `x` is an integer-valued finite double (`NaN`/`±Infinity` → false). */
export function isInteger(x: number): boolean {
  return Number.isInteger(x);
}

/**
 * True iff `x` is strictly less than zero. `-0` is not negative; `NaN` is not
 * negative. Used by domain checks such as `√x` and factorial validity.
 */
export function isNegative(x: number): boolean {
  return x < 0;
}
