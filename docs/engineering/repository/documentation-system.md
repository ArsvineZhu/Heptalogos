# Repository Documentation System

This document defines the current knowledge architecture for maintainers and
Coding Agents. It is a repository procedure, not a product or runtime
contract.

## Typed Authority

Each maintained fact has one canonical document class:

| Class            | Canonical responsibility                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `product`        | Product purpose, experience boundaries, product shape, and differentiation                                        |
| `architecture`   | Conceptual system model, semantic ownership, Authority relationships, decomposition, rationale, and runtime views |
| `specs`          | Exact current normative contracts, invariants, states, operations, lifecycle, and failure semantics               |
| `governance`     | Project constitution and engineering/evolution policy                                                             |
| `dependencies`   | Generic-mechanics role/provider decisions and implementation routing                                              |
| `engineering`    | Repository procedures, toolchain, and maintainership practices                                                    |
| `qualification`  | Observed evidence and qualification truth                                                                         |
| `roadmap`        | Sequencing and Horizon truth                                                                                      |
| `plans`          | Authorized current changes and historical execution records                                                       |
| `reference`      | Lookup facts and derived/reference material                                                                       |
| package `README` | Implementation-local purpose, ownership, public surface, and relationships                                        |

There is no global priority rule between unrelated classes. If two current
standing documents answer the same normative question differently, the
documentation is inconsistent and the conflict must be resolved at the
canonical owner.

An active plan authorizes a change; it is not a second standing Authority. A
plan may explicitly authorize updating a standing owner, and that owner must be
updated as part of the same change.

## README, INDEX, and AGENTS

`README.md` explains an area: what it is, why it exists, what it owns, and how
it is organized. It may contain a few entry links but is not exhaustive
navigation.

`INDEX.md` is a retrieval surface. Each entry carries enough semantic context
for a reader who has not opened the target to decide whether it answers the
current question. Optimize for retrieval accuracy, disambiguation, and low
search cost. Explain what the target is, when to read it, what it owns, and the
important adjacent boundary where useful. Do not reproduce the target's full
normative or explanatory body, truncate descriptions, or use opaque tags as the
primary meaning.

`AGENTS.md` is the minimum complete persistent behavior required in a subtree.
It says what a Coding Agent must do in that scope. Quality is behavioral
completeness, not a line-count or scarcity target. It is not an architecture
summary, roadmap, knowledge encyclopedia, or duplicate Skill.

Create a file only when its semantic role is needed. Do not create README,
INDEX, and AGENTS mechanically in every directory.

## Architecture and Specs

Architecture is human conceptual design. It owns why the system is shaped as it
is, semantic concepts, major boundaries, Authority relationships, runtime views,
long-term conceptual relationships, and design rationale. Future design must be
labelled as future and does not authorize implementation.

Specs are dense implementation contracts for current behavior. A Spec is
admitted only when it governs implemented behavior, the current Horizon needs
the contract, or an exact durable/cross-boundary contract requires a normative
definition. Spec existence alone does not authorize work; an active plan still
does that.

Specs use concise technical English and BCP 14 normative vocabulary as defined
in [`docs/specs/README.md`](../../specs/README.md). Architecture may remain
primarily Chinese for human design work; stable technical identifiers remain
English. Broad translation work is out of scope unless governance explicitly
reopens it.

The Coding-Agent Harness is documented in
[`agent-harness-design.md`](./agent-harness-design.md). It defines open-ended
procedural Skill evolution, capability expectations, progressive disclosure,
and the boundary between persistent instructions and on-demand procedures.
Skill count, directory names, body shape, and supporting-resource presence are
not fixed repository invariants.

## Current Truth and History

Current source, tests, fixtures, scripts, tooling, configuration, workflows,
AGENTS, and standing documentation describe present truth. Development
provenance belongs in Git, completed/superseded plans, and historical
qualification records. Do not preserve a phase, PR, session, milestone, or
temporary migration identity in a current executable identity merely for
chronology.

Qualification records must distinguish current evidence from historical
evidence and preserve `PASS | FAIL | NOT_RUN | BLOCKED` exactly. A historical
record cannot become current evidence by being linked from a current page.

## Derived and Reference Material

Indexes, package navigation, caches, projections, generated API material, and
other derived views link to their canonical owner and do not replace it.
Reference material is lookup content, not an additional normative owner. When a
derived value can drift, the source and the refresh/check procedure must be
clear.

## Progressive Disclosure

Use this route for current knowledge:

```text
docs/INDEX.md
→ local INDEX.md when present
→ canonical Architecture, Spec, Governance, Dependency, Engineering,
  Qualification, Roadmap, Plan, or package README
```

Use a procedural Skill only when its metadata trigger matches the engineering
activity. Skills are procedures, not broad document routers or replacements for
canonical facts. A Skill is admitted by a recurring implementation-time need
that benefits from non-trivial specialized procedure; future Skills remain
open-ended and are not constrained by a central enumeration.

## Section Migration Classification

Before moving standing content, assign each section or fact exactly one primary
classification:

| Classification           | Destination                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `CURRENT_ARCHITECTURE`   | `docs/architecture/**`                                                                                      |
| `CURRENT_SPEC`           | `docs/specs/**`                                                                                             |
| `DEPENDENCY_DECISION`    | `docs/dependencies/**`                                                                                      |
| `QUALIFICATION_EVIDENCE` | `docs/qualification/**`                                                                                     |
| `ENGINEERING_PROCEDURE`  | applicable Skill or `docs/engineering/**`                                                                   |
| `FUTURE_DESIGN`          | Architecture and/or Roadmap; never a current implementation Spec solely because it is detailed              |
| `HISTORY_PROVENANCE`     | completed/superseded plan or historical qualification when meaningful; otherwise remove from standing truth |
| `DUPLICATE_DERIVED`      | delete the duplicate and link to the canonical owner                                                        |

Do not silently choose cleaner wording when two current sources materially
conflict. Record the fact, both sources, relevant implementation evidence, and
the semantic consequence, then stop with `PLAN_GAP` until Authority is resolved.

## Historical Links

Current documents link only to the current canonical location. Historical plans
may retain an old path as historical text. If a removed path would leave a
historical Markdown link broken and the old location is meaningful only as
history, convert the path to code/plain text where appropriate. Do not create a
redirect or compatibility stub for PRE_PRODUCTION development history.

## Present-tree Rule

The current tree must have a current owner, semantic or operational purpose,
current consumer or normative need, and identity describing its present role.
One-time phase artifacts, migration-only tombstones, and absence checks without
a current purpose are removed when their migration closes; they are not moved
to an archive directory or retained in current tooling merely to remember the
old layout.
