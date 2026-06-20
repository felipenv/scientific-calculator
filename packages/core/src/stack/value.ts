// The typed-ready value model for the RPN stack (CALC-F03; FR11).
//
// v0 stacks hold numbers only, but FR11 requires the stack's storage contract to
// *not preclude* later typed objects (complex numbers, matrices, symbolic
// values, programs). To keep that door open without building a full tagged-object
// system now (YAGNI — see the HLD's value-model decision), a stack entry is a
// minimal discriminated union with exactly one variant today: a numeric value.
//
// The stack's public read/write surface speaks raw `number` (FR10/AC8 — entries
// are stored and returned as raw IEEE-754 doubles with no rounding at this
// layer); this value model is the internal seam those numbers are wrapped in.
// Adding a variant here later is additive: a new arm on `StackValue` does not
// change the existing number-based stack API, which is exactly the "must not
// require redefining the stack contract" guarantee FR11 asks for.

/** A numeric stack entry: the only {@link StackValue} variant in v0. */
export interface NumberValue {
  readonly type: 'number';
  /** The raw IEEE-754 double, stored verbatim (no rounding — FR10/AC8). */
  readonly value: number;
}

/**
 * A value occupying a stack level. A discriminated union on `type` so future
 * typed objects are added as new variants without touching the existing ones;
 * v0 has the single {@link NumberValue} variant.
 */
export type StackValue = NumberValue;

/** Wrap a raw IEEE-754 double as a numeric stack value. */
export function numberValue(value: number): StackValue {
  return { type: 'number', value };
}

/** Type guard: narrows a {@link StackValue} to its numeric variant. */
export function isNumberValue(v: StackValue): v is NumberValue {
  return v.type === 'number';
}
