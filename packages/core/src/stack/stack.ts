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
// This file carries the read/write foundation — `push`, `pop`, `peek`, `peekN`,
// `depth` — plus the operator-application semantics `applyUnary`/`applyBinary`
// (CALC-F03; FR3/FR4/FR8) that consume operands and push results. The management
// ops (dup/swap/drop) land in a later F03 work item on top of this surface.
//
// Operator application is deliberately decoupled from the Calculation Engine
// Core (F02): the apply methods take a plain numeric function and push back
// *whatever value it returns*. They govern only arity, RPN operand order, and
// atomic non-destructive underflow — never the math itself nor domain-error
// surfacing, which stay the engine's contract. Each apply validates the
// required depth *before* any mutation and reads operands before invoking the
// supplied function, so an underflow (or a throwing function) leaves the stack
// byte-for-byte unchanged (FR8/AC6).

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

  /**
   * Apply a unary operator (FR3/AC3). Reads level 1, calls `fn` with it, and
   * replaces level 1 with the single result. Net depth change: 0.
   *
   * The core applies whatever value `fn` returns and computes no math itself
   * (that is the Calculation Engine Core, F02); RPN order is trivial for arity
   * one. The level-1 read happens before any mutation and the result replaces
   * the operand in place, so a `fn` that throws leaves the stack unchanged.
   *
   * @throws {StackUnderflowError} when the stack is empty (depth 0). The depth
   *   check runs before any mutation, so the stack is unchanged on throw.
   */
  applyUnary(fn: (a: number) => number): void {
    const a = this.peek(); // throws StackUnderflowError if empty, no mutation
    const result = fn(a); // if this throws, nothing has mutated yet
    this.entries[this.entries.length - 1] = numberValue(result);
  }

  /**
   * Apply a binary operator (FR4/AC2). Reads level 2 (left operand) and level 1
   * (right operand), calls `fn(left, right)`, and pushes the single result in
   * their place. Net depth change: −1.
   *
   * RPN operand order is `fn(level2, level1)` so non-commutative operators are
   * correct — e.g. subtraction is `level2 − level1` and division `level2 ÷
   * level1`. As with {@link applyUnary}, the core pushes back whatever `fn`
   * returns and computes no math itself (F02 owns that and any domain errors).
   *
   * Atomicity: depth is validated and both operands are read before any
   * mutation, so an underflow (depth < 2) — or a `fn` that throws — leaves the
   * stack byte-for-byte unchanged (FR8/AC6). This is why `5 ENTER ×` modelled as
   * `push(5)` then `applyBinary` underflows rather than yielding 25: a binary op
   * needs two operands and the lone `5` is left untouched (AC5).
   *
   * @throws {StackUnderflowError} when depth < 2.
   */
  applyBinary(fn: (left: number, right: number) => number): void {
    if (this.entries.length < 2) {
      throw new StackUnderflowError();
    }
    const right = this.entries[this.entries.length - 1].value; // level 1
    const left = this.entries[this.entries.length - 2].value; // level 2
    const result = fn(left, right); // if this throws, nothing has mutated yet
    this.entries.pop();
    this.entries[this.entries.length - 1] = numberValue(result);
  }
}
