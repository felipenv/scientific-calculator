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

describe('RpnStack — DUP (AC4, FR6)', () => {
  it('duplicates level 1: two identical tops and depth +1', () => {
    const s = new RpnStack();
    s.push(5);
    s.dup();
    expect(s.depth()).toBe(2);
    // Former level 1 is now level 2; an identical value occupies level 1.
    expect(s.peekN(2)).toEqual([5, 5]);
  });

  it('duplicates the top only, leaving lower levels untouched', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    s.dup();
    expect(s.peekN(3)).toEqual([2, 2, 1]);
  });

  it('5 DUP × demonstrates duplication is via DUP, not ENTER (AC5)', () => {
    // The user duplicates explicitly, then a binary op can square the value.
    // (The × itself lands with applyBinary in a later work item; here we show
    // DUP produces the two operands a square needs.)
    const s = new RpnStack();
    s.push(5);
    s.dup();
    expect(s.peekN(2)).toEqual([5, 5]);
  });
});

describe('RpnStack — SWAP (AC4, FR7)', () => {
  it('exchanges the top two values, depth unchanged', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    s.swap();
    expect(s.depth()).toBe(2);
    expect(s.peekN(2)).toEqual([1, 2]);
  });

  it('leaves levels below the top two untouched', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    s.push(3);
    s.swap();
    expect(s.peekN(3)).toEqual([2, 3, 1]);
  });
});

describe('RpnStack — DROP (AC4, FR7)', () => {
  it('removes level 1 and decreases depth by 1', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    s.drop();
    expect(s.depth()).toBe(1);
    expect(s.peek()).toBe(1);
  });

  it('shifts higher levels down by one', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    s.push(3);
    s.drop();
    expect(s.peekN(2)).toEqual([2, 1]);
  });
});

describe('RpnStack — management-op underflow is non-destructive (AC6, FR8)', () => {
  it('DUP on an empty stack throws and leaves it empty', () => {
    const s = new RpnStack();
    expect(() => s.dup()).toThrow(StackUnderflowError);
    expect(() => s.dup()).toThrow('Error: Stack underflow');
    expect(s.depth()).toBe(0);
  });

  it('DROP on an empty stack throws and leaves it empty', () => {
    const s = new RpnStack();
    expect(() => s.drop()).toThrow(StackUnderflowError);
    expect(() => s.drop()).toThrow('Error: Stack underflow');
    expect(s.depth()).toBe(0);
  });

  it('SWAP at depth 1 throws and leaves the stack exactly as it was', () => {
    const s = new RpnStack();
    s.push(42);
    const before = s.peekN(s.depth());
    expect(() => s.swap()).toThrow(StackUnderflowError);
    // Stack identical to its pre-call state: depth and all level values.
    expect(s.depth()).toBe(1);
    expect(s.peekN(s.depth())).toEqual(before);
  });

  it('SWAP on an empty stack throws and leaves it empty', () => {
    const s = new RpnStack();
    expect(() => s.swap()).toThrow(StackUnderflowError);
    expect(s.depth()).toBe(0);
  });
});

describe('RpnStack — no classic-stack behavior in management ops (AC10)', () => {
  it('DROP does not replicate a register into the emptied level (no T-register)', () => {
    const s = new RpnStack();
    s.push(1);
    s.push(2);
    s.drop();
    // The single remaining entry is the original level 2; nothing was copied
    // down to fill the vacated top.
    expect(s.depth()).toBe(1);
    expect(s.peekN(1)).toEqual([1]);
  });

  it('DUP copies only on explicit request — there is no auto-lift', () => {
    // Pushing never duplicates (that would be classic stack-lift); only an
    // explicit dup() does. push then push yields two distinct values, not a copy.
    const s = new RpnStack();
    s.push(7);
    s.push(8);
    expect(s.peekN(2)).toEqual([8, 7]);
    // And dup() is what produces an identical pair.
    s.dup();
    expect(s.peekN(3)).toEqual([8, 8, 7]);
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
