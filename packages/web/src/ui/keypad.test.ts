// Tests for the keypad component (CALC-F04).
//
// They verify the layout coverage (every primary key in FR1, every shifted
// function in FR2 via the one toggle), that each button emits the command
// resolved against the current shift state, that shift is visibly indicated,
// and that all keys are native focusable buttons with original labels (AC1/AC8,
// FR3/FR4/FR22). Runs under jsdom (see vite.config.ts).

import { describe, expect, it, vi } from 'vitest';

import { Cmd, type Command } from '../core/contract.js';
import { createKeypad, type KeypadHandle } from './keypad.js';

/** Build a keypad wired to a spy; return both for assertions. */
function setup(): {
  handle: KeypadHandle;
  onCommand: ReturnType<typeof vi.fn>;
} {
  const onCommand = vi.fn<(command: Command) => void>();
  const handle = createKeypad(document, { onCommand });
  return { handle, onCommand };
}

/** Find a key button by its stable `data-key` id. */
function key(handle: KeypadHandle, id: string): HTMLButtonElement {
  const button = handle.element.querySelector<HTMLButtonElement>(
    `button[data-key="${id}"]`,
  );
  if (!button) throw new Error(`no key with data-key="${id}"`);
  return button;
}

/** Every primary (unshifted) key required by FR1, with the command it emits. */
const PRIMARY_KEYS: ReadonlyArray<readonly [id: string, command: Command]> = [
  ['digit-0', Cmd.digit(0)],
  ['digit-1', Cmd.digit(1)],
  ['digit-2', Cmd.digit(2)],
  ['digit-3', Cmd.digit(3)],
  ['digit-4', Cmd.digit(4)],
  ['digit-5', Cmd.digit(5)],
  ['digit-6', Cmd.digit(6)],
  ['digit-7', Cmd.digit(7)],
  ['digit-8', Cmd.digit(8)],
  ['digit-9', Cmd.digit(9)],
  ['decimal', Cmd.decimal()],
  ['enter', Cmd.enter()],
  ['add', Cmd.binary('add')],
  ['subtract', Cmd.binary('subtract')],
  ['multiply', Cmd.binary('multiply')],
  ['divide', Cmd.binary('divide')],
  ['chs', Cmd.chs()],
  ['backspace', Cmd.backspace()],
  ['sqrt', Cmd.unary('sqrt')],
  ['square', Cmd.unary('square')],
  ['reciprocal', Cmd.unary('reciprocal')],
  ['power', Cmd.binary('power')],
  ['sin', Cmd.unary('sin')],
  ['cos', Cmd.unary('cos')],
  ['tan', Cmd.unary('tan')],
  ['ln', Cmd.unary('ln')],
  ['log', Cmd.unary('log10')],
  ['percent', Cmd.unary('percent')],
  ['pi', Cmd.constant('pi')],
];

/** Every shifted function required by FR2, reachable via the one toggle. */
const SHIFTED_KEYS: ReadonlyArray<readonly [id: string, command: Command]> = [
  ['sin', Cmd.unary('asin')],
  ['cos', Cmd.unary('acos')],
  ['tan', Cmd.unary('atan')],
  ['ln', Cmd.unary('exp')],
  ['log', Cmd.unary('exp10')],
  ['sqrt', Cmd.unary('factorial')],
  ['pi', Cmd.constant('e')],
  ['backspace', Cmd.stack('drop')],
  ['square', Cmd.stack('swap')],
  ['reciprocal', Cmd.stack('dup')],
];

describe('keypad layout coverage', () => {
  it('exposes every primary key (FR1) as a native button', () => {
    const { handle } = setup();
    for (const [id] of PRIMARY_KEYS) {
      const button = key(handle, id);
      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
    }
  });

  it('exposes the single shift key (FR2)', () => {
    const { handle } = setup();
    expect(key(handle, 'shift').tagName).toBe('BUTTON');
  });

  it('exposes every shifted function on a dual key (FR2)', () => {
    const { handle } = setup();
    for (const [id] of SHIFTED_KEYS) {
      expect(key(handle, id).dataset.dual).toBe('true');
    }
  });
});

