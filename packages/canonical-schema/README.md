# @heptalogos/canonical-schema

## Purpose

`canonical-schema` materializes the current canonical PostgreSQL schema used by
the Foundation persistence layer. It provides the initializer and current
development baseline that creates the tables, functions, and constraints needed
by Host ownership, persistence, lineage, and evidence. During
`PRE_PRODUCTION`, this is the rewriteable canonical baseline rather than a
chronology-preserving migration archive.

## Owns

- Canonical schema definition and initialization.
- Current migration/baseline mechanics required to materialize that schema.
- Schema initialization contract and its runtime options.

## Does not own

- Connection pools or normal transaction APIs.
- Host lease acquisition or ownership fencing.
- Bootstrap maintenance control.
- Compatibility readers or migrations for project-owned development history.

## Public surface

The package exports `CanonicalSchemaRuntimeOptions`,
`CanonicalSchemaInitializer`, and `createCanonicalSchemaInitializer`. The
initializer is consumed by the owning bootstrap/persistence composition rather
than used as a general SQL execution surface.

## Dependencies and boundaries

It depends on `foundation-contracts`, `host-ownership`, Kysely, and `pg`.
Database connection and Host context come from the caller's owning layer. Keep
schema ownership separate from transaction and lifecycle ownership; do not add
a second schema authority in persistence or Bootstrap.

## Verification

Run `pnpm nx run canonical-schema:test`, lint, typecheck, and the relevant real
PostgreSQL initialization/integration scenarios. Any baseline rewrite also
requires the PRE_PRODUCTION reset/recreate procedure and full repository gates.

## Architecture references

Read Corpus S03, S12, S15, S17, and the canonical persistence qualification
record before changing schema, constraints, or initialization behavior.
