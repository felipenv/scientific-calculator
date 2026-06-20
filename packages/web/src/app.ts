// @calc/web — application composition root (CALC-F04).
//
// The wiring that turns the standalone pieces into a working calculator: it
// constructs the core, the display, and the keypad, then joins them through the
// shared dispatch controller so on-screen clicks and physical keystrokes follow
// one command path (FR11/AC2). This is the only module that knows about all the
// parts at once; each part still depends only on the command contract.
//
// It supersedes the v0 empty shell (`main.ts`) as the browser entry — see
// `index.html`. Kept document-agnostic (`createApp(doc)`) so the assembled app
// can be exercised in tests, with a guarded self-bootstrap for the real page.

import './styles.css';
import './ui/display.css';
import './ui/keypad.css';

import { StubCalculatorCore } from './core/stub-core.js';
import { createDispatch, type DispatchController } from './input/dispatch.js';
import { createDisplay } from './ui/display.js';
import { createKeypad } from './ui/keypad.js';
import { createLiveRegions } from './ui/live-regions.js';

/** Id of the mount element declared in `index.html`. */
export const MOUNT_ID = 'app';

/** The assembled calculator: its root element plus the dispatch controller. */
export interface AppHandle {
  /** The root element, ready to append to the document. */
  readonly element: HTMLElement;
  /** The shared dispatch controller wiring both input methods to the core. */
  readonly controller: DispatchController;
}

/**
 * Build the full calculator UI and wire it to a fresh core.
 *
 * Assembles a titled shell containing the display, the accessibility live
 * regions, and the keypad. The keypad
 * forwards every key press to {@link DispatchController.dispatch}; the keyboard
 * is NOT attached here (the caller chooses the target via
 * {@link DispatchController.attachKeyboard}), keeping this pure and testable.
 */
export function createApp(doc: Document): AppHandle {
  const shell = doc.createElement('main');
  shell.className = 'calc-shell';
  shell.setAttribute('aria-label', 'Scientific calculator');

  const title = doc.createElement('h1');
  title.className = 'calc-shell__title';
  title.textContent = 'Scientific Calculator';

  const display = createDisplay(doc);
  // The accessibility live regions sit in the status/entry area between the
  // display and the keypad: the assertive region doubles as the visible inline
  // error (FR20), and both regions exist in the DOM from first paint (FR24).
  const liveRegions = createLiveRegions(doc);
  const keypad = createKeypad(doc, {
    // Single shared path: a click becomes a command dispatched exactly as a
    // keystroke is. `controller` is assigned just below, before any click.
    onCommand: (command) => controller.dispatch(command),
  });

  const core = new StubCalculatorCore();
  const controller = createDispatch({ core, display, keypad, liveRegions });

  shell.append(title, display.element, liveRegions.element, keypad.element);

  return { element: shell, controller };
}

/**
 * Mount the calculator into the document's `#app` element and start listening
 * for keystrokes on the document (the global `keydown` handler, FR10).
 *
 * Returns the {@link AppHandle}, or `null` when no mount element is present
 * (e.g. a test document without `#app`).
 */
export function mountApp(doc: Document): AppHandle | null {
  const root = doc.getElementById(MOUNT_ID);
  if (!root) return null;

  const app = createApp(doc);
  // Clear-then-inject so re-mounting is deterministic and replaces the shell.
  root.replaceChildren(app.element);
  app.controller.attachKeyboard(doc);
  return app;
}

// Bootstrap on load. Guarded so importing this module in a DOM-less or
// `#app`-less context (such as a unit test) is a harmless no-op.
if (typeof document !== 'undefined') {
  mountApp(document);
}
