// Full-precision mathematical constants for @calc/core (CALC-F02).
//
// The core exposes pi and e as raw IEEE-754 doubles (FR18, AC10). These are the
// JavaScript `Math` constants verbatim — the nearest double to each value — not
// truncated literals, so `exp(1)` matches `E` exactly and trig identities hold
// to last-ULP. Formatting/rounding for display is the UI's concern (F04), never
// the core's.

/** The ratio of a circle's circumference to its diameter, as a double (FR18). */
export const PI: number = Math.PI;

/** Euler's number, the base of the natural logarithm, as a double (FR18). */
export const E: number = Math.E;
