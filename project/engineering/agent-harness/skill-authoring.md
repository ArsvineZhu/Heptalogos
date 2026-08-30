# Skill authoring guide

This guide is for human maintainers creating or restructuring a Coding-Agent
Skill. A Skill is justified when a repeatable implementation-time activity
needs non-trivial procedure or judgment and progressive disclosure can improve
behavior.

## Coherent job and discovery

State one coherent engineering capability and its boundary. A Skill may have
several steps when they form one repeated decision workflow, but it should not
be a topic router or a collection of unrelated disciplines.

The frontmatter description is the discovery interface. Say what the Skill
does and when it should load in plain technical English. Put concrete trigger
vocabulary early; explain project shorthand if it is necessary.

## Control plane and resources

SKILL.md should contain the entry condition, information to inspect,
classification model, critical workflow, branches, action, stop or escalation,
and verification boundary. It is a workflow control plane, not an encyclopedia.

Use progressive disclosure:

SKILL.md
→ direct reference, example, or script

References hold branch-specific methods, casebooks, and worked examples.
Scripts are for deterministic or fragile mechanics and must return useful
errors. Current Specs, Governance, Dependencies, and evidence remain canonical
outside the Skill; link them instead of duplicating them.

Choose freedom to match task fragility. Judgment-heavy work needs principles
and examples. A preferred pattern benefits from checkpoints or a decision tree.
A fragile deterministic operation may need exact steps, a script, and a
validation check.

## Authoring quality

High semantic density means more decision-relevant meaning per sentence, not
cryptic shorthand or a minimum line count. State desired behavior first.
Explicit prohibitions are useful when they counter an observed repeated failure,
a strong model default, or a high-cost Authority violation.

Use boundary-pair examples: a should-trigger request beside a nearby
should-not-trigger request, plus a pressure case that tests the hardest
decision. Do not preserve every hypothetical rule or every investigation.
Remove unused Skill material.

## Evaluation and evolution

Evaluate discovery, non-trigger behavior, and application behavior. Inspect
what information the Agent acquired, which owner/provider it checked, what it
decided, what overreach it avoided, and whether it stopped at the correct
boundary. If an independent runner is unavailable, live behavior is NOT_RUN;
structural validation is not behavioral PASS.

Grow a Skill from observed recurring implementation behavior. Do not create a
Skill generator, fixed taxonomy, qualitative prose validator, or universal
authoring ritual.

## Relationships

The scoped [Skills contract](../../../.agents/skills/AGENTS.md) persists
bundle-wide authoring behavior. The [global AGENTS contract](../../../AGENTS.md)
persists repository-wide restraint and evidence rules. Specs state current
implementation contracts; project Governance and Plans control policy and
authorization; these human Harness documents explain how to maintain the
execution layer.

## Research basis

The authoring model is informed by current OpenAI Codex and Skill guidance,
current OpenAI plugin Skill examples, the Anthropic Agent Skills overview and
best practices, the Agent Skills specification, OpenAI Harness Engineering,
and scoped AGENTS or custom-instruction guidance. These source families inform
the design but do not become automatic repository invariants without current
evidence.
