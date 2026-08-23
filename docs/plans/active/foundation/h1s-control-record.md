# H1-S Stabilization Control Record

**Record kind:** `H_STAGE_STABILIZATION_CONTROL`  
**Stage:** `H1-S`  
**Baseline master:** `257ad6fe73924bcd1c9a00cad6a15938d6e6a2da`  
**Branch:** `dev/h1-stabilization`  
**PR:** `NOT_CREATED` at plan publication; execution creates one Draft PR after the first control/spec commit  
**Spec:** `docs/engineering/specs/h1-stabilization-foundation-authority-reset.md`

## Current stage truth

```yaml
M5B: CLOSED
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: ACTIVE
H1: OPEN
H2: NOT_ELIGIBLE
```

## Phase plans

All three phase documents are approved and may be stored under `docs/plans/active/foundation/`, but only the plan named by `governingPlan` is executable. This explicit designation satisfies the repository rule for multiple active plans.

```yaml
governingPlan: h1s-s0-governance-truth-reset.md
phases:
  S0:
    plan: h1s-s0-governance-truth-reset.md
    planState: ACTIVE
    executionGate: OPEN
  S1:
    plan: h1s-s1-foundation-authority-stabilization.md
    planState: ACTIVE
    executionGate: BLOCKED_BY_S0
  S2:
    plan: h1s-s2-clean-state-qualification-closure.md
    planState: ACTIVE
    executionGate: BLOCKED_BY_S1
```

At a phase transition, the completed plan moves to `docs/plans/completed/foundation/`, this record changes `governingPlan`, and the next phase gate changes to `OPEN`. No S1 production work may begin before S0's transition commit; no S2 qualification/closure work may begin before S1's transition commit.

## Branch/PR discipline

```text
one short-lived branch
one Draft PR
ordinary pushes: local verification only
no ordinary CI
one final independent review
one final manual cross-platform CI
one squash merge
post-merge reconciliation: read-only/non-mutating
```

Any production/test/doc commit after final independent review invalidates review and final CI. Any change to the reviewed base branch also invalidates the candidate.

## Scope discipline

A — closure blockers are mandatory.  
B — fix only if the change remains local and bounded.  
C — defer.

**Stop Rule:** a fix that requires a new subsystem, architecture expansion or substantial capability work is out of H1-S by default unless H1 cannot truthfully close without it.

## Expected commit envelope

This is guidance, not a numeric gate:

```text
S0: target 3 commits
S1: target 6 commits
S2: target 1 repository commit before final review
Total: target about ten meaningful commits; corrective review commits are exceptional, not planned work
```

If implementation is trending toward twenty or more commits, stop and reclassify scope rather than turning stabilization into a second development stage.

## Final closure tuple

H1 becomes CLOSED by the squash-merge event only after all conditions below are externally verified:

```yaml
plans_complete: true
local_qualification: PASS
independent_review_exact_candidate: PASS
manual_final_ci_ubuntu: PASS
manual_final_ci_macos: PASS
manual_final_ci_windows: PASS
base_sha_unchanged_before_merge: true
head_sha_unchanged_before_merge: true
squash_merge: PASS
```

The repository MUST NOT add a post-review/post-CI evidence commit merely to change these fields. Final outcomes live in the PR/review/workflow/merge evidence; post-merge reconciliation verifies them without mutating the repository.
