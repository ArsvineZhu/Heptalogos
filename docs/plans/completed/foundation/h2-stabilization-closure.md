# Heptalogos H2 Closure — Governance Reset, Current-Tree Erasure & H2-S Stabilization Implementation Plan

> **For agentic workers:** REQUIRED EXECUTION MODE: execute this plan task-by-task. This document is **decision-complete by design**. The executor may make only local, semantics-preserving implementation choices. It is **not authorized** to choose architecture, Authority, compatibility policy, stage scope, package boundaries, dependency roles, public/stable identities, durable shapes, lifecycle semantics, or evidence policy. If an unanticipated case requires any such choice, stop with `PLAN_GAP` and report the concrete facts; do not invent a local answer.

**Goal:** reconcile the already-merged H2B truth, harden repository governance for rapid PRE_PRODUCTION evolution, erase development-history residue from the current executable tree, close the Host Authority ↔ Runtime lifecycle seam, freshly qualify the complete H2 stage, and close H2 without importing H3 semantics or preserving project-development history as product compatibility.

## H2-S activation record (2026-08-26)

```yaml
stage: H2-S
branch: dev/h2-stabilization
worktree: C:\dev\Heptalogos
gate_r: PASS (H2B reconciliation complete)
draft_pr: 24 (DRAFT)
candidate_state: READY_FOR_REVIEW
```

## S4 compatibility audit record (2026-08-26)

| finding | current purpose | declared obligation | action | evidence |
| --- | --- | --- | --- | --- |
| `fixtures/ts6-api-lane.ts` exposes compiler compatibility APIs | Isolated TS6 compiler-API qualification lane | none; adopted toolchain policy | `KEEP_CURRENT_SEMANTIC` | `pnpm tsc6` and dependency/toolchain gates |
| `ContractCompatibilityRegistry` and Service/Capability contract matching | Current provider/consumer contract selection | none; this is present runtime semantics, not historical product compatibility | `KEEP_CURRENT_SEMANTIC` | Runtime Kernel unit tests and Corpus S13 |
| `BootstrapStateStore` / `MaintenanceJournalStore` retain a previous validated revision | Current recovery evidence and authority fencing after torn/corrupt writes | none; previous revision is not a compatibility reader | `KEEP_CURRENT_SEMANTIC` | Bootstrap State and maintenance unit tests; recovered state cannot authorize mutation |
| alias/unsupported-input rejection in bootstrap and installation boundaries | Current strict security/schema validation | none | `KEEP_CURRENT_SEMANTIC` | Current rejection tests; no alias reader is retained |
| `schemaVersion: 1` codecs and explicit unsupported-version rejection | One current canonical V1 shape | none | `KEEP_CURRENT_SEMANTIC` | Canonical codec tests and one migration baseline |
| milestone-named identities, historical-shaped test wording, and old internal names | Development chronology only | none | `REMOVED` / `REFRAMED` | `pnpm check:hygiene` PASS; current-surface residue search |

The compatibility register is `PRE_PRODUCTION` with `obligations: []`. No
finding above establishes a product compatibility obligation. A future finding
that implies a real external consumer or retained production state is a
`PLAN_GAP`, not a local shim decision.

**Architecture:** H2-S remains a bounded stabilization pass, not a second H2 development cycle. One final H2-S candidate must contain the complete stabilized current tree so Independent Review and final CI see the same aggregate result: governance hardening, history-neutral current-tree cleanup, PRE_PRODUCTION compatibility enforcement, and the bounded Runtime/Host lifecycle correction. Historical provenance remains in Git, completed plans, and qualification history; it must not remain as canonical/executable identity or compatibility behavior.

**Observed repository baseline:** H2B Runtime Composition & Kernel corrected candidate; revision identity remains in Git history and GitHub metadata.

**Supersedes:** `Heptalogos_H2_Closure_Agent_Execution_Plan_2026-08-25.md`. Do not execute the superseded plan after this document is approved.

**Compatibility epoch:** `PRE_PRODUCTION`.

**Current declared product compatibility obligations:** **none**. This plan introduces a machine-readable register that must contain an empty obligation set until a future explicit architecture decision changes the epoch or declares a real external/retained-state obligation.

---

# 0. Executive decision record

## 0.1 Current observed facts

The plan is based on the following repository facts at the observed baseline:

1. PR #22 was squash-merged as `d7f32427398d2309c1732cdbce98f590e14a8249` from exact behavior pair:

   ```text
   base = 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
   head = 86c01ee90d6d1f6c953be39375ccddb0458a189a
   ```

2. The operator-supplied out-of-band Independent Review for that pair is `PASS`.
3. Manual final cross-platform workflow run `32862042074` is `PASS` on Ubuntu/macOS/Windows for the reviewed H2B head.
4. Current Roadmap / qualification projections at `d7f3242...` still describe the pre-merge H2B candidate state and therefore require a separate docs/evidence-only reconciliation before H2-S activation.
5. Root `AGENTS.md` currently mixes executor constraints with project axioms, Foundation scope, Skill routing, planning guidance, PR governance, and verification details. The Skill routing table duplicates Harness behavior and the macro invariant list consumes always-on context without giving the executor a sharper decision boundary.
6. Current executable/test surfaces contain development provenance such as `M4`, `M5A`, `H2A1`, `H2A2`, `H2A3`, and `H2B` in test credentials, temporary paths, table names, test IDs, test descriptions, and file names.
7. Current root `GENESIS_EVIDENCE.json` exists solely for the already-completed one-time Repository Genesis acceptance. `scripts/phases/repository-genesis.mjs` is the only remaining phase-specific script and explicitly requires that evidence file and old Genesis topology. Neither is part of permanent `pnpm verify`.
8. Current code already has one canonical migration baseline: `packages/canonical-schema/src/migrations/0001-foundation-baseline.ts`. H2-S must keep that single current baseline and must not manufacture migration history for earlier development shapes.
9. Current Bootstrap/Runtime integration has no production dependency from `bootstrap-runtime` to `runtime-kernel`; H2B integration composes them through test/dev dependencies. This boundary remains correct and must be mechanically protected.
10. Current `MicroSystemSupervisor` lacks both a root-owner lifecycle signal and reversible whole-runtime quiescence. Current canonical PostgreSQL test support stops a managed Host using an inert quiescence lease; therefore the Host maintenance contract and Runtime lifecycle are not yet jointly proven.

## 0.2 Why the previous plan is insufficient

The superseded plan correctly identified the Host Authority ↔ Runtime lifecycle seam, but it under-scoped H2-S in three ways:

```text
1. Development provenance residue was treated as incidental naming cleanup.
2. PRE_PRODUCTION compatibility baggage was not made a mandatory, machine-backed S closure invariant.
3. Closed-phase / one-time repository artifacts were not treated as current-tree archaeology that must be deleted.
```

It also proposed a new H2-S integration file named `h2s-runtime-lifecycle.integration.test.ts`, which would itself violate the newly clarified rule that development-stage identity must not become long-lived executable identity.

This revised plan corrects those design errors.

## 0.3 Locked decisions

The following are not executor choices:

```text
D1  H2 closure remains: PR-R reconciliation -> one H2-S behavior/governance PR -> PR-C final reconciliation.
D2  H2-S is a trust/closure pass, not next-stage development.
D3  Development provenance in current canonical/executable surfaces is an A-class closure blocker.
D4  Undeclared compatibility behavior is an A-class closure blocker.
D5  Closed-phase/currently ownerless artifacts in the current tree are an A-class closure blocker when their only purpose is historical evidence.
D6  PRE_PRODUCTION currently has zero product compatibility obligations.
D7  Git + completed plans + historical qualification are the archive; current executable tree is not an archive.
D8  Root AGENTS.md is rewritten as an executor contract, not an architecture summary or Skill router.
D9  Active implementation plans must be decision-complete; non-trivial plan gaps stop execution.
D10 A permanent locally runnable current-tree hygiene gate is added to pnpm verify; it has no generic suppression/allowlist escape hatch.
D11 GENESIS_EVIDENCE.json and scripts/phases/repository-genesis.mjs are deleted, not moved into another current-tree archive directory.
D12 Known milestone/stage names in current executable/test assets are replaced with semantic identities; no compatibility aliases or duplicate old file names are retained.
D13 Historical-shape negative tests are either reframed as current-contract validation or deleted when redundant; they do not preserve project archaeology as test identity.
D14 Bootstrap Runtime remains production-independent of Runtime Kernel/Cordis.
D15 Runtime Kernel receives a generic root-owner lifecycle signal and reversible quiescence; it does not import Bootstrap/Host private types.
D16 H2-S real-PG evidence must be fresh on the final H2-S candidate using PostgreSQL 18.6; skipped H2-S DB scenarios block candidate freeze.
D17 Product-level Linux/macOS real-PG, source-less, service/headless, and hardware power-loss residuals remain honest PARTIAL/NOT_RUN where not actually proven.
D18 No new package, dependency adoption, H3 durable-work/effect subsystem, or compatibility framework is authorized by this plan.
```

---

# 1. Hn-S semantic model and mandatory closure invariants

Hn-S exists to answer:

> **Can Hn+1 safely treat the current Hn tree as a stable, semantically clean, evidence-backed foundation without simultaneously carrying Hn's development chronology forward?**

The final H2-S candidate must satisfy all of these:

```text
H2 functional behavior remains correct
AND Host Authority / Runtime lifecycle seam is closed
AND current canonical/executable identity is history-neutral
AND undeclared compatibility behavior = 0
AND obsolete closed-phase current-tree artifacts = 0
AND current evidence matches the actual final candidate
AND no H3 capability work entered H2-S
```

Mandatory S sweeps are:

```text
Sweep A — Development Provenance Neutrality
Sweep B — Compatibility Obligation Purity
Sweep C — Current-Tree Archaeology / Dead Phase Artifact Removal
Sweep D — Hn cross-milestone architecture seams
Sweep E — Current-candidate qualification truth
```

For H2, Sweeps A-C are now explicit A-class work, not cosmetic B-class debt.

---

# 2. Current-tree surface classification

The executor must use this classification exactly.

## 2.1 Canonical / executable current surfaces

These describe what the repository **is now** and must be history-neutral:

```text
production source
unit/integration tests that remain runnable
shared test-support and fixtures
package/project/workspace manifests
root current configuration
.github workflow definitions
scripts/verify permanent gates
tools/repo-kit permanent tooling
.agents current Skills / current agent package metadata
AGENTS.md
current runtime IDs, event/test IDs, temporary resource names, database fixture names
current comments that explain semantics
```

They must not use milestone, sub-milestone, PR, Session, corrective-cycle, migration-history, or temporary-plan identity as the semantic name of a long-lived asset.

## 2.2 Provenance / historical surfaces

These may retain exact historical identifiers because that is their purpose:

