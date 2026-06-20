// Tests for the typed-ready value model (CALC-F03, FR11).

import { describe, expect, it } from 'vitest';

import { numberValue, isNumberValue, type StackValue } from './value.js';

describe('value model', () => {
  it('wraps a raw double as a numeric variant', () => {
    const v = numberValue(42.5);
    expect(v).toEqual({ type: 'number', value: 42.5 });
  });

  it('preserves the exact IEEE-754 double (no rounding) — FR10', () => {
    expect(numberValue(0.1 + 0.2).value).toBe(0.30000000000000004);
  });

  it('recognises the numeric variant via the type guard', () => {
    const v: StackValue = numberValue(1);
    expect(isNumberValue(v)).toBe(true);
  });

  it('discriminates on the `type` tag, keeping the FR11 seam open', () => {
    // The union is tagged so future variants slot in without changing callers
    // that switch on `type`.
    const v: StackValue = numberValue(3);
    expect(v.type).toBe('number');
  });
});
