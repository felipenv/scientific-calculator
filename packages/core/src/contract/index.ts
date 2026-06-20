// Barrel for the F03-shared contract surface (CALC-F02).
//
// This is the dependency-free layer F03 imports without pulling in any operator
// internals: the error taxonomy, the result wrapper, and the angle mode.

export { ErrorKind } from './errors.js';
export type { CalcError } from './errors.js';
export { ok, err } from './result.js';
export type { Result } from './result.js';
export { AngleMode, DEFAULT_ANGLE_MODE } from './angle-mode.js';
