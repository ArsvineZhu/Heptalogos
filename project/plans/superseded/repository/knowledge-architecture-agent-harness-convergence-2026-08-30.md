# Heptalogos Repository Knowledge Architecture & Coding-Agent Harness Convergence

## H3A-2 Bounded Closure → Documentation/Specification Recomposition → Procedural Agent Harness

**Plan date:** 2026-08-30
**Status:** SUPERSEDED — historical repository/Harness convergence record
**Current product horizon:** unchanged; remain at the current H3/H3A-2 closure boundary
**Plan class:** repository/governance/harness convergence with bounded H3A-2 closure
**Historical path:**
`docs/plans/superseded/repository/knowledge-architecture-agent-harness-convergence-2026-08-30.md`

The accepted documentation topology, normative Specs, H3A-2 bounded closure,
and retired topic-router model remain preserved. Agent Harness acceptance was
rejected because the implementation froze a Skill enumeration, retained
migration tombstones, over-compressed procedural guidance and indexes, and
evaluated routing rather than capability. The correction is owned by
`docs/plans/active/repository/agent-harness-capability-correction-2026-08-30.md`.

---

# 0. Executor contract

This is a **decision-complete implementation plan**.

Do not redesign the plan while executing it.

Do not perform another general architecture study, external best-practice survey, dependency survey, or speculative cleanup pass. The documentation/Harness architecture decisions required for this work are locked below.

The work has two distinct parts:

```text
PART A
Bounded closure of the current H3A-2 candidate.

PART B
Repository knowledge architecture and Coding-Agent Harness convergence.
```

PART A may change runtime source only where the admission rules below authorize a concrete current defect.

PART B is a documentation/governance/Agent-Harness restructuring task. It MUST NOT silently change product semantics or add product capability.

If execution requires a non-trivial semantic decision not resolved by current standing Authority plus this plan:

```text
PLAN_GAP
```

Report the smallest concrete unresolved decision and its evidence.

Do not improvise.

GitHub Actions remain disabled. Do not enable, dispatch, or treat GitHub Actions as a blocker.

Do not copy commit SHAs into current plans, standing documentation, qualification records, or Agent instructions.

---

# 1. Activation and supersession

This plan supersedes the current active H3A-2 closure plan while preserving its still-valid decisions.

At activation:

1. place this file at:

   `docs/plans/active/repository/knowledge-architecture-agent-harness-convergence-2026-08-30.md`

2. move:

   `docs/plans/active/foundation/h3a2-foundation-containment-executable-truth-2026-08-29.md`

   to:

   `docs/plans/superseded/foundation/h3a2-foundation-containment-executable-truth-2026-08-29.md`

3. mark the superseded document `SUPERSEDED` using the minimum current plan-topology edit required by repository conventions;

4. preserve that old plan as historical evidence; do not rewrite its historical execution narrative;

5. update current plan navigation and Roadmap active-plan reference to this plan;

6. do not advance the product Horizon merely because this repository plan became active.

The previous plan's already-accepted product decisions remain in force unless this plan explicitly replaces a repository-governance/documentation decision.

---

# 2. Executive outcome

The final repository must implement the following knowledge model:

```text
Product / human design intent
        ↓
Conceptual Architecture
        ↓
Normative Specs
        ↓
Approved Active Plan
        ↓
Code / Tests
        ↓
Qualification Evidence
```

Cross-cutting:

```text
Governance
  constrains all layers

Dependencies
  own generic-mechanics provider decisions

Skills
  guide repeatable Coding-Agent execution procedures
```

The repository must stop treating:

```text
AGENTS.md
Skills
Architecture contracts
README files
route manifests
```

as partially overlapping copies of the same knowledge.

The completed system must provide:

1. clear typed Authority by document class;
2. human-readable conceptual Architecture;
3. compact Agent-readable normative Specs;
4. short persistent AGENTS instructions;
5. procedural Skills triggered by engineering activity rather than architecture topic;
6. README / INDEX / AGENTS separation;
7. progressive disclosure of context;
8. removal of the current Skill-to-Corpus routing layer;
9. explicit review completion/reopen semantics preventing recursive hardening;
10. deterministic validation only for mechanically verifiable repository properties;
11. no new product subsystem, dependency, state machine, recovery branch, compatibility path, or resilience feature introduced by this work.

---

# 3. Current Horizon and failure scope

## 3.1 Product Horizon

This plan does **not** advance H3, H3-S, H4, H5, or H6 product semantics.

It prepares the repository so subsequent product work can proceed with lower context cost and stronger Authority boundaries.

## 3.2 Executable Truth target

The current Foundation L3 executable proof must remain valid.

This plan does not create a new Product L4 claim.

Required invariant:

```text
repository knowledge/harness convergence
MUST NOT regress
the already-proven Foundation executable spine
```

If PART A changes runtime source, rerun the existing relevant process-level qualification required for that changed path.

If PART A makes no runtime change, do not invent new runtime qualification scenarios solely because documentation/Harness changed.

## 3.3 Authorized runtime failure classes

For PART A only:

```text
F0 HAPPY_PATH              authorized
F1 COMMON_OPERATIONAL      authorized when directly relevant
F2 EXPECTED_RECOVERY       authorized only where current H3A-2 semantics already require it
F3 RARE_TIMING_FAULT       DEFER
F4 CATASTROPHIC_HARDENING  DEFER
```

## 3.4 Explicitly deferred runtime work

Do not reopen:

```text
recovery-of-recovery
rollback-of-rollback
fallback-of-fallback

additional rare timing injection
shared theoretical timeout-budget perfection
power-loss testing
disk-corruption testing
kernel/hardware fault handling
multi-fault recovery
automatic self-healing
zero-downtime replacement

new lifecycle states
new durable recovery states
new retry framework
new fallback framework

additional crash boundaries merely for completeness
additional admission-hang tests without an observed/common failure
PostgreSQL-missing harness hardening without an actual false-green problem
```

A theoretical imperfection is not implementation authority.

---

# 4. Locked knowledge-architecture decisions

These are not options.

## 4.1 Typed Authority replaces one giant Corpus hierarchy

Standing Authority is owned by document class.

| Class            | Canonical responsibility                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `product`        | product purpose, experience boundaries, product shape, differentiation                                        |
| `architecture`   | conceptual system model, semantic ownership, Authority relationships, decomposition, rationale, runtime views |
| `specs`          | exact current normative contracts: invariants, states, operations, lifecycle, failure semantics               |
| `governance`     | project constitution, engineering/evolution policy                                                            |
| `dependencies`   | generic mechanics role/provider decisions and implementation routing                                          |
| `engineering`    | repository procedures, toolchain, maintainership practices                                                    |
| `qualification`  | observed evidence and qualification truth                                                                     |
| `roadmap`        | sequencing and Horizon truth                                                                                  |
| `plans`          | authorized current change and historical execution records                                                    |
| `reference`      | lookup facts and derived/reference material                                                                   |
| package `README` | implementation-local purpose, ownership, public surface, relationships                                        |

