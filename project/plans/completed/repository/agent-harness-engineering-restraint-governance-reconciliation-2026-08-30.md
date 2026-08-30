# Heptalogos Knowledge Planes, Agent Skills & Engineering Restraint Convergence

**Plan date:** 2026-08-30  
**Status:** COMPLETED
**Prior acceptance:** REQUEST_CHANGES — bounded correction appended below
**Plan class:** repository knowledge architecture / Coding-Agent Harness / governance convergence  
**Product Horizon:** unchanged  
**Runtime semantics:** frozen  
**Initial installation path:** `docs/plans/active/repository/agent-harness-engineering-restraint-governance-reconciliation-2026-08-30.md`  
**Final canonical path:** `project/plans/completed/repository/agent-harness-engineering-restraint-governance-reconciliation-2026-08-30.md`

---

# 0. Replacement State and Executor Contract

This document **replaces the previous contents of the same active plan**.

The previous version was intentionally stopped after its Phase A plan-transition/current-truth work. Do not create another supersession chain merely because the active plan contents were corrected before substantive implementation continued.

Treat the already-executed Phase A transition as existing local state:

- the prior Agent Harness correction plan has already been superseded;
- this plan identity is already the active repository work;
- the Roadmap/plan index may already point to this plan;
- no H3A-2 runtime work is reopened.

Verify those facts in the working tree before continuing. Repair only a concrete incomplete Phase A mutation. Do not replay the transition for ceremony.

The remote branch may not contain the uncommitted/local Phase A transition. The executing Agent must use the **current working tree** as execution truth.

This plan is decision-complete for the repository/Harness restructuring below.

It authorizes:

- repository information-architecture changes;
- movement and rewriting of current knowledge artifacts;
- current link/navigation correction;
- AGENTS restructuring;
- Skill restructuring and additions required by this plan;
- repository validation/tooling changes required by the new knowledge architecture;
- package README/index responsibility correction;
- governance/playbook reconciliation;
- current evidence/roadmap/path reconciliation caused by this migration.

It does **not** authorize:

- product-runtime behavior changes;
- new Foundation capability;
- new product feature;
- new durable product state;
- adopted provider replacement;
- dependency selection for an unresolved foundational role;
- H3/H4/H5/H6 product advancement;
- a new CI strategy;
- another general architecture redesign.

If this work exposes a material unresolved product semantic, ownership, provider, failure-model, or durable-state decision that this plan does not resolve, report:

```text
PLAN_GAP
```

with the smallest blocker and current evidence.

Ordinary GitHub Actions remain disabled and are not a closure requirement.

---

# 1. Why the Previous Plan Is Being Replaced

The previous plan correctly identified Agent overengineering, Library-First, fixed validators, migration tombstones, blanket TDD, recovery-of-recovery, package README/index problems, and governance contradictions.

However, subsequent research and review exposed a deeper information-architecture defect:

```text
docs/
```

currently acts as the physical home for nearly every repository knowledge class:

```text
human product/design knowledge
conceptual Architecture
normative implementation Specs
Governance
dependency/provider decisions
Roadmap
active/completed Plans
Qualification evidence
engineering Playbooks/Gotchas
Agent Harness design/evaluation
generated API reference
```

This physical layout obscures:

- primary consumer;
- Authority type;
- loading mode;
- change lifecycle;
- current-vs-history behavior;
- whether content is explanation, normative contract, Agent procedure, or project control state.

The current `docs/README.md` explicitly calls `docs/` the complete documentation system. That model is now rejected.

The repository needs distinct information planes rather than more subdirectories inside one umbrella.

The replacement plan therefore combines three previously separate corrections:

```text
knowledge-plane separation
+ Agent Skill architecture based on progressive disclosure and behavior eval
+ engineering-restraint / Library-First governance
```

The goal is not a prettier tree. The goal is lower context cost, clearer Authority, better retrieval, and more reliable Coding-Agent behavior.

---

# 2. Research-Derived Design Basis

These are design inputs, not permanent vendor-specific requirements.

## 2.1 Agent Skills

Current OpenAI and Anthropic Skill guidance converges on:

```text
metadata
→ main instructions
→ on-demand references/resources/scripts
```

Implications for Heptalogos:

- `name` and especially `description` form the discovery interface;
- description states **what the Skill does and when it should load**;
- `SKILL.md` is the workflow/decision control plane;
- detailed cases, API material, and branch-specific knowledge load on demand;
- scripts are for deterministic or fragile mechanics, not proof that a Skill is “mature”;
- progressive disclosure is an architecture principle;
- reference chains stay shallow;
- Skill usefulness is measured by real behavior, not by file count or prose length;
- a broad line/token guideline is an authoring heuristic, not a validator invariant.

## 2.2 Persistent Agent instructions

Repository-wide instructions should preserve high-value behavior that must influence most tasks.

Path-scoped instructions are appropriate when a subtree has materially different persistent authoring/execution behavior.

Implications:

- root `AGENTS.md` is persistent repository behavior;
- scoped `AGENTS.md` files add only local deltas;
- no fixed number of AGENTS files;
- no absolute nested-AGENTS ban;
- no repeated root rules in child files.

## 2.3 Agent prompting behavior

Current model guidance favors:

```text
clear outcome
+ success criteria
+ autonomy boundary
+ stopping rule
```

over carrying every old process instruction forward.

Implications:

- state each standing rule once;
- use exact process steps only where the process is genuinely fragile;
- do not convert heuristics into universal rituals;
- completion/STOP conditions remain first-class;
- important anti-inertia constraints stay explicit when they counter observed model defaults.

## 2.4 Human documentation

Documentation should be organized around the reader's need.

For this repository the most important distinction is not merely tutorial/how-to/reference/explanation. It is also:

```text
human understanding
versus
normative implementation contract
versus
project control/evidence
versus
Agent execution procedure
```

Those categories have different consumers and loading behavior and therefore receive different physical homes.

---

# 3. Locked Target Repository Information Architecture

The target is a **four-plane knowledge system plus implementation code**.

```text
/
├── README.md
├── INDEX.md
├── AGENTS.md
│
├── docs/                      # Human Knowledge Plane
│   ├── README.md
│   ├── INDEX.md
│   ├── AGENTS.md
│   ├── product/
│   ├── architecture/
│   └── reference/
│
├── specs/                     # Normative Contract Plane
│   ├── README.md
│   ├── INDEX.md
│   ├── AGENTS.md
│   ├── core/
│   ├── runtime/
│   ├── execution/
│   └── data/
│
├── project/                   # Project Control Plane
│   ├── README.md
│   ├── INDEX.md
│   ├── AGENTS.md
│   ├── governance/
│   ├── dependencies/
│   ├── roadmap/
│   ├── plans/
│   ├── qualification/
│   └── engineering/
│       ├── README.md
│       ├── INDEX.md
│       ├── playbooks/
│       ├── gotchas/
│       ├── repository/
│       └── agent-harness/
│
├── .agents/                   # Agent Execution Plane
│   └── skills/
│       ├── AGENTS.md
│       └── <open-ended Skills>
│
├── packages/                  # Product/Foundation implementation
│   ├── README.md
│   ├── INDEX.md
│   ├── AGENTS.md
│   └── ...
│
├── scripts/
├── tests/
├── tools/
└── .github/
```

Do not create empty directories solely to mirror the diagram.

Only create listed subdirectories that have current content or an explicitly required artifact.

The root-level plane names are current architecture, not a permanent closed enumeration. Repository tooling must not reject a future responsibility root merely because it was not known today.

---

# 4. Plane Responsibilities

## 4.1 Root

### `README.md`

Human repository entry.

It explains:

- what Heptalogos is;
- research/prototype status;
- repository purpose;
- the four information planes;
- where a human should start.

The repository currently lacks this root human entry. Create it.

### `INDEX.md`

Global retrieval surface.

It answers:

> Where should I look for this question?

It spans:

- human design;
- normative contract;
- project control/evidence;
- Agent procedures;
- packages/code;
- repository tooling.

Entries contain enough semantic context for an unfamiliar reader to choose a target.

It does not reproduce the target content.

### `AGENTS.md`

Always-loaded repository Coding-Agent behavior.

It is not the root INDEX and not a project encyclopedia.

---

## 4.2 `docs/` — Human Knowledge Plane

Primary consumer:

```text
human designer
human maintainer
human developer trying to understand the system
```

Agent access remains allowed and useful, but Agent automatic/procedural material does not live here merely because it is Markdown.

`docs/` owns:

```text
product purpose and shape
human conceptual Architecture
research framing where current
human-readable explanations
human/developer reference
generated API reference
```

Human Architecture may remain Chinese.

Technical identifiers stay stable English.

`docs/` does not own:

```text
current normative implementation contracts
project governance
active work authorization
qualification status
dependency-provider Authority
Coding-Agent workflow Skills
Harness runtime instructions
```

---

## 4.3 `specs/` — Normative Contract Plane

Primary consumer:

```text
Coding Agent implementing current behavior
developer implementing/reviewing current contracts
```

Specs remain human-readable, but their purpose is exact current implementation semantics rather than narrative explanation.

Specs own:

