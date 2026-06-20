// Physical-keyboard → semantic-command mapping for the calculator (CALC-F04).
//
// This is the keyboard half of the single shared input path (FR10/FR11/AC2).
// It is deliberately a *pure* lookup: it turns a `KeyboardEvent` into the same
// {@link Command} the on-screen keypad emits, and nothing else — no state, no
// DOM, no dispatch. The stateful side (applying the command, mirroring shift,
// toggling the angle mode) lives in the dispatch controller, so both input
// methods converge on one `dispatch(command)` and cannot drift.
//
// Shift-layer parity with the keypad. The keypad pairs a primary action with an
// optional `shifted` action and resolves between them against the *current*
// shift state at press time. The keyboard mirrors that exactly: each binding
// here may carry a `shifted` command, and {@link commandForKey} resolves it
// against the shift flag the controller passes in. The shift layer itself is a
// toggle (`Cmd.toggleShift()`), reached from the keyboard via a dedicated key —
// see the carried assumptions below.
//
// Carried assumptions (documented here; answers open questions in the spec):
//   • Keyboard shift-reachability: a dedicated `f` key (mnemonic "function
//     shift", unused by any other shortcut) emits `Cmd.toggleShift()`, exactly
//     like the on-screen shift button. The shift layer is therefore the same
//     one-shot toggle for both input methods. The *physical* Shift modifier is
//     NOT the calculator's shift layer (it is already needed to type `+`/`*` on
//     a US layout); letter keys are case-folded so `S` and `s` map alike.
//   • DROP/SWAP/DUP and the remaining shifted functions (eˣ, 10ˣ, x!, e) have
//     no dedicated physical shortcut in v0. Those that sit on a key with a base
//     shortcut are still reachable through the shift layer (e.g. `f` then `r`
//     for x!); the stack ops remain on-screen / shift-only. This keeps the
//     keyboard surface small and is revisited once the secondary-shortcut set
//     is finalized.
//   • Angle mode: a dedicated `m` key toggles DEG⇄RAD. The mode toggle is not a
//     static command (it depends on the current mode), so it is surfaced as its
//     own action rather than a {@link Command} — see {@link isAngleModeToggleKey}.

import { Cmd, type Command } from '../core/contract.js';

/**
 * A keyboard binding: the command produced unshifted, plus an optional command
 * produced while the shift layer is active. Mirrors the keypad's primary/shifted
 * pairing so the two input paths resolve the shift layer identically (FR3).
 */
interface KeyBinding {
  readonly primary: Command;
  readonly shifted?: Command;
}

/**
 * `KeyboardEvent.key` → binding (FR10). Operator keys use the already-resolved
 * `key` value (`+` `-` `*` `/`), so the physical Shift needed to type them on a
 * US layout never reaches command resolution. Letter shortcuts are stored
 * lowercase and looked up case-folded (see {@link normalizeKey}). Shifted
 * variants match the keypad's pairing: inverse trig under trig, x! under √x.
 */
const KEY_BINDINGS: Readonly<Record<string, KeyBinding>> = {
  // Digits and decimal point (FR10).
  '0': { primary: Cmd.digit(0) },
  '1': { primary: Cmd.digit(1) },
  '2': { primary: Cmd.digit(2) },
  '3': { primary: Cmd.digit(3) },
  '4': { primary: Cmd.digit(4) },
  '5': { primary: Cmd.digit(5) },
  '6': { primary: Cmd.digit(6) },
  '7': { primary: Cmd.digit(7) },
  '8': { primary: Cmd.digit(8) },
  '9': { primary: Cmd.digit(9) },
  '.': { primary: Cmd.decimal() },
  // Four-function operators (FR10).
  '+': { primary: Cmd.binary('add') },
  '-': { primary: Cmd.binary('subtract') },
  '*': { primary: Cmd.binary('multiply') },
  '/': { primary: Cmd.binary('divide') },
  // Entry control (FR10).
  Enter: { primary: Cmd.enter() },
  Backspace: { primary: Cmd.backspace() },
  Escape: { primary: Cmd.clearEntry() },
  Delete: { primary: Cmd.clearEntry() },
  // Letter / symbol function shortcuts (FR10). Shifted variants mirror the
  // keypad pairing so `f` then the key reaches the secondary function.
  s: { primary: Cmd.unary('sin'), shifted: Cmd.unary('asin') },
  c: { primary: Cmd.unary('cos'), shifted: Cmd.unary('acos') },
  t: { primary: Cmd.unary('tan'), shifted: Cmd.unary('atan') },
  r: { primary: Cmd.unary('sqrt'), shifted: Cmd.unary('factorial') },
  '^': { primary: Cmd.binary('power') },
  // The keyboard route to the shift layer (carried assumption).
  f: { primary: Cmd.toggleShift() },
};

/** The dedicated key that toggles DEG⇄RAD (carried assumption). */
export const ANGLE_MODE_TOGGLE_KEY = 'm';

/**
 * Whether `event` carries a non-shift modifier. Such combinations (Ctrl/Alt/
 * Meta) are reserved for the browser and OS — `Ctrl+R`, `Cmd+C` — so the
 * calculator never claims them. The plain Shift modifier is allowed through: it
 * is what produces `+`/`*` on a US layout and never means the calculator's own
 * shift layer (that is the `f` toggle).
 */
function hasReservedModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.altKey || event.metaKey;
}

/**
 * Case-fold single letters so `S` (typed with the physical Shift) resolves the
 * same binding as `s`. Multi-character keys (`Enter`, `Backspace`) and symbols
 * are returned unchanged.
 */
function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

/**
 * Resolve `event` to the {@link Command} it should dispatch, or `null` when the
 * key is unmapped or carries a reserved modifier (in which case the caller must
 * leave the event for the browser). `shift` is the controller's current shift
 * state; when active and the binding has a shifted variant, the variant wins —
 * exactly mirroring the keypad's press-time resolution (FR3/FR11).
 */
export function commandForKey(
  event: KeyboardEvent,
  shift: boolean,
): Command | null {
  if (hasReservedModifier(event)) return null;
  const binding = KEY_BINDINGS[normalizeKey(event.key)];
  if (!binding) return null;
  return shift && binding.shifted ? binding.shifted : binding.primary;
}

/**
 * Whether `event` is the angle-mode toggle (FR16/FR17). Surfaced separately
 * from {@link commandForKey} because toggling DEG⇄RAD depends on the current
 * mode and so cannot be a static {@link Command}; the controller turns it into
 * the right `setAngleMode` command.
 */
export function isAngleModeToggleKey(event: KeyboardEvent): boolean {
  return (
    !hasReservedModifier(event) &&
    normalizeKey(event.key) === ANGLE_MODE_TOGGLE_KEY
  );
}
