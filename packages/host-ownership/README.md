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

## Change constraints

Keep one Host ownership Authority and one database fence contract. Require
ownership context for canonical mutation connections. Keep raw `pg` mechanics
inside this adapter and do not add Bootstrap orchestration or Runtime lifecycle
semantics.

## Verification

Run `pnpm nx run host-ownership:test`, its integration target against real
PostgreSQL, and the repository type, boundary, and hygiene gates for boundary
changes.

## Architecture references

- [`S01 — 启动、恢复与运行时监督`](../../Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md)
- [`S03 — 持久化、事务与 EffectFence`](../../Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md)
- [`S15 — Foundation 横切合同`](../../Architecture_Corpus/specs/S15-Foundation横切合同.md)
- [`S17 — Storage Workspace 与 DataLifecycle`](../../Architecture_Corpus/specs/S17-Storage-Workspace-DataLifecycle.md)
