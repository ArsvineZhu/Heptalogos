# Service, Capability, and Readiness Contract

## Scope

This Spec defines current Runtime composition semantics for Services,
Capabilities, MicroSystems, and Readiness Profiles.

## Ownership

`runtime-kernel` owns Runtime semantic state, reconciliation, generation
fences, and readiness. `runtime-substrate` supplies bounded activation-resource
mechanics behind the Kernel contract.

## Invariants

- `READY-001` A Service is a stable typed dependency contract; a Capability is
  a dynamically available ability. They MUST NOT be treated as the same
  dependency kind.
- `READY-002` Service and Capability descriptors MUST carry stable semantic
  identity and contract version. Provider selection MUST use explicit binding,
  policy/scope/compatibility, health/readiness, configured preference, and a
  stable provider tie-break; registration order is not Authority.
- `READY-003` Desired State and Actual State are separate. A desired `RUNNING`
  component MAY be `BLOCKED`, `DEGRADED`, or `FAILED` when prerequisites are
  unavailable.
- `READY-004` Activation resolving is not proof of readiness. Readiness MUST be
  evaluated from the applicable profile and structured dependency state.
- `READY-005` Failure of an optional component SHOULD affect only its dependent
  capability/profile; it MUST NOT implicitly fail unrelated Runtime graph
  members.
- `READY-006` Each activation owns its process-memory resources through an
  activation scope. Work that must survive restart belongs to a durable
  Foundation obligation.

## State Model

Current MicroSystem semantic states include `DISCOVERED`, `INCOMPATIBLE`,
`DISABLED`, `WAITING_DEPENDENCY`, `BLOCKED_POLICY`, `NOT_CONFIGURED`,
`STARTING`, `READY`, `DEGRADED`, `QUIESCING`, `STOPPED`, and `FAILED`.

## Lifecycle

Reconciliation identifies the affected graph, quiesces dependents, disposes the
target, activates eligible providers, and recomputes health/capability/readiness
without changing product meaning to match a framework state machine.

## References

- [`system-architecture.md`](../../docs/architecture/system-architecture.md)
- [`execution-model.md`](../../docs/architecture/execution-model.md)
- [`runtime-kernel`](../../packages/runtime/runtime-kernel/README.md)
- [`runtime-substrate`](../../packages/runtime/runtime-substrate/README.md)
