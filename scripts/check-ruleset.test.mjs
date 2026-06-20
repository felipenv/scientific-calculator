// Validation tests for the protected-main ruleset-as-code (CALC-F01-W08).
//
// The ruleset at .github/rulesets/main.json is the source of truth for the
// non-bypassable merge gate on `main` (FR8, AC7). These tests assert its
// invariants so a careless edit cannot silently weaken the gate:
//
//   • exactly the frozen CI + traceability check names are required;
//   • at least one approving review is required;
//   • direct pushes are blocked (a PR is required);
//   • there are NO bypass actors (no admin bypass) and enforcement is active.
//
// The frozen-name set is duplicated here on purpose: this test fails loudly if
// the ruleset drifts from the workflow job names it must mirror (see
// .github/workflows/ci.yml and traceability.yml, and docs/branch-protection.md).
//
// Run with: `node --test 'scripts/*.test.mjs'` (a.k.a. `pnpm test:traceability`).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The exact status-check contexts the gate must require — the job names emitted
// by ci.yml (lint/format-check/test/build/ci) and traceability.yml.
const FROZEN_REQUIRED_CHECKS = [
  'lint',
  'format-check',
  'test',
  'build',
  'ci',
  'traceability',
];

const RULESET_PATH = fileURLToPath(
  new URL('../.github/rulesets/main.json', import.meta.url),
);
const ruleset = JSON.parse(readFileSync(RULESET_PATH, 'utf8'));

/** Find the single rule of a given type, asserting it exists exactly once. */
function rule(type) {
  const matches = ruleset.rules.filter((r) => r.type === type);
  assert.equal(matches.length, 1, `expected exactly one '${type}' rule`);
  return matches[0];
}

describe('protect-main ruleset — top level', () => {
  it('targets branches and is actively enforced', () => {
    assert.equal(ruleset.target, 'branch');
    assert.equal(ruleset.enforcement, 'active');
  });

  it('applies to the default branch', () => {
    assert.deepEqual(ruleset.conditions.ref_name.include, ['~DEFAULT_BRANCH']);
  });

  it('has NO bypass actors (no admin bypass)', () => {
    assert.ok(
      Array.isArray(ruleset.bypass_actors),
      'bypass_actors must be present as an array',
    );
    assert.equal(
      ruleset.bypass_actors.length,
      0,
      'bypass_actors must be empty — approval-gate integrity is non-negotiable',
    );
  });
});

describe('protect-main ruleset — pull request rule', () => {
  it('requires a PR to merge (blocks direct pushes)', () => {
    const pr = rule('pull_request');
    assert.ok(pr.parameters, 'pull_request rule needs parameters');
  });

  it('requires at least one approving review', () => {
    const pr = rule('pull_request');
    assert.ok(
      pr.parameters.required_approving_review_count >= 1,
      'required_approving_review_count must be >= 1',
    );
  });
});

describe('protect-main ruleset — required status checks', () => {
  const checks = rule('required_status_checks');
  const contexts = checks.parameters.required_status_checks.map(
    (c) => c.context,
  );

  it('requires every frozen CI + traceability check', () => {
    for (const name of FROZEN_REQUIRED_CHECKS) {
      assert.ok(
        contexts.includes(name),
        `required status checks must include the frozen check '${name}'`,
      );
    }
  });

  it('does not require any unknown/extra check name', () => {
    assert.deepEqual(
      [...contexts].sort(),
      [...FROZEN_REQUIRED_CHECKS].sort(),
      'required checks must be exactly the frozen set — no drift',
    );
  });
});

describe('protect-main ruleset — history protection', () => {
  it('blocks branch deletion and non-fast-forward (force) pushes', () => {
    const types = ruleset.rules.map((r) => r.type);
    assert.ok(types.includes('deletion'), "missing 'deletion' rule");
    assert.ok(
      types.includes('non_fast_forward'),
      "missing 'non_fast_forward' rule",
    );
  });
});
