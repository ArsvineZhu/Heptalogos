# Coding-Agent Harness Design

This document is the current repository-level design for helping a Coding
Agent make sound implementation decisions. It describes capability boundaries
and maintenance rules; it does not authorize product work or replace an active
plan.

## Purpose

The Harness reduces predictable implementation mistakes while leaving ordinary
coding flexible. It supplies persistent context for rules that should influence
nearly every session and on-demand procedures for activities that need deeper
judgment. It is successful when the Agent acquires the right information,
applies the relevant reasoning procedure, makes a scope-safe decision, and
records evidence at the correct strength.

## Layers and context order

The normal implementation context is disclosed progressively:

```text
root AGENTS.md
→ approved active plan
→ target package README and local INDEX when applicable
→ relevant current Specs
→ applicable procedural Skill(s)
→ implementation and focused verification
```

Human conceptual Architecture is added when semantic context, cross-domain
understanding, or an authorized architecture change requires it. Qualification
records provide observed evidence; they do not become implementation Authority.

| Layer          | Owns                                                 | Does not own                                              |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `AGENTS.md`    | persistent behavior required in its scope            | complete procedures or architecture rationale             |
| active plan    | authorized change sequence and task decisions        | standing semantic Authority                               |
| README / INDEX | local explanation and retrieval                      | normative contract duplication                            |
| Architecture   | conceptual model, rationale, and boundaries          | implementation authorization                              |
| Specs          | current normative implementation contracts           | future design, provider catalog, or qualification results |
| Skills         | on-demand implementation procedure                   | plan authorship, review, release, or topic routing        |
| code/tests     | current implementation reality and executable checks | Authority for unresolved semantics                        |
| qualification  | observed claim-scoped evidence                       | proof beyond the executed boundary                        |

## Skill admission

A repository Skill is justified when all of the following apply:

1. The activity occurs during Coding-Agent implementation work.
2. The activity is repeatable or predictably recurring.
3. Correct execution requires non-trivial procedure, judgment, or project
   knowledge.
4. Progressive disclosure is better than keeping the full procedure in
   persistent instructions.
5. The procedure changes likely Agent behavior instead of merely routing to a
   document.

A package, subsystem, or architecture topic does not justify a Skill by itself.
There is no fixed Skill count, allow-list, or global body shape. A narrow Skill
may be self-contained. A complex Skill may use decision tables, worked cases,
references, or scripts when those materials improve the actual procedure.

The description is the discovery trigger. It names the concrete implementation
activity in plain technical English and avoids unexplained project shorthand.
The body must explain enough of the decision method that a fresh Agent can act
correctly after loading it.

## Capability expectations

A useful Skill covers the complete behavior chain:

```text
trigger
→ information acquisition
→ classification and decision procedure
→ implementation or deferral decision
→ stop/escalation behavior
→ claim-matched verification
```

A routing label without an actionable method is not a capability. A procedure
should state the semantic owner, current consumer or invariant, relevant
failure/threat model, evidence boundary, and the condition under which work
must stop or escalate.

## Persistent Agent-inertia risks

The following recurring defaults require durable countermeasures:

- treating future usefulness as current implementation authority;
- continuing after an acceptance condition is green because another edge case
  can be imagined;
- adding recovery for a recovery handler or fallback for a fallback;
- turning a failure-injection test into a new product state or branch;
- preserving internal historical schemas, aliases, names, or parsers “just in
  case” during PRE_PRODUCTION development;
- reimplementing generic mechanics instead of using the adopted provider route;
- bypassing an owning service because direct access simplifies a test;
- claiming live, cross-platform, restart, or source-less evidence from a weaker
  test boundary;
- filling an index with opaque labels that force an unfamiliar reader to open
  every candidate;
- compressing Agent-facing guidance until classifications no longer carry
  their meaning.

Persistent rules belong in root `AGENTS.md` only when they must affect ordinary
sessions. Detailed methods belong in the applicable Skill or canonical
engineering procedure.

## Capability coverage matrix

This matrix maps each known risk to the layer that prevents it. It is an open
capability map, not a fixed inventory; add a row when a repeated current failure
justifies a new procedure.

