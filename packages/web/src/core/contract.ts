// The UI↔core command contract for the web calculator (CALC-F04).
//
// This is the frozen seam the keypad, display, and input-dispatch layers code
// against. Every input — an on-screen click or a physical keypress — is
// normalized to one semantic {@link Command}; a {@link CalculatorCore} applies a
// command and returns the whole {@link CalcState} to render. Keeping a single
// command vocabulary and a single apply path is what guarantees on-screen and
// keyboard entry stay in lockstep (FR11/AC2): there is no second code path to
// drift.
//
// The calculator's *math* is not defined here. It lives in `@calc/core` (the
// operator engine + the angle-mode-aware trig + the dynamic RPN stack); this
// contract is the command-level façade over those primitives. The angle-mode
// type is re-exported from the core so the UI has one source of truth and GRAD
// can be added there later without changing this surface (FR17/AC4).

import { AngleMode } from '@calc/core';

import type { CalcError } from './errors.js';

// Re-exported so UI code depends on this contract rather than reaching into the
// core package directly for the angle-mode type.
export { AngleMode };

/** A single decimal digit produced by a digit key `0`–`9` (FR1). */
export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Two-operand operators (FR1). Names match the `@calc/core` registry. */
export type BinaryOp = 'add' | 'subtract' | 'multiply' | 'divide' | 'power';

/**
 * One-operand functions (FR1/FR2). All but `exp10` name a `@calc/core`
 * operator directly; `exp10` (10ˣ) has no dedicated core operator and is
 * realized by the stub as `power(10, x)`.
 */
export type UnaryOp =
  | 'sqrt'
  | 'square'
  | 'reciprocal'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'ln'
  | 'log10'
  | 'exp'
  | 'exp10'
  | 'factorial'
  | 'percent';

/** The pushable mathematical constants (FR1/FR2). */
export type ConstantName = 'pi' | 'e';

/** Stack-management operations (FR2). */
export type StackOp = 'drop' | 'swap' | 'dup';

/**
 * Every semantic operation the UI can request, as a discriminated union on
 * `kind`. Editing commands mutate the in-progress entry line; the rest operate
 * on the stack, the angle mode, or the shift layer. A union (rather than a flat
 * enum) lets a command carry its payload — the digit, the operator, the target
 * angle mode — with no separate argument channel.
 */
export type Command =
  // Entry-line editing (FR5/FR7/FR8/FR10).
  | { readonly kind: 'digit'; readonly digit: Digit }
  | { readonly kind: 'decimal' }
  | { readonly kind: 'backspace' }
  | { readonly kind: 'clearEntry' }
  | { readonly kind: 'chs' }
  | { readonly kind: 'enter' }
  // Operators, functions, constants, and stack ops (FR1/FR2/FR6/FR9).
  | { readonly kind: 'binary'; readonly op: BinaryOp }
  | { readonly kind: 'unary'; readonly op: UnaryOp }
  | { readonly kind: 'constant'; readonly name: ConstantName }
  | { readonly kind: 'stack'; readonly op: StackOp }
  // Layer and mode (FR2/FR3/FR16/FR17).
  | { readonly kind: 'toggleShift' }
  | { readonly kind: 'setAngleMode'; readonly mode: AngleMode };

/**
 * Constructors for each {@link Command}. Using these keeps call sites (the
 * keypad map, the keyboard map, tests) terse and shields them from the union's
 * literal shape.
 */
export const Cmd = {
  digit: (digit: Digit): Command => ({ kind: 'digit', digit }),
  decimal: (): Command => ({ kind: 'decimal' }),
  backspace: (): Command => ({ kind: 'backspace' }),
  clearEntry: (): Command => ({ kind: 'clearEntry' }),
  chs: (): Command => ({ kind: 'chs' }),
  enter: (): Command => ({ kind: 'enter' }),
  binary: (op: BinaryOp): Command => ({ kind: 'binary', op }),
  unary: (op: UnaryOp): Command => ({ kind: 'unary', op }),
  constant: (name: ConstantName): Command => ({ kind: 'constant', name }),
  stack: (op: StackOp): Command => ({ kind: 'stack', op }),
  toggleShift: (): Command => ({ kind: 'toggleShift' }),
  setAngleMode: (mode: AngleMode): Command => ({ kind: 'setAngleMode', mode }),
} as const;

/**
 * A read-only view of the unbounded RPN stack, most-recent value first:
 * index `0` is level `1` (the X register), index `1` is level `2`, and so on.
 * Length equals the current stack depth (`[]` when empty). Every element is a
 * finite double — the core never lets `NaN`/`Infinity` reach the stack (FR19).
 */
export type StackSnapshot = readonly number[];

/**
 * The complete, renderable calculator state after a command. Immutable: each
 * {@link CalculatorCore.apply} returns a fresh snapshot the UI renders wholesale.
 *
 * - `stack`     — the current stack (see {@link StackSnapshot}).
 * - `entry`     — the in-progress entry-line text; `''` when none is in progress.
 * - `angleMode` — the active angle mode, always displayable (FR16).
 * - `shift`     — whether the secondary (shifted) key layer is active (FR3).
 * - `error`     — the last command's error, or `null`. Transient: it is cleared
 *   at the start of the next command, so a fresh keypress dismisses it (FR20).
 */
export interface CalcState {
  readonly stack: StackSnapshot;
  readonly entry: string;
  readonly angleMode: AngleMode;
  readonly shift: boolean;
  readonly error: CalcError | null;
}

/**
 * The seam the UI drives. `apply` processes one semantic command and returns the
 * new state; `state` reads the current snapshot without applying anything.
 *
 * Errors are surfaced *in* the returned state's `error` field, never thrown, and
 * are non-destructive: on error the stack and entry are left exactly as they
 * were (FR19). The stub in `stub-core.ts` is the v0 implementation; a later,
 * richer engine can replace it by re-implementing this interface.
 */
export interface CalculatorCore {
  apply(command: Command): CalcState;
  readonly state: CalcState;
}
