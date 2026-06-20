// The v0 stub calculator core (CALC-F04): a runnable {@link CalculatorCore} that
// makes the UI buildable and testable now.
//
// It is a *command façade*, not a second math engine. All arithmetic, the
// scientific function set, angle-mode-aware trig, and the dynamic RPN stack come
// from `@calc/core` (the F02 operator engine + F03 stack); this class only owns
// what the spec assigns to the UI layer — the in-progress entry buffer, the
// shift layer, the transient error, and the stack-lift rules that tie keystrokes
// to core operations. Delegating keeps a single source of numeric truth and
// inherits the core's "never leak NaN/Infinity" guard, so no operation ever
// places a non-finite value on the stack (FR19/AC).
//
// Carried assumptions (documented here, to be confirmed against the RPN model):
//   • Default angle mode is DEG (Degrees) — `@calc/core`'s own default.
//   • `⌫` (backspace) on an empty entry line is a no-op, not a stack DROP.
//   • `ENTER` with no entry in progress is a no-op (it does not duplicate; DUP
//     is the explicit duplication path, per the core's ENTER/DUP distinction).

import {
  CalcCore,
  RpnStack,
  StackUnderflowError,
  PI,
  E,
  AngleMode,
} from '@calc/core';

import type {
  BinaryOp,
  CalcState,
  CalculatorCore,
  Command,
  ConstantName,
  StackOp,
  UnaryOp,
} from './contract.js';
import { calcError, fromErrorKind, type CalcError } from './errors.js';

/** Construction options for a {@link StubCalculatorCore}. */
export interface StubCalculatorCoreOptions {
  /** Initial angle mode (default: the core's default, i.e. Degrees / DEG). */
  readonly angleMode?: AngleMode;
}

/**
 * A runnable {@link CalculatorCore} over an unbounded RPN stack. Construct one
 * per calculator session; every `apply` returns a fresh, immutable snapshot.
 */
export class StubCalculatorCore implements CalculatorCore {
  private readonly stack = new RpnStack();
  private readonly core: CalcCore;
  private entry = '';
  private shift = false;
  private lastError: CalcError | null = null;

  constructor(options: StubCalculatorCoreOptions = {}) {
    this.core = new CalcCore({ angleMode: options.angleMode });
  }

  /** The current state without applying a command. */
  get state(): CalcState {
    return this.snapshot();
  }

  /**
   * Process one semantic command and return the resulting state.
   *
   * Every command except `toggleShift` first clears any prior error (so the
   * keypress dismisses it, FR20) and consumes the one-shot shift layer (FR3),
   * then runs. Errors raised while running are recorded in `lastError` and the
   * stack/entry are left untouched (FR19).
   */
  apply(command: Command): CalcState {
    if (command.kind === 'toggleShift') {
      this.lastError = null;
      this.shift = !this.shift;
      return this.snapshot();
    }

    this.lastError = null;
    this.shift = false;
    this.process(command);
    return this.snapshot();
  }

  /** Dispatch a (non-`toggleShift`) command to its handler. */
  private process(command: Command): void {
    switch (command.kind) {
      case 'digit':
        this.entry += String(command.digit);
        return;
      case 'decimal':
        this.appendDecimal();
        return;
      case 'backspace':
        // ⌫-on-empty is a no-op (carried assumption).
        if (this.entry !== '') this.entry = this.entry.slice(0, -1);
        return;
      case 'clearEntry':
        this.entry = '';
        return;
      case 'chs':
        this.changeSign();
        return;
      case 'enter':
        // ENTER terminates an in-progress entry; on an empty line it is a no-op
        // (carried assumption — DUP is the explicit duplication path).
        this.commitEntry();
        return;
      case 'binary':
        this.commitEntry();
        this.applyBinary(command.op);
        return;
      case 'unary':
        this.commitEntry();
        this.applyUnary(command.op);
        return;
      case 'constant':
        this.commitEntry();
        this.pushConstant(command.name);
        return;
      case 'stack':
        this.commitEntry();
        this.applyStackOp(command.op);
        return;
      case 'setAngleMode':
        // Mode change leaves any in-progress entry intact.
        this.core.setAngleMode(command.mode);
        return;
    }
  }

