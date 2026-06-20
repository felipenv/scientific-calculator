// Core-owned error contract for the RPN stack (CALC-F03, FR8).
//
// This is the single source of truth for the stack-underflow contract: the
// exact user-facing message lives here and is imported by downstream consumers
// (e.g. the Web Calculator Interface, feature #4) rather than re-declared, so
// error presentation stays uniform across features.

/** The exact user-facing message for a stack underflow (FR8 cross-feature contract). */
export const STACK_UNDERFLOW_MESSAGE = 'Error: Stack underflow';

/**
 * Raised when a stack or operator operation is attempted with fewer entries
 * than it requires. The operation is non-destructive: the stack is left exactly
 * as it was (FR8 / AC6). `message` is always {@link STACK_UNDERFLOW_MESSAGE}.
 */
export class StackUnderflowError extends Error {
  constructor() {
    super(STACK_UNDERFLOW_MESSAGE);
    this.name = 'StackUnderflowError';
  }
}
