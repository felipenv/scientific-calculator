// The single core-level angle mode (CALC-F02, FR19).
//
// All trig/inverse-trig operators read one shared angle mode rather than taking
// a per-call argument: trig consumes angles in the active mode and inverse-trig
// produces angles in the same mode, from one source of truth (FR13). The core
// instance holds this setting persistently; the default is Degrees — an
// audience/least-surprise choice, recorded as a deliberate divergence from the
// device (whose default is Radians).

/**
 * How the core interprets and produces angles. Adding `Grads = 'Grads'` here is
 * the intended one-line future extension (AC12) — no operator-application
 * contract changes.
 */
export enum AngleMode {
  Degrees = 'Degrees',
  Radians = 'Radians',
  // Grads = 'Grads', // future: one-line drop-in, no contract change.
}

/** The default angle mode for a fresh core instance (FR19). */
export const DEFAULT_ANGLE_MODE: AngleMode = AngleMode.Degrees;
