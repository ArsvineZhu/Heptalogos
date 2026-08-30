---
name: knowledge-maintenance
description: Use when implementation or governance work changes a current fact, canonical knowledge-plane home, README, INDEX, AGENTS responsibility, package projection, or repository knowledge navigation.
---

# Knowledge Maintenance

Use this Skill when a changed fact must be placed in the current repository
knowledge system. It maintains ownership and retrieval; it does not author
product semantics.

## Workflow

1. Identify the audience, fact class, current versus historical scope, and
   existing canonical owner.
2. Confirm the current consumer, invariant, or evidence that requires the
   change.
3. Classify and update the owner:
   - human explanation → docs/
   - normative contract → specs/
   - governance → project/governance/
   - provider decision → project/dependencies/
   - sequence → project/roadmap/
   - work authorization → project/plans/
   - observed evidence → project/qualification/
   - human procedure → project/engineering/
   - persistent scoped behavior → nearest justified AGENTS.md
   - Agent procedure → .agents/skills/
   - local package purpose → package README
   - navigation projection → INDEX.md
4. Update only the necessary README, INDEX, package projection, and current
   links. Keep each fact owned once.
5. In PRE_PRODUCTION, move the current owner, update current consumers, validate
   the new tree, and remove obsolete routes. Do not add redirects, aliases,
   compatibility stubs, or migration tombstones for internal history.
6. Keep historical Plans and Qualification records chronological without
   letting them become current Authority.
7. Search for duplicate normative facts, stale paths, and broken current links.
8. Run pnpm check:knowledge plus the focused affected repository check.

## Retrieval quality

README explains purpose and scope. INDEX routes an unfamiliar reader with
read-when, ownership, and boundary context. AGENTS persists only behavior that
must automatically apply in that subtree. High semantic density means explicit
decision-relevant meaning, not compressed shorthand or a fixed length.

Read the [knowledge-system procedure](../../../project/engineering/repository/knowledge-system.md)
for the typed Authority map and the [Harness design](../../../project/engineering/agent-harness/design.md)
for the relationship between human guidance and Agent Skills.

## Stop and escalation

If the change would alter product semantics, canonical runtime ownership,
durable product state, provider selection, or an unresolved evidence boundary
outside the approved Plan, report PLAN_GAP. If current truth remains safe, record
and defer the finding. Stop when the canonical owner, required projections,
current links, and relevant checks are green.
