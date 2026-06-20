// Tests for the accessible-text formatting (CALC-F04, FR21/FR23).

import { describe, expect, it } from 'vitest';

import { AngleMode, type CalcState } from '../core/contract.js';
import { calcError } from '../core/errors.js';
import { formatError, formatStackAnnouncement } from './error-format.js';

/** Build a CalcState with sensible defaults, overriding only what a test needs. */
function state(overrides: Partial<CalcState> = {}): CalcState {
  return {
    stack: [],
    entry: '',
    angleMode: AngleMode.Degrees,
    shift: false,
    error: null,
    ...overrides,
  };
}

describe('formatStackAnnouncement (FR23)', () => {
  it('frames the X register with its level so a bare number has meaning', () => {
    expect(formatStackAnnouncement(state({ stack: [42] }))).toBe(
      'Stack level 1: 42',
    );
  });

  it('announces level 1 (index 0), not a deeper level', () => {
    expect(formatStackAnnouncement(state({ stack: [1, 2, 3] }))).toBe(
      'Stack level 1: 1',
    );
  });

  it('echoes the in-progress entry while one is being typed', () => {
    expect(formatStackAnnouncement(state({ stack: [9], entry: '3.1' }))).toBe(
      'Entry: 3.1',
    );
  });

  it('says the stack is empty when there is no value and no entry', () => {
    expect(formatStackAnnouncement(state())).toBe('Stack empty');
  });

  it('uses the raw IEEE-754 string the display shows (FR15)', () => {
    expect(formatStackAnnouncement(state({ stack: [0.1 + 0.2] }))).toBe(
      'Stack level 1: 0.30000000000000004',
    );
  });
});

describe('formatError (FR21)', () => {
  it('surfaces the exact FR21 message for each error code', () => {
    expect(formatError(calcError('DIV_ZERO'))).toBe('Error: Divide by 0');
    expect(formatError(calcError('DOMAIN'))).toBe('Error: Undefined');
    expect(formatError(calcError('OVERFLOW'))).toBe('Error: Overflow');
    expect(formatError(calcError('UNDERFLOW'))).toBe(
      'Error: Stack underflow (Too Few Arguments)',
    );
  });
});