```text
Git history
docs/plans/completed/**
explicit historical sections in qualification records
review / CI / merge closure records
changelog / historical execution reports
```

Do not rewrite historical commit identities merely to satisfy current-tree cleanliness.

## 2.3 Normative architecture surfaces

`Architecture_Corpus/**` may describe generic concepts such as `Hn-S`, PRE_PRODUCTION, compatibility obligations, or historical-evidence policy. It must not carry stale current milestone truth that belongs in Roadmap/qualification projection.

## 2.4 Retention test for a current-tree artifact

A current-tree artifact is retained only when **all** of the following are true:

```text
1. it has a current owner;
2. it has a current semantic or operational purpose;
3. a current build/test/runtime/governance path actually consumes it, or a current normative document requires it;
4. its identity describes that current purpose rather than the phase that created it.
```

If its only justification is “historical evidence”, “it was once useful”, “an old plan references it”, or “we may want it later”, delete it from the current tree. Git/completed plans preserve history.

Unknown artifacts are **not** silently deleted: if the executor cannot determine whether a live owner exists from current references and this plan does not already decide the artifact, stop with `PLAN_GAP` and report the references.

---

# 3. Repository sequence

Do not collapse, reorder, or parallelize these three PRs.

```text
PR-R  H2B post-merge truth reconciliation
  ↓ merge
Gate R: H2B CLOSED / H2 functional COMPLETE / H2-S ELIGIBLE / H2 OPEN
  ↓
PR-S  one bounded H2-S candidate
      governance reset
      current-tree history erasure
      permanent hygiene gate
      compatibility residue removal
      Runtime/Host lifecycle closure
      fresh H2 qualification
  ↓ exact-pair review + exact-pair final CI + squash merge
PR-C  docs/evidence-only final H2 truth reconciliation
  ↓ merge
H2 CLOSED / H3 ELIGIBLE
```

### Why one PR-S instead of multiple stabilization behavior PRs

The newly identified hygiene work and Runtime lifecycle correction are both H2 closure requirements and must be reviewed against the **same final current tree**. Splitting them into separately merged behavior PRs would either require repeated post-merge reconciliation between S subphases or leave the final Independent Review unable to review the complete stabilized diff from one fixed base. The scope remains bounded because this plan adds no product subsystem, no dependency, and no H3 semantics.

If actual execution exceeds the stop budgets in §12, do not split it ad hoc. Stop and request a new architecture/scope decision.

---

# 4. PR-R — H2B post-merge truth reconciliation

**Branch:** `dev/h2b-post-merge-reconciliation`

**Allowed paths:** only `Architecture_Corpus/**` and `docs/**`.

**Forbidden:** production source, tests, scripts, tooling, package manifests, AGENTS, Skills, behavior changes.

## Task R1 — Re-prove external H2B closure tuple before editing

- [ ] Fetch `origin/master` and require exact observed baseline unless master has legitimately moved through an already-reviewed later reconciliation.
- [ ] Verify PR #22:

  ```text
  merged = true
  base = 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
  head = 86c01ee90d6d1f6c953be39375ccddb0458a189a
  merge = d7f32427398d2309c1732cdbce98f590e14a8249
  ```

- [ ] Record operator-provided Independent Review `PASS` for that exact pair.
- [ ] Verify final workflow run `32862042074` is completed/success and bound to reviewed head `86c01ee...`, with Ubuntu/macOS/Windows jobs PASS.
- [ ] If any tuple element does not match, stop; do not “repair” the history in docs.

## Task R2 — Archive H2B plan accurately

Move:

```text
docs/plans/active/foundation/h2b-runtime-composition-kernel.md
→ docs/plans/completed/foundation/h2b-runtime-composition-kernel.md
```

Decision:

- preserve historical corrective-cycle narrative;
- append/normalize a closure summary that distinguishes:

  ```text
  fifth-cycle Windows PostgreSQL 18.6 = PASS
  final head 86c01ee fresh PostgreSQL rerun = NOT_RUN
  final-head DB property evidence = CARRIED_FORWARD from fifth-cycle evidence
  independent review exact pair = PASS
  final CI exact pair = PASS
  squash merge = PASS
  ```

- correct the misleading current-summary claim `task_5_current_head_rerun: PASS`; it must not claim a final-head DB rerun that did not occur.

## Task R3 — Reconcile Roadmap stage truth

Set current truth to exactly:

```yaml
H2A_1: CLOSED
H2A_2: CLOSED
H2A_3: CLOSED
H2A: FUNCTIONALLY_COMPLETE
H2B: CLOSED
H2_FUNCTIONAL: COMPLETE
H2_STABILIZATION: ELIGIBLE
H2: OPEN
H3: NOT_ELIGIBLE
```

Update repository baseline to the H2B squash merge / current reconciliation base as appropriate.

Do not mark H2-S started in PR-R.

## Task R4 — Reconcile qualification ledgers

Update:

```text
Architecture_Corpus/qualification/results/qualification-status.json
Architecture_Corpus/qualification/results/Q-RUNTIME-01.md
Architecture_Corpus/qualification/results/Q-PERSISTENCE-01.md
```

Required truth:

- H2B runtime-kernel/substrate evidence remains current PASS where actually current.
- H2B external review/final CI/merge become PASS from observed evidence.
- H2B final-head real-PG rerun remains NOT_RUN; property evidence may be explicitly carried forward because the final corrective cycle did not modify DB/persistence/lineage behavior.
- H2A-3 historical final cross-platform CI remains `NOT_RUN`; do not retroactively convert H2-S or H2B CI into H2A-3 milestone CI.
- Product qualification residuals remain PARTIAL/NOT_RUN.

## Task R5 — Corpus inventory and local verification

Regenerate Corpus manifest/checksums using the repository's existing deterministic process, preserving metadata such as existing design date rather than resetting it.

Run:

```bash
pnpm check:corpus
pnpm check:agents
pnpm check:repository
pnpm format:check
pnpm verify
```

Prove changed paths are only `Architecture_Corpus/**` and `docs/**`.

Merge PR-R through the normal docs/evidence reconciliation path. Do not dispatch the behavior-candidate final CI again.

## Gate R — H2-S activation

H2-S may start only after PR-R merge and current repository truth says:

```text
H2B = CLOSED
H2_FUNCTIONAL = COMPLETE
H2_STABILIZATION = ELIGIBLE
H2 = OPEN
H3 = NOT_ELIGIBLE
```

---

# 5. PR-S — H2-S governing specification

**Branch:** `dev/h2-stabilization`

**Plan path installed in repository:** `docs/plans/active/foundation/h2-stabilization-closure.md`

**Base:** exact PR-R merge SHA. Record the concrete SHA in the installed plan before any behavior commit.

**PR:** one Draft PR; ordinary pushes do not dispatch CI.

## 5.1 A/B/C scope budget

### A — MUST fix before H2 can close

```text
A1 development-stage provenance in current executable/canonical identity
A2 undeclared project-history compatibility behavior or compatibility-shaped tests
A3 GENESIS_EVIDENCE.json and scripts/phases/repository-genesis.mjs one-time archaeology
A4 stale executor governance in root AGENTS.md
A5 absence of a permanent history/compatibility hygiene gate
A6 Bootstrap production boundary not mechanically preventing RuntimeKernel/Cordis coupling
A7 Host ownership terminality not owning Runtime supervisor terminality
A8 planned maintenance not using real Runtime quiescence in H2 joint proof
A9 no fresh final-candidate real PostgreSQL 18.6 H2-S evidence
A10 stale/overstated current evidence projections before candidate freeze
```

### B — fix only when local, bounded, and necessary to make A correct

```text
B1 rename shared test helper APIs to make “no runtime exists” semantics explicit
B2 consolidate redundant historical-shape tests into current-contract validation cases
B3 small local refactors needed to make supervisor lifecycle state coherent/testable
B4 documentation/index/hash updates caused by the governance rewrite
```

### C — out of scope

```text
DBOS / WorkItem / durable scheduler / EffectFence implementation
new product Host orchestrator package
new general application composition framework
H3 durable work/effect semantics
H4 management/policy surfaces
advanced cognition
new dependency selection or upgrades
source-less packaging implementation
Linux/macOS product PostgreSQL qualification beyond existing product residual tracking
compatibility/upcaster framework for hypothetical future releases
rewriting historical completed plans merely to remove stage identifiers
```

---

# 6. Root AGENTS.md — exact replacement design

The current file is replaced, not incrementally extended.

The final root file must contain the following semantic content. Keep wording close and keep it compact; do **not** restore the removed macro invariant list, Foundation feature inventory, or Skill routing table.

