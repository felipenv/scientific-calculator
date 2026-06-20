// Tests for the keyboard → command map (CALC-F04).
//
// They pin the FR10 mappings, the shift-layer resolution that mirrors the
// keypad (FR3), case-folding of letter shortcuts, the reserved-modifier guard,
// and the angle-mode toggle key. The map is pure, so these assert commands in
// isolation — the click/keyboard *parity* itself is proven in dispatch.test.ts.

import { describe, expect, it } from 'vitest';

import { Cmd, type Command } from '../core/contract.js';
import {
  ANGLE_MODE_TOGGLE_KEY,
  commandForKey,
  isAngleModeToggleKey,
} from './keymap.js';

/** Build a cancelable keydown for `key` with optional modifiers. */
function keydown(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, cancelable: true, ...init });
}

/** Every FR10 key whose command is the same shifted or not. */
const UNSHIFTED: ReadonlyArray<readonly [key: string, command: Command]> = [
  ['0', Cmd.digit(0)],
  ['5', Cmd.digit(5)],
  ['9', Cmd.digit(9)],
  ['.', Cmd.decimal()],
  ['+', Cmd.binary('add')],
  ['-', Cmd.binary('subtract')],
  ['*', Cmd.binary('multiply')],
  ['/', Cmd.binary('divide')],
  ['Enter', Cmd.enter()],
  ['Backspace', Cmd.backspace()],
  ['Escape', Cmd.clearEntry()],
  ['Delete', Cmd.clearEntry()],
  ['^', Cmd.binary('power')],
  ['f', Cmd.toggleShift()],
];

/** Keys whose command depends on the shift layer (mirrors the keypad). */
const SHIFT_PAIRS: ReadonlyArray<
  readonly [key: string, primary: Command, shifted: Command]
> = [
  ['s', Cmd.unary('sin'), Cmd.unary('asin')],
  ['c', Cmd.unary('cos'), Cmd.unary('acos')],
  ['t', Cmd.unary('tan'), Cmd.unary('atan')],
  ['r', Cmd.unary('sqrt'), Cmd.unary('factorial')],
];

describe('commandForKey — FR10 mappings', () => {
  it('maps each fixed key to its command regardless of shift', () => {
    for (const [key, command] of UNSHIFTED) {
      expect(commandForKey(keydown(key), false)).toEqual(command);
      expect(commandForKey(keydown(key), true)).toEqual(command);
    }
  });

  it('resolves dual keys against the shift layer (FR3)', () => {
    for (const [key, primary, shifted] of SHIFT_PAIRS) {
      expect(commandForKey(keydown(key), false)).toEqual(primary);
      expect(commandForKey(keydown(key), true)).toEqual(shifted);
    }
  });

  it('case-folds letter shortcuts so Shift+letter still resolves', () => {
    // The physical Shift is not the calculator shift layer: `S` is still sin.
    expect(commandForKey(keydown('S', { shiftKey: true }), false)).toEqual(
      Cmd.unary('sin'),
    );
  });

  it('lets the plain Shift modifier through for `+`/`*` (US layout)', () => {
    expect(commandForKey(keydown('+', { shiftKey: true }), false)).toEqual(
      Cmd.binary('add'),
    );
    expect(commandForKey(keydown('*', { shiftKey: true }), false)).toEqual(
      Cmd.binary('multiply'),
    );
  });

  it('ignores reserved modifiers, even on a mapped key', () => {
    for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }])
      expect(commandForKey(keydown('3', init), false)).toBeNull();
  });

  it('returns null for unmapped keys', () => {
    for (const key of ['z', 'Tab', 'ArrowUp', 'F1', '#'])
      expect(commandForKey(keydown(key), false)).toBeNull();
  });
});

describe('isAngleModeToggleKey', () => {
  it('recognizes the toggle key, case-folded', () => {
    expect(ANGLE_MODE_TOGGLE_KEY).toBe('m');
    expect(isAngleModeToggleKey(keydown('m'))).toBe(true);
    expect(isAngleModeToggleKey(keydown('M', { shiftKey: true }))).toBe(true);
  });

  it('rejects other keys and reserved-modifier combos', () => {
    expect(isAngleModeToggleKey(keydown('n'))).toBe(false);
    expect(isAngleModeToggleKey(keydown('m', { ctrlKey: true }))).toBe(false);
  });

  it('is not also surfaced as a command', () => {
    expect(commandForKey(keydown('m'), false)).toBeNull();
  });
});
