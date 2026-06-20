// Barrel for the published, F03-shared contract surface (CALC-F02).
//
// This layer is intentionally dependency-free (no `guard/`, no `ops/`) so F03
// and other consumers can import the types without pulling operator internals.

export { ErrorKind } from './errors.js';
export type { CalcError } from './errors.js';

export { ok, err, isOk, isErr } from './result.js';
export type { Result, Ok, Err } from './result.js';

export { AngleMode, DEFAULT_ANGLE_MODE } from './angle-mode.js';
