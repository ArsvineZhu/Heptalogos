---
name: heptalogos-dependencies
description: Use when adding, removing, upgrading, replacing, or routing a Heptalogos dependency; changing Node/pnpm/Nx/TypeScript/ESLint/toolchain policy; implementing generic mechanics; or encountering a dependency role not represented by the current machine-readable dependency authorities.
---

# Heptalogos Dependencies

## Authority route

Documentation root: `../../../docs/`
Route index: `../../heptalogos/corpus-routes.json`

Always consult these before implementing generic mechanics:

- [Architecture principles / anti-NIH](../../../docs/governance/engineering-principles.md)
- [Technology and dependency ledger](../../../docs/dependencies/decision-ledger.md)
- [Dependency implementation routing](../../../docs/dependencies/implementation-routing.md)
- [TypeScript and repository toolchain](../../../docs/engineering/repository/toolchain.md)
- [Dependency qualification](../../../docs/qualification/dependencies.md)
- [dependency-status.json](../../../docs/qualification/dependency-status.json)
- [dependency-routing.json](../../../docs/dependencies/dependency-routing.json)

Machine-readable dependency state/routing beats prose summaries when they disagree; such disagreement is a Corpus defect and must be surfaced.

## Procedure

1. Classify the generic role before selecting a package.
2. Read the role's `RoleDecision` and implementation route.
3. If `ADOPTED`, use the adopted facility through the designated Heptalogos adapter/facade. Missing wrapper code means implement the wrapper, not a parallel substitute.
4. If the role is genuinely new, perform the smallest evidence step that resolves the unknown property. Do not build a miniature Heptalogos to choose a library.
5. Resolve any temporary candidate to `ADOPTED`, `DEFERRED`, or `REJECTED_FOR_ROLE` before it enters an implementation plan.
6. Research exact versions from current registry/upstream evidence at Catalog freeze/upgrade time; architecture documents define role/compatible line, not a guessed patch version.
7. Keep direct versions in the pnpm Catalog and resolved closure in the lockfile. Do not select independent local ranges.
8. Check native/transitive executables, `.node`, shared libraries, WASM, helpers, source-less packaging, SBOM, licensing, and platform closure when relevant.
9. Keep framework/library objects below stable Heptalogos contracts.

## Never justify custom infrastructure with

“easy to write”, “fewer dependencies”, “cleaner”, or “the library does not know our semantics”. Compare total maintenance burden and authority boundaries instead.
