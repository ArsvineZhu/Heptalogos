# Heptalogos Repository Stabilization — Mechanics Ownership & Library-First Convergence Corrective Plan

**Status:** `ACTIVE`
**Date:** 2026-08-28  
**Scope:** Remaining corrective work on the current Repository Stabilization candidate / PR #29  
**Canonical repository destination:**  
`docs/plans/active/repository/mechanics-ownership-library-first-convergence-2026-08-28.md`

> This plan is the sole active repository-stabilization plan for the current
> candidate. The earlier topology-reset plan is retained only as a superseded
> historical record.
>
> It does **not** reopen H3A-1 product semantics, does **not** start H3A-2, and does **not** create a new compatibility obligation.
>
> Because this plan requires repository mutation, the executor MUST keep PR #29
> in **Draft before and during all correction work**. Any previous external
> Independent Review verdict, if one exists, becomes stale by definition. The
> executor MUST NOT query GitHub review objects to infer Independent Review
> state.

---

## 0. Purpose

Repository Stabilization has already improved topology, documentation routing, package boundaries, test planes, repository tooling, dependency governance, and current-tree hygiene. The remaining problem is deeper:

```text
The repository has adopted mechanics owners and mature libraries
but implementation still sometimes behaves as if every local file/package
may independently reinvent the same generic mechanic.
```

The finite correction scope covers:

```text
current-tree and plan topology truth
repository process, discovery, Markdown, and path ownership
permanent gate claim-matching and tooling coverage
version Authority and release-age policy
small Problem, RuntimeSubstrate, and serializer contract proofs
```

This plan therefore has two equally important objectives:

1. **Correct the current tree.**
2. **Change the development contract so the same class of drift is mechanically and procedurally harder to reintroduce.**

The final repository must make the correct implementation route visible to an Agent **before** it writes a helper.

---

### Repository Stabilization Closure Corrections

The current candidate received an external `REQUEST_CHANGES`. This plan now
includes the finite closure correction set `CF-01` through `CF-19`; no
additional Round, review-correction, or repository-stabilization plan is to be
created. The corrections address current-tree truth, plan topology, repository
mechanics ownership, permanent gate claim-matching, version Authority, and the
small contract proofs described below.

The current state remains `PRE_PRODUCTION`: no historical compatibility path,
new product capability, H3A-2 implementation, or H3A-1 semantic reopening is
authorized. Final manual CI is blocked until a renewed out-of-band
Independent Review returns `PASS`.

Finite required closure set:

```text
CF-01 qualification-template current homes
CF-02 active repository-stabilization plan topology remains explicit
CF-03 release-age exclusion removal
CF-04 phase-neutral operational identities
CF-05 complete primary lint coverage and zero warnings
CF-06 Execa process-owner enforcement
CF-07 repo-kit path/discovery/Markdown owner reuse
CF-08 AST-backed Markdown adapter
CF-09 exact generated package index
CF-10 semantic machine-Authority validation
CF-11 package-manager line Authority
CF-12 Problem schemaVersion and RuntimeSubstrate construction invariants
CF-13 workflow action and reusable-workflow SHA validation
CF-14 conditional dated dependency evidence route
CF-15 removal of dependency-routing asOf
CF-16 single Oxlint schema-owner restriction
CF-17 real architecture references in package READMEs
CF-18 keyed serializer rejection-continuation FIFO proof
CF-19 eligible exact-patch refresh using current registry evidence
```

The documentation-engineering correction set from the current external review
is executed within this plan; it does not create another active plan:

```text
NDR-01 Prettier owns all current human-authored documentation and source
NDR-02 meaningful package/module headers and exported-contract documentation
NDR-03 eslint-plugin-jsdoc enforcement with focused negative fixtures
NDR-04 TypeDoc/Markdown-plugin probe and declaration-first adoption when needed
NDR-05 source/export/README/nav/TypeDoc authority chain
NDR-06 concise source-documentation rules in root/package/docs agent guidance
```

Closure facts are recorded only after their commands run:

```yaml
implementation: PASS
localQualification: PASS
livePostgreSQL: PASS
documentationEngineeringCorrection: PASS
independentReview: NOT_RUN
previousIndependentReview: REQUEST_CHANGES
finalManualCI: NOT_RUN
merge: NOT_RUN
H3A_2: BLOCKED_BY_REPOSITORY_STABILIZATION
```

#### Current closure evidence (2026-08-28)

The following evidence was captured for the previous Ready candidate. The final
Independent Review returned `REQUEST_CHANGES` because the TypeDoc/API
completeness claim was not proven; the NDR-04/NDR-05 statements below are
superseded until the narrow documentation correction is requalified.

- `CF-02` and `CF-04`: `PASS`; the topology-reset plan is superseded and the
  operational closure playbook uses semantic pre-production stabilization
  naming.
- `NDR-01`: `PASS`; Prettier owns current human-authored Markdown and source,
  `git diff --check` is clean, and the exception count is `0`.
- `NDR-02` and `NDR-03`: `PASS`; all `178` mandatory source modules have
  required headers, no header is missing, direct source-doc lint passes with
  `eslint-plugin-jsdoc` `64.2.1`, and the negative repo-kit suite passes
  `110/110` tests.
- `NDR-04` and `NDR-05`: `FAIL / PARTIAL`; TypeDoc `0.28.20` with
  `typedoc-plugin-markdown` `4.13.0` generates the declaration-first API
  projection from a filesystem glob into `docs/reference/api`, but the previous
  freshness check did not prove that all discovered product packages entered
  the TypeDoc reflection. The direct TypeDoc source probe against TypeScript
  `7.0.2` remains an upstream API failure, so declaration-first generation
  remains the adopted route.
- `NDR-06`: `PASS`; concise source-documentation rules are present in root,
  package, and docs Agent guidance and in the repository playbook.
- Markdown structure scan: `PASS`; no tracked-relevant Markdown file has
  multiple real H1 headings (`MD025`) or a heading-level jump (`MD001`).
- Repository gates: `PASS`; clean frozen install, `pnpm verify`, and the full
  static target pass, including boundaries, dependencies, hygiene, Oxlint,
  residual ESLint, jscpd, TypeScript, source-docs, and API freshness.
- Live PostgreSQL matrix using the repository-provided PostgreSQL `18.6`:
  `private-postgres:test:integration` `20/20`,
  `host-ownership:test:integration` `10/10`,
  `persistence:test:integration` `9/9`,
  `bootstrap-runtime:test:integration` `83/83`,
  `bootstrap-runtime:test:recovery-process` `4/4`, and
  `bootstrap-runtime:test:recovery-process:postgres` `2/2`; all are `PASS`.
- `H3A-2`: untouched and blocked by Repository Stabilization closure.
  The new documentation correction is `NOT_RUN`; final manual CI and merge
  remain `NOT_RUN`.

The required narrow correction is:

- derive the expected product package set through `discoverProductPackages`;
- resolve each package's public `exports["."].types` declaration and verify the
  file before invoking TypeDoc;
- invoke TypeDoc with explicit discovered declaration entrypoints and a
  temporary declaration-only TS config;
- validate one top-level TypeDoc JSON reflection/module for every expected
  package before comparing generated Markdown;
- enable fatal TypeDoc warning and validation-warning handling; and
- keep a negative repo-kit fixture proving that fifteen expected packages with
  one missing reflection fail closed.

#### Documentation correction requalification (2026-08-28)

The narrow documentation correction is complete. The current implementation
now derives `15` expected product packages through `discoverProductPackages`,
resolves and verifies every package's public `exports["."].types` declaration
entrypoint before TypeDoc, and passes those explicit declaration entrypoints to
TypeDoc with a temporary declaration-only TS config. Both
`treatWarningsAsErrors` and `treatValidationWarningsAsErrors` are enabled.

