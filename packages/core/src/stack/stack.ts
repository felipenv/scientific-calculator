// The dynamic RPN stack (CALC-F03; FR1/FR2/FR9/FR10).
//
// An HP 50g / RPL-style stack: levels numbered 1..N from the top, growing upward
// with no fixed ceiling (bounded only by available memory), no silent loss of
// entries, and no register replication. Level 1 is the most-recent entry;
// pushing shifts every existing entry up one level.
//
// Storage note: entries live in a plain array with the *top of the stack at the
// end*, so push/pop/peek are O(1) and "shift up by one level" is the natural
// array append rather than a physical reindex. Level numbering (1 = top) is a
// read-time view over that array, computed by the read methods below. Entries
// are wrapped as `StackValue` (the FR11 typed-value seam) but the public surface
// speaks raw `number` (FR10/AC8).
//
// This is the read/write foundation only: `push`, `pop`, `peek`, `peekN`,
// `depth`. Operator application (applyUnary/applyBinary) and the management ops
// (dup/swap/drop) land in later F03 work items on top of this surface.

import type { StackValue } from './value.js';
import { numberValue } from './value.js';
import { StackUnderflowError } from './errors.js';

/**
 * A dynamic, unlimited-depth RPN stack of IEEE-754 doubles. Construct one per
 * calculator session; all reads are non-mutating and every consuming op that
 * lacks operands throws {@link StackUnderflowError} without altering the stack.
 */
export class RpnStack {
  // Invariant: top of stack === last element. Holds StackValue (the FR11 seam);
  // the public API converts to/from raw `number`.
  private readonly entries: StackValue[] = [];

  /** The current number of levels on the stack (DEPTH, FR9). Never mutates. */
  depth(): number {
    return this.entries.length;
  }

  /**
   * Push a numeric operand (FR1). It becomes level 1; every existing entry
   * shifts up one level. Stored as a raw IEEE-754 double with no rounding
   * (FR10/AC8). The stack grows without a fixed ceiling (FR2/AC10).
   */
  push(v: number): void {
    this.entries.push(numberValue(v));
  }

  /**
   * Remove and return level 1, shifting higher levels down one level.
   *
   * @throws {StackUnderflowError} when the stack is empty. Non-destructive: the
   *   depth check runs before any mutation, so the stack is unchanged on throw.
   */
  pop(): number {
    const value = this.peek(); // throws StackUnderflowError if empty, no mutation
    this.entries.pop();
    return value;
  }

  /**
   * Return level 1 without removing it (FR9).
   *
   * @throws {StackUnderflowError} when the stack is empty.
   */
  peek(): number {
    if (this.entries.length < 1) {
      throw new StackUnderflowError();
    }
    return this.entries[this.entries.length - 1].value;
  }

  /**
   * Return the top `n` levels as raw doubles, level 1 first, without mutating
   * the stack (FR9/AC7). `peekN(0)` is `[]`; the display reads as many levels as
   * it needs (no fixed display window is baked into the core).
   *
   * @throws {StackUnderflowError} when `n` exceeds the current depth — requesting
   *   levels that are not present is an underflow, surfaced non-destructively.
   * @throws {RangeError} when `n` is negative or not an integer (a caller bug,
   *   not a stack-state condition).
   */
  peekN(n: number): number[] {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(`peekN expects a non-negative integer, got ${n}`);
    }
    if (n > this.entries.length) {
      throw new StackUnderflowError();
    }
    const top: number[] = [];
    for (let i = 0; i < n; i++) {
      top.push(this.entries[this.entries.length - 1 - i].value);
    }
    return top;
  }
}
