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

## Change constraints

Keep durable envelopes and journals versioned where their contracts require it.
Preserve atomic file mutation and explicit parse failures. Do not add normal
database, Host lease, or Runtime lifecycle ownership here.

## Verification

Run `pnpm nx run bootstrap-state:test` and the package lint target. For changes
to durable shapes, also run `pnpm check:corpus`, `pnpm check:hygiene`,
`pnpm typecheck`, and the relevant recovery qualification.

## Architecture references

- [`S01 — 启动、恢复与运行时监督`](../../Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md)
- [`S03 — 持久化、事务与 EffectFence`](../../Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md)
- [`S17 — Storage Workspace 与 DataLifecycle`](../../Architecture_Corpus/specs/S17-Storage-Workspace-DataLifecycle.md)
- [`16 — 验证与资格认定体系`](../../Architecture_Corpus/16-验证与资格认定体系.md)
