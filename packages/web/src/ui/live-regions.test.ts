// Tests for the accessibility live regions (CALC-F04, FR20/FR23/FR24).
//
// Covered: both regions exist in the DOM with the right ARIA roles/atomicity
// before any content lands (FR24); the polite region carries contextual stack
// text (FR23); the assertive region carries errors (FR20); and the headline —
// clear-then-inject so an *identical* repeated result re-announces (FR24),
// proven with a manual scheduler that exposes the clear/inject ordering.

import { describe, expect, it } from 'vitest';

import { AngleMode, type CalcState } from '../core/contract.js';
import { calcError } from '../core/errors.js';
import { createLiveRegions, type Schedule } from './live-regions.js';

/** Build a CalcState with defaults, overriding only what a test needs. */
function state(overrides: Partial<CalcState> = {}): CalcState {
  return {
    stack: [],
    entry: '',
    angleMode: AngleMode.Degrees,
    shift: false,
    error: null,
    ...overrides,
  };
}

/** A scheduler that queues injects so a test can run them on demand. */
function manualSchedule(): { schedule: Schedule; flush: () => void } {
  const pending: (() => void)[] = [];
  return {
    schedule: (inject) => pending.push(inject),
    flush: () => {
      // Drain in FIFO order, allowing for injects queued during a flush.
      while (pending.length > 0) pending.shift()!();
    },
  };
}

describe('live regions exist with correct ARIA before content (FR24)', () => {
  it('creates a polite atomic status region and an assertive atomic alert', () => {
    const lr = createLiveRegions(document);

    expect(lr.status.getAttribute('role')).toBe('status');
    expect(lr.status.getAttribute('aria-atomic')).toBe('true');

    expect(lr.alert.getAttribute('role')).toBe('alert');
    expect(lr.alert.getAttribute('aria-atomic')).toBe('true');

    // Both are already mounted in the container (pre-exist in the DOM).
    expect(lr.element.contains(lr.status)).toBe(true);
    expect(lr.element.contains(lr.alert)).toBe(true);

    // The polite region is visually hidden (the display shows the stack).
    expect(lr.status.classList.contains('calc-sr-only')).toBe(true);
  });
});

describe('announcing the stack politely (FR23)', () => {
  it('puts contextual stack text in the status region, not the alert', () => {
    const lr = createLiveRegions(document);
    lr.update(state({ stack: [42] }));

    expect(lr.status.textContent).toBe('Stack level 1: 42');
    expect(lr.alert.textContent).toBe('');
  });
});

describe('clear-then-inject re-announces identical results (FR24)', () => {
  it('clears the region first, then injects on the scheduled turn', () => {
    const { schedule, flush } = manualSchedule();
    const lr = createLiveRegions(document, { schedule });

    lr.announce('Stack level 1: 7');
    // Cleared synchronously; the inject is deferred to the scheduler.
    expect(lr.status.textContent).toBe('');
    flush();
    expect(lr.status.textContent).toBe('Stack level 1: 7');

    // The SAME text again must still clear-then-inject (so AT re-announces),
    // rather than being a no-op because the content did not change.
    lr.announce('Stack level 1: 7');
    expect(lr.status.textContent).toBe('');
    flush();
    expect(lr.status.textContent).toBe('Stack level 1: 7');
  });
});

describe('errors announce assertively and non-destructively (FR20)', () => {
  it('shows the error in the alert region and leaves the status untouched', () => {
    const lr = createLiveRegions(document);

    // Seed a prior polite announcement.
    lr.update(state({ stack: [5] }));
    expect(lr.status.textContent).toBe('Stack level 1: 5');

    // An errored state speaks only the error; the stack readout is left as-is.
    lr.update(state({ stack: [5], error: calcError('DIV_ZERO') }));
    expect(lr.alert.textContent).toBe('Error: Divide by 0');
    expect(lr.status.textContent).toBe('Stack level 1: 5');
  });

  it('clears the error on the next, error-free update (next-key dismissal)', () => {
    const lr = createLiveRegions(document);
    lr.update(state({ stack: [5], error: calcError('OVERFLOW') }));
    expect(lr.alert.textContent).toBe('Error: Overflow');

    lr.update(state({ stack: [5], entry: '1' }));
    expect(lr.alert.textContent).toBe('');
    expect(lr.status.textContent).toBe('Entry: 1');
  });
});