The TypeDoc structured JSON reflection contains exactly one top-level module
for each expected package (`15/15`), including `@heptalogos/bootstrap-runtime`.
The negative repo-kit fixture removes one of fifteen modules and receives the
expected fail-closed count/missing-module errors. The regenerated tracked API
projection contains `466` Markdown files, including
`docs/reference/api/bootstrap-runtime/dist/README.md`, and
`repository:docs:api:check` reports the projection fresh for all `15` packages.

Focused repo-kit verification is `PASS` (`14` files, `115/115` tests), full
static verification and `pnpm verify` are `PASS`, and the six live PostgreSQL
18.6 targets are `PASS`: private-postgres `20/20`, host-ownership `10/10`,
persistence `9/9`, bootstrap-runtime integration `83/83`, process recovery
`4/4`, and PostgreSQL process recovery `2/2`. The previous Ready candidate's
Independent Review remains `REQUEST_CHANGES`; this requalified candidate has
not received a new external Independent Review, so final manual CI and merge
remain `NOT_RUN`.

## 1. Governing invariants

These are executable constraints, not suggestions.

### 1.1 Mechanics search precedes implementation

Before adding or expanding any generic mechanic, the executor MUST resolve the provider in this order:

```text
1. Existing Heptalogos semantic/mechanics owner
2. Existing adopted dependency route
3. Standard / Node / OS facility
4. Mature library/framework behind a narrow adapter
5. Composition of existing mature primitives
6. Custom implementation only with explicit evidence
```

Important distinction:

- If an internal owner already exists, do **not** reopen provider selection.
- If a dependency route is already `ADOPTED`, do **not** write a local fallback.
- “It is only a few lines” is not evidence for a second implementation.
- “Fewer dependencies” is not evidence when a mature provider already owns the role.
- “The local code is easier to understand” is not evidence if it duplicates lifecycle, concurrency, parsing, graph, schema, protocol, process, filesystem, or recovery mechanics.

### 1.2 Extend the owner; do not copy the owner

If package A needs a mechanic that package B already owns, and B's public/internal API is insufficient:

```text
WRONG:
A writes another implementation

RIGHT:
extend B with the smallest reusable primitive
→ test B
→ consume B from A
```

If the primitive is not semantically appropriate for B, stop and classify ownership before writing it.

Do not create a catch-all `utils`, `common`, or `shared` package merely to remove textual duplication.

### 1.3 Library-first is not dependency maximalism

Do not add a package for every three-line expression.

A new external dependency is justified when it:

- owns a real generic mechanic;
- is mature enough for the role;
- materially deletes custom implementation/test/maintenance burden;
- has a narrower or clearer failure surface than the custom implementation;
- does not capture Heptalogos product semantics.

Small adapter glue around a standard primitive may remain custom when adding a dependency would increase total owned complexity.

### 1.4 Repository tooling does not require product Qualification by default

Repository-only tooling:

```text
Oxlint
oxlint-tsgolint
jscpd
yaml
tinyglobby
Knip
Prettier
Nx
ESLint residual boundary lane
```

does **not** require a new L2/L3 product Qualification plan merely because it is a dependency.

Normal adoption evidence is:

```text
current registry/upstream evidence
license/package health
current Node compatibility
install under repository package policy
focused negative/positive checks
pnpm verify
```

Create product Qualification only when a tool ships inside the product, defines product semantics, produces a shipping artifact that needs platform proof, or introduces a genuinely unresolved runtime/platform property.

Do not create new `Q-*` records for the tooling adopted by this plan.

### 1.5 Repository tooling is a thin control plane

`tools/repo-kit` owns **Heptalogos repository-specific reusable mechanics**, not generic infrastructure already owned by Nx or mature libraries.

Repo-kit MUST NOT become:

- a second task scheduler;
- a YAML parser;
- a glob engine;
- a package manager;
- a source parser;
- a generic process orchestration framework;
- a second dependency graph;
- a utility dumping ground.

### 1.6 Product semantics remain Heptalogos-owned

This plan must not replace:

```text
Problem vocabulary
Authority
WorkItem semantics
Runtime reconciliation semantics
Readiness semantics
Evidence semantics
Host ownership semantics
Configuration semantics
```

with framework objects.

Framework/library objects remain behind product-owned contracts.

### 1.7 PRE_PRODUCTION cleanup is destructive, not compatibility-preserving

If a local duplicate implementation is replaced:

- delete it;
- update all current callers;
- remove old exports/import exceptions;
- remove obsolete tests;
- remove obsolete dependency declarations;
- do not leave aliases/deprecated wrappers/compatibility shims.

---

## 2. Current candidate facts that drive this plan

The executor MUST verify these facts against the current branch before editing rather than treating this section as immutable repository Authority.

The candidate facts to verify before each freeze are:

```text
PR: #29
base: master
head: repository-stabilization branch
candidate state: Draft while mutable; Ready only after final mutation
H3A-2: frozen
```

Current root tooling includes:

```text
Nx 23
TypeScript 7 primary
TS6 compatibility lane
Oxlint + oxlint-tsgolint
ESLint 10 + typescript-eslint
Knip
jscpd
yaml + tinyglobby
Prettier
Vitest
@heptalogos/repo-kit
```

Current repo-kit owns:

```text
process execution
workspace discovery
dependency/version Authority readers
documentation/package validation
current-tree hygiene
clean mechanics
repository governance helpers
```

Nx owns task graph and scheduling; repo-kit does not own a generic gate scheduler.

Resolved owner boundaries include:

```text
@heptalogos/schema-runtime
  owns Ajv/TypeBox mechanics

packages/bootstrap-state and packages/bootstrap-runtime
  use SchemaRuntime rather than direct Ajv/TypeBox imports
```

RuntimeSubstrate now delegates generic activation/disposal lifecycle to Cordis
Fiber and retains only Heptalogos-specific task/effect policy.

```text
@heptalogos/runtime-substrate
  uses Cordis Fiber for plugin/effect/disposal mechanics
  retains only Heptalogos-specific tracked-task, failure, and timeout policy
```

Adopted lifecycle ownership includes:

```text
private-postgres -> XState
host-ownership -> XState
bootstrap-runtime host maintenance -> XState
work-queue -> XState
  runtime-kernel supervisor lifecycle -> XState-backed package-private legality
```

These are minimum known findings, not the audit ceiling.

---

## 3. Package/tool decisions frozen by this plan

The executor does not choose alternatives for these roles.

### 3.1 Adopt Oxlint as the primary JS/TS linter

Adopt:

```text
oxlint
oxlint-tsgolint
```

Role:

```text
Oxlint:
  primary JS/TS lint engine
  generic correctness/suspicious/restriction rules
  TypeScript-native rules
  type-aware TypeScript rules
  import restrictions where Oxlint can express them

oxlint-tsgolint:
  type-aware backend
```

Enable type-aware linting.

Required type-aware rules at minimum:

```text
typescript/no-floating-promises
typescript/no-misused-promises
```

Preserve or strengthen currently active correctness restrictions when migrating from ESLint.

Do **not** enable Oxlint experimental type checking as a replacement for canonical TypeScript typecheck in this plan.

```text
TypeScript 7 remains canonical typecheck/build authority.
Oxlint type-aware lint supplements it.
```

### 3.2 Keep ESLint only as the residual Nx module-boundary lane

ESLint remains because `@nx/enforce-module-boundaries` is still the adopted Nx boundary mechanism.

Target state:

```text
ESLint:
  @nx/enforce-module-boundaries
  only residual rules that Oxlint demonstrably cannot express

NOT:
  primary TypeScript lint engine
  general correctness linter
  owner of no-floating-promises
  owner of no-misused-promises
```

Retain `typescript-eslint` only to the minimum extent required to parse TypeScript for the residual ESLint/Nx lane. Remove its rule ownership.

Do not migrate to a community Nx-Oxlint plugin in this plan. Use standard Nx `run-commands` / project targets to invoke Oxlint. This avoids introducing a second immature integration layer.

