# @heptalogos/signal

## Purpose

`signal` provides the fixed PostgreSQL LISTEN/NOTIFY wakeup hint used to
reduce latency between canonical commits and WorkQueue reconciliation.

## Owns

- The fixed `heptalogos_signal_v1` channel and Signal hint V1 codec.
- Dedicated listener connection lifecycle, topic filtering, reconnect, and
  rescan callbacks.
- Transactional publication of bounded wakeup hints through an existing
  Foundation mutation transaction.

## Does not own

- WorkItem state, canonical payload, queue scheduling, or EventBus semantics.
- Durable truth, handler execution, retry, or DBOS mechanics.
- Host ownership or PostgreSQL pool lifecycle.

## Public surface

The entry point exports Signal topic/codec helpers, the PostgreSQL Signal
service factory, the transactional publisher, and framework-free contracts for
the listener, subscription, and Host authority seams. Raw `pg.Client` objects
do not cross the package boundary.

## Dependencies and boundaries

The package uses the existing Host persistence authority for loopback runtime
credentials and lifetime, `PersistenceInternalTransaction` only through the
Foundation repository seam for publication, and SchemaRuntime for strict hint
validation. It owns one dedicated listener client and never reuses a pooled
mutation connection for LISTEN.

## Change constraints

Keep Signal best-effort: notifications may be lost or coalesced, and every
wakeup must lead to canonical re-query by its consumer. Keep the channel fixed,
the payload bounded and typed, and reconnects followed by `LISTEN` and rescan.
Do not add durable facts, payloads, credentials, a second event bus, or a
queue scheduler here.

## Verification

Run `pnpm nx run signal:test`, `pnpm nx run signal:lint`, typecheck, and the
real PostgreSQL Signal scenarios in the bootstrap-runtime integration suite.
Reconnect and listener failures must be covered with bounded fake-client unit
tests; real LISTEN/NOTIFY claims require real PostgreSQL.

## Architecture references

- [`Signal Spec`](../../docs/specs/execution/signal.md)
- [`Work Item Spec`](../../docs/specs/execution/work-item.md)
- [`Persistence transaction Spec`](../../docs/specs/data/persistence-transactions.md)
- [`Execution lineage Spec`](../../docs/specs/execution/execution-lineage.md)
- [`Foundation services Architecture`](../../docs/architecture/foundation-services.md)
