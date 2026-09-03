---
name: mechanics-routing
description: Use when an authorized implementation needs generic parsing, schema, process, concurrency, retry, timeout, graph, state-machine, disposal, queue, serialization, database, observability, or protocol mechanics.
---

# Mechanics Routing

This procedure routes generic mechanics through the current semantic owner and
adopted provider. It does not select a new architecture role.

## Route

1. State the semantic requirement and its current consumer.
2. Identify the Heptalogos semantic owner and package boundary.
3. Search for an existing repository primitive or adapter.
4. Read the adopted provider route in
   ../../../project/dependencies/dependency-routing.json and the current
   package/Spec documentation.
5. Reuse or extend the owner when sufficient.
6. Otherwise use the adopted Standard/Node/OS or mature library route behind a
   thin Heptalogos adapter.

Do not create a parallel generic mechanic because the first call site is small,
because a dependency is inconvenient, or because the dependency has no
qualification ID. Dependency count is not a quality metric.

## Boundary

Keep product meaning, identity, retry/terminal classification, authorization,
fencing, and evidence in the semantic owner. Keep provider objects, workflow
rows, queues, parsers, statecharts, and database handles behind the owning
adapter. An in-memory task is not a durable product obligation.

If the adopted route is genuinely insufficient, report the exact missing
primitive, current consumer, route inspected, and why reuse or a thin adapter
cannot satisfy the authorized contract. Report PLAN_GAP only when the active
Plan lacks a material provider or ownership decision.

## Verify

Run the focused proof named by the Plan at the boundary it claims. Do not
convert static, mock, single-platform, or source-tree evidence into a stronger
provider, process, platform, or artifact claim.

Read the Library-First playbook at
../../../project/engineering/playbooks/mechanics-ownership-and-library-first.md
and the applicable current Spec.
