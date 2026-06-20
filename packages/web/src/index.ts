// @calc/web — web consumer package entrypoint.
//
// Placeholder only: this package carries NO calculator UI yet. The web interface
// arrives in a later feature (CALC-F04). This module exists solely to establish
// the buildable core/web seam (CALC-F01): web may consume @calc/core, never the
// reverse.

import { CORE_PACKAGE } from '@calc/core';

/** Scaffolding marker proving web can consume the core package across the seam. */
export const WEB_PACKAGE = '@calc/web' as const;

/** Re-exported here only to verify the core->web import boundary compiles. */
export const CONSUMED_CORE = CORE_PACKAGE;
