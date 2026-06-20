// Tests for the dynamic RPN stack read/write core (CALC-F03).
//
// Covers the read/storage portions of the feature's acceptance criteria:
// AC1 (depth-N push, no loss), AC4 (DUP/SWAP/DROP), AC6 (non-destructive
// underflow), AC7 (non-mutating reads), AC8 (raw-double fidelity), AC9 (UI-free
// use), AC10 (no fixed ceiling / no classic-stack behavior). Operator
// application (applyUnary/applyBinary) is covered in apply.test.ts.

import { describe, expect, it } from 'vitest';

import { RpnStack } from './stack.js';
import { StackUnderflowError } from './errors.js';

describe('RpnStack — push & depth (FR1/FR2/AC1)', () => {
  it('starts empty', () => {
    expect(new RpnStack().depth()).toBe(0);
  });

  it('push makes the value level 1 and grows depth by one', () => {
    const stack = new RpnStack();
    stack.push(3);
    expect(stack.depth()).toBe(1);
    expect(stack.peek()).toBe(3);

    stack.push(4);
    expect(stack.depth()).toBe(2);
    // Most-recent push is level 1; the earlier entry shifted up to level 2.
    expect(stack.peekN(2)).toEqual([4, 3]);
  });

  it('retains every entry pushed, in level order, with no silent loss', () => {
    const stack = new RpnStack();
    const n = 10_000;
    for (let i = 0; i < n; i++) stack.push(i);

    expect(stack.depth()).toBe(n);
    // Level 1 is the last pushed; level n is the first pushed.
    expect(stack.peek()).toBe(n - 1);
    expect(stack.peekN(3)).toEqual([n - 1, n - 2, n - 3]);
    // Drain it and confirm strict LIFO order with nothing dropped.
    for (let i = n - 1; i >= 0; i--) expect(stack.pop()).toBe(i);
    expect(stack.depth()).toBe(0);
  });
});

describe('RpnStack — no fixed ceiling (AC10/FR2)', () => {
  it('accepts far more than any classic 4-level register set', () => {
    const stack = new RpnStack();
    const n = 100_000;
    for (let i = 0; i < n; i++) stack.push(i);
    expect(stack.depth()).toBe(n);
    // The earliest entry is still present at the bottom — no T-register loss.
    expect(stack.peekN(n)[n - 1]).toBe(0);
  });
});

describe('RpnStack — pop (FR9)', () => {
  it('removes level 1 and shifts higher levels down', () => {
    const stack = new RpnStack();
    stack.push(1);
    stack.push(2);
    stack.push(3);

    expect(stack.pop()).toBe(3);
    expect(stack.depth()).toBe(2);
    expect(stack.peek()).toBe(2);
  });
});

describe('RpnStack — non-mutating reads (AC7)', () => {
  it('peek does not change depth or order', () => {
    const stack = new RpnStack();
    stack.push(1);
    stack.push(2);

    expect(stack.peek()).toBe(2);
    expect(stack.peek()).toBe(2); // repeatable
    expect(stack.depth()).toBe(2);
  });

  it('peekN does not change depth or order', () => {
    const stack = new RpnStack();
    stack.push(1);
    stack.push(2);
    stack.push(3);

    expect(stack.peekN(2)).toEqual([3, 2]);
    expect(stack.peekN(2)).toEqual([3, 2]); // repeatable, no mutation
    expect(stack.depth()).toBe(3);
    expect(stack.peekN(3)).toEqual([3, 2, 1]);
  });

  it('peekN(0) is the empty array and peekN(depth) is the whole stack', () => {
    const stack = new RpnStack();
    stack.push(10);
    stack.push(20);

    expect(stack.peekN(0)).toEqual([]);
    expect(stack.peekN(2)).toEqual([20, 10]);
  });

  it('returned arrays are detached — mutating them does not affect the stack', () => {
    const stack = new RpnStack();
    stack.push(5);
    const view = stack.peekN(1);
    view[0] = 999;
    expect(stack.peek()).toBe(5);
  });
});

describe('RpnStack — raw IEEE-754 fidelity (AC8/FR10)', () => {
  it('stores and returns doubles bit-for-bit, with no rounding', () => {
    const stack = new RpnStack();
    const values = [0.1 + 0.2, Math.PI, 1 / 3, Number.MAX_VALUE, -0];
    for (const v of values) stack.push(v);

    // Read back in reverse (level 1 first) and compare with Object.is so that
    // -0 is distinguished and no display rounding has crept in.
    const back = stack.peekN(values.length);
    for (let i = 0; i < values.length; i++) {
      expect(Object.is(back[i], values[values.length - 1 - i])).toBe(true);
    }
  });
});

