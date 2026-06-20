// Golden-value tolerance for transcendental tests (CALC-F02, Q4).
//
// Cross-runtime `Math` (libm) implementations of sin/cos/tan/exp/log can differ
// in the last unit-in-the-last-place (ULP), so transcendental golden values are
// compared with a *relative* tolerance rather than exact equality. A small
// absolute floor handles results that are mathematically zero but land on a
// tiny non-zero double (e.g. `cos(90°) ≈ 6.1e-17`), where a purely relative
// bound would be meaningless. Algebraic / integer results still use exact
// equality at the call site — this helper is only for the transcendentals.

import { type Result } from '../contract/index.js';

/**
 * Relative tolerance for transcendental comparisons: the allowed error as a
 * fraction of the larger operand's magnitude. `1e-12` is ~4 ULP at double
 * precision — comfortably above cross-runtime libm drift, far below the
 * precision any consumer formats to.
 */
export const REL_TOLERANCE = 1e-12;

/**
 * Absolute floor, applied when the expected value is at or near zero. Without
 * it, comparing a near-zero double against `0` would require an impossible
 * relative match.
 */
export const ABS_TOLERANCE = 1e-12;

/**
 * True iff `actual` is within tolerance of `expected`. Passes when the absolute
 * difference is within `absTol` (the near-zero case) OR within `relTol` scaled
 * by the larger magnitude (the general case). Non-finite inputs never compare
 * equal — the operators guarantee finite values, so a non-finite here is a real
 * failure, not a tolerance question.
 */
export function approxEqual(
  actual: number,
  expected: number,
  relTol: number = REL_TOLERANCE,
  absTol: number = ABS_TOLERANCE,
): boolean {
  // Non-finite values are never "close": the operators guarantee finite output,
  // so a non-finite here (incl. Infinity === Infinity) is a real failure.
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  if (actual === expected) return true; // exact (covers both-zero, ±0)

  const diff = Math.abs(actual - expected);
  if (diff <= absTol) return true;

  const scale = Math.max(Math.abs(actual), Math.abs(expected));
  return diff <= relTol * scale;
}

/**
 * Unwrap a successful numeric `Result` for golden comparison, throwing with the
 * error `kind` if it failed. Lets a test read `approxEqual(unwrap(sin(90, deg)),
 * 1)` and get a descriptive failure when an operation unexpectedly errored.
 */
export function unwrap(result: Result<number>): number {
  if (!result.ok) {
    throw new Error(`expected an ok Result, got error: ${result.error.kind}`);
  }
  return result.value;
}
