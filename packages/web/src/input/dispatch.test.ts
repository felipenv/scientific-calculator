// Tests for the shared input-dispatch controller (CALC-F04).
//
// The headline is parity (FR11/AC2): the same input sequence delivered as
// keypad clicks and as keystrokes must land the same stack/result/state, via
// the one `dispatch` route. The controller is wired to the *real* keypad,
// display, and stub core (not mocks) so the seam is exercised end to end. Also
// covered: the DEG⇄RAD toggle, the keyboard shift route mirrored onto the
// keypad, non-destructive errors with next-keypress dismissal, and the
// unmapped-key / reserved-modifier guards. Runs under jsdom.

import { describe, expect, it, vi } from 'vitest';

import { AngleMode, Cmd, type CalcState } from '../core/contract.js';
import { StubCalculatorCore } from '../core/stub-core.js';
import { createDisplay } from '../ui/display.js';
import { createKeypad, type KeypadHandle } from '../ui/keypad.js';
import { createDispatch, type DispatchController } from './dispatch.js';

interface Harness {
  readonly core: StubCalculatorCore;
  readonly keypad: KeypadHandle;
  readonly controller: DispatchController;
  /** A keyboard target the controller listens on (isolated per harness). */
  readonly keyboard: EventTarget;
}

/** Wire core + display + keypad + controller exactly as `app.ts` does. */
function setup(): Harness {
  const core = new StubCalculatorCore();
  const display = createDisplay(document);
  const keypad = createKeypad(document, {
    onCommand: (command) => controller.dispatch(command),
  });
  const controller = createDispatch({ core, display, keypad });

  const keyboard = new EventTarget();
  controller.attachKeyboard(keyboard);
  return { core, keypad, controller, keyboard };
}

/** Click a keypad button by its `data-key` id. */
function click(keypad: KeypadHandle, id: string): void {
  const button = keypad.element.querySelector<HTMLButtonElement>(
    `button[data-key="${id}"]`,
  );
  if (!button) throw new Error(`no key with data-key="${id}"`);
  button.click();
}

/** Dispatch a cancelable keydown on `target`; return the event. */
function press(
  target: EventTarget,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

/** The comparable parts of a state (stack copied out of its readonly view). */
function shape(state: CalcState) {
  return {
    stack: Array.from(state.stack),
    entry: state.entry,
    angleMode: state.angleMode,
    shift: state.shift,
    error: state.error,
  };
}

describe('click ↔ keyboard parity (AC2)', () => {
  it('reaches the same state for `3 ENTER 4 +` either way', () => {
    const viaClick = setup();
    click(viaClick.keypad, 'digit-3');
    click(viaClick.keypad, 'enter');
    click(viaClick.keypad, 'digit-4');
    click(viaClick.keypad, 'add');

    const viaKeys = setup();
    press(viaKeys.keyboard, '3');
    press(viaKeys.keyboard, 'Enter');
    press(viaKeys.keyboard, '4');
    press(viaKeys.keyboard, '+');

    expect(shape(viaClick.controller.state)).toEqual({
      stack: [7],
      entry: '',
      angleMode: AngleMode.Degrees,
      shift: false,
      error: null,
    });
    expect(shape(viaKeys.controller.state)).toEqual(
      shape(viaClick.controller.state),
    );
  });

  it('reaches the same state through the shift layer (`1 ENTER asin`)', () => {
    const viaClick = setup();
    click(viaClick.keypad, 'digit-1');
    click(viaClick.keypad, 'enter');
    click(viaClick.keypad, 'shift'); // arm the layer
    click(viaClick.keypad, 'sin'); // resolves to asin while shifted

    const viaKeys = setup();
    press(viaKeys.keyboard, '1');
    press(viaKeys.keyboard, 'Enter');
    press(viaKeys.keyboard, 'f'); // keyboard route to shift
    press(viaKeys.keyboard, 's'); // resolves to asin while shifted

    // Both consumed the shift layer and computed asin(1) identically.
    expect(viaClick.controller.state.shift).toBe(false);
    expect(shape(viaKeys.controller.state)).toEqual(
      shape(viaClick.controller.state),
    );
    expect(viaClick.controller.state.stack).toEqual([90]); // asin(1) in DEG
  });

  it('routes both input methods through one `core.apply` per input', () => {
    const { core, keypad, keyboard } = setup();
    const apply = vi.spyOn(core, 'apply');

    click(keypad, 'digit-2');
    expect(apply).toHaveBeenCalledTimes(1);

    press(keyboard, '5');
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply).toHaveBeenLastCalledWith(Cmd.digit(5));
  });
});

