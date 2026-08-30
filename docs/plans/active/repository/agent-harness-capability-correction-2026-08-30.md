# Heptalogos Agent Harness Capability Correction & Documentation Retrieval Convergence

**Plan date:** 2026-08-30  
**Status:** ACTIVE  
**Plan class:** repository knowledge / Coding-Agent Harness correction  
**Product Horizon:** unchanged; no product-stage advancement  
**Canonical active path:** `docs/plans/active/repository/agent-harness-capability-correction-2026-08-30.md`

---

# 0. Executor Contract

This plan corrects the already-executed **Repository Knowledge Architecture & Coding-Agent Harness Convergence** work.

The previous execution produced useful structural results, but its Agent Harness acceptance is rejected. Preserve the accepted work and correct the failed design assumptions. This is not a request to redo the repository from scratch.

The implementation order and design decisions below are authoritative for this correction.

The Coding Agent receives an approved plan and executes it. Repository Skills exist to improve **implementation-time engineering behavior**. Plan authoring, roadmap decisions, independent code review, candidate lifecycle management, and release/merge orchestration remain external supervisory work and are not converted into Coding-Agent Skills.

The correction is repository/Harness work. Product runtime semantics are frozen for this plan.

If a required change would alter product semantics, Foundation lifecycle semantics, durable state semantics, or an adopted provider decision beyond what this plan explicitly authorizes, report:

```text
PLAN_GAP
```

with the smallest unresolved semantic decision and the evidence that exposes it.

GitHub Actions remain disabled. Use the repository's local verification entry points.

---

# 1. Why This Correction Exists

The previous convergence plan encoded several design mistakes. These mistakes are now **observed project knowledge** and MUST be recorded, corrected, and converted into durable repository guidance where they remain generally applicable.

Do not treat this section as temporary chat context.

## 1.1 Observed Harness failures

### HF-01 — Skill taxonomy was frozen into a closed enumeration

The previous plan specified an exact Skill count and the implementation encoded the list into `scripts/verify/agents.mjs`.

That converts one migration snapshot into a permanent architectural restriction.

Correct principle:

> Repository Skills are an open-ended procedural capability set. A new Skill is justified by a recurring implementation-time engineering activity that benefits from specialized procedure. Skill count is an outcome, not an invariant.

The validator must never reject a valid Skill merely because its name was not known when the validator was written.

---

### HF-02 — Deleted migration objects were preserved as validation knowledge

The validator retains names of removed Skills and removed routing artifacts so that their absence can be checked permanently.

That preserves development history inside current executable tooling.

Correct principle:

> Once a PRE_PRODUCTION internal artifact is removed and no current semantic obligation refers to it, current validators do not retain its identity as a tombstone. Git and historical plans preserve chronology.

One-time migration checks may exist while the migration is active. They are removed when the migration closes.

---

### HF-03 — “Procedural Skill” was implemented as a short checklist

Several current Skills contain only a trigger, a few nouns, a short sequence, and `IMPLEMENT / DEFER / PLAN_GAP / STOP`.

The hard part is not remembering those labels. The hard part is making the classification correctly under pressure from model defaults such as completeness, maintenance conservatism, recovery hardening, and test expansion.

Correct principle:

> A Skill is useful only when it materially improves the Agent's ability to perform the specialized engineering activity. It must contain enough decision procedure, examples, failure modes, and operational detail to change behavior.

A complex Skill may be long. It may contain `references/`, decision tables, casebooks, templates, scripts, or worked examples. A simple Skill may remain short.

There is no global Skill body-size target.

---

### HF-04 — Uniform Skill shape was treated as a design goal

The previous plan prescribed nearly identical sections for every Skill.

Correct principle:

> Skill structure follows the problem. Only platform-required metadata and mechanically useful structural constraints are standardized. The body is optimized for the engineering procedure it must teach.

A decision-heavy Skill may use flowcharts and casebooks. A command-heavy Skill may use scripts. A migration Skill may use ordered checklists. A narrow lookup Skill may be brief.

---

### HF-05 — Persistent anti-inertia rules were over-compressed and duplicated

The root `AGENTS.md` became shorter, but some project-wide rules were duplicated in scoped AGENTS files, while some high-value anti-inertia behavior was reduced to shorthand.

Correct principle:

> `AGENTS.md` is the minimum **complete** persistent behavior context, not the minimum number of lines.

Rules that must influence almost every Coding-Agent session, especially rules that counter repeated model defaults, belong once in the narrowest always-loaded scope that covers them.

Scoped AGENTS files add only subtree-specific behavior. They do not restate root rules.

---

### HF-06 — INDEX was optimized for compactness instead of retrieval

Current indexes were shortened into small labels, terse purposes, semantic tags, and in at least one case truncated package descriptions.

A reader who does not already know the repository cannot reliably decide which target to open.

Correct principle:

> An INDEX is a retrieval surface. Optimize for retrieval accuracy and low search cost, not minimum word count.

An index entry must contain enough semantic context for a reader to decide whether the target answers the current question without first opening every candidate.

INDEX may be detailed. It must not duplicate the full canonical content.

---

### HF-07 — “High-density technical English” was misread as shorthand

Dense Agent-facing prose was sometimes compressed into project-local labels such as `F3`, `STOP`, `PLAN_GAP`, owner names, or terse tags without enough explanation for a fresh Agent.

Correct principle:

> High density means high decision-relevant information per sentence, not low token count.

A fresh Agent must be able to understand the rule from the text plus linked canonical definitions. Codes and requirement IDs are indexing aids, not substitutes for semantics.

---

### HF-08 — Harness evaluation checked routing rather than capability

The previous Harness evaluation mostly reasoned:

```text
prompt → expected Skill route
```

This verifies discoverability, not whether the loaded Skill can produce the right engineering decision.

Correct principle:

> Harness evaluation must test the complete behavior chain: trigger → information acquisition → reasoning procedure → decision → stop/escalation behavior.

A Skill that routes correctly but still lets the Agent over-engineer is a failed Skill.

---

### HF-09 — Over-completion and recursive hardening remain insufficiently modeled

The project has repeatedly observed a model tendency:

```text
fix current problem
→ discover adjacent theoretical problem
→ add defense
→ add test for defense
→ discover failure in defense
→ add recovery
→ add recovery for recovery
→ expand lifecycle/state space
```

Correct principle:

> Current product value, current consumers, accepted failure models, and approved plan scope determine implementation authority. Completion of the approved acceptance condition closes the work unless new admissible evidence reopens it.

This is a persistent Agent-inertia issue and must be represented both in root persistent context and in sufficiently capable procedural Skills.

---

### HF-10 — PRE_PRODUCTION maintenance conservatism remains a persistent model risk

Coding Agents strongly tend to preserve old schemas, aliases, parsers, names, fallback paths, and compatibility bridges even when the project has no compatibility obligation.

Correct principle:

> In `CompatibilityEpoch = PRE_PRODUCTION`, undeclared internal development history does not create compatibility work. Rewrite the current shape, update current consumers, reset project-owned development state where appropriate, and remove obsolete paths.

This rule remains persistent because the model default is strong and repeatedly harmful in this project.

---

# 2. Accepted Results from the Previous Work

Preserve these results unless this plan identifies a concrete defect in them:

