# Workspace packages

These packages are the current Heptalogos Foundation workspace. Each package
has one substantive `README.md` for human orientation, package boundaries, and
local change constraints. The repository root `AGENTS.md` and the single
[`packages/AGENTS.md`](./AGENTS.md) overlay remain authoritative for agent
execution rules; the package README refines them for one package.

Use the compact [`package index`](./INDEX.md) to navigate every workspace
package. Read the target package README before editing; read the index and this
overview when a change crosses package boundaries.

## Bootstrap / recovery closure

- `bootstrap-state` — durable bootstrap state, journal formats, and stores.
- `private-postgres` — private PostgreSQL toolchain and controller mechanics.
- `host-ownership` — Host lease, fence, and ownership-token mechanics.
- `bootstrap-runtime` — installation, recovery, and Host handoff orchestration.

## Canonical data foundation

- `canonical-schema` — current canonical PostgreSQL schema baseline.
- `persistence` — Host-fenced normal PostgreSQL transactions and service API.

## Execution context / evidence foundation

- `time-service` — elapsed and wall-clock abstractions for runtime contracts.
- `execution-lineage` — execution context and lineage propagation.
- `evidence` — retained Evidence records and service semantics.
- `signal` — PostgreSQL LISTEN/NOTIFY wakeup hints and reconnect/rescan mechanics.
- `work-queue` — canonical durable WorkItem contracts, reconciliation, and
  engine-neutral attempt execution.

## Runtime composition

- `runtime-substrate` — narrow Cordis-backed activation and disposal mechanics.
- `runtime-kernel` — Heptalogos Runtime graph, registries, reconciliation, and
  owner lifecycle semantics.

## Shared contracts / schema mechanics

- `foundation-contracts` — IDs, branded contracts, Problems, and shared values.
- `schema-runtime` — generic runtime schema compilation and validation.

The semantic layers are directional guidance, not a strict total dependency
order imposed on every current `package.json`:

```text
foundation-contracts
        ↓
schema/bootstrap/data primitives
        ↓
bootstrap ownership + canonical persistence
        ↓
execution foundation
        ↓
runtime-substrate
        ↓
runtime-kernel

signal and work-queue are Foundation system-service packages composed above the
execution and persistence contracts; durable-execution remains the DBOS adapter.

bootstrap-runtime production path stays outside runtime-kernel/runtime-substrate
and composes with them only at higher Host/product integration boundaries.
```

## Adding or removing a package

Add a workspace package only when it has a distinct semantic owner and a
Corpus-supported boundary. Its manifest must use the adopted dependency route,
its README must follow the current headings below, and the package must be
listed exactly once in [`INDEX.md`](./INDEX.md). Remove a package only after
its consumers and navigation are updated. Do not create a child `AGENTS.md`.

Every package README uses these sections: `Purpose`, `Owns`, `Does not own`,
`Public surface`, `Dependencies and boundaries`, `Change constraints`,
`Verification`, and `Architecture references`. The last section contains direct
relative links into `Architecture_Corpus`; package docs do not duplicate the
Corpus or root agent constitution.

The semantic layers shown above are directional boundaries, not a strict total
dependency order. Shared contracts sit below schema/bootstrap/data primitives;
ownership and persistence support execution foundation; Runtime Substrate sits
below Runtime Kernel. `bootstrap-runtime` production code remains outside the
Runtime Kernel/Substrate path and composes with it only at higher integration
boundaries.
