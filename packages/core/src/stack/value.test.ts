// Tests for the typed-ready value model (CALC-F03; FR11).

import { describe, expect, it } from 'vitest';

import { numberValue, isNumberValue, type StackValue } from './value.js';

describe('StackValue (FR11)', () => {
  it('numberValue wraps a raw double as the numeric variant', () => {
    expect(numberValue(42)).toEqual({ type: 'number', value: 42 });
  });

  it('stores the double verbatim, including special doubles', () => {
    expect(numberValue(0.1 + 0.2).value).toBe(0.1 + 0.2);
    expect(numberValue(-0).value).toBe(-0);
    expect(numberValue(Number.MAX_VALUE).value).toBe(Number.MAX_VALUE);
  });

  it('isNumberValue narrows the union to its numeric arm', () => {
    const v: StackValue = numberValue(7);
    expect(isNumberValue(v)).toBe(true);
    // The access below only type-checks because isNumberValue narrowed `v`.
    expect(isNumberValue(v) && v.value === 7).toBe(true);
  });
});
