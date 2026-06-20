// Enum-shape tests for the shared error taxonomy (CALC-F02).
//
// These pin AC13: the error type exposes EXACTLY five kinds and no more. If a
// future change adds or removes a kind, this fails loudly — the taxonomy is a
// contract shared with F03, not an incidental detail.

import { describe, expect, it } from 'vitest';

import { ErrorKind } from './errors.js';

describe('ErrorKind taxonomy (AC13)', () => {
  it('exposes exactly the five kinds', () => {
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

  it('has exactly five members (no extras, no numeric reverse-mapping)', () => {
    expect(Object.keys(ErrorKind)).toHaveLength(5);
  });

  it('maps each kind to its own readable string token', () => {
    expect(ErrorKind.DivideByZero).toBe('DivideByZero');
    expect(ErrorKind.Indeterminate).toBe('Indeterminate');
    expect(ErrorKind.DomainError).toBe('DomainError');
    expect(ErrorKind.Overflow).toBe('Overflow');
    expect(ErrorKind.StackUnderflow).toBe('StackUnderflow');
  });
});
