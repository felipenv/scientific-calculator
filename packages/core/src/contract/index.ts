// Barrel for the published, F03-shared contract surface (CALC-F02).
//
// This layer is dependency-free (it imports nothing outside `contract/`), so
// F03 can consume the types without pulling in operator internals.

export { ErrorKind, calcError } from './errors.js';
export type { CalcError } from './errors.js';

export { ok, err, isOk, isErr } from './result.js';
export type { Result } from './result.js';

export { AngleMode, DEFAULT_ANGLE_MODE } from './angle-mode.js';
