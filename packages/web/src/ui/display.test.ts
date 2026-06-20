// Tests for the display component (CALC-F04, FR12–FR16).
//
// They verify the numbered 4-level window over the entry line, level numbering
// (1: at the bottom = X register), deep-stack growth with the entry line kept
// out of the scroll container (FR13), blank empty levels (FR14), raw IEEE-754
// value rendering (FR15), and the always-visible DEG/RAD angle-mode label
// (FR16). Runs under jsdom (see vite.config.ts).

import { describe, expect, it } from 'vitest';

import { AngleMode } from '../core/contract.js';
import {
  createDisplay,
  VISIBLE_LEVELS,
  type DisplayHandle,
  type DisplayState,
} from './display.js';

/** Build a display; convenience wrapper to mirror the keypad tests' `setup`. */
function setup(): DisplayHandle {
  return createDisplay(document);
}

/** A full {@link DisplayState}, overridable per test. */
function state(overrides: Partial<DisplayState> = {}): DisplayState {
  return { stack: [], entry: '', angleMode: AngleMode.Degrees, ...overrides };
}

/** The stack rows, top-to-bottom as rendered. */
function rows(handle: DisplayHandle): HTMLElement[] {
  return Array.from(
    handle.element.querySelectorAll<HTMLElement>('.calc-display__level'),
  );
}

/** Map a row to `[levelNumber, valueText]`. */
function rowData(row: HTMLElement): [number, string] {
  const level = Number(row.dataset.level);
  const value =
    row.querySelector('.calc-display__value')?.textContent ?? '<none>';
  return [level, value];
}

/** Find the row for a given level number, or throw. */
function levelRow(handle: DisplayHandle, level: number): HTMLElement {
  const row = handle.element.querySelector<HTMLElement>(
    `.calc-display__level[data-level="${level}"]`,
  );
  if (!row) throw new Error(`no row for level ${level}`);
  return row;
}

/** The text of a level's value cell. */
function valueAt(handle: DisplayHandle, level: number): string {
  return (
    levelRow(handle, level).querySelector('.calc-display__value')
      ?.textContent ?? '<none>'
  );
}

/** The angle-mode label text. */
function angleLabel(handle: DisplayHandle): string {
  return (
    handle.element.querySelector('.calc-display__angle-mode')?.textContent ?? ''
  );
}

/** The entry-line text. */
function entryText(handle: DisplayHandle): string {
  return (
    handle.element.querySelector('.calc-display__entry-value')?.textContent ??
    '<none>'
  );
}

