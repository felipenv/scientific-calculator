#!/usr/bin/env node
//
// Traceability gate (CALC-F01-W05).
//
// Enforces bidirectional traceability on every pull request (FR5, FR6):
//
//   1. The PR title carries a valid work-item id, e.g. "[CALC-F01-W05] ...".
//   2. The PR has at least one *linked* GitHub issue.
//
// It exits non-zero — visibly failing the required check — on any PR that does
// not satisfy both. The companion workflow (.github/workflows/traceability.yml)
// runs this on every `pull_request` event with no `if:`/path filter, so the
// gate never silently skips. A skipped required check reports as success on
// GitHub and would let an untagged PR merge; that trap is precisely what AC5
// forbids, hence "always run, never skip".
//
// ── Title-regex vs. API: why we use *both* signals ──────────────────────────
//
//   • Title id      — parsed locally from the PR title with the frozen
//                      work-item grammar `^\[CALC-F\d{2}-W\d{2}\]`. Pure, fast,
//                      and unit-tested below; needs no network or token.
//
//   • Linked issue  — read from GitHub's GraphQL `closingIssuesReferences`,
//                      which is the *authoritative* record of what GitHub
//                      considers a linked issue. Only a PR-*body* keyword link
//                      (Closes/Fixes/Resolves #N) — or a manual link in the
//                      Development panel — populates it. A closing keyword in a
//                      commit message alone does NOT register a linked PR, and
//                      a bare `#123` mention in the body is not a closing
//                      reference either. Re-implementing GitHub's linking
//                      heuristics from the body text by hand would diverge from
//                      what GitHub actually enforces, so we ask the API rather
//                      than guess. This matches the documented PR flow, which
//                      requires PR-body linking, not commit-message keywords.
//
// ── Required `GITHUB_TOKEN` permissions ─────────────────────────────────────
//
//   The GraphQL read needs, at minimum:
//       permissions:
//         contents: read
//         pull-requests: read
//   `issues: read` is also granted by the workflow for clarity. The default
//   `GITHUB_TOKEN` on a same-repo PR carries these scopes.
//
// ── Fork-PR limitation (acceptable for single-repo v0) ──────────────────────
//
//   Pull requests opened from a *fork* receive a read-only `GITHUB_TOKEN` and,
//   depending on repo settings, may not be able to resolve
//   `closingIssuesReferences`. v0 is a single-repo, single-main-line flow
//   (contributors branch from `main`, not from forks), so this does not block
//   the intended flow; it is recorded here as a known constraint to revisit if
//   fork-based contribution is ever enabled.

import { readFileSync } from 'node:fs';

/**
 * Frozen work-item title grammar (FR6). PR titles must START with the
 * work-item id wrapped in brackets, e.g. "[CALC-F01-W05] Add the gate".
 *
 *   Epic     CALC-E1
 *   Feature  CALC-F\d{2}        (zero-padded, stable)
 *   Work item CALC-F\d{2}-W\d{2} (PR-level — what a PR title carries)
 *
 * The PR-level id is intentionally the only thing accepted here: a feature- or
 * epic-only id in a PR title is not specific enough to trace a single change.
 */
export const WORK_ITEM_TITLE_RE = /^\[(CALC-F\d{2}-W\d{2})\]/;

/**
 * Extract the work-item id from a PR title, or return null if the title does
 * not begin with a well-formed `[CALC-Fnn-Wnn]` tag.
 *
 * @param {unknown} title
 * @returns {string | null}
 */
export function extractWorkItemId(title) {
  if (typeof title !== 'string') return null;
  const match = title.match(WORK_ITEM_TITLE_RE);
  return match ? match[1] : null;
}

/**
 * Pure evaluation of the two traceability requirements. Kept free of I/O so it
 * can be exhaustively unit-tested; the network call that produces
 * `linkedIssueCount` lives in `main()`.
 *
 * @param {{ title: unknown, linkedIssueCount: number }} input
 * @returns {{ ok: boolean, id: string | null, errors: string[] }}
 */
export function evaluateTraceability({ title, linkedIssueCount }) {
  const errors = [];

  const id = extractWorkItemId(title);
  if (!id) {
    errors.push(
      `PR title must start with a valid work-item id, e.g. "[CALC-F01-W05] ...". ` +
        `Grammar: [CALC-F<nn>-W<nn>] (two digits each). Got: ${JSON.stringify(
          title,
        )}`,
    );
  }

  if (!Number.isInteger(linkedIssueCount) || linkedIssueCount < 1) {
    errors.push(
      'PR must link at least one GitHub issue via a closing keyword in the PR ' +
        'BODY (e.g. "Closes #123"). A keyword in a commit message alone does ' +
        'not register a linked PR.',
    );
  }

  return { ok: errors.length === 0, id, errors };
}

// ── Runtime glue (only exercised in CI) ─────────────────────────────────────

/** Read the `pull_request` webhook payload GitHub Actions writes to disk. */
function readEvent() {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path) {
    throw new Error('GITHUB_EVENT_PATH is not set — not running in Actions?');
  }
  const event = JSON.parse(readFileSync(path, 'utf8'));
  if (!event.pull_request) {
    throw new Error(
      'Event payload has no `pull_request` — the gate must run on ' +
        '`pull_request` events only.',
    );
  }
  return event;
}

/**
 * Ask GitHub how many issues this PR closes. `closingIssuesReferences` is the
 * canonical "linked issue" signal (see header note).
 *
 * @returns {Promise<number>}
 */
async function fetchLinkedIssueCount({ owner, repo, number, token }) {
  const query = `
    query ($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          closingIssuesReferences(first: 1) {
            totalCount
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'calc-traceability-gate',
    },
    body: JSON.stringify({ query, variables: { owner, repo, number } }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub GraphQL request failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();
  if (payload.errors) {
    throw new Error(
      `GitHub GraphQL returned errors: ${JSON.stringify(payload.errors)}`,
    );
  }

  const count =
    payload?.data?.repository?.pullRequest?.closingIssuesReferences?.totalCount;
  if (!Number.isInteger(count)) {
    throw new Error('Could not read closingIssuesReferences.totalCount.');
  }
  return count;
}

async function main() {
  const event = readEvent();
  const pr = event.pull_request;
  const title = pr.title;

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    // Failing closed (rather than skipping) keeps a misconfigured gate from
    // reading as a false success on a required check.
    throw new Error(
      'GITHUB_TOKEN is not set — cannot verify the linked issue.',
    );
  }

  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY is not set as "owner/repo".');
  }

  const linkedIssueCount = await fetchLinkedIssueCount({
    owner,
    repo,
    number: pr.number,
    token,
  });

  const result = evaluateTraceability({ title, linkedIssueCount });

  console.log(`PR #${pr.number}: ${title}`);
  console.log(`  work-item id:        ${result.id ?? '(none)'}`);
  console.log(`  linked issue count:  ${linkedIssueCount}`);

  if (!result.ok) {
    console.error('\n❌ Traceability gate FAILED:');
    for (const error of result.errors) {
      console.error(`  • ${error}`);
    }
    console.error(
      '\nSee CONTRIBUTING / AGENTS.md for the CALC- id convention and PR flow.',
    );
    process.exit(1);
  }

  console.log('\n✅ Traceability gate passed.');
}

// Only run the gate when invoked as a script, so importing the pure helpers
// from the test file does not trigger a network call.
const invokedDirectly =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`\n❌ Traceability gate errored: ${error.message}`);
    process.exit(1);
  });
}
