// The calculator keypad: primary keys + a single shift layer (CALC-F04).
//
// A presentational component over the command contract (FR1–FR4). It renders a
// native `<button>` for every primary operation plus a single `shift` key that
// toggles one secondary layer; each non-shift button emits one {@link Command}
// (via the `onCommand` callback) resolved against the *current* shift state.
//
// The keypad is a CONTROLLED component: it does not own the shift state. The
// shift key emits `Cmd.toggleShift()` like any other input, and the owner
// (later, the input-dispatch layer that holds the core) feeds the resolved
// state back via {@link KeypadHandle.setShift}. Keeping a single source of truth
// — the core — is what stops on-screen and keyboard entry from drifting
// (FR11/AC2): there is no second shift flag to disagree with the core.
//
// Labels are generic functional text only — no HP model names, logos, or copied
// key artwork (FR4/AC8).

import { Cmd, type Command } from '../core/contract.js';

/** One label + the command a key press emits, with an accessible name. */
interface KeyAction {
  /** Visible glyph/text on the key (generic functional label, FR4). */
  readonly label: string;
  /** Descriptive accessible name, since the glyph alone is terse (FR22). */
  readonly ariaLabel: string;
  /** The semantic command this action emits. */
  readonly command: Command;
}

/**
 * A single physical key. `primary` is the unshifted action; `shifted`, when
 * present, is the action produced while the shift layer is active (FR2/FR3).
 * Keys with no `shifted` action emit their primary command regardless of shift.
 */
interface KeySpec {
  /** Stable identifier, surfaced as `data-key` for styling/tests. */
  readonly id: string;
  readonly primary: KeyAction;
  readonly shifted?: KeyAction;
  /** Extra class for layout emphasis (e.g. the wide ENTER key). */
  readonly className?: string;
}

/** Terse constructor for a {@link KeyAction}. */
function action(label: string, ariaLabel: string, command: Command): KeyAction {
  return { label, ariaLabel, command };
}

/**
 * The keypad layout, as rows of keys. Order is purely a v0 product choice — a
 * generic functional grid, deliberately NOT the reference device's placement
 * (AC8). Shifted actions are paired with their primary where it reads naturally
 * (inverse trig under trig, eˣ/10ˣ under ln/log, constants together, stack ops
 * under the edit keys) so the single shift layer stays discoverable (FR3).
 */
const KEY_ROWS: readonly (readonly KeySpec[])[] = [
  [
    {
      id: 'sqrt',
      primary: action('√x', 'Square root', Cmd.unary('sqrt')),
      shifted: action('x!', 'Factorial', Cmd.unary('factorial')),
    },
    {
      id: 'square',
      primary: action('x²', 'Square', Cmd.unary('square')),
      shifted: action(
        'SWAP',
        'Swap the top two stack values',
        Cmd.stack('swap'),
      ),
    },
    {
      id: 'reciprocal',
      primary: action('1/x', 'Reciprocal', Cmd.unary('reciprocal')),
      shifted: action('DUP', 'Duplicate the top stack value', Cmd.stack('dup')),
    },
    {
      id: 'power',
      primary: action('yˣ', 'Power: y to the x', Cmd.binary('power')),
    },
    {
      id: 'percent',
      primary: action('%', 'Percent', Cmd.unary('percent')),
    },
  ],
  [
    {
      id: 'sin',
      primary: action('sin', 'Sine', Cmd.unary('sin')),
      shifted: action('asin', 'Arcsine', Cmd.unary('asin')),
    },
    {
      id: 'cos',
      primary: action('cos', 'Cosine', Cmd.unary('cos')),
      shifted: action('acos', 'Arccosine', Cmd.unary('acos')),
    },
    {
      id: 'tan',
      primary: action('tan', 'Tangent', Cmd.unary('tan')),
      shifted: action('atan', 'Arctangent', Cmd.unary('atan')),
    },
    {
      id: 'ln',
      primary: action('ln', 'Natural logarithm', Cmd.unary('ln')),
      shifted: action('eˣ', 'e to the x', Cmd.unary('exp')),
    },
    {
      id: 'log',
      primary: action('log', 'Base-10 logarithm', Cmd.unary('log10')),
      shifted: action('10ˣ', '10 to the x', Cmd.unary('exp10')),
    },
  ],
  [
    {
      id: 'pi',
      primary: action('π', 'Pi', Cmd.constant('pi')),
      shifted: action('e', "Euler's number", Cmd.constant('e')),
    },
    {
      id: 'shift',
      // The shift key's "command" is itself a toggle, so no shift-resolution is
      // needed: it always emits the same command. It is flagged via its id for
      // the active-layer indicator (aria-pressed + class).
      primary: action('shift', 'Shift', Cmd.toggleShift()),
    },
    {
      id: 'backspace',
      primary: action('⌫', 'Backspace', Cmd.backspace()),
      shifted: action('DROP', 'Drop the top stack value', Cmd.stack('drop')),
    },
    {
      id: 'chs',
      primary: action('+/−', 'Change sign', Cmd.chs()),
    },
    {
      id: 'divide',
      primary: action('÷', 'Divide', Cmd.binary('divide')),
    },
  ],
  [
    { id: 'digit-7', primary: action('7', 'Digit 7', Cmd.digit(7)) },
    { id: 'digit-8', primary: action('8', 'Digit 8', Cmd.digit(8)) },
    { id: 'digit-9', primary: action('9', 'Digit 9', Cmd.digit(9)) },
    {
      id: 'multiply',
      primary: action('×', 'Multiply', Cmd.binary('multiply')),
    },
  ],
  [
    { id: 'digit-4', primary: action('4', 'Digit 4', Cmd.digit(4)) },
    { id: 'digit-5', primary: action('5', 'Digit 5', Cmd.digit(5)) },
    { id: 'digit-6', primary: action('6', 'Digit 6', Cmd.digit(6)) },
    {
      id: 'subtract',
      primary: action('−', 'Subtract', Cmd.binary('subtract')),
    },
  ],
  [
    { id: 'digit-1', primary: action('1', 'Digit 1', Cmd.digit(1)) },
    { id: 'digit-2', primary: action('2', 'Digit 2', Cmd.digit(2)) },
    { id: 'digit-3', primary: action('3', 'Digit 3', Cmd.digit(3)) },
    { id: 'add', primary: action('+', 'Add', Cmd.binary('add')) },
  ],
  [
    { id: 'digit-0', primary: action('0', 'Digit 0', Cmd.digit(0)) },
    { id: 'decimal', primary: action('.', 'Decimal point', Cmd.decimal()) },
    {
      id: 'enter',
      primary: action('ENTER', 'Enter', Cmd.enter()),
      className: 'calc-key--wide',
    },
  ],
];