There is no generic rule:

```text
Spec > Architecture
```

or:

```text
Architecture > Governance
```

for unrelated fact classes.

Each fact must have one canonical owner.

If two standing documents answer the same normative question differently, that is a documentation defect, not a priority-resolution opportunity.

An active plan authorizes change. It does not silently become a second standing Authority.

A plan may explicitly authorize changing a standing decision. In that case, update the canonical owner as part of the same planned change.

---

## 4.2 Architecture is human conceptual design

`docs/architecture/**` owns:

```text
why the system is shaped this way
semantic concepts
major boundaries
Authority relationships
runtime/system views
long-term conceptual relationships
design rationale
future conceptual design where explicitly labeled
```

Architecture pages must not become implementation checklists.

They may use diagrams, examples, explanatory prose, trade-offs, and conceptual flows.

Architecture may remain primarily Chinese where that improves human design work.

Stable technical identifiers remain English.

---

## 4.3 Specs are dense normative implementation contracts

Create top-level:

```text
docs/specs/
```

Specs are primarily consumed by Coding Agents and developers implementing current contracts.

Specs use concise technical English.

Specs contain:

```text
scope
terms when necessary
ownership
normative invariants
state model when relevant
operations
lifecycle semantics
failure semantics
cross-boundary contract
verification claims when useful
references
```

Specs do **not** own:

```text
long design history
why every rejected alternative was rejected
dependency provider selection
qualification results
roadmap sequencing
PR/session/milestone history
implementation chronology
future speculative completeness
```

---

## 4.4 Specs are admitted by present need

Do not reproduce every future Architecture idea as a Spec.

A current Spec is justified when at least one applies:

```text
the contract already governs current implemented behavior;
the current active Horizon requires implementations to conform to it;
a current durable/cross-boundary contract requires exact normative definition.
```

Future design that is not a current implementation contract remains Architecture/Roadmap material.

Architecture existence does not authorize implementation.

Spec existence also does not authorize work by itself; implementation still requires an active plan.

---

## 4.5 README / INDEX / AGENTS have fixed semantics

### README

Answers:

```text
What is this area?
Why does it exist?
What does it own?
How is it conceptually organized?
```

README is explanation.

It may contain a small number of entry links, but it is not the exhaustive navigation index.

### INDEX

Answers:

```text
Where is the canonical document/package for topic X?
```

INDEX is navigation.

Preferred shape:

```text
Topic → canonical location — short description
```

Do not place long architecture explanations or policy prose in INDEX files.

### AGENTS

Answers:

```text
What behavior must a Coding Agent persistently follow in this subtree?
```

AGENTS is persistent execution policy.

It is not:

```text
an architecture summary
a roadmap
a complete development workflow
a duplicate Skill
a duplicate governance document
a knowledge encyclopedia
```

Do not create README + INDEX + AGENTS mechanically in every directory.

Create a file only when its semantic role is needed.

---

## 4.6 Skills are procedural, not topical

A Skill exists only for a repeatable development activity with specialized procedure.

The current architecture-topic pattern is retired.

Do not create a Skill merely because a subsystem exists.

First-generation approved Skill set is exactly:

```text
scope-control
mechanics-routing
lifecycle-change
durable-state-change
preproduction-evolution
claim-verification
documentation-maintenance
```

Do not create an eighth Skill in this plan.

If a missing procedural category becomes clearly necessary:

```text
PLAN_GAP
```

rather than growing the taxonomy opportunistically.

---

# 5. Normative writing conventions

## 5.1 Agent-facing language

Use concise technical English for:

```text
root/docs/packages AGENTS
docs/specs/**
.agents/skills/**
repository Agent/Harness engineering rules
```

Human conceptual Architecture may remain Chinese.

Do not perform broad translation work.

## 5.2 Positive-first instructions

Prefer:

```text
Canonical mutations pass through PersistenceService.
```

over long negative inventories.

Prefer:

```text
existing owner
→ adopted provider
→ extend owner
→ PLAN_GAP
```

over:

```text
do not use A
do not use B
do not write C
do not invent D
...
```

Explicit negative instructions remain appropriate when they protect against:

```text
an observed repeated Agent failure;
a strong model default that repeatedly violated project policy;
a high-cost Authority/safety violation.
```

## 5.3 BCP 14 semantics for Specs

`docs/specs/README.md` must declare that uppercase:

```text
MUST
MUST NOT
SHOULD
SHOULD NOT
MAY
```

use RFC 2119 / RFC 8174 normative meanings.

Do not convert all prose into `MUST`.

Only normative requirements need normative vocabulary.

## 5.4 Requirement IDs

Important Spec requirements that need cross-artifact traceability receive stable semantic IDs:

```text
<PREFIX>-NNN
```

Examples:

```text
WI-001
HOST-004
BOOT-003
```

Rules:

1. prefixes are semantic, not Horizon/date/PR/session identifiers;
2. IDs remain stable while the requirement remains current;
3. do not number every explanatory sentence;
4. code comments do not need requirement IDs by default;
5. Plans and Qualification may reference IDs where useful;
6. removed PRE_PRODUCTION requirements do not require compatibility aliases or tombstone Specs;
7. completed historical records may retain old IDs as historical text;
8. current Spec IDs must be unique.

`docs/specs/INDEX.md` records each Spec's prefix.

---

# 6. Information migration classification

Before moving standing content, classify each relevant section using exactly one primary class:

```text
CURRENT_ARCHITECTURE
CURRENT_SPEC
DEPENDENCY_DECISION
QUALIFICATION_EVIDENCE
ENGINEERING_PROCEDURE
FUTURE_DESIGN
HISTORY_PROVENANCE
DUPLICATE_DERIVED
```

Apply:

```text
CURRENT_ARCHITECTURE
→ docs/architecture/**

CURRENT_SPEC
→ docs/specs/**

DEPENDENCY_DECISION
→ docs/dependencies/**

QUALIFICATION_EVIDENCE
→ docs/qualification/**

ENGINEERING_PROCEDURE
→ applicable Skill or docs/engineering/**

FUTURE_DESIGN
→ architecture and/or roadmap;
  MUST NOT become current implementation Spec merely because it is detailed

HISTORY_PROVENANCE
→ completed/superseded plan or historical qualification when already meaningful;
  otherwise remove from standing current truth

DUPLICATE_DERIVED
→ delete duplicate prose and link to canonical owner
```

Do not resolve a genuine semantic conflict by silently choosing the wording that appears cleaner.

If two current standing sources disagree materially:

```text
PLAN_GAP
```

Identify:

```text
fact
source A
source B
implementation evidence if relevant
why the conflict changes semantics
```

---

# 7. Migration ledger

During migration, maintain a temporary section-level ledger.

Preferred location:

```text
inside this active plan under an execution appendix
```