```markdown
# AGENTS.md

Repository-wide execution contract for coding agents working on Heptalogos.
This file is intentionally small. It is not an architecture summary, roadmap,
or Skill router.

## 1. Working authority

For an implementation task, follow this order:

1. the current Architecture Corpus;
2. the explicitly approved active implementation plan;
3. current code/tests as implementation reality.

The Corpus owns semantics. The plan owns the authorized change sequence and
all task-specific decisions. Existing code and historical behavior do not gain
Authority merely because they already exist.

Execute the plan that the task explicitly names. Do not select another plan by
filename, recency, or convenience.

A plan must be decision-complete for non-trivial work. You may choose local
code organization only when alternatives are semantically equivalent. You may
not choose or reinterpret Authority, package boundaries, dependency roles,
compatibility policy, durable shapes, stable identities, lifecycle semantics,
stage scope, or verification claims. If a required non-trivial decision is not
resolved by Corpus + plan, stop and report `PLAN_GAP`; do not improvise.

If Corpus and plan conflict, stop and report the conflict.

## 2. Current tree is not development history

Current source, tests, test-support, fixtures, scripts, tooling, configuration,
workflow definitions, and current agent instructions must describe what the
system is now, not the milestone/PR/session that created them.

Do not leave development provenance such as milestone IDs, phase IDs,
corrective-cycle names, PR IDs, temporary migration names, or “new/old”
development labels in long-lived executable identities. Use semantic role names.

Git history, completed plans, and historical qualification records preserve
provenance. Do not keep one-time phase evidence or phase scripts in the current
tree solely as an archive.

## 3. PRE_PRODUCTION evolution

`CompatibilityEpoch = PRE_PRODUCTION`.
Current compatibility obligations are declared only in
`Architecture_Corpus/references/compatibility-obligations.json`.

No declaration means no obligation.

Project-owned development history — previous commits, branches, milestones,
local fixtures, developer databases, and previous local builds — does not
justify backward compatibility.

When a current contract/schema changes during PRE_PRODUCTION:

1. rewrite the current canonical shape;
2. update current callers/tests;
3. rewrite/squash the development migration baseline when applicable;
4. reset/recreate project-owned development state;
5. delete obsolete implementation.

Do not add legacy readers, compatibility shims, upcasters/downcasters, bridge
migrations, aliases, dual readers/writers, deprecated internal APIs, or fallback
parsers for project development history. Do not preserve such code merely
because it already exists.

Version fields remain required where architecture requires versioned contracts;
versioning does not itself create a backward-compatibility obligation.

## 4. Implementation constraints

Stay inside the approved plan. Do not opportunistically add capabilities,
packages, dependencies, compatibility paths, or architecture abstractions.

Use the existing semantic owner and mutation Authority. Do not create a second
Authority path or bypass owning services with direct SQL/filesystem/shell
mutation.

For generic mechanics, follow the adopted dependency route. Do not silently
replace an adopted library/framework with custom infrastructure. Keep framework
objects behind Heptalogos-owned contracts.

Any process-memory background work must have an owner and bounded
cancel/drain/dispose behavior. Anything that must survive restart requires the
Foundation-owned durable primitive specified by the Corpus/plan.

Behavior-affecting literals must follow the repository configuration policy;
do not hide product policy in incidental constants.

## 5. Verification and candidate integrity

Verification state is exactly:

`PASS | FAIL | NOT_RUN | BLOCKED`

Never report PASS for a command/scenario that did not run. Match evidence to the
claim: mocks do not prove live protocols; one OS does not prove another; a
development tree does not prove a source-less artifact.

Run the plan's focused tests while editing and all required permanent gates
before claiming completion. `pnpm verify` must remain locally runnable.

Do not dispatch ordinary CI. Follow the repository closure playbook for exact
`(base_sha, head_sha)` Independent Review, manual final CI, and squash merge.
After a candidate is under Independent Review, any repository mutation
invalidates that review/final-CI candidate.

## 6. Stop conditions

Stop instead of inventing a workaround when execution would require:

- changing Corpus semantics or resolving a Corpus conflict;
- making a non-trivial decision absent from the approved plan;
- adding/replacing a dependency or creating a new subsystem/package;
- declaring a new compatibility obligation or preserving an undeclared one;
- changing stage boundaries or pulling later-stage semantics forward;
- bypassing an owning Authority to make a test pass;
- claiming required evidence that cannot actually be produced.

Report the smallest concrete blocker and the evidence that exposed it.
```

### Explicit removals from old AGENTS.md

Do not retain these sections in another form inside root AGENTS:

```text
old §2 macro “Non-negotiable invariants” list
old §3 long Foundation scope / advanced-cognition inventory
old §4 Skill routing table
long roadmap/planning guidance
full Independent Review explanation / command procedure
Hn-S theory beyond the minimal executor rule
```

Those belong in Corpus, Skills, plans, and playbooks.

---

# 7. Governance document changes — locked content

## 7.1 `Architecture_Corpus/00-项目宪法与工程宪法.md`

Modify `E20` to state explicitly:

```text
Current compatibility obligations are authoritative only when declared in
references/compatibility-obligations.json.
No matching declaration means no compatibility obligation.
```

Append new engineering principle `E43. Current Canonical Tree Is Not a Development Archive` with these exact semantics:

```text
The current checkout describes the canonical present, not the chronology that produced it.
Development provenance belongs in Git / completed plans / historical evidence.
Long-lived executable identities must use current domain/operational semantics, not milestone/PR/session/temporary migration identity.
During PRE_PRODUCTION, project development history cannot acquire compatibility Authority by surviving in code.
One-time phase evidence/scripts and ownerless historical artifacts must be removed after their current purpose ends.
Retention “for history” is not a current owner/purpose; Git is the archive.
```

Do not add these operational details to AGENTS; the Corpus is the long-term principle owner.

## 7.2 Create `Architecture_Corpus/references/compatibility-obligations.json`

Exact initial content:

```json
{
  "schemaVersion": 1,
  "compatibilityEpoch": "PRE_PRODUCTION",
  "obligations": []
}
```

This file is the sole machine-readable current product compatibility obligation register.

Do not add placeholder/example obligations. Do not add “internal dev DB” or “previous build” obligations.

## 7.3 Rewrite `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`

Keep the existing exact-pair closure governance, but expand/restructure the document around these normative sections:

1. **Purpose:** `Hn functional completion != Hn closure`; Hn-S makes Hn trustworthy for Hn+1.
2. **Decision-complete stabilization plan:** known A/B/C decisions are made before executor work; executor stops on non-trivial `PLAN_GAP`.
3. **A/B/C scope budget + Stop Rule.**
4. **Development Provenance Neutrality:**

   ```text
   Development provenance MUST NOT become canonical identity.
   Hn-S MUST leave a history-neutral canonical/executable tree.
   ```

5. **Compatibility Obligation Purity:**

   ```text
   COMPATIBILITY REQUIRES A DECLARED OBLIGATION.
   No declared obligation -> rewrite/reset/reject/delete; do not adapt.
   PRE_PRODUCTION development history creates no compatibility obligation.
   ```

6. **Current-Tree Archaeology:** every current artifact requires a current owner/purpose; one-time closed-phase evidence/scripts are removed, not archived in another current directory.
7. **Surface classification:** canonical/executable vs provenance/historical vs normative architecture.
8. **Negative test rule:** tests may prove current schema strictness and unsupported input rejection, but must not preserve obsolete development chronology as named fixtures/“legacy compatibility” suites.
9. **Migration rule:** current PRE_PRODUCTION baseline may be rewritten/squashed; do not accumulate dev chronology.
10. **Mandatory Hn-S sweeps:** provenance, compatibility, dead artifact, architecture seam, evidence.
11. **Closure tuple:** exact pair review/CI/merge + separate post-merge reconciliation.
12. **Current milestone truth lives only in Roadmap + qualification projection.**

Add hard closure formulas:

```text
canonical/executable development provenance residue > 0 -> A blocker
undeclared compatibility behavior > 0 -> A blocker
closed-phase current-tree artifact without current owner/purpose > 0 -> A blocker
```

## 7.4 `Architecture_Corpus/20-架构审查清单.md`

Add a dedicated current-tree evolution section with yes/no questions:

```text
- Does any current executable identity encode milestone/PR/session history instead of semantic role?
- Does any reader/writer/parser/alias/fallback preserve a previous project-development shape?
- For every compatibility-like behavior, which declared obligation requires it?
- If no obligation exists, was obsolete behavior removed rather than adapted?
- Is PRE_PRODUCTION migration history a current baseline rather than a chronology of dev corrections?
- Are historical-shape tests phrased as current contract validation rather than archaeology?
- Does every one-time evidence/script/artifact in the current tree still have a current owner and consumer?
- Is the implementation plan decision-complete, or is the executor being asked to choose architecture/scope?
```

## 7.5 `docs/plans/README.md`

Add `Decision completeness` policy:

```text
An ACTIVE implementation plan is an executable specification, not an option memo.
Before execution it MUST resolve non-trivial choices affecting Authority,
semantic ownership, package/dependency boundaries, compatibility, durable
shape, stable identity, lifecycle/failure semantics, stage scope and required
evidence.

The executor may choose only semantics-equivalent local implementation details.
An unresolved non-trivial choice is PLAN_GAP and stops execution.
```

## 7.6 Rewrite `docs/engineering/playbooks/repository/h-stage-stabilization-closure.md`

Preserve exact-pair review/CI/merge procedure but make these steps mandatory **before candidate freeze**:

```text
1. Development-Provenance Residue Sweep
2. Undeclared-Compatibility Residue Sweep
3. Closed-Phase / Dead Current-Tree Artifact Sweep
4. Hn cross-milestone architecture seam audit
5. Current-candidate claim-matched qualification
6. pnpm check:hygiene PASS
```

The playbook must state that the executor cannot create an allowlist to waive findings and cannot classify a new semantic ambiguity by preference; it stops as `PLAN_GAP`.

## 7.7 Create `docs/engineering/playbooks/repository/current-tree-hygiene.md`

This is the operational companion to Corpus 26. Required sections:

```text
Purpose
Surface classification
Sweep A: stage/provenance residue
Sweep B: compatibility-history residue
Sweep C: dead phase/current-tree artifacts
Decision matrix: rename vs reframe test vs delete vs STOP
Migration baseline rule
Machine gate behavior
Hn-S zero-residue checklist
Examples from Heptalogos (semanticized, not stage-named)
```

Required decision matrix:

| Finding | Action |
|---|---|
| Stage/PR/session token only affects name/path/test label | rename to semantic role; update all references; no alias |
| Negative test describes an old dev shape but still proves current required-field/schema strictness | reframe to current invariant; remove historical wording/data names |
| Negative test only duplicates generic unsupported-version/unknown-field coverage | delete it |
| Reader/parser/writer/fallback actually accepts previous dev shape | delete old branch and update canonical tests; no shim |
| Previous dev DB requires migration | rewrite/squash current baseline and rebuild dev/test DB |
| One-time phase artifact has no current consumer | delete; keep history in Git/completed plan |
| Artifact appears to have a current consumer but purpose is unclear | `PLAN_GAP`; do not delete or preserve by guess |
| Evidence suggests a real external consumer/retained production state | `PLAN_GAP` + architecture review; do not invent an obligation |

## 7.8 Create `docs/engineering/gotchas/repository/preproduction-maintenance-bias.md`

Record the recurring Agent failure mode:

```text
maintenance-project default: unknown old dependency -> preserve/compat
Heptalogos PRE_PRODUCTION default: no declared obligation -> rewrite/delete
```

Include:

```text
Existence is not justification.
Merged is not Authority.
Old dev DB is not a user.
Previous milestone is not a compatibility consumer.
Prepare for future evolution != implement present backward compatibility.
```

## 7.9 Update engineering indexes

Modify:

```text
docs/engineering/PLAYBOOK.md
docs/engineering/GOTCHAS.md
scripts/README.md
```

`scripts/README.md` final policy must be:

```text
scripts/verify/ = permanent current repository gates.
Reusable implementation belongs in tools/repo-kit.
One-time phase acceptance scripts do not remain after phase closure; their commands/results live in completed plans and Git history.
```

Do not retain `scripts/phases/` as a historical-tools directory.

## 7.10 Skills / automatic routing resources

Modify:

```text
.agents/skills/heptalogos-architecture/SKILL.md
.agents/skills/heptalogos-verification/SKILL.md
.agents/heptalogos/corpus-routes.json
.agents/heptalogos/tests/skill-routing-cases.json
.agents/heptalogos/package-manifest.json
```

Decisions:

