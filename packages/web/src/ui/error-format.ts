// Accessible-text formatting for the live regions (CALC-F04, FR21/FR23).
//
// The live regions (`live-regions.ts`) need two kinds of human/AT-facing text:
// a contextual sentence that gives a bare stack value meaning ("Stack level 1:
// 42", FR23) and the ready-to-render error string. This module is the single
// place that composes both, so neither the live regions nor the display reach
// into `CalcState`/`CalcError` to assemble text of their own.
//
// The error *wording* itself is owned by `core/errors.ts` (the FR21 strings,
// already mapped from the core's `ErrorKind`); this module only surfaces it, so
// there is one source of truth for the message and one for the framing.

import type { CalcState } from '../core/contract.js';
import type { CalcError } from '../core/errors.js';

/**
 * Contextual announcement for the polite status region (FR23). A bare number is
 * meaningless read aloud, so the value is framed with what it is:
 *
 * - while an entry is in progress → `Entry: <text>` (echoes what is being typed);
 * - otherwise the X register (level 1) → `Stack level 1: <value>`;
 * - an empty stack with no entry → `Stack empty`.
 *
 * Values are the raw IEEE-754 `String(n)` the display shows (FR15) — no HP-style
 * formatting — so the spoken and visible numbers always match.
 */
export function formatStackAnnouncement(state: CalcState): string {
  if (state.entry !== '') return `Entry: ${state.entry}`;
  const top = state.stack[0];
  if (top === undefined) return 'Stack empty';
  return `Stack level 1: ${String(top)}`;
}

/**
 * The text shown inline and announced assertively for an error (FR20/FR21).
 * Identity over the error's already-FR21-correct `message`, kept as a function
 * so callers depend on this seam rather than reading `.message` directly — the
 * one place to adjust error framing for the UI later.
 */
export function formatError(error: CalcError): string {
  return error.message;
}