or an equivalent temporary plan-local artifact if repository plan conventions require separation.

The ledger schema is:

| Source | Section / fact | Classification | Canonical target | Action | Status |
| ------ | -------------- | -------------- | ---------------- | ------ | ------ |

The ledger is not standing Authority.

Its purpose is to prevent information loss during structural migration.

When this plan completes, it may remain in the completed historical plan as migration evidence.

Do not create a new permanent "documentation database" or routing manifest.

---

# 8. Task 0 — Bounded H3A-2 candidate closure

This task executes before the broad documentation/Harness migration.

Its purpose is to determine whether the recently submitted candidate has a small number of normal closure defects.

It is **not another hardening pass**.

## 8.1 Read current evidence

Inspect:

```text
the superseded H3A-2 plan
current H3A-2 qualification records
current Foundation executable-spine tests
the H3A-2 source diff/current touched packages
current roadmap/closure truth
```

Do not start by inventing new failure scenarios.

## 8.2 Finding admission

For every candidate finding, answer in this order:

```text
1. Is it actually observed in current code/evidence?
2. Is it on the current executable path?
3. Does it violate a current invariant or current plan acceptance criterion?
4. Which accepted failure class applies?
5. What happens if it is deferred?
```

Decision:

```text
F0 current-path defect
→ FIX

F1 common operational defect
→ FIX when directly relevant to current implemented capability

F2 recovery defect required by existing H3A-2 semantics
→ FIX

F3
→ DEFER unless explicitly required by an existing current invariant

F4
→ DEFER

theoretical imperfection only
→ DEFER

failure-injection-only scenario
→ DEFER

recovery-of-recovery
→ DEFER

future consumer only
→ DEFER
```

## 8.3 Mandatory known review targets

Verify these existing review targets without assuming they remain defective.

### T0-A — Executable proof path fidelity

Inspect the current real PostgreSQL + DBOS process-level support path, including:

```text
packages/bootstrap-runtime/test/support/durable-work-child.ts
```

Confirm that the qualification claim and the actual executable route agree.

If the claimed Foundation proof is:

```text
canonical WorkItem
→ Signal / reconciliation
→ WorkQueue
→ DurableExecution / DBOS
→ handler
→ terminal canonical outcome
```

then the proof harness must actually exercise the claimed ownership path rather than directly invoking a downstream dispatch primitive in a way that bypasses the claimed component.

If the current implementation already exercises the claimed path correctly:

```text
NO CHANGE
```

If a real evidence-path mismatch remains:

```text
fix the harness/composition minimally;
do not redesign WorkQueue, DBOS, Signal, Bootstrap, or Runtime.
```

### T0-B — Qualification truth consistency

Search current qualification for contradictory statements around existing crash/restart evidence, including terminal-commit restart coverage.

If an executed scenario is recorded elsewhere as generic `NOT_RUN`, reconcile the current evidence record.

Do not add another crash scenario.

### T0-C — Actual current blockers

If existing relevant tests or executable-spine qualification currently fail, fix the direct current failure only.

Do not recursively inspect the fix for new speculative resilience work.

## 8.4 Review Stop Rule for Task 0

When all are true:

```text
the authorized H3A-2 closure defects are resolved;
the existing acceptance criteria are satisfied;
the required executable path is green;
no observed/current F0-F2 blocker remains;
```

the decision is:

```text
STOP H3A-2 REVIEW
```

Do not perform a second "find more edge cases" review.

No new implementation work is authorized merely because another possible imperfection can be imagined.

## 8.5 Task 0 verification

If runtime source changed:

```text
run focused affected package tests
run existing relevant H3A-2 real PostgreSQL/DBOS qualification
run required repository gates
```

Use existing qualification scenarios.

Do not design new scenarios.

If only evidence/docs changed:

```text
run the existing documentation/repository gates relevant to those changes
```

## 8.6 H3A-2 closure truth

After Task 0 passes:

1. update Roadmap/qualification current truth so H3A-2 no longer appears open merely because the old plan was superseded;
2. preserve historical plan state correctly;
3. do not start H3B/H3-S product implementation in this plan.

---

# 9. Task 1 — Make completion/reopen semantics permanent

Current governance already contains the conceptual equivalents of:

```text
Executable Truth
failure classes
bounded recovery
present justification
New State Rule
Security Requires a Threat
Robustness Requires a Failure Model
No Recursive Hardening
```

Do not create a new sequence of constitutional principles solely to repeat them.

## 9.1 Update `docs/governance/engineering-principles.md`

Add one operational section:

```text
Review Completion / Reopen Rule
```

Required semantics:

```text
When:
- the authorized change is complete;
- its acceptance criteria are satisfied;
- the required executable path is green; and
- no observed/current authorized blocker remains;

the default decision is STOP.
```

Implementation may reopen only from new current evidence:

```text
an observed defect;
a failing current executable path;
an accepted current-Horizon failure case;
a current consumer/invariant;
an explicit active-plan requirement.
```

The following do not reopen implementation by default:

```text
a newly imagined edge case;
theoretical non-perfect atomicity;
generic future-proofing;
generic robustness;
generic security;
a failure only inside the newly-added recovery mechanism;
recovery-of-recovery;
a failure-injection test with no accepted failure model;
a future consumer.
```

Required invariant:

```text
A completed fix does not authorize another hardening pass.
```

## 9.2 Update `docs/plans/README.md`

Future non-trivial plans must explicitly state:

```text
Current Horizon / maturity
Executable Truth target
Authorized failure classes
Explicit deferred failure classes
Complexity admission where applicable
Non-goals
Completion conditions
Reopen conditions
```

Replace vague use of `Stop conditions` with explicit completion/reopen semantics where appropriate.

Do not retrofit every completed historical plan.

Do not build a plan-lint framework.

---

# 10. Task 2 — Establish repository documentation architecture

Create:

```text
docs/engineering/repository/documentation-system.md
```

This is the canonical maintainer/Agent-facing definition of the repository knowledge architecture.

Use concise technical English.

It must define:

1. typed document Authority from §4.1;
2. README / INDEX / AGENTS semantics;
3. Architecture vs Specs boundary;
4. current truth vs historical records;
5. language policy;
6. canonical-fact ownership;
7. derived/reference material;
8. progressive disclosure;
9. Spec admission rule;
10. section migration classification from §6;
11. historical-link handling;
12. rule that current tree/docs describe present truth, not development provenance.

## 10.1 Historical links

When a current canonical file is removed/renamed:

- current standing docs link to the new canonical location;
- historical plans may retain an old path as historical text;
- if an old Markdown link would become broken but the old location itself is historically meaningful, convert it to code/plain historical text where appropriate;
- do not create redirect/stub documents merely to preserve PRE_PRODUCTION documentation paths.

No documentation compatibility shim is required for internal development history.

---

# 11. Task 3 — Establish `docs/specs/`

Create:

```text
docs/specs/
├── README.md
├── INDEX.md
├── core/
├── runtime/
├── execution/
└── data/
```

