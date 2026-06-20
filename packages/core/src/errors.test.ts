// Tests for the core-owned underflow error contract (CALC-F02, FR8).

import { describe, expect, it } from 'vitest';

import { StackUnderflowError, STACK_UNDERFLOW_MESSAGE } from './errors.js';

describe('StackUnderflowError', () => {
  it('carries the exact cross-feature message string', () => {
    // This exact string is the contract consumed by the Web Calculator
    // Interface (feature #4). It is defined ONCE here.
    expect(new StackUnderflowError().message).toBe('Error: Stack underflow');
  });

  it('exposes the message as a reusable constant', () => {
    expect(STACK_UNDERFLOW_MESSAGE).toBe('Error: Stack underflow');
    expect(new StackUnderflowError().message).toBe(STACK_UNDERFLOW_MESSAGE);
  });

  it('is an Error subclass with a stable name', () => {
    const err = new StackUnderflowError();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(StackUnderflowError);
    expect(err.name).toBe('StackUnderflowError');
  });
});
