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
4. The authorized external Independent Reviewer examines the current Ready PR
   as candidate transport and supplies an out-of-band `PASS` or
   `REQUEST_CHANGES` verdict. GitHub Pull Request review objects, approvals,
   requested reviewers, and comments are unrelated to this gate; do not inspect
   them as evidence of Independent Review.
5. If the external verdict is `REQUEST_CHANGES`, return the PR to Draft, make
   only the bounded corrections, rerun affected qualification and local gates,
   then mark it Ready for a new external review.
6. After an external Independent Review `PASS`, dispatch final manual CI and
   require Ubuntu, macOS, and Windows to pass.
7. Merge immediately only while the PR is still open, Ready, conflict-free,
   and its branch has not changed since review and final CI.
8. Squash merge, then delete the branch only after merge succeeds.
9. Reconcile current truth through a separate docs/evidence-only PR. That PR
   changes no production code, tests, or behavior contract.

## Completion and reopen

Close the implementation review when the approved scope is complete, its
acceptance criteria are satisfied, the required executable evidence is green,
and no admitted blocker remains. A newly noticed concern is classified before
it becomes another implementation round.

Reopen only for an observed defect, a failing current executable path, an
accepted current-Horizon failure case, a current consumer or invariant, or an
explicit active-plan requirement. Theoretical completeness, generic future
proofing, a failure inside a new recovery mechanism, and recovery-of-recovery
do not reopen a completed change by themselves.

The default decision after completion is `STOP`; external review must not turn
every newly imagined edge case into an instruction to harden the candidate.

## Invalidation rules

```text
Draft work is mutable.
External Independent Review PASS -> any PR-branch mutation makes the verdict
stale and requires Draft.
Final CI -> any PR-branch mutation makes review and CI stale and requires Draft.
Any base movement after the Ready candidate is frozen makes the review
candidate stale, regardless of any diff assessment. Return to Draft, integrate
and requalify against the new base, then obtain a
new Independent Review before final manual CI.
```

## Manual CI dispatch

After the external Independent Review supplies `PASS`:

```bash
PR_NUMBER=<number>
PR_BRANCH=<head-branch>

gh workflow run verify.yml \
  --ref "$PR_BRANCH" \
  -f pr_number="$PR_NUMBER" \
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
