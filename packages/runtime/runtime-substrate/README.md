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
`createRuntimeSubstrate`. Cordis-specific objects stay private to this boundary
and do not appear in package contracts.

## Dependencies and boundaries

It depends on `foundation-contracts` and the adopted `cordis` route. The Cordis
Fiber owns plugin activation, effects, and disposal; RuntimeSubstrate retains
only Heptalogos-specific task admission, failure projection, and settlement
policy. Runtime Kernel owns the semantic lifecycle around this adapter.
Process-memory tasks here are owner-scoped with bounded cancel/drain/dispose
behavior; work that must survive restart belongs to a Foundation durable
primitive in a later stage.

## Verification

Run `pnpm nx run runtime-substrate:test`, lint, typecheck, and focused resource
scope/disposal tests. Use Runtime Kernel tests when a substrate contract affects
owner or generation behavior.

## Architecture references

- [`Runtime supervision Spec`](../../../specs/runtime/runtime-supervision.md)
- [`Service, capability, and readiness Spec`](../../../specs/core/service-capability-readiness.md)
- [`Extensions Architecture`](../../../docs/architecture/extensions.md)
- [`Execution lineage Spec`](../../../specs/execution/execution-lineage.md)
