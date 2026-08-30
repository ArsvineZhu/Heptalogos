---
name: lifecycle-change
description: Use when changing start, stop, drain, dispose, quiesce, resume, ownership loss, restart, generation transitions, or background resource lifetime.
---

# Lifecycle Change

## Purpose

Use this Skill for lifecycle behavior, while keeping recovery semantics in
[`recovery-design`](../recovery-design/SKILL.md). A lifecycle transition must
have one semantic owner, a clear admission boundary, and a bounded resource
lifetime. “Lifecycle completeness” is not permission to model every teardown
failure.

## Lifecycle worksheet

Before implementation, identify:

- Desired State and Actual State, and the existing legal transitions;
- the semantic owner and generation that may admit work;
- the admission boundary and work already in flight;
- each process-local resource and its owner;
- the Point of No Return when authority or destructive substrate changes;
- the provider primitive used for activation/disposal;
- the first-order failure outcome and required evidence.

Desired State describes what the owner requests. Actual State describes what is
proven now. A provider handle becoming available is not automatically readiness;
stale generations must not receive new calls or commit current outcomes.

## Worked stop flow

Use this sequence for a normal stop request:

```text
stop requested
→ stop new admission at the semantic owner
→ observe and classify in-flight work
→ wait only within the bounded drain contract
→ cancel/dispose resources owned by this activation
→ preserve or fence Authority and stale generations
→ publish the proven terminal/failed outcome
→ terminate or hand off
```

At every arrow, identify the proof needed to advance. If drain or disposal
cannot be proven within the accepted failure model, fence or fail-stop with an
explicit non-active outcome. Do not report successful restoration merely
because a cleanup callback returned or a framework state changed.

## Responsibility boundaries

| Concern                       | Owner of the meaning     | Typical implementation boundary                  |
| ----------------------------- | ------------------------ | ------------------------------------------------ |
| Desired/Actual and readiness  | Runtime semantic owner   | Runtime Kernel contract                          |
| Activation resource lifetime  | Activation owner         | existing substrate/provider scope                |
| Host ownership loss           | Host ownership authority | fence and reacquisition boundary                 |
| Restart-surviving obligation  | durable product owner    | WorkItem or other Foundation primitive           |
| Generic cancellation/disposal | adopted mechanics route  | provider adapter below Heptalogos contracts      |
| Recovery after a failure      | recovery owner           | [`recovery-design`](../recovery-design/SKILL.md) |

Process-local sockets, timers, listeners, handlers, tasks, and child processes
need an activation owner and bounded cancel/drain/dispose behavior. Work that
must survive restart belongs to an existing durable Foundation primitive, not an
in-memory task tracker.

## Failure-model gates

| Finding                                          | Gate                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Normal start/stop path fails or hangs            | Current operational defect; admit the narrow owner correction.                         |
| Expected dependency is unavailable               | Use the existing blocked/degraded/fail-stop contract.                                  |
| Stale generation attempts work                   | Fence the stale call; do not silently rebind it.                                       |
| Cleanup fails after the accepted bounded wait    | Preserve truth and route to the authorized first-order recovery or fail-stop.          |
| New cleanup retry/rollback/recovery is proposed  | Load `recovery-design` and `scope-control`; require a current model and plan decision. |
| A framework exposes a convenient lifecycle state | Do not promote it to product meaning without a semantic distinction.                   |

## Provider and verification route

Use [`mechanics-routing`](../mechanics-routing/SKILL.md) before adding task
tracking, disposal, retry, backoff, or process supervision. Test the weakest
boundary that proves the claim, then run the required integration or restart
scenario. Use [`claim-verification`](../claim-verification/SKILL.md) when the
claim exceeds a pure unit test.

## Output

Record:

```text
Semantic owner and generation:
Desired/Actual transition:
Admission boundary:
In-flight work:
Resource owner and provider route:
Point of No Return:
Bounded wait/drain/dispose rule:
First-order failure outcome:
Recovery route, if any:
Verification claim and state:
```

Read the [Runtime Supervision Spec](../../../docs/specs/runtime/runtime-supervision.md)
and [Maintenance Handoff Spec](../../../docs/specs/runtime/maintenance-handoff.md).