Do not create empty future-domain directories merely for symmetry.

Additional directories may be created only if current extracted Specs require them.

## 11.1 `docs/specs/README.md`

Define:

```text
purpose
scope
Spec admission
normative language
requirement IDs
recommended document structure
relationship to Architecture / Plans / Code / Qualification
what Specs do not own
```

Recommended Spec shape:

```text
# <Semantic Contract>

## Scope
## Ownership
## Invariants
## State Model          # only when applicable
## Operations           # only when applicable
## Lifecycle            # only when applicable
## Failure Semantics    # only when applicable
## Verification Claims  # only when useful
## References
```

Do not require empty headings.

## 11.2 `docs/specs/INDEX.md`

Use a compact table:

| Prefix | Spec | Purpose |
| ------ | ---- | ------- |

No long prose.

---

# 12. Task 4 — Derive current Specs from existing Architecture contracts

This is a semantic extraction, not a directory rename.

The existing:

```text
docs/architecture/contracts/**
```

must be dismantled by classification.

Do not preserve `S01`, `S02`, etc. as canonical contract identities unless the repository explicitly proves they are stable product identifiers rather than document ordinals.

Use semantic paths and requirement prefixes.

## 12.1 Required initial current Spec set

Derive the following where current implementation/current contracts support them.

### Core

```text
docs/specs/core/identity-generation.md
  prefix: ID

docs/specs/core/service-capability-readiness.md
  prefix: READY

docs/specs/core/contract-versioning.md
  prefix: VER
```

### Runtime

```text
docs/specs/runtime/bootstrap-closure.md
  prefix: BOOT

docs/specs/runtime/host-ownership.md
  prefix: HOST

docs/specs/runtime/runtime-supervision.md
  prefix: RT

docs/specs/runtime/maintenance-handoff.md
  prefix: MAINT
```

### Execution

```text
docs/specs/execution/work-item.md
  prefix: WI

docs/specs/execution/durable-dispatch.md
  prefix: DEX

docs/specs/execution/work-handler.md
  prefix: WH

docs/specs/execution/signal.md
  prefix: SIG

docs/specs/execution/time.md
  prefix: TIME

docs/specs/execution/execution-lineage.md
  prefix: LIN

docs/specs/execution/evidence.md
  prefix: EVID
```

### Data

```text
docs/specs/data/persistence-transactions.md
  prefix: PERSIST

docs/specs/data/canonical-schema.md
  prefix: SCHEMA
```

A listed target may be merged with another listed target only when the two contracts are genuinely inseparable and the resulting page remains narrowly consumable.

Do not merge them merely to reduce file count.

A listed target may be omitted only if section-level inventory proves there is no current normative contract for it. Record that reason in the migration ledger.

## 12.2 Do not prematurely Spec future systems

Do **not** automatically create current Specs for unimplemented/future design such as:

```text
advanced Configuration surfaces
future Secret lifecycle not currently implemented
full extension package lifecycle
future Messaging/Subject behavior
AI provider/model behavior
advanced Policy/Approval
full EffectOperation/H3B semantics
backup/restore product hardening
distribution/update product flows
resource-pressure system
advanced network/egress control
advanced cognition
Presentation
```

Their existing detailed content must be classified.

Current conceptual/future material returns to the appropriate human Architecture page.

Dependency choices return to Dependencies.

Evidence returns to Qualification.

Only currently normative pieces enter Specs.

---

# 13. Task 5 — Source-file migration waves

Process existing `docs/architecture/contracts/` in bounded waves.

Do not rewrite the entire directory in one uncontrolled edit.

## Wave A — Current executable Foundation

Process:

```text
startup-recovery-runtime-supervision.md
async-work-queue-durable-time.md
persistence-transactions-effect-fence.md
foundation-service-capability-readiness-catalog.md
execution-lineage-observability.md
evidence-replay-observability-content.md
foundation-cross-cutting-contracts.md
```

Primary extraction targets are the current Specs in §12.

Move only provider decisions to Dependencies.

Return design rationale/conceptual views to Architecture.

Future concerns remain Architecture.

## Wave B — Future/application contracts

Process:

```text
configuration-secret-management-surface.md
extension-package-trust-execution-domain.md
messaging-subject-chat-drivers.md
ai-capability-mcp.md
policy-approval-management-operator.md
reactor-context-prompt-research-integration.md
storage-workspace-data-lifecycle.md
backup-update-distribution-platform.md
```

Default expectation:

```text
mostly Architecture / Dependencies / Roadmap,
not current Specs
```

Do not convert detailed future design into immediate implementation contracts.

## Wave C — Cross-document views

Process:

```text
canonical-end-to-end-flows.md
verification-research-evaluation.md
```

`canonical-end-to-end-flows.md` primarily belongs to Architecture runtime/system views and may also reference Qualification claims.

`verification-research-evaluation.md` must not become a product Spec merely because it is called a contract. Separate:

```text
research/evaluation architecture
qualification/evidence rules
engineering procedure
```

into their real owners.

## Wave completion rule

For each source file:

1. inventory sections;
2. classify each section;
3. move/rewrite into canonical owner;
4. update incoming current links;
5. verify no unique current fact was lost;
6. delete the old source when no canonical content remains.

Do not leave migration stubs.

At the end:

```text
docs/architecture/contracts/
```

must no longer be a maintained current documentation layer.

Delete the empty directory if repository topology permits.

---

# 14. Task 6 — Normalize human Architecture

After normative extraction, revise Architecture pages so they become coherent conceptual documents rather than residual contract containers.

At minimum review:

```text
docs/architecture/README.md
docs/architecture/system-architecture.md
docs/architecture/authority-and-core-concepts.md
docs/architecture/execution-model.md
docs/architecture/foundation-services.md
docs/architecture/data-evidence-persistence.md
docs/architecture/execution-lineage.md
docs/architecture/configuration.md
docs/architecture/extensions.md
docs/architecture/management-authority.md
docs/architecture/messaging.md
docs/architecture/ai-runtime.md
docs/architecture/backup-portability-update-recovery.md
docs/architecture/platform-distribution.md
docs/architecture/research-subsystem-integration.md
```

Only touch pages affected by migrated facts.

Goals:

```text
human-readable conceptual flow
clear ownership
clear rationale
clear current vs future distinction
links to exact Specs instead of duplicating them
```

Do not perform a general architecture redesign.

Do not add product features.

Do not "complete" future architecture because migration exposed gaps.

---

# 15. Task 7 — Rebuild navigation

## 15.1 Architecture

Create:

```text
docs/architecture/INDEX.md
```

Move exhaustive reading/navigation lists out of `docs/architecture/README.md`.

Architecture README becomes explanatory.

Architecture INDEX becomes navigational.

## 15.2 Plans

Create:

```text
docs/plans/INDEX.md
```

Move the long Active/Completed/Superseded navigation list out of `docs/plans/README.md`.

