// Exponential and logarithm operators (CALC-F02): exp, ln, log10.
//
// Each is a pure function of one double returning a `Result<number>`. Domain
// failures are caught *before* computing (so we never depend on libm's
// NaN/Infinity for control flow), and every successful numeric exit is routed
// through `finite()` to uphold the no-NaN/Infinity invariant (FR20): `exp` can
// overflow the double range, and a defensive guard on the logs keeps a single,
// uniform exit path.

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite } from '../guard/finite.js';

/**
 * `exp(x) = e^x` (FR7). Always defined; a magnitude that exceeds the finite
 * double range (e.g. `exp(1000)`) is reported as {@link ErrorKind.Overflow} via
 * the guard rather than leaking `+Infinity`.
 */
export function exp(x: number): Result<number> {
  return finite(Math.exp(x));
}

/**
 * Natural logarithm `ln(x)` (FR8). `x <= 0` is outside the domain and returns
 * {@link ErrorKind.DomainError} — this folds the pole at `ln(0)` in with the
 * negative-argument case under one kind (Open Question Q1: `DomainError`).
 */
export function ln(x: number): Result<number> {
  if (!(x > 0)) {
    // `!(x > 0)` also rejects NaN, which `x <= 0` would let through.
    return err(ErrorKind.DomainError, 'ln requires x > 0');
  }
  return finite(Math.log(x));
}

/**
 * Base-10 logarithm `log10(x)` (FR9). `x <= 0` returns
 * {@link ErrorKind.DomainError}, mirroring {@link ln}.
 */
export function log10(x: number): Result<number> {
  if (!(x > 0)) {
    return err(ErrorKind.DomainError, 'log10 requires x > 0');
  }
  return finite(Math.log10(x));
}