```text
current invariants
semantic ownership contracts
state models
operations
lifecycle semantics
failure semantics
cross-boundary requirements
stable requirement IDs when useful
```

Specs do not own:

```text
future conceptual design
rationale/history
provider selection
executed evidence
plan sequencing
Agent procedure
```

Specs use semantically dense, self-contained technical English.

Requirement IDs are anchors/search keys; they never substitute for the full semantic sentence.

---

## 4.4 `project/` — Project Control Plane

Primary consumers:

```text
human project/architecture owner
supervisory/review Agent
Coding Agent resolving current Authority/evidence
```

This plane owns the state of the engineering project rather than product explanation.

### `project/governance/`

Engineering constitution, evolution policy, compatibility policy, standing project rules.

### `project/dependencies/`

Generic mechanics role/provider decisions and dependency routing/qualification decision inputs.

### `project/roadmap/`

Horizon, sequencing, milestone eligibility/current progression.

### `project/plans/`

Current approved implementation authorization and historical execution plans.

Plans are read by Coding Agents but are not Agent-owned Skills.

### `project/qualification/`

Observed claim-scoped evidence and current qualification projections.

### `project/engineering/`

Human/supervisory engineering procedures and repository-maintainer knowledge:

```text
playbooks
gotchas
repository knowledge-system design
Agent Harness design/evaluation/authoring guidance
```

Project Control is not `docs/` merely because its files are Markdown.

---

## 4.5 `.agents/` — Agent Execution Plane

Primary consumer:

```text
Coding Agent at execution time
```

This plane contains procedural capabilities loaded on demand.

For this plan:

```text
.agents/skills/**
```

is the only required Agent capability root.

Do not move human Harness rationale/evaluation documents into `.agents/`.

`.agents/` is not a second project knowledge base.

---

# 5. Typed Authority After the Migration

Use this map everywhere current standing documents need to explain Authority.

| Question                                                                 | Canonical owner                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| What is the product trying to be?                                        | `docs/product/**`                                        |
| Why is the system conceptually shaped this way?                          | `docs/architecture/**`                                   |
| What must the current implementation do exactly?                         | `specs/**`                                               |
| What engineering/evolution rules constrain the project?                  | `project/governance/**`                                  |
| Which mature provider/mechanic is adopted for a generic role?            | `project/dependencies/**`                                |
| What work is authorized now?                                             | current file under `project/plans/active/**`             |
| What is the current product-development Horizon?                         | `project/roadmap/**`                                     |
| What was actually proven/run?                                            | `project/qualification/**`                               |
| How does a human/supervisor perform a repository procedure?              | `project/engineering/playbooks/**`                       |
| How should a Coding Agent execute a specialized implementation activity? | `.agents/skills/**`                                      |
| What does a package own locally?                                         | package README + relevant Spec                           |
| What does the current source actually implement?                         | code/tests, subordinate to unresolved standing semantics |

Do not use a generic:

```text
Architecture Corpus > everything
```

priority model.

The term `Architecture Corpus` may remain in historical plans or as a human shorthand for the conceptual architecture collection, but current standing Authority must use typed owners.

Qualification is evidence, not standing semantic Authority.

Plans authorize changes; they do not become permanent semantic owners.

---

# 6. Migration Classification

Before moving mixed material, classify each section/fact.

Use:

```text
HUMAN_EXPLANATION
NORMATIVE_CONTRACT
PROJECT_GOVERNANCE
DEPENDENCY_DECISION
PROJECT_SEQUENCE
WORK_AUTHORIZATION
QUALIFICATION_EVIDENCE
HUMAN_PROCEDURE
AGENT_PERSISTENT
AGENT_PROCEDURE
GENERATED_REFERENCE
HISTORICAL_RECORD
DUPLICATE_PROJECTION
```

Map:

```text
HUMAN_EXPLANATION
→ docs/

NORMATIVE_CONTRACT
→ specs/

PROJECT_GOVERNANCE
→ project/governance/

DEPENDENCY_DECISION
→ project/dependencies/

PROJECT_SEQUENCE
→ project/roadmap/

WORK_AUTHORIZATION
→ project/plans/

QUALIFICATION_EVIDENCE
→ project/qualification/

HUMAN_PROCEDURE
→ project/engineering/

AGENT_PERSISTENT
→ nearest justified AGENTS.md

AGENT_PROCEDURE
→ .agents/skills/

GENERATED_REFERENCE
→ docs/reference/ unless a stronger current owner exists

HISTORICAL_RECORD
→ historical plan/evidence home

DUPLICATE_PROJECTION
→ keep only the useful projection; link the canonical owner
```

If a file contains multiple classes, split it only when the split improves Authority/consumption.

Do not split documents merely because classification exists.

---

# 7. Required Physical Migration Map

The following directory moves are design decisions, not optional suggestions.

## 7.1 Stay under `docs/`

```text
docs/product/**
docs/architecture/**
docs/reference/**
```

Rewrite links/READMEs as needed for the narrower Human Knowledge role.

## 7.2 Move to top-level `specs/`

```text
docs/specs/**
→
specs/**
```

No compatibility stub remains at `docs/specs/`.

Update all current links.

Historical prose may mention the old path only as historical text, not a live Markdown route.

## 7.3 Move to `project/`

```text
docs/governance/**
→ project/governance/**

docs/dependencies/**
→ project/dependencies/**

docs/roadmap/**
→ project/roadmap/**

docs/plans/**
→ project/plans/**

docs/qualification/**
→ project/qualification/**

docs/engineering/**
→ project/engineering/**
```

The engineering move is followed by the section-level audit in §8.

## 7.4 Root documentation files

Rewrite:

```text
docs/README.md
docs/INDEX.md
docs/AGENTS.md
```

for the Human Knowledge Plane.

Create:

```text
README.md
INDEX.md
```

at repository root.

Root `AGENTS.md` remains the repository Coding-Agent persistent entry.

---

# 8. Engineering Knowledge Reclassification

The current `docs/engineering/**` mixes:

```text
human/supervisory playbooks
gotchas
repository topology
documentation-system design
Agent Harness design/evaluation
stage-specific engineering artifacts
```

After moving it to `project/engineering/**`, normalize it.

Target:

```text
project/engineering/
├── README.md
├── INDEX.md
├── playbooks/
│   └── INDEX.md
├── gotchas/
│   └── INDEX.md
├── repository/
│   └── knowledge-system.md
└── agent-harness/
    ├── README.md
    ├── design.md
    ├── skill-authoring.md
    └── evaluation.md
```

Only create `playbooks/INDEX.md` or `gotchas/INDEX.md` if current contents justify them; migrate the existing `PLAYBOOK.md` / `GOTCHAS.md` hub semantics rather than retaining duplicate hubs.

## 8.1 `knowledge-system.md`

Replace the current concept of:

```text
documentation-system.md
```

with:

```text
project/engineering/repository/knowledge-system.md
```

because the repository knowledge system now spans `docs/`, `specs/`, `project/`, AGENTS, Skills, and package projections.

It owns:

- information planes;
- document class responsibilities;
- README / INDEX / AGENTS semantics;
- typed Authority;
- current vs historical knowledge;
- projections;
- semantic-density guidance;
- positive-first authoring;
- navigation/retrieval design;
- knowledge migration rules.

## 8.2 Agent Harness human-maintainer material

Move/restructure:

```text
docs/engineering/repository/agent-harness-design.md
→ project/engineering/agent-harness/design.md

docs/engineering/repository/agent-harness-evaluation.md
→ project/engineering/agent-harness/evaluation.md
```

Create:

```text
project/engineering/agent-harness/skill-authoring.md
```

from the research-backed authoring guidance in §13.

These are **human/maintainer engineering documents**.

They explain and evaluate the Harness; they are not automatically loaded Agent procedures.

## 8.3 Current `docs/engineering/specs/**`

Review every file in this directory.

The current H1 stabilization-specific document must not remain in a generic current normative “specs” bucket merely because the directory is named `specs`.

Classify its content:

- stage-specific execution/history → completed/superseded Plan or historical engineering record;
- standing engineering rule → Governance or current Playbook;
- current implementation contract → top-level `specs/`;
- duplicate → remove after preserving the canonical fact.

After classification, remove the ambiguous `project/engineering/specs/` directory if no current coherent responsibility remains.

---

# 9. Root and Local Retrieval Surfaces

## 9.1 Root `INDEX.md`

Root `INDEX.md` becomes the global repository retrieval map.

It should let an unfamiliar human or Agent answer questions such as:

```text
Where do I understand Subject/product intent?
Where do I understand Host ownership conceptually?
Where is the exact Host ownership implementation contract?
Where is the adopted provider for locking/retry/state machines?
Which Plan is authorized now?
Where is real PostgreSQL restart evidence?
Which Skill should guide a recovery change?
Which package owns WorkItem state?
Where are repository closure procedures?
```

Use descriptions such as:

```text
Area
Use when / questions answered
Primary entry
Adjacent boundary
```

Do not force one table shape if another layout retrieves better.

## 9.2 `docs/INDEX.md`

Human knowledge only.

It routes:

```text
product
architecture
reference
```

It is no longer the global repository map.

