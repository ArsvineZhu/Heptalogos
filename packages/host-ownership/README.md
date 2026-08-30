# @heptalogos/host-ownership

## Purpose

`host-ownership` is the canonical authority for the Host ownership fence used
by normal PostgreSQL runtime work. It provisions and inspects the ownership
database, publishes and revokes the current Host token, and creates the
lease-bound connection used by canonical mutations. The package turns owner
loss into a database-visible fence rather than relying on process-local state.

## Owns

- Host advisory lease and ownership-fence mechanics.
- Host token publication, revocation, and inspection.
- Bootstrap reservation and Host ownership database setup primitives.
- Lease-bound PostgreSQL connection acquisition.
- Host ownership schema and the five protected role constants required by the
  contract, including the database-only durable-execution role.
- The fenced `HostDurableExecutionAuthority` contract and its callback-scoped
  database credential boundary.

The durable-execution consumer receives only the fenced durable database target
and password callback. It cannot use this contract to reach canonical
`heptalogos.*` tables; DBOS schema mechanics and lifecycle remain owned by the
separate durable-execution adapter.

## Does not own

- Bootstrap orchestration or private PostgreSQL process control.
- The normal persistence service or canonical schema migration authority.
- DBOS lifecycle, queue, or workflow mechanics; the durable role is only the
  Host-owned database boundary for that engine.
- Runtime Kernel desired/actual reconciliation.
- Product policy that merely uses a Host ownership context.

## Public surface

The public entry point exports Host lease/fence contracts, bootstrap reservation
and provisioning operations, ownership schema setup, token publication and
revocation, database inspection, and `acquireHostLeaseConnection`. Consumers
carry the typed ownership context through mutation paths. Durable-engine
consumers receive `HostDurableExecutionAuthority`; they do not receive product
schema privileges through it.

## Dependencies and boundaries

It depends on `foundation-contracts`, `pg`, and XState. Private PostgreSQL and
integration helpers are development-only composition. Raw `pg` access stays in
this adapter; higher packages consume the ownership contracts rather than
creating parallel lease semantics.

## Verification

Run `pnpm nx run host-ownership:test`, its integration target against real
PostgreSQL, and the repository type, boundary, and hygiene gates for boundary
changes. Durable-execution qualification also exercises the durable role's schema/data privilege
isolation through the real Host composition.

## Architecture references

- [`Host ownership Spec`](../../specs/runtime/host-ownership.md)
- [`Persistence transaction Spec`](../../specs/data/persistence-transactions.md)
- [`Bootstrap closure Spec`](../../specs/runtime/bootstrap-closure.md)
- [`Storage lifecycle Architecture`](../../docs/architecture/storage-lifecycle.md)
