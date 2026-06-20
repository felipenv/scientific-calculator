// @calc/core — UI-agnostic core library entrypoint.
//
// Public surface of the calculator core. v0 (CALC-F03) lands the dynamic RPN
// stack and its read/write surface, the typed-ready value model, and the
// core-owned underflow error contract. Operator application and the stack
// management ops build on this in later work items.
//
// Invariant: this package must never import a web/UI runtime (e.g. the DOM).

/** Scaffolding marker proving the core package builds and is importable. */
export const CORE_PACKAGE = '@calc/core' as const;

export { RpnStack } from './stack.js';
export { StackUnderflowError, STACK_UNDERFLOW_MESSAGE } from './errors.js';
export {
  numberValue,
  isNumberValue,
  type StackValue,
  type NumberValue,
} from './value.js';
