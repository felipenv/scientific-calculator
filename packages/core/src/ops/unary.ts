// Unary and misc operators (CALC-F02): factorial, reciprocal, sign change,
// percent.
//
// Pure functions of a single double. Factorial restricts to non-negative
// integers and rejects everything else — including `n >= 171`, which overflows
// the double range — as a single `DomainError` (FR14/Q2: one kind for the whole
// factorial contract, not a mix of Domain/Overflow). Reciprocal distinguishes
// `1/0` as `DivideByZero` (FR15). Sign change is total over finite inputs and
// never errors (FR16); percent is the v0 unary `x/100` (FR17). Every numeric
// exit routes through the non-finite guard so no operation leaks NaN/Infinity
// (FR20/AC7).

import type { Result } from '../contract/result.js';
import { ok, err } from '../contract/result.js';
import { ErrorKind } from '../contract/errors.js';
import { finite, isInteger, isNegative } from '../guard/finite.js';

// The largest `n` whose factorial fits in a double: `170! ≈ 7.3e306` is finite,
// `171!` overflows to Infinity. Inputs at or above this are rejected as
// `DomainError` rather than computed and caught by the guard, keeping the whole
// factorial contract under one kind (Q2).
const FACTORIAL_MAX = 170;

/**
 * `x!` (FR14). Defined only for non-negative integers; everything outside that
 * domain is a single `DomainError`:
 * - negative input — factorial is undefined for negatives here (the
 *   Gamma-extended form is a deferred future addition).
 * - non-integer input — `2.5!` is rejected (no Gamma extension in v0).
 * - `n >= 171` — the true value exceeds the double range; reported as
 *   `DomainError`, not `Overflow`, so the factorial contract has one kind (Q2).
 *
 * `0! = 1` and `1! = 1` by definition. Computed iteratively; the `<= 170` bound
 * guarantees the running product stays finite, so the guard here only ever sees
 * a finite value (it is kept for the AC7 invariant, not as a live path).
 */
export function factorial(x: number): Result<number> {
  if (isNegative(x) || !isInteger(x) || x > FACTORIAL_MAX) {
    return err(ErrorKind.DomainError);
  }
  let product = 1;
  for (let i = 2; i <= x; i++) {
    product *= i;
  }
  return finite(product);
}

/**
 * `1/x` — reciprocal (FR15). `x == 0` is `DivideByZero` (an infinite true
 * result), distinguished before the guard. Otherwise the reciprocal, with a
 * non-finite magnitude (e.g. `1` over a denormal that overflows on inversion)
 * reported as `Overflow`.
 */
export function reciprocal(x: number): Result<number> {
  if (x === 0) return err(ErrorKind.DivideByZero);
  return finite(1 / x);
}

/**
 * Sign change `±` (FR16): returns `-x`. Total over finite inputs — negation
 * never produces a non-finite value from a finite one — so it always succeeds
 * and is wrapped directly in `ok` without a guard.
 */
export function negate(x: number): Result<number> {
  return ok(-x);
}

/**
 * Percent (FR17): the v0 unary form `x → x / 100` (e.g. `50 → 0.5`). The
 * two-operand markup form (`x % y → x*y/100`) is a deferred additive change,
 * not part of v0. Division by the constant `100` cannot make a finite input
 * non-finite, but the exit still routes through the guard for the AC7
 * invariant.
 */
export function percent(x: number): Result<number> {
  return finite(x / 100);
}
