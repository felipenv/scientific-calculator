// UI-facing error model for the web calculator (CALC-F04).
//
// `@calc/core` reports failures as a five-kind `ErrorKind` taxonomy carrying no
// display text (the core owns no wording). The UI needs the opposite: a small,
// closed set of user-facing codes, each paired with the exact message the spec
// dictates (FR21). This module is the single edge that translates the core's
// taxonomy into that UI vocabulary, so the display/dispatch layers never touch
// `ErrorKind` directly.
//
// IP note: the strings below are the team's own paraphrased wording — not copied
// from any HP manual or ROM (AC8).

import { ErrorKind } from '@calc/core';

/**
 * The closed set of error classes the UI surfaces (per the feature spec). Four
 * codes, deliberately coarser than the core's five `ErrorKind`s: the core's
 * `Indeterminate` (`0/0`, `0^0`) and `DomainError` both present to the user as
 * the same "undefined result", so they collapse to `DOMAIN` here.
 *
 * - `DIV_ZERO`  — a finite value divided by zero (`1/0`, `1/x` at 0, `0^-n`).
 * - `DOMAIN`    — an undefined result: a domain violation (`√(-x)`, `ln(≤0)`,
 *   `asin` out of `[-1,1]`, invalid factorial) or an indeterminate form.
 * - `OVERFLOW`  — a finite-input operation whose true result is non-finite.
 * - `UNDERFLOW` — too few operands on the stack for the operation.
 */
export type CalcErrorCode = 'DIV_ZERO' | 'DOMAIN' | 'OVERFLOW' | 'UNDERFLOW';

/**
 * A failed operation as the UI sees it: a stable `code` to branch on plus the
 * ready-to-render `message`. Modeled as plain data (not a thrown `Error`) so it
 * rides in the calculator state non-destructively and the display reads it.
 */
export interface CalcError {
  readonly code: CalcErrorCode;
  readonly message: string;
}

/**
 * The exact user-facing string for each code (FR21). Centralized so wording
 * lives in one place and the display never hard-codes a message.
 */
export const ERROR_MESSAGES: Readonly<Record<CalcErrorCode, string>> = {
  DIV_ZERO: 'Error: Divide by 0',
  DOMAIN: 'Error: Undefined',
  OVERFLOW: 'Error: Overflow',
  UNDERFLOW: 'Error: Stack underflow (Too Few Arguments)',
};

/** Build a {@link CalcError} for `code`, attaching its FR21 message. */
export function calcError(code: CalcErrorCode): CalcError {
  return { code, message: ERROR_MESSAGES[code] };
}

/**
 * Map the core's `ErrorKind` to the UI's {@link CalcError}. The five-to-four
 * collapse is intentional (see {@link CalcErrorCode}): both `Indeterminate` and
 * `DomainError` are "undefined" to the user and map to `DOMAIN`.
 */
export function fromErrorKind(kind: ErrorKind): CalcError {
  switch (kind) {
    case ErrorKind.DivideByZero:
      return calcError('DIV_ZERO');
    case ErrorKind.Indeterminate:
    case ErrorKind.DomainError:
      return calcError('DOMAIN');
    case ErrorKind.Overflow:
      return calcError('OVERFLOW');
    case ErrorKind.StackUnderflow:
      return calcError('UNDERFLOW');
  }
}
