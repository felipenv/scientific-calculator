// Arithmetic operators for @calc/core (CALC-F02).
//
// The four-function arithmetic of the v0 set: add, subtract, multiply, divide.
// Each is a pure function of its operands returning a `Result<number>` — a
// finite double or a typed error, never a raw `NaN`/`Infinity` (FR1, FR2,
// FR20). Every numeric exit routes through `finite()` so an out-of-range
// magnitude becomes `Overflow`; division detects its undefined forms up front
// and reports the more specific kind.

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite } from '../guard/finite.js';

/** `x + y`. Non-finite magnitude (e.g. overflow of two huge values) → Overflow. */
export function add(x: number, y: number): Result<number> {
  return finite(x + y);
}

/** `x - y`. Non-finite magnitude → Overflow. */
export function subtract(x: number, y: number): Result<number> {
  return finite(x - y);
}

/** `x * y`. Non-finite magnitude → Overflow. */
export function multiply(x: number, y: number): Result<number> {
  return finite(x * y);
}

/**
 * `x / y` (FR2).
 *
 * The two divide-by-zero forms are distinguished before computing, since native
 * `/` collapses them both to non-finite values (`1/0 → Infinity`, `0/0 → NaN`):
 * - `y == 0` and `x != 0` → `DivideByZero` (a non-zero quantity over zero).
 * - `x == 0` and `y == 0` → `Indeterminate` (the undefined `0/0` form).
 *
 * Otherwise the quotient, with any non-finite magnitude mapped to `Overflow`.
 */
export function divide(x: number, y: number): Result<number> {
  if (y === 0) {
    return x === 0 ? err(ErrorKind.Indeterminate) : err(ErrorKind.DivideByZero);
  }
  return finite(x / y);
}
