// App-shell scaffolding tests for @calc/web (CALC-F01-W09).
//
// Verifies that the empty shell mounts into a DOM. NO calculator behavior is
// asserted — the UI arrives in later web features. Runs under the jsdom test
// environment (see vite.config.ts).

import { describe, expect, it } from 'vitest';

import { MOUNT_ID, mount, renderShell } from './main.js';

describe('@calc/web app shell', () => {
  it('renders the empty shell into the given root', () => {
    const root = document.createElement('div');
    const shell = renderShell(root);

    expect(shell.tagName).toBe('MAIN');
    expect(shell.classList.contains('calc-shell')).toBe(true);
    expect(root.contains(shell)).toBe(true);
    expect(shell.getAttribute('aria-label')).toBe('Scientific calculator');
    expect(shell.querySelector('.calc-shell__title')?.textContent).toBe(
      'Scientific Calculator',
    );
  });

  it('holds no calculator UI yet (empty shell)', () => {
    const root = document.createElement('div');
    const shell = renderShell(root);

    // Only the title; no keypad/display/buttons in the v0 scaffold.
    expect(shell.querySelectorAll('button').length).toBe(0);
    expect(shell.children).toHaveLength(1);
  });

  it('clear-then-injects, replacing any prior content', () => {
    const root = document.createElement('div');
    root.append(document.createElement('span'));
    root.append(document.createElement('span'));

    renderShell(root);

    expect(root.querySelectorAll('span')).toHaveLength(0);
    expect(root.querySelectorAll('.calc-shell')).toHaveLength(1);
  });

  it('mount() renders into the document #app element', () => {
    const root = document.createElement('div');
    root.id = MOUNT_ID;
    document.body.append(root);

    try {
      const shell = mount(document);
      expect(shell).not.toBeNull();
      expect(root.querySelector('.calc-shell')).toBe(shell);
    } finally {
      root.remove();
    }
  });

  it('mount() is a no-op when no mount element is present', () => {
    const empty = document.implementation.createHTMLDocument('empty');
    expect(mount(empty)).toBeNull();
  });
});
