// Dynamic, unlimited-depth RPN stack — the UI-agnostic core data model
// (CALC-F03, FR1/FR2/FR9/FR10).
//
// This is the HP 50g / RPL-style stack: levels numbered 1, 2, 3… upward, level 1
// being the most recent entry, bounded only by available memory. There is no
// fixed register set, no silent data loss, and no top-register replication —
// pushing simply grows the stack and dropping shrinks it.
//
// Scope (CALC-F03-W01): the read/write surface — push, pop, peek, peekN, depth.
// CALC-F03-W03 adds the stack-management ops dup/swap/drop. Operator application
// (applyUnary/applyBinary) arrives in a later work item and builds on this base.
//
// ENTER vs. DUP (FR5/AC5/AC10): ENTER is digit-entry termination — it commits the
// operand currently being typed as a new level-1 entry, which at the core layer
// is simply `push` of that operand (the pending-entry buffer is a UI / feature #4
// concern, not the core's). ENTER performs NO auto-lift and NO duplication: there
// is deliberately no classic stack-lift-on-ENTER and no top-copy. Duplication is a
// separate, explicit action, performed only via `dup` below. So `5 ENTER ×` does
// not yield 25 — with a single operand a binary op underflows; the stack model
// keeps ENTER (push) and DUP strictly distinct.

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
   * DUP — duplicate level 1 (FR6). The former level 1 becomes level 2 and an
   * identical value occupies level 1; depth increases by exactly 1. Requires
   * depth ≥ 1; otherwise throws {@link StackUnderflowError} non-destructively,
   * leaving the stack exactly as it was (FR8/AC6). This is the only way to
   * duplicate — ENTER never does (see the ENTER vs. DUP note above).
   */
  dup(): void {
    if (this.#levels.length < 1) {
      throw new StackUnderflowError();
    }
    // StackValue is deeply immutable, so sharing the reference is safe and stays
    // value-type-agnostic (FR11) — no `number`-only assumption here.
    this.#levels.push(this.#levels[this.#levels.length - 1]);
  }

  /**
   * SWAP — exchange the values at levels 1 and 2 (FR7). Depth is unchanged.
   * Requires depth ≥ 2; otherwise throws {@link StackUnderflowError}
   * non-destructively, leaving the stack exactly as it was (FR8/AC6).
   */
  swap(): void {
    if (this.#levels.length < 2) {
      throw new StackUnderflowError();
    }
    const top = this.#levels.length - 1;
    const tmp = this.#levels[top];
    this.#levels[top] = this.#levels[top - 1];
    this.#levels[top - 1] = tmp;
  }

  /**
   * DROP — discard level 1, shifting every higher level down by one (FR7).
   * Depth decreases by exactly 1. Requires depth ≥ 1; otherwise throws
   * {@link StackUnderflowError} non-destructively, leaving the stack exactly as
   * it was (FR8/AC6). Unlike a classic fixed stack, nothing is copied into the
   * emptied level — no T-register replication (AC10).
   */
  drop(): void {
    if (this.#levels.length < 1) {
      throw new StackUnderflowError();
    }
    this.#levels.pop();
  }
}
