# AGENTS.md — Scientific Calculator (repo root)

Conventions for human and agent contributors working anywhere in this
repository. This file applies repo-wide; see [Precedence](#precedence) for how
it interacts with the per-package `AGENTS.md` files.

## Project overview

A scientific calculator delivered as a small, reviewable, fully traceable
[pnpm](https://pnpm.io/) workspace. Two boundaried packages:

| Package      | Path            | Role                                                      |
| ------------ | --------------- | --------------------------------------------------------- |
| `@calc/core` | `packages/core` | UI-agnostic calculator core. No web/UI runtime, ever.     |
| `@calc/web`  | `packages/web`  | Web consumer. May depend on `@calc/core`; never reversed. |

The dependency only ever points **web → core**, so the core stays reusable in
any host. This is the seam later features build on. The repository currently
holds the scaffold only — no calculator behavior is implemented yet.

## Build / test / lint / format commands

Run from the repo root. They work locally and are exactly what CI runs.

```sh
corepack enable                  # use the pnpm version pinned in package.json
pnpm install --frozen-lockfile   # install workspace dependencies
pnpm build                       # type-check + build every package (core first)
pnpm test                        # run every package's tests (vitest)
pnpm lint                        # report lint problems (non-mutating)
pnpm lint:fix                    # auto-fix what ESLint can
pnpm format                      # rewrite files to Prettier style (mutating)
pnpm format:check                # verify formatting without writing — CI uses this
```

Single-package variants: `pnpm build:core`, `pnpm build:web`, or filter
directly, e.g. `pnpm --filter @calc/core test`.

## Code style

- **TypeScript**, ES modules (`"type": "module"`). Target Node 22 (`.nvmrc`).
- **Formatting is Prettier's** (`.prettierrc.json`): single quotes, 80-column
  print width. Do not hand-format; run `pnpm format`.
- **Linting is ESLint flat config** (`eslint.config.js`) with the
  TypeScript-ESLint recommended rules. Flat config does **not** read
  `.eslintignore` — excluded paths live in the `ignores` block of
  `eslint.config.js`.
- **core/web boundary is lint-enforced.** `packages/core` may not import from
  `@calc/web` (by package name or relative path). Keep `core` free of any
  web/UI runtime.

## Contribution & traceability rules

Every change is traceable back to its work item, feature, and epic.

- **CALC- ID convention** (tracker-agnostic, source of truth):
  - Epic: `CALC-E1`
  - Feature: `CALC-F\d{2}` (zero-padded, stable) — e.g. `CALC-F01`
  - Work item (PR-level): `CALC-F\d{2}-W\d{2}` — e.g. `CALC-F01-W06`
- **PR title** carries the work-item id in brackets, e.g.
  `[CALC-F01-W06] AGENTS.md set`.
- **PR body** links the backing GitHub issue with a closing keyword
  (e.g. `Closes #123`). Body linking is required — a closing keyword in a
  commit message alone does **not** register the PR as linked.
- **Commits** carry a `Refs: CALC-F01-W06` trailer.
- **Small-change guideline** (soft, not enforced): aim for ≲ ~400 changed lines
  and one logical change per PR.

The **traceability gate** (`.github/workflows/traceability.yml`) runs on every
PR and fails any PR whose title lacks a valid `[CALC-Fnn-Wnn]` id or that has no
linked issue. The four baseline checks — `lint`, `format-check`, `test`,
`build` — run via `.github/workflows/ci.yml`. Branch and PR workflow: branch
from `main` (direct pushes are blocked), open a PR with the template, get all
checks green and ≥1 approval, then merge.

## Precedence

Conventions follow **nearest-wins**: the `AGENTS.md` closest to the file you are
editing governs. A package `AGENTS.md` (`packages/core`, `packages/web`)
overrides this root file for files within that package; this root file applies
everywhere else and provides the repo-wide defaults.

## How Claude-based agents consume this file

Claude Code and other Claude-based agents read `AGENTS.md` as the conventions
source for this repo. This project standardizes on **`AGENTS.md`** (not
`CLAUDE.md`) as the single, tool-neutral home for these rules so the same
guidance serves human and agent contributors. There is intentionally no
`CLAUDE.md`; if you add agent-specific guidance, put it here. Files are plain
CommonMark with no required frontmatter or schema.
