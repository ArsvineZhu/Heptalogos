# Current-Tree Naming

Heptalogos should use semantic names by default.

## Do not invent identifiers for project-management convenience

New current work should not automatically create:

```text
H3A-2
T1C
S7
P4
Q-RUNTIME-02
C-THING-03
Task 12
Decision 9
Gate 6
```

unless the identifier itself serves a real stable-reference requirement.

Use:

```text
durable execution recovery
Product Host management boundary
runtime lifecycle
Windows source-less packaging
```

as the primary identity.

## Identifiers that remain legitimate

Do not remove identifiers that are part of real semantic/reference contracts:

```text
problem/error codes
schema versions
protocol revisions
durable IDs
public API identifiers
Spec requirement IDs used as traceability anchors
Constitution principle references when useful
```

The point is not “numbers are forbidden”. The point is that project-management numbering must not become semantic infrastructure.

## Historical files are not rewritten for cosmetic purity

Completed/superseded Plans, old qualification records, Git commits, and evidence history may retain old H/T/Q/C names.

Do not mass-rename history and then add compatibility aliases/redirect tombstones.

## Current surfaces should be semantic

Clean current non-historical surfaces where development numbering leaks into meaning:

```text
active Plan names
current roadmap headings
current operational playbooks
current test descriptions/fixtures
current package/integration documentation
current qualification guidance/templates
current Harness documents
current scripts/validators
```

Replace the development ID with its semantic meaning; do not append both.

## Hygiene implementation must not learn a project-management taxonomy

`current-tree-hygiene` may retain a generic pattern that rejects milestone/PR/session identities from current executable/test names.

Delete the special `CURRENT_QUALIFICATION_ID_PATTERN` exception.

Do not replace it with a larger parser that knows all legal/illegal stage prefixes.

Qualification/history directories are already historical/evidence planes and should be excluded by ownership rather than teaching executable validators the project’s old numbering taxonomy.
