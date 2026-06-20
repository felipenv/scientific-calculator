# Contributing

This repository ships **feature by feature** as small, reviewable, fully
traceable changes. Every change must trace back to a work item, its feature,
and the epic — and must pass CI before it can merge to `main`.

Read this alongside the `AGENTS.md` set (root + per package): `AGENTS.md`
carries the build/test/lint conventions, this file carries the **PR flow and
traceability rules**. Where they overlap, the nearest `AGENTS.md` to an edited
file wins for package-local conventions; the traceability rules below are
repo-wide.

## CALC- ID convention

The standardized, tracker-agnostic IDs are the durable source of truth. The
GitHub issue number is the current backing record; the CALC- ID survives a
future move to another tracker (the migration is then a mapping, not a
rewrite).

| Level     | Grammar              | Example        |
| --------- | -------------------- | -------------- |
| Epic      | `CALC-E1`            | `CALC-E1`      |
| Feature   | `CALC-F\d{2}`        | `CALC-F01`     |
| Work item | `CALC-F\d{2}-W\d{2}` | `CALC-F01-W07` |

- Feature and work-item numbers are **zero-padded and stable** (`F01`, `W07` —
  never `F1`/`W7`).
- A **work item** is the PR-level unit: one work item ≈ one pull request.

## PR flow

1. **Branch from `main`.** Direct pushes to `main` are blocked; all changes
   arrive through a pull request.
2. **Make one logical change** that satisfies a single work item. Follow the
   soft size guideline below.
3. **Open a PR using the template** (`.github/pull_request_template.md`):
   - **PR title** carries the work-item id in brackets, at the start:
     `[CALC-F01-W07] Short summary`. The traceability gate parses the title
     against the frozen grammar `^\[CALC-F\d{2}-W\d{2}\]`, so a feature- or
     epic-only id is **not** accepted — the PR-level id is required.
   - **PR body links a GitHub issue** with a closing keyword:
     `Closes #123` (or `Fixes`/`Resolves`). The link must be in the **PR body**,
     not only in a commit message — a closing keyword in a commit message alone
     does not register a linked PR, and a bare `#123` mention is not a closing
     reference. This is what GitHub records as `closingIssuesReferences`, which
     is exactly what the gate checks.
   - **Each commit carries a `Refs:` trailer** naming the work item:

     ```
     [CALC-F01-W07] Short summary

     Longer explanation of what and why.

     Refs: CALC-F01-W07
     ```

4. **CI runs** lint, format-check, test, and build, plus the **traceability
   gate**. Each reports a status on the PR. If the CALC- ID or issue link is
   missing or malformed, the traceability gate **fails visibly** and the PR
   cannot merge.
5. **Merge requires** all required checks green **and at least one approving
   review**. There is no administrator bypass.

> Native issue ↔ PR linking applies only to PRs targeting the **default
> branch** and requires the issue and PR to live in the **same repo** — both
> hold for v0's single main-line flow. If maintenance branches are ever added,
> revisit this constraint.

## Soft size guideline

Aim for **one logical change per PR** and **≲ ~400 changed lines**. This is a
**guideline, not an enforced gate** (there is intentionally no line-count CI
check — it is noisy). If a change is unavoidably larger, say why in the PR
description and keep it to a single logical concern.

## CALC- ID ↔ issue mapping home

The canonical mapping from CALC- ID to its backing GitHub issue number lives in
a tracked manifest, **`docs/traceability-manifest.md`**, committed to the repo.
Keeping it in-repo (rather than only in issue metadata) means the mapping is
version-controlled and survives a future tracker migration — preserving the
"CALC- ID is the source of truth" intent. Add a row when you open the work
item's PR.

## No HP branding

All content in this repository is original. Do not add HP logos, ROM, keypad
imagery, or any HP branding — even in scaffolding, fixtures, or placeholder
content.
