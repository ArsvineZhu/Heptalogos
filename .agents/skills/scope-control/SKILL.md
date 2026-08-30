---
name: scope-control
description: Use when planned work reveals a new edge case, resilience or security request, recovery or fallback idea, new state, adjacent defect, or other scope expansion.
---

# Scope Control

## Trigger

Load this Skill when a finding could extend the current plan beyond its
authorized consumer, invariant, failure class, or stage.

## Required inputs

- the named active plan and its completion/reopen conditions;
- the current Horizon and accepted failure classes;
- the affected consumer, invariant, or observed evidence;
- the current fail-stop behavior.

## Procedure

1. Read the plan scope and identify the exact current consumer or invariant.
2. Classify the finding as observed/current-path, accepted F0–F2, deferred F3/F4,
   theoretical, failure-injection-only, or future-consumer work.
3. Inspect whether the existing bounded fail-stop behavior preserves Authority
   and truth.
4. Decide `IMPLEMENT`, `DEFER`, or `PLAN_GAP` using the plan's admission rules.
5. If the authorized change is complete, default to `STOP`. Reopen only for new
   current evidence, an accepted current-Horizon failure case, a current
   consumer/invariant, or an explicit active-plan requirement.
6. Return to the original task after recording a deferred finding.

## Stop / escalation

Use `PLAN_GAP` for an unresolved non-trivial semantic choice, a new production
state/subsystem, or a provider/recovery branch not authorized by the plan.
Do not implement recovery-of-recovery, fallback-of-fallback, or a second
hardening pass merely because another imperfection can be imagined.

## Output

Record the finding, classification, decision, impact if deferred, and the
evidence that supports the decision. Keep the original task boundary intact.

Read [engineering principles](../../../docs/governance/engineering-principles.md)
and the [documentation system](../../../docs/engineering/repository/documentation-system.md)
when the plan or canonical owner is unclear.
