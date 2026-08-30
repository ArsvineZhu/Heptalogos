# Runtime Supervision Contract

## Scope

This Spec defines current Runtime reconciliation, lifecycle, generation, and
resource ownership semantics.

## Ownership

`runtime-kernel` owns MicroSystem semantic state, Desired/Actual reconciliation,
generation fencing, provider binding, readiness, and lifecycle meaning.
`runtime-substrate` owns only the adopted generic activation/disposal mechanics
behind its contract.

## Invariants

- `RT-001` Runtime reconciliation MUST derive Actual state from Desired state,
  installed generations, bindings, health, capabilities, mode, and applicable
  admission conditions.
- `RT-002` A generation fence MUST prevent retired or stale generation work from
  receiving new calls or committing current-generation-owned outcomes.
- `RT-003` Cross-owner Service/Capability invocation MUST use a Host-owned
  scoped contract/facade and an invocation lifetime bounded by provider
  retirement.
- `RT-004` Process-memory sockets, timers, listeners, handlers, tasks, and child
  processes MUST have an activation owner with bounded cancellation and drain.
- `RT-005` Restart-surviving obligations MUST use a canonical WorkItem or other
  Foundation durable primitive; an in-memory task is never durable by itself.
- `RT-006` When cleanup cannot be proven within the current failure model,
  Runtime MAY fail-stop or fence. It MUST NOT report successful restoration or
  invent recursive recovery branches.

## Lifecycle

Semantic lifecycle ordering is dependent graph identification, dependent
quiescence, target disposal, provider activation, dependent reactivation, and
readiness recomputation. The adopted substrate supplies mechanics, not
Authority.

## References

- [`execution-model.md`](../../docs/architecture/execution-model.md)
- [`runtime-kernel`](../../packages/runtime-kernel/README.md)
- [`runtime-substrate`](../../packages/runtime-substrate/README.md)
