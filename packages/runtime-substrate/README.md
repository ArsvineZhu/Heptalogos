# @heptalogos/runtime-substrate

## Purpose

`runtime-substrate` is the narrow adapter around Cordis that supplies generic
activation-resource mechanics to the Heptalogos Runtime. It scopes resources,
tracks process-memory background work, and provides bounded disposal and failure
reporting. The package hides Cordis details behind Heptalogos-owned contracts so
Runtime semantics do not become framework semantics.

## Owns

- `ActivationResourceScope` and disposer contracts.
- Substrate activation requests and handles.
- Resource/task tracking and bounded scope disposal.
- Substrate failure normalization.

## Does not own

- Desired/Actual state, MicroSystem semantics, or provider selection.
- Runtime graph, generation fencing, readiness, or quiescence Authority.
- Bootstrap/Host ownership or PostgreSQL control.
- Product durable work or external-effect semantics.

## Public surface

The entry point exports `RuntimeSubstrate`, activation scope and request/handle
contracts, disposer and failure types, `runtimeSubstrateProblem`, and
`createRuntimeSubstrate`. Cordis-specific objects stay behind this boundary and
must not leak into package contracts.

## Dependencies and boundaries

It depends on `foundation-contracts` and the adopted `cordis` route. The Cordis
Fiber owns plugin activation, effects, and disposal; RuntimeSubstrate retains
only Heptalogos-specific task admission, failure projection, and settlement
policy. Runtime Kernel owns the semantic lifecycle around this adapter. Any
process-memory task created here must have an owner and bounded
cancel/drain/dispose behavior; work that must survive restart belongs to a
Foundation durable primitive in a later stage.

## Change constraints

Cordis objects and mechanics must not escape this adapter boundary. Substrate
owns mechanics, not Desired/Actual state, Service/Capability meaning, provider
selection, or Generation Authority. Every process-memory task needs an owner
and bounded cancel/drain/dispose behavior.

## Verification

Run `pnpm nx run runtime-substrate:test`, lint, typecheck, and focused resource
scope/disposal tests. Use Runtime Kernel tests when a substrate contract affects
owner or generation behavior.

## Architecture references

- [`S01 — 启动、恢复与运行时监督`](../../docs/architecture/contracts/startup-recovery-runtime-supervision.md)
- [`S06 — Extension、Package Trust 与 ExecutionDomain`](../../docs/architecture/contracts/extension-package-trust-execution-domain.md)
- [`S13 — Foundation Service/Capability/Readiness`](../../docs/architecture/contracts/foundation-service-capability-readiness-catalog.md)
- [`S15 — Foundation 横切合同`](../../docs/architecture/contracts/foundation-cross-cutting-contracts.md)
- [`S16 — Execution Lineage Observability`](../../docs/architecture/contracts/execution-lineage-observability.md)
