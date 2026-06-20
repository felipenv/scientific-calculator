// @calc/core — UI-agnostic core library entrypoint.
//
// This package carries the calculator's headless math contract, the operator
// implementations, and the registry that applies them uniformly. Operators take
// IEEE-754 doubles and return a finite double OR a typed error — never raw
// NaN/Infinity — and own no formatting.
//
// The published surface is the F03-shared contract (Result/CalcError/ErrorKind/
// AngleMode), the non-finite guard, the π/e constants, and the registry-backed
// `CalcCore` consumers apply operators through.
//
// Invariant: this package must never import a web/UI runtime (e.g. the DOM).

// Shared contract: error taxonomy, Result wrapper, angle mode.
export {
  ErrorKind,
  calcError,
  ok,
  err,
  isOk,
  isErr,
  AngleMode,
  DEFAULT_ANGLE_MODE,
} from './contract/index.js';
export type { CalcError, Result } from './contract/index.js';

// Non-finite guard + numeric predicates.
export { finite, isInteger, isNegative } from './guard/finite.js';

// Mathematical constants (FR18).
export { PI, E } from './constants.js';

// Function registry + the registry-backed core instance (FR22). This is the
// operator-application surface F03 consumes.
export { CalcCore } from './core.js';
export type { CalcCoreOptions } from './core.js';
export { Registry, defaultRegistry } from './registry/registry.js';
export { OPERATORS } from './registry/operators.js';
export type { Operator, OperatorApply } from './registry/operators.js';

// Dynamic RPN stack core (FR1/FR2/FR9/FR10) + the typed-ready value model
// (FR11) and the core-owned `Error: Stack underflow` contract (FR8). This is the
// stack surface feature #4 drives and imports the error from.
export { RpnStack } from './stack/stack.js';
export {
  StackUnderflowError,
  STACK_UNDERFLOW_MESSAGE,
} from './stack/errors.js';
export { numberValue, isNumberValue } from './stack/value.js';
export type { StackValue, NumberValue } from './stack/value.js';

/**
 * Package-identity marker. Retained from the CALC-F01 scaffold: it proves the
 * package is importable and backs the web->core seam test in `@calc/web`.
 */
export const CORE_PACKAGE = '@calc/core' as const;
