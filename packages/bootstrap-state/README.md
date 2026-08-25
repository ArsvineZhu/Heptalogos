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

It depends on `foundation-contracts`, AJV, TypeBox, and atomic file writing.
Stores own their file mutation path and must remain bounded and crash-safe.
Callers should use the exported models and stores rather than reaching into
codec or file details. It does not import normal Runtime or Host packages.

## Verification

Run `pnpm nx run bootstrap-state:test` and the package lint target. For changes
to durable shapes, also run `pnpm check:corpus`, `pnpm check:hygiene`,
`pnpm typecheck`, and the relevant recovery qualification.

## Architecture references

Read Corpus S01 for startup/recovery supervision, S03 for durable transaction
boundaries, S17 for storage lifecycle roots, and Corpus 16 for evidence claims.