- `heptalogos-architecture` must directly include Corpus 26 in its authority route and stop on `PLAN_GAP` / undeclared compatibility.
- `heptalogos-verification` must require `check:hygiene` for Hn-S closure and preserve Current vs Historical Evidence distinction.
- Add a routing case for “keep an old internal schema via compatibility shim because an earlier milestone used it”; expected skills include architecture and verification as appropriate to current routing model.
- Add a routing case for “leave phase-named fixtures and one-time evidence in current tree”; expected architecture/verification governance route.
- Do **not** recreate a Skill routing table in root AGENTS.md. Harness/resource routing owns that function.
- Recompute package-manifest file sizes/SHA-256 after all agent-package changes.

---

# 8. Permanent `check:hygiene` gate — exact design

## 8.1 Files

Create:

```text
tools/repo-kit/src/current-tree-hygiene.mjs
tools/repo-kit/test/current-tree-hygiene.test.mjs
scripts/verify/current-tree-hygiene.mjs
```

Modify:

```text
package.json
tools/repo-kit/README.md
```

No new npm dependency is allowed. Use Node standard library and existing repo-kit patterns.

## 8.2 Package command

Add:

```json
"check:hygiene": "node scripts/verify/current-tree-hygiene.mjs"
```

Insert `pnpm check:hygiene` into `pnpm verify` after `check:repository` and before dependency/boundary/type/test/build gates.

## 8.3 Scan surfaces

### Provenance-neutral scan

Scan file paths and textual content under current surfaces:

```text
AGENTS.md
.agents/**
.github/**
fixtures/**
packages/**
scripts/README.md
scripts/verify/**
tools/**
package.json
project.json
pnpm-workspace.yaml
nx.json
tsconfig*.json
eslint.config.mjs
vitest.config.ts
```

Do not scan:

```text
Architecture_Corpus/**
docs/**
pnpm-lock.yaml
node_modules / dist / coverage / tmp / generated caches
```

Exact self-exemptions are allowed only for:

```text
tools/repo-kit/src/current-tree-hygiene.mjs
tools/repo-kit/test/current-tree-hygiene.test.mjs
scripts/verify/current-tree-hygiene.mjs
```

because those files necessarily contain test fixtures / detection patterns. No generic ignore file, inline suppression comment, baseline snapshot, or allowlist mechanism is authorized.

## 8.4 Development provenance detection

The scanner must reject stage/milestone identity in current surfaces.

Content detection must cover at least:

```text
M3 M4 M5A M5B ...
H1 H1S H2 H2A1 H2A2 H2A3 H2B H2-S ...
lower-case semantic-ID/path equivalents such as h2a3, h2b, m5a
PR/corrective-cycle/session IDs when used as executable identity
```

Implement with tested boundary-aware patterns, not raw substring matching. Avoid matching arbitrary words containing those characters.

The test suite must prove:

```text
H2A3_TEST_PASSWORD -> rejected
heptalogos-h2a3-anchor -> rejected
test.h2b.service -> rejected
M5A PostgreSQL qualification -> rejected
semantic names such as host-maintenance / runtime-kernel -> allowed
Hn-S generic policy text is not part of scanned docs anyway
```

## 8.5 High-signal historical compatibility detection

In **implementation/test surfaces under `packages/**` and `fixtures/**`**, reject high-signal project-history terms/identities such as:

```text
legacy
obsolete
deprecated
upcast
downcast
backward-compat / backward compatibility
compatibility shim / bridge / alias
old schema / old format / old payload / old field / old API
previous schema / previous format / previous payload / previous API
```

Do **not** reject the generic word `compatible` because Runtime contract-version compatibility is a current semantic mechanism, not necessarily historical backward compatibility.

Do **not** reject version numbers (`V1`, `V2`) by themselves. Current contract version semantics are legitimate.

The gate is a high-signal mechanical detector, not the entire semantic audit. Task S4 still performs the semantic fallback/alias/dual-reader audit.

## 8.6 Closed-phase artifact checks

The gate must explicitly fail if either exists:

```text
GENESIS_EVIDENCE.json
scripts/phases/
```

No substitute archive directory is added.

## 8.7 Compatibility register check

Load:

```text
Architecture_Corpus/references/compatibility-obligations.json
```

For this plan require:

```text
compatibilityEpoch === "PRE_PRODUCTION"
obligations.length === 0
```

If execution encounters a non-empty register, stop as repository drift / architecture change; do not adjust scanner semantics locally.

## 8.8 Required unit tests

Write tests before wiring the gate into `pnpm verify`:

- [ ] rejects phase-named filename;
- [ ] rejects phase token in test constant/value;
- [ ] rejects phase token in temporary path;
- [ ] rejects `legacy`/`obsolete` current test wording;
- [ ] allows `contract compatibility` / current version negotiation wording;
- [ ] ignores completed-plan/provenance paths when using a fixture tree;
- [ ] rejects `GENESIS_EVIDENCE.json`;
- [ ] rejects `scripts/phases/`;
- [ ] passes a history-neutral fixture;
- [ ] fails malformed/missing compatibility register;
- [ ] fails non-empty PRE_PRODUCTION obligations for this repository state.

Run:

```bash
pnpm nx run repo-kit:test
pnpm check:hygiene
```

At first repository-wide run, `pnpm check:hygiene` is expected to be **FAIL** because known residue still exists. Record that red state; do not weaken the gate.

---

# 9. Known current-tree archaeology cleanup — exact decisions

Task S3 executes these known changes. The executor is not deciding whether to retain them.

## 9.1 Delete closed Repository Genesis artifacts

Delete:

```text
GENESIS_EVIDENCE.json
scripts/phases/repository-genesis.mjs
```

The now-empty `scripts/phases/` directory disappears.

Do not move the files to `docs/archive`, `.history`, `legacy`, or another current-tree location.

Historical references in `docs/plans/completed/**` remain historical evidence and are not rewritten solely because the live files are gone.

## 9.2 Rename long-lived integration files to semantic identity

Rename without compatibility copies/symlinks:

```text
packages/bootstrap-runtime/src/h2a3-execution-foundation.integration.test.ts
→ packages/bootstrap-runtime/src/execution-foundation.integration.test.ts

packages/bootstrap-runtime/src/h2b-runtime-kernel.integration.test.ts
→ packages/bootstrap-runtime/src/runtime-kernel-managed-host.integration.test.ts
```

Update every project target/reference. Do not leave aliases under the old names.

New H2-S joint integration file is named:

```text
packages/bootstrap-runtime/src/runtime-host-lifecycle.integration.test.ts
```

Never `h2s-runtime-lifecycle.integration.test.ts`.

## 9.3 Canonical PostgreSQL test support

In `packages/bootstrap-runtime/src/test-support/canonical-postgres.ts`:

```text
H2A2_TEST_BOOTSTRAP_PASSWORD_* -> CANONICAL_PG_TEST_BOOTSTRAP_PASSWORD_*
H2A2_TEST_HOST_LEASE_PASSWORD_* -> CANONICAL_PG_TEST_HOST_LEASE_PASSWORD_*
H2A2_TEST_RUNTIME_PASSWORD_* -> CANONICAL_PG_TEST_RUNTIME_PASSWORD_*
H2A2_TEST_MIGRATION_PASSWORD_* -> CANONICAL_PG_TEST_MIGRATION_PASSWORD_*
heptalogos-h2a3-canonical-anchor- -> heptalogos-canonical-postgres-anchor-
heptalogos-h2a3-canonical-<root>- -> heptalogos-canonical-postgres-<root>-
```

Rename helper:

```text
stopManagedHost(...) -> stopManagedHostWithoutRuntime(...)
```

Its semantics are explicitly for test compositions that instantiate no Runtime supervisor. Keep the inert Host quiescence only there, with a concise semantic comment. Runtime-bearing tests must use a real quiescence adapter and must not call this helper.

Update existing imports mechanically.

## 9.4 Persistence integration

In `packages/persistence/src/persistence.integration.test.ts`:

```text
H2A1_TEST_BOOTSTRAP_PASSWORD_* -> PERSISTENCE_TEST_BOOTSTRAP_PASSWORD_*
H2A1_TEST_HOST_LEASE_PASSWORD_* -> PERSISTENCE_TEST_HOST_LEASE_PASSWORD_*
H2A1_TEST_RUNTIME_PASSWORD_* -> PERSISTENCE_TEST_RUNTIME_PASSWORD_*
H2A1_TEST_MIGRATION_PASSWORD_* -> PERSISTENCE_TEST_MIGRATION_PASSWORD_*
h2a1_persistence_qualification -> persistence_qualification
```

Replace any H2A1 temporary resource name with `persistence` semantic naming.

## 9.5 Host ownership integration

In `packages/host-ownership/src/host-ownership.integration.test.ts`:

```text
M4_TEST_* -> HOST_OWNERSHIP_TEST_*
heptalogos-m4-host-pg- -> heptalogos-host-ownership-pg-
"Heptalogos M4 host ownership integration HBA" -> "Heptalogos host ownership integration HBA"
```

Any other M4 identity in the current file is replaced with the semantic `host-ownership` role.

## 9.6 Host ownership handoff integration

In `packages/bootstrap-runtime/src/host-ownership-handoff.integration.test.ts`:

```text
M4_TEST_BOOTSTRAP_PASSWORD_* -> HOST_HANDOFF_TEST_BOOTSTRAP_PASSWORD_*
M5A_TEST_RUNTIME_PASSWORD_* -> HOST_HANDOFF_TEST_RUNTIME_PASSWORD_*
M5A_TEST_MIGRATION_PASSWORD_* -> HOST_HANDOFF_TEST_MIGRATION_PASSWORD_*
heptalogos-m4-handoff-* -> heptalogos-host-handoff-*
KEEP_PRIVATE_POSTGRES_QUIESCENCE -> NO_RUNTIME_QUIESCENCE
```

Any stage-specific literal in that file becomes `host-handoff` semantic naming.

## 9.7 Host maintenance tests

In `packages/bootstrap-runtime/src/host-maintenance.integration.test.ts`:

```text
"M5A PostgreSQL maintenance qualification" -> "Host maintenance PostgreSQL qualification"
M5A_TEST_* -> HOST_MAINTENANCE_TEST_*
heptalogos-m5a-anchor- -> heptalogos-host-maintenance-anchor-
heptalogos-m5a-<root>- -> heptalogos-host-maintenance-<root>-
```

In `packages/bootstrap-runtime/src/host-maintenance.test.ts`:

```text
profile: "m5a" -> profile: "host-maintenance"
/tmp/heptalogos-m5a-* -> /tmp/heptalogos-host-maintenance-*
```

No old profile alias remains.

## 9.8 Bootstrap recovery tests / fixtures

For every current executable hit of `M5A_TEST` or `m5a` in:

```text
packages/bootstrap-runtime/src/bootstrap-recovery.integration.test.ts
packages/bootstrap-runtime/src/bootstrap-recovery-process.postgres.integration.test.ts
packages/bootstrap-runtime/test/fixtures/recovery-bootstrap-process.mjs
packages/bootstrap-runtime/test/fixtures/recovery-maintenance-process.mjs
```