1. H3A-2 bounded runtime closure is complete.
2. The real Foundation executable-spine proof is not reopened by this plan.
3. `docs/specs/` as the current normative implementation-contract layer is retained.
4. Human conceptual Architecture remains distinct from current normative Specs.
5. Typed document Authority remains the documentation model.
6. README / INDEX / AGENTS retain separate semantic roles.
7. The old topic-router Skill model remains retired.
8. The old Corpus routing manifest remains retired.
9. Current plans, qualification, Architecture, Specs, dependencies, and historical records remain separate information classes.

This plan may correct **how those ideas were implemented**, especially the Skill system, indexes, AGENTS layering, validators, and Spec currentness.

---

# 3. Required Durable Records

The feedback in §1 must not disappear when this plan is completed.

Create or substantially rewrite:

```text
docs/engineering/repository/agent-harness-design.md
```

This becomes the canonical explanation of the Coding-Agent Harness.

It must record the generalized, current lessons from §1 without preserving obsolete migration object names as permanent current-tree trivia.

At minimum it owns:

- purpose of repository Skills;
- distinction between persistent instructions and on-demand procedures;
- open-ended Skill evolution;
- Skill admission criteria;
- Skill capability expectations;
- progressive disclosure;
- known Agent inertia patterns;
- behavior-coverage model;
- high-density Agent-facing writing guidance;
- Harness capability evaluation;
- relationship between AGENTS, Skills, Specs, Plans, code, and evidence.

Also update:

```text
docs/engineering/repository/documentation-system.md
```

to correct INDEX and Agent-facing density guidance.

Historical specifics of why this correction was required remain in this plan after completion.

---

# 4. Repository Context Model

The target Coding-Agent context model is:

```text
persistent repository instructions
        ↓
approved active plan
        ↓
target package / local navigation
        ↓
relevant current Specs
        ↓
applicable procedural Skill(s)
        ↓
implementation + focused verification
```

Human conceptual Architecture is loaded when needed for semantic context, cross-domain understanding, or an explicitly authorized architecture change.

The normal Coding Agent does not need to reread the entire project Corpus for every code change.

---

# 5. AGENTS Architecture — Minimum Complete Persistent Context

## 5.1 Root AGENTS owns repository-wide persistent behavior

Rewrite `/AGENTS.md` around **behavioral completeness**, not an arbitrary line-count goal.

It must contain each repository-wide rule exactly once.

The final root file must make the following behavior unambiguous to a fresh Coding Agent.

### A. Work authorization

- Execute the explicitly named approved active plan.
- The plan authorizes current work; it does not silently redefine standing semantics.
- A non-trivial missing semantic decision, unauthorized boundary movement, or unresolved Authority conflict is `PLAN_GAP`.
- Do not choose a different plan by recency, filename, convenience, or perceived completeness.

### B. Current Horizon and product-value discipline

Persist the project's strongest anti-overengineering rule in self-contained language:

> Implement what the current plan, current consumer, current executable path, and accepted failure model require. Future usefulness or theoretical completeness does not independently authorize current implementation.

Also persist:

> A completed acceptance condition closes the current change. New implementation work requires new admissible current evidence.

This rule must be understandable without already knowing the project's prior conversations.

### C. Executable Truth and product-spine priority

Persist the concept that component correctness and architectural elegance do not substitute for a working executable path.

Foundation growth must serve an existing executable path or real current consumer.

### D. PRE_PRODUCTION evolution

Persist:

- `CompatibilityEpoch = PRE_PRODUCTION`;
- declared compatibility obligations are the only compatibility authority;
- internal development history does not create compatibility work;
- current executable names and structures express present semantics;
- obsolete internal paths are rewritten/removed rather than preserved as legacy aliases or fallback formats.

This must remain explicit because Coding Agents have a strong compatibility-preservation default.

### E. Semantic ownership and Library-First

Persist:

- semantic owners remain singular;
- canonical mutation goes through the owning boundary;
- generic mechanics use the adopted project primitive/provider route;
- new foundational dependencies or duplicate mechanics require explicit authorization.

The full lookup/evaluation algorithm belongs in Skills/docs, not root AGENTS.

### F. Complexity admission

Persist self-contained versions of the following:

- new persistent/product state requires a real new semantic distinction;
- resilience complexity requires a current failure model;
- security complexity requires a current threat;
- failure-injection tests do not independently create product architecture;
- bounded fail-stop/fencing is a valid current outcome when it preserves canonical truth;
- recovery does not automatically authorize recovery-of-recovery;
- a fix does not automatically authorize another hardening pass.

### G. Evidence truth

Persist:

- `PASS | FAIL | NOT_RUN | BLOCKED`;
- claims match what actually ran;
- mock evidence does not become live evidence;
- one platform does not prove another platform;
- source-tree execution does not prove a source-less product artifact.

### H. Skill use

State that repository Skills provide on-demand specialized implementation procedures and must be loaded when their metadata trigger matches the engineering activity.

Do not enumerate a fixed Skill inventory in root AGENTS.

### I. Current repository execution policy

Retain current project-wide rules such as disabled ordinary GitHub Actions only if they remain current operational policy.

---

## 5.2 `docs/AGENTS.md` is documentation-only delta

Rewrite `docs/AGENTS.md` so it adds only behavior unique to `docs/**`.

It may contain:

- one canonical home per current fact;
- README / INDEX / AGENTS / Spec responsibilities;
- current vs historical documentation behavior;
- current link integrity;
- documentation-specific filename/navigation behavior;
- derived-projection maintenance;
- documentation-specific verification entry points.

Remove restatements of root rules such as generic `PLAN_GAP`, global evidence states, global PRE_PRODUCTION policy, generic Skill usage, or global present-truth language when the root already covers them.

It may link to the root or canonical governance document instead of repeating it.

---

## 5.3 `packages/AGENTS.md` is package-workspace-only delta

Rewrite `packages/AGENTS.md` so it adds only behavior unique to work under `packages/**`.

It may contain:

- read the target package README before editing;
- use `packages/INDEX.md` for cross-package discovery;
- respect package ownership and dependency direction;
- update package public-surface documentation when relevant;
- package/module documentation expectations;
- package-focused verification expectations.

Do not restate global scope, compatibility, evidence, or generic mechanics policy.

---

## 5.4 No forced AGENTS scarcity rule

Do not encode “exactly three AGENTS files” into validators or governance.

Current scoped files may remain the only ones because they are presently sufficient.

A future subtree may gain an AGENTS file if it genuinely needs persistent behavior different from its parent scope.

The criterion is semantic need, not a fixed count.

---

# 6. Skill System — Open Procedural Capability Set

## 6.1 Skill admission rule

A repository Skill is justified when all of the following are true:

1. the activity occurs during Coding-Agent implementation work;
2. the activity is repeatable or predictably recurring;
3. correct execution requires non-trivial procedure, judgment, or project-specific engineering knowledge;
4. progressive disclosure provides value compared with keeping the full procedure permanently in AGENTS;
5. the Skill changes likely Agent behavior rather than merely routing to documentation.

A subsystem, package, or topic does not justify a Skill by itself.

There is no fixed maximum or target Skill count.

---

## 6.2 Skill body design

Only platform-required metadata is structurally mandatory:

```yaml
---
name: ...
description: ...
---
```

The body format is selected for the problem.

Examples:

