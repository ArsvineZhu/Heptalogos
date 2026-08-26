# H-stage Stabilization Closure

This playbook governs the short, bounded stabilization pass required before an
Hn functional milestone can close.

## Scope and invariants

- Use one short-lived stabilization branch, one bounded plan, and one Draft PR.
- Complete every planned repository mutation before Independent Review.
- Keep Hn-S bounded; defer new subsystem, architecture expansion, and
  next-milestone capability work.
- Treat the current live Ready PR as the review candidate. Git revision
  identity remains machine-internal to Git/GitHub/CI.

## Procedure

1. Confirm the current baseline and clean worktree, then verify the stabilization
   branch and install the approved plan.
2. Open a Draft PR without ordinary CI.
3. Execute the plan task-by-task with TDD, focused tests, static gates, and
   claim-matched qualification.
4. Complete the provenance, compatibility, archaeology, architecture-seam,
   and current-evidence sweeps before freezing the candidate.
5. Record only observed verification states: `PASS`, `FAIL`, `NOT_RUN`, or
   `BLOCKED`.
6. Mark the PR Ready and request Independent Review of the complete live PR.
7. On `REQUEST_CHANGES`, return to Draft, make bounded corrections, rerun the
   affected qualification and local gates, and request a new review.
8. On Review `PASS`, run manual final CI on the current PR plus current `master`
   integration. Require Ubuntu, macOS, and Windows to pass.
9. Merge immediately if the PR remains current, Ready, open, and conflict-free;
   any base movement sends the candidate back through Draft and new review.
   Squash merge and delete the branch after success.
10. Reconcile Hn truth through a separate docs/evidence-only PR without changing
    behavior, production code, or tests.

## Candidate invalidation

```text
PR branch mutation after Review PASS -> review stale; return to Draft
PR branch mutation after final CI -> review and CI stale; return to Draft
Any base movement after the Ready candidate is frozen -> candidate stale;
return to Draft, integrate/requalify, and obtain a new review before final CI
```

## Mandatory pre-freeze sweeps

1. Development-provenance neutrality in current executable identities.
2. Removal or rejection of undeclared project-history compatibility.
3. Removal of ownerless closed-phase/current-tree artifacts.
4. Hn cross-domain ownership, lifecycle, generation, and dependency audit.
5. Claim-matched current qualification with historical evidence kept separate.
6. `pnpm check:hygiene` PASS with no generic waiver mechanism.

An unresolved semantic choice is `PLAN_GAP` and stops execution. Do not create
an allowlist or local exception to make a gate pass.

## Closure conditions

```text
implementation plan complete
+ local qualification complete
+ mandatory Hn-S sweeps complete
+ PR Ready
+ Independent Review PASS on the current live PR
+ no PR-branch mutation after Review PASS
+ final manual CI PASS on Ubuntu/macOS/Windows for current-base integration
+ no PR-branch mutation after final CI
+ squash merge succeeds
```
