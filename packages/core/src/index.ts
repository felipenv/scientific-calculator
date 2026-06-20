// @calc/core — UI-agnostic core library entrypoint.
//
// Published today: the foundational, F03-shared surface (the error/result/
// angle-mode contract and the non-finite guard that enforces the "never leak
// NaN/Infinity" invariant) plus the algebraic operators — arithmetic and
// powers/roots. The remaining scientific functions and the RPN engine arrive in
// later work items.
//
// Invariant: this package must never import a web/UI runtime (e.g. the DOM).

/** Scaffolding marker proving the core package builds and is importable. */
export const CORE_PACKAGE = '@calc/core' as const;

// Shared contract (CALC-F02): error taxonomy, result wrapper, angle mode.
export {
  ErrorKind,
  ok,
  err,
  AngleMode,
  DEFAULT_ANGLE_MODE,
} from './contract/index.js';
export type { CalcError, Result } from './contract/index.js';

// Non-finite guard (CALC-F02): maps stray NaN/Infinity to a typed kind.
export {
  finite,
  isInteger,
  isNegative,
  isNonNegative,
} from './guard/finite.js';

// Arithmetic operators (CALC-F02): add, subtract, multiply, divide.
export { add, subtract, multiply, divide } from './ops/arithmetic.js';

// Powers & roots operators (CALC-F02): power, square, sqrt, nthRoot.
export { power, square, sqrt, nthRoot } from './ops/powers.js';
