# Authority and Cleanup Model

This file is the central interpretation rule for the cleanup.

## Semantic capability is not machinery

The Project Charter explicitly allows a cheap, approved future-facing semantic seam before its first Product consumer.

Examples include:

```text
Service / Capability boundary
typed provider seam
generation identity
configuration namespace
extension contribution point
network / secret / config semantic slot
```

Therefore:

```text
unused today
!= obsolete
!= unauthorized
!= delete
```

Consumer count is evidence about current use, not semantic Authority.

The current P1 Product work also explicitly preserves confirmed future Product directions even when P1 does not instantiate them.

## Future machinery has a different burden

The Charter separately requires current evidence for expensive machinery:

```text
durable state
background worker
recovery protocol
compatibility path
scheduler
provider implementation
lifecycle state machine
generic framework
```

This distinction is mandatory during cleanup.

A cheap semantic seam may precede the consumer. A substantial implementation engine cannot justify itself merely by pointing at a possible future.

## History does not create Authority

Development history is evidence/history, not a standing requirement.

A deleted development artifact does not become a permanent negative requirement.

Use this test for a repository guard:

> Could a developer who knows only the current Constitution, Charter, Architecture and Specs independently derive this prohibition without knowing that the old artifact once existed?

If yes, it may be a standing invariant.

If no, and the only explanation is “we deleted that once,” it is a repository-history tombstone.

Examples:

```text
HostOwnershipToken only created by the acquisition path
    standing semantic invariant

cross-package relative imports forbidden
    current package-boundary invariant

current executable identity must not be named after H2A3 / PR #24 / session 7
    current-tree provenance invariant

GENESIS_EVIDENCE.json must never exist
    historical tombstone

scripts/phases must never exist
    historical tombstone
```

When an artifact is gone, delete the rule whose only purpose is remembering that it used to exist. Git and historical plans preserve chronology.

This does not refer to the **product-domain logical tombstone** in Constitution E21. Product data tombstones are real Data Lifecycle semantics. Repository-history tombstones are process residue.

## Tests are also permanent machinery

A test is not free merely because it is “only a test”.

Count:

```text
test LOC
fixtures
fakes
process harnesses
test-only seams
execution time
maintenance during refactors
false architecture pressure
```

against the Charter's minimum-total-maintenance-burden objective.

A test earns permanence by protecting a current semantic contract, a meaningful regression risk, a real provider/process boundary, or another hard-to-observe invariant.

A test does not earn permanence because it once participated in a Red → Green development ritual.

## Mature guardrails are different from ceremony

Mature deterministic tools that cheaply constrain likely LLM mistakes are valuable:

```text
TypeScript
ESLint / Oxlint
Prettier
jscpd
Knip
Nx
Vitest
TypeDoc
```

Do not confuse “there are too many process gates” with “all checks are bad”.

The cleanup removes process ceremony and low-signal custom policy while retaining high-signal mechanical constraints.

## Stable identifiers need a reason

Use semantic names by default.

A stable identifier is justified when another artifact/system must reliably refer to it across time, for example:

```text
public error/problem code
schema/protocol version
Spec requirement traceability anchor
durable identity
external contract identifier
```

Development order, a one-off task, a qualification run, a test scenario, or a cleanup step does not automatically need an ID.

Chronology belongs to Git, dates, and semantic history—not invented numbering systems.