## 9.3 `specs/INDEX.md`

Current normative contract retrieval.

Retain useful contract prefixes, but prefixes remain secondary.

Each entry explains:

- read when;
- contract owned;
- primary implementation owner(s);
- adjacent contract/boundary;
- prefix.

## 9.4 `project/INDEX.md`

Project-control retrieval.

It must distinguish:

```text
Governance
Dependencies
Roadmap
Plans
Qualification
Engineering
```

and explain when each should be consulted.

## 9.5 Package INDEX

Handled by §18.

## 9.6 No Skill index required for discovery

Do not create `.agents/skills/INDEX.md` as a routing mechanism.

Skill discovery comes from Skill metadata.

Human maintainers understand the current capability set through:

```text
project/engineering/agent-harness/design.md
```

and evaluation coverage.

---

# 10. AGENTS Hierarchy

Use persistent instructions only for behavior that must automatically influence work in that scope.

No validator may enforce a fixed AGENTS count.

## 10.1 Root `/AGENTS.md`

Keep and strengthen the minimum complete repository-wide behavior.

It must contain, once:

### Work authorization

- execute the explicitly approved active plan;
- unresolved material semantic/ownership/provider decision is `PLAN_GAP`;
- plans authorize work but do not silently become standing semantics.

### Current-value engineering restraint

Use a self-contained rule equivalent to:

> Satisfy the approved current requirement with the smallest semantically correct permanent maintenance surface. Future reuse, theoretical completeness, symmetry, or adjacent possibility does not independently authorize new abstraction, state, branch, recovery, configuration, validator, test matrix, dependency role, or meta-tool.

### Completion / reopen

> Acceptance criteria plus required executable/evidence proof close the current change. New work requires new admissible current evidence.

### Executable Truth

Component elegance does not substitute for the current executable/product spine.

### PRE_PRODUCTION

- undeclared development history creates no compatibility obligation;
- current source/tests/current identifiers express current semantics;
- obsolete internal paths are rewritten/removed;
- no development-phase provenance in current executable identity.

### Semantic ownership

Canonical mutation stays behind the owning project boundary.

### Mandatory Library / Dependency First reflex

Before non-trivial generic mechanics:

```text
current semantic owner
→ existing project primitive/adapter
→ ADOPTED provider route
→ Standard / language / Node / OS facility
→ mature library/framework
→ composition / narrow adapter
→ custom generic mechanics only with concrete insufficiency evidence
```

A local custom generic mechanic without this preflight is an architecture deviation.

Trivial language operations and Heptalogos-specific semantics remain local code; dependency-first is not package-count maximalism.

### Complexity admission

Persist high-value upstream rules:

- new durable/product state requires a current semantic distinction;
- robustness requires a current failure model;
- security requires a current threat model;
- tests do not independently create architecture;
- recovery does not authorize recovery-of-recovery;
- fail-stop/fencing is a valid bounded outcome;
- a completed fix does not authorize another hardening pass.

### Evidence truth

`PASS | FAIL | NOT_RUN | BLOCKED`; claims match executed proof boundary.

### Skills

Load applicable procedural Skills when their descriptions match the specialized implementation activity.

Do not enumerate Skills.

### Current execution policy

Ordinary GitHub Actions disabled.

Do not duplicate detailed Skill procedures here.

---

## 10.2 `docs/AGENTS.md`

Scoped persistent behavior for human documentation authoring.

It adds only:

- human-oriented explanation/retrieval responsibilities;
- current fact ownership and links;
- Architecture is conceptual/rationale, not normative contract;
- human content may use Chinese;
- diagrams/narrative/trade-offs are appropriate when they improve understanding;
- do not turn human docs into compressed Agent shorthand;
- generated reference stays identifiable as generated;
- use root/global INDEX when cross-plane links are needed.

Do not repeat global PRE_PRODUCTION, Library-First, evidence states, or scope rules.

No absolute ban on nested AGENTS.

A future nested AGENTS file is admitted only by distinct persistent subtree behavior.

---

## 10.3 `specs/AGENTS.md`

Persistent Spec-authoring behavior.

It must state:

- Specs are exact **current** implementation contracts;
- future conceptual design remains Human Architecture/Roadmap;
- Specs do not authorize implementation;
- semantically dense technical English must remain understandable without conversation history;
- BCP 14 keywords carry normative meaning only when uppercase;
- IDs are traceability anchors, not semantic abbreviations;
- one current fact has one canonical owner;
- provider decisions/evidence/rationale/history remain in their own planes;
- use only headings the contract needs;
- PRE_PRODUCTION requirement removal leaves no tombstone Spec/alias absent a declared compatibility obligation.

---

## 10.4 `project/AGENTS.md`

Persistent authoring behavior for project-control artifacts.

It adds:

- typed control-plane ownership;
- current vs historical state separation;
- active Plan is work authorization;
- Roadmap is sequencing;
- Qualification reports observed evidence;
- Governance owns standing policy;
- Dependencies own provider/mechanics decisions;
- Engineering Playbooks are human/supervisory procedures;
- historical records preserve chronology without becoming current Authority.

Do not restate root engineering rules.

---

## 10.5 `packages/AGENTS.md`

Keep only package-workspace deltas:

- read target package README;
- use package INDEX for cross-package discovery;
- respect package semantic owner and dependency direction;
- current exact invariants come from relevant Specs;
- update public/local explanation where implementation changes it;
- run focused package verification.

Remove any absolute nested-AGENTS prohibition.

A package-local AGENTS file is admitted only when recurring package-specific implementation behavior materially differs from the workspace scope.

Do not create package-local AGENTS in this plan unless real evidence independently justifies one.

---

## 10.6 `.agents/skills/AGENTS.md`

Create this scoped authoring context.

It persists:

- Skills are Coding-Agent implementation-time procedural capabilities;
- Skill inventory is open-ended;
- one Skill = one coherent job, not one topic and not one tiny step;
- description is the discovery interface and states what + when in plain technical English;
- `SKILL.md` is the workflow/decision control plane;
- capability matters more than brevity;
- use progressive disclosure;
- references/scripts exist only when they directly support the capability;
- important references are directly reachable from `SKILL.md`;
- high density means decision-relevant self-contained meaning, not shorthand;
- structure/freedom match task fragility;
- scripts are for deterministic mechanics;
- Skill bundles do not contain historical narrative, changelogs, or redundant README material;
- planning, roadmap, independent review, candidate lifecycle, and release orchestration remain outside Coding-Agent Skills;
- Skill growth is driven by observed recurring implementation behavior and evaluation.

Do not put a current Skill name list here.

---

# 11. Positive-First and Semantic-Density Authoring

Persist this principle in:

```text
project/engineering/repository/knowledge-system.md
project/engineering/agent-harness/skill-authoring.md
```

Use:

> State desired current behavior first. Prefer ownership, decision routes, admission conditions, invariants, and success/stop conditions over inventories of rejected alternatives.

Explicit prohibitions are appropriate when they counter:

```text
observed repeated Agent failure
strong model default
high-cost Authority/safety violation
```

Once an obsolete alternative no longer affects a current decision, its identity belongs in history.

High density means:

```text
high decision-relevant information per sentence
```

not:

```text
minimum token count
```

A fresh Agent with repository access but no chat history must be able to understand critical rules.

---

# 12. Skill Architecture — General Rules

## 12.1 Discovery contract

Every Skill description must answer:

```text
What coherent engineering capability does this provide?
When should it load?
```

Put important trigger vocabulary early.

Avoid descriptions whose meaning depends on:

```text
F2/F3
internal stage acronyms
private shorthand
knowledge of the current Skill taxonomy
```

unless the description also states the real activity.

## 12.2 Coherent job boundary

A Skill may contain several steps when they form one repeated decision/workflow capability.

Do not split one capability into micro-Skills merely for symmetry.

Do not create a mega-Skill covering unrelated engineering disciplines.

## 12.3 `SKILL.md` responsibility

The main file contains:

- entry condition;
- information to inspect;
- decision/classification model;
- critical workflow;
- branch conditions;
- links to optional detailed resources;
- output/action;
- stop/escalation;
- verification boundary.

It is not an encyclopedia.

## 12.4 Progressive disclosure

Preferred:

```text
SKILL.md
→ directly linked reference/script/resource
```

Avoid deep reference chains.

If a reference is long enough that partial reading is likely, add a useful table of contents.

## 12.5 Authoring size guidance

Treat broad recommendations such as “keep SKILL.md around/below several hundred lines” as review signals.

Do **not** implement:

```text
line_count > N → FAIL
word_count > N → FAIL
reference_count > N → FAIL
```

If a Skill becomes large, review:

- multiple jobs accidentally merged;
- reference material embedded in control plane;
- repeated canonical facts;
- missing progressive disclosure.

If the coherent job genuinely requires the material, size alone is not a defect.

## 12.6 Scripts

Instruction-first.

Add a Skill-local script only when deterministic execution materially improves correctness/efficiency.

A script should solve the mechanical problem and return useful errors.

Do not create:

- a script merely to make the Skill look engineered;
- a generic Skill framework;
- a registry/DSL for one current Skill;
- a validator for qualitative prose.