  /** Append `.`, starting `0.` on an empty line and ignoring a second point. */
  private appendDecimal(): void {
    if (this.entry === '') this.entry = '0.';
    else if (!this.entry.includes('.')) this.entry += '.';
  }

  /**
   * `+/−`: flip the sign of the in-progress entry if one is being typed,
   * otherwise negate the level-1 value via the core (FR7).
   */
  private changeSign(): void {
    if (this.entry !== '') {
      this.entry = this.entry.startsWith('-')
        ? this.entry.slice(1)
        : `-${this.entry}`;
      return;
    }
    this.applyOperator('negate', 1);
  }

  /**
   * Terminate the in-progress entry by pushing its value onto the stack (FR5).
   * No-op when no entry is in progress. A degenerate fragment (e.g. a lone `-`
   * or `.`) parses non-finite and is committed as `0` so the stack never holds
   * `NaN` (FR19).
   */
  private commitEntry(): void {
    if (this.entry === '') return;
    const value = Number(this.entry);
    this.stack.push(Number.isFinite(value) ? value : 0);
    this.entry = '';
  }

  /** Apply a binary operator to the top two levels (FR1). */
  private applyBinary(op: BinaryOp): void {
    this.applyOperator(op, 2);
  }

  /** Apply a unary function to level 1 (FR1/FR2). */
  private applyUnary(op: UnaryOp): void {
    if (op === 'exp10') {
      // 10ˣ has no dedicated core operator: realize it as power(10, x).
      this.applyOperator('power', 1, 10);
      return;
    }
    this.applyOperator(op, 1);
  }

  /** Push a constant; lifts the stack like any freshly entered value (FR1). */
  private pushConstant(name: ConstantName): void {
    this.stack.push(name === 'pi' ? PI : E);
  }

  /** Run a stack-management op, mapping underflow to a non-destructive error. */
  private applyStackOp(op: StackOp): void {
    try {
      if (op === 'drop') this.stack.drop();
      else if (op === 'swap') this.stack.swap();
      else this.stack.dup();
    } catch (error) {
      if (error instanceof StackUnderflowError) {
        this.lastError = calcError('UNDERFLOW');
        return;
      }
      throw error;
    }
  }

  /**
   * Apply a registered `@calc/core` operator named `name` to the top `arity`
   * stack levels, non-destructively.
   *
   * Operands are read (not popped) first; the core is consulted; only on success
   * are the operands replaced by the single result. So an underflow or a core
   * error leaves the stack byte-for-byte unchanged (FR19). The optional
   * `leadingArg` is prepended to the operand list — used by 10ˣ to call
   * `power(10, x)` while still consuming a single stack level.
   *
   * RPN operand order: `@calc/core` binary operators expect `[level2, level1]`
   * (deeper operand first), so e.g. subtraction is `level2 − level1`.
   */
  private applyOperator(
    name: string,
    arity: number,
    leadingArg?: number,
  ): void {
    if (this.stack.depth() < arity) {
      this.lastError = calcError('UNDERFLOW');
      return;
    }
    const top = this.stack.peekN(arity); // [level1, level2, ...]
    const operands = arity === 2 ? [top[1], top[0]] : [top[0]];
    const args =
      leadingArg === undefined ? operands : [leadingArg, ...operands];

    const result = this.core.apply(name, args);
    if (!result.ok) {
      this.lastError = fromErrorKind(result.error.kind);
      return; // stack untouched — non-destructive
    }

    for (let i = 0; i < arity; i++) this.stack.pop();
    this.stack.push(result.value);
  }

  /** Build the immutable snapshot returned to the UI. */
  private snapshot(): CalcState {
    return {
      stack: this.stack.peekN(this.stack.depth()),
      entry: this.entry,
      angleMode: this.core.angleMode,
      shift: this.shift,
      error: this.lastError,
    };
  }
}
