<!--
  PR template — reinforces the traceability rules in CONTRIBUTING.md.

  Required before this PR can merge:
    • PR title starts with the work-item id:  [CALC-Fnn-Wnn] Short summary
    • The PR body links a GitHub issue with a closing keyword (below)
    • Each commit carries a `Refs: CALC-Fnn-Wnn` trailer
  The traceability gate checks the title id and the linked issue; a missing or
  malformed id, or no linked issue, fails the gate and blocks the merge.
-->

## Work item

<!-- The CALC- ID this PR delivers. Must match the `[CALC-Fnn-Wnn]` in the PR title. -->

CALC-ID: `CALC-Fnn-Wnn`

## Linked issue

<!-- Use a closing keyword IN THIS BODY (not only in a commit message). -->

Closes #

## Change summary

<!-- One logical change. What changed and why. Aim for ≲ ~400 changed lines. -->

## Checklist

- [ ] PR title starts with `[CALC-Fnn-Wnn]`
- [ ] PR body links a GitHub issue with a closing keyword (`Closes #…`)
- [ ] Commits carry a `Refs: CALC-Fnn-Wnn` trailer
- [ ] One logical change, within the soft ~400-line guideline
- [ ] `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` pass locally
- [ ] No HP branding or imagery added
