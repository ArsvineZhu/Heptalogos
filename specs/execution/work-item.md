# Work Item Contract

## Scope

This Spec defines the canonical durable processing obligation owned by
`work-queue`.

## Ownership

`WorkQueueService` and its canonical repository own WorkItem identity, state,
target, payload, dispatch revision, outcome, and reconciliation semantics.

## Invariants

- `WI-001` A WorkItem represents a durable obligation, not an engine queue row
  or process-local task.
- `WI-002` A WorkItem MUST preserve its WorkHandler target, including
  MicroSystem, Contribution, PackageGeneration, and payload version.
- `WI-003` The current state set is `PENDING`, `RUNNING`,
  `WAITING_DEPENDENCY`, `RETRY_WAIT`, `WAITING_RESTORE_RECONCILIATION`,
  `SUCCEEDED`, `FAILED`, `CANCELLED`, and `SUPERSEDED`. Terminal states are
  `SUCCEEDED`, `FAILED`, `CANCELLED`, and `SUPERSEDED`.
- `WI-004` Creation MUST atomically establish the canonical WorkItem and any
  required lineage/evidence, then publish only a best-effort wakeup hint.
- `WI-005` Every attempt transition MUST be fenced by WorkItem identity,
  expected dispatch revision/current attempt, and Host ownership where the
  mutation is normal runtime work.
- `WI-006` Cancellation or supersession intent is distinct from proof that a
  running attempt has stopped. The first accepted terminal intent for an
  identity/revision wins.
- `WI-007` WorkItem payloads MUST be bounded, versioned, and free of secret
  plaintext, session material, and temporary credentials.
- `WI-008` Signal loss, engine projection loss, and process restart MUST leave
  the canonical obligation recoverable through reconciliation.

## Lifecycle

```text
create → PENDING → RUNNING → terminal
                  ↘ RETRY_WAIT / WAITING_DEPENDENCY
```

Wake transitions create a new dispatch revision before a new attempt is
scheduled. Restore reconciliation owns `WAITING_RESTORE_RECONCILIATION`.

## References

- [`Execution model`](../../docs/architecture/execution-model.md)
- [`work-queue`](../../packages/work-queue/README.md)
- [`durable-dispatch.md`](./durable-dispatch.md)