/** The id of the layer-toggle key, special-cased only for its indicator. */
const SHIFT_KEY_ID = 'shift';

/** Options for {@link createKeypad}. */
export interface KeypadOptions {
  /**
   * Invoked with the resolved {@link Command} on every key press. The keypad
   * never applies commands itself — it is purely an input source feeding the
   * shared dispatch path (FR11).
   */
  readonly onCommand: (command: Command) => void;
}

/** Imperative handle returned by {@link createKeypad}. */
export interface KeypadHandle {
  /** The keypad's root element, ready to append to the document. */
  readonly element: HTMLElement;
  /**
   * Reflect the active shift layer: re-renders dual-key labels to their
   * shifted/unshifted form, toggles the shift key's pressed indicator, and
   * controls which command each dual key will emit (FR3). Driven by the owner
   * from the core's `shift` state — the keypad does not flip this on its own.
   */
  setShift(active: boolean): void;
  /** Whether the shift layer is currently shown active. */
  readonly shift: boolean;
}

/**
 * Build the keypad and wire its buttons to `onCommand`.
 *
 * Document-agnostic (nodes are created via `doc`) so it unit-tests against any
 * DOM. Returns a {@link KeypadHandle}; the caller appends `handle.element` and
 * mirrors the core's shift state back via `setShift`.
 */
export function createKeypad(
  doc: Document,
  options: KeypadOptions,
): KeypadHandle {
  let shift = false;

  const root = doc.createElement('div');
  root.className = 'calc-keypad';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Calculator keypad');

  // Per-key updaters, run by setShift to re-render the active label/aria-name.
  const refreshers: ((active: boolean) => void)[] = [];

  for (const row of KEY_ROWS) {
    const rowEl = doc.createElement('div');
    rowEl.className = 'calc-keypad__row';

    for (const spec of row) {
      const { button, refresh } = createKey(doc, spec, options, () => shift);
      refreshers.push(refresh);
      rowEl.append(button);
    }

    root.append(rowEl);
  }

  const setShift = (active: boolean): void => {
    shift = active;
    root.classList.toggle('calc-keypad--shifted', active);
    for (const refresh of refreshers) refresh(active);
  };

  return {
    element: root,
    setShift,
    get shift() {
      return shift;
    },
  };
}

/**
 * Render one key as a native `<button>` (FR22) and return it with a `refresh`
 * that swaps the visible/accessible label to match the shift layer.
 *
 * Command resolution reads the live shift state via `getShift()` at click time,
 * so the emitted command always matches what the user currently sees (FR3).
 */
function createKey(
  doc: Document,
  spec: KeySpec,
  options: KeypadOptions,
  getShift: () => boolean,
): { button: HTMLButtonElement; refresh: (active: boolean) => void } {
  const button = doc.createElement('button');
  // `type="button"` keeps it inert inside any future <form> (no submit).
  button.type = 'button';
  button.className = 'calc-key';
  if (spec.className) button.classList.add(spec.className);
  button.dataset.key = spec.id;

  const labelEl = doc.createElement('span');
  labelEl.className = 'calc-key__label';
  button.append(labelEl);

  // A faint always-visible hint of the shifted function aids discovery of the
  // single shift layer (FR3); absent for keys with no shifted action.
  if (spec.shifted) {
    button.dataset.dual = 'true';
    const hintEl = doc.createElement('span');
    hintEl.className = 'calc-key__shift-hint';
    hintEl.textContent = spec.shifted.label;
    hintEl.setAttribute('aria-hidden', 'true');
    button.append(hintEl);
  }

  if (spec.id === SHIFT_KEY_ID) {
    button.classList.add('calc-key--shift');
    button.setAttribute('aria-pressed', 'false');
  }

  const refresh = (active: boolean): void => {
    const useShifted = active && spec.shifted !== undefined;
    const current = useShifted ? spec.shifted! : spec.primary;
    labelEl.textContent = current.label;
    button.setAttribute('aria-label', current.ariaLabel);
    if (spec.id === SHIFT_KEY_ID) {
      button.setAttribute('aria-pressed', String(active));
    }
  };
  // Initial render in the unshifted layer.
  refresh(false);

  button.addEventListener('click', () => {
    const useShifted = getShift() && spec.shifted !== undefined;
    const command = useShifted ? spec.shifted!.command : spec.primary.command;
    options.onCommand(command);
  });

  return { button, refresh };
}