`docs/plans/README.md` keeps:

```text
plan states
decision-completeness policy
plan authoring contract
completion/reopen requirements
```

`docs/plans/INDEX.md` owns plan navigation.

## 15.3 Packages

Keep:

```text
packages/INDEX.md
```

but compress it.

Each row should answer:

```text
package
semantic tags
short ownership summary
```

Detailed responsibility remains package README.

Do not duplicate multi-paragraph Architecture descriptions in the index.

## 15.4 Global docs index

Update:

```text
docs/INDEX.md
```

to include the new Specs entry and the final current documentation structure.

Keep it as the sole global current-doc navigation map.

Do not turn it into an architecture summary.

---

# 16. Task 8 — Normalize package README responsibility

Review package README files only where this migration changes their references or where they currently duplicate large canonical contract content.

Package README should primarily contain:

```text
Purpose
Owns
Does not own / boundary clarification where needed
Public surface
Dependencies / relationships
Architecture and Spec references
```

Package-local verification entry points MAY remain when they are factual and genuinely local.

Do not place repository-wide verification policy there.

Rewrite imperative architecture policy into explanatory boundary language when possible.

Example:

Prefer:

```text
Persistence is the canonical Host-fenced mutation boundary for this package.
```

over:

```text
Do not bypass Persistence.
Never use raw SQL.
Do not...
```

unless the negative form protects against an observed repeated violation.

Do not create per-package `AGENTS.md` files in this plan.

---

# 17. Task 9 — Rebuild root/doc/package AGENTS

There must remain exactly the currently justified scope-level instruction files:

```text
/AGENTS.md
/docs/AGENTS.md
/packages/AGENTS.md
```

Do not add nested AGENTS files in this plan.

## 17.1 Root `AGENTS.md`

Target design:

```text
small persistent bootloader
approximately 50–90 lines preferred
not enforced mechanically
```

Required content only:

### A. Task and Authority

- execute the explicitly named active plan;
- standing facts belong to their typed canonical owners;
- existing code/history does not acquire Authority by existence;
- unresolved non-trivial semantic choice = `PLAN_GAP`.

### B. Persistent repository invariants

Keep compact forms of:

```text
current tree represents present truth;
PRE_PRODUCTION development history creates no compatibility obligation;
canonical mutation stays behind its semantic owner;
new dependencies/subsystems require explicit authorization;
verification claims must match what actually ran.
```

### C. Procedural routing

State that an applicable repository Skill must be loaded when the task enters one of the specialized procedures defined under `.agents/skills/`.

Do not embed the full Skill procedures.

### D. Scope / review guard

Persist the high-value behavior:

```text
Current-stage value authorizes work; theoretical completeness does not.

F3/F4 default to DEFER unless explicitly authorized.

Failure-injection tests do not create product requirements.

Do not implement recovery-of-recovery or fallback chains by default.

A completed fix does not authorize another hardening pass.

Reopen implementation only from current evidence, an accepted failure case,
a current consumer/invariant, or an explicit plan requirement.

Fail-stop is a valid bounded outcome.
```

### Remove from root AGENTS

Move detailed procedure out of root:

```text
full PRE_PRODUCTION rewrite procedure
full mechanics lookup algorithm
full PR candidate lifecycle
full Independent Review explanation
full verification workflow
long F0-F4 explanation
long architecture explanation
long documentation rules
```

Their canonical owners/Skills must remain accessible.

## 17.2 `docs/AGENTS.md`

Keep concise documentation-scope behavior:

```text
one canonical home per fact
standing docs describe current truth
history belongs in historical classes
respect document-class ownership
README / INDEX / AGENTS roles
current links resolve
active plan rules
documentation-maintenance Skill trigger
```

Do not duplicate `documentation-system.md`.

## 17.3 `packages/AGENTS.md`

Keep concise package-scope behavior:

```text
read target package README
respect package ownership/dependency direction
cross-package Authority movement = PLAN_GAP unless planned
load mechanics-routing when generic mechanics appear
load applicable lifecycle/durable/preproduction Skill when triggered
run focused affected verification
```

Remove detailed duplicated mechanics procedure after the new Skill exists.

---

# 18. Task 10 — Replace topical Skills with procedural Skills

Delete the current architecture-topic Skill directories after their useful procedural content has been migrated:

```text
heptalogos-architecture
heptalogos-config-data
heptalogos-dependencies
heptalogos-extensions
heptalogos-interaction
heptalogos-management
heptalogos-runtime-durability
heptalogos-verification
```

Do not preserve them as aliases.

PRE_PRODUCTION internal Agent Skill names have no compatibility obligation.

Create exactly:

```text
.agents/skills/
├── scope-control/
│   └── SKILL.md
├── mechanics-routing/
│   └── SKILL.md
├── lifecycle-change/
│   └── SKILL.md
├── durable-state-change/
│   └── SKILL.md
├── preproduction-evolution/
│   └── SKILL.md
├── claim-verification/
│   └── SKILL.md
└── documentation-maintenance/
    └── SKILL.md
```

Do not add supporting references unless SKILL.md would otherwise become materially overloaded.

Progressive disclosure does not require artificial extra files.

## 18.1 Common Skill structure

Each Skill:

```text
---
name: <directory-name>
description: <precise trigger-oriented description>
---

# <Title>

## Trigger
## Required inputs
## Procedure
## Stop / escalation
## Output
```

Do not write architecture tutorials inside Skills.

Do not use Skills as broad document routers.

## 18.2 `scope-control`

Description must trigger on:

```text
new edge case
new resilience/security work
new recovery/fallback
new state
adjacent defect discovered during planned work
scope expansion
```

Procedure:

```text
read current plan scope
→ identify current consumer/invariant
→ classify failure class/present impact
→ inspect current fail-stop behavior
→ decide IMPLEMENT | DEFER | PLAN_GAP
→ return to original task
```

It must implement the Review Completion/Reopen Rule.

It must explicitly prevent recursive hardening.

## 18.3 `mechanics-routing`

Trigger on generic mechanics such as:

```text
parsing/schema
process
concurrency
retry/backoff/timeout
graph
state machine
disposal
queue/scheduler
serialization
database mechanics
observability
protocol/client mechanics
```

Procedure:

```text
identify semantic owner
→ search existing project owner/primitive
→ inspect adopted dependency route
→ use/extend existing owner
→ use adopted provider behind existing boundary
→ if provider role is unresolved or replacement is required: PLAN_GAP
```

Do not let the Coding Agent silently select a new foundational dependency.

## 18.4 `lifecycle-change`

Trigger on:

```text
start
stop
drain
dispose
quiesce
resume
fence
ownership loss
restart
generation transition
background task lifetime
```

Procedure must inspect:

```text
semantic owner
admission boundary
resource owner
Point of No Return if applicable
durable vs process-local responsibility
existing provider mechanics
current failure class
required proof
```

No new lifecycle framework.

