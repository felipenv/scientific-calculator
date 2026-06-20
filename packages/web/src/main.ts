// @calc/web — application entry (CALC-F01-W09).
//
// Bootstraps the (intentionally empty) calculator app shell. This is scaffolding
// only: it renders a titled, labelled container with NO calculator UI inside.
// The keypad, stack display, angle-mode label, and input dispatch arrive in
// later web features (CALC-F04+). This module exists so the Vite build, the dev
// server, and the test suite have a real DOM mount point to grow into.

import './styles.css';

/** Id of the mount element declared in `index.html`. */
export const MOUNT_ID = 'app';

/**
 * Render the empty app shell into `root`, replacing any existing content.
 *
 * Kept side-effect-free and document-agnostic (it creates nodes via
 * `root.ownerDocument`) so it can be unit-tested against any DOM. Returns the
 * shell element that was mounted.
 */
export function renderShell(root: HTMLElement): HTMLElement {
  const doc = root.ownerDocument;

  // Clear-then-inject: later features re-render here, and a clean slate keeps
  // re-renders deterministic. Safe on an already-empty root.
  root.replaceChildren();

  const shell = doc.createElement('main');
  shell.className = 'calc-shell';
  shell.setAttribute('aria-label', 'Scientific calculator');

  const title = doc.createElement('h1');
  title.className = 'calc-shell__title';
  title.textContent = 'Scientific Calculator';
  shell.append(title);

  root.append(shell);
  return shell;
}

/**
 * Locate the mount element and render the shell into it.
 *
 * Returns the mounted shell, or `null` when no mount element is present (e.g.
 * when the module is imported in a test document that has no `#app`).
 */
export function mount(doc: Document): HTMLElement | null {
  const root = doc.getElementById(MOUNT_ID);
  return root ? renderShell(root) : null;
}

// Bootstrap on load. Guarded so importing this module in a DOM-less or
// `#app`-less context (such as a unit test) is a harmless no-op.
if (typeof document !== 'undefined') {
  mount(document);
}
