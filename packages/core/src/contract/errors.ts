// The shared typed-error taxonomy for @calc/core (CALC-F02).
//
// This is the single error model every operator reports through, and the same
// taxonomy consumed by the RPN stack (F03). The core never returns or leaks raw
// NaN/Infinity: any would-be non-finite or undefined result is converted to one
// of the kinds below (see `guard/finite.ts`).
//
// IP note: the kinds are the team's own taxonomy — no HP ROM, branding, or
// verbatim device error strings. The core owns the *distinctions* only; the
// UI (F04) owns all user-facing wording.

/**
 * Every way an operation can fail, as exactly five kinds (AC13). This set is
 * closed: operators choose among these, and consumers branch on them.
 *
 * String-valued so a `CalcError` is self-describing in logs and test output
 * without coupling to enum ordinal positions.
 *
 * - `DivideByZero`   — a finite numerator over a zero denominator (e.g. `1/0`,
 *   `reciprocal(0)`, `0` raised to a negative power). An infinite true result.
 * - `Indeterminate`  — a `0/0`-shaped form with no defined value (e.g. `0/0`,
 *   `0^0`). Distinct from `DivideByZero` by design (AC3/AC5).
 * - `DomainError`    — input outside an operation's domain (e.g. `√(-x)`,
 *   `ln(≤0)`, `asin` out of `[-1, 1]`, invalid factorial).
 * - `Overflow`       — a finite-input operation whose true result exceeds the
 *   representable double range (the default kind the non-finite guard emits).
 * - `StackUnderflow` — too few operands for an operation. Defined here as part
 *   of the shared taxonomy (FR21) though it is produced by F03, not the core.
 */
export enum ErrorKind {
  DivideByZero = 'DivideByZero',
  Indeterminate = 'Indeterminate',
  DomainError = 'DomainError',
  Overflow = 'Overflow',
  StackUnderflow = 'StackUnderflow',
}

/**
 * A failed operation, carrying only its `kind`. Deliberately minimal: the core
 * owns no display strings, so there is no message field — the UI maps `kind` to
 * user-facing wording. Modeled as data (not a thrown `Error`) so failures flow
 * through `Result<T>` and consumers branch instead of catching.
 */
export interface CalcError {
  readonly kind: ErrorKind;
}

/** Construct a `CalcError` of the given kind. */
export function calcError(kind: ErrorKind): CalcError {
  return { kind };
}