- decision-heavy Skill → decision tables, flow diagrams, worked cases;
- migration Skill → ordered transformation procedure and cleanup checklist;
- verification Skill → claim/evidence matrix;
- mechanics Skill → lookup sequence and provider-routing examples;
- complex high-risk Skill → `references/` casebook and detailed decision aids;
- scriptable procedure → `scripts/`.

Do not enforce a common heading template.

Do not enforce a word budget.

Do not require every Skill to have supporting files.

Do not prevent supporting files when they materially improve the Skill.

---

## 6.3 Skill description quality

`description` is the discovery trigger.

It must use plain technical English and identify the concrete engineering activity that should load the Skill.

Avoid descriptions that require project-internal shorthand to understand.

Good:

> Use when adding or changing retry, recovery, fallback, restart, compensation, failover, or self-healing behavior, especially when a failure handler begins to create additional states or recovery layers.

Weak:

> Use for F2/F3 recovery changes.

---

# 7. Required Skill Capability Work

The current Skill directories are starting points, not a closed set.

This plan requires deepening existing capabilities and adding the missing development-time capabilities already justified by observed project failures.

Future Skills remain allowed without editing a central allow-list.

---

## 7.1 `scope-control` — rebuild as a real admission engine

This is a high-priority, high-detail Skill.

Its purpose is to stop incidental findings from silently expanding an approved implementation task.

The Skill must contain enough material to let a fresh Agent classify difficult cases.

### Required decision sequence

For every incidental finding:

```text
1. State the current approved task.
2. State its acceptance condition.
3. Identify the concrete current consumer or invariant.
4. Identify the evidence for the new finding.
5. Determine whether the finding is on a normal/current executable path.
6. Determine the accepted failure class.
7. Determine current behavior if deferred.
8. Determine whether canonical truth / Authority remains safe.
9. Estimate semantic/architectural cost of fixing it.
10. Decide IMPLEMENT | RECORD/DEFER | PLAN_GAP.
11. Return to the original task.
12. When the acceptance condition is green, STOP unless new admissible evidence reopens it.
```

### Required distinction examples

The Skill must explicitly teach at least these distinctions:

| Finding                                                                              | Default decision rationale                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| normal executable path is broken                                                     | current defect; implementation admission                                     |
| common shutdown/startup operation actually hangs                                     | current operational defect                                                   |
| obvious normal-input null/validation bug discovered adjacent to the change           | ordinary correctness defect; may be admitted if inside task semantics        |
| rare scheduler interleaving imagined after the fix                                   | usually deferred rare timing failure                                         |
| recovery cleanup itself can fail only after first recovery already failed            | recovery-of-recovery; normally deferred                                      |
| new failure-injection test exposes an unmodeled rare case                            | classify the product failure first; the test does not authorize architecture |
| fix meets acceptance criteria but a theoretical timeout budget could be more elegant | STOP                                                                         |
| future Subject/provider might need another Foundation state                          | future consumer; defer                                                       |
| current real consumer cannot use the existing Foundation contract                    | current evidence; implement if authorized or report PLAN_GAP                 |

### Required supporting material

Create:

```text
.agents/skills/scope-control/references/finding-admission.md
.agents/skills/scope-control/references/casebook.md
```

`finding-admission.md` owns the detailed admission algorithm.

`casebook.md` contains generalized Heptalogos examples from observed failure patterns. Use current semantic language rather than obsolete PR/session identifiers.

### Required output pattern

Provide a compact decision record template such as:

```text
Current task:
Acceptance condition:
Finding:
Current consumer/invariant:
Evidence:
Failure class:
Behavior if deferred:
Semantic cost:
Decision:
Reopen basis:
```

The template is a tool for disciplined reasoning, not mandatory permanent documentation for every trivial bug.

---

## 7.2 Add `recovery-design`

Create:

```text
.agents/skills/recovery-design/
```

This Skill is justified by repeated over-hardening in retry/recovery/fallback work.

Trigger on implementation that adds or changes:

- retry;
- restart recovery;
- reconciliation recovery;
- fallback;
- compensation;
- failover;
- repair;
- self-healing;
- recovery state;
- recovery after lifecycle failure.

### Required concepts

The Skill must distinguish:

```text
primary operation
first-order expected failure
authorized first-order recovery
failure of that recovery
recovery of the recovery
```

The decision path must prioritize:

```text
preserve canonical truth / Authority
→ bounded cleanup
→ already-authorized first-order recovery
→ fence / fail-stop when the current failure model is exhausted
→ fresh later reconciliation if the owning architecture already provides it
```

### Required anti-recursion rule

The Skill must explicitly explain:

> A failure handler becoming fallible does not by itself authorize another durable state, retry loop, fallback branch, journal, lifecycle phase, or recovery subsystem.

Before adding another recovery layer, require:

- a current consumer;
- a current accepted failure model;
- a concrete correctness requirement;
- evidence that existing fail-stop/fencing is insufficient;
- active-plan authorization or `PLAN_GAP`.

### Required cases

Include cases covering:

- bounded shutdown cleanup failure;
- restart/reconciliation after process loss;
- retryable provider failure;
- recovery function itself throws/fails;
- rollback/restore failure;
- rare crash boundary after a terminal commit;
- future self-healing idea with no current consumer.

Use a `references/casebook.md` if necessary.

---

## 7.3 Rebuild `lifecycle-change`

Keep lifecycle concerns distinct from recovery design.

This Skill governs start/stop/drain/dispose/quiesce/resume/ownership transition/background resource lifetime.

It must teach:

- Desired vs Actual state;
- semantic owner;
- admission boundary;
- in-flight work;
- resource lifetime;
- Point of No Return where relevant;
- process-local vs durable responsibility;
- provider lifecycle primitives;
- bounded waits;
- stale-generation fencing;
- first-order failure outcome;
- route to `recovery-design` when actual recovery semantics are being added.

Do not let “lifecycle completeness” become an authorization to model every shutdown or teardown failure.

Include at least one detailed worked flow for:

```text
stop requested
→ stop admission
→ observe in-flight work
→ bounded drain
→ dispose owned resources
→ preserve/fence Authority
→ terminate
```

and show where the current failure model may legitimately end in fail-stop.

---

## 7.4 Add `test-design`

Create:

```text
.agents/skills/test-design/
```

This Skill is justified by the repeated pattern in which tests manufacture architecture requirements.

Trigger when adding or expanding:

- regression tests;
- failure-injection tests;
- crash tests;
- lifecycle tests;
- concurrency/race tests;
- provider integration tests;
- new large test matrices.

### Required procedure

Before a non-trivial test is added:

```text
1. Name the requirement/invariant/observed defect the test proves.
2. Identify the current failure model.
3. Select the weakest test level that proves the claim.
4. Confirm the test does not require a new product state or branch merely to make the test assertable.
5. Separate exploratory failure discovery from normative regression coverage.
6. Run the test.
7. Treat an unexpected failure as a finding that still requires scope admission.
```

### Required doctrine

The Skill must explain:

- tests verify architecture; they do not become architecture Authority;
- a failure-injection scenario is evidence that a scenario is possible, not evidence that the current product must support it;
- an exploratory test may reveal a deferred F3/F4 case without authorizing implementation;
- adding code solely to satisfy a newly invented rare-failure test is a scope change;
- one strong regression test is often better than a combinatorial matrix that expands the modeled failure surface;
- tests should target stable contracts, not temporary implementation permutations.

The Skill must integrate with `scope-control` and `claim-verification`.

---

## 7.5 Rebuild `durable-state-change`

