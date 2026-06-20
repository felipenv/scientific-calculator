// The accessibility live regions: polite stack announcements + assertive errors
// (CALC-F04, FR20/FR23/FR24).
//
// Two ARIA live regions, both created up front so they exist in the DOM before
// any content lands — a region populated in the same breath it is inserted is
// not reliably announced (FR24):
//
//   • status — `role="status"` (polite), `aria-atomic="true"`. Carries the
//     contextual stack text ("Stack level 1: 42") so screen-reader users hear a
//     bare result with meaning (FR23). Visually hidden: the display already
//     shows the stack, so this region is for assistive tech only.
//   • alert  — `role="alert"` (assertive), `aria-atomic="true"`. Doubles as the
//     visible inline error message in the status/entry area (FR20) and the
//     assertive announcement; one element, so the seen and spoken error agree.
//
// Clear-then-inject (FR24). A live region only re-announces when its content
// *changes*, so an identical repeated result (common in RPN) would be silent if
// written straight over the same text. Every announcement therefore clears the
// region first, then injects the text on a later turn via the injected
// `schedule`. The default schedule is synchronous (one source of truth, trivial
// to test); a browser host can pass a `requestAnimationFrame`/`setTimeout`
// schedule so the clear and the inject land in separate frames and assistive
// tech observes a real change. The error region is cleared synchronously — an
// empty region announces nothing, so no deferral is needed to silence it.

import type { CalcState } from '../core/contract.js';
import { formatError, formatStackAnnouncement } from './error-format.js';

/** Schedule the inject half of a clear-then-inject; default runs it at once. */
export type Schedule = (inject: () => void) => void;

/** Options for {@link createLiveRegions}. */
export interface LiveRegionsOptions {
  /**
   * How to defer the inject after the synchronous clear (FR24). Defaults to
   * running it immediately. Pass a frame-deferring scheduler in the browser so
   * the clear and inject are separate mutations and AT re-announces.
   */
  readonly schedule?: Schedule;
}

/** Imperative handle returned by {@link createLiveRegions}. */
export interface LiveRegionsHandle {
  /** The container holding both regions, ready to append to the document. */
  readonly element: HTMLElement;
  /** The polite `role="status"` region (visually hidden). */
  readonly status: HTMLElement;
  /** The assertive `role="alert"` region (visible inline error). */
  readonly alert: HTMLElement;
  /**
   * Re-render both regions from `state` (the live-region half of the render
   * path). On error: show it assertively and leave the polite region as-is (the
   * stack did not change). Otherwise: clear any error and announce the stack.
   */
  update(state: CalcState): void;
  /** Announce contextual stack text politely, via clear-then-inject (FR23/FR24). */
  announce(message: string): void;
  /** Show an error assertively + inline, via clear-then-inject (FR20). */
  showError(message: string): void;
  /** Empty the error region (announces nothing). */
  clearError(): void;
}

/**
 * Build the two live regions and return a handle over them.
 *
 * Document-agnostic (nodes are created via `doc`) so it unit-tests against any
 * DOM. The regions are appended to a container the caller mounts; both already
 * carry their roles/atomic attributes so they are live from the first paint.
 */
export function createLiveRegions(
  doc: Document,
  options: LiveRegionsOptions = {},
): LiveRegionsHandle {
  const schedule: Schedule = options.schedule ?? ((inject) => inject());

  const root = doc.createElement('div');
  root.className = 'calc-live-regions';

  // Polite, atomic, screen-reader-only: meaning for a bare number (FR23).
  const status = doc.createElement('div');
  status.className = 'calc-sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');

  // Assertive, atomic, visible: the inline transient error (FR20).
  const alert = doc.createElement('div');
  alert.className = 'calc-live-error';
  alert.setAttribute('role', 'alert');
  alert.setAttribute('aria-atomic', 'true');

  root.append(status, alert);

  /** Clear `region` now, then inject `text` on the scheduled turn (FR24). */
  const reannounce = (region: HTMLElement, text: string): void => {
    region.textContent = '';
    schedule(() => {
      region.textContent = text;
    });
  };

  const announce = (message: string): void => reannounce(status, message);
  const showError = (message: string): void => reannounce(alert, message);
  const clearError = (): void => {
    alert.textContent = '';
  };

  const update = (state: CalcState): void => {
    if (state.error) {
      // Non-destructive: the stack is unchanged, so only the error speaks.
      showError(formatError(state.error));
      return;
    }
    // A fresh command dismisses any prior error (FR20) and re-announces the
    // current stack — re-announced even when identical to last time (FR24).
    clearError();
    announce(formatStackAnnouncement(state));
  };

  return {
    element: root,
    status,
    alert,
    update,
    announce,
    showError,
    clearError,
  };
}
