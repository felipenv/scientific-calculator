// Unit tests for the shared contract surface (CALC-F02): the error taxonomy
// shape (AC13), the Result helpers, and the angle-mode default (FR19).

import { describe, expect, it } from 'vitest';

import { AngleMode, DEFAULT_ANGLE_MODE } from './angle-mode.js';
import { ErrorKind } from './errors.js';
import { err, isErr, isOk, ok, type Result } from './result.js';

describe('ErrorKind taxonomy', () => {
  it('exposes exactly the five shared kinds (AC13)', () => {
    expect(Object.keys(ErrorKind).sort()).toEqual(
      [
        'DivideByZero',
        'DomainError',
        'Indeterminate',
        'Overflow',
        'StackUnderflow',
      ].sort(),
    );
  });

  it('member values mirror their names for readable diagnostics', () => {
    expect(ErrorKind.DivideByZero).toBe('DivideByZero');
    expect(ErrorKind.Indeterminate).toBe('Indeterminate');
    expect(ErrorKind.DomainError).toBe('DomainError');
    expect(ErrorKind.Overflow).toBe('Overflow');
    expect(ErrorKind.StackUnderflow).toBe('StackUnderflow');
  });
});

describe('Result helpers', () => {
  it('ok() builds a success branch', () => {
    const result = ok(7);
    expect(result).toEqual({ ok: true, value: 7 });
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
  });

  it('err() builds a failure branch carrying the kind', () => {
    const result = err(ErrorKind.DomainError);
    expect(result).toEqual({
      ok: false,
      error: { kind: ErrorKind.DomainError },
    });
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
  });

  it('err() attaches optional diagnostic detail when given', () => {
    expect(err(ErrorKind.Overflow, 'too big')).toEqual({
      ok: false,
      error: { kind: ErrorKind.Overflow, detail: 'too big' },
    });
  });

  it('discriminates on the ok field for type narrowing', () => {
    const results: Result<number>[] = [ok(1), err(ErrorKind.DivideByZero)];
    const values = results.filter(isOk).map((r) => r.value);
    expect(values).toEqual([1]);
  });
});

describe('AngleMode', () => {
  it('defaults to Degrees (FR19)', () => {
    expect(DEFAULT_ANGLE_MODE).toBe(AngleMode.Degrees);
  });

  it('exposes the two v0 modes', () => {
    expect(Object.keys(AngleMode).sort()).toEqual(['Degrees', 'Radians']);
  });
});