## 12.7 References

Skill-local references own procedural support knowledge:

```text
casebooks
branch-specific detailed methods
worked examples
conditional technical notes
```

They do not duplicate current Specs/Governance/Dependencies.

Link canonical project facts from their actual owner.

## 12.8 Freedom level

Use the freedom level the job requires:

```text
contextual judgment
→ principles / decision criteria / examples

preferred pattern with variation
→ decision tree / checkpoints / templates

fragile deterministic operation
→ exact steps / script / validation
```

Do not write every Skill as a low-freedom ritual.

---

# 13. Human Skill-Authoring Guide

Create:

```text
project/engineering/agent-harness/skill-authoring.md
```

This is the human/maintainer guide derived from current Skill research.

It must cover:

1. Skill purpose and coherent-job boundary.
2. Discovery metadata and description quality.
3. Progressive disclosure.
4. `SKILL.md` as workflow control plane.
5. References vs scripts vs canonical external knowledge.
6. Freedom level vs task fragility.
7. semantic density vs shorthand.
8. positive-first writing.
9. examples and boundary-pair cases.
10. behavior evaluation:
    - should-trigger;
    - should-not-trigger;
    - application/pressure behavior.
11. eval-driven evolution rather than imagined-rule accumulation.
12. observe which references Agents actually read/miss/re-read.
13. broad size/reference-count guidance as heuristics only.
14. removal of unused Skill material.
15. relationship between `.agents/skills/AGENTS.md`, Skill body, Specs, Governance, and human Harness docs.

Include a short “Research basis” section naming the current source families:

- OpenAI Codex/Skill guidance and current OpenAI plugin Skill examples;
- Anthropic Agent Skills overview and best practices;
- Agent Skills specification;
- OpenAI Harness Engineering;
- scoped AGENTS/custom-instruction guidance.

Do not copy large external passages.

Do not convert vendor-specific recommendations into automatic repository invariants without current evidence.

---

# 14. Add `authoring-skills` Skill

Create:

```text
.agents/skills/authoring-skills/SKILL.md
```

This is justified because creating/restructuring/evaluating Skills is a recurring specialized implementation-time Harness activity.

Trigger on:

```text
create a Skill
rewrite/restructure a Skill
change Skill discovery description
split/merge Skill responsibilities
add references/scripts
evaluate why a Skill is not triggering
evaluate why a Skill is not changing Agent behavior
```

The Skill must operationalize, not duplicate, the human authoring guide.

Core workflow:

```text
state the coherent job
→ collect real trigger/task examples
→ write/test description
→ inspect baseline failure/gap when evidence exists
→ choose freedom level
→ design SKILL.md control plane
→ move conditional detail to direct references
→ add deterministic script only if justified
→ create representative should-trigger/non-trigger/behavior scenarios
→ inspect actual Agent use when runner exists
→ remove content that does not improve behavior
```

When deeper rationale is needed, link:

```text
project/engineering/agent-harness/skill-authoring.md
```

Do not create a Skill generator.

Do not require TDD for Skill files.

Behavior/eval-driven authoring is not product-code TDD.

---

# 15. Existing Skill Audit and Required Capability Set

Current Skills are inputs to review, not immutable names.

Do not rename a Skill merely to satisfy a stylistic naming convention.

Rename only when the current name materially misrepresents the coherent job.

## 15.1 Preserve and deepen where needed

### `scope-control`

Keep as:

> Is this finding/work admitted into the current task?

Required correction:

```text
inside authorized task and semantics resolved
→ IMPLEMENT

outside task, non-blocking, and current truth remains safe
→ RECORD/DEFER

current task cannot complete without a material unresolved semantic/ownership/provider/state/failure decision
→ PLAN_GAP
```

A different owner alone is not a Plan Gap.

Retain finding-admission reference and casebook.

### `recovery-design`

Keep the first-order vs recovery-of-recovery model.

Do not rewrite merely because the new plan exists.

Ensure it links to complexity admission when another recovery layer would create permanent complexity.

### `lifecycle-change`

Keep lifecycle ownership/admission/in-flight/resource lifetime/fencing logic.

Route actual recovery design to `recovery-design`.

Do not turn lifecycle completeness into exhaustive teardown-state modeling.

### `durable-state-change`

Keep semantic-distinction/current-consumer/canonical-owner/restart-significance gates.

Use `complexity-admission` for broader permanent-surface judgment.

### `semantic-boundary-change`

Keep it limited to plan-authorized boundary changes.

It does not choose new semantic owners.

### `mechanics-routing`

Deepen Library-First per §17.

### `preproduction-evolution`

Keep compatibility/current-tree cleanup capability.

Update document-path examples to the new planes.

Do not preserve old paths/names as Skill tombstones.

### `test-design`

Deepen test strategy per §19.

### `claim-verification`

Keep evidence ladder/claim boundary.

Update paths to `project/qualification/**`.

## 15.2 Rename `documentation-maintenance`

The job now spans:

```text
docs/
specs/
project/
AGENTS
Skills
package projections
indexes
```

The old name becomes misleading.

Rename:

```text
documentation-maintenance
→ knowledge-maintenance
```

No alias Skill.

No validator tombstone.

Update all current references.

`knowledge-maintenance` owns:

```text
classify changed fact
→ choose canonical plane/owner
→ update canonical source
→ update necessary projections/indexes
→ preserve current/history separation
→ run relevant knowledge checks
```

It does not author product semantics.

## 15.3 Add required new Skills

Create:

```text
complexity-admission
repository-check-design
authoring-skills
```

These are justified by observed repeated Agent behavior and current repository work.

No other new Skill is required by this plan.

Additional Skills may be added during execution only if a concrete recurring implementation-time job already satisfies the Skill-admission criteria and the current plan work genuinely requires it.

Do not create speculative future Skills.

---

# 16. `complexity-admission` Skill

Responsibility:

> For work that is already admitted into the current task, what permanent maintenance surface is actually justified?

This is distinct from `scope-control`.

Trigger when a proposed implementation introduces material new:

```text
abstraction/interface/factory/registry
state/config/version/migration
background worker/cache/queue/concurrency mechanism
retry/recovery/fallback
security/robustness mechanism
custom generic mechanic
repository validator/gate
persistent test matrix/harness
generator/meta-tool/DSL
extensibility/plugin point
```

Decision record:

```text
Current requirement:
Current consumer/invariant:
Acceptance condition:
Semantic owner:
Existing direct behavior:
Existing project primitive:
Adopted mechanics/provider route:
Simplest semantics-correct option:
Permanent maintenance surface proposed:
Current variability/second consumer:
Failure/threat/load model where applicable:
Operational/test/docs burden:
Why simpler route is insufficient:
Decision:
```

Decisions:

```text
REUSE_EXISTING
DIRECT_LOCAL
ADD_MINIMUM_COMPLEXITY
DEFER
PLAN_GAP
```

Key rules:

### Abstraction

One consumer plus hypothetical future reuse does not justify a framework.

A real current variation, repeated current use, or stable isolation boundary may justify a narrow abstraction.

### Configuration

An implementation constant does not become configurable because configurability is possible.

Current intended variability is required.

### State

Route persistent state through `durable-state-change`.

### Defensive machinery

A failure/threat/load model is required.

### Generic mechanics

Route through `mechanics-routing`.

### Validators

Route through `repository-check-design`.

### Meta-tooling

A one-time migration or one current check does not justify a generic registry/DSL/plugin system.

Deletion of unnecessary complexity is a valid result.

Create a generalized casebook with boundary pairs.

---

# 17. Mandatory Library / Dependency First

This is a repository-wide engineering posture and a detailed Skill procedure.

## 17.1 Root persistent preflight

Before non-trivial generic mechanics:

```text
semantic owner
→ current repository primitive/adapter
→ current adopted provider role
→ Standard / language / Node / OS
→ mature library/framework
→ mature primitive composition / narrow adapter
→ custom mechanic only after concrete insufficiency
```

## 17.2 `mechanics-routing`

Add or deepen a direct reference such as:

```text
references/custom-mechanics-admission.md
```

It must require:

```text
Mechanic:
Current consumer/semantic owner:
Existing repository primitive inspected:
Dependency role/status:
ADOPTED provider capability inspected:
Standard/Node/OS option:
Relevant mature library option:
Narrow adapter/composition feasibility:
Concrete insufficiency:
Custom maintenance surface:
Lifecycle/concurrency/security/cross-platform burden:
Current authorization:
```

Decision:

```text
existing project route sufficient
→ reuse

ADOPTED provider sufficient
→ use behind current/narrow adapter

standard facility sufficient
→ use it

mature library is needed and current dependency role permits it
→ use/qualify through existing dependency governance

foundational provider role unresolved
→ PLAN_GAP unless provider selection is explicitly authorized

custom generic mechanic
→ only with evidence that prior routes are insufficient
```

Do not give the Agent a menu of equivalent libraries when the project already has an adopted route.

Library-First narrows action space.

## 17.3 Custom code nuance

Library-First does not mean:

```text
install a package for every five-line transform
```

Heptalogos-specific semantics and trivial language/standard mechanics remain local.