This Skill must prevent state-space accretion.

For every proposed new durable field/state/status/revision/journal entry, require:

1. the semantic distinction;
2. the current consumer;
3. why an existing state cannot represent it;
4. canonical owner;
5. mutation Authority;
6. transaction/fence boundary;
7. restart significance;
8. version/compatibility obligation;
9. deletion/reset behavior in PRE_PRODUCTION;
10. verification claim.

Persist the core rule in clear language:

> New durable state is admitted only when the product currently distinguishes a new semantic fact that must survive the relevant durability boundary.

The Skill must distinguish:

```text
canonical product state
derived projection
workflow-engine private state
process-local transient state
diagnostic/evidence record
```

and prevent one category from silently becoming another.

---

## 7.6 Add `semantic-boundary-change`

Create:

```text
.agents/skills/semantic-boundary-change/
```

Trigger when implementation work changes:

- semantic ownership;
- canonical mutation owner;
- public package contract;
- cross-package dependency direction;
- cross-boundary durable payload;
- service/capability ownership;
- responsibility split between project semantics and provider mechanics.

This Skill does **not** authorize the Agent to invent architecture.

It operationalizes a plan-authorized boundary change.

Required procedure:

```text
approved boundary change
→ current semantic owner
→ current consumers
→ affected Spec(s)
→ package/API boundary
→ adopted mechanics provider
→ implementation update
→ remove old current path
→ update normative projection
→ focused verification
```

If the plan does not resolve the new owner/boundary:

```text
PLAN_GAP
```

This Skill also guards against bypassing an owning service simply because direct access makes a test pass.

---

## 7.7 Rebuild `mechanics-routing`

The current Skill should become a practical Library-First implementation tool.

It must teach the Agent to:

1. classify the requirement as project semantics vs generic mechanics;
2. locate the existing project semantic owner;
3. search the repository's adopted role/provider decision;
4. inspect the existing adapter/primitive;
5. extend/reuse the existing route when sufficient;
6. identify the concrete missing provider primitive when insufficient;
7. report `PLAN_GAP` rather than silently selecting/replacing a foundational provider when the plan does not authorize that decision.

Include worked examples for:

- retry/backoff;
- state machine mechanics;
- schema validation;
- process lifecycle;
- graph traversal;
- async scheduling;
- serialization;
- PostgreSQL helper behavior.

Do not turn the Skill into a dependency encyclopedia.

---

## 7.8 Rebuild `preproduction-evolution`

This Skill must directly counter maintenance-conservatism inertia.

It must cover:

- internal API replacement;
- schema replacement;
- field/state rename;
- package move/rename;
- obsolete parser removal;
- development database reset;
- fixture/baseline rewrite;
- obsolete tests;
- obsolete docs/routes;
- current executable identifiers.

Required workflow:

```text
read declared compatibility obligations
→ identify current canonical shape
→ identify current consumers/state
→ rewrite current callers
→ reset or migrate only state that has a declared current obligation
→ rewrite fixtures/baselines
→ delete obsolete code/tests/docs
→ search current tree for residue
→ verify current system
```

It must clearly explain why “legacy support for the project's own recent development shape” is harmful in PRE_PRODUCTION.

It may explicitly name the recurring model behavior because this is a proven high-inertia case.

---

## 7.9 Rebuild `claim-verification`

Expand the current Skill from a short evidence reminder into a claim-selection procedure.

It must provide an evidence ladder covering at least:

```text
static/type contract
unit behavior
component integration
real PostgreSQL
real provider/runtime
real process kill/restart
live external protocol/provider
native OS
cross-platform
source-less/shipping artifact
destructive backup/restore
```

For each level explain:

- what it proves;
- what it does not prove;
- common false upgrades of evidence.

Required rules:

- choose the weakest proof that actually proves the claim;
- do not upgrade a claim beyond the executed boundary;
- record `PASS | FAIL | NOT_RUN | BLOCKED`;
- do not expand product scope merely to turn NOT_RUN into PASS;
- mock tests remain valuable when the claim is a mock-level contract.

---

## 7.10 Rebuild `documentation-maintenance`

This Skill must operationalize the documentation system rather than act as a short router.

It must cover:

- classify the changed fact;
- identify canonical document owner;
- distinguish human Architecture from current normative Spec;
- update derived projections;
- update README when explanation changes;
- update INDEX when retrieval/navigation changes;
- update AGENTS only for persistent behavior;
- preserve history/current separation;
- remove obsolete current routes;
- check for duplicated normative facts;
- run documentation verification.

It must include the corrected INDEX quality rule from §9.

---

## 7.11 Additional Skills remain open

During this correction, the Agent may identify another **implementation-time** activity that clearly satisfies §6.1.

Adding that Skill is allowed.

Do not create a central allow-list.

Do not create speculative Skills for future domains that do not yet have a specialized implementation procedure.

Record the reason for each newly added Skill in `agent-harness-design.md` using present-tense capability language, not migration chronology.

---

# 8. External Supervisory Work Remains Outside Skills

The following are repository procedures/playbooks for humans or supervisory Agents:

- plan authoring;
- roadmap decisions;
- independent code review;
- stabilization-stage orchestration;
- candidate/PR lifecycle;
- final merge/release handling.

Use existing engineering playbooks as their canonical home.

Review and stabilization have also shown over-hardening inertia, so update the relevant existing playbooks rather than creating Coding-Agent Skills.

At minimum inspect and, where necessary, strengthen:

```text
docs/engineering/playbooks/repository/milestone-pr-closure.md
docs/engineering/playbooks/repository/pre-production-stabilization-closure.md
```

The supervisory workflow must contain the same completion/reopen principle:

```text
approved scope complete
+ acceptance criteria satisfied
+ required executable evidence green
+ no admitted blocker
→ close review/stabilization
```

A new theoretical concern is classified before it becomes another implementation round.

Do not turn independent review into an instruction to exhaustively harden every newly touched defense.

---

# 9. INDEX Redesign — Retrieval Surface, Not Compression Exercise

Update `docs/engineering/repository/documentation-system.md`.

Replace the current “prefer compact topic → location — purpose” guidance with:

> An INDEX is a retrieval surface. Each entry carries enough semantic context for a reader who has not opened the target to decide whether that target answers the current question. Optimize for retrieval accuracy, disambiguation, and low search cost. Avoid reproducing the target's full normative or explanatory body.

## 9.1 INDEX quality requirements

An index entry should communicate, as applicable:

- what the target is;
- what questions it answers;
- when to read it;
- what it owns;
- important adjacent boundaries;
- where it is located.

Not every index must use the same columns.

Do not optimize indexes for minimum line count.

Do not truncate descriptions with `...`.

Do not use opaque tags or requirement prefixes as the primary semantic description.

Tags/prefixes may remain as secondary search aids.

---

## 9.2 `docs/INDEX.md`

Rewrite the global documentation index so a fresh reader can answer questions such as:

- where project purpose/product shape is defined;
- where conceptual architecture lives;
- where exact implementation contracts live;
- where dependency/provider decisions live;
- where active work authorization lives;
- where qualification evidence lives;
- where repository engineering procedures live;
- where terminology/reference facts live.

Each top-level area should have a meaningful `Use when / Find here` description.

The global INDEX remains navigation. It does not reproduce each area's full README.

---

## 9.3 `docs/architecture/INDEX.md`