replace stage identity with semantic `BOOTSTRAP_RECOVERY_TEST_*` / `bootstrap-recovery` names. Do not change recovery semantics.

## 9.9 Private PostgreSQL tests

For current executable hits of `M3_TEST` in:

```text
packages/private-postgres/src/credential-file.test.ts
packages/private-postgres/src/controller.integration.test.ts
packages/bootstrap-runtime/src/bootstrap-key-provider.test.ts
packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts
packages/bootstrap-runtime/src/private-postgres-bootstrap.test.ts
```

replace with `PRIVATE_POSTGRES_TEST_*` / `private-postgres` semantic naming.

In `packages/bootstrap-state/src/codec.test.ts`, change test profile fixture:

```text
profile: "m3" -> profile: "canonical"
```

The content digest remains a test-domain digest; no compatibility mapping is created.

## 9.10 Canonical initialization / execution foundation / Runtime integration IDs

In `canonical-initialization.integration.test.ts`:

```text
"H2A-2 canonical continuity PostgreSQL qualification"
→ "Canonical continuity PostgreSQL qualification"
```

In renamed `execution-foundation.integration.test.ts`:

```text
h2a3_atomicity_fixture -> execution_atomicity_fixture
H2A3AtomicityFactId -> ExecutionAtomicityFactId
test.h2a3.atomicity -> test.execution.atomicity
test.h2a3.atomicity.rollback -> test.execution.atomicity.rollback
H2A-3 describe/test wording -> Execution Foundation semantic wording
```

In renamed `runtime-kernel-managed-host.integration.test.ts`:

```text
H2B describe wording -> Runtime Kernel / managed Host semantic wording
h2b.integration.* IDs -> runtime.integration.*
```

Apply the same rule to every stage token found in those files.

## 9.11 Reframe historical-shape tests as current-contract validation

### `packages/bootstrap-state/src/codec.test.ts`

- Rename/rewrite `rejects obsolete development V1 that lacks continuityEpochId` to `rejects canonical V1 missing required continuityEpochId`.
- Replace variable names such as `obsoleteState` with semantic invalid-input names.
- Consolidate `rejects the obsolete pre-reset outer V2 shape` with generic unsupported-schema coverage. Final tests should prove unsupported schema versions are rejected without naming a historical reset.

### `packages/bootstrap-state/src/journal.test.ts`

Rewrite:

```text
rejects a legacy checkpoint lacking installation and instance identity
```

to:

```text
rejects a checkpoint missing required installation and instance identity
```

Use a neutral invalid stage name such as `bootstrap.invalid`, not `bootstrap.legacy`.

### `packages/bootstrap-state/src/maintenance-model.test.ts`

Rewrite historical wording to current invariants:

```text
rejects the legacy token/revision target without hostBootId
→ rejects a target missing required hostBootId

rejects the legacy target at RECOVERY_REQUIRED
→ rejects a recovery target missing required hostBootId
```

Keep semantic rejection coverage; remove archaeology wording.

### `packages/execution-lineage/src/lineage-context-ref.test.ts`

Rewrite:

```text
rejects future and obsolete PRE_PRODUCTION shapes
```

to:

```text
rejects unsupported versions and unknown fields
```

Replace `legacyBootId` with a neutral unknown field such as `unexpectedBootId`.

### `packages/runtime-kernel/src/runtime-kernel.test.ts`

Rewrite the Object.prototype test from `legacy mutation methods` to `Object.prototype mutation helpers` or equivalent current JavaScript-boundary semantics. Rename its test/invocation/provider labels so no `legacy` token remains.

## 9.12 Full current-surface sweep after known edits

Run:

```bash
pnpm check:hygiene
```

Then independently inspect current executable surfaces with `rg` to catch semantic cases the high-signal gate cannot infer.

Any additional finding that is **only a name/path/comment/test-label residue** follows the fixed rename/reframe rule above.

Any additional finding that would require behavior/Authority/compatibility interpretation is **not** an executor decision: stop with `PLAN_GAP` and provide the exact path, current behavior, and references.

---

# 10. PRE_PRODUCTION compatibility semantic audit — zero obligations

The compatibility register is empty. Therefore the burden of proof is already resolved:

```text
No declared obligation -> no project-history compatibility behavior is allowed.
```

## 10.1 Required semantic search

Search current implementation for patterns including, but not limited to:

```text
legacy / obsolete / deprecated
old/new field fallback
try current parser -> fallback previous parser
schemaVersion branches that accept an older project-development representation
upcast/downcast
alias exports preserving an old internal API
old/new dual read or dual write
bridge migration for developer databases
renamed env/config/CLI fallback kept only for previous repo revisions
“if field missing, infer previous representation”
```

Suggested discovery commands may use `rg`, but classification follows this plan, not keyword count.

## 10.2 Required action by finding type

### Actual previous-development reader/writer/fallback

Delete it. Update current tests to canonical current input/output. Do not preserve a deprecated alias.

### Developer DB migration chronology

Rewrite/squash the current baseline and recreate project-owned dev/test state. Current repository already has one `0001-foundation-baseline.ts`; H2-S must leave one canonical baseline unless a current architecture-owned reason—not history—requires additional migration mechanics.

### Strict rejection of unsupported inputs

Keep the rejection behavior when it is a current contract invariant, but phrase tests generically (`unsupported version`, `missing required field`, `unknown field`) rather than as “legacy compatibility”.

### Runtime Service/Capability contract-version compatibility

Keep current contract matching. It is a present provider/consumer selection semantic, not historical product backward compatibility. Do not remove `contractV2` tests merely because the word “compatibility” exists in that subsystem.

### Toolchain TS6 lane

Keep it. It is an explicitly adopted compiler/API qualification lane, not product-state backward compatibility.

### Any evidence of a real external consumer or retained production state

Stop `PLAN_GAP`. The current register says there is no such obligation, so discovering one is an architecture/truth conflict that the executor may not resolve.

## 10.3 Required result

Before Runtime lifecycle implementation begins:

```text
pnpm check:hygiene = PASS
CompatibilityEpoch = PRE_PRODUCTION
compatibility obligations = []
project-history compatibility behavior = 0 known
canonical migration baseline = one current 0001 baseline
```

---

# 11. Bootstrap ↔ Runtime production boundary hardening

Modify `scripts/verify/boundaries.mjs` and focused tests/fixtures as needed.

Permanent rule:

```text
packages/bootstrap-runtime production source MUST NOT import:
  @heptalogos/runtime-kernel
  @heptalogos/runtime-substrate
  cordis

bootstrap-runtime tests/integration may import runtime-kernel/runtime-substrate as dev/test composition.
```

Also require `packages/bootstrap-runtime/package.json` to keep runtime-kernel/runtime-substrate as dev/test dependencies only; they must not move into production `dependencies`.

Do not forbid the reverse structural contract fit; runtime-kernel remains generic and imports no Bootstrap/Host types.

Write a failing boundary fixture/test first, then implement the rule.

Run:

```bash
pnpm check:boundaries
pnpm check:dependencies
```

---

# 12. Runtime lifecycle correction — decision-complete design

## 12.1 Files

Modify:

```text
packages/runtime-kernel/src/contracts.ts
packages/runtime-kernel/src/supervisor.ts
packages/runtime-kernel/src/problems.ts
packages/runtime-kernel/src/index.ts
packages/runtime-kernel/src/supervisor.test.ts
packages/runtime-kernel/src/runtime-kernel.test.ts only when directly required
```

No new package.

## 12.2 Generic root owner contract

Add exactly this semantic interface (naming may match this plan unless an existing type conflict requires a purely local equivalent):

```ts
export interface RuntimeOwnerLifecycle {
  readonly signal: AbortSignal;
  onTerminalFailure(error: unknown): void;
}
```

`MicroSystemSupervisorOptions` accepts it optionally as `ownerLifecycle`.

It is a lifecycle/ownership input, not an Authority token and not a Host type.

Runtime Kernel must not import:

```text
HostOwnershipContext
BootstrapManagedHostContext
HostMaintenanceQuiescence
HostQuiescenceLease
bootstrap-runtime internals
```

## 12.3 Supervisor lifecycle state

Maintain a private supervisor lifecycle equivalent to:

```text
ACTIVE
QUIESCING
QUIESCED
RESUMING
CLOSING
CLOSED
```

It need not become a public product contract.

Public `reconcile()` is admitted only in `ACTIVE`.

Use stable Problems:

```text
runtime.supervisor.not_active
runtime.supervisor.resume_invalid
```

Do not invent automatic retry/backoff.

## 12.4 Immediate admission closure

Both `quiesce()` and terminal `close()/owner abort` must synchronously close new generation-fenced Service/Capability admission **before** their returned Promise can await cleanup.

An already-running reconcile must check supervisor lifecycle before each new MicroSystem start. A quiesce/close request may not allow a queued later start to sneak in after admission closure.

Already-admitted calls may drain up to existing bounded settlement timeout.

## 12.5 Reversible quiescence

Add:

```ts
export interface RuntimeQuiescenceLease {
  resumeAfterAbort(): Promise<void>;
}
```

and:

```ts
MicroSystemSupervisor.quiesce(): Promise<RuntimeQuiescenceLease>
```

Semantics:

```text
ACTIVE
-> synchronously state QUIESCING + close new generation admission
-> serialize behind existing mutation domain
-> stop running MicroSystems in deterministic reverse hard-Service order
-> boundedly settle admitted calls / retire generations
-> keep RuntimeSubstrate open
-> preserve latest accepted DesiredRuntimeSnapshot as in-process projection only
-> state QUIESCED
-> return one-shot lease
```

The captured Desired snapshot is the latest public desired value that passed planning/admission and entered reconciliation execution. A desired value rejected before execution does not replace the previous captured snapshot.

Quiescing before any desired snapshot has ever been accepted is legal; resume returns an empty ACTIVE supervisor without starting systems.

Second `quiesce()` while not ACTIVE fails `runtime.supervisor.not_active`.

If quiescence settlement fails/times out, do not return a resume lease and do not manufacture success. Admission remains closed; higher-level maintenance receives failure.

## 12.6 Resume semantics

`resumeAfterAbort()` is one-shot and valid only for the exact same supervisor while `QUIESCED`, not owner-aborted/closing/closed.

Semantics:

```text
QUIESCED
-> RESUMING
-> use the same internal planning/reconcile path with captured Desired
-> create fresh MicroSystemInstanceIds and fresh GenerationFences
-> pre-quiescence leases remain retired permanently
-> on successful reconcile completion, ACTIVE
```

“Successful reconcile completion” does not require every desired MicroSystem to be RUNNING; normal Actual states such as `FAILED` or `BLOCKED` remain valid outcomes of reconciliation. The requirement is that the supervisor returns to its normal reconciliation regime without violating invariants.

