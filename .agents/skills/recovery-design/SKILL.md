---
name: recovery-design
description: Use when implementation adds or changes retry, restart recovery, reconciliation repair, fallback, compensation, failover, self-healing, or recovery state after a lifecycle or provider failure.
---

# Recovery Design

## Purpose

Use this Skill when recovery semantics are being changed. First distinguish the
layers of the problem:

| Layer                        | Meaning                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Primary operation            | The work whose normal success and canonical outcome matter. |
| First-order expected failure | A failure included in the current accepted model.           |
| Authorized recovery          | The bounded response already admitted for that failure.     |
| Recovery failure             | The recovery action itself cannot complete.                 |
| Recovery-of-recovery         | A new mechanism proposed to repair the recovery failure.    |

Read the [recovery casebook](references/casebook.md) when a proposed design
crosses these layers.

## Admission before mechanics

Before adding a branch, state:

1. the primary operation and its semantic owner;
2. the canonical truth or Authority that must survive;
3. the current accepted failure model and evidence;
4. the current consumer or invariant requiring recovery;
5. the point of no return, if ownership or destructive work is involved;
6. the existing bounded fail-stop, fence, operator, or reconciliation outcome;
7. the durable state, lifecycle state, provider, and verification cost of the
   proposed mechanism.

If the finding is incidental or theoretical, use
[`scope-control`](../scope-control/SKILL.md) first. Recovery complexity is not
admitted merely because a failure handler can itself fail.

## Preferred decision path

Use this order:

```text
preserve canonical truth and Authority
→ perform bounded cleanup
→ apply already-authorized first-order recovery
→ fence or fail-stop when the current failure model is exhausted
→ allow later reconciliation only where the owning architecture already provides it
```

Do not invent a durable recovery state, retry loop, fallback branch, journal,
or recovery subsystem to make every failure path look complete. Before adding a
second recovery layer, require all of these:

- a current consumer;
- a current accepted failure model;
- a concrete correctness requirement;
- evidence that existing fencing/fail-stop is insufficient; and
- active-plan authorization, or `PLAN_GAP`.

## Failure-model decisions

| Situation                        | First question                                            | Default outcome                                                              |
| -------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Bounded shutdown cleanup fails   | Can Authority be fenced and truth remain explicit?        | Fail-stop or fenced terminal outcome when yes.                               |
| Process loss before restart      | Does the existing durable owner reconcile the obligation? | Use the existing reconciliation path; do not add a second scheduler.         |
| Retryable provider failure       | Is retry part of the current owner contract and bounded?  | Reuse the adopted retry/dispatch route; otherwise stop at the plan boundary. |
| Recovery function throws         | Is the first-order outcome still explicit and safe?       | Preserve failure truth; do not automatically add recovery-of-recovery.       |
| Rollback or restore fails        | Has the point of no return passed?                        | Do not pretend restoration; fence and enter the owning recovery outcome.     |
| Rare crash after terminal commit | Is this an accepted current proof boundary?               | Use the existing claim-matched scenario or record it as deferred.            |
| Future self-healing proposal     | Which current consumer requires it?                       | Defer without a current consumer and accepted failure model.                 |

## Lifecycle and durable boundaries

Route resource ownership and bounded cancellation to
[`lifecycle-change`](../lifecycle-change/SKILL.md). Route a new persistent state,
revision, journal, or cross-process fact to
[`durable-state-change`](../durable-state-change/SKILL.md). Route retries and
provider mechanics to [`mechanics-routing`](../mechanics-routing/SKILL.md).
Use [`test-design`](../test-design/SKILL.md) before creating failure-injection
coverage and [`claim-verification`](../claim-verification/SKILL.md) before
making a recovery proof claim.

## Output

For a non-trivial recovery change, record:

```text
Primary operation and owner:
Canonical truth / Authority:
First-order failure and accepted model:
Authorized recovery:
Point of No Return:
Failure of recovery:
Existing bounded outcome:
New semantic distinction and current consumer:
Decision:
Verification claim and evidence state:
```

If the only reason for a new branch is that a recovery handler is fallible,
choose the existing bounded outcome and stop. A failure handler becoming
fallible does not itself authorize another recovery layer.

Read the [recovery boundary in the Constitution](../../../docs/governance/constitution.md)
and the [maintenance handoff Spec](../../../docs/specs/runtime/maintenance-handoff.md).
