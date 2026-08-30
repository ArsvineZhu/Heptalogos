---
name: complexity-admission
description: Use when an admitted task proposes new abstraction, state, configuration, worker, queue, retry, recovery, security, validator, test harness, plugin point, generator, or other permanent maintenance surface.
---

# Complexity Admission

Use this Skill after scope-control has admitted the work. Its question is:
what permanent complexity is justified for the current requirement?

## Decision record

Before adding material machinery, record:

Current requirement:
Current consumer or invariant:
Acceptance condition:
Semantic owner:
Existing direct behavior:
Existing project primitive:
Adopted mechanics or provider route:
Simplest semantics-correct option:
Permanent surface proposed:
Current variability or second consumer:
Failure, threat, or load model:
Operational, test, and documentation burden:
Why the simpler route is insufficient:
Decision:

Use one of REUSE_EXISTING, DIRECT_LOCAL, ADD_MINIMUM_COMPLEXITY, DEFER, or
PLAN_GAP.

## Admission rules

- One consumer plus hypothetical future reuse does not justify a framework.
  Current variation, repeated current use, or a stable isolation boundary may
  justify a narrow abstraction.
- A constant does not become configuration without intended current
  variability.
- New persistent state requires the durable-state-change procedure and a real
  semantic distinction.
- Defensive machinery requires a current failure, threat, or load model.
- Generic mechanics route through mechanics-routing and adopted providers.
- Permanent repository checks route through repository-check-design.
- A one-time migration or one current check does not justify a registry, DSL,
  plugin system, or validator framework.
- A first-order recovery does not authorize recovery-of-recovery.

Deletion of unnecessary complexity is a valid result. Use the
[complexity casebook](references/casebook.md) for boundary-pair examples, then
return to the original task.

## Stop and escalation

Choose the smallest permanent surface that satisfies the current acceptance
condition. Record a deferred concern when current truth remains safe. Use
PLAN_GAP when the proposed solution crosses an unresolved semantic, ownership,
provider, state, or failure boundary. When acceptance is green, STOP; a more
elegant hardening pass needs new current evidence.