describe('command emission', () => {
  it('emits each primary command unshifted (AC1)', () => {
    for (const [id, command] of PRIMARY_KEYS) {
      const { handle, onCommand } = setup();
      key(handle, id).click();
      expect(onCommand).toHaveBeenCalledTimes(1);
      expect(onCommand).toHaveBeenCalledWith(command);
    }
  });

  it('emits ToggleShift from the shift key', () => {
    const { handle, onCommand } = setup();
    key(handle, 'shift').click();
    expect(onCommand).toHaveBeenCalledWith(Cmd.toggleShift());
  });

  it('emits the shifted command once the layer is active (FR3)', () => {
    for (const [id, command] of SHIFTED_KEYS) {
      const { handle, onCommand } = setup();
      handle.setShift(true);
      key(handle, id).click();
      expect(onCommand).toHaveBeenCalledTimes(1);
      expect(onCommand).toHaveBeenCalledWith(command);
    }
  });

  it('resolves against the live shift state at click time, not setup', () => {
    const { handle, onCommand } = setup();
    handle.setShift(true);
    handle.setShift(false);
    key(handle, 'sin').click();
    expect(onCommand).toHaveBeenCalledWith(Cmd.unary('sin'));
  });

  it('emits the primary command for non-dual keys even when shifted', () => {
    const { handle, onCommand } = setup();
    handle.setShift(true);
    key(handle, 'digit-7').click();
    expect(onCommand).toHaveBeenCalledWith(Cmd.digit(7));
  });
});

describe('shift indicator (FR3)', () => {
  it('marks the keypad and shift key when the layer is active', () => {
    const { handle } = setup();
    const shiftKey = key(handle, 'shift');

    expect(handle.shift).toBe(false);
    expect(shiftKey.getAttribute('aria-pressed')).toBe('false');
    expect(handle.element.classList.contains('calc-keypad--shifted')).toBe(
      false,
    );

    handle.setShift(true);

    expect(handle.shift).toBe(true);
    expect(shiftKey.getAttribute('aria-pressed')).toBe('true');
    expect(handle.element.classList.contains('calc-keypad--shifted')).toBe(
      true,
    );
  });

  it('swaps a dual key label and accessible name with the shift layer', () => {
    const { handle } = setup();
    const sin = key(handle, 'sin');
    const labelOf = (b: HTMLButtonElement) =>
      b.querySelector('.calc-key__label')?.textContent;

    expect(labelOf(sin)).toBe('sin');
    expect(sin.getAttribute('aria-label')).toBe('Sine');

    handle.setShift(true);

    expect(labelOf(sin)).toBe('asin');
    expect(sin.getAttribute('aria-label')).toBe('Arcsine');
  });

  it('leaves a non-dual key label unchanged across shift', () => {
    const { handle } = setup();
    const seven = key(handle, 'digit-7');
    const labelOf = () => seven.querySelector('.calc-key__label')?.textContent;

    expect(labelOf()).toBe('7');
    handle.setShift(true);
    expect(labelOf()).toBe('7');
  });
});

describe('accessibility & originality', () => {
  it('renders only native focusable buttons (FR22)', () => {
    const { handle } = setup();
    const buttons = handle.element.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect((button as HTMLButtonElement).type).toBe('button');
      expect(button.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('uses generic labels with no HP names or model strings (AC8)', () => {
    const { handle } = setup();
    const text = (handle.element.textContent ?? '').toLowerCase();
    for (const banned of ['hp', 'hewlett', 'packard', '48', '50g', 'rpl']) {
      expect(text).not.toContain(banned);
    }
  });

  it('labels the keypad as a group for assistive tech', () => {
    const { handle } = setup();
    expect(handle.element.getAttribute('role')).toBe('group');
    expect(handle.element.getAttribute('aria-label')).toBe('Calculator keypad');
  });
});
