---
name: semantic-boundary-change
description: Use when implementation changes semantic ownership, canonical mutation authority, public package contracts, dependency direction, or a cross-boundary durable payload.
---

# Semantic Boundary Change

## Scope

This Skill operationalizes a boundary change already resolved by the active
plan. It does not authorize the Agent to invent a new owner, package boundary,
public contract, or provider decision.

## Required sequence

```text
approved boundary change
→ current semantic owner
→ current consumers and invariants
→ affected Spec(s)
→ package/API boundary
→ adopted mechanics provider
→ implementation update
→ remove the old current path
→ update normative projections and navigation
→ focused verification
```

At each arrow, name the artifact or code owner. If the plan does not resolve
the new owner, mutation Authority, dependency direction, durable payload, or
compatibility behavior, stop with `PLAN_GAP` rather than selecting the most
convenient boundary.

## Boundary worksheet

| Question                           | Required answer                                       |
| ---------------------------------- | ----------------------------------------------------- |
| What semantic fact changed?        | Current contract or invariant in plain language.      |
| Who owns it now?                   | One Heptalogos semantic owner and mutation Authority. |
| Which current consumers use it?    | Package, executable path, or cross-process reader.    |
| Which Spec and README describe it? | Canonical normative and local navigation owners.      |
| What is provider mechanics?        | Adopted route below the Heptalogos contract.          |
| What old path is removed?          | No dual current Authority or compatibility alias.     |
| What evidence proves the change?   | Claim-matched focused verification.                   |

## Ownership protections

Do not bypass an owning service with direct SQL, filesystem, provider, framework,
or private object access merely because it makes a test or implementation
shorter. Do not let a provider's workflow/queue/state become product Authority.
Do not turn a derived projection, telemetry event, or engine-private record into
canonical truth without an approved semantic change.

When a boundary change also introduces a new persistent or cross-process fact,
load [`durable-state-change`](../durable-state-change/SKILL.md). When it changes
start/stop/ownership lifetime, load
[`lifecycle-change`](../lifecycle-change/SKILL.md). When generic mechanics are
needed, load [`mechanics-routing`](../mechanics-routing/SKILL.md).

## Migration and closure

Update current callers, tests, Specs, package READMEs, and indexes in the same
authorized change. Under PRE_PRODUCTION, remove obsolete internal aliases and
fallbacks rather than keeping two current routes. Verify the new owner and the
absence of the old path, then stop when the acceptance condition is green.

## Output

Record the approved boundary, owner, consumers, affected Specs/packages,
provider route, removed path, updated projections, and exact verification state.
