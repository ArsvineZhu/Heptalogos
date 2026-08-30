# Coding-Agent Harness design

This document is the human-maintainer design for the Coding-Agent Harness. It
describes capability boundaries and maintenance rules; it does not authorize
product work or replace an active Plan.

## Purpose and layers

The Harness reduces predictable implementation mistakes while leaving ordinary
coding flexible. The normal context is disclosed progressively:

root AGENTS
→ approved active Plan
→ target package README and local INDEX
→ relevant current Spec
→ applicable procedural Skill
→ implementation and focused verification

Persistent AGENTS rules cover behavior that should influence most work.
Project-control documents provide authorization, policy, provider decisions, and
evidence. Skills provide on-demand implementation procedures. Human Architecture
provides conceptual rationale; Specs provide exact current contracts.

## Governing risk

Agent complexity-generation inertia converts local uncertainty into permanent
abstractions, state, validation, tests, recovery, compatibility, or meta-tooling
beyond current semantics. The Harness counters that tendency with admission
questions:

approved current requirement
→ semantic owner and current consumer
→ existing primitive or adopted mechanic
→ smallest semantics-correct change
→ claim-matched proof
→ acceptance green
→ STOP

The rule admits necessary complexity. It does not prohibit a real current
consumer, invariant, failure model, threat model, or stable boundary from
justifying a permanent surface.

## Capability map

The capability set is open-ended and describes coherent implementation jobs:

| Capability                                                                            | Decision it supports                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [scope-control](../../../.agents/skills/scope-control/SKILL.md)                       | Is this finding or work admitted into the current task?              |
| [complexity-admission](../../../.agents/skills/complexity-admission/SKILL.md)         | What permanent complexity is justified for admitted work?            |
| [mechanics-routing](../../../.agents/skills/mechanics-routing/SKILL.md)               | Which existing or adopted mechanic should implement it?              |
| [repository-check-design](../../../.agents/skills/repository-check-design/SKILL.md)   | Does a permanent gate encode a real standing invariant?              |
| [test-design](../../../.agents/skills/test-design/SKILL.md)                           | What proof verifies the current claim without creating architecture? |
| [recovery-design](../../../.agents/skills/recovery-design/SKILL.md)                   | What bounded first-order recovery is authorized?                     |
| [durable-state-change](../../../.agents/skills/durable-state-change/SKILL.md)         | Does a new semantic fact justify persistent state?                   |
| [semantic-boundary-change](../../../.agents/skills/semantic-boundary-change/SKILL.md) | How is an authorized ownership change implemented?                   |
| [preproduction-evolution](../../../.agents/skills/preproduction-evolution/SKILL.md)   | How is the current PRE_PRODUCTION shape rewritten without residue?   |
| [claim-verification](../../../.agents/skills/claim-verification/SKILL.md)             | What evidence level proves the claim?                                |
| [knowledge-maintenance](../../../.agents/skills/knowledge-maintenance/SKILL.md)       | Which plane owns a changed fact and which projections need updating? |
| [authoring-skills](../../../.agents/skills/authoring-skills/SKILL.md)                 | How are Skills created, restructured, and evaluated?                 |

This is a capability map for maintainers, not a validator allow-list or a
closed Skill taxonomy.

## Boundary rules

Canonical semantic mutation remains behind its owning package or service.
Plans authorize work but do not become standing semantics. Qualification is
observed evidence and cannot prove beyond its executed boundary. A Skill may
link to a Spec, Governance, Dependency, or qualification owner but must not
silently copy it.

Skill descriptions are discovery metadata. SKILL.md is the workflow and
decision control plane. Detailed cases and conditional methods belong in direct
references. Scripts are reserved for deterministic mechanics. Planning,
roadmap, independent review, lifecycle ownership, and release orchestration
remain outside Skills.

## Maintenance

Evolve the Harness from observed recurring implementation behavior and
behavioral evaluation. Remove unused or redundant Skill material. A green
acceptance condition is a STOP boundary; a new concern reopens work only when
new current evidence, an accepted current failure case, a current consumer or
invariant, or an explicit Plan requirement exists.