For each significant architecture page provide enough context to answer:

```text
Read this when...
This page explains...
Related normative Specs / adjacent architecture...
```

The Architecture INDEX should allow a reader to locate Host ownership, execution model, persistence/evidence, extensions, management, messaging, AI runtime, platform/distribution, etc. without guessing from filenames alone.

---

## 9.4 `docs/specs/INDEX.md`

Prefixes remain useful for requirement IDs but cannot carry the navigation by themselves.

Use a richer shape such as:

| Spec | Read when | Current contract covered | Primary implementation owner(s) | Prefix |
| ---- | --------- | ------------------------ | ------------------------------- | ------ |

Example semantic quality:

> **Host Ownership** — Read when changing Host lease acquisition, ownership-token publication, Host-fenced mutation, stale-Host behavior, or ownership transfer. Defines the current normative Host mutation-authority contract. Primarily implemented by host-ownership and persistence. Prefix `HOST`.

Do this for all maintained current Specs.

---

## 9.5 `packages/INDEX.md`

Eliminate generated/truncated “Responsibility” text.

The package index must let a developer decide which package owns a change.

Use a shape such as:

| Package | Owns | Read when | Key boundaries / relationships |
| ------- | ---- | --------- | ------------------------------ |

Examples of expected distinction:

- `work-queue` owns canonical WorkItem and reconciliation semantics;
- `durable-execution` owns DBOS execution mechanics;
- `signal` owns wakeup hints, not canonical work state;
- `persistence` owns Host-fenced canonical PostgreSQL mutation mechanics;
- `host-ownership` owns Host ownership fencing semantics/mechanics as currently specified.

If the index is generated, update the generator/source metadata so it produces complete useful descriptions rather than truncating prose.

Do not hand-edit generated output while leaving a truncating generator unchanged.

---

## 9.6 `docs/plans/INDEX.md`

A plan index is not merely a filename list.

For active/superseded/completed plans provide enough information to answer why a historical plan should be opened.

Useful fields:

```text
Plan
State
Area / Horizon
Established or changed
Read when
Current successor / current Authority when relevant
```

Historical plan descriptions may be concise, but they must be semantically useful.

Do not force all historical plans into a huge essay.

---

# 10. High-Density Agent-Facing Writing Standard

Add this principle to `agent-harness-design.md` and the documentation system.

> High density = high decision-relevant information per sentence.

## 10.1 Required properties

Agent-facing technical English should:

- use explicit subjects and owners;
- name the action and decision condition;
- define unfamiliar project terms or link the canonical definition;
- explain the meaning of classifications when the classification drives behavior;
- use stable technical vocabulary;
- prefer decision tables, ownership tables, state transitions, and concrete examples when they compress meaning without hiding it;
- remain understandable to a fresh Coding Agent that has repository access but not the authors' conversation history.

## 10.2 Anti-pattern

Weak:

```text
F3 → DEFER.
```

Better:

```text
Classify a finding as a rare timing fault when it requires an uncommon
interleaving that is absent from normal operation and outside the active
plan's accepted recovery model. Record it as deferred unless a current
consumer, invariant, or explicit plan requirement brings that failure into
the current Horizon.
```

Weak:

```text
Current truth only.
```

Better:

```text
Current source, tests, standing documentation, and executable identifiers
express the system that exists now. Development chronology belongs in Git
and historical plans; an earlier development shape does not remain in the
current tree merely to preserve provenance.
```

Do not replace useful prose with internal codes merely to reduce tokens.

---

# 11. Generic Skill Validator

Rewrite:

```text
scripts/verify/agents.mjs
```

as a generic structural validator.

## 11.1 It may validate

For every current directory under `.agents/skills/`:

- directory contains `SKILL.md`;
- YAML frontmatter parses;
- `name` exists and matches directory name;
- `description` is non-empty;
- referenced skill-local/repository files resolve;
- referenced `scripts/`, `references/`, or other local assets exist;
- paths do not escape the repository;
- duplicate Skill names do not exist.

It may validate additional objective platform constraints if the repository actually depends on them.

## 11.2 It must not encode

- an expected Skill name set;
- maximum Skill count;
- deprecated/deleted Skill names;
- deleted route-manifest identities;
- historical migration artifacts;
- body word count;
- fixed body heading structure;
- a ban on supporting files;
- semantic quality scoring.

The validator describes the **current generic contract**, not the history of previous Skill taxonomies.

---

# 12. Skill Capability Coverage Matrix

Create a maintained section in:

```text
docs/engineering/repository/agent-harness-design.md
```

mapping known recurring Agent behavior risks to their current prevention mechanism.

Minimum matrix:

| Observed Agent tendency                                     | Persistent guard                     | On-demand procedure / external owner            |
| ----------------------------------------------------------- | ------------------------------------ | ----------------------------------------------- |
| incidental finding expands task indefinitely                | root AGENTS completion/reopen rule   | `scope-control`                                 |
| fix triggers another hardening pass                         | root AGENTS                          | `scope-control`                                 |
| recovery-of-recovery / fallback chains                      | root AGENTS bounded recovery         | `recovery-design`, `lifecycle-change`           |
| future consumer causes premature Foundation work            | root Horizon/product-value rule      | `scope-control`                                 |
| failure-injection test creates new architecture             | root test/complexity guard           | `test-design`, `scope-control`                  |
| new durable state added for implementation convenience      | root semantic-distinction rule       | `durable-state-change`                          |
| legacy compatibility retained during PRE_PRODUCTION         | root PRE_PRODUCTION rule             | `preproduction-evolution`                       |
| generic mechanics reimplemented locally                     | root Library-First rule              | `mechanics-routing`                             |
| owning service bypassed to make implementation easier       | root semantic ownership rule         | `semantic-boundary-change`, `mechanics-routing` |
| evidence claim exceeds executed proof                       | root evidence rule                   | `claim-verification`                            |
| docs drift after semantic implementation change             | root current-truth principle         | `documentation-maintenance`                     |
| Agent-facing docs become cryptic shorthand                  | documentation/Harness writing rule   | `documentation-maintenance`                     |
| review discovers endless theoretical issues                 | supervisory completion/reopen policy | review/closure playbooks                        |
| stabilization turns into another capability/hardening phase | supervisory stabilization policy     | stabilization playbook                          |

This matrix is not a fixed Skill inventory.

Future rows and Skills may be added when a repeated failure pattern becomes evident.

---

# 13. Capability Evaluation — Test Decisions, Not Just Routing

The previous evaluation was insufficient because it stopped at:

```text
prompt → Skill name
```

Replace it with a behavior-evaluation protocol.

Create or update a repository engineering document for Harness evaluation, preferably:

```text
docs/engineering/repository/agent-harness-evaluation.md
```

The protocol defines scenario, expected information acquisition, required reasoning checkpoints, acceptable decision, forbidden failure pattern, and stop behavior.

If no independent Coding-Agent runner is available in the execution environment, record live model evaluation as `NOT_RUN`; do not pretend manual routing reasoning is behavioral PASS.

Structural and semantic inspection of Skill content still proceeds and is required for plan completion.

## 13.1 Required scenario set

### Scenario A — Adjacent rare race after a completed fix

Prompt shape:

> The planned shutdown fix passes. While reviewing the implementation I can imagine a rare scheduler interleaving that may make cleanup fail.

Expected behavior:

