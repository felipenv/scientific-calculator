// Golden-value tolerance for transcendental tests (CALC-F02, Q4).
//
// Resolves Open Question Q4: how to compare floating-point results of trig /
// exp / log golden values across runtimes. Native `Math` is not bit-identical
// between engines — the last ULP of a transcendental result is allowed to
// differ — so exact `===` comparison would make the suite fragile. Algebraic
// and integer results (e.g. `cos(0°) === 1`) are still asserted exactly by the
// tests themselves; this helper is for the inexact transcendental cases.
//
// The contract pinned here: results match within a *relative* epsilon, with an
// *absolute* floor so values at or near zero (where relative error is
// meaningless) compare sensibly. `1e-12` sits comfortably above realistic
// cross-runtime last-ULP drift (~1e-16 relative) yet far below any error a real
// implementation bug would produce, so it catches regressions without flaking.

/** Relative tolerance: allowed error as a fraction of the larger magnitude. */
export const REL_TOLERANCE = 1e-12;

/** Absolute tolerance: the floor used when the expected value is ~0. */
export const ABS_TOLERANCE = 1e-12;

/**
 * True iff `actual` is within tolerance of `expected`.
 *
 * Passes when the absolute difference is within `abs`, OR within `rel` times the
 * larger of the two magnitudes. Exact equality (including the `0`/`-0` and
 * matching-infinity cases) short-circuits to true.
 *
 * @param actual   the computed value under test.
 * @param expected the golden reference value.
 * @param rel      relative tolerance (default {@link REL_TOLERANCE}).
 * @param abs      absolute tolerance floor (default {@link ABS_TOLERANCE}).
 */
export function closeTo(
  actual: number,
  expected: number,
  rel: number = REL_TOLERANCE,
  abs: number = ABS_TOLERANCE,
): boolean {
  if (actual === expected) {
    return true;
  }
  const diff = Math.abs(actual - expected);
  if (diff <= abs) {
    return true;
  }
  return diff <= rel * Math.max(Math.abs(actual), Math.abs(expected));
}
