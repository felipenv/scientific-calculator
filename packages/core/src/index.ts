// @calc/core — UI-agnostic core library entrypoint.
//
// Placeholder only: this package carries NO calculator behavior yet. Arithmetic,
// scientific functions, and the RPN engine arrive in later features (CALC-F02+).
// This module exists solely to establish the buildable core/web seam (CALC-F01).
//
// Invariant: this package must never import a web/UI runtime (e.g. the DOM).

/** Scaffolding marker proving the core package builds and is importable. */
export const CORE_PACKAGE = '@calc/core' as const;
