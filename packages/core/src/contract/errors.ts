// Shared error taxonomy for @calc/core (CALC-F02).
//
// This is the single, F03-shared error model. Every operation in the core
// surfaces failure as one of these kinds — never a raw `NaN` or `Infinity`
// (see `../guard/finite.ts`). The taxonomy is intentionally closed: exactly
// five kinds (AC13). Adding a sixth is a deliberate contract change, not an
// incidental one, so it should be visible in review.

/**
 * The complete set of failure kinds the core can report.
 *
 * String-valued so a `CalcError` serializes to a readable, stable token and so
 * the enum has exactly five own keys (no numeric reverse-mapping) — the basis
 * for the "exactly five kinds" guarantee (AC13).
 *
 * - `DivideByZero`   — a non-zero quantity over zero, e.g. `1 / 0`, `1 / x` at
 *                      `x == 0`, `0 ^ negative`.
 * - `Indeterminate`  — a genuinely undefined form, e.g. `0 / 0`, `0 ^ 0`.
 * - `DomainError`    — input outside the operation's domain, e.g. `sqrt(-1)`,
 *                      `ln(<= 0)`, `asin` out of `[-1, 1]`, invalid factorial.
 * - `Overflow`       — a finite-input result whose magnitude leaves double
 *                      range; also the default target for any stray non-finite.
 * - `StackUnderflow` — too few operands. Produced by F03 (the RPN stack), but
 *                      defined here so both features share one taxonomy (FR21).
 */
export enum ErrorKind {
  DivideByZero = 'DivideByZero',
  Indeterminate = 'Indeterminate',
  DomainError = 'DomainError',
  Overflow = 'Overflow',
  StackUnderflow = 'StackUnderflow',
}

/**
 * A typed failure. Carries the `kind` and nothing numeric — consumers branch on
 * `kind` rather than inspecting a value. Display wording is the UI's concern
 * (F04), not the core's.
 */
export interface CalcError {
  readonly kind: ErrorKind;
}
