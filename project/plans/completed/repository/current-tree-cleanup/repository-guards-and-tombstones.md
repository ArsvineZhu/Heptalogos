# Repository Guards and Historical Tombstones

The cleanup keeps high-signal guards and removes negative history.

## Keep mature deterministic tools

Keep:

```text
jscpd / check:duplicates
Knip / check:unused
Prettier
ESLint / Oxlint
TypeScript primary typecheck
TS6 compiler-API compatibility lane
Nx
Vitest
TypeDoc projection checks
```

Keep `.jscpd.json`'s current mild profile and exclusions unless a concrete false-positive appears.

Do not remove a useful third-party tool merely to reduce the number of dependencies or checks.

## Keep current semantic/repository invariants

Keep `check:boundaries`.

Its Heptalogos-specific rules such as HostOwnershipToken creation ownership, stable-root framework leakage, and restricted repository construction surfaces are current invariants.

Keep `check:package-layout`, `check:agents`, and knowledge navigation/integrity checks where they represent current designed structure.

Do not add new rules during this cleanup just because a nearby failure is noticed.

## Rewrite current-tree hygiene around current properties

Edit:

```text
tools/repo-kit/src/current-tree-hygiene.mjs
tools/repo-kit/test/current-tree-hygiene.test.mjs
```

Keep the general rule that **current executable/test identities must not carry development milestone, PR, session, or corrective-cycle identity**.

Keep compatibility-obligation register existence/JSON/schema/epoch validation.

Delete the crude history/tombstone mechanisms:

```text
GENESIS_EVIDENCE.json exact-path blacklist
scripts/phases exact-path blacklist
closed-phase-artifact findings tied to those names
CURRENT_QUALIFICATION_ID_PATTERN special exemption
HISTORICAL_COMPATIBILITY_PATTERN lexical scan
blanket symbolic-link-residue prohibition unless a current security/path contract independently requires it
```

Delete their corresponding tests.

Specifically remove the permanent test:

```text
rejects GENESIS_EVIDENCE.json and scripts/phases
```

Do not replace those exact identities with a new blacklist.

Do not reject a source/test merely because its prose contains words such as:

```text
legacy
obsolete
deprecated
previous schema
```

Those words do not prove a compatibility path exists. Detecting semantic compatibility baggage is an architecture/code-review concern unless a precise mechanical invariant exists.

Change compatibility-register validation so PRE_PRODUCTION does not mean `obligations` must be empty forever. The register is the Authority: validate its shape and current epoch; if a real obligation is declared, other code must follow it rather than the validator rejecting the declaration.

Keep tests for the remaining generic current-tree properties, but rewrite their names semantically rather than with development stage IDs where practical.

## Knowledge checks

Do not gut `check:knowledge`.

Keep:

```text
required entrypoints
valid JSON for current machine-readable knowledge
local links resolve and remain in repo
root/docs/project navigation coverage
architecture discoverability
Spec discoverability
unique Spec requirement IDs
```

Remove duplicate development-provenance policing if it is already owned by current-tree hygiene.

When qualification-status is retired by `qualification-evidence.md`, remove its entry from `CURRENT_MACHINE_AUTHORITIES` and update only tests/knowledge rules that require that path.

Do not create a replacement generic “repository authority registry” unless the remaining existing registry still has concrete consumers. If a repo-kit helper becomes dead, delete it and its tests rather than preserving it for future governance.

## Repository validator

Keep repository structural checks that are derivable from current design:

```text
Git/package root
single package-manager/lockfile authority
required root files
package test-plane/layout conventions
current package documentation/navigation
manual verification workflow existence
```

Remove rules whose only purpose is PR candidate ceremony:

```text
pr_number input
reason input
Draft/Ready state
candidate head/base freezing
candidate SHA revalidation
post-matrix revalidation
```

Keep cheap action SHA pinning as a supply-chain invariant if the current workflow uses Actions.

## Manual GitHub verification

Rewrite `.github/workflows/verify.yml` as an explicitly dispatched three-OS verification utility:

```text
workflow_dispatch
→ checkout selected revision
→ setup pnpm and Node
→ pnpm install --frozen-lockfile
→ pnpm verify
```

No PR lookup, candidate freeze, temporary merge, review status, or candidate revalidation.

Ordinary GitHub Actions remain disabled unless the user later changes that policy.

## Verification orchestration

Keep individual useful checks.

Change ordinary `pnpm verify` so it proves ordinary code health rather than transitively re-running every repository governance surface.

Recommended default:

```text
format:check
lint
typecheck
check:boundaries
check:duplicates
check:unused
tests
build
```

Keep `check:repo` as an explicit comprehensive repository/control-plane audit that aggregates scoped checks such as:

```text
check:agents
check:knowledge
check:repository
check:package-layout
check:hygiene
check:dependencies
toolchain:check
docs:api:check
TS6 lane when still part of repository audit
```

Do not make `check:repo` a dependency of ordinary `verify`.

The active Plan explicitly requests scoped checks when it changes the corresponding surface. Do not build a smart gate router.
