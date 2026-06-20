// Unary / misc operators for @calc/core (CALC-F02).
//
// The remaining single-operand operations: factorial, reciprocal, sign change,
// and percent. Each is a pure function of its one input and returns the shared
// `Result<number>` — a finite double, or a typed error — never a raw NaN or
// Infinity (FR20, AC7). Every numeric exit routes through `finite()` so any
// stray non-finite is intercepted, even where a domain check makes one
// unreachable today.

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite, isInteger, isNegative } from '../guard/finite.js';

// 171! overflows the double range (170! ~= 7.26e306 is the largest finite
// factorial; 171! ~= 1.24e309 > Number.MAX_VALUE). The whole factorial contract
// reports a single kind — DomainError — for negative, non-integer, AND too-large
// inputs (FR14, Open Question Q2), so the boundary is a domain check, not an
// Overflow at compute time.
const FACTORIAL_MAX = 170;

/**
 * Factorial `x!`, defined for non-negative integers only (FR14, AC6).
 *
 * `0! = 1`, `5! = 120`, `170!` is the largest finite result. Negative,
 * non-integer, and `x >= 171` inputs all return `DomainError` — one kind for
 * the entire factorial contract (Q2). Adding a Gamma-extended factorial later
 * is a drop-in registry swap (AC12) and would widen this domain.
 */
export function factorial(x: number): Result<number> {
  if (isNegative(x) || !isInteger(x) || x > FACTORIAL_MAX) {
    return err(ErrorKind.DomainError);
  }
  // x is now a non-negative integer in [0, 170]; the product stays finite.
  let product = 1;
  for (let n = 2; n <= x; n++) {
    product *= n;
  }
  // Route through the guard for the invariant even though [0, 170]! is finite.
  return finite(product);
}

/**
 * Reciprocal `1 / x` (FR15, AC8). `x == 0` returns `DivideByZero`; otherwise the
 * quotient, with any non-finite magnitude mapped to `Overflow` by the guard.
 */
export function reciprocal(x: number): Result<number> {
  if (x === 0) {
    return err(ErrorKind.DivideByZero);
  }
  return finite(1 / x);
}

/**
 * Sign change `-x` (FR16). Total over finite inputs — negation never leaves
 * double range — but still routed through the guard to honor the invariant
 * uniformly. `negate(0)` yields `-0`, matching IEEE-754 negation.
 */
export function negate(x: number): Result<number> {
  return finite(-x);
}

/**
 * Percent: unary `x -> x / 100` for v0 (FR17, AC9), e.g. `50 -> 0.5`. The
 * two-operand markup form (`x % y -> x * y / 100`) is a deferred additive
 * change, not a v0 commitment (Q3).
 */
export function percent(x: number): Result<number> {
  return finite(x / 100);
}