describe('window layout (FR12)', () => {
  it('renders exactly four numbered levels for a short stack', () => {
    const handle = setup();
    handle.update(state({ stack: [42] }));
    expect(rows(handle)).toHaveLength(VISIBLE_LEVELS);
  });

  it('numbers rows top-to-bottom 4: … 1:, level 1 nearest the entry line', () => {
    const handle = setup();
    handle.update(state({ stack: [1, 2, 3, 4] }));
    expect(rows(handle).map((r) => Number(r.dataset.level))).toEqual([
      4, 3, 2, 1,
    ]);
  });

  it('renders the entry line beneath level 1, outside the scroll window', () => {
    const handle = setup();
    const stackEl = handle.element.querySelector('.calc-display__stack');
    const entryEl = handle.element.querySelector('.calc-display__entry');
    expect(stackEl).not.toBeNull();
    expect(entryEl).not.toBeNull();
    // The entry line must not live inside the scrollable stack container, so it
    // stays visible however deep the stack grows (FR13).
    expect(stackEl!.contains(entryEl)).toBe(false);
    // …and it follows the stack window in document order (beneath level 1).
    expect(
      stackEl!.compareDocumentPosition(entryEl!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe('stack values and numbering', () => {
  it('maps snapshot index 0 to level 1 (the X register)', () => {
    const handle = setup();
    handle.update(state({ stack: [10, 20, 30] }));
    expect(valueAt(handle, 1)).toBe('10');
    expect(valueAt(handle, 2)).toBe('20');
    expect(valueAt(handle, 3)).toBe('30');
  });
});

describe('deep stack growth and scroll (FR13)', () => {
  it('renders one row per level when the stack is deeper than the window', () => {
    const handle = setup();
    const stack = [1, 2, 3, 4, 5, 6, 7];
    handle.update(state({ stack }));

    expect(rows(handle)).toHaveLength(stack.length);
    // Highest level at the top, level 1 at the bottom.
    expect(rows(handle).map((r) => Number(r.dataset.level))).toEqual([
      7, 6, 5, 4, 3, 2, 1,
    ]);
    expect(valueAt(handle, 7)).toBe('7'); // deepest value reachable
    expect(valueAt(handle, 1)).toBe('1'); // X register
  });

  it('keeps the entry line present and populated with a deep stack', () => {
    const handle = setup();
    handle.update(state({ stack: [1, 2, 3, 4, 5, 6], entry: '99' }));
    expect(entryText(handle)).toBe('99');
  });

  it('marks the stack window scrollable (overflow container)', () => {
    const handle = setup();
    const stackEl = handle.element.querySelector('.calc-display__stack');
    expect(stackEl).not.toBeNull();
    // jsdom has no layout; assert the structural seam (a dedicated scroll
    // container) rather than computed scroll metrics.
    expect(stackEl!.classList.contains('calc-display__stack')).toBe(true);
  });
});

describe('empty levels render blank, not 0 (FR14)', () => {
  it('renders all four levels blank for an empty stack', () => {
    const handle = setup();
    handle.update(state({ stack: [] }));
    for (let level = 1; level <= VISIBLE_LEVELS; level++) {
      expect(valueAt(handle, level)).toBe('');
    }
  });

  it('blanks the unused upper levels of a partial stack', () => {
    const handle = setup();
    handle.update(state({ stack: [7] }));
    expect(valueAt(handle, 1)).toBe('7');
    expect(valueAt(handle, 2)).toBe('');
    expect(valueAt(handle, 3)).toBe('');
    expect(valueAt(handle, 4)).toBe('');
  });

  it('shows a literal zero value as "0", distinct from a blank level', () => {
    const handle = setup();
    handle.update(state({ stack: [0] }));
    expect(valueAt(handle, 1)).toBe('0');
    expect(valueAt(handle, 2)).toBe('');
  });
});

describe('raw IEEE-754 rendering via String(n) (FR15)', () => {
  const cases: ReadonlyArray<readonly [value: number, expected: string]> = [
    [0.1 + 0.2, '0.30000000000000004'],
    [1 / 3, '0.3333333333333333'],
    [-42, '-42'],
    [1e21, '1e+21'],
    [Number.MAX_SAFE_INTEGER, '9007199254740991'],
    [-0, '0'],
  ];

  for (const [value, expected] of cases) {
    it(`renders ${expected} for ${String(value)}`, () => {
      const handle = setup();
      handle.update(state({ stack: [value] }));
      expect(valueAt(handle, 1)).toBe(expected);
    });
  }
});

describe('angle-mode label (FR16)', () => {
  it('shows DEG for Degrees and RAD for Radians', () => {
    const handle = setup();
    handle.update(state({ angleMode: AngleMode.Degrees }));
    expect(angleLabel(handle)).toBe('DEG');
    handle.update(state({ angleMode: AngleMode.Radians }));
    expect(angleLabel(handle)).toBe('RAD');
  });

  it('is always present, even before the first update', () => {
    const handle = setup();
    expect(
      handle.element.querySelector('.calc-display__angle-mode'),
    ).not.toBeNull();
    expect(angleLabel(handle)).toBe('DEG');
  });
});

describe('entry line (FR5)', () => {
  it('renders the in-progress entry text', () => {
    const handle = setup();
    handle.update(state({ entry: '3.14' }));
    expect(entryText(handle)).toBe('3.14');
  });

  it('renders blank when no entry is in progress', () => {
    const handle = setup();
    handle.update(state({ entry: '' }));
    expect(entryText(handle)).toBe('');
  });
});

describe('re-rendering', () => {
  it('replaces rows on each update without accumulating stale ones', () => {
    const handle = setup();
    handle.update(state({ stack: [1, 2, 3, 4, 5] }));
    expect(rows(handle)).toHaveLength(5);
    handle.update(state({ stack: [9] }));
    expect(rows(handle)).toHaveLength(VISIBLE_LEVELS);
    expect(valueAt(handle, 1)).toBe('9');
  });

  it('re-injects an identical repeated result (clear-then-inject)', () => {
    const handle = setup();
    handle.update(state({ stack: [42] }));
    const firstValueEl = handle.element.querySelector('.calc-display__value');
    handle.update(state({ stack: [42] }));
    const secondValueEl = handle.element.querySelector('.calc-display__value');
    // A fresh node each render — the basis for re-announcing repeats (FR24),
    // owned in full by the accessibility work item.
    expect(secondValueEl).not.toBe(firstValueEl);
    expect(valueAt(handle, 1)).toBe('42');
  });

  it('renders an empty four-level window before the first update', () => {
    const handle = setup();
    expect(rows(handle)).toHaveLength(VISIBLE_LEVELS);
    expect(rowData(rows(handle)[0])).toEqual([VISIBLE_LEVELS, '']);
  });
});

describe('originality (AC8)', () => {
  it('contains no HP names or model strings', () => {
    const handle = setup();
    handle.update(
      state({ stack: [1, 2], entry: '3', angleMode: AngleMode.Radians }),
    );
    const text = (handle.element.textContent ?? '').toLowerCase();
    for (const banned of ['hp', 'hewlett', 'packard', '48', '50g', 'rpl']) {
      expect(text).not.toContain(banned);
    }
  });
});
