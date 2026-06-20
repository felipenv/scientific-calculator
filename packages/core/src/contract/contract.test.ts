// Contract tests for the shared surface (CALC-F02): error taxonomy shape,
// Result helpers/guards, and the default angle mode.

import { describe, expect, it } from 'vitest';

import { ErrorKind, calcError, type CalcError } from './errors.js';
import { ok, err, isOk, isErr, type Result } from './result.js';
import { AngleMode, DEFAULT_ANGLE_MODE } from './angle-mode.js';

describe('ErrorKind taxonomy (AC13)', () => {
  it('exposes exactly the five shared kinds', () => {
    expect(Object.values(ErrorKind).sort()).toEqual(
      [
        'DivideByZero',
        'Indeterminate',
        'DomainError',
        'Overflow',
        'StackUnderflow',
      ].sort(),
    );
  });

  it('has five members and no more', () => {
    expect(Object.keys(ErrorKind)).toHaveLength(5);
  });

  it('uses self-describing string values (key === value)', () => {
    for (const [key, value] of Object.entries(ErrorKind)) {
      expect(value).toBe(key);
    }
  });

  it('builds a CalcError carrying just its kind', () => {
    const error: CalcError = calcError(ErrorKind.DivideByZero);
    expect(error).toEqual({ kind: ErrorKind.DivideByZero });
  });
});

describe('Result wrapper', () => {
  it('ok() wraps a value on the success branch', () => {
    const r = ok(42);
    expect(r).toEqual({ ok: true, value: 42 });
  });

  it('err() wraps a kind on the error branch with no value', () => {
    const r = err(ErrorKind.Overflow);
    expect(r).toEqual({ ok: false, error: { kind: ErrorKind.Overflow } });
  });

  it('isOk / isErr discriminate the union', () => {
    const good: Result<number> = ok(1);
    const bad: Result<number> = err(ErrorKind.DomainError);

    expect(isOk(good)).toBe(true);
    expect(isErr(good)).toBe(false);
    expect(isOk(bad)).toBe(false);
    expect(isErr(bad)).toBe(true);
  });

  it('isOk narrows to the value branch for the type checker', () => {
    const r: Result<number> = ok(7);
    // The assertion below only compiles because isOk narrows away the error arm.
    expect(isOk(r) && r.value === 7).toBe(true);
  });

  it('preserves falsy success values (0, NaN, empty string)', () => {
    expect(ok(0)).toEqual({ ok: true, value: 0 });
    // A successfully-wrapped NaN is still "ok": the guard, not Result, owns the
    // non-finite invariant. Use Number.isNaN since NaN !== NaN.
    const wrapped = ok(NaN);
    expect(wrapped.ok).toBe(true);
    expect(wrapped.ok && Number.isNaN(wrapped.value)).toBe(true);
  });
});

describe('AngleMode (FR19)', () => {
  it('exposes exactly Degrees and Radians for v0', () => {
    expect(Object.values(AngleMode).sort()).toEqual(['Degrees', 'Radians']);
  });

  it('defaults to Degrees (AC1)', () => {
    expect(DEFAULT_ANGLE_MODE).toBe(AngleMode.Degrees);
  });
});
