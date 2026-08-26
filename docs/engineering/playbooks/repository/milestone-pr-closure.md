# Milestone PR Closure

This playbook governs the Branch → Draft PR → Review → Manual CI → Squash
Merge sequence. It is the operational companion to the repository contract in
`AGENTS.md`.

## Procedure

1. Create the short-lived branch from the current `master` and open one Draft
   PR without ordinary CI.
2. Install the approved plan, make the bounded implementation changes, and run
   local tests plus `pnpm verify` as required by that plan.
3. When implementation and evidence are complete, mark the PR Ready.
4. Independent Review evaluates the current live Ready PR. Do not ask the
   operator to copy Git revision identifiers into plans, evidence, or the PR
   body.
5. If review returns `REQUEST_CHANGES`, return the PR to Draft, make only the
   bounded corrections, rerun affected qualification and local gates, then
   mark it Ready for a new review.
6. After Review `PASS`, dispatch final manual CI and require Ubuntu, macOS, and
   Windows to pass.
7. Merge immediately only while the PR is still open, Ready, conflict-free,
   and its branch has not changed since review and final CI.
8. Squash merge, then delete the branch only after merge succeeds.
9. Reconcile current truth through a separate docs/evidence-only PR. That PR
   changes no production code, tests, or behavior contract.

## Invalidation rules

```text
Draft work is mutable.
Review PASS -> any PR-branch mutation makes review stale and requires Draft.
Final CI -> any PR-branch mutation makes review and CI stale and requires Draft.
Any base movement after the Ready candidate is frozen makes the review
candidate stale, regardless of any diff assessment. Return to Draft, integrate
and requalify against the new base, then obtain a
new Independent Review before final manual CI.
```

## Manual CI dispatch

After Independent Review `PASS`:

```bash
gh workflow run verify.yml \
  --ref dev/h2-stabilization \
  -f pr_number=24 \
  -f reason=final-pre-merge
```

The workflow resolves one internal PR-head/current-base snapshot, checks that
the dispatched branch is the PR head, feeds that snapshot to all three jobs,
creates a temporary local integration, and revalidates the live PR and base
before completion. It must not push the temporary integration.

For a bounded cross-platform regression during Draft, use the same semantic
inputs with `reason=cross-platform-regression`. Do not dispatch CI for ordinary
commits.

## Merge check

Before merge, inspect `gh pr view` for an open Ready and mergeable PR, and
`gh pr checks` for successful final manual verification. If the branch or base
changed, return to Draft and repeat integration, qualification, review, and
final CI.
