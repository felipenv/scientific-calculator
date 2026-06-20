// Tests for the dynamic RPN stack read/write surface (CALC-F03).
//
// Covers the storage/read acceptance criteria for this work item: AC1 (depth-N
// push / no loss), AC6 (non-destructive read underflow), AC7 (non-mutating
// reads), AC8 (raw-double fidelity), AC9 (UI-free exercisability — these tests
// run in plain Node), and AC10 (no fixed ceiling).

import { describe, expect, it } from 'vitest';

import { RpnStack } from './stack.js';
import { StackUnderflowError } from './errors.js';

describe('RpnStack — push / depth / no loss (AC1, FR1/FR2)', () => {
  it('starts empty', () => {
    expect(new RpnStack().depth()).toBe(0);
  });

  it('pushing N operands yields depth N with most-recent at level 1', () => {
    const s = new RpnStack();
    for (let i = 1; i <= 5; i++) s.push(i);
    expect(s.depth()).toBe(5);
    expect(s.peek()).toBe(5); // last pushed is level 1
    // peekN reports the whole stack, level 1 first, with nothing dropped.
    expect(s.peekN(5)).toEqual([5, 4, 3, 2, 1]);
  });

  it('each push shifts existing entries up by one level (no replication)', () => {
    const s = new RpnStack();
    s.push(10);
    expect(s.peekN(1)).toEqual([10]);
    s.push(20);
    expect(s.peekN(2)).toEqual([20, 10]);
  });
});

describe('RpnStack — no fixed ceiling (AC10)', () => {
  it('grows to a large depth without silent loss', () => {
    const s = new RpnStack();
    const n = 10_000;
    for (let i = 0; i < n; i++) s.push(i);
    expect(s.depth()).toBe(n);
    // First and last entries both survive — nothing was dropped to make room.
    expect(s.peek()).toBe(n - 1);
    expect(s.peekN(n)[n - 1]).toBe(0);
  });
});

describe('RpnStack — pop semantics (FR9)', () => {
  it('removes and returns level 1, shifting higher levels down', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    expect(s.pop()).toBe(2);
    expect(s.depth()).toBe(1);
    expect(s.peek()).toBe(1);
  });
});

describe('RpnStack — raw-double fidelity (AC8, FR10)', () => {
  it('stores and returns values bit-for-bit, no rounding at the stack layer', () => {
    const s = new RpnStack();
    const values = [
      0.1 + 0.2, // 0.30000000000000004
      Math.PI,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      -0,
      1 / 3,
    ];
    for (const v of values) s.push(v);
    // peekN preserves order (level 1 first) and exact bits.
    expect(s.peekN(values.length)).toEqual([...values].reverse());
    expect(s.peek()).toBe(1 / 3);
  });

  it('round-trips a value through pop unchanged', () => {
    const s = new RpnStack();
    s.push(0.1 + 0.2);
    expect(s.pop()).toBe(0.30000000000000004);
  });
});

describe('RpnStack — non-mutating reads (AC7)', () => {
  it('peek does not change the stack', () => {
    const s = new RpnStack();
    s.push(7);
    s.push(8);
    const before = s.peekN(s.depth());
    expect(s.peek()).toBe(8);
    expect(s.depth()).toBe(2);
    expect(s.peekN(s.depth())).toEqual(before);
  });

  it('peekN does not change the stack and returns a fresh array', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    s.push(3);
    const view = s.peekN(2);
    expect(view).toEqual([3, 2]);
    // Mutating the returned array must not affect the stack.
    view.push(999);
    expect(s.depth()).toBe(3);
    expect(s.peekN(3)).toEqual([3, 2, 1]);
  });

  it('peekN(0) returns an empty array and reads nothing', () => {
    const s = new RpnStack();
    s.push(1);
    expect(s.peekN(0)).toEqual([]);
    expect(s.depth()).toBe(1);
  });
});

describe('RpnStack — non-destructive read underflow (AC6, FR8)', () => {
  it('pop on an empty stack throws and leaves it empty', () => {
    const s = new RpnStack();
    expect(() => s.pop()).toThrow(StackUnderflowError);
    expect(() => s.pop()).toThrow('Error: Stack underflow');
    expect(s.depth()).toBe(0);
  });

  it('peek on an empty stack throws and leaves it empty', () => {
    const s = new RpnStack();
    expect(() => s.peek()).toThrow(StackUnderflowError);
    expect(s.depth()).toBe(0);
  });

  it('peekN beyond depth throws and leaves the stack unchanged', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    expect(() => s.peekN(3)).toThrow(StackUnderflowError);
    // Stack identical to its pre-call state.
    expect(s.depth()).toBe(2);
    expect(s.peekN(2)).toEqual([2, 1]);
  });

  it('rejects a negative or non-integer count with a RangeError', () => {
    const s = new RpnStack();
    s.push(1);
    expect(() => s.peekN(-1)).toThrow(RangeError);
    expect(() => s.peekN(1.5)).toThrow(RangeError);
    expect(s.depth()).toBe(1);
  });
});

describe('RpnStack — UI-free exercisability (AC9)', () => {
  it('drives a full push/read/pop session with no UI dependency', () => {
    // The entire surface is reachable from a plain (non-UI) caller; this test
    // running in the Node environment IS the demonstration.
    const s = new RpnStack();
    s.push(3);
    s.push(4);
    expect(s.depth()).toBe(2);
    expect(s.peekN(2)).toEqual([4, 3]);
    expect(s.pop()).toBe(4);
    expect(s.pop()).toBe(3);
    expect(s.depth()).toBe(0);
  });
});
