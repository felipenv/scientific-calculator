// The success-or-error wrapper returned by every core operation (CALC-F02).
//
// A discriminated union over `ok` rather than exceptions: the spec models "two
// observable outcomes" (a finite double, or a typed error) and F03 branches on
// them explicitly. Using a result type keeps that branch in the type system —
// callers must narrow on `ok` before reaching `value` or `error`.

import type { CalcError, ErrorKind } from './errors.js';

/**
 * Either a successful `value` or a typed `error`. Discriminated by `ok` so a
 * `switch`/`if` on `ok` narrows the union for the type checker.
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CalcError };

/** Wrap a successful value. */
export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/** Wrap a failure of the given kind. */
export function err<T = never>(kind: ErrorKind): Result<T> {
  return { ok: false, error: { kind } };
}
