# @heptalogos/runtime-kernel

## Purpose

`runtime-kernel` owns the Heptalogos Runtime semantics that compose
MicroSystems, Services, Capabilities, generations, readiness, and lifecycle.
It turns desired state into a deterministic runtime graph, supervises activation
and terminal retirement, and fences stale generations. The package is the
semantic layer above the generic substrate; it is not the Bootstrap or
PostgreSQL owner.

## Owns

- `MicroSystemSupervisor` and owner/terminal lifecycle.
- Runtime graph planning and reconciliation.
- Service and Capability registries and lease contracts.
- Generation fences, readiness evaluation, and lifecycle lineage.
- Runtime contract matching and compatibility evaluation.
- Generation-pinned WorkHandler declaration, validation, publication, and lookup.
- Supervisor terminal lifecycle and owner-abort handling.

## Does not own

- Bootstrap state, Host lease, private PostgreSQL, or process control.
- Cordis-specific resource mechanics.
- XState types or statechart objects in the public contract.
- Product durable WorkItem state, WorkQueue, DBOS, or external-effect semantics.
- A second persistence or recovery Authority.

## Public surface

The entry point exports runtime contracts, contract-matching helpers, registries,
generation fences, readiness evaluation, graph/reconciler types,
`MicroSystemSupervisor`, and lifecycle-lineage helpers. Activation contexts carry
cooperative cancellation and owner scope so callers can participate in
component retirement without retaining private supervisor state. The supervisor
does not expose a cross-layer reversible pause/resume lease.

## Dependencies and boundaries

It depends on `foundation-contracts`, `execution-lineage`, `persistence`,
`runtime-substrate`, `time-service`, and Graphlib. The
package-private graph, registry, generation, and lifecycle adapters own those
mechanics while this package owns runtime meaning. The dependency graph keeps
Bootstrap production source outside this path; integration composition belongs
at the higher Host/product boundary.

## Verification

Run `pnpm nx run runtime-kernel:test`, lint, `pnpm typecheck`, `pnpm tsc6`, and
focused lifecycle, component-retirement, generation, readiness, and
cancellation tests.
Use real PostgreSQL only for claims that cross the runtime/Host integration.

## Architecture references

- [`Runtime supervision Spec`](../../../specs/runtime/runtime-supervision.md)
- [`Service, capability, and readiness Spec`](../../../specs/core/service-capability-readiness.md)
- [`Extensions Architecture`](../../../docs/architecture/extensions.md)
- [`Execution lineage Spec`](../../../specs/execution/execution-lineage.md)
