# Maintenance Handoff Contract

## Scope

This Spec defines the bounded, one-way operation used to stop or restart the
private PostgreSQL cluster that backs the normal Host.

## Ownership

`bootstrap-runtime` owns the maintenance operation and its journal composition.
Host ownership remains the authority for the advisory lease, token, and fence;
private PostgreSQL remains the authority for external process state.

## Journal contract

The V1 journal is a compact operation witness containing the operation,
activity, installation, instance, source Host and PostgreSQL identity, target,
current phase, update time, and optional Problem code. The phases are:

```text
PREPARED → EXECUTING → RECOVERY_REQUIRED → SUCCEEDED
       └→ ABORTED
```

`SUCCEEDED` and `ABORTED` are terminal. `PREPARED` is the only phase in which
`abortBeforeExecute()` may cancel the operation without Host or PostgreSQL
authority mutation.

## Invariants

- `MAINT-001` A normal Host MUST retain its lease while Bootstrap acquires the
  authority required for the operation. The lease MUST NOT be released before
  the reverse handoff is held.
- `MAINT-002` Execution MUST terminalize product-runtime admission and invoke
  the supplied runtime-retirement owner. A successful retirement does not
  reopen the old runtime; a retirement failure does not authorize reconstructing
  it.
- `MAINT-003` The journal MUST record `EXECUTING` before consequential Host or
  PostgreSQL authority mutation.
- `MAINT-004` Host token revocation/fencing is the point of no return. After it,
  the old Host MUST NOT be reported as active or republished.
- `MAINT-005` STOP MUST converge the same validated PostgreSQL cluster to
  `STOPPED` and commit `SUCCEEDED` with the stopped target.
- `MAINT-006` RESTART MUST converge the same validated cluster to `READY`, then
  use the ordinary Bootstrap-to-Host handoff to publish a fresh lease/token
  identity before committing `SUCCEEDED`.
- `MAINT-007` Failure after execution entry MUST remain fail-stop or
  `RECOVERY_REQUIRED`; it MUST NOT restore the old Runtime, DBOS, WorkQueue, or
  Host as a rollback path.

## Recovery

Recovery acquires the required Bootstrap authority and inspects current Host
fence, journal, and PostgreSQL truth. A safe `PREPARED` operation is resolved
with terminal `ABORTED`. An executing STOP or RESTART converges the same
cluster to its recorded target. RESTART uses the ordinary forward handoff and
does not contain a second Host publication algorithm.

If current truth cannot establish a safe convergence, recovery records or
retains `RECOVERY_REQUIRED` with current Problem evidence. It does not replay
internal substeps or create another recovery protocol. Normal Bootstrap blocks
while an incomplete operation remains unresolved.

## References

- [`execution-model.md`](../../docs/architecture/execution-model.md)
- [`bootstrap-closure.md`](./bootstrap-closure.md)
- [`host-ownership.md`](./host-ownership.md)
- [`bootstrap-runtime`](../../packages/bootstrap/bootstrap-runtime/README.md)
