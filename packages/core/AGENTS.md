# AGENTS.md — `@calc/core`

Conventions for the UI-agnostic calculator core. This file governs everything
under `packages/core`; it overrides the [root `AGENTS.md`](../../AGENTS.md) for
files in this package (nearest-wins). The root file still covers the repo-wide
contribution and traceability rules.

## Package overview

`@calc/core` is the UI-agnostic library at the heart of the calculator. It holds
the calculator logic (arriving in later features) and **must never depend on the
web package or on any web/UI runtime** (no DOM, no browser globals). Keeping it
host-neutral lets it run in a web app, a CLI, or tests unchanged. It builds and
tests in isolation. Today it is a scaffold with no calculator behavior.

## Build / test / lint / format commands

Run from the repo root with a package filter, or from `packages/core` directly:

```sh
pnpm --filter @calc/core build         # tsc -b
pnpm --filter @calc/core test          # vitest run
pnpm --filter @calc/core lint          # eslint src
pnpm --filter @calc/core format        # prettier --write src
pnpm --filter @calc/core format:check  # prettier --check src
```

`pnpm build:core` from the root is a shortcut for the build.

## Code style

- **TypeScript**, ES modules. Compiled with TypeScript project references
  (`tsc -b`); output goes to `dist/`.
- Formatting and linting follow the repo-wide Prettier and ESLint config — see
  the root `AGENTS.md`. Run `pnpm format` before committing.
- **No web/UI runtime.** ESLint enforces the boundary: importing from
  `@calc/web` (by package name or relative path) is an error here. Do not reach
  for the DOM or other browser-only APIs.
- Tests are colocated as `*.test.ts` next to the code they cover.