The rule targets non-trivial reusable generic mechanics for which mature ownership already exists outside the project.

---

# 18. `repository-check-design` Skill and Validator Doctrine

Create:

```text
.agents/skills/repository-check-design/
```

Trigger on repository validators, `check:*` gates, topology checks, closed-set validation, generated consistency checks, migration checks, hygiene checks.

Classify a proposed check:

```text
STANDING_INVARIANT
SEMANTIC_CLOSED_SET
DISCOVERABLE_CURRENT_SET
DERIVED_PROJECTION
MIGRATION_ASSERTION
HEURISTIC_HYGIENE
```

## 18.1 Standing invariant

Example:

```text
every current Skill directory has a valid SKILL.md
```

Permanent enforcement appropriate.

## 18.2 Semantic closed set

Example:

```text
verification state ∈ {PASS, FAIL, NOT_RUN, BLOCKED}
```

Exact validation is legitimate because closure is semantic.

## 18.3 Discoverable current set

Examples:

```text
current Skills
current workspace packages
current Specs
current top-level responsibility roots
```

Members evolve.

Discover dynamically; do not encode a snapshot member list.

## 18.4 Derived projection

Validate source/projection consistency at the narrow level actually required.

Do not require human navigation prose to equal generated prose.

## 18.5 Migration assertion

A one-time migration check leaves permanent tooling when the migration closes unless it independently expresses a current standing invariant.

Deleted historical identities do not become tombstones.

## 18.6 Heuristic hygiene

Use generic semantic/provenance patterns where necessary.

Avoid exact historical filenames/old Skill names as permanent rules.

---

# 19. Test Strategy — Remove Blanket TDD

TDD is not a repository-wide execution law.

Update `test-design` and all current playbooks/governance accordingly.

Use a strategy matched to the claim:

| Situation                              | Preferred starting strategy                                     |
| -------------------------------------- | --------------------------------------------------------------- |
| Known deterministic pure contract      | unit/property test; red-green may be useful                     |
| Reproduced regression                  | failing regression first when it faithfully captures the defect |
| Refactor of unclear current behavior   | current coverage + characterization                             |
| Unknown library/provider behavior      | upstream evidence, then narrow micro-probe/spike if needed      |
| Cross-owner composition                | focused integration scenario                                    |
| Real PostgreSQL/provider/process claim | corresponding live proof boundary                               |
| Failure injection                      | exploratory or normative according to accepted failure model    |
| Repository docs/tooling                | targeted structural/behavior validation                         |

A test does not independently justify:

```text
public interface
DI layer
factory
wrapper
mock seam
new product state
new product branch
```

Use existing architecture seams.

A new seam needs a real current architectural boundary or explicit plan authorization.

Exploratory probes may be removed after resolving uncertainty.

Do not retain every investigation as a permanent regression matrix.

A larger matrix needs a corresponding current contract/failure/platform claim.

Remove blanket:

```text
execute every task with TDD
```

from standing governance/playbooks.

---

# 20. Package README Responsibility

Package README is a local human/developer explanation, not a second normative owner.

It may contain:

```text
Purpose
semantic ownership
public surface
important relationships/handoffs
local implementation orientation
relevant Specs/Architecture
useful local verification entrypoints
```

It does not need a globally fixed heading template.

Audit all current package READMEs.

For each `Change constraints` or equivalent statement:

```text
explanation/local relationship
→ README

exact current invariant
→ Spec

repository-wide Agent behavior
→ root AGENTS / Skill

package-specific persistent Agent behavior with real repeated need
→ package-local AGENTS only if justified

procedure
→ Skill or project engineering playbook

history/provenance residue
→ remove/current-history rehome
```

Do not mass-create package-local AGENTS.

Update `packages/README.md` to describe a recommended explanatory pattern, not a mandatory heading law.

Remove absolute child-AGENTS ban.

---

# 21. Package INDEX and Tooling

Current package-index generation flattens large README sections into prose cells and then validates exact generated text. Replace this model.

Target manual retrieval projection:

| Package | Read when | Owns | Key handoffs / boundaries |
| ------- | --------- | ---- | ------------------------- |

Descriptions must be deliberate and useful, not full README copies.

Example quality:

```text
@heptalogos/work-queue

Read when:
changing canonical WorkItem creation/state/retry/reconciliation or dispatch fencing.

Owns:
canonical durable WorkItem and engine-neutral reconciliation.

Key handoffs:
Persistence owns Host-fenced canonical transactions;
Signal is a wakeup hint;
durable-execution owns DBOS mechanics;
Runtime Kernel resolves generation-bound handlers.
```

Machine validation protects structural invariants only:

- dynamically discover current workspace packages;
- every current package appears exactly once in `packages/INDEX.md`;
- every listed package exists;
- package link resolves to README;
- duplicate/unknown package entries fail;
- canonical machine metadata/tags may be validated if they remain useful.

Do not validate index explanatory prose by generated equality.

Remove unused rendering/generation code after the new validator has no current consumer for it.

No compatibility API for obsolete internal repo-kit functions during PRE_PRODUCTION.

---

# 22. Knowledge / Repository Validation Refactor

The current `documentation` validator hardcodes the old all-in-`docs/` topology and several historical migration paths.

Replace its semantic model.

## 22.1 Command naming

Because validation now spans several knowledge planes, rename the current repository command:

```text
check:documentation
→ check:knowledge
```

Update `pnpm verify` and all current references.

Do not keep a compatibility alias unless a declared external obligation exists.

Rename internal module/function names where necessary so current code expresses the new responsibility.

## 22.2 Required current entrypoints

It is valid to require the designed plane entrypoints because these are intentional current architecture:

```text
README.md
INDEX.md
AGENTS.md

docs/README.md
docs/INDEX.md
docs/AGENTS.md

specs/README.md
specs/INDEX.md
specs/AGENTS.md

project/README.md
project/INDEX.md
project/AGENTS.md

packages/README.md
packages/INDEX.md
packages/AGENTS.md

.agents/skills/AGENTS.md
```

Do not require every subdirectory to have all three file types.

## 22.3 Dynamic responsibility roots

Delete the fixed `RESPONSIBILITY_ROOTS` snapshot model.

The validator must not reject a future top-level responsibility directory because its name is absent from a current allow-list.

Use existing repository discovery facilities to identify maintained root directories, excluding generic transient/build/cache roots.

Require the global `INDEX.md` to cover current maintained responsibility roots sufficiently for navigation.

A new root therefore requires current navigation/ownership, not editing an allow-list merely to make validation pass.

## 22.4 Current machine Authorities

Update canonical exact paths:

```text
project/governance/compatibility-obligations.json
project/dependencies/dependency-routing.json
project/qualification/dependency-status.json
project/qualification/results/qualification-status.json
```

Exact paths are appropriate here because these specific files are declared canonical machine Authorities, not current inventory members.

## 22.5 Remove migration tombstones

Delete current validator logic whose only purpose is remembering removed historical paths/names such as old Corpus homes or one-time migration filenames.

Current canonical-reference validation may still reject references that resolve to a noncanonical location **without naming historical locations one by one**.

## 22.6 Nested AGENTS

Remove generic nested-AGENTS prohibition checks.

The need for a nested AGENTS file is qualitative and scoped; do not encode a fixed count/path allow-list.

Validate structural properties only where objectively useful.

## 22.7 Spec validation

Move Spec indexing and requirement-ID checks from `docs/specs` to top-level `specs`.

Keep:

- Spec links resolve;
- every current Spec is indexed once;
- prefixes unique;
- requirement IDs unique.

Do not lint prose density or file size.

## 22.8 Plane index coverage

Validate structurally:

```text
docs/INDEX.md
→ current human first-level areas

specs/INDEX.md
→ current Specs

project/INDEX.md
→ current project-control first-level areas

root INDEX.md
→ current maintained repository responsibility roots
```

Do not require exact explanatory prose.

## 22.9 Current/history links

Standing current links resolve.

Historical Plans may contain historical paths as code/plain historical text.

Do not maintain redirect/stub Markdown files solely to keep PRE_PRODUCTION internal historical links alive.

---

# 23. Governance and Closure Reconciliation

Move current Governance to:

```text
project/governance/**
```

then correct remaining conflicts.

## 23.1 Engineering principles

Strengthen existing principles rather than creating parallel doctrine.

### Library-First

Make the mandatory preflight explicit.

State:

> Avoiding an adopted dependency and writing local generic mechanics is not a conservative default. It transfers upstream maintenance to Heptalogos and requires current evidence.

### Complexity Admission

Cover:

```text
abstraction/framework
state/config/version
background/concurrency
recovery/fallback/security
custom generic mechanics
repository validator/gate
persistent generalized test matrix
meta-generator/registry/DSL
```

Do not require a formal complexity record for trivial local edits.

### Testing

State:

> Verification strategy follows the claim and current uncertainty/risk. TDD is one implementation technique, not a universal repository workflow or architecture Authority.

### Review completion

Retain STOP/reopen semantics.

## 23.2 Constitution

Make only the minimal amendment needed to the existing current complexity/Library-First principles.

Do not add a new constitutional article for every symptom.

## 23.3 PRE_PRODUCTION evolution