## 18.5 `durable-state-change`

Trigger on:

```text
canonical schema
durable identity
persistent state
durable lifecycle state
transaction boundary
cross-process/cross-generation payload
```

Procedure must apply:

```text
semantic distinction test
Authority owner
current canonical shape
transaction/fence
versioning requirement
current compatibility obligation
restart significance
qualification requirement
```

Explicit rule:

```text
NEW STATE REQUIRES A NEW SEMANTIC DISTINCTION.
```

## 18.6 `preproduction-evolution`

Trigger on current internal contract/schema/API replacement.

Procedure:

```text
confirm CompatibilityEpoch = PRE_PRODUCTION
→ inspect declared compatibility obligations
→ define current canonical shape
→ update current callers/tests
→ rewrite development baseline where appropriate
→ reset/recreate project-owned development state
→ delete obsolete implementation
```

Do not create:

```text
legacy readers
compatibility shims
dual read/write
bridge migrations
fallback parsers
deprecated aliases
```

unless a declared current compatibility obligation explicitly requires them.

## 18.7 `claim-verification`

Trigger when the Agent is about to make a non-trivial evidence claim, especially:

```text
real PostgreSQL
real DBOS/provider
crash/restart
native OS
live protocol
shipping/source-less artifact
cross-platform behavior
```

Procedure:

```text
state exact claim
→ identify required proof level
→ identify actual executed boundary
→ run existing relevant scenario
→ record PASS | FAIL | NOT_RUN | BLOCKED
```

Mocks do not prove live behavior.

One OS does not prove another.

A source tree does not prove a source-less artifact.

Do not expand qualification scope merely to make the matrix look complete.

## 18.8 `documentation-maintenance`

Trigger when implementation or governance work changes a standing fact or documentation topology.

Procedure:

```text
classify fact
→ identify canonical document class
→ update canonical owner
→ update affected projections/links
→ update INDEX where navigation changes
→ preserve current-vs-history separation
→ run documentation checks
```

It must reference the repository documentation system rather than reproducing it.

---

# 19. Task 11 — Remove the old Skill/Cursor-style routing layer

After the new Skills and docs navigation work:

delete:

```text
.agents/heptalogos/corpus-routes.json
```

Remove code whose primary purpose is validating topic-to-Corpus routing.

Delete/replace topic-routing test cases such as:

```text
configuration prompt → config-data Skill
messaging prompt → interaction Skill
Host prompt → runtime Skill
```

Do not preserve a compatibility route manifest.

The new knowledge-discovery paths are:

```text
docs/INDEX.md
→ local INDEX.md
→ canonical document
```

and procedural routing is:

```text
Skill metadata
→ SKILL.md
```

Do not add another routing manifest between them.

---

# 20. Task 12 — Simplify Agent validation instead of replacing it with a framework

Current repository already has:

```text
pnpm check:agents
pnpm check:documentation
```

Reuse these entry points.

Do not add a new validation framework or external dependency.

## 20.1 `check:agents`

Refactor existing Agent validation to mechanically check only objective properties such as:

```text
every .agents/skills/* directory has SKILL.md
frontmatter is parseable using existing repository facilities
frontmatter name matches directory name
description is present
Skill-local referenced files exist
deprecated topical Skill directories are absent after migration
corpus-routes.json is absent after migration
```

Do not implement semantic grading of Skill prose.

Do not enforce line counts.

Do not implement an automatic "Skill quality score".

The validator may move to a repository-consistent verification location if that simplifies topology, but do not create parallel implementations.

## 20.2 `check:documentation`

Extend existing documentation validation only where the new structure creates objectively checkable invariants.

Required:

```text
current local Markdown links resolve
INDEX entries resolve through normal Markdown links
current Spec requirement IDs are unique
Spec prefixes are unique
```

If requirement-ID validation can be added as a small extension to the existing documentation validator, do so.

If it would require a new parser/framework/dependency, report the check as intentionally manual rather than building infrastructure.

Do not create:

```text
AGENTS line-count lint
README quality lint
negative-sentence lint
semantic document-class classifier
automatic architecture/spec classifier
freshness daemon
documentation dependency graph engine
```

---

# 21. Task 13 — Reconcile Dependencies, Qualification, Roadmap, and references

After deleting `architecture/contracts/`, search the entire maintained current tree for references to it.

Classify every reference.

## 21.1 Dependencies

Provider/mechanics decisions must link to the applicable Architecture/Spec without duplicating their semantics.

Do not reopen provider selection.

This plan authorizes no new external dependency.

## 21.2 Qualification

Current qualification may reference Spec requirement IDs where that materially improves claim traceability.

Do not rewrite all historical evidence to use new IDs.

Current claims must link to current canonical contracts where appropriate.

Historical records may preserve historical names/paths as history.

## 21.3 Roadmap

Update only for:

```text
H3A-2 closure truth
active plan path
knowledge/Harness convergence status where repository work is tracked
```

Do not advance H3B/H3-S/H4/H6 implementation.

Preserve the product-development ratchet:

```text
working Product Spine
→ real consumer exposes missing capability
→ implement smallest necessary Foundation support
→ Product Spine remains green
→ continue
```

## 21.4 Reference search

Search at least:

```text
docs/**
packages/**
.agents/**
scripts/**
package.json
repository project configuration
```

for:

```text
architecture/contracts
old S01/S02/... contract identities where used as navigation identity
heptalogos-architecture
heptalogos-config-data
heptalogos-dependencies
heptalogos-extensions
heptalogos-interaction
heptalogos-management
heptalogos-runtime-durability
heptalogos-verification
corpus-routes
old topic-routing tests
```

Current executable/tooling references must be updated or removed.

Historical prose may retain old names only where clearly historical and not used as a current route.

---

# 22. Task 14 — Positive-first instruction normalization

Review only touched/current Agent-facing documents:

```text
AGENTS files
new Specs
new Skills
documentation-system.md
directly migrated package README sections
```

Rewrite instruction shape toward:

```text
desired action
→ owner/route
→ stop/escalation condition
```

Use ownership tables and transition sequences where they are denser than repeated prohibitions.

Do not perform a repository-wide prose rewrite unrelated to this migration.

Do not erase high-value negative constraints protecting against known repeated failures.

---

# 23. Task 15 — Harness behavior evaluation

Do not turn model behavior evaluation into deterministic unit tests.

After structural migration, manually exercise representative Coding-Agent scenarios if the current execution environment supports such evaluation.

At minimum reason through/document the expected routing for these cases:

### Case 1

```text
"I fixed the planned shutdown bug and found another rare race in cleanup."
```

Expected:

```text
scope-control
→ classify F3 unless current evidence says otherwise
→ DEFER
→ do not reopen implementation
```

### Case 2

```text
"Add a local retry/backoff helper for startup."
```

Expected:

```text
mechanics-routing
possibly scope-control
→ inspect existing owner/provider first
```

### Case 3

