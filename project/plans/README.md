# Implementation plans

Plan states are exactly:

```text
ACTIVE
COMPLETED
SUPERSEDED
ABANDONED
```

Filename recency is not plan authority. A task should name its governing active
plan explicitly; if multiple active plans could apply and none is designated,
surface the ambiguity rather than guessing.

## Decision completeness

An ACTIVE implementation plan is an executable specification, not an option memo.
Before execution it MUST resolve non-trivial choices affecting Authority,
semantic ownership, package/dependency boundaries, compatibility, durable
shape, stable identity, lifecycle/failure semantics, stage scope and required
evidence.

Every future non-trivial active plan must also state:

```text
Current Horizon / maturity
Executable Truth target
Authorized failure classes
Explicit deferred failure classes
Complexity admission for new high-risk mechanics
Non-goals
Completion conditions
Reopen conditions
```

A plan that says “make robust”, “handle all edge cases”, “production-grade”, or
“for safety” without a bounded failure/threat model is not decision-complete.
Do not create a plan-lint framework or another meta-engine to check these headings.

The executor may choose only semantics-equivalent local implementation details.
An unresolved non-trivial choice is `PLAN_GAP` and stops execution.

Completion is a separate decision from reopening. A plan is complete when its
authorized change, acceptance criteria, required executable path, and current
evidence conditions are satisfied, with no observed/current authorized blocker
remaining. The default decision at that point is `STOP`.

Reopen conditions must name current evidence, an accepted current-Horizon
failure case, a current consumer/invariant, or an explicit active-plan
requirement. Imagined edge cases, generic future-proofing, and recovery-of-
recovery do not reopen a completed change by default.

Use the [plan index](INDEX.md) for active and historical plan navigation.
