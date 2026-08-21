---
name: heptalogos-dependencies
description: Use when adding, removing, upgrading, replacing, or routing a Heptalogos dependency; changing Node/pnpm/Nx/TypeScript/ESLint/toolchain policy; implementing generic mechanics; or encountering a dependency role not represented by the current machine-readable dependency authorities.
---

# Heptalogos Dependencies

## Authority route

Corpus root: `../../../Architecture_Corpus/`  
Route index: `../../heptalogos/corpus-routes.json`

Always consult these before implementing generic mechanics:

- [Architecture principles / anti-NIH](../../../Architecture_Corpus/02-架构原则与反NIH约束.md)
- [Technology and dependency ledger](../../../Architecture_Corpus/15-技术与依赖决策账本.md)
- [Dependency implementation routing](../../../Architecture_Corpus/24-依赖使用与实现路由.md)
- [TypeScript and repository toolchain](../../../Architecture_Corpus/25-TypeScript与仓库工具链.md)
- [Dependency qualification](../../../Architecture_Corpus/qualification/DEPENDENCY-QUALIFICATION.md)
- [dependency-status.json](../../../Architecture_Corpus/qualification/dependency-status.json)
- [dependency-routing.json](../../../Architecture_Corpus/references/dependency-routing.json)

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
