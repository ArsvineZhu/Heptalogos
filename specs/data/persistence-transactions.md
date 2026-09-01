# Persistence Transaction Contract

## Scope

This Spec defines the normal PostgreSQL persistence boundary for canonical
Foundation state.

## Ownership

`persistence` owns typed transaction mechanics and Host-fence enforcement.
Domain repositories own schema meaning and canonical Authority. DBOS tables
remain engine-private.

## Invariants

- `PERSIST-001` `heptalogos.*` product state and `dbos.*` engine state are
  semantically distinct even when they share a PostgreSQL instance.
- `PERSIST-002` Kysely/pg mechanics MUST remain behind the Persistence and
  repository contracts; ordinary Extensions do not receive a universal raw
  database handle.
- `PERSIST-003` Normal canonical mutation MUST automatically hold the shared
  HostOwnershipFence, verify the current token, attach required execution
  metadata, and commit through the owning transaction boundary.
- `PERSIST-004` Required retained lineage/evidence identity MUST be established
  atomically with the canonical mutation when the owning contract requires it.
- `PERSIST-005` A current mutation transaction MUST NOT span external I/O,
  model/inference work, human approval, long-running media work, or durable
  sleep. Use snapshot/revision then validate-and-commit.
- `PERSIST-006` Read-only paths MUST NOT obtain a normal mutation repository or
  bypass the Host fence.
- `PERSIST-007` Schema and vendor migrations are owned maintenance operations;
  third-party tooling does not become Management Authority merely by running.

## Failure Semantics

Token mismatch, fence loss, constraint failure, or required evidence failure
fails the mutation according to the owner contract. The system does not report
an untracked successful commit.

## References

- [`host-ownership.md`](../runtime/host-ownership.md)
- [`execution-model.md`](../../docs/architecture/execution-model.md)
- [`persistence`](../../packages/data/persistence/README.md)