Correct typed document/plane ownership.

Keep:

- current-tree neutrality;
- compatibility obligation purity;
- baseline rewrite/reset;
- bounded stabilization purpose.

Move/retain operational review/PR/merge steps in engineering Playbooks rather than duplicating them in Governance.

## 23.4 GitHub Actions

Current policy:

```text
ordinary GitHub Actions disabled
```

Update milestone/stabilization closure Playbooks and Governance so disabled Actions are not a current closure gate and no current procedure instructs workflow dispatch.

Use:

```text
approved plan complete
+ required local/current qualification complete
+ repository gates PASS
+ external Independent Review PASS when the governing workflow requires it
+ candidate unchanged after review
+ merge conditions satisfied
```

Future CI re-enablement requires an explicit current policy change then.

---

# 24. Project Control Migration Details

## 24.1 Plans

Move the entire current Plan topology:

```text
docs/plans/**
→ project/plans/**
```

including active/completed/superseded historical plans.

This active plan moves with the directory.

After the move, continue execution from:

```text
project/plans/active/repository/agent-harness-engineering-restraint-governance-reconciliation-2026-08-30.md
```

Do not leave a stub at the old location.

Update all current Plan/Roadmap/index links.

Historical prose may preserve old paths as historical text when meaningful.

## 24.2 Roadmap

Move:

```text
docs/roadmap/**
→ project/roadmap/**
```

Reconcile the living roadmap header/baseline so it does not describe post-H2 as the current repository baseline while also recording H3A-2 closed.

Preserve:

```text
H3A-2 CLOSED
Foundation executable spine qualification truth
current work = knowledge/Harness/governance convergence
product sequencing unchanged
GitHub Actions disabled
```

## 24.3 Qualification

Move:

```text
docs/qualification/**
→ project/qualification/**
```

Update all current claim/evidence links.

Do not rewrite historical evidence simply for style.

## 24.4 Dependencies

Move:

```text
docs/dependencies/**
→ project/dependencies/**
```

No provider decision is reopened.

Update paths in `mechanics-routing` and current machine Authority config.

## 24.5 Governance

Move:

```text
docs/governance/**
→ project/governance/**
```

Then perform §23 reconciliation.

---

# 25. Human Knowledge Migration Details

## 25.1 `docs/README.md`

Rewrite it to say:

```text
docs/ is the Human Knowledge Plane
```

not the complete repository knowledge system.

Explain:

- Product;
- Architecture;
- Reference;
- how to reach root INDEX for other planes.

Fix current malformed list syntax.

## 25.2 Architecture

Keep current conceptual Architecture under:

```text
docs/architecture/**
```

Review current pages for:

- accidental exact normative duplication now owned by `specs/`;
- provider decisions now owned by `project/dependencies/`;
- evidence now owned by `project/qualification/`;
- stage/provenance residue.

Do not redesign product architecture.

## 25.3 Product

Keep:

```text
docs/product/**
```

Human-readable product/experience/research intent remains allowed to be richer and narrative.

## 25.4 Reference

Keep:

```text
docs/reference/**
```

including generated API reference unless its generator has a concrete reason to use another path.

Reference is a human/developer lookup class and can legitimately live in Human Knowledge.

---

# 26. Spec Migration and Currentness Audit

Move current Specs first, then perform a bounded currentness audit.

For each significant current normative requirement classify:

```text
IMPLEMENTED_CURRENT
CURRENT_HORIZON_CONTRACT
FUTURE_DESIGN
DEPENDENCY_DETAIL
QUALIFICATION_DETAIL
```

Actions:

```text
IMPLEMENTED_CURRENT
→ retain in specs/

CURRENT_HORIZON_CONTRACT
→ retain when current Horizon genuinely requires conformance

FUTURE_DESIGN
→ docs/architecture/ or project/roadmap/

DEPENDENCY_DETAIL
→ project/dependencies/

QUALIFICATION_DETAIL
→ project/qualification/
```

Do not implement missing behavior because a migrated Spec contains it.

Do not rewrite conceptual architecture during this audit.

Pay special attention to future configuration/resource-governance/restore/Subject/distribution/self-healing concepts.

---

# 27. Harness Design Reorganization

Move current human Harness engineering material into:

```text
project/engineering/agent-harness/
```

## 27.1 `README.md`

Human maintainer entry:

- what the Harness is;
- persistent vs on-demand layers;
- where Skills live;
- where Skill-authoring guidance lives;
- where evaluation lives.

## 27.2 `design.md`

Refactor the current Harness design.

It must include the general upstream risk:

> Agent complexity-generation inertia converts local uncertainty into permanent abstractions, state, validation, tests, recovery, compatibility, or meta-tooling beyond current semantics.

Capability map:

```text
scope-control
  Is this work/finding admitted now?

complexity-admission
  What permanent complexity is justified for admitted work?

mechanics-routing
  Which existing/adopted mechanic should implement it?

repository-check-design
  Does a permanent gate encode a real standing invariant?

test-design
  What proof strategy verifies the current claim without creating architecture?

recovery-design
  What bounded first-order recovery is currently authorized?

durable-state-change
  Does a new semantic fact justify persistent state?

semantic-boundary-change
  How is an already-authorized ownership/boundary change implemented?

preproduction-evolution
  How is the current PRE_PRODUCTION shape rewritten without legacy residue?

claim-verification
  What evidence level proves the claim?

knowledge-maintenance
  Which plane owns the changed fact and which projections need updating?

authoring-skills
  How are Skills created/restructured/evaluated?
```

This is an open capability map, not an allow-list.

## 27.3 `evaluation.md`

Keep behavior-chain evaluation.

Add/retain scenarios covering:

- adjacent rare race after green fix;
- recovery handler failure;
- failure-injection scenario;
- PRE_PRODUCTION replacement;
- custom retry despite adopted route;
- unresolved generic mechanics role;
- trivial local logic;
- new durable state for convenience;
- mock evidence claimed as live;
- premature one-consumer abstraction;
- fixed Skill/package inventory validator;
- legitimate semantic closed set;
- deleted migration artifact tombstone;
- blanket TDD for unknown provider behavior;
- testability-only interface;
- validator meta-framework;
- “while here” hardening;
- new Skill admission;
- retrieval questions across the four planes.

For each scenario evaluate:

```text
trigger/discovery
information acquired
classification
current owner/provider inspected
decision
forbidden overreach
evidence boundary
stop behavior
```

If no independent Coding-Agent runner exists:

```text
behavioral execution = NOT_RUN
```

Manual design inspection does not become live behavioral PASS.

---

# 28. Skill Evaluation Requirements

For each newly created or materially restructured Skill in this plan:

## Discovery

At least one realistic request that should trigger it.

## Non-trigger

At least one nearby request for which the Skill should not load.

## Behavior

At least one pressure/application case testing the hardest decision boundary.

Critical anti-inertia Skills need more than one case when one case cannot cover the observed rationalizations.

Do not make “exactly three evals per Skill” a permanent validator invariant.

Do not require a multi-model matrix in repository gates.

Use observed future failures to evolve evaluation.

---

# 29. Current Skill Bundle Hygiene

While auditing `.agents/skills/**`:

Keep only files that directly support execution-time capability.

Good:

```text
SKILL.md
references/
scripts/
small examples/templates when actually used
```

Do not add:

```text
README.md
CHANGELOG.md
migration-history.md
design-rationale.md
```

inside a Skill bundle.

Human rationale belongs in:

```text
project/engineering/agent-harness/
```

Historical evolution belongs Git/Plans.

When a Skill-local reference duplicates a current Spec/Governance/Dependency fact, remove the duplicate and link the canonical owner.

---

# 30. Current-Tree and PRE_PRODUCTION Migration Rule

This repository has no compatibility obligation to the current internal knowledge layout.

Therefore the migration uses:

```text
move current owner
→ update current consumers/links/tooling
→ validate new current tree
→ delete obsolete old route
```

Do not create:

```text
docs/specs compatibility stub
docs/plans redirect
old Skill alias
old check:documentation alias
old documentation-maintenance alias
old path fallback
dual knowledge index
migration tombstone validator
```

unless a concrete declared compatibility obligation requires it.

Git and historical Plans preserve chronology.

---

# 31. Repository Topology Validation

The current repository topology validator hard-codes a list of allowed top-level responsibility roots.

Remove that design.

A current root directory should be understood through:

```text
actual maintained repository structure
+ root INDEX navigation
+ local README/AGENTS where semantically needed
```

Validation may:

- discover maintained top-level directories using existing repository discovery facilities;
- ignore generic transient/build/cache directories;
- require root INDEX coverage for maintained responsibility roots;
- require designed core entrypoints.

Validation must not:

- maintain a current-root allow-list that blocks future evolution;
- require editing a list merely to add a legitimate new responsibility root;
- preserve old root names as permanent tombstones.

The exact list of current root directories may appear in a human explanatory document as current fact, but not as a closed admission constraint unless a real semantic reason exists.

---

# 32. Work Sequence

Execute in this order.

## Phase 0 — Verify the already-executed transition

