// The single core-level angle mode (CALC-F02, FR19).
//
// One source of truth read by every trig / inverse-trig operator: trig consumes
// angles in this mode and inverse-trig produces them in the same mode. It is a
// core-instance setting, NOT a per-operation argument.

/**
 * How trig operators interpret angle inputs and express angle outputs.
 *
 * String-valued for self-describing logs/tests. Default is `Degrees` (AC1) — an
 * audience/least-surprise choice, an accepted divergence from the device's
 * actual Radians default.
 *
 * Adding `Grads = 'Grads'` here is the one-line future extension (AC12); it
 * needs no change to the operator-application contract.
 */
export enum AngleMode {
  Degrees = 'Degrees',
  Radians = 'Radians',
}

/** The default angle mode for a fresh core instance (FR19). */
export const DEFAULT_ANGLE_MODE: AngleMode = AngleMode.Degrees;
