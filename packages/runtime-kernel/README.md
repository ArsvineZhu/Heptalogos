# @heptalogos/runtime-kernel

## Purpose

`runtime-kernel` owns the Heptalogos Runtime semantics that compose
MicroSystems, Services, Capabilities, generations, readiness, and lifecycle.
It turns desired state into a deterministic runtime graph, supervises activation
and retirement, fences stale generations, and exposes quiescence for Host
shutdown. The package is the semantic layer above the generic substrate; it is
not the Bootstrap or PostgreSQL owner.

## Owns

- `MicroSystemSupervisor` and owner/quiescence lifecycle.
- Runtime graph planning and reconciliation.
- Service and Capability registries and lease contracts.
- Generation fences, readiness evaluation, and lifecycle lineage.
- Runtime contract matching and compatibility evaluation.
- Generation-pinned WorkHandler declaration, validation, publication, and lookup.

## Does not own

- Bootstrap state, Host lease, private PostgreSQL, or process control.
- Cordis-specific resource mechanics.
- Product durable WorkItem state, WorkQueue, DBOS, or external-effect semantics.
- A second persistence or recovery Authority.

## Public surface

The entry point exports runtime contracts, contract-matching helpers, registries,
generation fences, readiness evaluation, graph/reconciler types,
`MicroSystemSupervisor`, and lifecycle-lineage helpers. Activation contexts carry
cooperative cancellation and owner scope; callers must respect quiescence and
retirement rather than retaining private supervisor state.

## Dependencies and boundaries

It depends on `foundation-contracts`, `execution-lineage`, `persistence`,
`runtime-substrate`, `time-service`, and Graphlib. The substrate supplies
mechanics while this package owns runtime meaning. Bootstrap production source
must remain outside this dependency path; integration composition belongs at
the higher Host/product boundary.

## Change constraints

Runtime topology Authority is `DesiredRuntimeSnapshot` reconciliation; do not
add a general imperative topology mutation path. Do not import Bootstrap private
types. Keep Cordis mechanics behind `runtime-substrate` and do not introduce
product durable-work/effect semantics. Lifecycle and quiescence changes require
focused concurrency and cancellation tests.

## Verification

Run `pnpm nx run runtime-kernel:test`, lint, `pnpm typecheck`, `pnpm tsc6`, and
focused lifecycle, quiescence, generation, readiness, and cancellation tests.
Use real PostgreSQL only for claims that cross the runtime/Host integration.

## Architecture references

- [`S01 — 启动、恢复与运行时监督`](../../Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md)
- [`S06 — Extension、Package Trust 与 ExecutionDomain`](../../Architecture_Corpus/specs/S06-Extension-Package-Trust-ExecutionDomain.md)
- [`S13 — Foundation Service/Capability/Readiness`](../../Architecture_Corpus/specs/S13-Foundation-Service-Capability-Readiness-Catalog.md)
- [`S15 — Foundation 横切合同`](../../Architecture_Corpus/specs/S15-Foundation横切合同.md)
- [`S16 — Execution Lineage Observability`](../../Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md)