1. Inspect current working tree.
2. Confirm this plan is the current active repository plan.
3. Confirm the prior correction plan is already superseded.
4. Confirm Roadmap/Plan INDEX Phase A pointers are coherent.
5. Repair only a concrete incomplete Phase A transition.
6. Do not create another supersession record for the replaced plan contents.

## Phase 1 — Establish new plane roots and migration control

7. Create root `README.md`.
8. Create root `INDEX.md`.
9. Create `specs/` entrypoints.
10. Create `project/` entrypoints.
11. Add scoped `specs/AGENTS.md`.
12. Add scoped `project/AGENTS.md`.
13. Add `.agents/skills/AGENTS.md`.
14. Rewrite root AGENTS with §10.1 engineering posture without duplicating future scoped rules.

Do not move every file before the target retrieval/Authority rules exist.

## Phase 2 — Move Normative Contract Plane

15. Move `docs/specs/**` to `specs/**`.
16. Update Spec links/indices and immediate current consumers.
17. Update Spec validation paths.
18. Run focused knowledge/Spec checks.
19. Perform bounded currentness classification.
20. Correct only materially misplaced content.

## Phase 3 — Move Project Control Plane

21. Move Governance to `project/governance/`.
22. Move Dependencies to `project/dependencies/`.
23. Move Qualification to `project/qualification/`.
24. Move Roadmap to `project/roadmap/`.
25. Move Plans to `project/plans/`, including this active plan.
26. Continue execution from the final canonical plan path.
27. Move Engineering to `project/engineering/`.
28. Update current machine Authority paths.
29. Update all current links/entrypoints.

Do not leave old-path stubs.

## Phase 4 — Reclassify Engineering/Harness knowledge

30. Create `project/engineering/INDEX.md`.
31. Normalize Playbook/Gotcha navigation.
32. Replace documentation-system design with `repository/knowledge-system.md`.
33. Create `agent-harness/README.md`.
34. Move/refactor Harness `design.md`.
35. Move/refactor Harness `evaluation.md`.
36. Create `agent-harness/skill-authoring.md`.
37. Classify/remove/move `project/engineering/specs/**`.
38. Remove empty/ambiguous directories after classification.

## Phase 5 — Human Knowledge Plane

39. Rewrite `docs/README.md`.
40. Rewrite `docs/INDEX.md`.
41. Rewrite `docs/AGENTS.md`.
42. Update Architecture/Product/Reference links to new planes.
43. Remove current normative/control/evidence duplication where clearly exposed by migration.
44. Do not redesign product architecture.

## Phase 6 — Agent Skill architecture

45. Create `authoring-skills`.
46. Create `complexity-admission`.
47. Create `repository-check-design`.
48. Correct `scope-control` over-PLAN_GAP behavior.
49. Deepen `mechanics-routing` with custom-mechanics admission.
50. Deepen `test-design` with claim/uncertainty-driven strategy.
51. Update existing Skills for new canonical paths.
52. Rename `documentation-maintenance` to `knowledge-maintenance`.
53. Update all current Skill references/descriptions.
54. Audit every Skill description for what+when discoverability.
55. Audit every Skill body for coherent-job scope and progressive disclosure.
56. Do not rename other Skills for stylistic consistency alone.
57. Remove unused/redundant Skill-local material.

## Phase 7 — Engineering restraint / Library-First governance

58. Strengthen engineering principles with current-value complexity admission.
59. Strengthen mandatory Library/Dependency First preflight.
60. Make minimal constitutional update rather than new symptom-specific articles.
61. Reconcile PRE_PRODUCTION governance with typed planes.
62. Persist positive-first and semantic-density authoring.
63. Ensure STOP/reopen behavior remains explicit.

## Phase 8 — Closure/TDD/GitHub Actions reconciliation

64. Remove blanket TDD standing requirements.
65. Update milestone/stabilization Playbooks to claim/risk-oriented testing.
66. Remove GitHub Actions/manual workflow dispatch as current closure requirement.
67. Keep external Independent Review semantics where current supervisory workflow requires it.
68. Ensure root/governance/playbooks all agree on disabled Actions.

## Phase 9 — Package explanation and retrieval

69. Rewrite `packages/README.md` responsibility model.
70. Remove fixed README heading law.
71. Remove absolute child-AGENTS ban.
72. Audit package `Change constraints` or equivalent sections.
73. Move/link material normative/persistent/procedural content to real owners.
74. Rewrite `packages/INDEX.md` as deliberate retrieval projection.
75. Refactor package-index tooling to structural coverage validation.
76. Update focused repo-kit tests.
77. Remove obsolete generated-prose renderer code if it has no current consumer.

## Phase 10 — Repository knowledge validation

78. Rename `check:documentation` to `check:knowledge`.
79. Refactor repo-kit documentation validator to knowledge-plane model.
80. Remove fixed responsibility-root allow-list.
81. Remove history-specific migration tombstone checks.
82. Remove nested-AGENTS count/path prohibition.
83. Add root/docs/specs/project index coverage checks.
84. Preserve legitimate Spec ID/prefix/link and machine Authority validation.
85. Update `pnpm verify` and all current references.
86. Remove obsolete internal compatibility aliases.

## Phase 11 — Current truth reconciliation

87. Reconcile Roadmap current baseline.
88. Reconcile Plan indexes after path migration.
89. Reconcile Qualification/current evidence links.
90. Reconcile Dependency current paths.
91. Search maintained current tree for old `docs/governance`, `docs/specs`, `docs/plans`, `docs/qualification`, `docs/dependencies`, `docs/engineering` live routes.
92. Classify historical occurrences instead of blindly rewriting historical prose.
93. Search for `Architecture Corpus` use in standing current docs and replace ambiguous umbrella Authority with typed owners.
94. Search for fixed current inventories/tombstones/blanket TDD/current disabled-CI dispatch.
95. Admit only concrete findings; do not expand into unrelated cleanup.

## Phase 12 — Harness evaluation and final verification

96. Update behavior scenarios for current Skill names/paths/knowledge planes.
97. Perform Skill description discovery review.
98. Perform non-trigger review.
99. Perform semantic behavior review against all current anti-inertia scenarios.
100.  If a real independent Coding-Agent runner exists, execute representative behavior evaluation.
101.  Otherwise record behavioral execution `NOT_RUN`.
102.  Run focused tests for changed repo-kit/validators.
103.  Run final repository gates.
104.  Verify no product runtime source changed.
105.  Close only when §34 passes.

---

# 33. Verification

Use focused checks during migration.

Final required local gates use the **new current names**, including:

```text
pnpm check:agents
pnpm check:knowledge
pnpm check:hygiene
pnpm check:repository
pnpm verify
```

Run focused repo-kit tests covering:

- knowledge plane discovery/index/link validation;
- Spec index/requirement validation;
- package-index structural coverage;
- machine Authority canonical paths;
- generic Skill structural validation;
- root topology discovery behavior.

Do not dispatch GitHub Actions.

Do not add product-runtime qualification because runtime semantics are frozen.

If runtime implementation changes become necessary:

```text
PLAN_GAP
```

Evidence states:

```text
PASS
FAIL
NOT_RUN
BLOCKED
```

Structural Skill validation is not live behavioral PASS.

---

# 34. Acceptance Criteria

The plan is complete only when all conditions hold.

## 34.1 Information planes

- root README exists as human entry;
- root INDEX exists as global retrieval map;
- `docs/` contains human knowledge rather than the full repository control system;
- `specs/` contains current normative implementation contracts;
- `project/` contains governance/dependencies/roadmap/plans/qualification/engineering control artifacts;
- `.agents/skills/` contains Agent execution procedures;
- old `docs/specs`, `docs/governance`, `docs/dependencies`, `docs/plans`, `docs/roadmap`, `docs/qualification`, and `docs/engineering` current homes are gone;
- no compatibility stubs remain.

## 34.2 Typed Authority

- each current question class has one clear canonical owner;
- Qualification is evidence, not semantic Authority;
- Plans authorize work, not permanent semantics;
- Architecture is conceptual/rationale, not a universal umbrella priority;
- standing current docs do not rely on an ambiguous “Architecture Corpus owns everything” model.

## 34.3 AGENTS

- root persistent context contains engineering restraint, Library-First, PRE_PRODUCTION, ownership, complexity admission, completion/reopen, evidence truth;
- child AGENTS contain only scope deltas;
- `docs/AGENTS`, `specs/AGENTS`, `project/AGENTS`, `packages/AGENTS`, `.agents/skills/AGENTS` each have distinct justified roles;
- no fixed AGENTS count;
- no absolute nested-AGENTS ban;
- no substantive root rule duplicated verbatim in child scopes.

## 34.4 Skills

- Skill inventory remains open;
- descriptions state what+when and are understandable without project-private shorthand;
- main Skill files act as workflow control planes;
- complex conditional detail uses direct progressive disclosure where useful;
- no mandatory body template/line budget/reference count;
- scripts exist only where deterministic mechanics justify them;
- `authoring-skills`, `complexity-admission`, and `repository-check-design` exist as real capabilities;
- `knowledge-maintenance` replaces the misleading documentation-only name;
- old `documentation-maintenance` alias does not remain;
- scope/recovery/lifecycle/state/mechanics/test/evidence Skills preserve their useful decision procedures;
- no topic-router regression.

