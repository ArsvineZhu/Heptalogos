# Pre-production Stabilization Closure

This playbook governs the short, bounded stabilization pass required before a
functional milestone can close.

## Scope and invariants

- Use one short-lived stabilization branch, one bounded plan, and one Draft PR.
- Complete every planned repository mutation before Independent Review.
- Keep stabilization bounded; defer new subsystem, architecture expansion, and
  next-milestone capability work.
- Treat the current live Ready PR as the candidate transport presented to the
  external reviewer. Git revision identity remains machine-internal to
  Git/GitHub/CI.

## Completion and reopen

Close stabilization when the bounded plan is complete, its acceptance criteria
and required executable evidence are green, all admitted blockers are resolved,
and the candidate is ready for the external closure sequence. Classify a new
concern before scheduling another implementation round.

Reopen only for an observed defect, a failing current executable path, an
accepted current-Horizon failure case, a current consumer or invariant, or an
explicit active-plan requirement. Imagined edge cases, generic hardening,
future consumers, failures inside newly added recovery, and recovery-of-recovery
do not reopen stabilization by themselves.

The default decision after bounded stabilization is `STOP`. Review and
stabilization do not require exhaustive hardening of every touched defense.

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
6. Mark the PR Ready and obtain an out-of-band verdict from the authorized
   external Independent Reviewer. GitHub review objects are not evidence for
   this gate.
7. On an external `REQUEST_CHANGES`, return to Draft, make bounded corrections,
   rerun the affected qualification and local gates, and obtain a new external
   Independent Review.
8. On external Independent Review `PASS`, run manual final CI on the current PR
   plus current `master` integration. Require Ubuntu, macOS, and Windows to
   pass.
9. Merge immediately if the PR remains current, Ready, open, and conflict-free;
   any base movement sends the candidate back through Draft and a new external
   Independent Review. Squash merge and delete the branch after success.
10. Reconcile milestone truth through a separate docs/evidence-only PR without changing
    behavior, production code, or tests.

## Candidate invalidation

```text
PR branch mutation after external Independent Review PASS -> verdict stale;
return to Draft
PR branch mutation after final CI -> review and CI stale; return to Draft
Any base movement after the Ready candidate is frozen -> candidate stale;
return to Draft, integrate/requalify, and obtain a new external Independent Review
before final CI
```

## Mandatory pre-freeze sweeps

1. Development-provenance neutrality in current executable identities.
2. Removal or rejection of undeclared project-history compatibility.
3. Removal of ownerless closed-phase/current-tree artifacts.
4. Cross-domain ownership, lifecycle, generation, and dependency audit.
5. Claim-matched current qualification with historical evidence kept separate.
6. `pnpm check:hygiene` PASS with no generic waiver mechanism.

An unresolved semantic choice is `PLAN_GAP` and stops execution. Do not create
an allowlist or local exception to make a gate pass.

## Closure conditions

```text
implementation plan complete
+ local qualification complete
+ mandatory stabilization sweeps complete
+ PR Ready
+ Independent Review PASS supplied by the authorized external reviewer
+ no PR-branch mutation after external Independent Review PASS
+ final manual CI PASS on Ubuntu/macOS/Windows for current-base integration
+ no PR-branch mutation after final CI
+ squash merge succeeds
```
