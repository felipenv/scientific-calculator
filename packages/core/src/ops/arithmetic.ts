// Four-function arithmetic operators (CALC-F02, FR1–FR2).
//
// Pure functions of their double operands. Every numeric exit routes through
// `finite()` so any would-be NaN/±Infinity becomes a typed error instead of
// leaking (FR20/AC7). Division special-cases the zero divisor before computing,
// distinguishing `1 / 0` (DivideByZero) from `0 / 0` (Indeterminate) per AC3.

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite, isZero } from '../guard/finite.js';

/** Add two doubles (FR1). Non-finite magnitude → `Overflow`. */
export function add(x: number, y: number): Result<number> {
  return finite(x + y);
}

/** Subtract `y` from `x` (FR1). Non-finite magnitude → `Overflow`. */
export function subtract(x: number, y: number): Result<number> {
  return finite(x - y);
}

/** Multiply two doubles (FR1). Non-finite magnitude → `Overflow`. */
export function multiply(x: number, y: number): Result<number> {
  return finite(x * y);
}

/**
 * Divide `x` by `y` (FR2). A zero divisor is handled before computing:
 * `x != 0` over zero → `DivideByZero`; `0 / 0` → `Indeterminate` (AC3).
 * Otherwise the quotient, with non-finite magnitude → `Overflow`.
 */
export function divide(x: number, y: number): Result<number> {
  if (isZero(y)) {
    return isZero(x)
      ? err(ErrorKind.Indeterminate, '0 / 0 is indeterminate')
      : err(ErrorKind.DivideByZero, 'division by zero');
  }
  return finite(x / y);
}
