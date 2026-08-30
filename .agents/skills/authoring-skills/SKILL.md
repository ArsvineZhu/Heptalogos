---
name: authoring-skills
description: Use when creating, restructuring, evaluating, or changing discovery metadata, references, scripts, or responsibilities for a Coding-Agent Skill.
---

# Authoring Skills

Use this Skill when a Skill itself is the implementation subject. Its job is
to create a capability that changes Agent behavior, not to create a Skill
generator or a topic-routing taxonomy.

## Workflow

1. State the one coherent recurring implementation job and its boundary.
2. Collect realistic requests that should trigger the Skill and nearby requests
   that should not.
3. Inspect the current Skill, current Harness guidance, relevant Specs,
   Governance, Dependencies, and observed failure when available.
4. Write a plain-language description that says what the Skill does and when
   it loads. Put concrete trigger vocabulary early.
5. Choose freedom to match task fragility: principles for judgment, a decision
   tree for a preferred pattern, or exact steps/script for deterministic work.
6. Make SKILL.md the workflow control plane: entry condition, information to
   inspect, classification, branches, action, stop or escalation, and proof
   boundary.
7. Move branch-specific detail to direct references. Add a script only when
   deterministic execution materially improves correctness.
8. Create should-trigger, should-not-trigger, and pressure/application cases.
9. Inspect actual Agent use when an independent runner exists. Otherwise record
   live behavior as NOT_RUN.
10. Remove material that does not improve discovery or behavior.

## Quality boundary

Use progressive disclosure and keep references shallow. Link canonical Specs,
Governance, Dependencies, and evidence instead of copying their facts. High
semantic density means self-contained decision-relevant meaning, not cryptic
shorthand or a fixed line budget. Broad size and reference-count guidance is a
review heuristic only.

Skill authoring is not product-code TDD. Do not create a mandatory body
template, qualitative prose validator, fixed Skill inventory, or generator.

For rationale and maintainer guidance, read
project/engineering/agent-harness/skill-authoring.md.

## Stop

Stop when the coherent job is supported, discovery and boundary cases are
covered, links/structure validate, and the authorized acceptance condition is
green. A future possible Skill is not current admission evidence.
