// The calculator display: numbered stack window + entry line + angle mode
// (CALC-F04, FR12–FR16).
//
// A presentational component over the command contract. It renders the
// renderable parts of {@link CalcState} — the RPN `stack`, the in-progress
// `entry` line, and the active `angleMode` — and nothing else; it owns no state
// and dispatches no commands. The owner (later, the input-dispatch layer that
// holds the core) calls {@link DisplayHandle.update} with a fresh view after
// every command, and the display re-renders wholesale.
//
// Layout, top to bottom: an always-visible angle-mode label (FR16); a bounded
// 4-level window over the unbounded stack, numbered `…4: 3: 2: 1:` with level
// `1` (the X register) nearest the entry line (FR12); and the command/entry
// line beneath level 1 (FR5). When the stack runs deeper than four levels the
// window scrolls so deeper levels stay reachable while the entry line stays
// pinned in view (FR13). Empty levels render blank, never `0` (FR14); values
// are the raw IEEE-754 `String(n)` with no HP-style formatting (FR15).
//
// Accessibility live-region wiring (FR23/FR24) is a sibling work item; this
// component stays purely visual so the two do not overlap.

import { AngleMode, type CalcState } from '../core/contract.js';

/**
 * The slice of {@link CalcState} this component renders. A `Pick` (not a
 * bespoke shape) so the dispatch layer can hand the whole state straight in —
 * `shift`/`error` are simply ignored here.
 */
export type DisplayState = Pick<CalcState, 'stack' | 'entry' | 'angleMode'>;

/**
 * How many stack levels the window shows at once (FR12). A fixed v0 product
 * choice — a bounded window over an unbounded stack, not a stack-depth cap.
 */
export const VISIBLE_LEVELS = 4;

/**
 * Short display label for each angle mode (FR16). Typed as a total
 * `Record<AngleMode, …>` on purpose: adding `Grads` to the core enum (FR17)
 * turns this into a compile error until a `GRAD` label is supplied, so the
 * window can never silently render a blank mode.
 */
const ANGLE_MODE_LABELS: Readonly<Record<AngleMode, string>> = {
  [AngleMode.Degrees]: 'DEG',
  [AngleMode.Radians]: 'RAD',
};

/** The empty view rendered before the first {@link DisplayHandle.update}. */
const EMPTY_STATE: DisplayState = {
  stack: [],
  entry: '',
  angleMode: AngleMode.Degrees,
};

/** Imperative handle returned by {@link createDisplay}. */
export interface DisplayHandle {
  /** The display's root element, ready to append to the document. */
  readonly element: HTMLElement;
  /**
   * Re-render the whole display from `state`. The stack window is rebuilt and
   * scrolled so level 1 and the entry line are in view; the angle-mode label
   * and entry line are updated in place.
   */
  update(state: DisplayState): void;
}

/**
 * Build the display and render an initial empty state.
 *
 * Document-agnostic (nodes are created via `doc`) so it unit-tests against any
 * DOM. Returns a {@link DisplayHandle}; the caller appends `handle.element` and
 * feeds it fresh state via `update` after every command.
 */
export function createDisplay(doc: Document): DisplayHandle {
  const root = doc.createElement('div');
  root.className = 'calc-display';

  // Always-visible angle-mode label (FR16), at the top of the display.
  const angleLabel = doc.createElement('span');
  angleLabel.className = 'calc-display__angle-mode';

  const header = doc.createElement('div');
  header.className = 'calc-display__header';
  header.append(angleLabel);

  // The bounded, scrollable stack window (FR12/FR13). Rows are rebuilt on every
  // update; the container is clipped to VISIBLE_LEVELS rows and scrolls.
  const stackEl = doc.createElement('div');
  stackEl.className = 'calc-display__stack';

  // The command/entry line, a sibling *below* the scroll container so it is
  // never scrolled out of view however deep the stack grows (FR13).
  const entryValue = doc.createElement('span');
  entryValue.className = 'calc-display__entry-value';

  const entryEl = doc.createElement('div');
  entryEl.className = 'calc-display__entry';
  entryEl.append(entryValue);

  root.append(header, stackEl, entryEl);

  const update = (state: DisplayState): void => {
    angleLabel.textContent = ANGLE_MODE_LABELS[state.angleMode];

    renderStack(doc, stackEl, state.stack);

    entryValue.textContent = state.entry;

    // Pin level 1 / the entry line in view: keep the deepest-visible rows at the
    // bottom of the window so the X register sits next to the entry line, and
    // deeper levels are reached by scrolling up. (No-op under jsdom, which does
    // not lay out; harmless there.)
    stackEl.scrollTop = stackEl.scrollHeight;
  };

  update(EMPTY_STATE);

  return { element: root, update };
}

/**
 * Rebuild the numbered stack rows inside `stackEl` from `stack`.
 *
 * Renders `max(VISIBLE_LEVELS, depth)` rows so the window always shows at least
 * four numbered levels and grows to cover a deeper stack. Rows run top-to-bottom
 * from the highest level number down to `1:` (the X register), matching the
 * window's visual order. A level with no value renders blank, not `0` (FR14).
 */
function renderStack(
  doc: Document,
  stackEl: HTMLElement,
  stack: DisplayState['stack'],
): void {
  // Clear-then-inject: a clean slate keeps re-renders deterministic and lets a
  // repeated identical value re-appear rather than being diffed away.
  stackEl.replaceChildren();

  const levels = Math.max(VISIBLE_LEVELS, stack.length);
  for (let level = levels; level >= 1; level--) {
    // Snapshot index 0 is level 1 (X); level N is index N-1.
    const value = stack[level - 1];

    const row = doc.createElement('div');
    row.className = 'calc-display__level';
    row.dataset.level = String(level);

    const labelEl = doc.createElement('span');
    labelEl.className = 'calc-display__level-label';
    labelEl.textContent = `${level}:`;
    labelEl.setAttribute('aria-hidden', 'true');

    const valueEl = doc.createElement('span');
    valueEl.className = 'calc-display__value';
    // Blank for empty levels (FR14); raw IEEE-754 otherwise (FR15).
    valueEl.textContent = value === undefined ? '' : String(value);

    row.append(labelEl, valueEl);
    stackEl.append(row);
  }
}
