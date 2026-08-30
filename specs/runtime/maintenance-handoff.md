# Maintenance Handoff Contract

## Scope

This Spec defines entry to and exit from a bounded maintenance window that may
stop or replace private PostgreSQL or other normal Host substrate.

## Ownership

Normal Host and Bootstrap/Recovery share an explicit reverse-handoff protocol;
`bootstrap-runtime` owns the concrete handoff and journal composition.

## Invariants

- `MAINT-001` A normal Host MUST retain its lease while it acquires bootstrap
  ownership. The lease MUST NOT be released before the reverse handoff is held.
- `MAINT-002` Before the point of no return, maintenance MUST close new
  admission, stop reconciliation, and perform bounded drain/quiescence.
- `MAINT-003` The point of no return is durable Host authority revocation or an
  equivalent irreversible ownership transition. After it begins, the old Host
  MUST NOT be reported as normally active.
- `MAINT-004` After the point of no return, failure proceeds through bounded
  recovery/reacquisition or a terminal recovery outcome; it does not pretend to
  restore an unproven old Host.
- `MAINT-005` Maintenance stages and terminal outcome MUST be represented by
  the owning journal/evidence boundary before the next consequential stage.

## Failure Semantics

Pre-entry failure may restore normal admission when restoration succeeds. A
failure after provider teardown or authority revocation remains non-active and
is handled by recovery/fencing.

## References

- [`execution-model.md`](../../docs/architecture/execution-model.md)
- [`bootstrap-closure.md`](./bootstrap-closure.md)
- [`bootstrap-runtime`](../../packages/bootstrap-runtime/README.md)