| Observed Agent tendency                                       | Persistent guard                        | On-demand procedure / external owner                                                                                                                               |
| ------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| incidental finding expands an approved task indefinitely      | root completion and current-value rules | [`scope-control`](../../../.agents/skills/scope-control/SKILL.md)                                                                                                  |
| a green fix triggers another hardening pass                   | root acceptance closure rule            | [`scope-control`](../../../.agents/skills/scope-control/SKILL.md)                                                                                                  |
| recovery-of-recovery or fallback chains grow without a model  | root bounded-failure rule               | [`recovery-design`](../../../.agents/skills/recovery-design/SKILL.md), [`lifecycle-change`](../../../.agents/skills/lifecycle-change/SKILL.md)                     |
| a future consumer causes premature Foundation work            | root current-consumer rule              | [`scope-control`](../../../.agents/skills/scope-control/SKILL.md)                                                                                                  |
| a failure-injection test creates architecture                 | root test/complexity rule               | [`test-design`](../../../.agents/skills/test-design/SKILL.md), [`scope-control`](../../../.agents/skills/scope-control/SKILL.md)                                   |
| convenience adds durable state without a new product fact     | root semantic-distinction rule          | [`durable-state-change`](../../../.agents/skills/durable-state-change/SKILL.md)                                                                                    |
| internal development history is preserved as compatibility    | root PRE_PRODUCTION rule                | [`preproduction-evolution`](../../../.agents/skills/preproduction-evolution/SKILL.md)                                                                              |
| generic mechanics are reimplemented locally                   | root Library-First rule                 | [`mechanics-routing`](../../../.agents/skills/mechanics-routing/SKILL.md)                                                                                          |
| an owning service is bypassed to make a test pass             | root singular-Authority rule            | [`semantic-boundary-change`](../../../.agents/skills/semantic-boundary-change/SKILL.md), [`mechanics-routing`](../../../.agents/skills/mechanics-routing/SKILL.md) |
| evidence is claimed above the executed boundary               | root evidence rule                      | [`claim-verification`](../../../.agents/skills/claim-verification/SKILL.md)                                                                                        |
| documentation drifts after a semantic change                  | root current-owner rule                 | [`documentation-maintenance`](../../../.agents/skills/documentation-maintenance/SKILL.md)                                                                          |
| Agent-facing guidance becomes unexplained shorthand           | root semantic-density rule              | [`documentation-maintenance`](../../../.agents/skills/documentation-maintenance/SKILL.md)                                                                          |
| review or stabilization becomes endless theoretical hardening | supervisory closure policy              | review and stabilization playbooks                                                                                                                                 |

## High-density Agent-facing writing

High density means high decision-relevant information per sentence, not low
token count. Agent-facing prose should:

- name explicit subjects, owners, and current consumers;
- state the action and the condition that admits or stops it;
- define unfamiliar classifications or link their canonical definition;
- use stable technical vocabulary rather than private abbreviations;
- use decision tables, transitions, and concrete examples when they compress
  meaning without hiding it;
- remain understandable to an Agent with repository access but no prior chat
  history.

Prefer:

> Classify a finding as a rare timing fault when it requires an uncommon
> interleaving absent from normal operation and outside the active plan's
> accepted failure model. Defer it unless current evidence, a current consumer,
> an invariant, or an explicit plan requirement admits it.

Avoid:

> `F3 → DEFER`.

Codes and requirement IDs are useful indexes. They do not replace the semantic
explanation that drives an implementation decision.

## Harness capability evaluation

Evaluation must test more than discoverability. For each scenario record:

1. the request and current task boundary;
2. the information the Agent should acquire;
3. the reasoning checkpoints it must apply;
4. the acceptable decision and evidence state;
5. the forbidden overreach or missed escalation;
6. the stop behavior after the decision.

The minimum evaluation set is maintained in
[`agent-harness-evaluation.md`](./agent-harness-evaluation.md). If no
independent Coding-Agent runner is available, live Agent behavior is `NOT_RUN`.
Structural inspection of Skills and repository checks do not upgrade that
state to behavioral `PASS`.

## Maintenance and evolution

One fact has one canonical owner. Update projections and indexes when the owner
or retrieval path changes, and remove obsolete current routes after a
PRE_PRODUCTION migration closes. Git and historical plans preserve chronology;
current tooling does not keep migration tombstones merely to remember deleted
internal objects.

Skill evolution is evidence-driven:

```text
observed recurring implementation friction
→ classify persistent rule versus procedural capability
→ update the narrowest canonical owner
→ add or deepen a Skill only when admission criteria hold
→ evaluate the complete behavior chain
→ run objective repository checks
```

Do not create automatic semantic graders, Skill generators, routing manifests,
or a fixed taxonomy without a concrete current need and an approved plan.