```text
"Change the canonical WorkItem durable shape."
```

Expected:

```text
durable-state-change
+ preproduction-evolution when replacing current PRE_PRODUCTION shape
```

### Case 4

```text
"This in-memory test passed. Can we claim crash recovery?"
```

Expected:

```text
claim-verification
→ reject unsupported evidence claim
```

### Case 5

```text
"Implementation changed a normative WorkItem invariant."
```

Expected:

```text
documentation-maintenance
→ update canonical Spec
```

### Case 6

```text
"Add stop/drain/dispose tracking around this runtime."
```

Expected:

```text
lifecycle-change
+ mechanics-routing
```

### Case 7

```text
"The adopted provider lacks the needed primitive; add another library."
```

Expected:

```text
mechanics-routing
→ existing route hard blocker evidence
→ PLAN_GAP
```

unless the active plan explicitly authorizes provider reopening.

### Case 8

```text
ordinary narrow code change with no specialized procedural trigger
```

Expected:

```text
do not load random domain Skills
```

No test should assert:

```text
topic X must route to domain Skill Y
```

because domain Skills no longer exist.

---

# 24. Required implementation sequence

Execute in this order.

```text
P0  Activate this plan and supersede old active plan.

P1  Task 0:
    bounded H3A-2 candidate closure.
    STOP runtime review when closure conditions pass.

P2  Task 1:
    operational Review Completion / Reopen Rule.
    update future plan authoring contract.

P3  Task 2:
    establish documentation-system Authority.

P4  Task 3:
    create docs/specs foundation.

P5  Task 4 + Task 5 Wave A:
    derive current executable-Foundation Specs.

P6  Task 5 Wave B/C + Task 6:
    re-home future/conceptual Architecture and remove old contract layer.

P7  Task 7 + Task 8:
    rebuild navigation and normalize affected package README content.

P8  Task 9 + Task 10:
    shrink AGENTS and replace topical Skills with procedural Skills.

P9  Task 11 + Task 12:
    remove corpus routing infrastructure and simplify validators.

P10 Task 13 + Task 14:
    reconcile links/Authority and normalize touched Agent-facing prose.

P11 Task 15:
    Harness behavior evaluation.

P12 Full final verification.

STOP.
```

Do not interleave future product feature implementation.

---

# 25. Verification strategy

## 25.1 During editing

Run focused checks appropriate to each wave.

For documentation/navigation changes:

```text
pnpm check:documentation
```

For Skill/Harness changes:

```text
pnpm check:agents
```

For current-tree/provenance cleanup:

```text
pnpm check:hygiene
```

Use formatter/lint checks as required by repository conventions.

## 25.2 After runtime changes in Task 0

If Task 0 changes runtime source:

1. run focused affected package tests;
2. run the existing relevant H3A-2 process-level PostgreSQL/DBOS qualification;
3. do not invent additional rare-failure scenarios.

## 25.3 Final repository verification

At final stable diff run the existing permanent gates, including:

```text
pnpm check:agents
pnpm check:documentation
pnpm check:hygiene
pnpm check:repository
pnpm verify
```

If repository configuration makes one command a subset of `pnpm verify`, duplicate execution is not required merely for ceremony; preserve the repository's actual verification contract.

Report exactly:

```text
PASS
FAIL
NOT_RUN
BLOCKED
```

Do not convert NOT_RUN/BLOCKED into PASS.

---

# 26. Mandatory final repository-state checks

Before completion, verify all of the following.

## 26.1 Documentation topology

```text
docs/specs/ exists and is navigable.
docs/specs/README.md defines Spec semantics.
docs/specs/INDEX.md is compact navigation.
docs/architecture/INDEX.md exists.
docs/plans/INDEX.md exists.
docs/INDEX.md routes to Specs.
```

## 26.2 Old contract layer

```text
docs/architecture/contracts/
```

is no longer a maintained current canonical layer.

No current navigation points to it.

No migration stubs exist solely for compatibility.

## 26.3 AGENTS

Exactly the justified scope-level Agent files remain:

```text
/AGENTS.md
/docs/AGENTS.md
/packages/AGENTS.md
```

No nested proliferation was introduced.

Root AGENTS is a persistent execution map/guard, not an encyclopedia.

## 26.4 Skills

Exactly these first-generation procedural Skills exist:

```text
scope-control
mechanics-routing
lifecycle-change
durable-state-change
preproduction-evolution
claim-verification
documentation-maintenance
```

The old eight `heptalogos-*` topical Skills are gone.

## 26.5 Old routing infrastructure

No current:

```text
corpus-routes.json
topic → domain Skill route table
topic-routing test suite
```

remains.

## 26.6 Present truth

Current source/docs/Harness contain no development-phase compatibility residue introduced merely to preserve the previous layout.

Do not retain:

```text
old/new aliases
legacy Skill aliases
contract path shims
dual documentation routes
fallback route parsing
```

for this migration.

## 26.7 Product semantics

No product semantic change occurred during PART B.

If a semantic change was necessary, it must have been separately authorized by the plan or reported as `PLAN_GAP`.

---

# 27. Completion criteria

This plan is complete only when all are true.

### H3A-2 closure

- no observed/current authorized F0-F2 blocker remains;
- existing required executable Foundation proof is green;
- current qualification truth is internally consistent;
- no speculative F3/F4 hardening was added.

### Knowledge architecture

- each maintained fact class has a clear canonical owner;
- current Architecture is conceptual/human-readable;
- current normative Foundation contracts needed by current implementation are represented as Specs;
- future design was not accidentally promoted into present implementation requirements;
- `architecture/contracts/` no longer functions as a mixed-content canonical layer.

### Navigation

- README / INDEX / AGENTS responsibilities are visibly separated;
- global/local navigation resolves;
- package INDEX is concise;
- plans README no longer doubles as the exhaustive plan index.

### Agent Harness

- root AGENTS is concise and persistent;
- Skills are procedural rather than topical;
- context is progressively disclosed;
- scope-control operationalizes completion/reopen behavior;
- PRE_PRODUCTION compatibility cleanup is available on demand;
- mechanics-routing protects Library-First;
- claim-verification protects evidence truth.

### Tooling

- old Corpus routing machinery is removed;
- existing validation entry points are reused;
- only objective structural properties are automated;
- no governance meta-framework was created.

### Repository gates

- required current checks PASS;
- NOT_RUN/BLOCKED claims remain honestly recorded.

---

# 28. Completion / reopen rule

When §27 is satisfied:

```text
STOP.
```

Do not begin:

```text
another documentation taxonomy optimization pass
another Skill taxonomy pass
another AGENTS compression pass
another architecture completeness pass
another resilience review
H3-S implementation
H3B implementation
H4 implementation
H6 implementation
```

inside this plan.

This closed scope may reopen only with new concrete evidence such as:

