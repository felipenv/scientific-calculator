# Scientific Calculator

A scientific calculator built as a small, reviewable, fully traceable monorepo.
This repository is being delivered feature by feature; the current state is the
**project scaffold only** — there is no calculator behavior yet.

## Repository layout

This is a [pnpm](https://pnpm.io/) workspace with two boundaried packages:

| Package          | Path             | Role                                                      |
| ---------------- | ---------------- | --------------------------------------------------------- |
| `@calc/core`     | `packages/core`  | UI-agnostic calculator core. No web/UI runtime, ever.     |
| `@calc/web`      | `packages/web`   | Web consumer. May depend on `@calc/core`; never reversed. |

The core/web boundary is the seam later features build on:

- `@calc/core` carries the calculator logic (arriving in later features) and must
  never import a web/UI runtime such as the DOM.
- `@calc/web` is free to depend on `@calc/core`. The dependency only ever points
  **web → core**, so the core stays reusable in any host (web, CLI, tests).

```
.
├── package.json            # workspace root (private)
├── pnpm-workspace.yaml     # workspace package globs
├── tsconfig.base.json      # shared TypeScript compiler options
├── tsconfig.json           # solution-style project references
└── packages/
    ├── core/               # @calc/core  (no web dependency)
    └── web/                # @calc/web   (depends on @calc/core)
```

## Toolchain

- **Node.js** — see [`.nvmrc`](./.nvmrc) (Node 22). Run `nvm use` to match.
- **Package manager** — pnpm, pinned via the root `packageManager` field and
  managed by [Corepack](https://github.com/nodejs/corepack):

  ```sh
  corepack enable
  ```

## Getting started

```sh
pnpm install     # install workspace dependencies
pnpm build       # type-check and build every package (tsc project references)
```

`pnpm build` builds `@calc/core` first, then `@calc/web`, following the
TypeScript project references. You can also build a single package:

```sh
pnpm build:core
pnpm build:web
```

## Status

This scaffold establishes the structure, toolchain, and package boundary only.
No arithmetic, scientific functions, RPN engine, or web UI are implemented yet —
those land in subsequent features. All content in this repository is original.