If resume hits a structural/integrity/cleanup failure that prevents coherent reconciliation, fail closed: do not reopen admission to a partially restored graph; transition terminal and surface/report the error rather than pretending safe-abort restoration succeeded.

Second resume or resume after terminal owner abort/close fails `runtime.supervisor.resume_invalid`.

## 12.7 Owner abort / terminal close

When `ownerLifecycle.signal` aborts:

```text
1. synchronously transition toward terminal close;
2. synchronously close new generation admission;
3. reject new reconcile/quiesce/resume;
4. serialize stop/dispose/substrate-close through the existing mutation domain;
5. never reacquire/reopen within the same supervisor;
6. report terminal cleanup failure through ownerLifecycle.onTerminalFailure(error).
```

If the owner signal is already aborted when supervisor is constructed, no runtime work is admitted and terminal substrate cleanup is scheduled immediately.

Remove/listener-clean up owner-signal subscriptions when terminal close completes.

`close()` is idempotent and returns the same terminal cleanup outcome on repeated calls. Closing from `QUIESCED` closes the substrate directly; it never resumes.

## 12.8 Required TDD cases

Write red tests first:

- [x] Q1 quiesce synchronously rejects new Service/Capability invocation while an admitted call is still draining;
- [x] Q2 quiesce stops hard Service dependents before providers; independent branch is deterministic;
- [x] Q3 quiesce/resume restores captured Desired with fresh MicroSystemInstanceIds/Fences;
- [x] Q4 old leases remain retired after resume;
- [x] Q5 resume lease is one-shot;
- [x] Q6 Desired revision/mode/bindings/intent are not mutated by quiesce;
- [x] Q7 quiesce before first desired snapshot can resume to empty ACTIVE state;
- [x] Q8 owner signal abort terminalizes supervisor and rejects later reconcile;
- [x] Q9 owner abort racing background failure does not double-retire/resurrect/deadlock;
- [x] Q10 close after quiesce never resumes and closes substrate once;
- [x] Q11 settlement timeout leaves admission closed and does not report quiescence success;
- [x] Q12 reconcile already in progress cannot start a later MicroSystem after quiesce becomes requested;
- [x] Q13 already-aborted owner signal admits no work;
- [x] Q14 repeated close is idempotent;
- [x] Q15 structural resume failure fails closed rather than returning ACTIVE with uncontrolled partial admission.

After each red/green slice:

```bash
pnpm nx run runtime-kernel:test
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

---

# 13. Real PostgreSQL H2 joint lifecycle proof

## 13.1 Files

Create:

```text
packages/bootstrap-runtime/src/runtime-host-lifecycle.integration.test.ts
```

Modify:

```text
packages/bootstrap-runtime/project.json
packages/bootstrap-runtime/src/test-support/canonical-postgres.ts only as already specified
```

Do not add production bootstrap/runtime composition code merely to satisfy the test.

## 13.2 Structural adapter

The integration may compose:

```ts
const supervisor = new MicroSystemSupervisor({
  ...,
  ownerLifecycle: {
    signal: host.signal,
    onTerminalFailure: recordFailure,
  },
});

const runtimeQuiescence = {
  quiesce: () => supervisor.quiesce(),
};
```

TypeScript structural compatibility is the intended seam. No cast to Cordis/Host private framework types and no Bootstrap production import into Runtime Kernel.

## 13.3 Required PostgreSQL 18.6 scenarios

All H2-S stage scenarios must execute on the final H2-S candidate; skip = `NOT_RUN` = candidate freeze blocked.

### PG1 — Normal H2 composition identity coherence

Boot managed Host, construct ExecutionContext/Persistence/Lineage/Runtime, reconcile synthetic Service provider A + hard dependent B + independent C.

Assert shared exact:

```text
InstallationId
InstanceId
BootId
ContinuityEpochId
HostOwnershipToken
ProductGenerationId runtime origin
```

### PG2 — Authentic Host terminality propagates to Runtime and Persistence

Terminate the authentic underlying Host/lease through package-internal test access so the real Host signal aborts.

Prove:

```text
Persistence becomes fenced/closing
new canonical mutation rejected
new Service/Capability invocation rejected
MicroSystem scopes terminally disposed
same supervisor cannot reconcile back to RUNNING
no in-place Host reacquire/reopen
```

### PG3 — Planned STOP uses real Runtime quiescence before Host token revoke

Use `runtimeQuiescence`, not `stopManagedHostWithoutRuntime`.

Prove ordering:

```text
runtime admission closed
-> admitted calls drained
-> runtime scopes stopped
-> Host maintenance commits HOST_QUIESCED
-> Host ownership token revoked / old Host terminal
-> private PostgreSQL stops
```

Old runtime leases remain retired.

### PG4 — Planned RESTART preserves continuity and rotates Host/runtime generation identity

After restart:

```text
same InstallationId
same InstanceId
same ContinuityEpochId
new BootId
new HostOwnershipToken
```

Construct fresh ExecutionContext/Persistence/Runtime for returned Host, reconcile same Desired, assert fresh MicroSystemInstanceIds/Fences and old leases rejected.

### PG5 — Host safe-abort contract composes with Runtime lease

Do not invent a destructive PG fault merely to duplicate the Host-maintenance unit fault matrix.

Required proof:

```text
RuntimeQuiescenceLease structurally satisfies HostQuiescenceLease
existing Host-maintenance tests prove resumeAfterAbort is called before PONR
Runtime unit tests prove actual one-shot resume semantics
```

Add one integration assertion that no private-type cast/adapter state machine is needed.

### PG6 — `shutdownKeepingPrivatePostgres` ordering

Prove:

```text
Runtime quiesces
-> old Host lease closes/terminalizes
-> Runtime cannot resume after Host terminality
-> PostgreSQL remains running by policy
```

Then use Bootstrap ownership for bounded test cleanup; do not pretend the closed Host remains Authority.

## 13.4 Integration target

Update `bootstrap-runtime:test:integration` to use semantic file names:

```text
src/private-postgres-bootstrap.integration.test.ts
src/host-ownership-handoff.integration.test.ts
src/host-maintenance.integration.test.ts
src/bootstrap-recovery.integration.test.ts
src/canonical-initialization.integration.test.ts
src/execution-foundation.integration.test.ts
src/runtime-kernel-managed-host.integration.test.ts
src/runtime-host-lifecycle.integration.test.ts
```

No H2A/H2B/H2S file names remain in the executable target.

---

# 14. PR-S task-by-task execution

## Task S0 — Activate H2-S

- [x] Confirm Gate R.
- [x] Create `dev/h2-stabilization` from exact PR-R merge SHA.
- [x] Create `docs/plans/active/foundation/h2-stabilization-closure.md` from this approved plan, replacing baseline placeholders with observed concrete PR-R SHA only; do not change design decisions.
- [x] Open one Draft PR; do not dispatch CI.
- [x] Record current worktree/base/branch state.

## Task S1 — Governance reset first

Implement §6-§7 exactly:

- [x] replace root AGENTS;
- [x] update Corpus E20 and add E43;
- [x] create empty compatibility obligation register;
- [x] rewrite Corpus 26;
- [x] update architecture review checklist;
- [x] update plan decision-completeness policy;
- [x] rewrite H-stage stabilization playbook;
- [x] create current-tree hygiene playbook;
- [x] create PRE_PRODUCTION maintenance-bias gotcha;
- [x] update PLAYBOOK/GOTCHAS/scripts indexes;
- [x] update architecture/verification Skills and routing resources;
- [x] regenerate agent package manifest hashes.

Run:

```bash
pnpm check:agents
pnpm check:corpus
pnpm format:check
```

Recommended commit:

```text
docs: make stabilization and preproduction history erasure explicit
```

## Task S2 — TDD permanent current-tree hygiene gate

- [x] write repo-kit unit tests from §8.8;
- [x] observe RED;
- [x] implement repo-kit scanner;
- [x] add thin `scripts/verify/current-tree-hygiene.mjs` wrapper;
- [x] add `check:hygiene` and wire into `verify`;
- [x] run focused repo-kit tests;
- [x] run `pnpm check:hygiene` and record expected repository RED from existing residue.

Do not “temporarily” allow current violations.

Recommended commit only after scanner unit tests pass even though repository-wide hygiene is expected red:

```text
feat: enforce current-tree history hygiene
```

## Task S3 — Erase known development provenance and dead phase artifacts

Execute every exact decision in §9.

After each coherent package group:

```bash
pnpm nx run <affected-project>:test
pnpm check:hygiene
```

The final S3 state must have:

```text
GENESIS_EVIDENCE.json absent
scripts/phases absent
old H2A3/H2B integration filenames absent
known M3/M4/M5A/H2A1/H2A2/H2A3/H2B executable identifiers absent
high-signal legacy/obsolete test wording absent
pnpm check:hygiene PASS
```

Recommended commits may be split by semantic group, e.g.:

```text
refactor: erase milestone identity from current test infrastructure
chore: retire closed repository genesis artifacts
```

Do not exceed the commit budget in §17 without Stop Rule review.

S3 completion evidence (2026-08-26): `GENESIS_EVIDENCE.json` and
`scripts/phases/` are absent; the two stage-named integration files and known
stage IDs are absent from current executable surfaces; historical-shape tests
were reframed; affected package tests, typecheck, TS6, boundaries, and
`pnpm check:hygiene` are `PASS`.

## Task S4 — Semantic compatibility audit

- [x] execute §10 semantic search;
- [x] inspect parser/read/write/alias/fallback branches, not just keyword hits;
- [x] remove any project-history compatibility behavior using the locked action matrix;
- [x] keep current contract-version matching and TS6 toolchain lane;
- [x] verify only one current canonical migration baseline remains;
- [x] run affected unit/integration tests;
- [x] run `pnpm check:hygiene`.

Record a short audit table in the active H2-S plan:

```text
finding | current purpose | declared obligation | action | evidence
```

Because obligations are empty, every historical compatibility behavior must end `REMOVED`, while current non-historical contract-version semantics may end `KEEP_CURRENT_SEMANTIC`.

If a finding implies a real obligation, STOP `PLAN_GAP`.

S4 result: `compatibilityEpoch = PRE_PRODUCTION`, obligations are empty,
project-history compatibility residue is zero, and the audit table above records
the current semantic mechanisms retained versus historical behaviors removed.

## Task S5 — Mechanically harden Bootstrap production boundary

Implement §11 with failing boundary proof first.

Run:

```bash
pnpm check:boundaries
pnpm check:dependencies
pnpm nx run bootstrap-runtime:test
```

Recommended commit:

```text
chore: fence bootstrap runtime from normal runtime implementation
```

## Task S6 — TDD Runtime owner lifecycle and reversible quiescence

Execute §12 test-by-test.

Required focused gates after each slice:

```bash
pnpm nx run runtime-kernel:test
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