describe('RpnStack — non-destructive read underflow (AC6/FR8)', () => {
  it('pop on an empty stack throws and leaves it empty', () => {
    const stack = new RpnStack();
    expect(() => stack.pop()).toThrow(StackUnderflowError);
    expect(() => stack.pop()).toThrow('Error: Stack underflow');
    expect(stack.depth()).toBe(0);
  });

  it('peek on an empty stack throws and leaves it empty', () => {
    const stack = new RpnStack();
    expect(() => stack.peek()).toThrow(StackUnderflowError);
    expect(stack.depth()).toBe(0);
  });

  it('peekN beyond depth throws and leaves the stack identical', () => {
    const stack = new RpnStack();
    stack.push(1);
    stack.push(2);
    const before = stack.peekN(2);

    expect(() => stack.peekN(3)).toThrow(StackUnderflowError);
    // Depth and every level value are unchanged after the failed read.
    expect(stack.depth()).toBe(2);
    expect(stack.peekN(2)).toEqual(before);
  });

  it('peekN rejects negative / non-integer counts as caller bugs', () => {
    const stack = new RpnStack();
    stack.push(1);
    expect(() => stack.peekN(-1)).toThrow(RangeError);
    expect(() => stack.peekN(1.5)).toThrow(RangeError);
    expect(stack.depth()).toBe(1);
  });
});

describe('RpnStack — DUP (FR6/AC4)', () => {
  it('duplicates level 1: two identical tops and depth +1', () => {
    const stack = new RpnStack();
    stack.push(7);
    stack.push(5);
    stack.dup();

    expect(stack.depth()).toBe(3);
    // Former level 1 (5) is now level 2; an identical 5 occupies level 1.
    expect(stack.peekN(3)).toEqual([5, 5, 7]);
  });

  it('supports duplicate-then-operate (5 DUP × → 25), not ENTER auto-lift', () => {
    const stack = new RpnStack();
    stack.push(5);
    stack.dup(); // explicit duplication — the only way to get two 5s
    stack.applyBinary((left, right) => left * right);

    expect(stack.depth()).toBe(1);
    expect(stack.peek()).toBe(25);
  });
});

describe('RpnStack — SWAP (FR7/AC4)', () => {
  it('exchanges levels 1 and 2, leaving depth and deeper levels unchanged', () => {
    const stack = new RpnStack();
    stack.push(1);
    stack.push(2);
    stack.push(3);
    stack.swap();

    expect(stack.depth()).toBe(3);
    // Levels 1 and 2 (3 and 2) exchanged; level 3 (1) untouched.
    expect(stack.peekN(3)).toEqual([2, 3, 1]);
  });
});

describe('RpnStack — DROP (FR7/AC4)', () => {
  it('discards level 1 and shifts higher levels down, depth −1', () => {
    const stack = new RpnStack();
    stack.push(1);
    stack.push(2);
    stack.push(3);
    stack.drop();

    expect(stack.depth()).toBe(2);
    expect(stack.peekN(2)).toEqual([2, 1]);
  });
});

describe('RpnStack — management-op underflow is non-destructive (FR8/AC6)', () => {
  it('DUP on an empty stack throws and leaves it empty', () => {
    const stack = new RpnStack();
    expect(() => stack.dup()).toThrow(StackUnderflowError);
    expect(() => stack.dup()).toThrow('Error: Stack underflow');
    expect(stack.depth()).toBe(0);
  });

  it('DROP on an empty stack throws and leaves it empty', () => {
    const stack = new RpnStack();
    expect(() => stack.drop()).toThrow(StackUnderflowError);
    expect(stack.depth()).toBe(0);
  });

  it('SWAP at depth 1 throws and leaves the stack byte-for-byte identical', () => {
    const stack = new RpnStack();
    stack.push(42);
    const before = stack.peekN(1);

    expect(() => stack.swap()).toThrow(StackUnderflowError);
    expect(stack.depth()).toBe(1);
    expect(stack.peekN(1)).toEqual(before); // nothing consumed, nothing invented
  });
});

describe('RpnStack — no classic-stack behavior on management ops (AC10)', () => {
  it('DROP does not top-copy or replicate a T-register; emptied levels stay empty', () => {
    const stack = new RpnStack();
    stack.push(8);
    stack.drop();
    // A classic 4-level stack would replicate the top into the emptied level;
    // the dynamic stack simply shrinks to empty.
    expect(stack.depth()).toBe(0);
    expect(() => stack.peek()).toThrow(StackUnderflowError);
  });

  it('DUP copies the value, not a shared reference — peekN returns independent doubles', () => {
    const stack = new RpnStack();
    stack.push(3);
    stack.dup();
    const view = stack.peekN(2);
    view[0] = 999; // mutating the read-back must not disturb either level
    expect(stack.peekN(2)).toEqual([3, 3]);
  });
});

describe('RpnStack — UI-free exercisability (AC9)', () => {
  it('runs a full push/read/pop session with no UI or DOM in sight', () => {
    const stack = new RpnStack();
    stack.push(2);
    stack.push(7);
    expect(stack.depth()).toBe(2);
    expect(stack.peekN(2)).toEqual([7, 2]);
    expect(stack.pop()).toBe(7);
    expect(stack.pop()).toBe(2);
    expect(stack.depth()).toBe(0);
  });
});
