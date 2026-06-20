// Dynamic, unlimited-depth RPN stack — the UI-agnostic core data model
// (CALC-F03, FR1/FR2/FR9/FR10).
//
// This is the HP 50g / RPL-style stack: levels numbered 1, 2, 3… upward, level 1
// being the most recent entry, bounded only by available memory. There is no
// fixed register set, no silent data loss, and no top-register replication —
// pushing simply grows the stack and dropping shrinks it.
//
// Scope: the read/write surface — push, pop, peek, peekN, depth (CALC-F03-W01) —
// plus the operator-application semantics applyUnary/applyBinary (CALC-F03-W02),
// which consume operands and push results with correct arity, RPN operand order,
// and atomic non-destructive underflow. The management ops (dup/swap/drop) arrive
// in a later work item and build on this same base.

import { StackUnderflowError } from './errors.js';
import { numberValue, type StackValue } from './value.js';

export class RpnStack {
  // Internal storage. Index 0 is the BOTTOM of the stack; the last element is
  // level 1 (the top / most recent). Keeping the top at the end makes push and
  // pop O(1) plain array operations while the public API numbers levels from
  // the top. This array is the only mutable state; reads never touch it.
  readonly #levels: StackValue[] = [];

  /** Current number of levels on the stack (DEPTH, FR9). Never negative. */
  depth(): number {
    return this.#levels.length;
  }

  /**
   * Push a numeric operand. It becomes level 1; every existing entry shifts up
   * one level. Depth increases by exactly 1. No entry is ever discarded to make
   * room (FR1/FR2) and the raw IEEE-754 double is stored verbatim (FR10).
   */
  push(value: number): void {
    this.#levels.push(numberValue(value));
  }

  /**
   * Remove and return level 1, shifting higher levels down by one. Depth
   * decreases by 1. Throws {@link StackUnderflowError} non-destructively when
   * the stack is empty — the (empty) stack is left exactly as it was (AC6).
   */
  pop(): number {
    if (this.#levels.length < 1) {
      throw new StackUnderflowError();
    }
    // Length checked above, so pop() cannot return undefined here.
    return this.#levels.pop()!.value;
  }

  /**
   * Read level 1 without mutating the stack (FR9). Throws
   * {@link StackUnderflowError} non-destructively when the stack is empty.
   */
  peek(): number {
    if (this.#levels.length < 1) {
      throw new StackUnderflowError();
    }
    return this.#levels[this.#levels.length - 1].value;
  }

  /**
   * Read the top `n` levels without mutating the stack, level 1 first (FR9).
   * `peekN(0)` returns an empty array. Throws {@link StackUnderflowError}
   * non-destructively when `n` exceeds the current depth (AC6). A negative or
   * non-integer `n` is a caller error and throws {@link RangeError}.
   */
  peekN(n: number): number[] {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(`peekN requires a non-negative integer, got ${n}`);
    }
    if (n > this.#levels.length) {
      throw new StackUnderflowError();
    }
    const top = this.#levels.length - 1;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      out.push(this.#levels[top - i].value);
    }
    return out;
  }

  /**
   * Apply a unary operator (e.g. reciprocal, sign change, sin, ln): consume
   * level 1 and push exactly one result, leaving depth unchanged (FR3/AC3). The
   * engine-supplied `fn` receives the level-1 operand and returns the result;
   * this method governs only arity and consume/push, never the math itself —
   * domain errors are the engine's concern (feature #2).
   *
   * Atomic and non-destructive: depth is validated before any mutation, and the
   * result is computed before the stack is touched, so a depth-0 stack (or an
   * `fn` that throws) leaves the stack exactly as it was (FR8/AC6).
   */
  applyUnary(fn: (a: number) => number): void {
    if (this.#levels.length < 1) {
      throw new StackUnderflowError();
    }
    const top = this.#levels.length - 1;
    const result = fn(this.#levels[top].value);
    // Only mutate once fn has returned, so a throwing fn is also non-destructive.
    this.#levels[top] = numberValue(result);
  }

  /**
   * Apply a binary operator (e.g. +, −, ×, ÷, power, root): consume levels 1 and
   * 2 and push exactly one result, so depth decreases by 1 (FR4/AC2). Operand
   * order follows RPN convention — `fn(level2, level1)`, i.e. level 2 is the left
   * operand and level 1 the right — so `level2 − level1`, `level2 ÷ level1`, and
   * `level2 ^ level1` come out correct. As with {@link applyUnary}, this governs
   * only arity and consume/push; the math and any domain errors are the engine's.
   *
   * Atomic and non-destructive: depth is validated and the result computed before
   * either operand is popped, so a depth < 2 stack (or a throwing `fn`) is left
   * byte-for-byte unchanged (FR8/AC6).
   */
  applyBinary(fn: (left: number, right: number) => number): void {
    if (this.#levels.length < 2) {
      throw new StackUnderflowError();
    }
    const top = this.#levels.length - 1;
    const left = this.#levels[top - 1].value; // level 2 — left operand
    const right = this.#levels[top].value; // level 1 — right operand
    const result = fn(left, right);
    // Compute first, then consume the two operands and push the single result.
    this.#levels.pop();
    this.#levels.pop();
    this.#levels.push(numberValue(result));
  }
}