Recommended final commit:

```text
fix: bind runtime lifecycle to root ownership and reversible quiescence
```

S6 completion evidence (2026-08-26, commit `b717314`): Q1-Q15 are `PASS`
through 121 runtime-kernel tests; the required focused `check:boundaries`,
`typecheck`, and `tsc6` gates are `PASS`. The implementation exports the
generic `RuntimeOwnerLifecycle` and `RuntimeQuiescenceLease`, closes generation
admission synchronously, preserves accepted Desired state across reversible
quiescence, and terminalizes on owner abort or structural resume failure.

## Task S7 — Real PostgreSQL Runtime/Host lifecycle integration

Implement §13 with semantic file names only.

Run:

```bash
pnpm nx run bootstrap-runtime:test:integration
```

H2-S PG1-PG6 must execute; no skipped H2-S stage scenario.

Recommended commit:

```text
test: prove managed host and runtime lifecycle closure
```

S7 implementation evidence (2026-08-26, commits `6f9cd4d` and `bbea4ae`):
`runtime-host-lifecycle.integration.test.ts` covers PG1-PG6, including the
structural `HostMaintenanceQuiescence` seam, authentic Host lease-backend
termination, planned STOP/RESTART ordering, fresh Runtime generations, and
shutdown-keeping-PostgreSQL. With the process-local
`HEPTALOGOS_TEST_PG_BIN=C:\dev\Heptalogos\tmp\pg\extracted\pgsql\bin`, all
required scenarios execute on PostgreSQL 18.6: PG1-PG6 are `PASS`, and the
aggregate `bootstrap-runtime:test:integration` is `PASS` (8 suites, 58 tests).
The supporting private-postgres, Host ownership, persistence, and recovery
targets are recorded in S9.

## Task S8 — Full H2 current-tree re-audit

Re-run all mandatory S sweeps after Runtime changes, because new code can reintroduce residue.

### S8.1 History neutrality

```bash
pnpm check:hygiene
```

Must PASS.

### S8.2 PRE_PRODUCTION compatibility

Confirm:

```text
compatibility register epoch = PRE_PRODUCTION
obligations = []
no project-history reader/shim/alias/fallback
one canonical Foundation migration baseline
```

### S8.3 Persistence / ExecutionContext authority

Run:

```bash
pnpm nx run persistence:test
pnpm nx run persistence:test:integration
pnpm nx run execution-lineage:test
pnpm nx run canonical-schema:test
```

Re-prove:

```text
mutation without ExecutionContext rejected
stale BootId/token/ContinuityEpoch origin rejected
stale HostOwnershipFence rejected
commit-uncertain remains explicit
Host signal abort fences/drains Persistence
```

### S8.4 Runtime regressions

Re-prove:

```text
hard Service missing -> BLOCKED
Service ambiguity -> fail closed
explicit unavailable Capability binding -> no fallback
Capability withdrawal/rebind -> readiness recompute
OperatingMode change -> Desired preserved
background provider failure -> dependent closure; independent branch survives
old generation leases remain fenced
```

### S8.5 Framework leakage

```bash
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

No Cordis/Graphlib/Kysely/pg/Bootstrap private object becomes a stable Heptalogos contract.

S8 re-audit evidence (2026-08-26): `check:hygiene`, compatibility register
(`PRE_PRODUCTION`, obligations `[]`), repository, Corpus, dependency, boundary,
agent-resource, and TS6 gates are `PASS`. Runtime Substrate (16 tests), Runtime
Kernel (121 tests), Persistence (19 tests), Execution Lineage (29 tests),
Canonical Schema (3 tests), Evidence (4 tests), Time Service (4 tests), and
repo-kit (27 tests) are `PASS`. Persistence PostgreSQL integration is `PASS`
(9/9) on Windows PostgreSQL 18.6.

## Task S9 — Fresh H2-S local qualification matrix

Candidate freeze is BLOCKED unless final-candidate PostgreSQL 18.6 is actually available.

### S9.1 Toolchain identity

Verify required binaries from `HEPTALOGOS_TEST_PG_BIN` report PostgreSQL 18.6:

```text
postgres
initdb
pg_ctl
pg_controldata
pg_isready
```

No matching toolchain -> H2-S DB gate `BLOCKED`, not skipped PASS.

### S9.2 Focused packages

```bash
pnpm nx run runtime-substrate:test
pnpm nx run runtime-kernel:test
pnpm nx run persistence:test
pnpm nx run execution-lineage:test
pnpm nx run canonical-schema:test
pnpm nx run evidence:test
pnpm nx run time-service:test
pnpm nx run repo-kit:test
```

### S9.3 Real PostgreSQL integration closure

```bash
pnpm nx run private-postgres:test:integration
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
pnpm nx run bootstrap-runtime:test:recovery-process
pnpm nx run bootstrap-runtime:test:recovery-process:postgres
pnpm nx run persistence:test:integration
```

Record each target separately.

### S9.4 All permanent gates

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:hygiene
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm tsc6
pnpm test
pnpm build
pnpm verify
```

Every reported PASS must correspond to an actually executed command.

S9 qualification evidence (2026-08-26): the process-local toolchain identity
check reports PostgreSQL 18.6 for `postgres`, `initdb`, `pg_ctl`,
`pg_controldata`, `pg_isready`, and `pg_config`. Focused package targets are
`PASS`: Runtime Substrate (16/16), Runtime Kernel (121/121), Persistence unit
(19/19), Execution Lineage (29/29), Canonical Schema (3/3), Evidence (4/4),
Time Service (4/4), and repo-kit (27/27). Real PostgreSQL targets are all
`PASS`: private-postgres integration (20/20), host-ownership integration
(10/10), bootstrap-runtime integration (8 suites, 58 tests),
bootstrap-runtime recovery-process (4/4), bootstrap-runtime
recovery-process:postgres (2/2), and persistence integration (9/9).

## Task S10 — Candidate-time evidence and plan completion

Before Independent Review, finish **all** repository mutation.

Update:

```text
Architecture_Corpus/qualification/results/qualification-status.json
Architecture_Corpus/qualification/results/Q-RUNTIME-01.md
Architecture_Corpus/qualification/results/Q-PERSISTENCE-01.md
docs/roadmap/development-roadmap.md
active H2-S plan
Corpus inventory/checksums
```

### Pre-review Roadmap truth

Set exactly:

```yaml
H2A_1: CLOSED
H2A_2: CLOSED
H2A_3: CLOSED
H2A: FUNCTIONALLY_COMPLETE
H2B: CLOSED
H2_FUNCTIONAL: COMPLETE
H2_STABILIZATION: IMPLEMENTATION_COMPLETE_AWAITING_REVIEW
H2: OPEN
H3: NOT_ELIGIBLE
```

### H2-S evidence record must include

```text
current candidate base/head
check:hygiene PASS
compatibility obligations = []
current-tree archaeology sweep PASS
GENESIS artifacts removed
runtime owner/quiescence unit evidence
fresh PostgreSQL 18.6 PG1-PG6 evidence
persistence/Host/bootstrap regressions
pnpm verify PASS
Independent Review = NOT_RUN
final cross-platform CI = NOT_RUN
squash merge = NOT_RUN
product residual qualification = unchanged PARTIAL/NOT_RUN where applicable
```

Move H2-S plan:

```text
docs/plans/active/foundation/h2-stabilization-closure.md
→ docs/plans/completed/foundation/h2-stabilization-closure.md
```

The completed plan records implementation/qualification complete but external closure gates still NOT_RUN.

Regenerate Corpus inventory and agent package hashes if any final normative files changed.

Run final local `pnpm verify`.

Commit all remaining evidence/docs. Then freeze candidate.

No repository mutation is allowed after this point unless review is invalidated and a new candidate cycle starts.

## Task S11 — Freeze exact ReviewCandidate and request Independent Review

Record:

```text
REVIEWED_BASE_SHA = exact PR-R merged master base used by branch
REVIEWED_HEAD_SHA = final H2-S head
```

Independent Review must examine the **entire** PR-S diff, including governance/hygiene cleanup and Runtime lifecycle work.

Implementing Agent self-review is insufficient.

If review returns changes requested:

```text
unfreeze -> fix -> rerun affected qualification + full pnpm verify -> update evidence -> new head -> new exact-pair review
```

Never carry old review PASS to a new head/base.

## Task S12 — Manual exact-pair final CI

Only after Independent Review `PASS`, dispatch the repository manual verify workflow for the reviewed pair.

Require Ubuntu, macOS, Windows PASS and verify workflow provenance/head SHA matches `REVIEWED_HEAD_SHA`.

Because `pnpm verify` now includes `check:hygiene`, final CI also proves the current tree is mechanically history-neutral on all three CI hosts.

Do not claim final CI proves real PostgreSQL 18.6 on every OS unless the workflow actually runs those product scenarios. Stage real-PG evidence remains the fresh local/current-host qualified run; cross-platform product residuals remain separately tracked.

## Task S13 — Pre-merge identity check and squash merge

Immediately before merge verify:

```text
origin/master == REVIEWED_BASE_SHA
PR base SHA == REVIEWED_BASE_SHA
branch HEAD == REVIEWED_HEAD_SHA
PR head SHA == REVIEWED_HEAD_SHA
```

Any move invalidates review and final CI.

Squash merge PR-S. Delete branch only after merge is confirmed.

Do not edit merged behavior candidate afterward.

---

# 15. PR-C — H2 final post-stabilization truth reconciliation

**Branch:** `dev/h2-post-stabilization-reconciliation`

**Allowed:** only `Architecture_Corpus/**` and `docs/**`.

**Forbidden:** source/tests/scripts/tools/AGENTS/Skills/package behavior changes.

## Task C1 — Verify external H2-S closure tuple

Before editing, record externally observed:

```text
PR-S number
reviewed base SHA
reviewed head SHA
operator Independent Review PASS for exact pair
manual final CI run ID + Ubuntu/macOS/Windows PASS
squash merge SHA
```

If tuple is incomplete/mismatched, stop; H2 remains OPEN.

## Task C2 — Final Roadmap truth

Set exactly:

```yaml
H2A_1: CLOSED
H2A_2: CLOSED
H2A_3: CLOSED
H2A: FUNCTIONALLY_COMPLETE
H2B: CLOSED
H2_FUNCTIONAL: COMPLETE
H2_STABILIZATION: CLOSED
H2: CLOSED
H3: ELIGIBLE
```

Do not create/activate H3 implementation work in the same PR.

## Task C3 — Completed H2-S closure addendum and qualification ledgers

Update completed H2-S plan with external closure tuple.

Update current qualification projections with final review/CI/merge evidence.

Preserve distinctions:

