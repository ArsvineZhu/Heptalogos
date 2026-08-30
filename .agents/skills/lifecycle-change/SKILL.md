---
name: lifecycle-change
description: Use when changing start, stop, drain, dispose, quiesce, resume, fence, ownership loss, restart, generation transitions, or background task lifetime.
---

# Lifecycle Change

## Trigger

Load this Skill for lifecycle, ownership, shutdown, restart, or process-memory
resource changes.

## Required inputs

- semantic owner and lifecycle states;
- admission boundary and resource owner;
- Point of No Return, when applicable;
- durable versus process-local responsibility;
- adopted provider mechanics;
- current failure class and required proof.

## Procedure

1. Identify Desired State, Actual State, owner, generation, and readiness impact.
2. Locate the admission boundary and determine what is already in flight.
3. Check provider lifecycle/disposal mechanics through
   [mechanics-routing](../mechanics-routing/SKILL.md).
4. Define bounded cancel, drain, dispose, and failure outcomes without adding a
   second lifecycle framework.
5. Preserve Authority across ownership handoff and fence stale work.
6. Run the weakest claim-matched focused test, then the required integration or
   restart qualification.

## Stop / escalation

Use `PLAN_GAP` for a new lifecycle state, recovery framework, unbounded wait, or
provider replacement not authorized by the active plan. Fail-stop is valid when
it preserves truth and Authority.

## Output

Record the owner, boundary, bounded lifetime, failure outcome, provider route,
and evidence status as `PASS | FAIL | NOT_RUN | BLOCKED`.

Read the [runtime supervision Spec](../../../docs/specs/runtime/runtime-supervision.md)
and [maintenance handoff Spec](../../../docs/specs/runtime/maintenance-handoff.md).
