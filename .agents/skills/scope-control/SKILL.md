---
name: scope-control
description: Use when an implementation task exposes an adjacent defect, rare edge case, resilience idea, security concern, recovery expansion, new state, or other possible scope change.
---

# Scope Control

## Purpose

Use this Skill to decide whether a finding belongs in the approved change. It
is an admission procedure, not a reason to avoid fixing current defects. Read
the detailed [finding-admission procedure](references/finding-admission.md) for
the decision rules and the [casebook](references/casebook.md) for worked
examples.

## The admission loop

For every incidental finding, write down the following before changing code:

1. The current approved task.
2. Its acceptance condition.
3. The concrete current consumer or invariant affected.
4. The evidence for the finding, including whether it is observed or imagined.
5. Whether it is on a normal/current executable path.
6. The accepted failure class. The Constitution defines `F0` as normal
   operation, `F1` as common operational failure, `F2` as required recovery,
   `F3` as rare timing failure, and `F4` as catastrophic hardening.
7. The current behavior if the finding is deferred.
8. Whether canonical truth and Authority remain safe if deferred.
9. The semantic and architectural cost of fixing it.
10. The decision: `IMPLEMENT`, `RECORD/DEFER`, or `PLAN_GAP`.
11. The basis on which a completed change could be reopened.
12. The action that returns the Agent to the original task.

## Decision rules

| Finding                                                           | Default decision                                                      | Why                                                                                |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Normal executable path is broken                                  | `IMPLEMENT`                                                           | The current required behavior is defective.                                        |
| Common startup/shutdown operation actually hangs                  | `IMPLEMENT`                                                           | A reproduced common operational failure is current evidence.                       |
| Obvious normal-input validation bug adjacent to the task          | `IMPLEMENT` when within the same semantic owner; otherwise `PLAN_GAP` | Correctness is admitted only when the owner and plan boundary are clear.           |
| Rare scheduler interleaving imagined after the fix                | `RECORD/DEFER`                                                        | Possibility alone does not establish a current consumer or accepted failure model. |
| Recovery cleanup fails after first-order recovery already failed  | `RECORD/DEFER`                                                        | Recovery-of-recovery needs separate current authority.                             |
| Failure-injection test exposes an unmodeled case                  | Classify first; usually `RECORD/DEFER`                                | A test is evidence, not product-state Authority.                                   |
| Acceptance is green but a timeout budget could be more elegant    | `STOP`                                                                | A completed condition does not authorize another hardening pass.                   |
| Future provider or Subject work might need a new Foundation state | `RECORD/DEFER`                                                        | Future consumers do not authorize present state-space growth.                      |
| A current real consumer cannot use the existing contract          | `IMPLEMENT` if authorized; otherwise `PLAN_GAP`                       | Current consumer evidence can reopen or expose a missing plan decision.            |

## Admission outcomes

Choose `IMPLEMENT` only when the finding is inside the approved task or is a
current defect whose owner and acceptance impact are already authorized. Choose
`RECORD/DEFER` when the current system preserves truth and Authority without the
change. Choose `PLAN_GAP` when the finding may be current and material but the
plan has not decided ownership, state, provider, failure semantics, or evidence
scope.

Do not use a test failure, a future design document, a generic “safer” argument,
or the existence of a named service as a substitute for admission evidence.
Do not add recovery-of-recovery, fallback-of-fallback, or a second hardening
round merely because the first-order implementation has a conceivable weakness.

## Completion and return

When the acceptance condition is satisfied, the required executable path is
green, and no admitted blocker remains, stop. Reopen only for new current
evidence, an accepted current-Horizon failure case, a current consumer or
invariant, or an explicit active-plan requirement. Record deferred findings and
return to the original task; do not let the record become a new work queue.

## Decision record

Use this compact record for a non-trivial finding:

```text
Current task:
Acceptance condition:
Finding:
Current consumer/invariant:
Evidence:
Failure class:
Behavior if deferred:
Semantic cost:
Decision:
Reopen basis:
```

Route specialized work to [`recovery-design`](../recovery-design/SKILL.md),
[`lifecycle-change`](../lifecycle-change/SKILL.md),
[`test-design`](../test-design/SKILL.md), or
[`semantic-boundary-change`](../semantic-boundary-change/SKILL.md) after scope
admission, not instead of it.

Read the [engineering completion and reopen rule](../../../project/governance/engineering-principles.md)
and the [governance failure classes](../../../project/governance/constitution.md).
