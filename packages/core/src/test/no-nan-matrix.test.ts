// AC7 — the matrix-wide no-NaN/Infinity invariant (CALC-F02).
//
// The core's defining promise is that no operation ever returns or leaks a raw
// NaN or Infinity: every non-finite or undefined case is converted to a typed
// error of one of the five shared kinds (FR20). This test proves that property
// holds *across the whole registered operator set*, applied through the public
// `CalcCore.apply` surface, over a deliberately hostile matrix of finite
// inputs — both single operands and operand pairs — in both angle modes.
//
// Why finite inputs: the spec's contract is "finite double in → finite double
// or typed error out" (a finite-input operation whose true result leaves the
// double range is the Overflow case). The matrix therefore spans the valid
// operand domain — signs, zero/-0, fractions, integer and trig boundaries, and
// magnitudes large enough to force overflow — rather than feeding NaN/Infinity,
// which are not valid calculator operands.

import { describe, expect, it } from 'vitest';

import { CalcCore } from '../core.js';
import { defaultRegistry } from '../registry/registry.js';
import { AngleMode } from '../contract/angle-mode.js';
import { ErrorKind } from '../contract/errors.js';

// A broad sweep of finite doubles chosen to exercise every operator's domain
// edges and overflow paths: zeros and signed zero; small integers and their
// negatives; fractions (non-integer factorial/root inputs); the factorial
// boundary (170 finite, 171 overflowing); common trig angles in degrees and
// the radian multiples of π/2; out-of-range inverse-trig inputs (|x| > 1); and
// extreme magnitudes that push results past the double range.
const INPUTS: readonly number[] = [
  0,
  -0,
  1,
  -1,
  2,
  -2,
  3,
  0.5,
  -0.5,
  2.5,
  -2.5,
  10,
  100,
  170,
  171,
  30,
  45,
  60,
  90,
  180,
  270,
  360,
  -90,
  Math.PI,
  Math.PI / 2,
  -Math.PI / 2,
  2 * Math.PI,
  1e-12,
  1e-300,
  1e308,
  -1e308,
  Number.MAX_VALUE,
  Number.MIN_VALUE,
];

const KINDS = new Set<string>(Object.values(ErrorKind));

const modes: readonly AngleMode[] = [AngleMode.Degrees, AngleMode.Radians];

describe('AC7 — no operator leaks NaN/Infinity over the input matrix', () => {
  for (const mode of modes) {
    const core = new CalcCore({ angleMode: mode });

    for (const name of core.operatorNames()) {
      const { arity } = defaultRegistry.get(name)!;

      it(`${name} (${mode}) returns a finite double or a typed error for every input`, () => {
        // Build the per-operator argument list: every single input for arity 1,
        // every ordered pair for arity 2.
        const argLists: number[][] =
          arity === 1
            ? INPUTS.map((x) => [x])
            : INPUTS.flatMap((x) => INPUTS.map((y) => [x, y]));

        for (const args of argLists) {
          const result = core.apply(name, args);
          if (result.ok) {
            // The only success contract: a finite double, never NaN/Infinity.
            expect(
              Number.isFinite(result.value),
              `${name}(${args.join(', ')}) [${mode}] returned non-finite ${result.value}`,
            ).toBe(true);
          } else {
            // Every failure is one of the five closed kinds.
            expect(
              KINDS.has(result.error.kind),
              `${name}(${args.join(', ')}) [${mode}] returned unknown kind ${result.error.kind}`,
            ).toBe(true);
          }
        }
      });
    }
  }
});
