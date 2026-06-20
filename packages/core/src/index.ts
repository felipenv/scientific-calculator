// @calc/core — UI-agnostic core library entrypoint.
//
// Publishes the F03-shared contract surface (the typed error taxonomy, the
// `Result<T>` wrapper, and the core-level angle mode) plus the non-finite guard
// that enforces the no-NaN/Infinity invariant. Operator implementations
// (arithmetic, scientific functions, the registry) arrive in later work items
// and build on this foundation.
//
// Invariant: this package must never import a web/UI runtime (e.g. the DOM).

export {
  ErrorKind,
  ok,
  err,
  isOk,
  isErr,
  AngleMode,
  DEFAULT_ANGLE_MODE,
} from './contract/index.js';
export type { CalcError, Result, Ok, Err } from './contract/index.js';

export {
  finite,
  isInteger,
  isNegative,
  isNonNegative,
  isZero,
} from './guard/finite.js';

// Unary / misc operators (FR14–FR17) and the full-precision constants (FR18).
export { factorial, reciprocal, negate, percent } from './ops/unary.js';
export { PI, E } from './constants.js';

/** Scaffolding marker proving the core package builds and is importable. */
export const CORE_PACKAGE = '@calc/core' as const;
