// Exponential and logarithm operators (CALC-F02).
//
// The transcendental "growth" family: exp, ln, log10. Each is a pure function
// of one double and returns the shared `Result<number>` — a finite double or a
// typed error, never a raw `NaN`/`Infinity` (FR20/AC7).
//
// Two failure shapes appear here:
//   - input-domain failures detected up front — `ln`/`log10` of a non-positive
//     argument is outside the real domain (FR8/FR9) and reported as
//     `DomainError` *before* calling `Math`, so we never rely on `Math` to emit
//     `-Infinity`/`NaN` for those cases.
//   - magnitude failures — a valid input whose result leaves double range (e.g.
//     `exp(1000)`), caught by the universal `finite()` post-check as `Overflow`.

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite } from '../guard/finite.js';

/**
 * `e^x` (FR7). Defined for all real `x`; only the magnitude can fail — a result
 * past double range (e.g. `exp(710)`) becomes `Overflow` via the guard.
 */
export function exp(x: number): Result<number> {
  return finite(Math.exp(x));
}

/**
 * Natural logarithm `ln(x)` (FR8). The real domain is `x > 0`, so any
 * `x <= 0` — including `ln(0)` (a pole) and `ln(negative)` — is `DomainError`
 * (Q1: all log domain failures share one kind). Caught up front so `Math.log`
 * never gets a chance to return `-Infinity`/`NaN`.
 */
export function ln(x: number): Result<number> {
  if (!(x > 0)) {
    return err(ErrorKind.DomainError);
  }
  return finite(Math.log(x));
}

/**
 * Base-10 logarithm `log10(x)` (FR9). Same domain as `ln`: `x > 0`, otherwise
 * `DomainError`.
 */
export function log10(x: number): Result<number> {
  if (!(x > 0)) {
    return err(ErrorKind.DomainError);
  }
  return finite(Math.log10(x));
}
