# @heptalogos/private-postgres

## Purpose

`private-postgres` supplies the mechanics for an installation-owned PostgreSQL
cluster used by Bootstrap and Host setup. It resolves the approved PostgreSQL
toolchain, classifies the private data layout, initializes and starts the
cluster, checks identity and readiness, and exposes bounded maintenance
control. The package isolates process and profile mechanics from higher-level
ownership decisions.

## Owns

- Private PostgreSQL toolchain and placement resolution.
- Cluster layout and `pg_controldata` inspection.
- Initialization, startup, readiness, and existing-cluster validation.
- Canonical HBA/runtime profile mechanics.
- The private PostgreSQL maintenance controller contract.

## Does not own

- Bootstrap orchestration or installation ownership.
- Host lease/fence authority or normal persistence policy.
- Runtime Kernel lifecycle or product durable work.
- A second PostgreSQL provider or arbitrary shell/process policy.

## Public surface

The package exports toolchain and placement contracts, cluster inspection,
initialization/start/validation operations, canonical profile helpers, and
`openPrivatePostgresMaintenanceController`. Callers receive typed dispositions
and bounded control results rather than manipulating `pg_ctl` directly.

## Dependencies and boundaries

It uses `foundation-contracts`, `execa`, and XState. Process execution remains
inside the adapter and must use the repository subprocess mechanics. Bootstrap
and Host packages authorize when these mechanics may be used; this package does
not decide that authority.

## Change constraints

Keep process control behind the exported controller contracts and the adopted
subprocess route. Preserve bounded timeouts, identity/profile checks, and
explicit failure dispositions. Do not decide Bootstrap ownership, Host fencing,
or normal persistence policy here.

## Verification

Run `pnpm nx run private-postgres:test`,
`pnpm nx run private-postgres:test:integration` with the qualified PostgreSQL
runtime, and the package lint target. Include recovery-process checks when
changing startup or maintenance behavior.

## Architecture references

- [`Bootstrap closure Spec`](../../specs/runtime/bootstrap-closure.md)
- [`Persistence transaction Spec`](../../specs/data/persistence-transactions.md)
- [`Platform and distribution Architecture`](../../docs/architecture/platform-distribution.md)
- [`Storage lifecycle Architecture`](../../docs/architecture/storage-lifecycle.md)
