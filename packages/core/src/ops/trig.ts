// Angle-mode-aware trigonometric and inverse-trigonometric operators (CALC-F02).
//
// All six functions read the core angle mode (FR10–FR13, FR19) as a read-only
// parameter the core threads in — there is exactly one mode governing *both*
// directions, never a separate per-call argument for input vs. output. Forward
// trig (`sin`/`cos`/`tan`) interprets its input angle in the active mode; the
// inverse functions (`asin`/`acos`/`atan`) express their result angle in the
// same mode. Native `Math` works in radians, so the mode is converted away on
// the way in and reapplied on the way out, from this one source of truth.
//
// Every numeric exit is guarded by `finite()` (FR20): `tan` near its
// singularities (e.g. 90° / π·(k+½)) can exceed the double range, and the core
// must surface that as {@link ErrorKind.Overflow} rather than leak `Infinity`.

import { AngleMode } from '../contract/angle-mode.js';
import { ErrorKind } from '../contract/errors.js';
import { err, type Result } from '../contract/result.js';
import { finite } from '../guard/finite.js';

const DEG_PER_HALF_TURN = 180;

/** Convert an angle expressed in `mode` into radians for native `Math`. */
function toRadians(angle: number, mode: AngleMode): number {
  return mode === AngleMode.Degrees
    ? (angle * Math.PI) / DEG_PER_HALF_TURN
    : angle;
}

/** Convert a radian angle from native `Math` back into the active `mode`. */
function fromRadians(radians: number, mode: AngleMode): number {
  return mode === AngleMode.Degrees
    ? (radians * DEG_PER_HALF_TURN) / Math.PI
    : radians;
}

/** `sin` of an angle interpreted in the active mode (FR10). */
export function sin(angle: number, mode: AngleMode): Result<number> {
  return finite(Math.sin(toRadians(angle, mode)));
}

/** `cos` of an angle interpreted in the active mode (FR10). */
export function cos(angle: number, mode: AngleMode): Result<number> {
  return finite(Math.cos(toRadians(angle, mode)));
}

/**
 * `tan` of an angle interpreted in the active mode (FR10). At a singularity the
 * magnitude can blow past the double range; the guard maps any non-finite exit
 * to {@link ErrorKind.Overflow} so the core never returns `Infinity`.
 */
export function tan(angle: number, mode: AngleMode): Result<number> {
  return finite(Math.tan(toRadians(angle, mode)));
}

/**
 * `asin(x)` (FR11). Input outside `[-1, 1]` is outside the domain and returns
 * {@link ErrorKind.DomainError}; the result angle is expressed in `mode`.
 */
export function asin(x: number, mode: AngleMode): Result<number> {
  if (!(x >= -1 && x <= 1)) {
    // Also rejects NaN, which a bare `x < -1 || x > 1` test would admit.
    return err(ErrorKind.DomainError, 'asin requires -1 <= x <= 1');
  }
  return finite(fromRadians(Math.asin(x), mode));
}

/**
 * `acos(x)` (FR11). Input outside `[-1, 1]` returns
 * {@link ErrorKind.DomainError}; the result angle is expressed in `mode`.
 */
export function acos(x: number, mode: AngleMode): Result<number> {
  if (!(x >= -1 && x <= 1)) {
    return err(ErrorKind.DomainError, 'acos requires -1 <= x <= 1');
  }
  return finite(fromRadians(Math.acos(x), mode));
}

/**
 * `atan(x)` (FR12). Defined for all reals; the result angle is expressed in
 * `mode`.
 */
export function atan(x: number, mode: AngleMode): Result<number> {
  return finite(fromRadians(Math.atan(x), mode));
}
