# Package Agent Contract

## Scope

Typed retained Evidence drafts, records, service semantics, and persistence
integration.

## Read first

- `README.md`
- repository `AGENTS.md`
- Corpus S10, S12, and S16

## Local rules

- Use the persistence service; do not write Evidence tables directly.
- Keep Evidence distinct from telemetry, Activity lineage, and logs.
- Preserve sensitivity/retention semantics from shared contracts.
- Match qualification claims to observed evidence and environment.

## Verification

Run the package test/lint targets and persistence-backed scenarios affected by
the change.

## Stop

Stop for a second Evidence store, an identity/lineage ownership change, or a
retention/contract decision absent from Corpus and the active plan.
