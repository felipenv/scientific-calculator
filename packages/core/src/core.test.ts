// Tests for the CalcCore instance (CALC-F02): persistent angle mode, the
// registry-backed apply surface F03 consumes, and the unknown-operator boundary.

import { describe, expect, it } from 'vitest';

import { CalcCore } from './core.js';
import { Registry } from './registry/registry.js';
import { OPERATORS, type Operator } from './registry/operators.js';
import { AngleMode } from './contract/angle-mode.js';
import { ErrorKind } from './contract/errors.js';
import { ok } from './contract/result.js';
import { approxEqual, unwrap } from './test/tolerance.js';

describe('angle mode (FR19)', () => {
  it('defaults to Degrees', () => {
    expect(new CalcCore().angleMode).toBe(AngleMode.Degrees);
  });

  it('honours an injected initial mode', () => {
    const core = new CalcCore({ angleMode: AngleMode.Radians });
    expect(core.angleMode).toBe(AngleMode.Radians);
  });

  it('persists across calls and is the single lever for trig interpretation (AC1)', () => {
    const core = new CalcCore();
    // Degrees by default: sin(90°) = 1.
    expect(approxEqual(unwrap(core.apply('sin', [90])), 1)).toBe(true);

    core.setAngleMode(AngleMode.Radians);
    expect(core.angleMode).toBe(AngleMode.Radians);
    // Same operator, mode changed: sin(π/2) = 1.
    expect(approxEqual(unwrap(core.apply('sin', [Math.PI / 2])), 1)).toBe(true);
  });

  it('expresses inverse-trig output in the active mode (AC2)', () => {
    const core = new CalcCore();
    expect(approxEqual(unwrap(core.apply('asin', [1])), 90)).toBe(true);
    core.setAngleMode(AngleMode.Radians);
    expect(approxEqual(unwrap(core.apply('asin', [1])), Math.PI / 2)).toBe(
      true,
    );
  });
});

describe('registry-backed apply', () => {
  it('applies a registered operator end to end', () => {
    const core = new CalcCore();
    expect(core.apply('divide', [6, 3])).toEqual(ok(2));
    expect(core.apply('divide', [1, 0])).toEqual({
      ok: false,
      error: { kind: ErrorKind.DivideByZero },
    });
  });

  it('exposes the registered operator names', () => {
    const core = new CalcCore();
    expect(core.has('factorial')).toBe(true);
    expect(core.has('mystery')).toBe(false);
    expect(core.operatorNames()).toContain('atan');
  });

  it('throws on an unknown operator (a programming error, not a calc kind)', () => {
    const core = new CalcCore();
    expect(() => core.apply('nope', [1])).toThrow(/unknown operator/);
  });
});

describe('injectable registry (AC12)', () => {
  it('applies operators from a custom registry through the same surface', () => {
    const triple: Operator = {
      name: 'triple',
      arity: 1,
      apply: (args) => ok(args[0] * 3),
    };
    const core = new CalcCore({
      registry: new Registry([...OPERATORS, triple]),
    });
    expect(core.apply('triple', [4])).toEqual(ok(12));
    // The built-in operators remain available alongside the addition.
    expect(core.apply('add', [1, 1])).toEqual(ok(2));
  });
});
