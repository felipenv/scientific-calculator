// Mathematical constants exposed by @calc/core (CALC-F02, FR18).
//
// π and e as full-precision IEEE-754 doubles. The core owns no formatting, so
// these are the raw constants consumers (F03/F04) read and round themselves —
// they are exactly the runtime's `Math.PI` / `Math.E`, the nearest double to
// each true value (~15–17 significant digits). Re-exported here as named,
// domain-meaningful constants so consumers depend on the core's surface rather
// than reaching for `Math` directly.

/** π, the ratio of a circle's circumference to its diameter (full-precision). */
export const PI = Math.PI;

/** e, the base of the natural logarithm (full-precision). `exp(1) === E`. */
export const E = Math.E;
