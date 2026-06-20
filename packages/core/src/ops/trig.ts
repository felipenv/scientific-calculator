// Angle-mode-aware trigonometric and inverse-trig operators (CALC-F02).
//
// These are the only operators that read the core angle mode. The mode is the
// single source of truth (FR13/FR19): the core threads it in read-only, rather
// than every call carrying its own mode flag. Symmetry is the contract — trig
// functions *interpret* their input angle in the active mode, and inverse-trig
// functions *express* their result angle in that same mode, so a round trip
// (e.g. `asin(sin(x))`) stays in one unit system.
//
// `Math` works exclusively in radians, so the mode handling lives in two thin
// converters: `toRadians` on the way in, `fromRadians` on the way out. Adding
// `Grads` later (AC12) is a one-line change in each converter — nothing else
// here, and nothing in the registry contract, moves.
//
// Every numeric exit still routes through `finite()`. `tan` at a singularity
// (e.g. 90° / π·(k+½)) is the case that matters: in IEEE-754 it returns a very
// large finite double rather than a true `Infinity`, but the guard guarantees
// that *if* a non-finite ever escapes it surfaces as `Overflow`, never as a
// leaked `Infinity` (FR10/FR20/AC7).

import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { AngleMode } from '../contract/angle-mode.js';
import { finite } from '../guard/finite.js';

/** Radians per degree — the input scale factor for Degrees mode. */
const RAD_PER_DEG = Math.PI / 180;
/** Degrees per radian — the output scale factor for Degrees mode. */
const DEG_PER_RAD = 180 / Math.PI;

/** Convert an angle expressed in `mode` into radians for `Math`. */
function toRadians(angle: number, mode: AngleMode): number {
  return mode === AngleMode.Degrees ? angle * RAD_PER_DEG : angle;
}

/** Convert a radian value from `Math` back into the active `mode`. */
function fromRadians(radians: number, mode: AngleMode): number {
  return mode === AngleMode.Degrees ? radians * DEG_PER_RAD : radians;
}

/** `sin` of an angle interpreted in the active mode (FR10). */
export function sin(x: number, mode: AngleMode): Result<number> {
  return finite(Math.sin(toRadians(x, mode)));
}

/** `cos` of an angle interpreted in the active mode (FR10). */
export function cos(x: number, mode: AngleMode): Result<number> {
  return finite(Math.cos(toRadians(x, mode)));
}

/**
 * `tan` of an angle interpreted in the active mode (FR10). At a singularity the
 * native result is a large finite double; the guard converts any genuine
 * non-finite to `Overflow` so `Infinity` never leaks.
 */
export function tan(x: number, mode: AngleMode): Result<number> {
  return finite(Math.tan(toRadians(x, mode)));
}

/**
 * `asin(x)` (FR11). Real domain is `[-1, 1]`; anything outside is
 * `DomainError`. The returned angle is expressed in the active mode.
 */
export function asin(x: number, mode: AngleMode): Result<number> {
  if (!(x >= -1 && x <= 1)) {
    return err(ErrorKind.DomainError);
  }
  return finite(fromRadians(Math.asin(x), mode));
}

/**
 * `acos(x)` (FR11). Real domain is `[-1, 1]`; anything outside is
 * `DomainError`. The returned angle is expressed in the active mode.
 */
export function acos(x: number, mode: AngleMode): Result<number> {
  if (!(x >= -1 && x <= 1)) {
    return err(ErrorKind.DomainError);
  }
  return finite(fromRadians(Math.acos(x), mode));
}

/**
 * `atan(x)` (FR12). Defined for all reals; the returned angle is expressed in
 * the active mode.
 */
export function atan(x: number, mode: AngleMode): Result<number> {
  return finite(fromRadians(Math.atan(x), mode));
}
