// The shared input-dispatch controller (CALC-F04, FR10/FR11/AC2).
//
// This is the integration seam where the two input methods meet. Both the
// on-screen keypad (via its `onCommand` callback) and the physical keyboard
// (via a global `keydown` handler) produce the same semantic {@link Command},
// and *both* go through one method — {@link DispatchController.dispatch}. That
// single route is what guarantees a click and the equivalent keystroke yield
// identical stack/result outcomes (AC2): there is no second code path to drift.
//
// dispatch(command) is the whole cycle: hand the command to the core, take the
// fresh {@link CalcState} it returns, and re-render the views from it. The core
// owns all truth (stack, entry, shift, angle mode, transient error); the
// controller holds only a reference to the latest snapshot so the keyboard can
// resolve the shift layer (FR3) and the angle-mode toggle can read the current
// mode. The views are dumb sinks updated wholesale every cycle.

import {
  AngleMode,
  Cmd,
  type CalcState,
  type CalculatorCore,
  type Command,
} from '../core/contract.js';
import type { DisplayHandle } from '../ui/display.js';
import type { KeypadHandle } from '../ui/keypad.js';
import { commandForKey, isAngleModeToggleKey } from './keymap.js';

/** Collaborators the controller drives. */
export interface DispatchOptions {
  /** The calculator core; the single source of stack/value/mode truth. */
  readonly core: CalculatorCore;
  /** The stack/entry/angle-mode display, re-rendered after every command. */
  readonly display: DisplayHandle;
  /** The keypad, whose shift indicator is mirrored from the core's state. */
  readonly keypad: KeypadHandle;
}

/** The minimal slice of `EventTarget` the keyboard handler attaches to. */
export type KeyboardTarget = Pick<
  EventTarget,
  'addEventListener' | 'removeEventListener'
>;

/** Imperative handle over the shared dispatch path. */
export interface DispatchController {
  /**
   * The one route from input to core. Applies `command`, stores the returned
   * state, re-renders the display and keypad, and returns the new state. Every
   * keypad click and every mapped keystroke funnels through here (FR11/AC2).
   */
  dispatch(command: Command): CalcState;
  /**
   * Flip the active angle mode DEG⇄RAD (FR16/FR17). A convenience over
   * `dispatch(Cmd.setAngleMode(...))` that reads the current mode; the shared
   * entry point for both the `m` key and any future on-screen mode control.
   */
  toggleAngleMode(): CalcState;
  /**
   * Attach the global `keydown` handler to `target` (typically `document`),
   * routing mapped keys through {@link dispatch}. Returns a function that
   * detaches the listener.
   */
  attachKeyboard(target: KeyboardTarget): () => void;
  /** The latest rendered state. */
  readonly state: CalcState;
}

/**
 * Wire a {@link DispatchController} over `core`, `display`, and `keypad`.
 *
 * Renders the core's initial state once on creation so the views start in sync,
 * then keeps them in sync on every {@link DispatchController.dispatch}. Does not
 * attach the keyboard itself — the caller decides the target via
 * {@link DispatchController.attachKeyboard} (so it stays testable without a
 * global document).
 */
export function createDispatch(options: DispatchOptions): DispatchController {
  const { core, display, keypad } = options;

  let state: CalcState = core.state;

  /** Push the current state into both views (the only render path). */
  const render = (): void => {
    display.update(state);
    keypad.setShift(state.shift);
  };

  const dispatch = (command: Command): CalcState => {
    state = core.apply(command);
    render();
    return state;
  };

  const toggleAngleMode = (): CalcState => {
    const next =
      state.angleMode === AngleMode.Degrees
        ? AngleMode.Radians
        : AngleMode.Degrees;
    return dispatch(Cmd.setAngleMode(next));
  };

  /**
   * Translate a keystroke and route it through `dispatch`. The angle-mode
   * toggle is checked first (it is not a static command); otherwise the key is
   * resolved against the live shift state. Unmapped keys are left untouched so
   * browser shortcuts and focus navigation keep working; only a handled key has
   * its default suppressed (so e.g. Backspace does not navigate the page).
   */
  const handleKeydown = (event: KeyboardEvent): void => {
    if (isAngleModeToggleKey(event)) {
      event.preventDefault();
      toggleAngleMode();
      return;
    }
    const command = commandForKey(event, state.shift);
    if (command === null) return;
    event.preventDefault();
    dispatch(command);
  };

  const attachKeyboard = (target: KeyboardTarget): (() => void) => {
    const listener = handleKeydown as EventListener;
    target.addEventListener('keydown', listener);
    return () => target.removeEventListener('keydown', listener);
  };

  // Initial paint so the keypad/display reflect the core before any input.
  render();

  return {
    dispatch,
    toggleAngleMode,
    attachKeyboard,
    get state() {
      return state;
    },
  };
}
