# Package Workspace Agent Contract

This contract governs work under `packages/**`.

- Before editing, read the target package `README.md`. For cross-package work,
  also read [`INDEX.md`](./INDEX.md) and [`README.md`](./README.md).
- Package READMEs provide local navigation and boundary guidance; the root
  contract, Architecture Corpus, and active plan remain authoritative.
- Keep changes inside the package's semantic ownership and dependency
  direction. Authority movement, a new cross-package dependency, or
  compatibility behavior requires an explicit plan; otherwise report
  `PLAN_GAP`.
- Load `mechanics-routing` for generic mechanics and load the applicable
  lifecycle, durable-state, or PRE_PRODUCTION Skill when its trigger applies.
- Durable source modules need meaningful package/module docs. Document exported
  contracts and non-obvious invariants; comments explain semantics, not types.
- Do not create nested `AGENTS.md` files in package directories. Run focused
  package checks and all affected repository gates before claiming completion.
