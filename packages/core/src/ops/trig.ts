// Trigonometric and inverse-trig operators (CALC-F02), angle-mode aware.
//
// The single core-level `AngleMode` (FR13/FR19) is threaded in read-only as the
// last argument — operators never own or mutate it, and there is no per-call
// mode duplication beyond this one parameter the registry supplies. Direct trig
// (`sin`/`cos`/`tan`) interprets its input angle in the active mode; inverse
// trig (`asin`/`acos`/`atan`) expresses its output angle in the same mode, from
// one source of truth.
//
// All conversion goes through the `RAD_PER_DEG` / `DEG_PER_RAD` pair below, so
// "interpret an angle" and "express an angle" can never drift apart. Every
// numeric exit routes through the non-finite guard: `tan` near a singularity
// must not leak `Infinity`, so a non-finite result becomes `Overflow` (FR10).

import type { Result } from '../contract/result.js';
import { err } from '../contract/result.js';
import { ErrorKind } from '../contract/errors.js';
import { AngleMode } from '../contract/angle-mode.js';
import { finite } from '../guard/finite.js';

// Single source of truth for degree<->radian conversion. Native `Math` trig
// works in radians, so Degrees inputs are converted in and Degrees outputs out.
const RAD_PER_DEG = Math.PI / 180;
const DEG_PER_RAD = 180 / Math.PI;

/** Interpret a caller's angle (in the active mode) as radians for `Math`. */
function toRadians(angle: number, mode: AngleMode): number {
  return mode === AngleMode.Degrees ? angle * RAD_PER_DEG : angle;
}

/** Express a radian result from `Math` in the active mode. */
function fromRadians(angle: number, mode: AngleMode): number {
  return mode === AngleMode.Degrees ? angle * DEG_PER_RAD : angle;
}

/** `sin(x)`, input angle in the active mode (FR10). */
export function sin(x: number, mode: AngleMode): Result<number> {
  return finite(Math.sin(toRadians(x, mode)));
}

/** `cos(x)`, input angle in the active mode (FR10). */
export function cos(x: number, mode: AngleMode): Result<number> {
  return finite(Math.cos(toRadians(x, mode)));
}

/**
 * `tan(x)`, input angle in the active mode (FR10). At a singularity the result
 * may be non-finite; the guard converts that to `Overflow` so the core never
 * returns `Infinity`. (Because exact multiples of π/2 are not representable as
 * doubles, in practice `Math.tan` returns a very large finite value there — the
 * guard is the invariant, not a promise that every singularity overflows.)
 */
export function tan(x: number, mode: AngleMode): Result<number> {
  return finite(Math.tan(toRadians(x, mode)));
}

/**
 * `asin(x)` (FR11). Domain is `[-1, 1]`; outside it is `DomainError`. The
 * returned angle is expressed in the active mode.
 */
export function asin(x: number, mode: AngleMode): Result<number> {
  if (x < -1 || x > 1) return err(ErrorKind.DomainError);
  return finite(fromRadians(Math.asin(x), mode));
}

/**
 * `acos(x)` (FR11). Domain is `[-1, 1]`; outside it is `DomainError`. The
 * returned angle is expressed in the active mode.
 */
export function acos(x: number, mode: AngleMode): Result<number> {
  if (x < -1 || x > 1) return err(ErrorKind.DomainError);
  return finite(fromRadians(Math.acos(x), mode));
}

/**
 * `atan(x)` (FR12). Defined for all reals; the returned angle is expressed in
 * the active mode.
 */
export function atan(x: number, mode: AngleMode): Result<number> {
  return finite(fromRadians(Math.atan(x), mode));
}
