// Tests for the underflow error contract (CALC-F03; FR8).
//
// The message string is a cross-feature contract consumed by feature #4, so it
// is pinned exactly here — a change to the wording must break this test.

import { describe, expect, it } from 'vitest';

import { StackUnderflowError, STACK_UNDERFLOW_MESSAGE } from './errors.js';
import { ErrorKind } from '../contract/errors.js';

describe('StackUnderflowError (FR8 contract)', () => {
  it('carries the exact user-facing message', () => {
    expect(STACK_UNDERFLOW_MESSAGE).toBe('Error: Stack underflow');
    expect(new StackUnderflowError().message).toBe('Error: Stack underflow');
  });

  it('is a real Error subclass (catchable, identifiable)', () => {
    const error = new StackUnderflowError();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(StackUnderflowError);
    expect(error.name).toBe('StackUnderflowError');
  });

  it('bridges to the shared ErrorKind taxonomy (F02)', () => {
    expect(new StackUnderflowError().kind).toBe(ErrorKind.StackUnderflow);
  });
});