```text
a broken current navigation path;
a duplicate/contradictory current Authority fact;
a Coding-Agent task that cannot locate the required current contract;
a repeated real Agent failure not handled by the new procedural Harness;
a failing existing repository validation;
a real product consumer exposing a missing Spec/procedure;
an explicit subsequent active plan requirement.
```

The following are not reopen evidence:

```text
"this could be even cleaner"
"we could add another Skill"
"we could formalize this more"
"another metadata field might help"
"another validator would be safer"
"another edge case could exist"
"future H6 might need it"
```

The default post-completion decision is:

```text
use the new system for real product development
and let real consumers reveal the next missing capability.
```

---

# 29. Explicit non-goals

This plan does not authorize:

```text
new product features
new Foundation services
new external dependencies
provider replacement
DBOS replacement
Cordis replacement
XState replacement
PostgreSQL replacement

Host ownership redesign
Bootstrap redesign
WorkQueue redesign
runtime lifecycle redesign

full H3-S implementation
H3B EffectOperation implementation
H4 provider implementation
H5 implementation
H6 Subject vertical slice implementation

ADR system
documentation database
knowledge graph
RAG system
vector index
doc-generation framework
AGENTS generator
Spec generator
Skill generator
semantic documentation linter
automatic Skill router
freshness daemon
GitHub Actions enablement
```

If implementation starts moving toward one of these, stop and return to the authorized task.

---

# 30. Final implementation report

On completion, report using exactly these sections:

## 1. H3A-2 bounded closure

```text
findings admitted
findings deferred
runtime changes, if any
executable proof result
```

## 2. Knowledge architecture

```text
new document classes/paths
Architecture changes
Specs created
old contract layer removed
```

## 3. Harness

```text
AGENTS changes
new procedural Skills
old topical Skills removed
old routing infrastructure removed
```

## 4. Navigation

```text
README/INDEX changes
package navigation changes
plan navigation changes
```

## 5. Verification

For every executed command:

```text
command
result: PASS | FAIL | NOT_RUN | BLOCKED
```

## 6. Deferred / PLAN_GAP

List only concrete unresolved items.

Do not append speculative improvement ideas.

## 7. Closure verdict

Exactly one:

```text
PLAN COMPLETE
```

or:

```text
PLAN BLOCKED
```

If complete, do not propose another hardening pass.

---

# Execution Appendix

## Task 0 — bounded H3A-2 closure

### Findings

| Target                               | Classification                    | Decision    | Evidence                                                                                                                                                                                              |
| ------------------------------------ | --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T0-A executable proof path fidelity  | Current F0 evidence-path mismatch | FIXED       | The Foundation spine support path no longer calls `durableDispatch.dispatch()` directly after starting reconciliation; the existing WorkQueue Signal/reconciliation path now performs the projection. |
| T0-B qualification truth consistency | Current evidence distinction      | RECONCILED  | The existing terminal-commit/restart scenario ran successfully and is recorded as current H3A2 `PASS`; the H3A1-scoped DBOS checkpoint property remains `NOT_RUN`.                                    |
| T0-C actual current blockers         | No observed blocker               | STOP REVIEW | The existing Foundation spine and durable recovery scenarios passed; no additional runtime finding was admitted.                                                                                      |

### Executed Task 0 verification

```text
pnpm nx run bootstrap-runtime:test:foundation-spine
result: PASS — 1 file, 2 tests; real PostgreSQL/DBOS process-level boot/work/stop and same-Instance restart

pnpm nx run bootstrap-runtime:test:durable-recovery-process
result: PASS — 1 file, 8 tests; existing process recovery matrix including terminal-commit restart
```

No product runtime source or dependency changed in Task 0. The only implementation change was the test-support composition required by T0-A. F3/F4, power-loss, source-less, service/headless, and new crash scenarios remain deferred.

## Migration ledger

| Source                                                              | Section / fact                          | Classification                                 | Canonical target                                                    | Action                                                                               | Status    |
| ------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------- |
| `docs/architecture/contracts/`                                      | current executable Foundation contracts | CURRENT_SPEC                                   | `docs/specs/**`                                                     | Extract semantic contracts and stable requirement IDs                                | COMPLETED |
| `docs/architecture/contracts/`                                      | future/application design               | FUTURE_DESIGN                                  | `docs/architecture/**` / `docs/dependencies/**` / `docs/roadmap/**` | Re-home affected current pages; keep future material non-normative                   | COMPLETED |
| `docs/architecture/contracts/`                                      | qualification and research rules        | QUALIFICATION_EVIDENCE / ENGINEERING_PROCEDURE | `docs/qualification/**` / `docs/engineering/**`                     | Remove mixed contract presentation and retain evidence in its owner                  | COMPLETED |
| `AGENTS.md` and topical Skills                                      | persistent execution policy / procedure | ENGINEERING_PROCEDURE                          | root scope files and `.agents/skills/**`                            | Shrink AGENTS and replace topical routing with procedural Skills                     | COMPLETED |
| `docs/README.md`, `docs/INDEX.md`, Architecture and plan navigation | current documentation topology          | ENGINEERING_PROCEDURE                          | `docs/**/README.md`, `docs/**/INDEX.md`                             | Separate explanation, navigation, and persistent instructions; resolve current links | COMPLETED |
| `packages/*/README.md`, `packages/INDEX.md`                         | package ownership navigation            | ENGINEERING_PROCEDURE                          | package READMEs and generated package index                         | Normalize affected architecture references and compact the generated projection      | COMPLETED |
| old routing manifest, topic-routing tests, and validator            | Agent Harness routing/validation        | ENGINEERING_PROCEDURE                          | `scripts/verify/agents.mjs`, procedural Skills                      | Remove topic routing and retain objective structural checks                          | COMPLETED |

## Task 15 — Harness behavior evaluation

The eight representative prompts were manually reasoned against the resulting
procedural routes. No deterministic model-behavior test was added.

| Case                                                 | Route                                              | Expected decision                                                        |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| rare cleanup race after a planned fix                | `scope-control`                                    | classify F3 unless current evidence admits it; `DEFER`, do not reopen    |
| local startup retry/backoff helper                   | `mechanics-routing` + `scope-control`              | inspect the existing owner/provider before implementation                |
| canonical WorkItem durable-shape change              | `durable-state-change` + `preproduction-evolution` | apply owner, transaction, compatibility, reset, and obsolete-shape rules |
| in-memory test offered as crash-recovery proof       | `claim-verification`                               | reject the unsupported claim and require process-level evidence          |
| normative WorkItem invariant changed                 | `documentation-maintenance`                        | update the canonical Spec and affected projections                       |
| runtime stop/drain/dispose tracking                  | `lifecycle-change` + `mechanics-routing`           | route lifecycle ownership and generic mechanics before coding            |
| adopted provider lacks a needed primitive            | `mechanics-routing`                                | use `PLAN_GAP` unless provider reopening is explicitly authorized        |
| ordinary narrow change without a specialized trigger | no procedural Skill                                | continue without loading a random domain Skill                           |
