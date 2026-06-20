// The operator catalogue (CALC-F02, FR22): every v0 operator wrapped in one
// uniform application shape so consumers (F03) apply them without knowing each
// operator's native signature.
//
// The operators implemented in `ops/` have heterogeneous signatures — unary vs
// binary, and trig is angle-mode aware while everything else is not. This module
// reconciles them behind a single `apply(args, mode): Result<number>` so the
// registry and the core can treat all operators identically. The adapters below
// (`unary` / `unaryAngle` / `binary`) are the only place positional arguments
// are mapped onto an operator's real parameters, so each `ops/` function keeps
// its natural, directly-testable signature.
//
// Operand supply (and the `StackUnderflow` kind) is F03's responsibility, but
// because `apply` receives an array it cannot assume a length: the adapters
// guard arity and report `StackUnderflow` (the shared kind, FR21) rather than
// indexing past the end and letting an `undefined` operand become a NaN. This
// keeps the never-leak-NaN invariant (FR20/AC7) intact even under a malformed
// call, while leaving the operators themselves total over their declared arity.

import type { Result } from '../contract/result.js';
import { err } from '../contract/result.js';
import { ErrorKind } from '../contract/errors.js';
import type { AngleMode } from '../contract/angle-mode.js';

import { add, subtract, multiply, divide } from '../ops/arithmetic.js';
import { power, square, sqrt, nthRoot } from '../ops/powers.js';
import { exp, ln, log10 } from '../ops/exp-log.js';
import { sin, cos, tan, asin, acos, atan } from '../ops/trig.js';
import { factorial, reciprocal, negate, percent } from '../ops/unary.js';

/**
 * The uniform operator-application signature consumers (F03) call. Takes the
 * operands as a positional array and the active angle mode (read-only; only
 * trig operators consult it), and returns the shared `Result<number>`.
 */
export type OperatorApply = (args: number[], mode: AngleMode) => Result<number>;

/**
 * A registered operator: its lookup `name`, declared `arity` (operand count),
 * and the uniform `apply`. `arity` is published metadata so F03 can validate
 * operand supply before applying; `apply` additionally self-guards (below).
 */
export interface Operator {
  readonly name: string;
  readonly arity: 1 | 2;
  readonly apply: OperatorApply;
}

/** Adapt a unary, mode-independent op into the uniform `apply` shape. */
function unary(fn: (x: number) => Result<number>): OperatorApply {
  return (args) => {
    if (args.length < 1) return err(ErrorKind.StackUnderflow);
    return fn(args[0]);
  };
}

/** Adapt a unary, angle-mode-aware op (trig/inverse-trig) into `apply`. */
function unaryAngle(
  fn: (x: number, mode: AngleMode) => Result<number>,
): OperatorApply {
  return (args, mode) => {
    if (args.length < 1) return err(ErrorKind.StackUnderflow);
    return fn(args[0], mode);
  };
}

/** Adapt a binary, mode-independent op into the uniform `apply` shape. */
function binary(fn: (x: number, y: number) => Result<number>): OperatorApply {
  return (args) => {
    if (args.length < 2) return err(ErrorKind.StackUnderflow);
    return fn(args[0], args[1]);
  };
}

/**
 * Every v0 operator, in one catalogue. The `name` keys are the team's own,
 * UI-neutral identifiers (no device branding) — F03 looks operators up by these
 * through the registry. Adding an entry here (or registering one at runtime) is
 * the whole cost of a new operator: the `apply` contract above never changes
 * (AC12).
 */
export const OPERATORS: readonly Operator[] = [
  // Arithmetic (FR1/FR2).
  { name: 'add', arity: 2, apply: binary(add) },
  { name: 'subtract', arity: 2, apply: binary(subtract) },
  { name: 'multiply', arity: 2, apply: binary(multiply) },
  { name: 'divide', arity: 2, apply: binary(divide) },

  // Powers & roots (FR3–FR6).
  { name: 'power', arity: 2, apply: binary(power) },
  { name: 'square', arity: 1, apply: unary(square) },
  { name: 'sqrt', arity: 1, apply: unary(sqrt) },
  { name: 'nthRoot', arity: 2, apply: binary(nthRoot) },

  // Exponentials & logarithms (FR7–FR9).
  { name: 'exp', arity: 1, apply: unary(exp) },
  { name: 'ln', arity: 1, apply: unary(ln) },
  { name: 'log10', arity: 1, apply: unary(log10) },

  // Trig & inverse-trig (FR10–FR13), angle-mode aware.
  { name: 'sin', arity: 1, apply: unaryAngle(sin) },
  { name: 'cos', arity: 1, apply: unaryAngle(cos) },
  { name: 'tan', arity: 1, apply: unaryAngle(tan) },
  { name: 'asin', arity: 1, apply: unaryAngle(asin) },
  { name: 'acos', arity: 1, apply: unaryAngle(acos) },
  { name: 'atan', arity: 1, apply: unaryAngle(atan) },

  // Unary & misc (FR14–FR17).
  { name: 'factorial', arity: 1, apply: unary(factorial) },
  { name: 'reciprocal', arity: 1, apply: unary(reciprocal) },
  { name: 'negate', arity: 1, apply: unary(negate) },
  { name: 'percent', arity: 1, apply: unary(percent) },
];
