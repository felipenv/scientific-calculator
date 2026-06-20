// Full-precision mathematical constants for the calculator core (CALC-F02,
// FR18).
//
// The core exposes π and e as raw IEEE-754 doubles — the closest representable
// values, sourced from the JS standard library so they match the same `Math`
// used by the operators (e.g. `exp(1)` equals `E` within tolerance, AC10). The
// core owns no formatting: these are unrounded doubles, and any display
// precision is the UI's concern (F04).

/** π as a full-precision double (`Math.PI`). */
export const PI: number = Math.PI;

/** Euler's number e as a full-precision double (`Math.E`). */
export const E: number = Math.E;
