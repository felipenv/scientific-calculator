// @calc/core — UI-agnostic core library entrypoint.
//
// This package carries the calculator's headless math contract and (in later
// features, CALC-F02+) the operator implementations and registry. Operators
// take IEEE-754 doubles and return a finite double OR a typed error — never raw
// NaN/Infinity — and own no formatting.
//
// Today this publishes the F03-shared contract surface (Result/CalcError/
// ErrorKind/AngleMode) plus the non-finite guard. Operators land next.
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

/**
 * Package-identity marker. Retained from the CALC-F01 scaffold: it proves the
 * package is importable and backs the web->core seam test in `@calc/web`.
 */
export const CORE_PACKAGE = '@calc/core' as const;
