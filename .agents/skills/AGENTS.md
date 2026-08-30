# Skill Authoring Contract

This scope contains Coding-Agent implementation-time procedural capabilities.

- Skill inventory is open-ended. One Skill provides one coherent recurring job,
  not one topic and not one tiny step.
- The description is the discovery interface and states what the capability
  does and when it should load in plain technical English.
- SKILL.md is the workflow and decision control plane: entry condition,
  information to inspect, classification, branches, action, stop/escalation,
  and verification boundary.
- Use progressive disclosure. References, examples, and scripts exist only
  when they directly support the capability and are reachable from SKILL.md.
  Scripts are for deterministic mechanics.
- Capability matters more than arbitrary brevity. High density means
  decision-relevant self-contained meaning, not shorthand.
- Skill bundles contain no historical narrative, changelogs, or redundant
  README material. Planning, roadmap, independent review, lifecycle ownership,
  and release orchestration remain outside Skills.
- Skill growth follows observed recurring implementation behavior and
  evaluation. Human rationale belongs in project/engineering/agent-harness/.
