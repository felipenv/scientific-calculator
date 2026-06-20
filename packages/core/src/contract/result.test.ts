// Tests for the Result wrapper constructors (CALC-F02).

import { describe, expect, it } from 'vitest';

import { ErrorKind } from './errors.js';
import { ok, err } from './result.js';

describe('Result constructors', () => {
  it('ok() wraps a value with the success discriminant', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    // Narrowing on `ok` exposes `value`.
    if (r.ok) {
      expect(r.value).toBe(42);
    }
  });

  it('err() wraps a kind with the failure discriminant', () => {
    const r = err(ErrorKind.DivideByZero);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe(ErrorKind.DivideByZero);
    }
  });

  it('ok() preserves the success value type, including falsy values', () => {
    const r = ok(0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBe(0);
    }
  });
});
