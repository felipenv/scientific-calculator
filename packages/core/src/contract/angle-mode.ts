// The core-level angle mode (CALC-F02).
//
// A single source of truth read by every trig / inverse-trig operation, set
// once on the core instance rather than passed per call (FR13, FR19). Trig
// functions interpret their input in this mode; inverse-trig functions express
// their result in it.

/**
 * How angles are interpreted and produced by trig / inverse-trig operations.
 *
 * String-valued for readable, stable serialization. To add `Grads` later, add
 * one line — `Grads = 'Grads'` — and teach the trig conversion helpers about
 * it; nothing in the operator-application contract changes (AC12).
 */
export enum AngleMode {
  Degrees = 'Degrees',
  Radians = 'Radians',
}

/**
 * The default mode. Degrees is the least-surprise choice for this audience and
 * a deliberate, recorded divergence from the device (which defaults to
 * Radians) — see the feature spec's accepted divergences.
 */
export const DEFAULT_ANGLE_MODE: AngleMode = AngleMode.Degrees;