```text
H2A-3 final milestone CI historically NOT_RUN remains NOT_RUN
H2-S final stage CI is its own PASS proof
H2-S fresh PG18.6 evidence is stage evidence
product source-less / Linux/macOS real-PG / service-headless residuals remain honest
```

## Task C4 — Docs/evidence-only verification

Regenerate Corpus inventory/checksums.

Run:

```bash
pnpm check:corpus
pnpm check:agents
pnpm check:repository
pnpm check:hygiene
pnpm format:check
pnpm verify
```

Prove changed paths are only `Architecture_Corpus/**` and `docs/**`.

Merge PR-C.

Only after PR-C merge may an H3 plan be created/activated.

---

# 16. Required acceptance matrix

| Area | Required final H2-S state |
|---|---|
| H2B truth | reconciled CLOSED before H2-S starts |
| Root AGENTS | executor-focused replacement; no macro invariant dump; no Skill routing table |
| Plan governance | non-trivial decisions pre-resolved; executor stops `PLAN_GAP` |
| Compatibility epoch | PRE_PRODUCTION |
| Compatibility register | exists; `obligations: []` |
| Development provenance | zero machine-detected residue in current executable surfaces |
| Historical compatibility | zero project-history readers/shims/upcasters/aliases/dual formats |
| Current migration baseline | one current canonical Foundation baseline |
| Genesis archaeology | `GENESIS_EVIDENCE.json` absent; `scripts/phases/` absent |
| Test identities | semantic file/test/resource names, no H2A/H2B/M3/M4/M5A current identities |
| Hygiene gate | `pnpm check:hygiene` PASS and included in `pnpm verify` |
| Bootstrap boundary | production bootstrap-runtime cannot import runtime-kernel/runtime-substrate/Cordis |
| Runtime owner | Host signal can terminalize generic supervisor via structural lifecycle contract |
| Runtime quiescence | admission closes synchronously; reverse dependency stop; bounded drain; one-shot resume |
| Desired state | preserved through quiesce/resume; no authority rewrite |
| Old leases | remain retired after resume/restart |
| Planned STOP | real Runtime quiescence before Host token revoke |
| Planned RESTART | continuity preserved; Boot/token/runtime instance rotated |
| Host terminality | same supervisor cannot reopen after owner loss |
| PostgreSQL | fresh final-candidate 18.6 H2-S PG1-PG6 PASS |
| Existing H2 invariants | persistence, lineage, readiness, generation fencing regressions PASS |
| Local aggregate | `pnpm verify` PASS |
| Independent Review | PASS exact `(base_sha, head_sha)` |
| Final CI | PASS Ubuntu/macOS/Windows same pair |
| Merge | squash merge unchanged pair |
| Final reconciliation | docs/evidence-only PR sets H2 CLOSED / H3 ELIGIBLE |

---

# 17. Scope / stop budgets

Stop and request a new decision if any of the following becomes necessary:

```text
1. a new product/runtime package or subsystem;
2. any new external dependency or dependency version change;
3. DBOS/WorkItem/Effect implementation;
4. bootstrap-runtime production dependency on runtime-kernel/runtime-substrate/Cordis;
5. runtime-kernel import of Host/Bootstrap private types;
6. Cordis fork/patch/private API dependency;
7. fundamental replacement of GenerationFence, Desired/Actual authority or RuntimeGraph semantics;
8. a real compatibility obligation is discovered;
9. current-tree cleanup would require preserving an old API/format instead of deleting/reframing it;
10. an unknown artifact has ambiguous live ownership;
11. fresh PostgreSQL 18.6 H2-S evidence cannot be produced;
12. H2-S begins to implement H3 semantics;
13. Corpus documents conflict on the required semantics;
14. more than ~10 unrelated behavior/tooling commits or materially more than the named file groups are required, indicating S scope expansion.
```

Do not solve a stop condition by creating an exception list, compatibility shim, local architecture, or hidden fallback.

---

# 18. Explicitly prohibited approaches

The executor must not:

```text
- keep old names via re-export/symlink/duplicate test files;
- move GENESIS_EVIDENCE or phase scripts into an archive directory inside the current tree;
- create hygiene-ignore comments, allowlists, baselines or suppressions;
- keep “legacy” negative tests solely to document previous dev shapes;
- add V2/V3 because current V1 changed during development;
- append migrations merely to preserve developer DB chronology;
- keep deprecated internal APIs “just in case”;
- use old dev DBs/fixtures as evidence of a compatibility obligation;
- rename compatibility baggage without deleting its behavior;
- make Bootstrap production own Runtime Kernel/Cordis;
- introduce a new product Host composition framework in H2-S;
- dispatch ordinary CI during implementation;
- update docs after exact-pair review without invalidating the candidate;
- mark skipped/not-run scenarios PASS;
- reinterpret this plan when an unforeseen non-trivial decision appears.
```

---

# 19. Recommended commit envelope

The final branch may use several focused commits, but keep them reviewable and bounded. Recommended semantic envelope:

```text
1. docs: make stabilization and preproduction history erasure explicit
2. feat: enforce current-tree history hygiene
3. refactor: erase milestone identity from current test infrastructure
4. chore: retire closed repository genesis artifacts
5. test/refactor: remove development-history compatibility residue
6. chore: fence bootstrap runtime from normal runtime implementation
7. fix: bind runtime lifecycle to root ownership and reversible quiescence
8. test: prove managed host and runtime lifecycle closure
9. docs: record H2 stabilization candidate evidence
```

This is a recommendation, not permission to exceed the scope budget. Combine purely mechanical cleanup commits if review is clearer.

No commit after candidate freeze unless the previous review/CI candidate is explicitly invalidated.

---

# 20. Evidence skeleton for installed H2-S plan

Before candidate freeze, fill this with concrete results only:

```yaml
stage: H2-S
compatibility_epoch: PRE_PRODUCTION
compatibility_obligations: []

candidate:
  pullRequest: 24
  state: CORRECTIVE_DRAFT
  branch: dev/h2-stabilization

localQualification:
  status: PASS
  environment: Windows / Node 24.19.0 / pnpm 11.22.0
  completedAfterLastRepositoryMutation: true

governance:
  root_agents_rewritten: PASS
  corpus_26_stabilization_policy: PASS
  decision_complete_plan_policy: PASS

current_tree_hygiene:
  check_hygiene: PASS
  development_provenance_residue: 0
  undeclared_compatibility_residue: 0
  genesis_evidence_present: false
  phase_scripts_present: false
  canonical_migration_baselines: 1

runtime_lifecycle:
  owner_signal_terminalization: PASS
  starting_activation_cancellation: PASS
  synchronous_admission_close: PASS
  reverse_dependency_quiescence: PASS
  one_shot_resume: PASS
  desired_preservation: PASS
  old_lease_fencing: PASS
  bootstrap_production_boundary: PASS

postgres_18_6:
  PG1_identity_coherence: PASS
  PG2_host_terminality_propagation: PASS
  PG3_planned_stop_real_quiescence: PASS
  PG4_restart_continuity_rotation: PASS
  PG5_structural_safe_abort_fit: PASS
  PG6_shutdown_keep_postgres_and_bootstrap_cleanup: PASS

repository:
  pnpm_verify: PASS
  independent_review: NOT_RUN
  final_cross_platform_ci: NOT_RUN
  merge: NOT_RUN

product_residuals:
  linux_real_postgres: NOT_RUN_or_existing_truth
  macos_real_postgres: NOT_RUN_or_existing_truth
  source_less: NOT_RUN
  service_headless: NOT_RUN
  hardware_power_loss: NOT_RUN
```

The earlier H2-S implementation evidence is historical. The current corrective
candidate must rerun local gates and fresh PostgreSQL qualification after its
repository mutations; no historical revision identity is current candidate
identity.

After candidate freeze only externally observed review/CI/merge fields change, and those changes occur in PR-C after merge—not by mutating the reviewed behavior candidate.

## Post-merge closure reconciliation (2026-08-26)

The H2-S candidate's external closure gates completed after the pre-merge
qualification record above. Historical `NOT_RUN` values in earlier candidate
snapshots are preserved as historical evidence.

```yaml
closure:
  implementation: PASS
  requiredLocalQualification: PASS
  freshPostgreSQL18_6Qualification: PASS
  independentReview: PASS
  finalCrossPlatformCI: PASS
  squashMerge: PASS
  postMergeReconciliation: PASS
```

---

# 21. Source map used to derive this plan

The executor should read these before implementation, but must not reopen decisions already locked here unless they conflict with a higher Corpus authority:

```text
AGENTS.md
Architecture_Corpus/00-项目宪法与工程宪法.md
Architecture_Corpus/20-架构审查清单.md
Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md
Architecture_Corpus/05-整机执行模型.md
Architecture_Corpus/06-MicroSystem与Extension架构.md
Architecture_Corpus/16-验证与资格认定体系.md
Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md
Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md
Architecture_Corpus/specs/S13-Foundation-Service-Capability-Readiness-Catalog.md
Architecture_Corpus/specs/S15-Foundation横切合同.md

docs/plans/README.md
docs/engineering/playbooks/repository/h-stage-stabilization-closure.md
docs/engineering/playbooks/repository/milestone-pr-closure.md

tools/repo-kit/**
scripts/verify/repository.mjs
scripts/verify/boundaries.mjs
scripts/README.md

packages/bootstrap-runtime/src/managed-host.ts
packages/bootstrap-runtime/src/host-maintenance.ts
packages/bootstrap-runtime/src/test-support/canonical-postgres.ts
packages/runtime-kernel/src/contracts.ts
packages/runtime-kernel/src/supervisor.ts
packages/runtime-kernel/src/generation-fence.ts
packages/runtime-kernel/src/service-registry.ts
packages/runtime-kernel/src/capability-registry.ts
```

Known current-history residue evidence also exists in the exact files enumerated in §9 and must be removed from the final current tree.

---

# 22. Final completion rule

H2 is **not** closed when PR-S implementation becomes green locally.

H2 closes only after:

```text
PR-R merged truth reconciliation
+
H2-S final candidate satisfies all A-class closure invariants
+
current-tree hygiene zero-residue PASS
+
fresh PostgreSQL 18.6 H2-S stage qualification PASS
+
pnpm verify PASS
+
Independent Review PASS on exact (base_sha, head_sha)
+
manual Ubuntu/macOS/Windows final CI PASS on same pair
+
base/head unchanged before squash merge
+
PR-S squash merge succeeds
+
PR-C docs/evidence-only reconciliation merges and records H2 CLOSED / H3 ELIGIBLE
```

The intended final tree has a simple property:

> A developer or Agent reading only the current executable repository can understand what the system **is**, without needing to know which milestone created each asset or which earlier development shape once existed. Development history remains available as provenance, but it does not govern current identity or behavior.
