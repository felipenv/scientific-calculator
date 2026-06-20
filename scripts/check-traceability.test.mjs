// Unit tests for the traceability gate's pure logic (CALC-F01-W05).
//
// These exercise the title-grammar parser and the combined pass/fail
// evaluation across the edge cases the gate must get right. The network call
// (GraphQL `closingIssuesReferences`) is deliberately NOT covered here — it is
// integration-only; we test the decision logic by feeding it a
// `linkedIssueCount` directly.
//
// Run with: `node --test 'scripts/*.test.mjs'` (a.k.a. `pnpm test:traceability`).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractWorkItemId,
  evaluateTraceability,
} from './check-traceability.mjs';

describe('extractWorkItemId', () => {
  it('extracts a well-formed work-item id at the start of the title', () => {
    assert.equal(
      extractWorkItemId('[CALC-F01-W05] Add the gate'),
      'CALC-F01-W05',
    );
  });

  it('accepts any zero-padded two-digit feature and work-item numbers', () => {
    assert.equal(extractWorkItemId('[CALC-F12-W34] x'), 'CALC-F12-W34');
  });

  it('rejects a feature-only id (not specific enough for a PR)', () => {
    assert.equal(extractWorkItemId('[CALC-F01] x'), null);
  });

  it('rejects the epic id', () => {
    assert.equal(extractWorkItemId('[CALC-E1] x'), null);
  });

  it('rejects single-digit (non-zero-padded) numbers', () => {
    assert.equal(extractWorkItemId('[CALC-F1-W5] x'), null);
  });

  it('rejects three-digit numbers', () => {
    assert.equal(extractWorkItemId('[CALC-F001-W005] x'), null);
  });

  it('rejects a lowercase id', () => {
    assert.equal(extractWorkItemId('[calc-f01-w05] x'), null);
  });

  it('requires the tag at the very start (no leading text)', () => {
    assert.equal(extractWorkItemId('fix: [CALC-F01-W05] x'), null);
  });

  it('requires the surrounding brackets', () => {
    assert.equal(extractWorkItemId('CALC-F01-W05 x'), null);
  });

  it('returns null for non-string input', () => {
    assert.equal(extractWorkItemId(undefined), null);
    assert.equal(extractWorkItemId(null), null);
    assert.equal(extractWorkItemId(42), null);
  });
});

describe('evaluateTraceability', () => {
  it('passes a conforming PR: valid id + at least one linked issue', () => {
    const result = evaluateTraceability({
      title: '[CALC-F01-W05] Add the gate',
      linkedIssueCount: 1,
    });
    assert.equal(result.ok, true);
    assert.equal(result.id, 'CALC-F01-W05');
    assert.deepEqual(result.errors, []);
  });

  it('fails an untagged PR even when an issue is linked', () => {
    const result = evaluateTraceability({
      title: 'Add the gate',
      linkedIssueCount: 1,
    });
    assert.equal(result.ok, false);
    assert.equal(result.id, null);
    assert.equal(result.errors.length, 1);
    assert.match(
      result.errors[0],
      /title must start with a valid work-item id/,
    );
  });

  it('fails a correctly-tagged PR with no linked issue', () => {
    const result = evaluateTraceability({
      title: '[CALC-F01-W05] Add the gate',
      linkedIssueCount: 0,
    });
    assert.equal(result.ok, false);
    assert.equal(result.id, 'CALC-F01-W05');
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /link at least one GitHub issue/);
  });

  it('reports BOTH failures when id and link are missing', () => {
    const result = evaluateTraceability({
      title: 'no tag here',
      linkedIssueCount: 0,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errors.length, 2);
  });

  it('treats a non-integer linked count as no link', () => {
    const result = evaluateTraceability({
      title: '[CALC-F01-W05] x',
      linkedIssueCount: Number.NaN,
    });
    assert.equal(result.ok, false);
    assert.match(result.errors[0], /link at least one GitHub issue/);
  });
});
