# Package Workspace Agent Contract

## Scope

This file governs work under `packages/**`.

Before editing a package, read that package's `README.md`. For cross-package
changes, also read [`INDEX.md`](./INDEX.md) and [`README.md`](./README.md).

Package READMEs are implementation-local navigation and boundary guidance.
They are subordinate to the repository root `AGENTS.md` and the Architecture
Corpus. Do not infer Authority from code history, previous milestones, tests,
or existing dependency accidents.

Do not create `AGENTS.md` inside individual package directories. Durable
package-specific constraints belong in the package `README.md`.

Keep changes inside the package's declared ownership and dependency direction.
If a change requires moving Authority, introducing a new cross-package
dependency, adding compatibility behavior, or contradicting the Corpus, stop
with `PLAN_GAP`.

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
tooling (backed by Execa, `yaml`, and `tinyglobby`). Do not create package-local
`AGENTS.md` files.

Run the package's focused verification targets and all affected repository
gates before claiming completion.
