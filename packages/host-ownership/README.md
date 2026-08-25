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
- Host ownership schema and role constants required by the contract.

## Does not own

- Bootstrap orchestration or private PostgreSQL process control.
- The normal persistence service or canonical schema migration authority.
- Runtime Kernel desired/actual reconciliation.
- Product policy that merely uses a Host ownership context.

## Public surface

The public entry point exports Host lease/fence contracts, bootstrap reservation
and provisioning operations, ownership schema setup, token publication and
revocation, database inspection, and `acquireHostLeaseConnection`. Consumers
must carry the typed ownership context through mutation paths.

## Dependencies and boundaries

It depends on `foundation-contracts`, `pg`, and XState. Private PostgreSQL and
integration helpers are development-only composition. Keep raw `pg` access in
this adapter; higher packages consume the ownership contracts and do not create
parallel lease semantics.

## Verification

Run `pnpm nx run host-ownership:test`, its integration target against real
PostgreSQL, and the repository type, boundary, and hygiene gates for boundary
changes.

## Architecture references

Read Corpus S01, S03, S15, and S17, plus the Host ownership qualification ledger,
before modifying lease, token, or fence behavior.
