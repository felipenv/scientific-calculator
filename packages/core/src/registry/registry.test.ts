// Tests for the function registry and operator catalogue (CALC-F02, FR22):
// lookup, the uniform apply shape, arity self-guarding, and the AC12
// extensibility guarantee (swap an operator / add an angle mode with no change
// to the apply contract).

import { describe, expect, it } from 'vitest';

import { Registry, defaultRegistry } from './registry.js';
import { OPERATORS, type Operator } from './operators.js';
import { ErrorKind } from '../contract/errors.js';
import { AngleMode } from '../contract/angle-mode.js';
import type { Result } from '../contract/result.js';
import { ok } from '../contract/result.js';

describe('Registry lookup (FR22)', () => {
  it('registers and looks operators up by name', () => {
    const reg = new Registry(OPERATORS);
    const add = reg.get('add');
    expect(add).toBeDefined();
    expect(add?.arity).toBe(2);
    expect(reg.has('add')).toBe(true);
    expect(reg.has('nope')).toBe(false);
    expect(reg.get('nope')).toBeUndefined();
  });

  it('reports every registered name in insertion order', () => {
    const reg = new Registry([
      { name: 'a', arity: 1, apply: () => ok(0) },
      { name: 'b', arity: 1, apply: () => ok(0) },
    ]);
    expect(reg.names()).toEqual(['a', 'b']);
  });

  it('starts empty when constructed without a catalogue', () => {
    expect(new Registry().names()).toEqual([]);
  });
});

describe('default v0 catalogue', () => {
  // The full v0 operator set this ticket must wire through the registry, with
  // each operator's declared arity. Guards against an operator being dropped or
  // mis-keyed when the catalogue changes.
  const expected: ReadonlyArray<[string, 1 | 2]> = [
    ['add', 2],
    ['subtract', 2],
    ['multiply', 2],
    ['divide', 2],
    ['power', 2],
    ['square', 1],
    ['sqrt', 1],
    ['nthRoot', 2],
    ['exp', 1],
    ['ln', 1],
    ['log10', 1],
    ['sin', 1],
    ['cos', 1],
    ['tan', 1],
    ['asin', 1],
    ['acos', 1],
    ['atan', 1],
    ['factorial', 1],
    ['reciprocal', 1],
    ['negate', 1],
    ['percent', 1],
  ];

  it('registers exactly the v0 operator set with correct arities', () => {
    expect(defaultRegistry.names().sort()).toEqual(
      expected.map(([name]) => name).sort(),
    );
    for (const [name, arity] of expected) {
      expect(defaultRegistry.get(name)?.arity).toBe(arity);
    }
  });

  it.each(expected)(
    'applies %s through the uniform (args, mode) contract',
    (name, arity) => {
      // A representative in-domain call per arity: every operator returns a
      // Result through the same signature, regardless of its native shape.
      const args = arity === 2 ? [6, 3] : [1];
      const result = defaultRegistry.get(name)!.apply(args, AngleMode.Radians);
      expect(typeof result.ok).toBe('boolean');
    },
  );
});

describe('arity self-guard (FR20/FR21)', () => {
  // Operand supply is F03's job, but because apply takes an array it guards its
  // own arity and reports the shared StackUnderflow kind rather than indexing a
  // missing operand into a NaN.
  it('reports StackUnderflow when a binary op gets too few operands', () => {
    expect(defaultRegistry.get('add')!.apply([1], AngleMode.Degrees)).toEqual({
      ok: false,
      error: { kind: ErrorKind.StackUnderflow },
    });
  });

  it('reports StackUnderflow when a unary op gets no operands', () => {
    expect(defaultRegistry.get('sqrt')!.apply([], AngleMode.Degrees)).toEqual({
      ok: false,
      error: { kind: ErrorKind.StackUnderflow },
    });
  });

  it('ignores extra operands beyond an operator arity', () => {
    // A binary op reads only its first two operands; trailing values are F03's
    // stack, not this operator's concern.
    expect(
      defaultRegistry.get('add')!.apply([1, 2, 99], AngleMode.Degrees),
    ).toEqual({ ok: true, value: 3 });
  });
});

describe('error taxonomy is the closed five-kind set (AC13)', () => {
  it('exposes exactly the five shared kinds', () => {
    expect(Object.values(ErrorKind).sort()).toEqual(
      [
        'DivideByZero',
        'DomainError',
        'Indeterminate',
        'Overflow',
        'StackUnderflow',
      ].sort(),
    );
  });
});

describe('extensibility without changing the apply contract (AC12)', () => {
  it('swaps an operator implementation in place by re-registering its name', () => {
    // Default factorial rejects non-integers (DomainError). A future
    // Gamma-extended factorial would accept them — registering it under the
    // same name swaps the behavior with zero change to how apply is called.
    const gammaFactorial: Operator = {
      name: 'factorial',
      arity: 1,
      apply: (args) => ok(args[0] * 100), // stub stand-in for Γ(x+1)
    };
    const reg = new Registry(OPERATORS).register(gammaFactorial);

    // Same apply call site, swapped result.
    expect(reg.get('factorial')!.apply([2.5], AngleMode.Degrees)).toEqual(
      ok(250),
    );
    // The default catalogue is untouched (we built a separate registry).
    expect(
      defaultRegistry.get('factorial')!.apply([2.5], AngleMode.Degrees),
    ).toEqual({ ok: false, error: { kind: ErrorKind.DomainError } });
  });

  it('drops in a brand-new operator with the same contract', () => {
    const cube: Operator = {
      name: 'cube',
      arity: 1,
      apply: (args) => ok(args[0] ** 3),
    };
    const reg = new Registry(OPERATORS).register(cube);
    expect(reg.has('cube')).toBe(true);
    expect(reg.get('cube')!.apply([3], AngleMode.Degrees)).toEqual(ok(27));
  });

  it('threads an arbitrary (future GRAD) angle mode through apply unchanged', () => {
    // Adding GRAD is a one-line AngleMode enum addition; the apply contract is
    // mode-agnostic and carries whatever mode value the core holds, so a
    // GRAD-aware operator is drop-in. Simulate the future enum value with a cast.
    const GRADS = 'Grads' as AngleMode;
    const echoMode: Operator = {
      name: 'echoMode',
      arity: 1,
      apply: (_args, mode): Result<number> => ok(mode === GRADS ? 1 : 0),
    };
    const reg = new Registry([echoMode]);
    expect(reg.get('echoMode')!.apply([0], GRADS)).toEqual(ok(1));
    expect(reg.get('echoMode')!.apply([0], AngleMode.Degrees)).toEqual(ok(0));
  });
});
