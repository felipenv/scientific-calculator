// The non-finite interceptor (CALC-F02): the choke point enforcing the
// no-NaN/Infinity invariant (FR20).
//
// Native libm yields `1` for `0 ^ 0`, `+Infinity` for `1 / 0` and `tan(90°)`,
// and `NaN` for `0 / 0`. Operators do their domain-specific special-casing
// first, then route every numeric exit through `finite()`, which converts any
// `NaN`/`±Infinity` that slips through into a typed error. The default kind is
// `Overflow` (the common "true result too large" case); callers pass a more
// specific kind where the math demands it (e.g. `DivideByZero`).

import { ErrorKind } from '../contract/errors.js';
import { err, ok, type Result } from '../contract/result.js';

/**
 * Guard a numeric result: return it wrapped in `ok` when it is a finite double,
 * otherwise convert the non-finite value (`NaN`, `+Infinity`, `-Infinity`) to a
 * typed error. `kind` defaults to {@link ErrorKind.Overflow}.
 */
export function finite(
  value: number,
  kind: ErrorKind = ErrorKind.Overflow,
): Result<number> {
  return Number.isFinite(value) ? ok(value) : err(kind);
}

/** True iff `value` is an exact integer (and finite). */
export function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

/** True iff `value` is a finite negative number (`< 0`). NaN is not negative. */
export function isNegative(value: number): boolean {
  return value < 0;
}

/** True iff `value` is zero or positive (`>= 0`). NaN is not non-negative. */
export function isNonNegative(value: number): boolean {
  return value >= 0;
}

/** True iff `value` is exactly zero (matches both `+0` and `-0`). */
export function isZero(value: number): boolean {
  return value === 0;
}
