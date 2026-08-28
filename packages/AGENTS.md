# Package Workspace Agent Contract

## Scope

This file governs work under `packages/**`.

Before editing a package, read its `README.md`; for cross-package changes also
read [`INDEX.md`](./INDEX.md) and [`README.md`](./README.md).

Package READMEs are implementation-local navigation and boundary guidance,
subordinate to root `AGENTS.md` and the Architecture Corpus. Do not infer
Authority from code history, milestones, tests, or dependency accidents.

Durable source modules need meaningful package/module docs.
Document exported contracts and non-obvious invariants.
Comments explain semantics, not syntax or type information.
Generated API docs are derived; edit source docs instead.

Do not create `AGENTS.md` inside package directories; put package-specific
constraints in the package `README.md`.

Keep changes inside the package's ownership and dependency direction.
If a change moves Authority, adds a cross-package dependency or compatibility
behavior, or contradicts the Corpus, stop with `PLAN_GAP`.

## Mechanics Ownership Preflight

Before adding a helper, class, or adapter for schema/parsing, discovery,
processes, concurrency, retry/timeout, graphs, state machines, disposal,
serialization, database, queue, observability, or protocol mechanics, use:

```text
package search → workspace exports → packages/INDEX.md + README
→ dependency route → reuse/extend owner → custom only with evidence
```

Examples: use/extend `schema-runtime` for Ajv/TypeBox; adopted XState for a
complex local FSM; repo-kit process, YAML, and discovery helpers for repository
tooling (backed by Execa, `yaml`, and `tinyglobby`).

Run the package's focused verification targets and all affected repository
gates before claiming completion.
