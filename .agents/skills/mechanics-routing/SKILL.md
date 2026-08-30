---
name: mechanics-routing
description: Use when work needs generic parsing, schema, process, concurrency, retry, timeout, graph, state-machine, disposal, queue, serialization, database, observability, or protocol mechanics.
---

# Mechanics Routing

## Trigger

Load this Skill before adding or expanding generic mechanics in product,
repository tooling, scripts, or Agent code.

## Required inputs

- semantic owner and current consumer;
- target package README and `packages/INDEX.md` when applicable;
- existing owner/primitive search results;
- adopted dependency and implementation routes.

## Procedure

1. Name the Heptalogos semantic owner and the generic mechanic separately.
2. Search the target package, workspace exports, and package navigation for an
   existing owner or primitive.
3. Read [`dependency-routing.json`](../../../docs/dependencies/dependency-routing.json)
   and the [Library-First playbook](../../../docs/engineering/playbooks/mechanics-ownership-and-library-first.md).
4. Reuse or extend the existing owner when it owns the mechanic.
5. Otherwise use the adopted Standard/Node/OS or library route behind the
   existing Heptalogos boundary.
6. Keep provider objects below stable contracts and preserve bounded cleanup.

## Stop / escalation

Use `PLAN_GAP` when a provider role is unresolved, an adopted route has a real
hard blocker, replacement is required, or custom generic infrastructure would
become a new subsystem. Do not select a new foundational dependency silently.

## Output

State the semantic owner, mechanics provider, adapter owner, consumer route, and
focused verification target before implementation. Delete replaced duplicate
mechanics in PRE_PRODUCTION.
