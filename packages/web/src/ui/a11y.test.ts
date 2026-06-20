// Accessibility-baseline tests (CALC-F04, FR22–FR24, AC7).
//
// Two halves. First, the assembled app: the live regions pre-exist in the DOM
// with the right roles before any input (FR24), and the keypad's keys are
// native, focusable <button>s with a focus the browser can place (FR22).
// Second, a dispatch harness wired exactly like the app but with a manual
// scheduler, so the clear-then-inject re-announcement of an identical result
// (FR24/AC7) can be observed through the real render path. Runs under jsdom.

import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { Cmd } from '../core/contract.js';
import { StubCalculatorCore } from '../core/stub-core.js';
import { createDispatch } from '../input/dispatch.js';
import { createDisplay } from './display.js';
import { createKeypad, type KeypadHandle } from './keypad.js';
import { createLiveRegions, type Schedule } from './live-regions.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('live regions pre-exist with correct ARIA (FR23/FR24/AC7)', () => {
  it('mounts a polite atomic status region and an assertive alert region', () => {
    const app = createApp(document);

    const status = app.element.querySelector('[role="status"]');
    const alert = app.element.querySelector('[role="alert"]');

    expect(status).not.toBeNull();
    expect(alert).not.toBeNull();
    expect(status!.getAttribute('aria-atomic')).toBe('true');
    expect(alert!.getAttribute('aria-atomic')).toBe('true');

    // Present before any command is dispatched (regions exist up front).
    expect(alert!.textContent).toBe('');
  });
});

describe('keypad keys are native, focusable buttons (FR22/AC7)', () => {
  it('renders every key as a <button> that can take focus', () => {
    const app = createApp(document);
    document.body.append(app.element);

    const buttons = Array.from(
      app.element.querySelectorAll<HTMLElement>('.calc-key'),
    );
    expect(buttons.length).toBeGreaterThan(0);

    for (const button of buttons) {
      expect(button.tagName).toBe('BUTTON');
      // Native buttons are keyboard-focusable (not removed from tab order).
      expect(button.tabIndex).not.toBe(-1);
    }

    // The browser can actually place focus on a key (focus visibility, FR22).
    const first = buttons[0]!;
    first.focus();
    expect(document.activeElement).toBe(first);
  });
});

/** A scheduler that queues injects so a test runs them on demand. */
function manualSchedule(): { schedule: Schedule; flush: () => void } {
  const pending: (() => void)[] = [];
  return {
    schedule: (inject) => pending.push(inject),
    flush: () => {
      while (pending.length > 0) pending.shift()!();
    },
  };
}

/** Wire core + display + keypad + live regions exactly as `app.ts` does. */
function harness(schedule: Schedule): {
  keypad: KeypadHandle;
  status: HTMLElement;
  dispatch: ReturnType<typeof createDispatch>['dispatch'];
} {
  const core = new StubCalculatorCore();
  const display = createDisplay(document);
  const liveRegions = createLiveRegions(document, { schedule });
  const keypad = createKeypad(document, {
    onCommand: (command) => controller.dispatch(command),
  });
  const controller = createDispatch({ core, display, keypad, liveRegions });
  return { keypad, status: liveRegions.status, dispatch: controller.dispatch };
}

describe('repeated identical result re-announces through dispatch (FR24/AC7)', () => {
  it('clears then re-injects the same contextual text on each render', () => {
    const { schedule, flush } = manualSchedule();
    const { status, dispatch } = harness(schedule);

    // 4, ENTER → X = 4.
    dispatch(Cmd.digit(4));
    dispatch(Cmd.enter());
    flush();
    expect(status.textContent).toBe('Stack level 1: 4');

    // DUP leaves X at the identical value 4. The render must clear-then-inject
    // so assistive tech re-announces the (unchanged) result rather than staying
    // silent on a no-op text write.
    dispatch(Cmd.stack('dup'));
    expect(status.textContent).toBe(''); // cleared synchronously, inject pending
    flush();
    expect(status.textContent).toBe('Stack level 1: 4'); // re-announced
  });
});
