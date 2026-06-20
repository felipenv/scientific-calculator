# Traceability manifest

Canonical mapping from each **CALC- ID** to its backing **GitHub issue**. The
CALC- ID is the durable source of truth; the issue number is the current
backing record. Keeping this mapping in-repo (version-controlled) means it
survives a future tracker migration — see [CONTRIBUTING.md](../CONTRIBUTING.md)
for the ID convention and PR flow.

Add a row when you open a work item's PR.

## Epic

| CALC- ID  | Title              | GitHub issue |
| --------- | ------------------ | ------------ |
| `CALC-E1` | Calculator v0 epic | —            |

## Feature CALC-F01 — Project scaffolding & governance baseline

| CALC- ID       | Work item                                        | GitHub issue |
| -------------- | ------------------------------------------------ | ------------ |
| `CALC-F01`     | Project scaffolding & governance baseline        | —            |
| `CALC-F01-W04` | CI pipeline (lint + format-check + test + build) | #4           |
| `CALC-F01-W05` | Always-run traceability gate                     | #5           |
| `CALC-F01-W07` | CONTRIBUTING, PR template & traceability docs    | (this PR)    |

## Feature CALC-F02 — UI-agnostic calculation engine core

| CALC- ID       | Work item                                       | GitHub issue |
| -------------- | ----------------------------------------------- | ------------ |
| `CALC-F02`     | UI-agnostic calculation engine core             | —            |
| `CALC-F02-W01` | Shared error/result/angle-mode contract + guard | (this PR)    |
| `CALC-F02-W04` | Exp/log + angle-mode-aware trig operators       | (this PR)    |