describe('angle mode (FR16/FR17)', () => {
  it('toggles DEG⇄RAD via the `m` key and reflects it in the display', () => {
    const { controller, keyboard } = setup();
    expect(controller.state.angleMode).toBe(AngleMode.Degrees);

    press(keyboard, 'm');
    expect(controller.state.angleMode).toBe(AngleMode.Radians);

    press(keyboard, 'm');
    expect(controller.state.angleMode).toBe(AngleMode.Degrees);
  });

  it('exposes toggleAngleMode() as the shared switch', () => {
    const { controller } = setup();
    expect(controller.toggleAngleMode().angleMode).toBe(AngleMode.Radians);
    expect(controller.toggleAngleMode().angleMode).toBe(AngleMode.Degrees);
  });

  it('changes how trig is computed when the mode flips', () => {
    const deg = setup();
    click(deg.keypad, 'digit-9');
    click(deg.keypad, 'digit-0');
    click(deg.keypad, 'sin'); // sin(90°) = 1

    const rad = setup();
    press(rad.keyboard, 'm'); // → RAD
    press(rad.keyboard, '9');
    press(rad.keyboard, '0');
    press(rad.keyboard, 's'); // sin(90 rad) ≠ 1

    expect(deg.controller.state.stack).toEqual([1]);
    expect(rad.controller.state.stack[0]).not.toBe(1);
  });
});

describe('shift layer mirrored onto the keypad (FR3)', () => {
  it('arms shift from the keyboard and clears it on the next command', () => {
    const { controller, keypad, keyboard } = setup();
    const shiftKey = keypad.element.querySelector<HTMLButtonElement>(
      'button[data-key="shift"]',
    )!;

    press(keyboard, 'f');
    expect(controller.state.shift).toBe(true);
    expect(keypad.shift).toBe(true);
    expect(shiftKey.getAttribute('aria-pressed')).toBe('true');

    press(keyboard, '7'); // any command consumes the one-shot layer
    expect(controller.state.shift).toBe(false);
    expect(keypad.shift).toBe(false);
    expect(shiftKey.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggling shift by click and by key are equivalent', () => {
    const viaClick = setup();
    click(viaClick.keypad, 'shift');
    const viaKey = setup();
    press(viaKey.keyboard, 'f');
    expect(viaKey.controller.state.shift).toBe(viaClick.controller.state.shift);
  });
});

describe('non-destructive errors (FR19/FR20/AC5)', () => {
  it('surfaces divide-by-zero without consuming the operand', () => {
    const { controller, keypad } = setup();
    click(keypad, 'digit-0');
    click(keypad, 'reciprocal'); // 1/0

    const state = controller.state;
    expect(state.error?.code).toBe('DIV_ZERO');
    expect(state.error?.message).toBe('Error: Divide by 0');
    expect(state.stack).toEqual([0]); // operand left in place
  });

  it('dismisses the error on the very next keypress', () => {
    const { controller, keypad, keyboard } = setup();
    click(keypad, 'digit-0');
    click(keypad, 'reciprocal');
    expect(controller.state.error).not.toBeNull();

    press(keyboard, '5'); // resumes normal entry
    expect(controller.state.error).toBeNull();
    expect(controller.state.entry).toBe('5');
  });
});

describe('keyboard guards', () => {
  it('prevents default only for handled keys', () => {
    const { keyboard } = setup();
    expect(press(keyboard, '3').defaultPrevented).toBe(true);
    expect(press(keyboard, 'm').defaultPrevented).toBe(true);
    expect(press(keyboard, 'z').defaultPrevented).toBe(false);
  });

  it('leaves unmapped keys and reserved-modifier combos as no-ops', () => {
    const { controller, keyboard } = setup();
    const before = shape(controller.state);

    press(keyboard, 'z');
    press(keyboard, '3', { ctrlKey: true });

    expect(shape(controller.state)).toEqual(before);
  });
});

describe('initial render', () => {
  it('paints the empty core state before any input', () => {
    const { controller, keypad } = setup();
    expect(shape(controller.state)).toEqual({
      stack: [],
      entry: '',
      angleMode: AngleMode.Degrees,
      shift: false,
      error: null,
    });
    expect(keypad.shift).toBe(false);
  });
});
