# @heptalogos/bootstrap-state

## Purpose

`bootstrap-state` stores the small, crash-safe state that must remain available
before normal product PostgreSQL ownership is established and during recovery.
It provides typed envelopes, canonical encoding, local stores, and journals for
bootstrap and bounded maintenance operations. The package is a persistence
primitive for the Bootstrap closure; it is not a general application database.

## Owns

- BootstrapState envelope parsing and sealing.
- Bootstrap and maintenance journal models, codecs, and stores.
- Bootstrap owner witness encoding and storage.
- Versioned bootstrap-visible continuity and recovery records.

## Does not own

- Normal PostgreSQL business state or the persistence service.
- Host advisory leases, Host fencing, or Runtime supervision.
- Product-level migration policy outside the current bootstrap baseline.

## Public surface

The package exports `BootstrapStateStore`, `BootstrapJournal`,
`MaintenanceJournalStore`, `BootstrapOwnerWitnessStore`, their typed models,
and the codec helpers used by Bootstrap orchestration. Public values are
versioned where the architecture requires durable contract evolution.

## Dependencies and boundaries

It depends on `foundation-contracts`, `schema-runtime`, and atomic file
writing. SchemaRuntime owns Ajv/TypeBox mechanics; BootstrapState owns durable
shape semantics, keyed file serialization, and the bounded crash-safe store
mutation path. Callers use the exported models and stores rather than reaching
into codec or file details. It does not import normal Runtime or Host packages.

## Verification

Run `pnpm nx run bootstrap-state:test` and the package lint target. For changes
to durable shapes, also run `pnpm check:knowledge`, `pnpm check:hygiene`,
`pnpm typecheck`, and the relevant recovery qualification.

## Architecture references

- [`Bootstrap closure Spec`](../../specs/runtime/bootstrap-closure.md)
- [`Persistence transaction Spec`](../../specs/data/persistence-transactions.md)
- [`Storage lifecycle Architecture`](../../docs/architecture/storage-lifecycle.md)
- [`Verification system`](../../project/qualification/verification-system.md)
