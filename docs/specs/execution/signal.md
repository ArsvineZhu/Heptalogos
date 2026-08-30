# Signal Contract

## Scope

This Spec defines PostgreSQL LISTEN/NOTIFY as the current best-effort wakeup
mechanic for canonical WorkQueue reconciliation.

## Ownership

`signal` owns the transport adapter. WorkQueue owns the durable source of truth
and scan decision.

## Invariants

- `SIG-001` A Signal is a wakeup/change hint, never a durable fact, WorkItem
  identity, or unique source of state.
- `SIG-002` A WorkItem mutation and its required wakeup publication SHOULD use
  the same persistence transaction so a committed item remains discoverable
  even when notification delivery is lost.
- `SIG-003` A listener MUST establish an initial canonical scan, re-query after a
  wakeup, and re-LISTEN plus rescan after reconnect or listener loss.
- `SIG-004` Signal payloads MUST be bounded and MUST NOT carry unique durable
  truth.
- `SIG-005` Listener connections and subscriptions MUST have an owning scope
  and bounded close behavior.

## Failure Semantics

Coalesced or lost notifications may increase latency only. Anti-entropy scans
and canonical repository reads remain authoritative.

## References

- [`Execution model`](../../architecture/execution-model.md)
- [`signal`](../../../packages/signal/README.md)
- [`work-item.md`](./work-item.md)
