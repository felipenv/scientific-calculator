// Barrel for the RPN stack subsystem (CALC-F03).
//
// Re-exports the dynamic stack, the typed-ready value model, and the
// core-owned underflow error contract so the package root (and feature #4) can
// import the whole stack surface from one place.

export { RpnStack } from './stack.js';
export { StackUnderflowError, STACK_UNDERFLOW_MESSAGE } from './errors.js';
export { numberValue, isNumberValue } from './value.js';
export type { StackValue, NumberValue } from './value.js';
