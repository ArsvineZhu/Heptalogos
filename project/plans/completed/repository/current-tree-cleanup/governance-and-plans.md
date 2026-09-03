# Governance and Plans

## Root AGENTS

Rewrite `AGENTS.md` as a compact executor contract while preserving its useful current rules.

Keep:

```text
explicit active Plan authorization
PLAN_GAP for material unresolved semantics/owner/provider/state/failure decisions
Library-First / adopted provider directive
PRE_PRODUCTION no development-history compatibility
tests do not create architecture
recovery-of-recovery is not automatic
claim-bounded evidence
green acceptance -> STOP
```

Correct the sentence that currently says the executable spine and “real consumers take priority over elegant but unused capability.”

The replacement must reflect the Charter:

> A broken current executable spine takes priority over unrelated expansion. This does not make an approved low-cost future-facing semantic seam disposable. Preserve current Architecture/Charter semantic seams; reject unsupported machinery, not approved meaning.

Add these compact anti-priors:

```text
minimal diff is not a project objective
dependency count is not a quality metric
TDD is not the default workflow
do not run a Red test merely to prove unimplemented new code is absent
a one-time development event does not justify a permanent test/gate
history does not create Authority
a deleted historical identity is not a permanent negative requirement
```

Normal Coding-Agent context is bounded:

```text
root/scoped AGENTS
Project Charter
designated active Plan
Plan-named Required Context
affected Specs/package docs
source/tests
an applicable retained Skill
```

Do not make broad completed/superseded Plans, qualification history, or human Harness material normal executor context.

All material stays in this repository.

## Project Charter

Do not rewrite the Charter wholesale.

Preserve its existing distinction between cheap future semantic seams and expensive future machinery.

Add only the missing operational consequences under Testing/Maintenance if not already represented after the edit:

> A pre-implementation failing test is useful only when it yields information: reproducing an observed defect, characterizing existing behavior, resolving an uncertain contract, or probing an external/runtime property. Do not run a failing test solely to demonstrate that not-yet-written functionality is absent.

> Development history does not create permanent negative repository invariants. Once an obsolete internal artifact is removed, Git/history preserves that fact unless a current standing rule independently forbids the artifact class.

Do not create new numbered constitutional principles for these additions. They are clarifications of existing PRE_PRODUCTION/testing posture.

## Engineering principles

Keep Library-First, semantic/mechanics ownership, adapters, evidence-first dependency research, framework leakage, executable truth, state semantics, failure/threat-model discipline.

Remove the structured `Complexity Admission` questionnaire and its mandatory change-rationale fields.

Replace it with the Charter-level distinction:

```text
cheap approved semantic seam may precede a consumer
expensive permanent machinery needs an explicit current reason
```

Replace the current TDD wording with the information-gain rule above.

Add the permanent-check rule:

> A repository validator may permanently encode a current standing invariant or a genuinely closed semantic set. A one-time migration/deletion/history fact does not qualify. Do not hard-code deleted artifact names/paths merely to prevent their return.

Do not add a meta-validator that checks this rule.

## PRE_PRODUCTION evolution policy

Rewrite `project/governance/pre-production-evolution.md` to retain:

```text
CompatibilityEpoch
declared compatibility obligations
direct rewrite/reset/delete permission
current truth vs history
development residue cleanup
claim-matched verification
STOP
```

Remove standing requirements for:

```text
Hn-S before every Hn CLOSED
mandatory A/B/C stabilization lifecycle
mandatory Sweep A-E
candidate freeze/revalidation
external Independent Review
candidate unchanged after verdict
merge/review closure formula
```

A stabilization/cleanup pass may still be explicitly authorized when useful. It is a focused cleanup activity, not a universal project stage.

## Implementation Plans

Rewrite `project/plans/README.md`.

Keep Plan states and decision completeness, but remove mandatory boilerplate headings such as:

```text
Current Horizon
Executable Truth target
Authorized failure classes
Deferred failure classes
Complexity admission
Reopen conditions
```

A Plan is decision-complete when a competent executor can implement it without redoing material architecture/product/technical-policy decisions.

Use semantic file/title names. Do not assign task/phase IDs by default.

Do not create:

```text
Plan linter
Plan schema
task registry
decision registry
acceptance matrix
hash/manifest
one-commit-per-task rule
review-after-each-task rule
```

## Standing closure artifacts

Delete current operational artifacts whose purpose is the old candidate ceremony:

```text
project/engineering/playbooks/repository/pre-production-stabilization-closure.md
project/engineering/playbooks/repository/milestone-pr-closure.md
project/engineering/gotchas/repository/independent-review-is-external.md
```

Update current indexes/links.

Historical completed/superseded Plans remain history and are not rewritten merely to remove old terminology.

## Roadmap

Keep product/architecture sequence and confirmed future directions.

Rewrite the current-facing roadmap so development areas are named semantically rather than requiring H/M/T identifiers as the primary meaning.

Do not mass-edit historical Plan filenames/commit history.

Current future work should be understandable from names such as:

```text
Subject vertical slice
Messaging integration
Capability/package lifecycle
Configuration and secrets
Recovery and shipping closure
```

rather than requiring a reader to decode an arbitrary stage number.

If an old H/M label is needed solely to explain history, keep it only in historical context, not as current implementation identity.
