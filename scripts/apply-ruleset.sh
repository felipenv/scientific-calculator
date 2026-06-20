#!/usr/bin/env bash
#
# apply-ruleset.sh — apply the protected-main repository ruleset (CALC-F01-W08).
#
# Reconciles the committed ruleset-as-code (.github/rulesets/main.json) with the
# live GitHub repository ruleset of the same name. It is the executable half of
# the protected-main merge gate (FR8, AC7): the JSON is the source of truth, and
# this script makes the platform match it.
#
# ── Who runs this, and why it is NOT wired into CI ──────────────────────────
# Applying branch protection changes who can merge to `main`, so it is itself a
# governed action. It is run by a privileged human (a repo admin) from a trusted
# machine — NOT from a workflow that an unreviewed PR could trigger. Self-applying
# the gate from CI would let a PR rewrite the rules that are supposed to gate it,
# which defeats the non-bypassable approval gate this work item exists to create.
# See docs/branch-protection.md for the full runbook and ordering constraints.
#
# ── Idempotent ──────────────────────────────────────────────────────────────
# Safe to run repeatedly. If a ruleset named "protect-main" already exists it is
# updated in place (PUT); otherwise it is created (POST). Running twice with no
# edits to main.json is a no-op in effect.
#
# ── Prerequisites ─────────────────────────────────────────────────────────────
#   • gh   — GitHub CLI, authenticated as a repo admin (`gh auth status`).
#   • jq   — JSON processor.
#
# ── Usage ─────────────────────────────────────────────────────────────────────
#   scripts/apply-ruleset.sh [owner/repo]
#
#   With no argument the target repo is inferred from `gh repo set-default` /
#   the current git remote. Pass `owner/repo` explicitly to override.

set -euo pipefail

# Resolve paths relative to this script so it works from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RULESET_FILE="${SCRIPT_DIR}/../.github/rulesets/main.json"
RULESET_NAME="$(jq -r '.name' "${RULESET_FILE}")"

die() {
  echo "error: $*" >&2
  exit 1
}

# ── Preflight ────────────────────────────────────────────────────────────────
command -v gh >/dev/null 2>&1 || die "gh (GitHub CLI) is not installed."
command -v jq >/dev/null 2>&1 || die "jq is not installed."
[ -f "${RULESET_FILE}" ] || die "ruleset file not found: ${RULESET_FILE}"
[ -n "${RULESET_NAME}" ] && [ "${RULESET_NAME}" != "null" ] \
  || die "ruleset file has no .name: ${RULESET_FILE}"

# Target repo: explicit arg wins, else let gh infer from the default repo/remote.
REPO="${1:-}"
if [ -z "${REPO}" ]; then
  REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)" \
    || die "could not infer the target repo; pass it as 'owner/repo'."
fi

echo "Applying ruleset '${RULESET_NAME}' to ${REPO}"
echo "  source: ${RULESET_FILE}"

# ── Reconcile: find an existing ruleset of the same name ─────────────────────
# Repository rulesets are addressed by numeric id, not name, so we look the id
# up by name first. (A repo can hold several rulesets; we only manage ours.)
EXISTING_ID="$(
  gh api "repos/${REPO}/rulesets" --paginate \
    --jq ".[] | select(.name == \"${RULESET_NAME}\") | .id" | head -n 1
)"

if [ -n "${EXISTING_ID}" ]; then
  echo "  found existing ruleset id=${EXISTING_ID} — updating in place (PUT)."
  gh api --method PUT "repos/${REPO}/rulesets/${EXISTING_ID}" \
    --input "${RULESET_FILE}" >/dev/null
  echo "✅ Updated ruleset '${RULESET_NAME}' (id=${EXISTING_ID})."
else
  echo "  no existing ruleset by that name — creating (POST)."
  NEW_ID="$(
    gh api --method POST "repos/${REPO}/rulesets" \
      --input "${RULESET_FILE}" --jq .id
  )"
  echo "✅ Created ruleset '${RULESET_NAME}' (id=${NEW_ID})."
fi

echo
echo "Done. Verify on GitHub: Settings → Rules → Rulesets, or run:"
echo "  gh api repos/${REPO}/rulesets --jq '.[] | {id, name, enforcement}'"
