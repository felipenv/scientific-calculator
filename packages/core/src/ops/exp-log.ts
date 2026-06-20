// Exponential and logarithm operators (CALC-F02): exp, ln, log10.
//
// Pure functions of a single double. Domain failures (`ln`/`log10` of a
// non-positive input) are caught up front as `DomainError`; every numeric exit
// routes through the non-finite guard so an out-of-range result (e.g. `exp` of
// a large input) becomes `Overflow` rather than leaking `Infinity` (FR20/AC7).

import type { Result } from '../contract/result.js';
import { err } from '../contract/result.js';
import { ErrorKind } from '../contract/errors.js';
import { finite } from '../guard/finite.js';

/**
 * `exp(x) = e^x` (FR7). Finite for all finite `x` except large positives, where
 * the true value exceeds the double range and the guard reports `Overflow`.
 */
export function exp(x: number): Result<number> {
  return finite(Math.exp(x));
}

/**
 * `ln(x)` — natural logarithm (FR8). Domain is `x > 0`: `x <= 0` (including
 * `ln(0)`, a pole, and any negative) is `DomainError` (Q1 — all log-domain
 * failures share one kind), never a `DivideByZero`-style infinity.
 */
export function ln(x: number): Result<number> {
  if (x <= 0) return err(ErrorKind.DomainError);
  return finite(Math.log(x));
}

/**
 * `log10(x)` — base-10 logarithm (FR9). Same domain rule as `ln`: `x <= 0` is
 * `DomainError`.
 */
export function log10(x: number): Result<number> {
  if (x <= 0) return err(ErrorKind.DomainError);
  return finite(Math.log10(x));
}
