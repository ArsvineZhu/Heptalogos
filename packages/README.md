# Workspace packages

These packages are the current Heptalogos Foundation workspace. Each package
has a local `README.md` for human orientation and an `AGENTS.md` for concise
implementation rules. The repository root `AGENTS.md` and Architecture Corpus
remain authoritative; local files refine them for one package.

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

bootstrap-runtime production path stays outside runtime-kernel/runtime-substrate
and composes with them only at higher Host/product integration boundaries.
```

Use each package's verification target and the repository gates for changes that
cross package boundaries.
