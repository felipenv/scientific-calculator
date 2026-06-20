// Public-surface smoke test for @calc/core (CALC-F02).
//
// Verifies the package entrypoint re-exports the shared contract and guard so
// consumers (F03) can import everything from `@calc/core` directly. Behavioral
// assertions live next to each module; this only guards the barrel.

import { describe, expect, it } from 'vitest';

import {
  ErrorKind,
  calcError,
  ok,
  err,
  isOk,
  isErr,
  AngleMode,
  DEFAULT_ANGLE_MODE,
  finite,
  isInteger,
  isNegative,
  PI,
  E,
  CalcCore,
  Registry,
  defaultRegistry,
  OPERATORS,
  RpnStack,
  StackUnderflowError,
  STACK_UNDERFLOW_MESSAGE,
  numberValue,
  isNumberValue,
} from './index.js';

describe('@calc/core public surface', () => {
  it('re-exports the contract and guard from the package root', () => {
    expect(ErrorKind.Overflow).toBe('Overflow');
    expect(calcError(ErrorKind.DomainError)).toEqual({
      kind: ErrorKind.DomainError,
    });
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err(ErrorKind.Overflow)).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow },
    });
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(err(ErrorKind.Overflow))).toBe(true);
    expect(AngleMode.Degrees).toBe('Degrees');
    expect(DEFAULT_ANGLE_MODE).toBe(AngleMode.Degrees);
    expect(finite(1)).toEqual({ ok: true, value: 1 });
    expect(isInteger(2)).toBe(true);
    expect(isNegative(-1)).toBe(true);
  });

  it('re-exports the constants and the registry-backed core (AC10/AC11)', () => {
    expect(PI).toBe(Math.PI);
    expect(E).toBe(Math.E);
    expect(OPERATORS.length).toBeGreaterThan(0);
    expect(defaultRegistry).toBeInstanceOf(Registry);
    expect(defaultRegistry.has('add')).toBe(true);

    // A core is usable straight from the barrel: apply an operator end to end.
    const core = new CalcCore();
    expect(core.angleMode).toBe(AngleMode.Degrees);
    expect(core.apply('add', [2, 3])).toEqual({ ok: true, value: 5 });
  });

  it('re-exports the RPN stack core, value model, and error contract (F03)', () => {
    const stack = new RpnStack();
    stack.push(3);
    stack.push(4);
    expect(stack.peekN(2)).toEqual([4, 3]);

    expect(STACK_UNDERFLOW_MESSAGE).toBe('Error: Stack underflow');
    expect(new StackUnderflowError()).toBeInstanceOf(Error);
    expect(numberValue(1)).toEqual({ type: 'number', value: 1 });
    expect(isNumberValue(numberValue(1))).toBe(true);
  });
});
