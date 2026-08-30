---
name: mechanics-routing
description: Use when implementation needs generic parsing, schema, process, concurrency, retry, timeout, graph, state-machine, disposal, queue, serialization, database, observability, or protocol mechanics.
---

# Mechanics Routing

## Purpose

This Skill separates Heptalogos semantics from generic mechanics and routes the
mechanics through the adopted owner/provider. It protects Library-First without
turning the repository into a dependency encyclopedia.

## Routing sequence

1. State the semantic requirement and its current consumer.
2. Separate the project meaning from the generic mechanic.
3. Locate the existing semantic owner and package boundary.
4. Search the target package, workspace exports, and package navigation for an
   existing primitive or adapter.
5. Read the adopted role/provider decision in
   [`dependency-routing.json`](../../../docs/dependencies/dependency-routing.json)
   and the [Library-First playbook](../../../docs/engineering/playbooks/mechanics-ownership-and-library-first.md).
6. Reuse or extend the existing owner when it is sufficient.
7. Otherwise use the adopted Standard/Node/OS or library route behind a
   Heptalogos-owned contract.
8. If the route is genuinely insufficient, name the missing primitive and
   report `PLAN_GAP` before replacing a foundational provider.

Do not add a local generic helper merely because its first call site is small.
Do not let a provider object, queue, workflow, statechart, parser, or database
handle become a second semantic Authority.

## Worked routes

| Requirement                | First route                                                                      | Boundary to preserve                                                   |
| -------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Retry/backoff              | Find the owning WorkQueue/provider retry contract and its budget                 | Retry identity and terminal classification remain product-owned.       |
| State-machine mechanics    | Find the owning Runtime lifecycle contract and adopted state-machine adapter     | Framework states do not become product semantics or public types.      |
| Schema validation          | Use the repository schema-runtime route and the domain owner's schema            | Generic compilation does not own domain shape or compatibility.        |
| Process lifecycle          | Use the existing repo-kit/process or package-owned process adapter               | Bounds, redaction, cancellation, and ownership remain explicit.        |
| Graph traversal            | Use the existing Runtime graph/registry primitive                                | Traversal order must not silently become provider-selection Authority. |
| Async scheduling           | Use the WorkQueue/durable-execution route for restart obligations                | An in-memory task is not a durable product obligation.                 |
| Serialization              | Use the owning versioned contract and canonical codec                            | JSON/framework defaults do not create fallback readers.                |
| PostgreSQL helper behavior | Use Persistence, canonical-schema, Host ownership, or Signal owner as applicable | Raw SQL/pool access does not bypass fence or mutation Authority.       |

The table is a routing aid, not permission to use every listed package. Confirm
the current package README and current Spec for the actual consumer.

## Reuse versus extension

Extend the existing owner when it owns the missing primitive and the extension
does not change its semantic contract. Add an adapter when the adopted provider
must be isolated behind a stable project contract. Stop when the proposal
requires a new dependency role, duplicate generic framework, new subsystem, or
unresolved package direction.

A real provider blocker must include the exact required primitive, the current
consumer, the adopted route inspected, and why reuse/extension cannot provide
it. “Another library seems cleaner” is not blocker evidence.

## Interaction with other procedures

Use [`scope-control`](../scope-control/SKILL.md) when adding mechanics expands
the task. Use [`lifecycle-change`](../lifecycle-change/SKILL.md) for bounded
resource lifetime and [`durable-state-change`](../durable-state-change/SKILL.md)
for restart-visible state. Use
[`semantic-boundary-change`](../semantic-boundary-change/SKILL.md) when ownership
or package direction changes.

## Output

```text
Semantic requirement and consumer:
Generic mechanic:
Semantic owner:
Existing primitive/adapter searched:
Adopted provider route:
Reuse/extend/adapt decision:
Concrete blocker, if any:
Package/API impact:
Focused verification:
```

Delete replaced duplicate mechanics under PRE_PRODUCTION after current callers
and tests use the adopted route.
