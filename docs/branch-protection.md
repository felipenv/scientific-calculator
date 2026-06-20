# Protected `main` — ruleset & governed apply runbook

This runbook describes how `main` is protected and how the protection is applied.
It is the operational companion to the committed ruleset-as-code at
[`.github/rulesets/main.json`](../.github/rulesets/main.json) and the apply
script at [`scripts/apply-ruleset.sh`](../scripts/apply-ruleset.sh)
(CALC-F01-W08, satisfying FR8 / AC7).

## What the ruleset enforces

`main` is protected by a GitHub **repository ruleset** named `protect-main`. As
committed, it enforces:

- **Required pull request before merge** — direct pushes to `main` are blocked;
  every change lands through a PR.
- **At least one approving review** (`required_approving_review_count: 1`).
- **Required passing status checks** — the frozen check names from the CI and
  traceability workflows must all be green:
  - `lint`, `format-check`, `test`, `build`, `ci` — from
    [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (CALC-F01-W04).
  - `traceability` — from
    [`.github/workflows/traceability.yml`](../.github/workflows/traceability.yml)
    (CALC-F01-W05).
- **No force-pushes and no branch deletion** (`non_fast_forward`, `deletion`).
- **No bypass actors** (`bypass_actors: []`) and `enforcement: "active"` — there
  is **no administrator bypass**. Approval-gate integrity is non-negotiable, so
  even repo admins must go through a reviewed PR with green checks.

### Frozen check-name contract

The `context` strings in `required_status_checks` must match the **job names**
emitted by the workflows exactly. GitHub matches required checks by name, so:

- Renaming a CI/traceability job without updating this ruleset silently
  **un-requires** it — the old required name simply never reports again, and the
  gate quietly weakens.
- Listing a name here that never reports leaves the PR **stuck pending**
  forever.

Treat the names as a frozen contract. The committed JSON and the workflow job
names are kept in lockstep, and `scripts/check-ruleset.test.mjs` asserts the
expected set so a drift fails CI.

## Ordering — why this lands last

A status check **cannot be marked required until it has reported at least once**
on the repository. Therefore the rollout order across CALC-F01 is:

1. CI workflow (W04) and traceability gate (W05) merge first and run on real,
   voluntarily-conforming PRs while `main` is still unprotected.
2. Once all six checks (`lint`, `format-check`, `test`, `build`, `ci`,
   `traceability`) have reported on at least one PR, this ruleset is applied —
   **last** — so every referenced check already exists and binds correctly.

Applying protection before the checks have reported would either bind to a
non-existent check (PRs stuck pending) or, if names are mistyped, leave the gate
quietly incomplete.

## Who applies it, and why not CI

**The apply is a governed, privileged human step. It is intentionally NOT wired
into any workflow.**

Applying the ruleset changes who may merge to `main`. If a workflow applied it,
an unreviewed PR could edit `main.json` (or the workflow) to weaken or remove the
gate that is supposed to gate it — a self-bypass. So:

- The committed artifacts (`main.json`, `apply-ruleset.sh`, this runbook) are
  PR-deliverable and reviewed like any other change.
- The **settings apply itself** is run by hand by a repo admin from a trusted
  machine, using a token/login that is **not** exposed to PR-triggered CI.
- The script never grants itself a bypass: `bypass_actors` stays empty.

## How to apply

Prerequisites: [`gh`](https://cli.github.com/) authenticated as a repo admin
(`gh auth status`) and `jq` installed.

```bash
# From the repo root, targeting the repo gh has as default:
scripts/apply-ruleset.sh

# …or naming the repo explicitly:
scripts/apply-ruleset.sh felipenv/scientific-calculator
```

The script is **idempotent**: it looks up a ruleset named `protect-main` and
updates it in place (PUT) if present, or creates it (POST) if not. Re-running
with an unchanged `main.json` is effectively a no-op.

## How to verify

```bash
# Show the live ruleset summary:
gh api repos/<owner>/<repo>/rulesets --jq '.[] | {id, name, enforcement}'

# Inspect the active rules for the protect-main ruleset id:
gh api repos/<owner>/<repo>/rulesets/<id> --jq '.rules'
```

Manual acceptance check (AC7):

- A direct push to `main` is rejected.
- A PR cannot merge until all six required checks are green **and** it has ≥1
  approving review.
- An admin sees the same gate — no bypass option that skips checks/review.

## Editing the protection later

1. Edit `.github/rulesets/main.json` in a normal, reviewed PR.
2. After merge, a repo admin re-runs `scripts/apply-ruleset.sh` to reconcile the
   live ruleset with the committed source of truth.

Never edit the ruleset only in the GitHub UI: the committed JSON is the source
of truth, and an undocumented UI change drifts from it.

## Known constraints

- **Default-branch scope.** The ruleset targets `~DEFAULT_BRANCH` (`main`). v0 is
  a single main-line flow; revisit the conditions if maintenance branches are
  added later.
- **Token scope for apply.** Managing rulesets requires repo-admin
  authorization. The default PR-triggered `GITHUB_TOKEN` deliberately does not
  carry it — reinforcing that the apply is a human step, not a CI step.
