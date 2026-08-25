# @heptalogos/persistence

## Purpose

`persistence` is the normal Host-fenced PostgreSQL service used by Foundation
components. It creates the connection pool and exposes read and mutation
transaction contracts carrying execution and ownership context. The package
keeps canonical database access behind a service boundary so callers cannot
silently mutate state after Host ownership is lost.

## Owns

- Normal PostgreSQL connection-pool lifecycle.
- Host-fenced transaction entry and mutation/read transaction contexts.
- Persistence service state and execution metadata propagation.
- The package's foundation repository integration surface.

## Does not own

- Host lease acquisition or token publication.
- Canonical schema materialization or migration policy.
- Bootstrap private PostgreSQL maintenance.
- Runtime scheduling, durable work, or external-effect semantics.

## Public surface

The entry point exports persistence runtime options, transaction and execution
context types, `PersistenceService`, state types, and
`createPersistenceService`. The `./foundation-repository` subpath exposes the
explicit repository integration surface. Consumers must use the service and
carry the required Host and execution context.

## Dependencies and boundaries

It depends on `foundation-contracts`, `execution-lineage`, `host-ownership`,
`schema-runtime`, `time-service`, Kysely, and `pg`. Host ownership remains the
fence Authority and canonical-schema remains the schema Authority. Do not
introduce direct SQL mutation paths around the service.

## Verification

Run `pnpm nx run persistence:test`, the real PostgreSQL integration target, and
lint/typecheck. Changes to fencing, transactions, or restart behavior require
the corresponding persistence and Host qualification scenarios.

## Architecture references

Read Corpus S03, S15, S16, S17, and the persistence qualification record before
changing transaction, connection, or context propagation behavior.
