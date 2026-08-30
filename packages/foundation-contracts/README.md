# @heptalogos/foundation-contracts

## Purpose

`foundation-contracts` is the low-level shared vocabulary for Foundation
packages. It provides branded identifiers, canonical JSON and digest helpers,
runtime identity constructors, lifecycle-root identifiers, Problem errors, and
data-governance types. The package is intentionally below product services so
all higher layers can share stable value semantics without importing a runtime
framework, database, or process adapter.

## Owns

- Branded IDs and parsing/formatting for Foundation identities.
- Canonical JSON and digest mechanics.
- Runtime/service/capability identity primitives.
- Lifecycle-root, Problem, retry-class, retention, and sensitivity contracts.

## Does not own

- Database, filesystem, process, framework, or network I/O.
- Host, Bootstrap, Runtime, persistence, or product policy.
- Schema validation policy for a specific product/domain payload.
- A generic replacement for a higher-level service contract.

## Public surface

The entry point exports canonicalization and digest helpers, branded identity
constructors/parsers, lifecycle-root IDs, Problem types, retry classes, and
data-governance types. `createProblem` and `createProblemError` are the shared
construction seam for canonical Problem envelopes. Public values must retain
the semantic distinctions that their names communicate; do not flatten
authority or lifecycle roots into untyped strings.

## Dependencies and boundaries

It depends only on the adopted canonicalization library and UUID library. Keep
the package dependency-light and framework-free. Higher packages may depend on
these primitives; this package must not import them back or perform side effects
to discover runtime state.

## Change constraints

Keep this package framework-, database-, process-, and network-free. Preserve
semantic distinctions in branded IDs and error/retry contracts. Use the adopted
canonicalization and UUID dependencies; do not move higher-level Authority or
policy into shared primitives.

## Verification

Run `pnpm nx run foundation-contracts:test`, lint, `pnpm typecheck`, `pnpm tsc6`,
and the relevant property tests for identity or canonicalization changes.

## Architecture references

- [`00 — 项目宪法与工程宪法`](../../project/governance/constitution.md)
- [`03 — 核心概念与 Authority`](../../docs/architecture/authority-and-core-concepts.md)
- [`12 — 数据、证据、内容与持久化`](../../docs/architecture/data-evidence-persistence.md)
- [`22 — Execution-Lineage 与可观测执行`](../../docs/architecture/execution-lineage.md)
- [`23 — 存储拓扑、生命周期根与 DataOwner`](../../docs/architecture/storage-lifecycle.md)
