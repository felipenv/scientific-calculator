// Golden-value tolerance contract for transcendental operators (CALC-F02, Q4).
//
// `Math.exp`/`log`/`sin`/… are correctly rounded to within ~1 ULP by the spec,
// but the *last* ULP is allowed to differ across runtimes/libm builds. Exact
// equality on transcendental golden values is therefore too brittle for CI.
// This module pins one comparison policy so every transcendental test uses the
// same, deliberately-chosen tolerance rather than ad-hoc `toBeCloseTo` digits.
//
// Policy: a *relative* tolerance with an absolute floor. The floor matters for
// expected values at or near zero (e.g. `cos(90°) ≈ 0`), where a purely
// relative bound is unsatisfiable. Algebraic/integer results (e.g. `cos(0°)=1`
// exactly) are compared with plain equality elsewhere — this is only for values
// that flow through a transcendental.

/**
 * Relative tolerance for transcendental golden values. `1e-12` sits far above
 * realistic last-ULP drift (~1e-16 for doubles) yet is tight enough to catch a
 * genuinely wrong implementation or a bad angle-mode conversion.
 */
export const TRANSCENDENTAL_REL_TOLERANCE = 1e-12;

/**
 * Absolute floor applied alongside the relative tolerance, so comparisons
 * against an expected value of (or near) zero remain meaningful.
 */
export const TRANSCENDENTAL_ABS_FLOOR = 1e-12;

/**
 * True iff `actual` is within the pinned transcendental tolerance of
 * `expected`. The bound is `relTol * |expected|`, never smaller than the
 * absolute floor: `|actual - expected| <= max(absFloor, relTol * |expected|)`.
 */
export function isCloseEnough(
  actual: number,
  expected: number,
  relTol: number = TRANSCENDENTAL_REL_TOLERANCE,
  absFloor: number = TRANSCENDENTAL_ABS_FLOOR,
): boolean {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
    // Tolerance is only defined for finite golden values; non-finite is always
    // a failure here (the operators must never produce non-finite anyway).
    return actual === expected;
  }
  const bound = Math.max(absFloor, relTol * Math.abs(expected));
  return Math.abs(actual - expected) <= bound;
}
