# Implementation Plans

Plans are bounded work authorization. They are not permanent semantic
Authority and do not make their findings, tests, or generated artifacts
standing repository policy.

Plan states are exactly:

```text
ACTIVE
COMPLETED
SUPERSEDED
ABANDONED
```

Filename recency is not authority. Execute only the explicitly designated
active Plan. If more than one active Plan could apply and none is designated,
stop with the ambiguity rather than guessing.

## Decision completeness

An active Plan is an executable specification, not an option memo. Before
execution it must resolve the non-trivial choices needed to implement the
approved change, including Authority, semantic ownership, package and provider
boundaries, compatibility, durable shape, stable identity, lifecycle/failure
meaning, scope, and required proof.

A competent executor should be able to choose only
semantics-equivalent local implementation details. If a material decision is
not resolved, report `PLAN_GAP` and stop the affected branch.

Plans should state the current context, authorized change, non-goals, evidence
boundary, completion conditions, and any explicit reopen boundary when those
facts matter. They do not require a universal heading template.

Do not create a Plan linter, Plan schema, task/decision/test registry,
acceptance matrix, hash or manifest system, one-commit rule, review-after-each-
task rule, or other planning meta-framework.

## Completion

A Plan is complete when its authorized change and acceptance conditions are
satisfied, the required executable or evidence proof is green, and no observed
authorized blocker remains. The default next action is `STOP`.

Reopen only for new current evidence, an accepted current-Horizon failure case,
a current consumer or invariant, or an explicit active-Plan requirement.
Imagined edge cases, generic future-proofing, and recovery-of-recovery do not
reopen completed work by default.

Use the [plan index](INDEX.md) for active and historical navigation.