### 3.3 Adopt `yaml`

Use the mature `yaml` package for YAML semantics.

It becomes the repository tooling provider for:

```text
pnpm-workspace.yaml parsing
GitHub Actions workflow YAML parsing
other repository YAML inspection
YAML body of agent/document frontmatter where applicable
```

Do not keep line-oriented pseudo-YAML parsers for structures that are actually YAML.

### 3.4 Adopt `tinyglobby`

Use `tinyglobby` for **read-only repository file discovery**.

It may back repo-kit helpers such as:

```text
findRepositoryFiles(...)
findProductSourceFiles(...)
findPackageFiles(...)
```

Do not use it to weaken fail-closed destructive cleanup. `clean` may retain explicit traversal/safety logic where deletion safety requires it.

### 3.5 Adopt `jscpd` v5 line as permanent copy/paste detection

Scope:

```text
packages/**/src/**/*.{ts,tsx}
tools/**/src/**/*.{mjs,js,ts}
scripts/**/*.{mjs,js,ts}
.agents/heptalogos/**/*.{mjs,js,ts}
```

Exclude:

```text
**/test/**
**/tests/**
**/fixtures/**
**/dist/**
**/node_modules/**
generated output
vendor material
```

Initial policy:

```text
minTokens: 60
minLines: 6
mode: mild
exitCode: non-zero on violation
```

Do not create a broad ignore registry to make the first run green.

For each reported clone:

```text
same semantic owner?
  yes -> consolidate

different domain semantics with unavoidable similar syntax?
  prove it, then use the narrowest local ignore possible

generated/fixture?
  exclude by plane
```

### 3.6 Exact versions

Package identities above are frozen.

Exact direct versions are **not** hardcoded by this plan.

At execution:

1. query current registry/upstream;
2. select the newest appropriate release satisfying repository `minimumReleaseAge`;
3. obey exact Catalog pinning;
4. do not downgrade to versions seen in historical discussion merely because they were previously observed.

At authoring time the available mature lines included:

```text
oxlint 1.x
oxlint-tsgolint 7.x
jscpd 5.x
yaml 2.x
tinyglobby 0.2.x
```

The executor refreshes exact patch selection.

---

## 4. Canonical plan adoption and PR state

### C0.1 Return PR #29 to Draft

Before any mutation:

- confirm the task explicitly names this plan;
- confirm current branch is the PR #29 head;
- confirm base is current `master`;
- fetch latest remote refs;
- confirm no H3A-2 implementation has appeared;
- return PR #29 to **Draft**.

Do not ask GitHub whether Independent Review passed.

If the operator explicitly tells the executor an external Independent Review already returned `PASS`, treat it as stale immediately because this plan requires mutation.

### C0.2 Adopt this plan

This plan is already present at:

```text
docs/plans/active/repository/mechanics-ownership-library-first-convergence-2026-08-28.md
```

with this file content.

The current plan index lists this plan as:

```text
docs/plans/README.md
```

to list this plan as:

```text
ACTIVE
governing plan for the remaining mechanics/library-first corrective work on the repository stabilization candidate
```

`ACTIVE`, as the sole mechanics/library-first corrective plan. The earlier
topology-reset plan is superseded and historical; it is not an executable route.

Do not duplicate this plan elsewhere.

### C0.3 Baseline commands

Run before implementation:

```bash
pnpm install --frozen-lockfile
pnpm check:documentation
pnpm check:repository
pnpm check:hygiene
pnpm check:dependencies
pnpm check:boundaries
pnpm check:unused
pnpm lint
pnpm exec eslint "packages/*/src/**/*.{ts,tsx}" "tools/*/src/**/*.{js,mjs,ts}" "scripts/**/*.{js,mjs,ts}" ".agents/**/*.mjs"
pnpm docs:api:check
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Record actual PASS/FAIL only.

A baseline failure caused by existing candidate state is fixed inside this plan if it belongs to this scope; do not hide it.

---

## 5. Make the rules visible to Agents

This work is mandatory and precedes deep code convergence.

### C1.1 Update root `AGENTS.md`

Keep root `AGENTS.md` concise.

Extend **Implementation constraints** with a mandatory mechanics preflight:

```text
Before implementing generic mechanics:
1. search the target package and workspace for an existing owner/primitive;
2. read the target package README and packages/INDEX.md for ownership;
3. consult dependency-routing / implementation-routing for an adopted provider;
4. prefer Standard/Node/OS or the adopted mature provider;
5. if the existing owner lacks a primitive, extend the owner instead of copying it;
6. custom generic implementation requires explicit evidence in the governing plan or current change rationale.
```

Also add:

```text
Existing code is not evidence that a duplicate mechanic is legitimate.
Do not preserve a local implementation merely to minimize diff size.
```

Do not turn root AGENTS into a long dependency manual.

### C1.2 Strengthen `packages/AGENTS.md`

Add a high-density **Mechanics Ownership Preflight** section.

Mandatory executor behavior before adding a helper/class/adapter that does any of:

```text
schema/validation/parsing
filesystem discovery
process execution
locking/concurrency
retry/backoff/timeout
graph/DAG
state-machine/lifecycle
resource disposal
ID/hash/canonical serialization
database mechanics
queue/scheduling
observability/context propagation
protocol/client mechanics
```

is:

```text
rg/search package
→ search workspace exports
→ inspect package INDEX/README
→ consult dependency route
→ reuse/extend owner
→ only then custom
```

Add explicit examples:

```text
Need Ajv/TypeBox validation?
  use/extend schema-runtime, do not instantiate Ajv in consumer package.

Need a local complex FSM?
  use adopted XState behind the package boundary.

Need repository process execution?
  use repo-kit process helper, do not spawn/exec independently.

Need repository YAML parsing?
  use repo-kit YAML helper backed by yaml.

Need repository file discovery?
  use repo-kit discovery backed by tinyglobby.
