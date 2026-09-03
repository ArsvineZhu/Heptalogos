# Qualification Evidence

Qualification should answer a property question, not model a release candidate lifecycle.

## Retire the current candidate-lifecycle ledger

Delete:

```text
project/qualification/results/qualification-status.json
```

The audited file currently duplicates evidence while carrying:

```text
qualification IDs
OPEN / PARTIAL / CLOSED lifecycle
candidate IDs
candidate branch
candidate SHA
base/review SHA
PR number
freeze state
Independent Review
candidate revalidation
merge state
historical scenario IDs
large carried-forward PASS matrices
test counts
```

No production code depends on this ledger. Current code-search consumers are repository knowledge/governance tooling/tests plus documentation.

Do not replace it with another giant JSON ledger.

Remove it from:

```text
tools/repo-kit/src/repository-governance.mjs CURRENT_MACHINE_AUTHORITIES
repo-kit tests that expect it
current qualification/results navigation
other current non-historical links
```

## Keep actual evidence and architecture decisions

Keep `project/qualification/dependency-status.json` as the provider-role Authority.

Keep existing `Q-*.md` and `C-*.md` files as executed/historical evidence. Do not mass-rename them and break historical links merely for aesthetics.

Their existing numeric names are legacy evidence identities, not a template for future work.

No new qualification record is required to use Q/C numbering.

## New qualification records use semantic names

Going forward, use property-oriented filenames/titles such as:

```text
runtime-cordis-lifecycle.md
private-postgres-windows-runtime.md
durable-execution-process-recovery.md
product-host-windows-smoke.md
source-less-windows-package.md
```

Only create a record when qualification was actually executed or when a current Plan explicitly owns a concrete pending property.

Do not pre-create placeholder records for every future platform/provider.

## Minimal evidence content

A qualification record should contain only information needed to understand the observed claim:

```text
property / claim
actual boundary and environment
result: PASS | FAIL | NOT_RUN | BLOCKED
tested revision when materially necessary
evidence command/artifact/reference
remaining untested boundary only when it matters to interpreting the claim
```

Do not require:

```text
candidate lifecycle
review verdict
merge state
freeze state
revalidation
task/stage ID
qualificationState OPEN/PARTIAL/CLOSED
numeric scenario IDs
carried-forward full-repository PASS inventories
```

A git SHA is allowed when it identifies what was actually tested; it is evidence provenance, not a candidate-management protocol.

## Results index

Rewrite `project/qualification/results/README.md` as a semantic evidence index.

It should explain:

```text
dependency role decisions -> dependency-status.json
implementation/provider/product evidence -> result records
historical Q/C IDs -> retained old evidence names only
new evidence -> semantic name
```

Do not maintain tables merely to demonstrate that every possible qualification family has an assigned ID.

## Result template

Rewrite `project/qualification/result-template.md` so there is no mandatory qualification ID and no lifecycle-state ceremony.

The template is optional guidance, not a schema gate.

## Qualification README / verification system

Keep the useful proof boundary distinction:

```text
unit/package
real DB/provider
process restart
platform/native
source-less/shipping artifact
```

Remove candidate-closure, Independent-Review, freeze/revalidation, and merge semantics.

Evidence states remain:

```text
PASS
FAIL
NOT_RUN
BLOCKED
```

Do not call a not-executed boundary PASS merely because adjacent tests passed.