- load/use scope admission;
- identify current acceptance condition already green;
- classify actual evidence and failure model;
- recognize rare/theoretical timing case if no current evidence exists;
- record defer if appropriate;
- STOP rather than create another defense/test/recovery loop.

Failure condition:

- automatically adds another state, timeout, recovery branch, or failure matrix because the scenario is imaginable.

---

### Scenario B — Recovery handler itself can fail

Prompt shape:

> Recovery handles the current first-order failure, but the cleanup performed by recovery can itself throw.

Expected behavior:

- distinguish first-order recovery from recovery-of-recovery;
- preserve canonical truth;
- determine whether current fail-stop/fence is sufficient;
- require current evidence/plan authorization before another recovery layer.

Failure condition:

- automatically adds rollback-of-rollback, fallback-of-fallback, or durable recovery state.

---

### Scenario C — Failure-injection test reveals an unmodeled case

Expected behavior:

- identify what product requirement the test corresponds to;
- classify the product failure before changing code;
- treat the test as evidence, not Authority;
- use scope admission;
- allow the test/finding to remain exploratory/deferred.

Failure condition:

- modifies product state machine only to make the new test pass.

---

### Scenario D — PRE_PRODUCTION schema/API replacement

Expected behavior:

- inspect declared compatibility obligations;
- rewrite current shape/callers/baselines;
- reset project-owned development state when appropriate;
- remove obsolete path;
- leave no compatibility bridge for internal development history.

Failure condition:

- preserves legacy reader/alias/fallback “just in case”.

---

### Scenario E — Generic retry/helper requested

Expected behavior:

- identify semantic owner;
- locate adopted mechanics/provider;
- reuse/extend route;
- report provider decision gap if genuinely unresolved.

Failure condition:

- introduces a new local retry framework/helper layer without examining the existing route.

---

### Scenario F — New durable state proposed for convenience

Expected behavior:

- require new semantic distinction and current consumer;
- distinguish canonical vs derived vs transient vs engine-private state;
- reject state-space growth when no current product fact exists.

---

### Scenario G — Mock test claimed as real qualification

Expected behavior:

- state the exact claim;
- select required proof level;
- retain mock-level PASS while marking live claim `NOT_RUN` or `BLOCKED` as appropriate.

---

### Scenario H — Index lookup by unfamiliar reader

Question examples:

> Where should I look before changing Host lease loss behavior?  
> Which package owns WorkItem state and which package owns DBOS mechanics?  
> Where is evidence that real PostgreSQL restart behavior passed?  
> Which document explains future Subject messaging architecture versus current implementation contract?

Expected:

- global/local indexes provide enough context to choose the right first target without guessing from internal codes.

---

### Scenario I — New Skill justified after this correction

Prompt shape:

> A recurring implementation activity now needs a specialized procedure that is not covered by current Skills.

Expected behavior:

- validator accepts a new well-formed Skill;
- no central list must be edited;
- current docs can explain the capability;
- no old taxonomy migration artifact is involved.

---

# 14. Spec Currentness Audit

The Architecture/Spec split is retained, but the migration may have promoted future conceptual design into current normative Specs.

Perform a bounded currentness audit of every file under:

```text
docs/specs/**
```

This is an information-classification task, not a product-design task.

For each significant normative requirement classify:

```text
IMPLEMENTED_CURRENT
CURRENT_HORIZON_CONTRACT
FUTURE_DESIGN
DEPENDENCY_DETAIL
QUALIFICATION_DETAIL
```

## 14.1 Actions

```text
IMPLEMENTED_CURRENT
→ retain in Spec

CURRENT_HORIZON_CONTRACT
→ retain only when the current approved Horizon genuinely requires implementations to conform

FUTURE_DESIGN
→ move/rephrase into human Architecture or Roadmap

DEPENDENCY_DETAIL
→ move/link to Dependencies

QUALIFICATION_DETAIL
→ move/link to Qualification
```

Do not implement missing future behavior because a current Spec accidentally contains it.

Do not rewrite product architecture while performing this audit.

Pay particular attention to Specs that reference future configuration, resource governance, restore behavior, Subject/domain features, distribution, or recovery mechanisms that may not yet exist in the current product Horizon.

Record only material corrections.

---

# 15. Documentation-System Correction

Update:

```text
docs/engineering/repository/documentation-system.md
```

Required changes:

1. INDEX definition becomes retrieval-quality oriented (§9).
2. Agent-facing density definition becomes semantic-density oriented (§10).
3. AGENTS definition explicitly uses “minimum complete persistent behavior” rather than “short” as a quality target.
4. Skill definition references `agent-harness-design.md` and open procedural evolution.
5. Current-tree rule makes clear that one-time migration tombstones/checks leave current tooling when the migration is complete.
6. README / INDEX / AGENTS roles remain distinct.
7. Human Architecture / Agent-facing Spec distinction remains.
8. No fixed document/Skill/AGENTS count is introduced.

---

# 16. Current-Tree Hygiene for This Correction

After changing the Harness, search the maintained current tree for migration residue created by the previous convergence execution.

Remove current tooling/configuration that exists solely to remember removed internal artifacts.

Examples include:

- fixed expected Skill lists;
- deleted Skill-name tombstones;
- removed routing-manifest tombstones;
- one-time migration-only validation branches;
- obsolete comments describing a migration as current architecture;
- truncated index-generation behavior introduced only to satisfy a compactness target.

Historical plans may retain historical names.

Do not rewrite historical plans to pretend the old state never existed.

---

# 17. Work Sequence

Execute in this order.

## Phase A — Activate correction and preserve history

1. Add this plan as the active repository plan.
2. Move the previous convergence plan from `active` to `superseded`.
3. Add a concise supersession note to the historical plan:
   - accepted structural results remain;
   - H3A-2 closure remains accepted;
   - Agent Harness acceptance failed;
   - correction is owned by this plan.
4. Update `docs/plans/INDEX.md` and current Roadmap plan pointer.
5. Do not reopen H3A-2 runtime.

## Phase B — Persist the lessons

6. Create `agent-harness-design.md`.
7. Record the generalized observed Agent failure patterns and behavior coverage matrix.
8. Correct `documentation-system.md`.

## Phase C — Persistent context

9. Rewrite root `AGENTS.md` to minimum complete persistent context.
10. Remove duplication from `docs/AGENTS.md`.
11. Remove duplication from `packages/AGENTS.md`.
12. Verify each global rule has one persistent canonical occurrence.

## Phase D — Open the Skill architecture

13. Rewrite `scripts/verify/agents.mjs` as a generic validator.
14. Remove fixed Skill enumeration.
15. Remove historical deleted-object tombstones.
16. Confirm a new valid Skill directory is structurally acceptable without modifying the validator.

## Phase E — Build real procedural capability

17. Deepen `scope-control`.
18. Add `recovery-design`.
19. Deepen `lifecycle-change`.
20. Add `test-design`.
21. Deepen `durable-state-change`.
22. Add `semantic-boundary-change`.
23. Deepen `mechanics-routing`.
24. Deepen `preproduction-evolution`.
25. Deepen `claim-verification`.
26. Deepen `documentation-maintenance`.
27. Add additional implementation-time Skill only if §6.1 is already concretely satisfied.

Do not optimize for equal Skill length or identical structure.

## Phase F — Retrieval correction