```

Keep the existing prohibition on package-local AGENTS.

### C1.3 Update durable engineering guidance

Modify:

```text
docs/governance/engineering-principles.md
```

Add a durable section:

```text
Mechanics Ownership Before Local Implementation
```

It must distinguish:

```text
semantic owner
mechanics provider
adapter owner
consumer
```

and state:

```text
ADOPTED route + existing owner
means provider selection is closed for ordinary implementation.
```

Modify:

```text
docs/dependencies/implementation-routing.md
```

Add the executor lookup algorithm and examples.

Do not add milestone/PR references to these durable documents.

### C1.4 Add an actionable playbook

Create:

```text
docs/engineering/playbooks/mechanics-ownership-and-library-first.md
```

Required sections:

```text
When to use this playbook
Five-minute mechanics preflight
How to search owners
How to decide extend-owner vs new library vs custom
How to handle duplicate implementation found during unrelated work
How to record a justified custom mechanic
How to remove a replaced mechanic in PRE_PRODUCTION
Examples from SchemaRuntime / repo-kit / XState / Cordis
Verification checklist
```

This is a procedure, not a historical explanation.

### C1.5 Route the playbook to Agents

Update:

```text
.agents/heptalogos/corpus-routes.json
```

Add the new playbook to:

```text
heptalogos-dependencies.core
```

and to an implementation-oriented conditional route under `heptalogos-architecture` or the closest existing implementation entry.

Update the relevant existing Skill(s) so they instruct the Agent to use the playbook before introducing generic mechanics.

Do not create a new Skill unless the current routing model cannot expose this rule cleanly.

Run:

```bash
pnpm check:agents
pnpm check:documentation
```

before continuing.

---

## 6. Toolchain convergence: Oxlint first, ESLint residual

### C2.1 Add package identities to repository tooling Authority

Update:

```text
docs/dependencies/dependency-routing.json
```

Repository tooling packages must include:

```text
oxlint
oxlint-tsgolint
jscpd
yaml
tinyglobby
knip
prettier
```

Do not model these as Foundation product runtime roles.

`eslint-plugin-jsdoc`, `typedoc`, and `typedoc-plugin-markdown` are repository
toolchain dependencies on the adopted `tooling.build` route, not product
runtime dependencies and not a second repository-tooling category.

Update standing dependency/toolchain docs so repository-tooling dependencies are clearly separated from product mechanics routes.

Update:

```text
docs/engineering/repository/toolchain.md
```

to state:

```text
Oxlint = primary JS/TS lint
ESLint = residual Nx module-boundary and source-documentation lane
eslint-plugin-jsdoc = source file-overview and exported-contract rules
TypeDoc + typedoc-plugin-markdown = declaration-first API projection
TypeScript 7 = canonical typecheck/build
Knip = unused files/exports/dependencies
jscpd = copy/paste clone detection
Prettier = formatting
Nx = project/task graph and task scheduling
```

### C2.2 Add exact eligible versions to the Catalog

Refresh registry/upstream evidence.

Modify:

```text
pnpm-workspace.yaml
package.json
pnpm-lock.yaml
```

Add:

```text
oxlint
oxlint-tsgolint
jscpd
yaml
tinyglobby
eslint-plugin-jsdoc
typedoc
typedoc-plugin-markdown
```

Root devDependencies:

```text
oxlint
oxlint-tsgolint
jscpd
eslint-plugin-jsdoc
typedoc
typedoc-plugin-markdown
```

Source documentation uses the root ESLint lane with fixer-disabled
`eslint-plugin-jsdoc`; TypeDoc API output is generated from canonical
declarations and checked for freshness.

`yaml` and `tinyglobby` belong to:

```text
tools/repo-kit/package.json dependencies
```

because repo-kit directly imports them.

Do not put product runtime dependencies on repo-kit.

### C2.3 Introduce `.oxlintrc.json`

Use a stable JSON/JSONC config, not experimental TS config.

Required behavior:

```text
options.typeAware = true
typescript plugin enabled
typescript/no-floating-promises = error
typescript/no-misused-promises = error
unused disable directives fail/warn according to current supported config
generated/build/test-toolchain exclusions aligned with repository planes
```

Migrate existing `no-restricted-imports` policies that Oxlint can express.

Important correction:

The current Ajv/TypeBox exceptions for bootstrap packages are temporary architecture drift and MUST NOT be migrated as permanent exceptions.

Final owner rule:

```text
direct ajv import:
  allowed only under packages/schema-runtime/**

direct typebox import:
  allowed only under packages/schema-runtime/**
```

Consumers needing TypeBox schema construction use:

```text
@heptalogos/schema-runtime/typebox
```

Other existing import restrictions should migrate to Oxlint where supported.

### C2.4 Reduce `eslint.config.mjs`

Final ESLint config must be easy to explain in one sentence:

```text
ESLint exists to execute Nx module-boundary enforcement and source-documentation
contract rules on TypeScript source, plus only documented residual rules that
Oxlint cannot currently express.
```

Remove:

```text
@typescript-eslint/no-floating-promises
@typescript-eslint/no-misused-promises
generic no-restricted-imports that were migrated to Oxlint
large library-owner allowlist logic now expressed elsewhere
```

Keep the minimum TypeScript parser setup required by Nx boundary linting.

If no non-Nx residual rule remains, `@typescript-eslint` plugin rule registration is removed.

### C2.5 Update Nx project lint targets

For every product/tooling project:

- primary `lint` target invokes Oxlint for that project;
- add or retain a narrowly named boundary target where needed for Nx/ESLint.

The repository project also exposes a separate `source-docs:lint` target for
the mandatory package/module overview and exported-contract documentation
scope; it is included in `check:static` independently of the boundary lane.

Do not copy long command definitions into 15 package project files if a simple Nx target default or small standard `run-commands` configuration can avoid repetition.

However, do not adopt an immature community Nx-Oxlint plugin just to remove a few project.json lines.

Focused checks:

```bash
pnpm exec oxlint --type-aware packages/schema-runtime
pnpm exec oxlint --type-aware packages/bootstrap-state
pnpm exec oxlint --type-aware packages/runtime-kernel
pnpm exec eslint packages/runtime-kernel/src
pnpm lint
```

### C2.6 Negative lint tests

Add repository tooling tests/fixtures proving:

1. a floating promise fails Oxlint;
2. a misused promise fails Oxlint;
3. a forbidden direct `ajv` import outside SchemaRuntime fails;
4. a forbidden direct `typebox` import outside SchemaRuntime fails;
5. an invalid Nx tag dependency still fails the ESLint boundary lane.

Do not rely only on “the command happened to pass the current tree.”

### C2.7 Source documentation and API reference enforcement

Source documentation is part of the repository toolchain contract. Add the
following root-owned tooling and targets:

```text
eslint-plugin-jsdoc  → ESLint source-documentation lane
TypeDoc + typedoc-plugin-markdown → generated API reference projection
repository:source-docs:lint
repository:docs:api:check
```

Required source rules:

```text
packages/*/src/index.ts → leading @packageDocumentation header
other durable packages/tools/scripts/.agents source modules → leading @module header
exported classes/interfaces/type aliases/enums/functions/important constants → meaningful docs
public methods and non-obvious invariants → meaningful semantic docs
private helpers → not universally required
```

`eslint-plugin-jsdoc` must remain fixer-disabled and must reject missing,
duplicate, or non-initial file headers. Oxlint remains the primary correctness
and type-aware lint owner; the ESLint lane owns source documentation and Nx
module boundaries as separate checks.

The adopted API route is declaration-first: derive the expected product package
set through `discoverProductPackages`, resolve each public
`exports["."].types` declaration, build canonical `dist/*.d.ts`, and pass the
explicit declaration entrypoints to TypeDoc with a temporary declaration-only
TS config. Validate TypeDoc's structured JSON reflection has exactly one
top-level module per expected package, enable fatal warning/validation-warning
handling, format the temporary Markdown with Prettier, and compare it to
`docs/reference/api`. Generated Markdown is never hand-edited; stale or
incomplete output fails `repository:docs:api:check`. A negative fixture must
prove that one missing module from a fifteen-package expected set fails closed.
The direct source TypeDoc probe is retained as evidence only when the selected
TypeDoc line does not support the canonical TypeScript compiler API.

Update:

```text
AGENTS.md
packages/AGENTS.md
docs/AGENTS.md
docs/engineering/playbooks/repository/source-documentation.md
```

with the concise source-documentation rule and the source → declaration →
TypeDoc → generated-reference authority chain. Do not create package-local
Agent guidance or a custom AST/export/JSDoc parser or renderer.

---

## 7. Repository task orchestration is owned by Nx

### C3.1 Completed scheduler ownership correction

The former repo-kit scheduler and its dedicated tests were deleted. The root
verification aliases now delegate to Nx project targets, and no compatibility
wrapper or alternate scheduler remains.

### C3.2 Use Nx root/project tasks instead

Nx owns:

```text
task graph
task dependency graph
parallel scheduling
bounded parallel execution
failure exit status
project discovery
```

Repository scripts should remain individual checks.

Root package scripts remain ergonomic aliases, e.g.:

```text
verify
check:static
check:repo
lint
test
build
```

but their orchestration must use Nx targets/run-many, not a custom scheduler.

The exact target names may be locally adjusted for valid Nx syntax, but the semantic split is fixed:

```text
repository checks:
  agents
  documentation
  repository
  hygiene
  dependencies
  boundaries
  unused
  toolchain

static:
  repository checks
  format check
  primary lint
  Nx boundary lint
  typecheck
  TS6 lane

verify:
  static
  tests
  build
```

It is acceptable for independent verify tasks to run concurrently. There is no product semantic requirement that tests wait for every static check to complete.

### C3.3 Verify Nx sees the intended tasks

Required inspection:

```bash
pnpm nx show project heptalogos
pnpm nx show projects
```

Run:

```bash
pnpm check:repo
pnpm check:static
pnpm verify
```

Delete obsolete scheduler documentation.

### C3.4 Strengthen repo-kit README

Update:

```text
tools/repo-kit/README.md
```

Add explicit non-ownership:

```text
Nx owns repository task graph/scheduling.
yaml owns YAML parsing.
tinyglobby owns glob discovery.
Execa owns subprocess mechanics.
repo-kit only composes these with Heptalogos repository policy.
```

---

## 8. Replace repository hand-rolled parsers/discovery

### C4.1 Add repo-kit YAML helpers

Add a small module, semantic name such as:

```text
tools/repo-kit/src/yaml.mjs
```

Public primitives should be narrow, e.g.:

```text
readYamlFile(path)
parseYaml(text, label)
```

Do not invent a generic configuration framework.

Use `yaml`.

Move repository consumers away from raw line/regex parsing when they are interpreting YAML structure.

Priority consumers:

```text
scripts/verify/toolchain.mjs
scripts/verify/dependencies.mjs
scripts/verify/repository.mjs
GitHub Actions workflow validation
.agent/document YAML frontmatter where appropriate
```

When validating exact GitHub workflow shape, parse YAML for structure and use targeted text checks only for details YAML cannot preserve/represent reliably.

### C4.2 Add repo-kit read-only discovery helpers

Use `tinyglobby`.

Add narrow helpers such as:

```text
findRepositoryFiles({ root, patterns, ignore })
findProductSourceFiles({ root, patterns })
```

Do not wrap the full tinyglobby API.

Replace repeated read-only recursive walkers in:

```text
scripts/verify/repository.mjs
scripts/verify/dependencies.mjs
scripts/verify/boundaries.mjs
.agent resource validation where useful
other repo-kit modules
```

Do not migrate destructive cleanup merely for consistency.

### C4.3 Keep entrypoints thin

Target shape for a verification entrypoint:

```js
const result = await validateX({ root });
print(result);
process.exitCode = result.ok ? 0 : 1;
```

Policy may remain visible in scripts where it is claim-specific.

Reusable mechanics belong in repo-kit.

A script should not contain its own:

```text
recursive filesystem engine
YAML parser
process runner
workspace discovery
dependency graph
package discovery
generic JSON/YAML file loader duplicated elsewhere
```

### C4.4 Audit `.agents/heptalogos/validate-skill-resources.mjs`

Replace reusable mechanics that repo-kit now owns.

Do not force agent-specific semantics into repo-kit:

```text
skill word budget
route semantics
skill/frontmatter required fields
```

remain agent-resource policy.

---

## 9. Add permanent clone detection

### C5.1 Add jscpd configuration

Create a root config using current jscpd v5 supported format.

Required policy:

```text
minTokens = 60
minLines = 6
mode = mild
exitCode = 1
console reporter
no color/no tips if supported
```

Scope is production/tooling source, not tests/fixtures/generated output.

### C5.2 Add command/gate

Add a root script:

```text
check:duplicates
```

and include it in:

```text
check:static
pnpm verify
```

If Nx exposes it as a root target, the script may simply call that target.

### C5.3 Resolve the initial findings

The first jscpd run is an audit, not an ignore-generation step.

For every clone:

```text
A. same owner / same semantics
   -> consolidate

B. same generic mechanic but different packages
   -> identify owner/library and consolidate

C. deliberate repeated declarative data
   -> consider table/data-driven representation

D. domain-specific similar code with different invariants
   -> keep only with narrow justification

E. test/fixture/generated
   -> exclude by plane
```

Do not accept a blanket “existing baseline” percentage.

The permanent gate is **zero unapproved clones above configured threshold**.

---

## 10. SchemaRuntime ownership convergence

This is a mandatory current-tree correction.

### C6.1 Extend SchemaRuntime only where needed

Current SchemaRuntime already owns:

```text
Ajv configuration
compileSchema<T>()
TypeBox re-export through @heptalogos/schema-runtime/typebox
```

Add only the smallest missing reusable primitives required to migrate bootstrap consumers.

Candidate primitives may include:

```text
parse JSON text + validate compiled schema
normalize schema issues
compile once at module scope
```

Do not turn SchemaRuntime into domain parsing semantics.

### C6.2 Migrate bootstrap-state

Modify:

```text
packages/bootstrap-state/package.json
```

Add:

```text
@heptalogos/schema-runtime
```

Remove direct:

```text
ajv
typebox
```

Migrate at minimum:

```text
src/codec.ts
src/journal.ts
src/bootstrap-owner-witness-codec.ts
src/maintenance-codec.ts
```

Rules:

```text
TypeBox construction -> @heptalogos/schema-runtime/typebox
schema compilation/validation -> @heptalogos/schema-runtime
no new Ajv instance in bootstrap-state
```

Delete obsolete local Ajv option blocks.

### C6.3 Migrate bootstrap-runtime schema consumers

Modify:

```text
packages/bootstrap-runtime/package.json
```

Add/use:

```text
@heptalogos/schema-runtime
```

Remove direct:

```text
ajv
typebox
```

after all current consumers are migrated.

Known priority:

```text
src/locator.ts
```

No direct Ajv/TypeBox imports may remain under bootstrap-runtime.

### C6.4 Mechanical owner guard

Oxlint restriction:

```text
ajv:
  direct import only packages/schema-runtime/**

typebox:
  direct import only packages/schema-runtime/**
```

Add negative tests.

### C6.5 Verify

Run:

```bash
rg -n "from [\"'](?:ajv|typebox)|Ajv2020|new Ajv" packages \
  --glob '!packages/schema-runtime/**'

pnpm nx run schema-runtime:test
pnpm nx run bootstrap-state:test
pnpm nx run bootstrap-runtime:test
pnpm lint
pnpm typecheck
```

Expected:

```text
zero direct Ajv/TypeBox consumer outside SchemaRuntime
```

---

## 11. Foundation Problem construction convergence

### C7.1 Add one canonical construction primitive

Modify:

```text
packages/foundation-contracts/src/problem.ts
```

Add a small canonical constructor API.

Required properties:

- callers still provide `problemCode`, `category`, `retryClass`, `title`, and optional detail/metadata;
- the helper owns `schemaVersion: 1`;
- do not hide category/retry policy in generic defaults;
- preserve `ProblemError(problem, ErrorOptions)` semantics;
- avoid mutation.

A suitable API shape is conceptually:

```ts
type ProblemInit = Omit<Problem, "schemaVersion">

createProblem(init: ProblemInit): Problem

createProblemError(
  init: ProblemInit,
  options?: ErrorOptions
): ProblemError
```

Exact naming may vary only if the chosen names are clearer and all consumers are updated in the same change.

Export from foundation-contracts root.

### C7.2 Migrate repeated envelope construction

Search:

```bash
rg -n 'schemaVersion:\s*1' packages --glob '*.ts'
rg -n 'new ProblemError\(\{' packages --glob '*.ts'
rg -n 'function .*Problem|function problem\(' packages --glob '*.ts'
```

Migrate boilerplate where the helper removes repeated **Problem envelope mechanics**.

Do not remove package-specific domain problem functions if they provide useful vocabulary, e.g.:

```text
runtimeKernelProblem(...)
workQueueProblem(...)
persistenceProblem(...)
```

Those may remain as thin domain adapters over `createProblemError`.

Goal:

```text
foundation-contracts owns Problem envelope creation
package owns problem vocabulary
```

### C7.3 Do not create a cross-package generic error utility package

No `packages/utils-errors`.

---

## 12. Existing primitive / local-helper convergence

This phase addresses semantic duplication that jscpd may not detect.

### C8.1 Canonical instant parsing

Search for all local ISO/canonical instant validation.

Known example:

```text
bootstrap-state/src/journal.ts
  local CANONICAL_INSTANT_PATTERN
  local isCanonicalInstant()
```

Use the existing Foundation canonical time/instant primitive when semantically equivalent.

If the existing primitive is insufficient, extend its owner rather than duplicate parsing rules.

Delete local duplicate.

### C8.2 Node error-code narrowing

Search:

```bash
rg -n '"code" in error|error\.code\s*===|ENOENT|EEXIST|EPERM|EACCES' packages tools scripts
```

Classify by adapter owner.

Rules:

- do not create a global `utils` package;
- if repeated within one package, add one package-private platform adapter/helper;
- if a low-level existing owner already provides the correct primitive, reuse it;
- if cross-package sharing would create an artificial dependency direction, keep narrow adapter-local narrowing rather than centralizing solely for textual deduplication.

Document the decision in the execution audit table.

### C8.3 Keyed async serialization / local concurrency

Search:

```bash
rg -n 'Map<[^>]*,\s*Promise|\.then\(operation,\s*operation\)|operationTails|checkpointTails' packages
```

Known hotspots:

```text
bootstrap-state journal
bootstrap-state maintenance store
```

Determine whether they implement the same keyed serialization mechanic.

If same:

```text
extract one package-private primitive inside bootstrap-state
```

Before retaining custom implementation, compare mature async-lock/queue libraries.

Do not add an external dependency unless it materially deletes the mechanism and fits the exact keyed semantics better than a small package-private primitive.

### C8.4 Registry duplication inside runtime-kernel

Audit together:

```text
service-registry.ts
capability-registry.ts
work-handler-registry.ts
```

Classify:

- identical registry mechanics;
- different semantic eligibility/version rules;
- common package-private storage/index primitive.

Extract only mechanics that are truly shared.

Do not erase semantic distinctions by forcing all registries through an overly generic abstraction.

### C8.5 Package-internal duplicate helpers

For every jscpd or manual finding:

```text
prefer owner-local private primitive
over a new cross-package dependency
when the mechanic is local and not an architecture-level shared role.
```

---

## 13. RuntimeSubstrate: make Cordis the lifecycle mechanic

This is mandatory but must preserve Heptalogos RuntimeSubstrate semantics.

### C9.1 Build a lifecycle ownership table before editing

For every current field/helper in:

```text
packages/runtime-substrate/src/cordis-adapter.ts
```

classify:

```text
item
current purpose
Heptalogos semantic requirement?
Cordis already owns equivalent?
keep | delete | replace
```

At minimum classify:

```text
InternalState
activationFiber
pluginFiber
activationPromise
fiberReady
activationController
pendingDisposers
trackedTasks
lateDisposers
disposalPromise
timeout()
flushPendingDisposers()
scheduleLateDisposer()
drainLateDisposers()
registerDisposer()
```

### C9.2 Ownership decision

Cordis Fiber owns:

```text
plugin instance lifecycle
startup lifecycle
effect registration
effect disposal
reverse-order cleanup
async disposer settlement
fiber await
fiber dispose
```

RuntimeSubstrate owns:

```text
Heptalogos activation contract
Heptalogos failure projection
background task admission/tracking policy not represented by Cordis
settlement timeout policy
resource-scope vocabulary exposed to RuntimeKernel
```

There must not be two parallel lifecycle state machines describing the same plugin lifetime.

### C9.3 Required refactor direction

Use Cordis as the concrete lifecycle engine.

Prefer:

```text
ctx.plugin(...)
fiber.await()
fiber.effect(...)
fiber.dispose()
```

over local pending-disposer/lifecycle emulation.

`ActivationResourceScope.defer` should register a Cordis effect/disposer as directly as the semantics permit.

`ActivationResourceScope.track` may remain Heptalogos-owned if it represents tracked background work beyond Cordis effect semantics; its settlement policy should attach to the owning Fiber lifetime rather than recreate Fiber disposal.

Use a mature timeout primitive only if it provides net deletion and exact semantics. Do not add one merely to replace a small timer expression.

### C9.4 Required invariants after refactor

Tests must prove:

1. activation failure is surfaced once;
2. disposer executes exactly once;
3. async disposer completion is awaited;
4. late/background failure does not corrupt cleanup;
5. tracked task settlement is bounded;
6. dispose is idempotent;
7. activation cannot leak live effects after disposal;
8. substrate close disposes activations;
9. RuntimeKernel sees only RuntimeSubstrate contracts, not Cordis objects.

### C9.5 No compatibility wrapper

Delete old internal lifecycle scaffolding once new implementation passes.

Do not keep both implementations behind a flag.

---

## 14. RuntimeKernel lifecycle: use adopted XState for transition legality

### C10.1 Scope is narrow

Do **not** turn the whole RuntimeKernel reconciler into an XState application.

Heptalogos continues to own:

```text
MicroSystem desired/actual semantics
RuntimeReconciler
provider selection
readiness
generation fencing
service/capability/work-handler semantics
```

XState owns only the generic complex FSM mechanics of the Supervisor lifecycle.

### C10.2 Migrate Supervisor lifecycle state legality

Current manual lifecycle:

```text
ACTIVE
QUIESCING
QUIESCED
RESUMING
CLOSING
CLOSED
```

Add `xstate` as a direct runtime-kernel dependency using the already-adopted Catalog route.

Represent legal transitions with XState pure transition APIs, following the repository's existing XState pattern used by private-postgres/work-queue/host-maintenance.

Do not expose XState types through runtime-kernel public exports.

### C10.3 Update dependency routing description

The current XState route description must no longer imply only an initial private-postgres consumer.

Describe the actual role generically:

```text
implementation-only local complex FSM/statechart mechanics behind owning package boundaries
```

Current consumers may include:

```text
private-postgres
host-ownership
bootstrap-runtime
work-queue
runtime-kernel supervisor lifecycle
```

This is current implementation routing, not historical provenance.

### C10.4 Tests

Add/retain transition tests proving:

```text
ACTIVE -> QUIESCING -> QUIESCED -> RESUMING -> ACTIVE
ACTIVE/QUIESCING/... -> CLOSING -> CLOSED where allowed
invalid reconcile/quiesce/resume/close transitions reject deterministically
terminal CLOSED does not reopen
```

---

## 15. Whole-workspace Mechanics Archaeology

This is not optional. Known findings are only seed cases.

### C11.1 Audit scope

Audit:

```text
packages/foundation-contracts
packages/schema-runtime
packages/bootstrap-state
packages/private-postgres
packages/host-ownership
packages/bootstrap-runtime
packages/canonical-schema
packages/persistence
packages/time-service
packages/execution-lineage
packages/evidence
packages/signal
packages/work-queue
packages/runtime-substrate
packages/runtime-kernel

tools/repo-kit
scripts
.agents executable tooling
```

### C11.2 Required audit matrix

Create a working execution table in the plan execution notes or temporary working file, then fold only durable outcomes into the correct docs.

Columns:

```text
path
mechanic
current owner
candidate existing internal owner
adopted dependency route
standard/Node option
mature external candidate
semantic owner
decision
action
verification
```

Decision is exactly one:

```text
KEEP_DOMAIN_SEMANTIC
KEEP_THIN_GLUE
MOVE_TO_EXISTING_OWNER
EXTEND_EXISTING_OWNER
REPLACE_WITH_ADOPTED_LIBRARY
ADOPT_MATURE_LIBRARY
DELETE_DEAD
```

Do not add this working audit as a permanent architecture manifest unless a continuing machine consumer actually needs it.

### C11.3 Mandatory search families

Run searches for at least:

```bash
rg -n 'Ajv|TypeBox|compile\(|schema' packages
rg -n 'setTimeout|setInterval|clearTimeout|clearInterval' packages
rg -n 'AbortController|AbortSignal|Promise\.race|Promise\.allSettled' packages
rg -n 'new Map|new Set' packages/runtime-kernel packages/runtime-substrate packages/bootstrap-state
rg -n 'JSON\.parse|JSON\.stringify' packages tools scripts .agents
rg -n 'readFile|writeFile|readdir|stat|mkdir|rename|unlink|rm\(' packages tools scripts .agents
rg -n 'execFile|spawn|child_process|execa' packages tools scripts
rg -n 'createHash|randomUUID|uuid|canonicalize' packages
rg -n 'setup\(|createMachine|initialTransition|transition\(' packages
rg -n 'retry|backoff|timeout|lock|mutex|semaphore|queue' packages
rg -n 'ProblemError|schemaVersion:\s*1|problemCode' packages
rg -n 'ENOENT|EEXIST|EPERM|EACCES' packages tools scripts
rg -n 'walk\(|readdirSync|readdir\(' scripts tools .agents
```

Also run:

```bash
pnpm check:duplicates
pnpm check:unused
```

### C11.4 Library research rule

For a custom generic mechanic larger than trivial adapter glue:

1. identify at least the standard/Node facility;
2. identify the current adopted route if any;
3. if none, compare at least one mature library with real maintenance/use;
4. prefer the option that deletes owned complexity without framework capture.

Do not perform a full product Qualification for these comparisons.

Use direct upstream docs/source/package metadata first.

### C11.5 High-risk domains

Any custom implementation in these domains receives extra scrutiny:

```text
locking
process supervision
lifecycle/disposal
concurrency
retry/backoff
graph/DAG
schema parsing
filesystem atomicity
crypto
protocol parsing
database pooling/transactions
durable queue/workflow
watchers
package acquisition
```

A custom implementation in one of these domains without an owner/library rationale is a blocking finding.

---

## 16. Boundaries and enforcement after convergence

### C12.1 `scripts/verify/boundaries.mjs` must shrink

Move generic import restrictions to:

```text
Oxlint no-restricted-imports
Nx module-boundary rule
```

Keep custom boundary checks only where they enforce a Heptalogos semantic invariant that those tools cannot express cleanly, e.g.:

```text
sensitive Authority surface must not be exported from public package root
specific creation Authority must stay on acquisition path
```

Do not retain a custom repository-wide import parser once Oxlint/Nx own import policy.

If a custom check must inspect TypeScript syntax structurally, use an existing parser/compiler API rather than extending regex into a second parser.

### C12.2 Dependency gate must derive instead of duplicate

Review:

```text
scripts/verify/dependencies.mjs
scripts/verify/toolchain.mjs
```

Remove duplicated package lists/Authority projections when they can be derived from:

```text
dependency-routing.json
pnpm workspace Catalog
workspace package manifests
repo-kit Authority readers
```

Do not maintain the same repository tooling package list in three independent source files.

### C12.3 Repo-kit additions must be tested at the owner

Every new repo-kit primitive gets tests under:

```text
tools/repo-kit/test/
```

Consumer scripts should not duplicate those mechanics tests.

---

## 17. Package README / INDEX corrections

### C13.1 Package owner docs

Update only packages whose ownership changes or becomes clearer.

At minimum consider:

```text
schema-runtime README
foundation-contracts README
runtime-substrate README
runtime-kernel README
bootstrap-state README
```

README should answer:

```text
What semantics does this package own?
What generic mechanics does it delegate?
Which package/library is the mechanics owner?
What must consumers not bypass?
```

Do not copy the entire dependency routing document into each README.

### C13.2 packages/INDEX.md

Keep it generated/validated from current package facts as already designed.

Ensure descriptions make owner discovery useful, especially:

```text
foundation-contracts
schema-runtime
runtime-substrate
runtime-kernel
repo-kit (tooling, outside packages/)
```

No development-stage names.

---

## 18. Verification strategy — no new complex Qualification stage

This corrective work uses ordinary engineering verification.

### C14.1 Focused checks during each change set

Run the smallest relevant owner tests after each refactor.

Examples:

```bash
pnpm nx run repo-kit:test
pnpm nx run schema-runtime:test
pnpm nx run bootstrap-state:test
pnpm nx run bootstrap-runtime:test
pnpm nx run runtime-substrate:test
pnpm nx run runtime-kernel:test
pnpm nx run work-queue:test
```

Run lint/typecheck for changed projects.

### C14.2 Required permanent gates

Final static surface must include:

```text
Agent resource validation
documentation validation
repository validation
current-tree hygiene
dependency Authority
semantic boundaries
Knip
jscpd
toolchain
Prettier check
Oxlint primary lint
ESLint Nx boundary lint
ESLint source-documentation lint
TypeDoc declaration-first API generation and freshness check
TypeDoc structured reflection completeness against discovered product packages
TypeScript 7 typecheck
TS6 compiler-API lane
tests
build
```

### C14.3 Fresh install/clean cycle

Before candidate closure:

```bash
pnpm clean
pnpm install --frozen-lockfile
pnpm verify
```

If clean removes build outputs needed by type-aware Oxlint, the Nx task graph must build required dependency declarations as part of the legitimate task pipeline rather than relying on stale `dist`.

Do not manually prebuild undocumented state to make lint pass.

### C14.4 PostgreSQL qualification

This plan does not modify H3A-1 product semantics intentionally.

However, some owner refactors touch bootstrap/runtime packages that integrate with PostgreSQL.

Rule:

```text
if implementation changes only generic in-process mechanics and existing tests prove semantic equivalence:
  normal test/verify is required

if a change alters PostgreSQL process, ownership, persistence, recovery,
transaction, LISTEN/NOTIFY, or real database lifecycle semantics:
  run the existing applicable live PostgreSQL verification defined by current Authority
```

Do not invent a new Qualification matrix.

If required live PostgreSQL evidence cannot run on the current host, report `NOT_RUN`; do not claim PASS.

---

## 19. Execution change sets

Do not implement this as one giant commit.

### Change Set A — Plan + rules visible

Files:

```text
docs/plans/...
docs/plans/README.md
AGENTS.md
packages/AGENTS.md
docs/governance/engineering-principles.md
docs/dependencies/implementation-routing.md
docs/engineering/playbooks/mechanics-ownership-and-library-first.md
.agents/heptalogos/corpus-routes.json
relevant Skill
```

Exit:

```bash
pnpm check:agents
pnpm check:documentation
pnpm check:hygiene
```

### Change Set B — Repository tooling dependencies + Oxlint

Files:

```text
pnpm-workspace.yaml
package.json
pnpm-lock.yaml
.oxlintrc.json
eslint.config.mjs
nx/project configs
docs/dependencies/dependency-routing.json
docs/engineering/repository/toolchain.md
```

Exit:

```bash
pnpm lint
pnpm typecheck
focused negative lint fixtures
```

### Change Set C — Nx task orchestration (completed)

Nx owns repository task graphs, dependency ordering, scheduling, failure status,
and project discovery. Repository scripts remain individual claim-specific
checks.

Exit:

```bash
pnpm check:repo
pnpm check:static
pnpm verify
```

### Change Set D — repo-kit YAML/discovery convergence + jscpd

Files:

```text
tools/repo-kit/src/*
tools/repo-kit/test/*
scripts/verify/*
.agents/heptalogos/validate-skill-resources.mjs as applicable
jscpd config
```

Exit:

```bash
pnpm nx run repo-kit:test
pnpm check:duplicates
pnpm check:repo
```

### Change Set E — SchemaRuntime ownership

Files:

```text
packages/schema-runtime/*
packages/bootstrap-state/*
packages/bootstrap-runtime/*
lint owner restrictions
```

Exit:

```text
zero direct Ajv/TypeBox outside SchemaRuntime
schema/runtime/bootstrap tests
lint
typecheck
```

### Change Set F — Problem/common primitive convergence

Files:

```text
foundation-contracts
affected package problem adapters
known duplicate canonical instant helpers
bootstrap-state keyed serialization if confirmed
runtime-kernel registries if confirmed
```

Exit:

```bash
focused owner/consumer tests
pnpm check:duplicates
pnpm check:unused
```

### Change Set G — Cordis RuntimeSubstrate thinning

Files:

```text
packages/runtime-substrate/*
affected runtime-kernel integration tests
docs/readmes if ownership text changes
```

Exit:

```text
runtime-substrate tests
runtime-kernel tests
bootstrap-runtime integration tests affected by substrate lifecycle
```

### Change Set H — RuntimeKernel XState lifecycle

Files:

```text
packages/runtime-kernel/*
dependency routing description
package manifest
```

Exit:

```text
runtime-kernel lifecycle tests
lint
typecheck
```

### Change Set I — Full mechanics archaeology findings

Apply remaining approved:

```text
MOVE_TO_EXISTING_OWNER
EXTEND_EXISTING_OWNER
REPLACE_WITH_ADOPTED_LIBRARY
ADOPT_MATURE_LIBRARY
DELETE_DEAD
```

Do not opportunistically introduce later product capability.

Exit:

```bash
pnpm check:duplicates
pnpm check:unused
pnpm check:dependencies
pnpm check:boundaries
```

### Change Set J — Closure

Update current docs/readmes/plan status truth.

Run clean full verification.

Only then present candidate for external Independent Review.

---

## 20. Exact stop conditions

Stop with `PLAN_GAP` instead of improvising if:

1. an audit exposes a required new product-semantic owner not defined by current Architecture;
2. replacing a mechanic would alter durable product semantics beyond this plan;
3. Cordis cannot satisfy a required RuntimeSubstrate lifecycle invariant without a materially different runtime model;
4. moving Supervisor lifecycle to XState requires exposing XState through a stable public contract;
5. an external library candidate would become product Authority rather than mechanics provider;
6. a dependency needed for a **new generic role not already frozen by this plan** has multiple materially different architecture choices;
7. current dependency routing contradicts the actual intended owner and resolving it changes product architecture;
8. the current PR base/master moved in a way that invalidates the candidate;
9. H3A-2 product implementation appears on the branch;
10. required evidence cannot be run and the plan explicitly requires it for the changed semantics.

Do **not** stop merely because:

```text
a repository-only package is new
a mature tooling package needs normal installation
a helper must move to an existing owner
a development-only API can be deleted
current tests need updating to canonical current shape
```

Those are in scope.

---

## 21. Final acceptance criteria

The corrective plan is complete only when all are true.

### 21.1 Agent visibility

- root AGENTS contains mechanics-preflight rule;
- packages/AGENTS contains concrete owner-search protocol;
- durable engineering principles encode mechanics ownership;
- implementation routing explains reuse/extend/adopt/custom sequence;
- playbook exists;
- Agent routes expose the playbook.

### 21.2 Tool ownership

- Oxlint is primary JS/TS linter;
- type-aware no-floating/no-misused promises run under Oxlint;
- ESLint is reduced to Nx boundary/residual use;
- jscpd is permanent;
- yaml owns repository YAML parsing;
- tinyglobby owns read-only repository discovery;
- Nx owns gate/task scheduling;
- repo-kit no longer owns a generic gate scheduler.

### 21.3 Internal owner convergence

- no direct Ajv/TypeBox outside SchemaRuntime;
- repeated Problem envelope construction is reduced through foundation-contracts;
- known duplicate canonical instant validation is removed;
- confirmed same-semantics bootstrap-state concurrency helpers are consolidated;
- runtime-kernel registry duplication is either consolidated or explicitly shown to be semantically distinct.

### 21.4 Runtime library-first

- RuntimeSubstrate no longer duplicates Cordis Fiber lifecycle/effect/disposal without a Heptalogos-specific reason;
- Supervisor lifecycle legality uses adopted XState as specified by this plan;
- no Cordis/XState/framework types leak through stable Heptalogos public contracts.

### 21.5 Whole-tree audit

Every product package plus repo-kit/scripts has been inspected for generic mechanics.

No unresolved custom high-risk generic mechanic remains without:

```text
existing owner/library comparison
clear semantic owner
explicit KEEP rationale
```

### 21.6 Clean current tree

```bash
pnpm clean
pnpm install --frozen-lockfile
pnpm verify
```

passes from the documented clean state.

Then:

```text
pnpm check:duplicates = PASS
pnpm check:unused = PASS
pnpm check:hygiene = PASS
pnpm check:dependencies = PASS
pnpm check:boundaries = PASS
```

No stale development compatibility/provenance is introduced.

---

## 22. PR closure sequence

After implementation:

1. Ensure PR remains Draft while mutable.
2. Run focused validation and full clean `pnpm verify`.
3. Update PR body to describe the final current candidate, including:
   - mechanics ownership rules;
   - Oxlint/ESLint split;
   - Nx scheduler removal;
   - repo-kit convergence;
   - SchemaRuntime owner repair;
   - RuntimeSubstrate/XState corrections;
   - whole-workspace audit;
   - actual NOT_RUN evidence, if any.
4. Mark PR Ready.
5. Stop and request the **real out-of-band Independent Review**.
6. Do not infer review from GitHub.
7. If `REQUEST_CHANGES`:
   - return to Draft;
   - implement;
   - rerun required evidence;
   - Ready again;
   - obtain a new external verdict.
8. After external Independent Review `PASS`, do not mutate the branch.
9. Run final manual CI exactly as current governance requires.
10. If final CI PASS and branch remains unchanged, merge using the current repository squash-merge policy.
11. Reconcile plan/roadmap status only according to current closure governance.
12. H3A-2 remains blocked until Repository Stabilization closure is actually complete.

---

## 23. Executor completion report format

The Agent's final implementation report MUST contain:

```text
1. Candidate / PR state
2. Change sets completed
3. Dependencies added/removed
4. Custom mechanics deleted
5. Existing owners extended
6. Library replacements adopted
7. Mechanics intentionally kept custom and why
8. jscpd initial findings and final result
9. Oxlint migration result
10. ESLint residual scope
11. SchemaRuntime direct-import audit
12. Cordis ownership mapping result
13. XState Supervisor result
14. Whole-package audit summary
15. Focused verification
16. clean pnpm verify result
17. live PostgreSQL evidence if applicable
18. remaining NOT_RUN/BLOCKED evidence
19. confirmation H3A-2 was untouched
20. next required external governance gate
```

Do not report “all good” without the owner/library audit summary.

---

## 24. Short executor instruction

Use this exact instruction when handing the plan to a coding Agent:

```text
Execute `Mechanics Ownership & Library-First Convergence Corrective Plan`
as the governing plan for the remaining PR #29 repository-stabilization work.

Before any mutation, return the current Ready PR to Draft.
Do not touch H3A-2.
Do not query GitHub review objects for Independent Review state.

This is not a surface cleanup. Perform the complete owner/library archaeology
across all packages, repo-kit, scripts, and executable Agent tooling.

When a generic mechanic already has an internal owner, extend/reuse that owner.
When an adopted library owns the mechanic, use it.
Do not preserve local duplicate implementations for diff minimization.
Do not create compatibility wrappers.

Adopt Oxlint + oxlint-tsgolint, yaml, tinyglobby, and jscpd as specified.
Remove the custom repo-kit/Nx-duplicating gate scheduler.
Reduce ESLint to the residual Nx boundary lane.
Repair SchemaRuntime ownership and the Cordis/XState over-wrapper cases.
Make the mechanics-preflight rules visible in AGENTS, durable docs, playbook,
and Agent routes.

Use focused tests while editing and finish with a clean
`pnpm clean && pnpm install --frozen-lockfile && pnpm verify`.

Stop with PLAN_GAP only for the explicit stop conditions in the plan.
After implementation and local closure, stop at the real out-of-band
Independent Review gate. Do not dispatch or infer it yourself.
```
