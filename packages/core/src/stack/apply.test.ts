// Tests for the operator-application semantics on the RPN stack (CALC-F03).
//
// Covers the evaluation portion of the feature's acceptance criteria:
// AC2 (binary consume/push, depth −1, RPN operand order), AC3 (unary depth
// unchanged), AC5 (binary portion: `5 ENTER ×` underflows, not 25), and AC6
// (atomic, non-destructive underflow with full before/after state equality).
//
// The supplied operator functions here are plain numeric functions standing in
// for the Calculation Engine Core (F02): the stack applies whatever they return
// and owns only arity, RPN order, and atomic underflow — never the math.

import { describe, expect, it } from 'vitest';

import { RpnStack } from './stack.js';
import { StackUnderflowError } from './errors.js';

describe('RpnStack — applyBinary (FR4/AC2)', () => {
  it('consumes levels 1 and 2 and pushes one result, depth −1', () => {
    const stack = new RpnStack();
    stack.push(3);
    stack.push(4);

    stack.applyBinary((left, right) => left * right);

    expect(stack.depth()).toBe(1);
    expect(stack.peek()).toBe(12);
  });

  it('feeds operands in RPN order: level2 = left, level1 = right', () => {
    // Subtraction is the canonical non-commutative check: 10 then 3 → 10 − 3.
    const stack = new RpnStack();
    stack.push(10);
    stack.push(3);
    stack.applyBinary((left, right) => left - right);
    expect(stack.peek()).toBe(7);
  });

  it('division uses level2 ÷ level1', () => {
    const stack = new RpnStack();
    stack.push(20);
    stack.push(4);
    stack.applyBinary((left, right) => left / right);
    expect(stack.peek()).toBe(5);
  });

  it('power uses level2 ^ level1', () => {
    const stack = new RpnStack();
    stack.push(2);
    stack.push(10);
    stack.applyBinary((left, right) => left ** right);
    expect(stack.peek()).toBe(1024);
  });

  it('only consumes the top two levels, leaving deeper entries intact', () => {
    const stack = new RpnStack();
    stack.push(1);
    stack.push(2);
    stack.push(3); // level 1
    stack.applyBinary((left, right) => left + right); // 2 + 3
    expect(stack.depth()).toBe(2);
    expect(stack.peekN(2)).toEqual([5, 1]);
  });

  it('pushes back exactly whatever the function returns (no math of its own)', () => {
    const stack = new RpnStack();
    stack.push(99);
    stack.push(99);
    // A function returning a raw double the core must store verbatim (AC8):
    stack.applyBinary(() => 0.1 + 0.2);
    expect(stack.peek()).toBe(0.1 + 0.2);
  });
});

describe('RpnStack — applyUnary (FR3/AC3)', () => {
  it('consumes level 1 and pushes one result, depth unchanged', () => {
    const stack = new RpnStack();
    stack.push(9);
    stack.applyUnary((a) => Math.sqrt(a));
    expect(stack.depth()).toBe(1);
    expect(stack.peek()).toBe(3);
  });

  it('replaces only level 1, leaving deeper entries intact', () => {
    const stack = new RpnStack();
    stack.push(7);
    stack.push(5); // level 1
    stack.applyUnary((a) => -a);
    expect(stack.depth()).toBe(2);
    expect(stack.peekN(2)).toEqual([-5, 7]);
  });

  it('pushes back exactly whatever the function returns', () => {
    const stack = new RpnStack();
    stack.push(1);
    stack.applyUnary(() => 1 / 3);
    expect(stack.peek()).toBe(1 / 3);
  });
});

describe('RpnStack — atomic non-destructive underflow (FR8/AC6)', () => {
  it('applyUnary on empty stack throws and leaves it empty, consuming nothing', () => {
    const stack = new RpnStack();
    expect(() => stack.applyUnary((a) => a + 1)).toThrow(StackUnderflowError);
    expect(() => stack.applyUnary((a) => a + 1)).toThrow(
      'Error: Stack underflow',
    );
    expect(stack.depth()).toBe(0);
  });

  it('applyBinary on empty stack throws and leaves it empty', () => {
    const stack = new RpnStack();
    expect(() => stack.applyBinary((l, r) => l + r)).toThrow(
      StackUnderflowError,
    );
    expect(stack.depth()).toBe(0);
  });

  it('applyBinary on depth 1 throws and leaves the stack identical', () => {
    const stack = new RpnStack();
    stack.push(42);
    const before = stack.peekN(1);

    expect(() => stack.applyBinary((l, r) => l + r)).toThrow(
      StackUnderflowError,
    );
    // Depth and the single level value are unchanged: no operand consumed,
    // nothing invented, no partial application.
    expect(stack.depth()).toBe(1);
    expect(stack.peekN(1)).toEqual(before);
  });

  it('the operator function is never invoked when depth is insufficient', () => {
    const stack = new RpnStack();
    stack.push(5);
    let called = false;
    const spy = (l: number, r: number): number => {
      called = true;
      return l + r;
    };
    expect(() => stack.applyBinary(spy)).toThrow(StackUnderflowError);
    expect(called).toBe(false);
  });

  it('5 ENTER × → underflow, not 25; the lone operand survives (AC5)', () => {
    // Models `5 ENTER ×` with nothing else on the stack: push(5) commits the
    // pending entry, then a binary op needs two operands and finds one.
    const stack = new RpnStack();
    stack.push(5);
    expect(() => stack.applyBinary((left, right) => left * right)).toThrow(
      StackUnderflowError,
    );
    expect(stack.depth()).toBe(1);
    expect(stack.peek()).toBe(5); // not 25, and not lost
  });
});
