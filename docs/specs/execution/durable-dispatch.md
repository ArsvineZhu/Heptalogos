# Durable Dispatch Contract

## Scope

This Spec defines the current DBOS adapter boundary for dispatching canonical
WorkItems.

## Ownership

`durable-execution` owns the Heptalogos adapter and lifecycle boundary. DBOS
owns workflow, recovery, and queue mechanics. WorkQueue remains product
Authority.

## Invariants

- `DEX-001` DBOS state MUST remain an execution projection. It MUST NOT replace
  canonical WorkItem state, generation identity, or terminal outcome Authority.
- `DEX-002` The standard route is a bounded static dispatcher identified by
  `(WorkItemId, dispatchRevision)`; dynamic Extensions MUST NOT register raw
  DBOS workflows.
- `DEX-003` `DispatchAttemptId` and the DBOS workflow identity MUST be derived
  deterministically from WorkItem identity and dispatch revision.
- `DEX-004` The durable-code/application version is distinct from Product and
  PackageGeneration identities. A durable-code mismatch MUST block unsafe
  recovery rather than silently run another version.
- `DEX-005` A retry after a canonical terminal outcome MUST read the terminal
  WorkItem and return the stored outcome or a no-op; it MUST NOT repeat logical
  work.
- `DEX-006` DBOS client construction and any password-bearing connection URL
  MUST remain inside the credential callback used for preflight. The client
  MUST be destroyed before the callback exits, and the caller-owned pool remains
  caller-owned.

## Lifecycle

The adapter owns a Host-bound DBOS pool and process binding. Close is truthful:
the lifecycle is not `CLOSED` until required DBOS shutdown, active invocation
drain, pool close, listener cleanup, and binding release are proven.

## References

- [`Execution model`](../../architecture/execution-model.md)
- [`durable-execution`](../../../packages/durable-execution/README.md)
- [`work-item.md`](./work-item.md)