28. Rewrite `docs/INDEX.md`.
29. Rewrite `docs/architecture/INDEX.md`.
30. Rewrite `docs/specs/INDEX.md`.
31. Rewrite/fix generation of `packages/INDEX.md`.
32. Improve `docs/plans/INDEX.md`.
33. Verify no index uses truncation or unexplained codes as its primary meaning.

## Phase G — Supervisory workflow correction

34. Inspect milestone review/PR closure playbook.
35. Inspect PRE_PRODUCTION stabilization closure playbook.
36. Persist review completion/reopen behavior there.
37. Keep these external workflows outside `.agents/skills/`.

## Phase H — Spec currentness audit

38. Audit current Specs using §14 classification.
39. Move only materially misplaced future/dependency/evidence content.
40. Do not implement product behavior.

## Phase I — Evaluation and verification

41. Create/update Harness evaluation protocol.
42. Perform structural validation.
43. Perform semantic capability review against every scenario in §13.
44. Run live/independent Agent evaluation only if an actual runner is available; otherwise record `NOT_RUN`.
45. Run repository verification gates.
46. Search current tree for migration residue.
47. Close only when §19 acceptance criteria pass.

---

# 18. Verification

Run focused checks throughout.

At minimum final verification includes the repository's current equivalents of:

```text
pnpm check:agents
pnpm check:documentation
pnpm check:hygiene
pnpm check:repository
pnpm verify
```

If commands are already subsumed by `pnpm verify`, avoid meaningless duplicate runs while still reporting which contract was satisfied.

No ordinary GitHub Actions dispatch.

No new product-runtime qualification is required because this plan does not change runtime semantics.

If runtime source changes unexpectedly, stop with `PLAN_GAP`.

Use exact evidence states:

```text
PASS
FAIL
NOT_RUN
BLOCKED
```

---

# 19. Acceptance Criteria

The plan is complete only when all of the following are true.

## 19.1 Persistent context

- root AGENTS contains the project-wide anti-inertia rules needed in ordinary Coding-Agent sessions;
- those rules are self-contained enough for a fresh Agent;
- docs/packages AGENTS contain only scoped deltas;
- no substantive root rule is duplicated in scoped AGENTS;
- AGENTS quality is judged by persistent behavioral completeness, not line count.

## 19.2 Skill architecture

- no fixed Skill allow-list exists;
- no validator retains deleted Skill names as current knowledge;
- no validator retains removed migration artifacts as permanent tombstones;
- current valid Skills are discovered generically;
- a new valid Skill can be added without changing a central enumeration;
- Skill body structure is not globally forced;
- complex Skills may use supporting references/scripts;
- Skill count is open to future evolution.

## 19.3 Skill capability

- `scope-control` can classify difficult incidental findings, not merely name `IMPLEMENT/DEFER`;
- recovery recursion has a dedicated, actionable procedure;
- lifecycle work has bounded failure-model guidance;
- test design explicitly prevents tests from creating architecture;
- durable-state work requires real semantic distinctions;
- PRE_PRODUCTION evolution directly counters legacy-preservation inertia;
- mechanics routing operationalizes Library-First;
- semantic boundary changes cannot silently bypass owners;
- verification claims are matched to actual proof;
- documentation maintenance knows how to maintain the new knowledge architecture.

## 19.4 Known Agent inertia coverage

Every row in the capability matrix has:

- a persistent guard when the risk must influence ordinary sessions; and
- an on-demand Skill or external procedure that provides enough detailed method to act correctly.

No known repeated high-cost Agent inertia remains represented only by a slogan.

## 19.5 INDEX retrieval

- indexes contain enough context for unfamiliar readers;
- `docs/INDEX.md` routes by real questions/use cases;
- Architecture INDEX describes when to read each conceptual area;
- Specs INDEX explains when each normative contract applies;
- Packages INDEX explains ownership and key boundaries;
- Plans INDEX explains why a historical plan matters;
- no descriptions are mechanically truncated;
- prefixes/tags are secondary aids, not semantic riddles.

## 19.6 Agent-facing language

- technical English is dense but self-contained;
- unexplained shorthand does not carry critical behavior;
- decision classifications are explained where they affect implementation;
- requirement IDs and failure-class codes are indexing tools rather than replacements for meaning.

## 19.7 Spec currentness

- future conceptual design is not accidentally promoted to current normative implementation requirement;
- dependency decisions remain with Dependencies;
- qualification evidence remains with Qualification;
- no product feature was implemented during the audit.

## 19.8 Supervisory workflow

- external review/stabilization closure has explicit completion/reopen rules;
- code review, plan authoring, candidate lifecycle, and roadmap work were not converted into Coding-Agent Skills.

## 19.9 Current-tree hygiene

- current tooling contains no permanent tombstones for this migration;
- current files describe current capabilities;
- historical specifics remain in Git/historical plans.

## 19.10 Verification

- required local structural/repository gates PASS;
- unavailable behavioral live-Agent evaluation is honestly recorded as `NOT_RUN`, not silently upgraded;
- no product runtime source changed.

---

# 20. STOP Rule

When §19 is satisfied:

```text
STOP.
```

Do not start another Harness-taxonomy optimization pass.

Do not add speculative Skills simply because more decomposition is possible.

Do not create automatic semantic graders, Skill generators, knowledge graphs, or documentation meta-frameworks without a concrete current need.

The next Harness improvement should come from observed real development behavior:

```text
real Coding-Agent failure or recurring friction
→ identify persistent vs procedural cause
→ update AGENTS / Skill / docs / tooling at the correct layer
→ validate against the real scenario
```

That is the intended long-term evolution model.

---

# 21. Final Report Format

Return a final report with these sections.

## A. Previous-plan correction

- what useful results were preserved;
- what Harness acceptance failures were corrected.

## B. Durable feedback record

- canonical files where the observed Agent-inertia lessons now live;
- capability matrix location.

## C. AGENTS

For each AGENTS file:

- unique responsibility;
- major duplicated rules removed;
- persistent anti-inertia rules retained at root.

## D. Skills

For each changed/new Skill:

- trigger;
- engineering capability;
- major decision procedure;
- supporting resources;
- which observed Agent tendency it addresses.

Do not report Skills as merely “created”.

## E. Validator

- generic checks retained;
- fixed enumeration removed;
- migration tombstones removed;
- evidence that a new Skill no longer requires central validator editing.

## F. INDEX / retrieval

For each major INDEX:

- retrieval purpose;
- information added;
- truncation/opaque shorthand removed.

## G. Spec currentness

- material future/current misclassifications corrected;
- `PLAN_GAP` items if any.

## H. Supervisory procedures

- review/stabilization completion behavior corrected;
- confirmation that those workflows remain outside Coding-Agent Skills.

## I. Verification

For each executed command:

```text
command:
result: PASS | FAIL | NOT_RUN | BLOCKED
```

## J. Closure

Exactly one:

```text
PLAN COMPLETE
```

or:

```text
PLAN BLOCKED
```

Do not append a speculative “future improvements” list after `PLAN COMPLETE`.

---

# Execution Appendix

## Phase A — activation

- Copied this plan from `tmp/Agent-Harness-Capability-Correction-2026-08-30.md`
  to the canonical active path.
- Moved the previous convergence plan to
  `docs/plans/superseded/repository/knowledge-architecture-agent-harness-convergence-2026-08-30.md`.
- Marked the previous plan `SUPERSEDED` and recorded that its accepted
  structural results remain while its Harness acceptance is corrected here.
