// The stack-underflow error contract (CALC-F03; FR8).
//
// `StackUnderflowError` is raised when a stack or operator operation is invoked
// with fewer entries than it requires. It is the single source of truth for the
// `Error: Stack underflow` message — a *core-owned, UI-consumed* cross-feature
// contract (the Web Calculator Interface, F04, imports this rather than
// re-declaring the string), so the user-facing wording is uniform and defined
// exactly once.
//
// Why a thrown error (not a Result<T>): underflow is a precondition violation —
// the caller asked for operands that are not there — not one of the in-domain
// calculation outcomes the engine's `Result<number>` models. The existing core
// already draws this line, throwing for precondition/programming faults (an
// unknown operator name, see `core.ts`) while reserving `Result` for the
// finite-double-or-typed-error calculation results. Underflow sits on the throw
// side of that line. The error still carries `ErrorKind.StackUnderflow` so it
// bridges to the shared five-kind taxonomy (F02) for any consumer that branches
// on `kind`.
//
// Non-destructive guarantee: every operation that can raise this validates depth
// *before* mutating, so a failed op leaves the stack exactly as it was (FR8/AC6).

import { ErrorKind } from '../contract/errors.js';

/**
 * The exact user-facing underflow message. Defined here once and imported by
 * consumers; never copied, so the cross-feature contract has a single source.
 */
export const STACK_UNDERFLOW_MESSAGE = 'Error: Stack underflow';

/**
 * Thrown when an operation needs more operands than the stack holds. Its
 * `message` is exactly {@link STACK_UNDERFLOW_MESSAGE}; its `kind` ties it to the
 * shared {@link ErrorKind} taxonomy so a consumer can branch on the kind without
 * matching on the message string.
 */
export class StackUnderflowError extends Error {
  /** Bridge to the shared taxonomy (F02) for consumers that branch on `kind`. */
  readonly kind = ErrorKind.StackUnderflow;

  constructor() {
    super(STACK_UNDERFLOW_MESSAGE);
    // `Error` sets `name` to "Error"; restore the subclass name for clear logs
    // and assertions. (Native ES2022 classes keep `instanceof` working without
    // a prototype-chain fix-up.)
    this.name = 'StackUnderflowError';
  }
}
