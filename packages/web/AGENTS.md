# AGENTS.md — `@calc/web`

Conventions for the web consumer package. This file governs everything under
`packages/web`; it overrides the [root `AGENTS.md`](../../AGENTS.md) for files
in this package (nearest-wins). The root file still covers the repo-wide
contribution and traceability rules.

## Package overview

`@calc/web` is the web-facing consumer of the calculator. It **may depend on
`@calc/core`** (declared as `workspace:*`); the dependency only ever points
web → core, never the reverse. It is built with [Vite](https://vitejs.dev/) and
targets a browser runtime. Today it is a scaffold with no web UI.

## Build / test / lint / format commands

Run from the repo root with a package filter, or from `packages/web` directly:

```sh
pnpm --filter @calc/web build         # tsc && vite build
pnpm --filter @calc/web test          # vitest run
pnpm --filter @calc/web lint          # eslint src
pnpm --filter @calc/web format        # prettier --write src
pnpm --filter @calc/web format:check  # prettier --check src
```

`pnpm build:web` from the root builds this package (and its `core` dependency
first).

## Code style

- **TypeScript**, ES modules. Type-checked with `tsc`, bundled with Vite.
- Formatting and linting follow the repo-wide Prettier and ESLint config — see
  the root `AGENTS.md`. Run `pnpm format` before committing.
- Browser globals are available here (ESLint enables the browser environment for
  `packages/web`). Depend on `@calc/core` for any UI-agnostic logic rather than
  duplicating it in the web layer.
- Tests are colocated as `*.test.ts` next to the code they cover.
