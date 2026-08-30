# Package Workspace Agent Contract

This contract adds behavior unique to work under `packages/**`.

- Before editing, read the target package `README.md`. For cross-package work,
  use [`INDEX.md`](./INDEX.md) and [`README.md`](./README.md) to discover
  ownership and relationships.
- Keep package changes inside their documented semantic ownership and dependency
  direction. Update the package public-surface documentation when that surface
  changes.
- Durable source modules require meaningful package/module documentation for
  exported contracts and non-obvious invariants. Comments explain semantics,
  not duplicated type information.
- Run the package-focused checks and affected repository gates before claiming
  completion.

Do not create nested `AGENTS.md` files inside package directories.