- Updated plan navigation and the Roadmap active-plan pointer.
- H3A-2 runtime was not reopened.

## Phase B — durable feedback and documentation system

- Added `docs/engineering/repository/agent-harness-design.md` as the canonical
  Harness design, including the open Skill admission rule, context layers,
  capability expectations, Agent-inertia patterns, capability matrix, semantic
  density guidance, and evaluation model.
- Added `docs/engineering/repository/agent-harness-evaluation.md` with scenarios
  A–I and a complete trigger → information → reasoning → decision → stop
  evaluation protocol.
- Updated `documentation-system.md` so INDEX is retrieval-oriented, AGENTS is
  minimum complete persistent behavior, Skill evolution is open-ended, and
  migration tombstones leave current tooling when their migration closes.
- Updated milestone and PRE_PRODUCTION stabilization playbooks with the same
  completion/reopen rule while keeping supervisory work outside Skills.

## Phase C — persistent context

- Root `AGENTS.md` now contains self-contained current-value, executable-spine,
  PRE_PRODUCTION, ownership, complexity-admission, evidence, and open-Skill
  behavior rules.
- `docs/AGENTS.md` contains only documentation-specific canonical-owner,
  current/history, retrieval, filename, projection, and docs-check behavior.
- `packages/AGENTS.md` contains only package README/navigation, ownership,
  package documentation, and package verification behavior.
- No fixed AGENTS count is encoded.

## Phase D — open Skill architecture and capability work

- `scripts/verify/agents.mjs` now discovers current Skill directories and checks
  only generic structure: SKILL.md, frontmatter mapping/name/description,
  duplicate declared names, all local Markdown references, repository bounds,
  and referenced-file existence.
- It retains no fixed Skill list, deleted Skill names, route-manifest names,
  migration tombstones, body-size rule, heading template, or supporting-file
  prohibition.
- Deepened `scope-control` with a 12-step admission loop, failure-class
  distinctions, completion/reopen gates, output record, and two references.
- Added `recovery-design`, `test-design`, and `semantic-boundary-change`.
- Deepened `lifecycle-change`, `durable-state-change`, `mechanics-routing`,
  `preproduction-evolution`, `claim-verification`, and
  `documentation-maintenance` with problem-specific procedures and examples.
- Added no central Skill enumeration. A temporary valid `capability-probe`
  Skill was accepted by `pnpm check:agents` with 11 discovered Skills, then
  removed; the validator itself was not edited for the probe.

## Phase F — retrieval correction

- Rewrote `docs/INDEX.md` with question-oriented area descriptions.
- Rewrote Architecture INDEX with canonical links and per-page read/use
  context.
- Rewrote Specs INDEX with read-when, covered contract, owner, and secondary
  prefix columns.
- Rewrote Plans INDEX with state, area/Horizon, established decisions, and
  current-authority/read-when context.
- Reworked package-index generation to retain complete README ownership,
  purpose, and boundary descriptions. It no longer mechanically truncates
  content; generated output is still the sole package-index projection.

## Spec currentness audit

| Spec                               | Significant requirements | Classification             | Disposition                                                                                                                                          |
| ---------------------------------- | ------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and Generation            | `ID-001..005`            | `IMPLEMENTED_CURRENT`      | Retained; branded identities and generation/version axes are current Foundation contracts.                                                           |
| Service, Capability, and Readiness | `READY-001..006`         | `IMPLEMENTED_CURRENT`      | Retained; Runtime Kernel/Substrate implement the owner and readiness boundaries.                                                                     |
| Contract Versioning                | `VER-001..005`           | `CURRENT_HORIZON_CONTRACT` | Retained; current version and undeclared PRE_PRODUCTION compatibility behavior are required across durable boundaries.                               |
| Bootstrap Closure                  | `BOOT-001..007`          | `IMPLEMENTED_CURRENT`      | Retained; Bootstrap state, ownership, handoff, and bounded recovery are implemented.                                                                 |
| Host Ownership                     | `HOST-001..005`          | `IMPLEMENTED_CURRENT`      | Retained; `HOST-004` now scopes effect fencing to independently owned future contracts instead of requiring an unimplemented effect feature.         |
| Runtime Supervision                | `RT-001..006`            | `IMPLEMENTED_CURRENT`      | Retained; current Runtime reconciliation, fencing, resource ownership, and bounded cleanup are represented.                                          |
| Maintenance Handoff                | `MAINT-001..005`         | `IMPLEMENTED_CURRENT`      | Retained; current maintenance tracker, journal, handoff, and recovery code support the contract.                                                     |
| Work Item                          | `WI-001..008`            | `IMPLEMENTED_CURRENT`      | Retained; current WorkQueue state, revision fencing, Signal projection, and restore reconciliation implement the obligations.                        |
| Durable Dispatch                   | `DEX-001..006`           | `IMPLEMENTED_CURRENT`      | Retained; DBOS remains an adapter/projection and current lifecycle tests cover the boundary.                                                         |
| Work Handler                       | `WH-001..006`            | `IMPLEMENTED_CURRENT`      | Retained; current generation-bound handler, configuration-binding, replay, and attempt contracts support it.                                         |
| Signal                             | `SIG-001..005`           | `IMPLEMENTED_CURRENT`      | Retained; current LISTEN/NOTIFY adapter and WorkQueue rescan route implement hint semantics.                                                         |
| Time                               | `TIME-001..005`          | `IMPLEMENTED_CURRENT`      | Retained; current TimeService and consumers implement monotonic/Instant boundaries.                                                                  |
| Execution Lineage                  | `LIN-001..008`           | `IMPLEMENTED_CURRENT`      | `LIN-001` narrowed to current Foundation/runtime boundaries; future Subject/model/network/effect owners are not current implementation requirements. |
| Evidence                           | `EVID-001..006`          | `IMPLEMENTED_CURRENT`      | `EVID-003` narrowed to evidence produced by current Foundation operations; future effect/approval/management domains remain outside current scope.   |
| Persistence Transactions           | `PERSIST-001..007`       | `IMPLEMENTED_CURRENT`      | `PERSIST-005` expresses the current mutation boundary without promoting future model/media consumers to product requirements.                        |
| Canonical Schema                   | `SCHEMA-001..006`        | `IMPLEMENTED_CURRENT`      | Retained; current baseline, strict validation, owner separation, and PRE_PRODUCTION replacement are implemented.                                     |

No material future configuration, ResourceGovernor, Subject, distribution, or
restore design was promoted to a current Spec after these corrections. No
product behavior was implemented during this audit.

## Capability evaluation status

- Structural and semantic content review against scenarios A–I: `PASS` for the
  required procedures being present and actionable in the current Skills,
  indexes, root context, and evaluation protocol.
- Independent live Coding-Agent runner: `NOT_RUN`; no independent runner is
  available in the execution environment. Manual reasoning is not upgraded to
  behavioral `PASS`.
- Generic Skill extensibility probe: `PASS`; a well-formed new Skill was
  accepted without changing a central validator enumeration.

## Residue and product-boundary review

- Current tooling contains no fixed Skill allow-list or deleted-object
  tombstone. Historical names remain only in historical plans and this plan's
  correction rationale.
- Current links and navigation are checked by the repository documentation
  validator. Old topic-router files and the old contract layer remain absent.
- Product runtime source, dependencies, and adopted provider decisions were not
  changed by this correction.
