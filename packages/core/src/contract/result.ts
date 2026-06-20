// The `doubles-in / typed-error-or-double-out` result wrapper (CALC-F02).
//
// Every operator returns a `Result<T>`: either a success carrying a finite
// value, or a failure carrying a `CalcError`. This gives consumers the spec's
// "two observable outcomes" model (a finite double, or a typed error with a
// `kind`) without sentinel NaN/Infinity inspection. Exceptions are not used for
// expected failures — they are explicit, branchable values instead.

import type { CalcError, ErrorKind } from './errors.js';

/** A successful computation carrying its finite value. */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/** A failed computation carrying a typed error. */
export interface Err {
  readonly ok: false;
  readonly error: CalcError;
}

/**
 * The outcome of any core operation: success with a value, or failure with a
 * {@link CalcError}. Discriminated on the `ok` field so a `result.ok` check
 * narrows the type for the consumer.
 */
export type Result<T> = Ok<T> | Err;

/** Build a success result. */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Build a failure result from a {@link ErrorKind} (and optional diagnostic
 * detail). Typed as `Err` so it is assignable to `Result<T>` for any `T`.
 */
export function err(kind: ErrorKind, detail?: string): Err {
  return {
    ok: false,
    error: detail === undefined ? { kind } : { kind, detail },
  };
}

/** Type guard narrowing a result to its success branch. */
export function isOk<T>(result: Result<T>): result is Ok<T> {
  return result.ok;
}

/** Type guard narrowing a result to its failure branch. */
export function isErr<T>(result: Result<T>): result is Err {
  return !result.ok;
}
