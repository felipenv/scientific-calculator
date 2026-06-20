// Tests for the operator-application semantics on the RPN stack (CALC-F03-W02).
//
// Covers the evaluation acceptance criteria for this work item: AC2 (binary
// consume/push + depth −1), AC3 (unary depth-unchanged), AC6 (non-destructive
// underflow with full before/after state equality), AC5 (binary portion:
// `5 ENTER ×` → underflow, not 25), and the RPN operand order for the classic
// non-commutative operators (subtraction, division, power). These exercise the
// behaviour with no UI dependency (AC9) — running in plain Node is the proof.

import { describe, expect, it, vi } from 'vitest';

import { RpnStack } from './stack.js';
import { StackUnderflowError } from './errors.js';

// Snapshot a stack's full observable state (depth + every level, level 1 first)
// so a failed operation can be asserted byte-for-byte unchanged.
function snapshot(s: RpnStack): number[] {
  return s.peekN(s.depth());
}

describe('applyUnary — consume 1 / push 1 (AC3, FR3)', () => {
  it('replaces level 1 with the result and leaves depth unchanged', () => {
    const s = new RpnStack();
    s.push(3);
    s.push(9);
    s.applyUnary((a) => Math.sqrt(a));
    expect(s.depth()).toBe(2);
    expect(s.peekN(2)).toEqual([3, 3]); // level 1 became √9; level 2 untouched
  });

  it('passes exactly the level-1 operand to the engine function', () => {
    const s = new RpnStack();
    s.push(42);
    const fn = vi.fn((a: number) => -a);
    s.applyUnary(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(42);
    expect(s.peek()).toBe(-42);
  });

  it('pushes whatever the engine returns, applying no math of its own', () => {
    const s = new RpnStack();
    s.push(2);
    // The stack does not interpret the value — it stores the raw double returned.
    s.applyUnary(() => 0.1 + 0.2);
    expect(s.peek()).toBe(0.30000000000000004);
  });
});

describe('applyBinary — consume 2 / push 1, depth −1 (AC2, FR4)', () => {
  it('consumes levels 1 and 2 and pushes one result; depth drops by exactly 1', () => {
    const s = new RpnStack();
    s.push(3);
    s.push(4);
    s.applyBinary((left, right) => left * right);
    expect(s.depth()).toBe(1);
    expect(s.peek()).toBe(12);
  });

  it('leaves deeper levels untouched below the result', () => {
    const s = new RpnStack();
    s.push(100);
    s.push(3);
    s.push(4);
    s.applyBinary((left, right) => left + right);
    expect(s.depth()).toBe(2);
    expect(s.peekN(2)).toEqual([7, 100]); // 3+4 on top, 100 preserved at level 2
  });
});

describe('applyBinary — RPN operand order: fn(level2, level1)', () => {
  it('subtraction is level2 − level1', () => {
    const s = new RpnStack();
    s.push(10); // level 2 (left)
    s.push(3); // level 1 (right)
    s.applyBinary((left, right) => left - right);
    expect(s.peek()).toBe(7); // 10 − 3, not 3 − 10
  });

  it('division is level2 ÷ level1', () => {
    const s = new RpnStack();
    s.push(20); // level 2 (left)
    s.push(4); // level 1 (right)
    s.applyBinary((left, right) => left / right);
    expect(s.peek()).toBe(5); // 20 / 4, not 4 / 20
  });

  it('power is level2 ^ level1', () => {
    const s = new RpnStack();
    s.push(2); // level 2 (base / left)
    s.push(10); // level 1 (exponent / right)
    s.applyBinary((left, right) => left ** right);
    expect(s.peek()).toBe(1024); // 2 ^ 10, not 10 ^ 2 (=100)
  });

  it('receives operands as (level2, left) then (level1, right)', () => {
    const s = new RpnStack();
    s.push(7); // level 2
    s.push(2); // level 1
    const fn = vi.fn((left: number, right: number) => left - right);
    s.applyBinary(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(7, 2);
  });
});

describe('apply — non-destructive underflow (AC6, FR8)', () => {
  it('applyUnary on an empty stack throws and changes nothing', () => {
    const s = new RpnStack();
    expect(() => s.applyUnary((a) => a)).toThrow(StackUnderflowError);
    expect(() => s.applyUnary((a) => a)).toThrow('Error: Stack underflow');
    expect(s.depth()).toBe(0);
  });

  it('applyBinary on depth 0 throws and changes nothing', () => {
    const s = new RpnStack();
    expect(() => s.applyBinary((l, r) => l + r)).toThrow(StackUnderflowError);
    expect(s.depth()).toBe(0);
  });

  it('applyBinary on depth 1 throws; stack identical before and after', () => {
    const s = new RpnStack();
    s.push(5);
    const before = snapshot(s);
    expect(() => s.applyBinary((l, r) => l + r)).toThrow(StackUnderflowError);
    // No operand consumed, nothing invented, no partial application.
    expect(s.depth()).toBe(1);
    expect(snapshot(s)).toEqual(before);
    expect(snapshot(s)).toEqual([5]);
  });

  it('does not invoke the engine function on underflow (no math attempted)', () => {
    const s = new RpnStack();
    s.push(5);
    const fn = vi.fn((l: number, r: number) => l + r);
    expect(() => s.applyBinary(fn)).toThrow(StackUnderflowError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('a throwing engine function leaves the stack unchanged too', () => {
    // Domain errors belong to the engine (feature #2), but the apply path must
    // still not consume operands when fn throws.
    const s = new RpnStack();
    s.push(6);
    s.push(2);
    const before = snapshot(s);
    expect(() =>
      s.applyBinary(() => {
        throw new Error('domain error');
      }),
    ).toThrow('domain error');
    expect(s.depth()).toBe(2);
    expect(snapshot(s)).toEqual(before);
  });
});

describe('apply — `5 ENTER ×` is underflow, not 25 (AC5, binary portion)', () => {
  it('push(5) then a binary op on depth 1 underflows and leaves [5]', () => {
    // ENTER commits the typed operand (modeled as push(5)); it does NOT auto-lift
    // or duplicate. A binary × then needs two operands but finds one → underflow.
    // Contrast classic machines where `5 ENTER ×` yields 25; v0 deliberately does
    // not, and the stack is left exactly as it was.
    const s = new RpnStack();
    s.push(5);
    expect(() => s.applyBinary((left, right) => left * right)).toThrow(
      StackUnderflowError,
    );
    expect(s.depth()).toBe(1);
    expect(s.peekN(1)).toEqual([5]);
  });
});
