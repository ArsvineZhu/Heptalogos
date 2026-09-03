---
name: lifecycle-change
description: Use when an already-authorized change alters start, stop, drain, dispose, quiesce, resume, ownership loss, restart, generation transitions, or background resource lifetime.
---

# Lifecycle Change

Use this procedure for a lifecycle change already resolved by the active Plan
and current Spec. The procedure keeps ownership and proof explicit; it does
not design a new failure model or recovery protocol.

## Inspect

Identify the Desired/Actual states and legal transitions; semantic owner and
generation; admission boundary and in-flight work; each process-local resource;
the adopted provider primitive; the point of no return; the bounded drain/
dispose rule; the first-order terminal outcome; and the Plan's proof boundary.

Process-local sockets, timers, listeners, handlers, tasks, and child processes
need an activation owner and bounded cancellation/drain/disposal. Work that
must survive restart belongs to an existing durable Foundation obligation.

## Implement

Keep canonical mutation behind the semantic owner. Stop new admission before
draining, fence stale generations, dispose resources through the adopted
provider route, and publish only a proven terminal or failed outcome. A
framework state or returned callback does not by itself prove product
readiness or successful restoration.

If the authorized bounded failure outcome is insufficient for an observed
failure, preserve canonical truth and use the Plan's fail-stop or fence
behavior. Do not add recovery-of-recovery or lifecycle machinery that the Plan
does not authorize.

## Verify

Run the focused lifecycle/unit, provider, integration, or process scenario
named by the Plan. Use claim-verification when the claim exceeds a pure unit
boundary. Record only PASS, FAIL, NOT_RUN, or BLOCKED for what actually ran.

Read the Runtime Supervision Spec at
../../../specs/runtime/runtime-supervision.md and the Maintenance Handoff Spec
at ../../../specs/runtime/maintenance-handoff.md.
