# Work Handler Contract

## Scope

This Spec defines the generation-bound handler contribution invoked by durable
dispatch.

## Ownership

Runtime Kernel owns handler registration and generation fencing. The handler
contribution owner defines its payload and outcome schema.

## Invariants

- `WH-001` A handler descriptor MUST identify its Contribution, accepted payload
  versions, PackageGeneration, queue profile, resource/admission class,
  configuration binding policy, and restore replay class.
- `WH-002` Invocation MUST carry a Host-created ExecutionContext and MUST resolve
  the exact generation-pinned handler requested by the WorkItem.
- `WH-003` A handler attempt MUST be restartable. Canonical writes MUST be
  keyed/fenced by the owning WorkItem or operation identity.
- `WH-004` A stale, superseded, cancelled, or terminal attempt MUST NOT commit a
  new canonical outcome. A terminal WorkItem re-entry returns its stored result.
- `WH-005` A handler contribution MUST NOT register raw DBOS workflows or bypass
  Persistence, Host fencing, or Lineage. Any separately owned side-effect
  contract remains responsible for its own admission and fencing.
- `WH-006` If a referenced generation cannot read the payload, the owner must
  retain a compatible handler, explicitly migrate/cancel/supersede, or block
  retirement; silent rebinding is not allowed.

## Failure Semantics

Provider or handler failures are classified through the WorkQueue error
contract. The canonical WorkItem remains authoritative when engine projection
or handler execution fails.

## References

- [`work-item.md`](./work-item.md)
- [`service-capability-readiness.md`](../core/service-capability-readiness.md)
- [`runtime-kernel`](../../../packages/runtime-kernel/README.md)
