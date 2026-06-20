// The success-or-typed-error wrapper every operator returns (CALC-F02).
//
// The core models its "two observable outcomes" (a finite double OR a typed
// error) as an explicit, branchable value rather than exceptions — this is the
// contract F03 builds on, and it keeps NaN/Infinity sentinels out of the API.

import type { CalcError, ErrorKind } from './errors.js';
import { calcError } from './errors.js';

/**
 * The outcome of an operation: either a value, or a `CalcError`. A discriminated
 * union on `ok`, so narrowing on `result.ok` gives access to `value` or `error`
 * with no casts.
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CalcError };

/** Wrap a successful value. */
export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Build a failed `Result` from an `ErrorKind`. Generic in `T` so it composes in
 * any `Result<T>`-returning position (the error branch carries no value).
 */
export function err<T = never>(kind: ErrorKind): Result<T> {
  return { ok: false, error: calcError(kind) };
}

/** Type guard narrowing a `Result<T>` to its success branch. */
export function isOk<T>(result: Result<T>): result is { ok: true; value: T } {
  return result.ok;
}

/** Type guard narrowing a `Result<T>` to its error branch. */
export function isErr<T>(
  result: Result<T>,
): result is { ok: false; error: CalcError } {
  return !result.ok;
}
