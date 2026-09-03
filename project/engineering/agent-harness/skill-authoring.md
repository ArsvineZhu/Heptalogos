# Skill Authoring Guide

A Coding-Agent Skill is justified when a recurring implementation-time job
needs non-obvious project-specific procedure beyond normal coding competence,
the active Plan, and existing tools.

## Author the job

The description is discovery metadata. State what the Skill does and when it
should load in plain technical English. One Skill should cover one coherent
executor job, not a topic collection or a step-sized taxonomy.

SKILL.md should state the entry condition, information to inspect, procedure,
branches, stop/escalation boundary, and verification boundary. Keep current
Specs, Governance, Dependency decisions, and evidence in their canonical
owners; link to them rather than copying them.

## Keep the boundary

Skills may check implementation facts for an already-authorized Plan. They do
not decide product architecture, scope, provider roles, failure models, test
strategy, or permanent gate design. A mature library, tool, or script should
own deterministic mechanics where suitable.

Use references only for direct branch-specific procedure. Do not recursively
load another Skill merely because a reference mentions it. Do not create a
generator, fixed taxonomy, registry, checklist database, or prose validator.

## Evaluate and evolve

Inspect a should-trigger request, a nearby should-not-trigger request, and a
pressure case. Check owner/provider inspection, avoided overreach, and stop
behavior. Structural checks do not prove live behavior; without an independent
runner, behavior is NOT_RUN.

Grow or remove a Skill from observed recurring implementation behavior. Keep
the scoped [Skills contract](../../../.agents/skills/AGENTS.md) and global
[AGENTS contract](../../../AGENTS.md) as the standing execution guidance.
