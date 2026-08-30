---
name: documentation-maintenance
description: Use when implementation or governance work changes a current fact, canonical document home, documentation topology, README, INDEX, AGENTS responsibility, or derived projection.
---

# Documentation Maintenance

## Ownership decision

Classify the changed fact before editing:

| Fact                                           | Canonical owner                          |
| ---------------------------------------------- | ---------------------------------------- |
| Conceptual model, rationale, semantic boundary | Architecture                             |
| Current exact implementation contract          | Spec                                     |
| Dependency/provider decision                   | Dependencies                             |
| Executed claim/evidence                        | Qualification                            |
| Repository procedure                           | Engineering document or applicable Skill |
| Persistent subtree behavior                    | Scope-level AGENTS                       |
| Local package purpose/ownership                | Package README                           |
| Navigation projection                          | INDEX                                    |

One fact has one canonical owner. A projection links to that owner instead of
copying normative prose.

## Maintenance workflow

1. Identify audience, fact class, current versus historical scope, and existing
   canonical owner.
2. Check the current consumer, invariant, or evidence that requires the change.
3. Update the owner in the vocabulary appropriate to that class.
4. Update affected README explanation, INDEX retrieval entries, and derived
   projections only where their role requires it.
5. Change AGENTS only when persistent behavior for that subtree changes; keep
   the change as a scoped delta from the root contract.
6. Remove obsolete current routes after a PRE_PRODUCTION replacement. Keep
   historical paths only in historical plans/records.
7. Search for duplicate normative facts and stale current links.
8. Run `pnpm check:documentation` and the focused affected repository check.

## Architecture, Specs, and retrieval

Architecture explains concepts and rationale; it does not become an
implementation checklist. Specs state exact current contracts; future design,
dependency detail, and qualification results belong elsewhere. An INDEX is a
retrieval surface: each entry should tell an unfamiliar reader what the target
is, when to read it, what it owns, and which adjacent boundary matters. Do not
truncate descriptions or make private prefixes/tags carry the meaning.

High-density Agent-facing prose means high decision-relevant information per
sentence. Use explicit subjects, owners, actions, conditions, and definitions;
do not replace semantics with codes merely to save tokens.

## Current/history and derived material

Standing pages describe current truth. Active plans authorize current work;
completed/superseded plans and qualification records preserve chronology and
observed evidence. One-time migration tombstones or absence checks leave current
tooling when the migration closes. Do not add redirects or compatibility stubs
for internal development history.

## Output

```text
Fact and audience:
Classification:
Canonical owner:
Current consumer/evidence:
Projections and navigation updated:
Historical treatment:
Duplicate/stale route search:
Verification: PASS | FAIL | NOT_RUN | BLOCKED
```

Read the [documentation system](../../../docs/engineering/repository/documentation-system.md)
and [Harness design](../../../docs/engineering/repository/agent-harness-design.md).
