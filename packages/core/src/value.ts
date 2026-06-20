// Typed-ready value model for RPN stack entries (CALC-F03, FR11).
//
// v0 carries a single numeric variant. Modeling a stack entry as a discriminated
// union — rather than a bare `number` — is the FR11 seam: later typed objects
// (symbolic expressions, matrices, programs) become additional variants without
// redefining the stack contract. The level-management mechanics in RpnStack
// operate on `StackValue`, so adding a variant never touches how levels shift,
// push, or pop.
//
// The public RpnStack surface stays numeric for v0 ergonomics (push/pop/peek
// take and return `number`); this module is the internal storage representation
// those methods convert to and from.

/** A real number stored as a raw IEEE-754 double (FR10 — no rounding here). */
export interface NumberValue {
  readonly type: 'number';
  readonly value: number;
}

/**
 * The value occupying a stack level. v0 has the single `NumberValue` variant;
 * the union exists so future variants slot in without changing the contract.
 */
export type StackValue = NumberValue;

/** Wrap a raw double as a stack value. */
export function numberValue(value: number): NumberValue {
  return { type: 'number', value };
}

/** Type guard for the numeric variant. */
export function isNumberValue(value: StackValue): value is NumberValue {
  return value.type === 'number';
}
