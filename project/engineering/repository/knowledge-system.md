# Repository knowledge system

This document defines the current repository knowledge architecture for
maintainers and Coding Agents. It is a repository procedure, not a product or
runtime contract.

## Four information planes

| Plane              | Primary consumer                                                             | Canonical responsibility                                                                                            |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Human Knowledge    | Human designer, maintainer, or developer                                     | Product purpose, conceptual Architecture, and human/developer reference in docs/.                                   |
| Normative Contract | Implementer or reviewer                                                      | Exact current invariants, ownership, state, operations, lifecycle, failure, and cross-boundary contracts in specs/. |
| Project Control    | Project owner, supervisory Agent, or implementer resolving current Authority | Governance, adopted dependencies, Roadmap, Plans, Qualification, and engineering procedures in project/.            |
| Agent Execution    | Coding Agent during implementation                                           | On-demand procedural Skills in .agents/skills/.                                                                     |

Implementation code and tests remain executable reality for what is actually
implemented. They do not settle an unresolved standing semantic or ownership
choice.

## Typed Authority

Use the narrow owner for each question:

| Question                                                               | Canonical owner                       |
| ---------------------------------------------------------------------- | ------------------------------------- |
| What is the product trying to be?                                      | docs/product/                         |
| Why is the system conceptually shaped this way?                        | docs/architecture/                    |
| What must current implementation do exactly?                           | specs/                                |
| What engineering and evolution rules constrain the project?            | project/governance/                   |
| Which generic mechanic/provider is adopted?                            | project/dependencies/                 |
| What work is authorized now?                                           | project/plans/active/                 |
| What is the current development Horizon?                               | project/roadmap/                      |
| What was actually proven?                                              | project/qualification/                |
| How does a human or supervisor perform a repository procedure?         | project/engineering/                  |
| How does a Coding Agent execute a specialized implementation activity? | .agents/skills/                       |
| What does a package own locally?                                       | package README plus the relevant Spec |

Qualification is evidence, not semantic Authority. Plans authorize changes,
not permanent semantics. Architecture explains concepts and rationale, not
implementation authorization.

## README, INDEX, and AGENTS

README.md explains an area's purpose, scope, ownership, and starting points.
INDEX.md is a retrieval surface: its entries should explain when to read the
target, what it owns, and the important adjacent boundary. AGENTS.md contains
only persistent behavior that should automatically apply in that scope.

Do not create all three files mechanically in every directory. Add a scoped
AGENTS file only when the subtree has materially distinct persistent behavior.
Do not require an exact heading template or copy a full README into an INDEX.

The [global INDEX](../../../INDEX.md) routes cross-plane questions. The
[Human Knowledge INDEX](../../../docs/INDEX.md), [Spec INDEX](../../../specs/INDEX.md),
and [Project INDEX](../../INDEX.md) refine retrieval within their planes.

## Content / Authoring Separation

A governed artifact directly states the information, contract, procedure,
authorization, evidence, or navigation that it owns. Guidance about how that
artifact type should be authored belongs in the applicable scoped AGENTS file
or repository knowledge/authoring guidance.

The distinction is:

```text
README
→ explain the owned area

INDEX
→ route the reader

Spec
→ state the current normative contract

Skill
→ execute a specialized procedure

Plan
→ authorize bounded work

Qualification
→ report observed evidence

AGENTS
→ persist behavior for the scope
```

Rules such as keeping README prose out of an INDEX, keeping future concepts out
of a current Spec, or keeping a Skill from becoming a topic encyclopedia are
authoring guidance. They belong in scoped AGENTS or the repository
knowledge/Harness authoring guidance, not repeated as self-justifying prose in
every governed artifact.

## Current and historical knowledge

Current documents link to current canonical homes. Completed and superseded
Plans and historical Qualification records preserve chronology and may mention
old paths as historical text, but they do not become current Authority.

In PRE_PRODUCTION, an internal layout change is handled by moving the current
owner, updating current consumers and links, validating the new tree, and
deleting the obsolete route. Do not retain redirects, compatibility stubs,
aliases, migration tombstones, or fallback paths for development chronology.
The compatibility register is the only source for declared obligations.

## Classification and migration

Classify a changed fact before moving it:

| Class                     | Destination                                    |
| ------------------------- | ---------------------------------------------- |
| Human explanation         | docs/                                          |
| Normative contract        | specs/                                         |
| Governance                | project/governance/                            |
| Dependency decision       | project/dependencies/                          |
| Project sequence          | project/roadmap/                               |
| Work authorization        | project/plans/                                 |
| Qualification evidence    | project/qualification/                         |
| Human procedure           | project/engineering/                           |
| Agent persistent behavior | nearest justified AGENTS.md                    |
| Agent procedure           | .agents/skills/                                |
| Generated reference       | docs/reference/ unless a stronger owner exists |
| Historical record         | historical Plan or Qualification home          |
| Duplicate projection      | keep the useful projection and link its owner  |

Split a mixed document only when the split improves Authority or consumption.
Do not redesign product Architecture while performing a knowledge migration.

## Retrieval and projections

Retrieval should minimize context cost without hiding semantics. Root and plane
INDEX files answer where to look; package INDEX provides deliberate package
handoffs; generated API material remains identifiable as generated. A projection
may summarize and link, but it must not become a second normative owner.

Keep semantic density high by stating desired current behavior first, then
ownership, decision routes, admission conditions, invariants, and
success/stop conditions. High density means decision-relevant meaning per
sentence, not cryptic shorthand or a minimum token budget. Explicit
prohibitions are most useful when they counter observed repeated Agent failure,
a strong model default, or a costly Authority violation.

## Agent procedures

The [Harness design](../agent-harness/design.md) explains persistent context
and Skill capability boundaries. The [Skill authoring guide](../agent-harness/skill-authoring.md)
explains progressive disclosure, freedom level, and behavior evaluation.
Skills link to current Specs, Governance, Dependencies, or evidence instead of
duplicating those facts.

## Maintenance boundary

When a fact changes, update its canonical owner first, then update only the
necessary indexes, package projections, and other derived views. Run the
relevant knowledge, package, dependency, and repository checks. A green
acceptance condition closes the change; a new abstraction, validator, state,
test matrix, recovery layer, or meta-tool requires new current evidence and
the appropriate admission procedure.
