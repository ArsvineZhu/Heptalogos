# Source Documentation

This playbook defines the source documentation contract for durable Heptalogos
modules and exported contracts.

## Required documentation

- Every `packages/*/src/index.ts` file starts with one meaningful TSDoc block
  containing `@packageDocumentation`.
- Every other durable module under `packages/*/src/**/*.{ts,tsx}`,
  `tools/*/src/**/*.{js,mjs,ts}`, `scripts/**/*.{js,mjs,ts}`, and
  `.agents/**/*.mjs` starts with one meaningful TSDoc/JSDoc block containing
  `@module`.
- Package entrypoints describe package responsibility, semantic ownership, and
  delegation boundaries. Implementation modules explain the mechanic they
  own, the boundary they protect, and any ordering, lifetime, failure, or
  security invariant that is not evident from the syntax.
- Exported classes, interfaces, type aliases, enums, functions, important
  constants, and public usable methods carry meaningful documentation beside
  their declarations.

Comments explain semantics and reasons. They do not narrate syntax or duplicate
TypeScript names and types. Add `@remarks`, `@throws`, `@defaultValue`,
`@example`, or `{@link ...}` only when it communicates behavior that the
declaration cannot express.

## Enforcement and ownership

`eslint-plugin-jsdoc` enforces the file overview and exported-contract
requirements through the `repository:source-docs:lint` Nx target. The target is
part of `check:static` and therefore `verify`; its fixer is disabled so missing
documentation cannot be replaced by empty generated comments. Oxlint remains
the primary correctness and type-aware lint engine, while ESLint owns this
documentation lane and the separate Nx module-boundary lane.

Negative checks must cover missing package/module headers, duplicate headers,
undocumented exported contracts, and the fact that private local helpers are
not universally required to have JSDoc.

## API documentation model

The TypeScript export graph owns API structure. TSDoc/JSDoc beside declarations
owns API descriptions. Package READMEs and Nx metadata own package navigation;
`packages/INDEX.md` remains its separate generated package projection. TypeDoc
owns reflection and `typedoc-plugin-markdown` owns Markdown/navigation; the
repository product-package discovery owner supplies the expected package set,
and each package's public `exports["."].types` supplies its declaration
entrypoint. The verifier writes a temporary declaration-only TS config, checks
each entrypoint before conversion, and checks TypeDoc's structured JSON
reflection for one top-level module per expected package before accepting
the generated temporary output. Generated API files are derived local output;
they are never edited as a semantic source or required as committed artifacts.

`pnpm docs:api:check` validates the generated temporary output and its
structured reflection without requiring generated Markdown in the repository.
`pnpm docs:api` may materialize the formatted output under
`docs/reference/api/` for local lookup; that output remains generated and is
not a committed projection. TypeDoc warnings and validation warnings are
fatal; generation success alone is not a completeness proof.
