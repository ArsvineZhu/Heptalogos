# @heptalogos/execution-lineage

## Purpose

`execution-lineage` carries the causal context that connects a Foundation
operation to its originating Activity, Host handoff, and retained evidence. It
defines the execution context contract, runtime provider, lineage reference
encoding, persistence adapter, and bootstrap handoff projection. The package
supports observability and evidence correlation without becoming a scheduler or
the owner of durable work.

## Owns

- ExecutionContext and lineage context reference contracts.
- Runtime creation and propagation helpers.
- Persistence execution-context provider integration.
- Execution-lineage service and Bootstrap handoff projection.

## Does not own

- Runtime scheduling, MicroSystem reconciliation, or generation control.
- Durable Evidence retention policy beyond its declared service integration.
- Host lease acquisition or canonical persistence mutation policy.
- Generic logging or telemetry transport.

## Public surface

The package exports Activity and ExecutionContext types, runtime creation,
lineage reference encode/decode, persistence provider and service factories,
and the Bootstrap handoff projection. It also exposes the runtime-kernel
subpath for the explicitly routed integration surface.

## Dependencies and boundaries

It depends on `foundation-contracts`, `persistence`, `schema-runtime`,
`time-service`, OpenTelemetry API, and Kysely. Keep framework telemetry types
behind the package contracts. Persistence and Evidence remain their respective
authorities; lineage adds correlation and causal semantics rather than a second
database or scheduler.

## Verification

Run `pnpm nx run execution-lineage:test`, lint, typecheck, and persistence-backed
lineage scenarios when the adapter or atomicity behavior changes. Use real
PostgreSQL when the claim concerns durable lineage.

## Architecture references

Read Corpus 22, S03, S10, S15, S16, and the lineage qualification material before
changing context propagation, handoff, or retained Activity behavior.