## 34.5 Overengineering control

- root engineering-restraint posture is present;
- complexity-admission distinguishes admitted work from justified permanent complexity;
- green acceptance remains a real STOP boundary;
- recovery-of-recovery is not automatic;
- tests do not create architecture;
- validators do not freeze current inventories;
- migration assertions leave permanent tooling when migration ends;
- legitimate semantic closed sets may still be validated exactly;
- meta-framework creation requires current repeated need.

## 34.6 Library / dependency first

- root AGENTS contains mandatory generic-mechanics preflight;
- Governance states adopted mechanics routes are implementation directives;
- mechanics-routing checks existing primitive/provider/standard/mature library before custom code;
- custom generic mechanics require concrete insufficiency evidence;
- unresolved foundational provider choice becomes PLAN_GAP when not authorized;
- trivial local/product semantics do not trigger dependency maximalism.

## 34.7 Testing

- no standing blanket TDD rule;
- test strategy follows contract/defect/uncertainty/proof boundary;
- testability alone does not authorize interface/factory/DI/mock architecture;
- exploratory probes do not automatically become permanent regression matrices;
- failure injection still passes through scope/failure-model admission.

## 34.8 Human/Agent content

- human Harness design/authoring/evaluation material lives under Project Engineering;
- Agent procedures live under `.agents/skills`;
- normative contracts live outside human docs;
- human Architecture/Product remain readable rather than compressed into Agent shorthand;
- technical Specs/Skills remain explicit rather than cryptic.

## 34.9 Retrieval

- root INDEX can route representative cross-plane questions;
- docs INDEX routes human knowledge;
- specs INDEX routes normative contracts;
- project INDEX routes control/evidence/procedure;
- package INDEX routes semantic owners/handoffs;
- no index uses mechanically truncated prose;
- package index no longer copies full README sections.

## 34.10 Repository tooling

- no fixed top-level responsibility-root allow-list;
- no fixed Skill/package current inventory allow-list;
- no permanent migration tombstone list;
- current canonical machine Authority paths are correct;
- Spec IDs/prefixes/index coverage are validated;
- current standing links resolve;
- `check:knowledge` replaces the obsolete all-in-docs command semantics;
- no compatibility alias remains solely for internal recent history.

## 34.11 Governance/current truth

- GitHub Actions disabled policy is consistent everywhere current;
- disabled Actions are not closure blockers;
- PRE_PRODUCTION governance uses typed planes;
- Roadmap baseline reflects H3A-2 closure/current repository work without advancing product sequencing;
- current Plan path is under `project/plans/active/**`.

## 34.12 Evidence

- required local gates PASS;
- unavailable live Agent behavior remains NOT_RUN;
- no product runtime source changed.

---

# 35. STOP Rule

When §34 is satisfied:

```text
STOP.
```

Do not begin another taxonomy redesign merely because further abstraction is possible.

Do not create:

```text
knowledge graph
semantic document database
automatic Skill router
Skill generator
complexity scoring engine
generic repository-check plugin framework
universal rules DSL
automatic prose quality grader
fixed Skill taxonomy
fixed AGENTS taxonomy
historical tombstone registry
TDD enforcement framework
dependency abstraction layer for hypothetical providers
```

without a future concrete current need and explicit authorization.

Long-term evolution:

```text
real development friction / Agent failure
→ identify the actual missing guard or capability
→ choose the narrowest correct plane/owner
→ change persistent instruction, Skill, Spec, Governance, evidence, or tooling
→ evaluate against the real scenario
→ continue product development
```

The repository knowledge system evolves from evidence, not anticipation.

---

# 36. Final Report Format

Return exactly these sections.

## A. Replacement-plan baseline

- Phase A state found;
- incomplete Phase A repair, if any;
- confirmation that H3A-2/product runtime was not reopened.

## B. Knowledge planes

For each:

```text
docs
specs
project
.agents
```

report:

```text
primary consumer:
canonical responsibilities:
moved content:
removed old routes:
```

## C. Root entrypoints

Report:

- README role;
- INDEX retrieval role;
- AGENTS persistent role.

## D. Typed Authority

List the final canonical owner for:

```text
product
architecture
normative specs
governance
dependencies
roadmap
plans
qualification
engineering procedures
Agent Skills
```

## E. AGENTS

For each current AGENTS file:

```text
path:
scope:
unique persistent responsibility:
root duplication removed:
```

## F. Skills

For every changed/new/renamed Skill:

```text
name:
discovery trigger:
coherent job:
decision method:
progressive resources:
behavior risk addressed:
```

Explicitly report:

- `authoring-skills`;
- `complexity-admission`;
- `repository-check-design`;
- `knowledge-maintenance` rename;
- current Skill count only as informational current state, never as an invariant.

## G. Library / Dependency First

Report:

- root preflight;
- mechanics-routing change;
- custom mechanics evidence burden;
- confirmation adopted provider roles remain directives.

## H. Testing / complexity

Report:

- blanket TDD removals;
- test-strategy model;
- testability-only architecture policy;
- completion/STOP policy;
- recovery/hardening boundary.

## I. README / INDEX / package retrieval

Report:

- docs/specs/project/root index responsibilities;
- package README role audit;
- package INDEX/tooling correction.

## J. Validator/tooling

Report:

- `check:knowledge`;
- dynamic root discovery;
- migration tombstones removed;
- fixed current inventories removed;
- semantic closed sets retained;
- canonical machine Authority paths.

## K. Governance/current truth

Report:

- typed-plane governance;
- GitHub Actions correction;
- Roadmap reconciliation;
- current active Plan final path.

## L. Evaluation

Report:

```text
description/discovery review:
non-trigger review:
manual semantic scenario review:
independent Agent runner:
behavior result: PASS | FAIL | NOT_RUN | BLOCKED
```

## M. Verification

For every executed command:

```text
command:
result: PASS | FAIL | NOT_RUN | BLOCKED
```

## N. Closure

Exactly one:

```text
PLAN COMPLETE
```

or:

```text
PLAN BLOCKED
```

The prior `PLAN COMPLETE` record is preserved as historical execution evidence.
Its acceptance state is reopened only by the bounded post-review correction
recorded below; do not append speculative future improvements.

# 37. Bounded Post-Review Correction — 2026-08-30

## 37.1 Review state

The prior acceptance result is `REQUEST_CHANGES`. The review identified
concrete inconsistencies in current PRE_PRODUCTION governance, scope admission,
content/authoring separation, package README ownership, dynamic root
resolution, and retrieval surfaces.

This section integrates the post-review correction into the current active Plan.
It does not create a second active Plan or another supersession chain.

## 37.2 Locked correction boundary

Preserve the accepted four-plane knowledge architecture, current Skill model,
and Foundation/H3A-2 runtime closure. The correction is limited to:

- typed Authority and disabled-Actions reconciliation in current governance;
- the `scope-control` owner/boundary decision;
- content versus authoring guidance placement;
- current package README responsibility and `work-queue` review;
- dynamic current-root resolution in knowledge validation;
- duplicate and misleading INDEX/README retrieval entries;
- bounded current-truth review and claim-matched repository verification.

No product runtime, Foundation, provider, durable product state, CI
re-enablement, taxonomy reset, generic authoring/meta-lint framework, or new
active-plan cycle is authorized.

## 37.3 Execution order

1. Correct `project/governance/pre-production-evolution.md` and the
   `scope-control` Skill references.
2. Add the Content / Authoring Separation principle to the knowledge-system
   guidance, keep only its minimum persistent consequence in root `AGENTS.md`,
   and clean the named current entry artifacts.
3. Audit current package READMEs, explicitly resolve `work-queue`, and remove
   duplicate normative ownership from package projections and scoped AGENTS.
4. Remove the hidden root inventory from `tools/repo-kit/src/knowledge.mjs`,
   add focused resolver tests, and correct the named INDEX/README entries.
5. Run one bounded current-standing sweep, admitting only authoring-commentary,
   Authority, hidden-inventory, duplicate-package-fact, or disabled-CI findings.
6. Run focused repository-tooling tests and the permanent local gates.

## 37.4 Acceptance

The correction closes only when the named review findings are resolved,
current content and Authority remain singular, dynamic root resolution is
tested without a production allow-list, no prose/meta-validator is added,
runtime source remains unchanged, and the required local commands in the
post-review correction request are `PASS`. Independent Agent behavior is
reported separately as `NOT_RUN` when no independent runner is available.

## 37.5 Bounded sweep disposition

The current sweep fixed only admitted authoring-commentary, Authority,
hidden-inventory, duplicate-package-fact, and disabled-CI findings. Historical
Qualification records retain past CI/Corpus wording as evidence chronology;
historical Roadmap reconciliation retains past CI outcomes without making them
current closure requirements. These remain `RECORD/DEFER` and are not current
Authority or executable instructions.

## 37.6 Completion

The bounded post-review correction is `REVIEW CORRECTION COMPLETE`. The required
local repository gates and focused repository-tooling tests are `PASS`; no
product runtime source was changed or reopened. Independent Coding-Agent
behavior execution is `NOT_RUN` because no independent runner is available.
