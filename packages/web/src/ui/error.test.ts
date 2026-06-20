// Integration tests for non-destructive error surfacing (CALC-F04, FR19–FR21,
// AC5). Drives the fully-wired app (real core + dispatch + display + keypad +
// live regions) so the error path is exercised end to end: each of the four
// FR21 classes surfaces the exact message in the visible/assertive region, the
// stack and operands are left untouched, no NaN/Inf is ever pushed, nothing
// throws, and the next keypress dismisses the message. Runs under jsdom.

import { describe, expect, it } from 'vitest';

import { createApp, type AppHandle } from '../app.js';
import { Cmd, type Command } from '../core/contract.js';

/** The assertive `role="alert"` element inside an assembled app. */
function alertOf(app: AppHandle): HTMLElement {
  const el = app.element.querySelector<HTMLElement>('[role="alert"]');
  if (!el) throw new Error('no role="alert" region in the app');
  return el;
}

/** The current stack as a plain array (copied out of the readonly view). */
function stackOf(app: AppHandle): number[] {
  return Array.from(app.controller.state.stack);
}

/** Dispatch a sequence of commands through the shared path. */
function run(app: AppHandle, ...commands: Command[]): void {
  for (const command of commands) app.controller.dispatch(command);
}

/**
 * Each FR21 error class, with a command sequence that provokes it and the
 * stack expected to remain after the failing op (proving non-destructiveness).
 */
const CASES = [
  {
    name: 'divide-by-zero',
    code: 'DIV_ZERO',
    message: 'Error: Divide by 0',
    // 0 onto the stack, then 1/x → reciprocal of zero.
    setup: [Cmd.digit(0), Cmd.enter()],
    failing: Cmd.unary('reciprocal'),
    expectedStack: [0],
  },
  {
    name: 'domain (√ of a negative)',
    code: 'DOMAIN',
    message: 'Error: Undefined',
    // -1 onto the stack, then √x.
    setup: [Cmd.digit(1), Cmd.chs(), Cmd.enter()],
    failing: Cmd.unary('sqrt'),
    expectedStack: [-1],
  },
  {
    name: 'overflow (eˣ beyond the double range)',
    code: 'OVERFLOW',
    message: 'Error: Overflow',
    // 1000 onto the stack, then eˣ → e^1000 overflows to a non-finite result.
    setup: [
      Cmd.digit(1),
      Cmd.digit(0),
      Cmd.digit(0),
      Cmd.digit(0),
      Cmd.enter(),
    ],
    failing: Cmd.unary('exp'),
    expectedStack: [1000],
  },
  {
    name: 'underflow (operator with too few operands)',
    code: 'UNDERFLOW',
    message: 'Error: Stack underflow (Too Few Arguments)',
    // A single value on the stack, then a binary add (needs two).
    setup: [Cmd.digit(5), Cmd.enter()],
    failing: Cmd.binary('add'),
    expectedStack: [5],
  },
] as const;

describe('non-destructive error surfacing (AC5)', () => {
  for (const c of CASES) {
    describe(c.name, () => {
      it('surfaces the exact FR21 message without mutating the stack', () => {
        const app = createApp(document);
        run(app, ...c.setup);
        const before = stackOf(app);

        expect(() => run(app, c.failing)).not.toThrow();

        const state = app.controller.state;
        expect(state.error?.code).toBe(c.code);
        expect(state.error?.message).toBe(c.message);

        // Stack is byte-for-byte unchanged (operands not consumed, FR19).
        expect(stackOf(app)).toEqual(before);
        expect(stackOf(app)).toEqual([...c.expectedStack]);

        // No NaN/Inf ever reached the stack (FR19).
        expect(stackOf(app).every((n) => Number.isFinite(n))).toBe(true);

        // The message is visible inline in the assertive region (FR20).
        expect(alertOf(app).textContent).toBe(c.message);
      });

      it('dismisses the message on the next keypress, then proceeds (FR20)', () => {
        const app = createApp(document);
        run(app, ...c.setup, c.failing);
        expect(app.controller.state.error).not.toBeNull();

        // The next key clears the error and is otherwise processed normally.
        run(app, Cmd.digit(7));
        expect(app.controller.state.error).toBeNull();
        expect(alertOf(app).textContent).toBe('');
        expect(app.controller.state.entry).toBe('7');
      });
    });
  }
});
