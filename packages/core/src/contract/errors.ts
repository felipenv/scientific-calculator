// Shared error taxonomy for the calculator core (CALC-F02).
//
// This is the single, F03-shared error model. The core never returns or leaks
// raw NaN/Infinity (FR20): any would-be non-finite or undefined result is
// converted to one of the kinds below. `StackUnderflow` is defined here as part
// of the shared taxonomy (FR21) even though only F03 (the RPN stack) produces
// it — both features consume exactly one error type.

/**
 * The complete, closed set of failure kinds the core can surface. There are
 * exactly five (AC13); adding a sixth is a deliberate contract change, not a
 * casual edit. String values mirror the member names so errors are readable
 * when logged or serialized.
 */
export enum ErrorKind {
  /** Non-zero divided by zero, e.g. `1 / 0` — an infinite result. */
  DivideByZero = 'DivideByZero',
  /** Genuinely undefined form, e.g. `0 / 0` or `0 ^ 0`. */
  Indeterminate = 'Indeterminate',
  /** Input outside the operator's domain, e.g. `√-1`, `ln(0)`, `asin(2)`. */
  DomainError = 'DomainError',
  /** A true result that exceeds the finite double range. */
  Overflow = 'Overflow',
  /** Too few operands supplied to an operator (produced by F03). */
  StackUnderflow = 'StackUnderflow',
}

/**
 * A typed calculation failure. It carries the discriminating {@link ErrorKind}
 * and an optional human-neutral `detail` string for debugging/test diagnostics
 * — the UI (F04), not the core, owns any end-user wording.
 */
export interface CalcError {
  readonly kind: ErrorKind;
  /** Optional non-localized diagnostic context; never user-facing copy. */
  readonly detail?: string;
}
