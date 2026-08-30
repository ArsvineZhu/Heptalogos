# Heptalogos PR #24 Governance Simplification & H2-S Corrective Execution Plan

> **For agentic workers:** Execute this plan task-by-task. This plan is decision-complete for the authorized scope. You may make only semantics-equivalent local implementation choices. If a required non-trivial decision is not resolved here or in the current Architecture Corpus, stop with `PLAN_GAP`; do not invent a new governance model, compatibility rule, package boundary, lifecycle semantic, or evidence policy.

**Goal:** Correct the remaining H2-S review blockers while replacing Heptalogos' SHA-heavy repository governance with a lean PR-lifecycle model, removing self-hash bookkeeping, adding package-local documentation/agent guidance, and preserving only machine-internal revision binding where Git/CI intrinsically requires it.

**Transition vehicle:** Existing PR #24 (`dev/h2-stabilization`).

**Current review state:** `REQUEST_CHANGES`. PR #24 must return to Draft before any further repository mutation.

**Compatibility epoch:** `PRE_PRODUCTION`; current product compatibility obligations remain empty.

---

## 0. Executive assessment

The current repository has three governance defects that should be corrected now rather than carried into H3:

1. **Self-hash bookkeeping is low-value repository noise.**
   - `Architecture_Corpus/manifest.json` records every Corpus file with size/hash.
   - `Architecture_Corpus/SHA256SUMS.txt` repeats file hashes.
   - `.agents/heptalogos/package-manifest.json` repeats size/hash locking for Agent resources.
   - The protected content and the hashes live in the same Git commit and trust boundary, so this does not provide meaningful tamper resistance against a repository writer.
   - Git already content-addresses committed content.
   - These mechanisms create generated diffs, maintenance steps, validator code, and Agent context cost.

2. **The exact `(base_sha, head_sha)` closure model exposes Git implementation identity as project semantics.**
   - Candidate files cannot safely embed their own final HEAD without self-reference.
   - Agents repeatedly transcribe, compare, and repair raw commit identifiers.
   - A base-branch move currently invalidates review even when the reviewed PR diff is unchanged.
   - The real semantic requirement is simpler: review and final CI must apply to the current PR revision, and repository mutation after those gates makes the corresponding gate stale.
   - GitHub/CI may still use commit identity internally; humans and Agents should not maintain it as a governance field.

3. **Workspace packages have no local documentation boundary.**
   - All thirteen current `packages/*` workspaces lack both `README.md` and `AGENTS.md`.
   - The root `AGENTS.md` therefore carries repository-wide context while an Agent entering a package has no concise local statement of purpose, ownership, forbidden dependencies, verification, or relevant Corpus routes.

PR #24 also still has source-level blockers from Independent Review:

- STARTING MicroSystem activation is not cooperatively cancelled by quiesce/owner terminality.
- Bootstrap Runtime production-boundary checking is bypassable through package subpaths.
- Current-tree hygiene skips symlinks and misses important provenance token forms.
- PG6 does not prove Bootstrap-owned success-path cleanup after Host terminal shutdown.
- Candidate/evidence documents currently contain self-referential or stale commit-identity fields.
- PR metadata must be reconciled after the corrective cycle.

The correct response is one bounded corrective cycle, not a new subsystem or another stage.

---

## 1. Locked decisions

The executor does not choose among alternatives below.

### D1 — Raw commit SHA is removed from current governance semantics

Current architecture/governance documents, active plans, Agent instructions, current qualification projections, PR templates, and operator procedures MUST NOT require humans or Agents to copy, maintain, compare, or embed Git commit SHA values.

Allowed:

- Git/GitHub internal object identity;
- workflow/check-run commit association;
- Git commands/tooling internally using revision IDs;
- historical completed records that already contain old commit IDs;
- third-party GitHub Action commit pinning;
- package-manager integrity metadata and product-domain content digests.

Forbidden as new current-governance fields:

- `candidate_base_sha`
- `candidate_head_sha`
- `behavior_candidate_head_sha`
- `reviewed_head_sha`
- `reviewed_base_sha`
- exact `(base_sha, head_sha)` formulas
- plan instructions telling an Agent to transcribe commit IDs.

Historical completed plans/evidence are not mass-rewritten solely to erase old SHAs. History may remain historical. New/current sections stop producing them.

### D2 — Self-hash source bookkeeping is deleted

Delete:

- `Architecture_Corpus/manifest.json`
- `Architecture_Corpus/SHA256SUMS.txt`
- `.agents/heptalogos/package-manifest.json`

Do not replace them with another checksum file, Merkle manifest, generated catalog, content-address map, or signature file in the repository.

If a future exported/offline Architecture Corpus artifact needs cryptographic integrity, generate checksum/signature metadata at artifact/release time outside the editable source tree.

### D3 — Corpus integrity becomes structural/navigation integrity

`pnpm check:corpus` remains, but it verifies useful repository properties rather than file bytes:

- required Corpus entrypoints exist;
- local links resolve;
- `INDEX.md` covers top-level normative documents and `specs/**`;
- qualification result navigation remains valid;
- JSON authority/reference files parse;
- no Corpus-local `AGENTS.md`;
- deleted self-hash artifacts do not reappear.

### D4 — Agent resource validation becomes semantic/structural only

`.agents/heptalogos/validate-skill-resources.mjs` keeps:

- Skill frontmatter validation;
- Skill word budget;
- route ↔ Skill consistency;
- routed Corpus path existence;
- direct Corpus link validity;
- routing-case schema.

It removes all package-manifest/hash/size validation.

### D5 — PR #24 is the governance transition vehicle

Do not create a separate governance PR and do not close/recreate PR #24.

Sequence:

1. return PR #24 to Draft;
2. install this corrective plan;
3. apply governance simplification;
4. apply H2-S source corrections;
5. run fresh final local qualification;
6. mark PR Ready;
7. obtain a new Independent Review under the new live-PR model;
8. after review PASS, run final manual CI;
9. squash merge;
10. use a small docs/evidence-only reconciliation PR to project final H2 closure.

### D6 — New closure semantic is “live PR candidate”, not exact pair

The candidate is:

```text
the current repository state presented by the live PR
```

Workflow state:

```text
Draft
  = mutable implementation/correction

Ready
  = candidate ready for Independent Review

Independent Review PASS
  = reviewer accepts the current live Ready PR

repository mutation after Review PASS
  = review stale
  = return PR to Draft before continuing

Final manual CI PASS
  = cross-platform verification of the current PR revision
    against the current base integration context

repository mutation after final CI
  = review + CI stale
  = return PR to Draft

base branch moves after Review PASS, but PR branch does not
  = review remains valid unless PR diff/conflict semantics change
  = final CI becomes stale because integration context changed
  = rerun final CI against the current base

squash merge
  = behavior closure event
```

A conflict resolution, rebase, merge-from-base, or any commit to the PR branch is repository mutation and invalidates review.

### D7 — Revision identity remains machine-internal where unavoidable

The manual CI workflow may internally inspect Git/GitHub revision identity to guarantee it is testing the dispatched PR revision. That identity must not become:

- workflow inputs;
- PR-body fields;
- plan fields;
- qualification fields;
- Agent copy/paste instructions.

The workflow interface becomes semantic:

- `pr_number`
- `reason`

No `base_sha` or `target_sha` input remains.

### D8 — Final CI tests the current PR plus current base integration

Manual final CI runs only after Independent Review PASS.

The workflow:

1. is dispatched on the PR head branch;
2. receives `pr_number`;
3. verifies through GitHub metadata that the dispatched ref is the head branch of that open, Ready PR targeting `master`;
4. fetches current `master`;
5. creates a temporary merge/integration state in the runner;
6. runs `pnpm verify` on Ubuntu/macOS/Windows;
7. never pushes the merge result.

This makes base movement an integration-evidence issue rather than automatically re-reviewing an unchanged PR diff.

### D9 — Third-party Action SHA pinning stays

The existing policy requiring GitHub Actions such as `actions/checkout` to be pinned to immutable full commit references is retained.

Reason:

- this is supply-chain dependency pinning;
- it protects against mutable action tags;
- it is not self-hashing repository governance;
- Agents do not need to transcribe those values during ordinary work.

Do not weaken pnpm lockfile integrity, dependency version pins, product `ContentDigest`, Evidence digests, schema digests, or other domain integrity semantics.

### D10 — Package-local docs become mandatory workspace structure

Every current `packages/*` workspace must contain:

- `README.md`
- `AGENTS.md`

`packages/README.md` becomes the package map.

`tools/repo-kit` must also contain an `AGENTS.md`; keep and update its existing README.

Future workspace package creation is incomplete until local README/AGENTS exist.

### D11 — README and AGENTS have different jobs

Package `README.md`:

- human + Agent orientation;
- explains current package role and public surface;
- Chinese prose is acceptable/preferred with technical identifiers kept in English;
- not an implementation plan or historical narrative.

Package `AGENTS.md`:

- concise technical English;
- local execution contract automatically scoped to that package;
- does not repeat root project philosophy or Skill routing;
- focuses on ownership, forbidden coupling, local invariants, verification, and stop conditions.

### D12 — Local AGENTS are overlays, not duplicated constitutions

Root `AGENTS.md` remains repository-wide.

Nearest package `AGENTS.md` adds only package-specific rules.

A local AGENTS file must not copy:

- global PRE_PRODUCTION compatibility prose;
- global plan-state prose;
- Skill routing;
- PR closure procedure;
- long architecture invariant lists.

It should link/read-route to the package README and relevant Corpus resources instead.

### D13 — Current H2-S review blockers are corrected in the same cycle

The governance reset does not waive source findings. PR #24 cannot return to Ready until:

- STARTING activation cooperative cancellation is fixed/tested;
- Bootstrap production-boundary subpath bypass is fixed/tested;
- hygiene symlink/token gaps are fixed/tested;
- PG6 Bootstrap-owned cleanup proof is fixed;
- current qualification evidence is regenerated without SHA-governance fields;
- fresh PostgreSQL 18.6 H2-S qualification is run on the final mutable tree;
- `pnpm verify` passes.

### D14 — Post-merge reconciliation remains, but is simplified

Keep one tiny docs/evidence-only post-merge reconciliation PR because merge/review/CI outcomes are external facts that cannot honestly be written before they occur.

It records semantic facts only:

- PR merged;
- Independent Review PASS;
- final cross-platform CI PASS;
- H2-S CLOSED;
- H2 CLOSED;
- H3 ELIGIBLE;
- remaining product qualification residuals.

It does not record candidate SHAs or rebuild checksum manifests.

---

## 2. Package documentation map

Create `packages/README.md` grouping all current packages by semantic layer.

Current package set:

### Bootstrap / Recovery closure

#### `packages/bootstrap-state`

Purpose:

- crash-safe BootstrapState / journal formats and stores;
- bootstrap-visible continuity/recovery state.

Owns:

- BootstrapState codecs/store mechanics;
- bootstrap journals/maintenance state files.

Does not own:

- normal PostgreSQL canonical business state;
- Host lease semantics;
- Runtime supervision.

Primary Corpus routes:

- S01 startup/recovery/runtime supervision;
- storage/lifecycle-root specs;
- schema/versioning rules.

#### `packages/private-postgres`

Purpose:

- private PostgreSQL toolchain/controller mechanics under Bootstrap authority.

Owns:

- init/start/stop/readiness/profile/toolchain mechanics.

Does not own:

- normal persistence service;
- canonical mutation authority;
- Host runtime lifecycle.

#### `packages/host-ownership`

Purpose:

- authoritative Host advisory lease and HostOwnershipFence/token mechanics.

Owns:

- lease/fence/token publication and validation.

Does not own:

- Bootstrap orchestration;
- normal product persistence policy;
- MicroSystem lifecycle.

#### `packages/bootstrap-runtime`

Purpose:

- Installation/bootstrap/recovery orchestration and Host forward/reverse handoff.

Owns:

- bootstrap ownership orchestration;
- private-PG startup/maintenance handoff;
- managed Host lifecycle contract.

Hard local boundary:

- production source MUST NOT depend on `@heptalogos/runtime-kernel`,
  `@heptalogos/runtime-substrate`, or `cordis`;
- test/integration composition may use them.

### Canonical data foundation

#### `packages/canonical-schema`

Purpose:

- current canonical PostgreSQL schema/baseline and initialization/migration mechanics.

Owns:

- schema materialization;
- current PRE_PRODUCTION migration baseline.

Does not own:

- connection-pool runtime API;
- compatibility migration history for developer databases.

#### `packages/persistence`

Purpose:

- Host-fenced normal PostgreSQL access and transaction/mutation service.

Owns:

- normal connection pooling;
- Host-fenced transaction entry;
- persistence service contract.

Does not own:

- Host lease acquisition;
- schema evolution Authority;
- direct bootstrap maintenance.

### Execution context / evidence foundation

#### `packages/time-service`

Purpose:

- TimeService abstraction and deterministic test time.

Does not own:

- scheduling/durable work;
- wall-clock policy outside its contract.

#### `packages/execution-lineage`

Purpose:

- ExecutionContext, lineage propagation, retained runtime lifecycle lineage.

Owns:

- context/lineage semantics and integration helpers.

Does not own:

- durable Evidence storage policy beyond its declared integration;
- Runtime scheduling.

#### `packages/evidence`

Purpose:

- Evidence contract/service for retained evidence records.

Owns:

- Evidence draft/record/service semantics.

Does not own:

- generic logging/telemetry;
- ExecutionContext identity;
- arbitrary application persistence.

### Runtime composition

#### `packages/runtime-substrate`

Purpose:

- narrow Cordis-backed mechanics adapter.

Owns:

- activation scopes;
- resource disposal;
- background task tracking;
- substrate failure mechanics.

Does not own:

- Desired/Actual;
- Service vs Capability semantics;
- provider selection;
- Generation/Readiness Authority.

Hard local rule:

- Cordis-specific objects do not escape the substrate boundary.

#### `packages/runtime-kernel`

Purpose:

- Heptalogos Runtime semantics.

Owns:

- MicroSystemSupervisor;
- RuntimeReconciler;
- RuntimeGraph;
- ServiceRegistry / CapabilityRegistry;
- Generation fencing;
- Readiness;
- owner/quiescence lifecycle.

Does not own:

- Bootstrap/Host private types;
- PostgreSQL process control;
- product durable-work/effect semantics from later stages.

### Shared contracts / generic schema mechanics

#### `packages/foundation-contracts`

Purpose:

- low-level stable Foundation IDs, branded contracts, Problems, digest helpers, shared semantic primitives.

Local rule:

- keep IO/process/database/framework mechanics out;
- avoid importing higher-level packages.

#### `packages/schema-runtime`

Purpose:

- generic runtime schema compilation/validation mechanics.

Owns:

- schema validator contract and compiler mechanics.

Does not own:

- product/domain schema Authority;
- compatibility policy.

---

## 3. Required package README structure

Each `packages/*/README.md` uses these headings:

```markdown
# @heptalogos/<package>

## Purpose

2–5 sentences describing the current semantic role.

## Owns

Bullets of responsibilities this package is authoritative for.

## Does not own

Bullets preventing common boundary mistakes.

## Public surface

List exported entrypoints/types/services at a high level.
Do not duplicate every symbol.

## Dependencies and boundaries

Explain important workspace and third-party dependency direction.
Highlight hard forbidden imports.

## Verification

Exact current Nx/pnpm targets relevant to the package.

## Architecture references

Direct relative links to the minimum relevant Architecture Corpus files/specs.
```

README constraints:

- current-state only;
- no milestone/H2A/H2B history;
- no commit IDs;
- no copied dependency catalog;
- target 250–700 words;
- explain why boundaries exist, not every implementation detail.

---

## 4. Required package AGENTS structure

Each `packages/*/AGENTS.md` is concise, technical English:

```markdown
# Package Agent Contract

## Scope

One paragraph stating what directory this governs.

## Read first

- `README.md`
- 2–5 relevant Corpus links only

## Local rules

5–10 package-specific executable constraints.

## Verification

Exact focused commands for edits in this package.

## Stop

Package-specific conditions requiring PLAN_GAP / architecture review.
```

Target <= 300 words.

Examples of useful local rules:

- `foundation-contracts`: no DB/fs/process/framework imports.
- `bootstrap-runtime`: no production RuntimeKernel/RuntimeSubstrate/Cordis import.
- `runtime-substrate`: Cordis remains private adapter mechanics.
- `runtime-kernel`: no Bootstrap private types; no H3 durable-work subsystem.
- `canonical-schema`: one current PRE_PRODUCTION baseline; do not append dev-history migrations.
- `persistence`: all canonical mutation paths remain Host-fenced.
- `private-postgres`: normal runtime never gains cluster-superuser/process-control Authority.

Do not add local Skill routing tables.

---

## 5. Task 0 — Reopen the corrective cycle

**Repository state:** PR #24.

- [ ] Change PR #24 from Ready back to Draft.
- [ ] Update PR body to state:
  - Independent Review result: `REQUEST_CHANGES`;
  - corrective cycle active;
  - final CI `NOT_RUN`;
  - no merge authorization.
- [ ] Create active corrective plan:
      `docs/plans/active/foundation/h2s-review-correction-governance-simplification.md`
      using this plan as its exact content or a repository-native copy.
- [ ] Update `docs/plans/README.md`:
  - H2-S original plan remains completed implementation record;
  - new review-correction plan is ACTIVE;
  - H2 remains OPEN.
- [ ] Do not record any base/head commit SHA in the new plan.
- [ ] Run:
  - `pnpm check:repository`
  - `pnpm check:hygiene`
    before behavior changes, recording actual PASS/FAIL only.

**Commit intent:** `docs: activate H2-S review correction`

---

## 6. Task 1 — Replace exact-pair governance with live-PR governance

### Files

Modify:

- `AGENTS.md`
- `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`
- `Architecture_Corpus/20-架构审查清单.md`
- `docs/engineering/playbooks/repository/milestone-pr-closure.md`
- `docs/engineering/playbooks/repository/h-stage-stabilization-closure.md`
- `docs/engineering/playbooks/repository/current-tree-hygiene.md`
- `docs/engineering/GOTCHAS.md`
- `docs/engineering/PLAYBOOK.md`
- `.agents/skills/heptalogos-architecture/SKILL.md`
- `.agents/skills/heptalogos-verification/SKILL.md`

### Root AGENTS changes

Replace current exact-pair paragraph with:

```text
PR candidate integrity is governed by PR lifecycle, not commit hashes in
documents.

Draft = mutable.
Ready = review candidate.

Independent Review evaluates the current live Ready PR. Any repository mutation
after Review PASS makes that review stale; return the PR to Draft before
continuing. Final manual CI runs only after Review PASS. Any PR-branch mutation
after final CI makes review and CI stale.

Do not copy commit SHAs into plans, qualification records, PR bodies, or Agent
instructions. Git/GitHub/CI may use revision identity internally.
```

Add workspace-local guidance:

```text
When working under a workspace package, read its nearest AGENTS.md and README.md.
The local AGENTS.md refines this repository contract for that package; it does
not replace Corpus Authority.
```

### Corpus 26 changes

Delete:

- `ReviewCandidate = (base_sha, head_sha)`
- exact pair formula
- instructions requiring base/head equality.

Replace closure formula with:

```text
implementation plan complete
+ required local qualification complete
+ mandatory Hn-S sweeps complete
+ PR Ready
+ Independent Review PASS on the current live PR
+ no PR-branch mutation after Review PASS
+ final manual CI PASS on Ubuntu/macOS/Windows for the current PR revision
  integrated with the current base
+ no PR-branch mutation after final CI
+ squash merge succeeds
```

Add base-movement semantics:

```text
Base movement alone does not invalidate Independent Review when the reviewed PR
diff remains semantically unchanged and no conflict-resolution/rebase commit is
added to the PR branch.

Base movement invalidates final integration CI. Rerun final CI against the
current base before merge.

Any PR-branch mutation invalidates Review PASS and final CI.
```

### Playbook procedure

New normal flow:

```text
branch
-> Draft PR
-> implementation + local verification
-> Ready
-> Independent Review of live PR
-> REQUEST_CHANGES ? Draft + correction + requalification + Ready
-> PASS
-> manual final CI on current PR/current base
-> merge immediately if still current
-> docs/evidence reconciliation
```

No operator command should contain raw SHA variables.

### Review checklist addition

Add:

- Does current governance ask an Agent to transcribe a Git object ID?
- Could Git/GitHub determine this internally instead?
- Is a revision identity being mistaken for project semantic Authority?
- Does the PR state clearly distinguish mutable correction from review candidate?

**Focused checks:** `pnpm check:agents`, `pnpm check:corpus`, `pnpm check:repository`.

**Commit intent:** `docs: simplify PR candidate governance`

---

## 7. Task 2 — Remove self-hash bookkeeping

### Delete

- `Architecture_Corpus/manifest.json`
- `Architecture_Corpus/SHA256SUMS.txt`
- `.agents/heptalogos/package-manifest.json`

### Rewrite Corpus verifier

Rename:

- `scripts/verify/corpus-integrity.mjs`
  -> `scripts/verify/corpus-structure.mjs`

Update root package script:

```json
"check:corpus": "node scripts/verify/corpus-structure.mjs"
```

New verifier behavior:

#### Required entrypoints

Require:

- `Architecture_Corpus/README.md`
- `Architecture_Corpus/INDEX.md`
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`
- `Architecture_Corpus/qualification/results/README.md`
- `Architecture_Corpus/references/compatibility-obligations.json`

#### Local link validation

For every Markdown file under `Architecture_Corpus/**`:

- parse ordinary relative Markdown links;
- ignore `http://`, `https://`, anchors-only links, mailto;
- resolve local path;
- fail if target does not exist.

#### Navigation coverage

- every top-level normative numbered Markdown document must be linked from `INDEX.md`;
- every `specs/*.md` document must be linked from `INDEX.md` or a specs index linked from `INDEX.md`;
- every `qualification/results/*.md` except its README must be linked from `qualification/results/README.md`.

#### JSON parseability

Parse every tracked `Architecture_Corpus/**/*.json`.
Fail malformed JSON.

#### Forbidden archaeology

Fail if any of these exist:

- `Architecture_Corpus/manifest.json`
- `Architecture_Corpus/SHA256SUMS.txt`
- `Architecture_Corpus/AGENTS.md`

Do not compute SHA256 or file sizes.

### Rewrite Agent resource validator

Remove:

- `createHash` import;
- `packageManifestPath`;
- package manifest required-file check;
- `sha256()`;
- `validatePackageManifest()`;
- all size/hash comparison.

Keep all routing/Skill structural checks.

Update `.agents/heptalogos/README.md` so its validator description exactly matches reality. It must not claim root AGENTS enumerates Skills.

### Tests

Add/reuse repo-kit verification tests for:

1. broken Corpus local link -> FAIL;
2. missing indexed top-level normative doc -> FAIL;
3. malformed Corpus JSON -> FAIL;
4. self-hash artifact reintroduced -> FAIL;
5. valid minimal Corpus graph -> PASS.

Do not recreate a file catalog merely to make coverage easy.

**Focused checks:** `pnpm check:agents`, `pnpm check:corpus`, repo-kit tests.

**Commit intent:** `refactor: replace checksum governance with structural checks`

---

## 8. Task 3 — Add package-local documentation and Agent contracts

### Create package index

Create:

- `packages/README.md`

Use the package grouping and roles from §2.

Include one compact dependency-direction diagram:

```text
foundation-contracts
        ↓
schema/bootstrap/data primitives
        ↓
bootstrap ownership + canonical persistence
        ↓
execution foundation
        ↓
runtime-substrate
        ↓
runtime-kernel

bootstrap-runtime production path stays outside runtime-kernel/runtime-substrate
and composes with them only at higher Host/product integration boundaries.
```

Do not present this as a strict total dependency order where current package.json says otherwise; explain it as semantic layers/boundaries.

### Create README + AGENTS in all thirteen packages

Create:

- `packages/bootstrap-runtime/README.md`
- `packages/bootstrap-runtime/AGENTS.md`
- `packages/bootstrap-state/README.md`
- `packages/bootstrap-state/AGENTS.md`
- `packages/canonical-schema/README.md`
- `packages/canonical-schema/AGENTS.md`
- `packages/evidence/README.md`
- `packages/evidence/AGENTS.md`
- `packages/execution-lineage/README.md`
- `packages/execution-lineage/AGENTS.md`
- `packages/foundation-contracts/README.md`
- `packages/foundation-contracts/AGENTS.md`
- `packages/host-ownership/README.md`
- `packages/host-ownership/AGENTS.md`
- `packages/persistence/README.md`
- `packages/persistence/AGENTS.md`
- `packages/private-postgres/README.md`
- `packages/private-postgres/AGENTS.md`
- `packages/runtime-kernel/README.md`
- `packages/runtime-kernel/AGENTS.md`
- `packages/runtime-substrate/README.md`
- `packages/runtime-substrate/AGENTS.md`
- `packages/schema-runtime/README.md`
- `packages/schema-runtime/AGENTS.md`
- `packages/time-service/README.md`
- `packages/time-service/AGENTS.md`

Also create:

- `tools/repo-kit/AGENTS.md`

Update:

- `tools/repo-kit/README.md`

### Repository gate

Modify `scripts/verify/repository.mjs`.

Discover every direct workspace directory under:

- `packages/*`
- `tools/*`

that contains `package.json`.

For each require:

- `README.md`
- `AGENTS.md`

Fail if missing.

For package AGENTS:

- fail if > 300 words;
- require headings `Scope`, `Read first`, `Local rules`, `Verification`, `Stop`.

For package README:

- require headings `Purpose`, `Owns`, `Does not own`, `Public surface`,
  `Dependencies and boundaries`, `Verification`, `Architecture references`.

Do not validate exact prose hashes.

Do not require every package to have identical command strings; use actual `project.json` targets.

### Important content rule

The executor must inspect each package's:

- `package.json`
- `project.json`
- `src/index.ts`
- applicable Corpus route

before writing its README/AGENTS.

This inspection is for factual accuracy only; package semantic ownership is bounded by §2 and Corpus. If current code appears to violate those locked boundaries, do not normalize the docs around the violation; report `PLAN_GAP` or fix the already-authorized boundary if covered by this plan.

**Focused checks:** `pnpm check:repository`, `pnpm check:agents`, `pnpm format:check`.

**Commit intent:** `docs: add workspace package contracts`

---

## 9. Task 4 — Simplify manual final CI workflow

### Modify

- `.github/workflows/verify.yml`
- `scripts/verify/repository.mjs`
- `docs/engineering/playbooks/repository/milestone-pr-closure.md`

### Workflow inputs

Replace:

- `base_sha`
- `target_sha`
- `reason`

with:

- `pr_number`
- `reason`

`pr_number` is required integer/string representing the PR number.

Keep reasons:

- `final-pre-merge`
- `cross-platform-regression`
- `explicit-user-request`

### Permissions

Use only:

- `contents: read`
- `pull-requests: read`

No write permission.

### Candidate validation

At workflow start:

1. query PR metadata using GitHub API/`gh api`;
2. require PR open;
3. require base ref `master`;
4. require dispatched branch/ref corresponds to PR head branch;
5. for `final-pre-merge`, require PR is not Draft.

The workflow may internally compare GitHub revision IDs to ensure the dispatched ref still represents the PR head. Do not expose that comparison as an input or documentation field.

### Integration test state

Each matrix job:

1. checkout the dispatched PR head;
2. fetch current `master`;
3. create a temporary local merge of current master into the checked-out PR state;
4. fail immediately on merge conflict;
5. install with frozen lockfile;
6. run `pnpm verify`.

Do not push the temporary merge.

### Action security

Keep all third-party `uses:` entries pinned to immutable full commit references.

Update `scripts/verify/repository.mjs`:

- require workflow inputs `pr_number:` and `reason:`;
- reject `base_sha:` and `target_sha:` inputs;
- continue enforcing no automatic CI triggers;
- continue enforcing immutable GitHub Action pins.

### Operator command

New playbook example:

```bash
gh workflow run verify.yml \
  --ref dev/h2-stabilization \
  -f pr_number=24 \
  -f reason=final-pre-merge
```

No SHA variables.

### Merge check

Before merge:

- `gh pr view 24` must show open, Ready, mergeable;
- `gh pr checks 24` must show the latest final manual verify result associated with the current PR head as successful;
- if master changed after that final integration run, rerun final CI;
- if PR branch changed after Review PASS, return to Draft and re-review.

No manual hash equality commands.

**Focused checks:** `pnpm check:repository`, YAML syntax inspection.

**Commit intent:** `ci: bind manual verification to live PR`

---

## 10. Task 5 — Remove SHA candidate fields from current evidence

### Modify current projections

At minimum:

- `Architecture_Corpus/qualification/results/Q-RUNTIME-01.md`
- `Architecture_Corpus/qualification/results/Q-PERSISTENCE-01.md`
- `Architecture_Corpus/qualification/results/qualification-status.json`
- `docs/plans/completed/foundation/h2-stabilization-closure.md`
- active corrective plan
- `docs/roadmap/development-roadmap.md`

### Rules

Do not mass-edit old historical sections.

For the current H2-S candidate section:
remove current governance fields representing:

- base SHA;
- head SHA;
- behavior-candidate SHA;
- exact pair.

Use semantic state:

```yaml
candidate:
  pullRequest: 24
  state: CORRECTIVE_DRAFT | READY_FOR_REVIEW | REVIEW_PASS_AWAITING_FINAL_CI
  branch: dev/h2-stabilization

localQualification:
  status: PASS | FAIL | NOT_RUN | BLOCKED
  environment: ...
  completedAfterLastRepositoryMutation: true|false

independentReview:
  status: PASS | REQUEST_CHANGES | NOT_RUN

finalCrossPlatformCI:
  status: PASS | FAIL | NOT_RUN | BLOCKED

merge:
  status: PASS | NOT_RUN
```

Do not add timestamps unless they are already useful operational evidence; timestamps do not become candidate identity.

Correct any inaccurate `Q1-Q15` claim:

- list actual named scenarios present;
- if numbering intentionally skips a number, do not report a contiguous range.

Historical SHA references from H1/H2A/H2B may remain in clearly historical text; they are not templates for new evidence.

**Focused checks:** `pnpm check:corpus`, JSON parse, `pnpm format:check`.

**Commit intent:** `docs: remove commit identity from current qualification`

---

## 11. Task 6 — Fix STARTING activation cooperative cancellation

This is a source-level closure blocker and must not be hidden by governance work.

### Files

Modify:

- `packages/runtime-kernel/src/supervisor.ts`
- `packages/runtime-kernel/src/supervisor.test.ts`
- package README/AGENTS only if the final local lifecycle contract needs concise documentation.

Do not change Bootstrap Runtime package dependency direction.

### Required design

Each currently STARTING MicroSystem gets a supervisor-owned `AbortController`.

Supervisor tracks controllers for STARTING activations.

The activation context signal is the composition of:

- RuntimeSubstrate activation scope signal;
- supervisor STARTING-cancellation signal.

Use platform-standard `AbortSignal.any(...)` when supported by the pinned Node/TypeScript baseline. Do not implement a custom signal-composition framework unless the platform typing/runtime proves unavailable.

Synchronous admission closure events:

- `quiesce()`
- terminal `close()`
- owner abort

must synchronously:

1. move supervisor lifecycle out of ACTIVE admission;
2. begin retirement of STARTING fences;
3. abort all STARTING activation controllers.

The existing mutation chain remains the serialization owner for cleanup.

No guarantee is added for arbitrary activation code that ignores its provided signal forever. The contract is cooperative cancellation; well-formed MicroSystem activation must observe `context.signal` for cancellable waits.

### Tests

Add:

#### Q-start-quiesce-cancel

- activation waits until `context.signal.aborted`;
- call `supervisor.quiesce()` without manually releasing the activation;
- assert signal aborts;
- activation returns;
- reconcile cannot start later systems;
- quiesce completes.

#### Q-start-owner-abort-cancel

- owner signal controls supervisor;
- activation waits on `context.signal`;
- abort owner;
- activation signal aborts;
- terminal `close()` completes;
- supervisor never reopens.

#### Regression

Keep existing queued-start test but no longer depend on manually resolving the first activation to prove cancellation semantics.

Use TDD:

1. write tests;
2. verify fail on current code;
3. implement;
4. verify pass.

**Focused checks:** runtime-kernel tests, typecheck, TS6 lane if affected.

**Commit intent:** `fix: cancel starting runtime activations on terminal transitions`

---

## 12. Task 7 — Harden Bootstrap production dependency boundary

### Files

Modify:

- `scripts/verify/boundaries.mjs`
- `tools/repo-kit/test/boundaries.test.mjs`

### Required design

Forbidden package roots for Bootstrap Runtime production source:

- `@heptalogos/runtime-kernel`
- `@heptalogos/runtime-substrate`
- `cordis`

Normalize import specifier to package root before comparison.

Examples:

```text
@heptalogos/runtime-kernel
@heptalogos/runtime-kernel/internal
  -> @heptalogos/runtime-kernel

cordis
cordis/foo
  -> cordis
```

Scoped package parser must correctly preserve two-segment scoped root.

Tests:

- bare forbidden import -> reject;
- scoped subpath -> reject;
- unscoped subpath -> reject;
- test/integration file import -> allowed;
- unrelated package with similar prefix -> not falsely rejected.

**Focused checks:** boundary unit tests, `pnpm check:boundaries`.

**Commit intent:** `fix: enforce bootstrap dependency roots`

---

## 13. Task 8 — Close hygiene-gate escape hatches

### Files

Modify:

- `tools/repo-kit/src/current-tree-hygiene.mjs`
- `tools/repo-kit/test/current-tree-hygiene.test.mjs`
- wrapper only if needed.

### Required design

#### Symlinks

Within scanned canonical/executable surfaces:

- any symbolic link is a hygiene failure;
- do not follow it;
- report `symbolic-link-residue`.

No allowlist.

#### Provenance patterns

Add coverage for:

- bare stage-family tokens such as `H2A`;
- PR forms including `PR #24`;
- existing H2A1/H2A-1/H2B/M4/etc. forms remain covered.

Patterns must remain boundary-aware and avoid matching ordinary words.

Tests:

1. executable symlink -> FAIL;
2. `H2A` identifier/value/path -> FAIL;
3. `PR #24` current executable text -> FAIL;
4. historical docs remain excluded;
5. legitimate contract version `v2` alone remains allowed.

**Focused checks:** repo-kit hygiene tests, `pnpm check:hygiene`.

**Commit intent:** `fix: close current-tree hygiene bypasses`

---

## 14. Task 9 — Make PG6 prove Bootstrap-owned success-path cleanup

### Files

Modify:

- `packages/bootstrap-runtime/src/runtime-host-lifecycle.integration.test.ts`
- `packages/bootstrap-runtime/src/test-support/canonical-postgres.ts`
  only if a semantic test-support helper is needed.

### Required behavior

PG6 must prove:

```text
Runtime quiesces
-> Host terminal shutdown releases Host ownership
-> PostgreSQL remains running by policy
-> Runtime cannot resume
-> old Runtime lease remains retired
-> Bootstrap ownership is reacquired
-> Bootstrap-authorized private PostgreSQL control performs bounded cleanup
```

The ordinary successful PG6 path must not rely on `afterEach` direct `pg_ctl stop` as the proof of Bootstrap control.

`cleanupCanonicalPostgresFixtures()` may remain an emergency/failure cleanup safety net.

Use existing Bootstrap Prelude/ownership/private-PG controller APIs. Do not add a new maintenance subsystem.

If current public/internal Bootstrap API cannot reacquire ownership and perform the authorized stop without violating current Corpus contracts, stop with `PLAN_GAP` and report the exact missing primitive. Do not call private PostgreSQL control from a closed Host.

Use TDD where practical:

- first assert successful Bootstrap reacquisition/cleanup behavior;
- observe current failure/gap;
- implement only test-support composition necessary to use existing production primitives.

**Focused checks:** bootstrap-runtime real-PG integration.

**Commit intent:** `test: prove bootstrap-owned post-host cleanup`

---

## 15. Task 10 — Reconcile package docs with source corrections

After Tasks 6–9:

- reread `runtime-kernel`, `bootstrap-runtime`, and repo-kit README/AGENTS;
- update only factual local rules affected by final implementation;
- do not add review history;
- do not mention PR #24 or H2-S in long-lived package docs.

Run:

- `pnpm check:repository`
- `pnpm check:hygiene`
- `pnpm check:agents`
- `pnpm check:corpus`.

**Commit intent:** fold into nearest source/doc commit if no semantic standalone change; otherwise `docs: reconcile local package contracts`.

---

## 16. Task 11 — Fresh final mutable-tree qualification

Do this only after all planned repository mutations except final evidence/status recording are known.

### Required local gates

Run fresh:

- `pnpm check:agents`
- `pnpm check:corpus`
- `pnpm check:repository`
- `pnpm check:hygiene`
- `pnpm check:dependencies`
- `pnpm check:boundaries`
- `pnpm toolchain:check`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm tsc6`
- `pnpm test`
- `pnpm build`
- `pnpm verify`

Do not infer PASS from the aggregate if a required subcommand was not run in the current tree.

### Fresh PostgreSQL 18.6 H2-S qualification

Run the complete H2-S real PostgreSQL integration suite on PostgreSQL 18.6.

Must include:

- normal Runtime/Host composition;
- authentic Host loss terminality;
- planned Host STOP using Runtime quiescence;
- restart continuity/fresh Runtime generation;
- safe-abort resume structural compatibility;
- shutdown-keep-Postgres + Bootstrap-owned cleanup;
- STARTING activation cancellation tests at unit level;
- persistence/Host/bootstrap regressions required by current qualification ledgers.

No skipped H2-S database scenario may be reported PASS.

### Evidence recording

After runs, update current qualification fields using semantic candidate state only:

```text
PR #24
candidate state = READY_FOR_REVIEW
local qualification = PASS
fresh PostgreSQL 18.6 = PASS
Independent Review = NOT_RUN
final CI = NOT_RUN
merge = NOT_RUN
```

Do not write commit SHA.

Because this evidence update itself is a repository mutation:

- after it is committed, run `pnpm check:corpus`, `pnpm check:repository`,
  `pnpm check:hygiene`, and `pnpm verify` once more;
- if evidence-only changes cannot affect PG behavior, the PG18.6 run remains valid
  as behavior evidence, but local static/full verify must cover the final tree.

If any production/test/runtime source changes after the PG18.6 qualification,
rerun the affected PG suite.

---

## 17. Task 12 — Complete plan and freeze through PR state

Before requesting Independent Review:

- [ ] Move the corrective plan from `docs/plans/active/**` to `docs/plans/completed/**`.
- [ ] Update `docs/plans/README.md` so no H2-S corrective implementation plan remains ACTIVE.
- [ ] Roadmap state remains:
  - H2-S implementation complete awaiting review;
  - H2 OPEN;
  - H3 NOT_ELIGIBLE.
- [ ] Run final `pnpm verify`.
- [ ] Ensure worktree clean.
- [ ] Push all commits.
- [ ] Update PR #24 body:
  - corrective cycle complete;
  - local qualification PASS;
  - fresh PostgreSQL 18.6 PASS;
  - Independent Review NOT_RUN;
  - final CI NOT_RUN;
  - merge NOT_RUN.
- [ ] Mark PR #24 Ready.

Do not add commit hashes to PR body.

From this point:

- no repository mutation during Independent Review;
- if review requests changes, immediately return PR to Draft before edits.

---

## 18. Task 13 — Independent Review under new model

Reviewer instruction:

```text
Review PR #24 as the current live Ready candidate.
Do not ask the operator to provide or maintain base/head commit SHAs.
Inspect the complete current PR diff and current source tree.
Return PASS or REQUEST_CHANGES with findings.
```

If `REQUEST_CHANGES`:

1. PR -> Draft;
2. install/activate bounded correction work if needed;
3. make corrections;
4. rerun claim-matched local qualification;
5. Ready;
6. new Independent Review.

If `PASS`:

- do not commit anything;
- proceed directly to final CI.

Independent Review PASS is not stored in a repository file before merge.

---

## 19. Task 14 — Final manual cross-platform CI

After Independent Review PASS:

Dispatch:

```bash
gh workflow run verify.yml \
  --ref dev/h2-stabilization \
  -f pr_number=24 \
  -f reason=final-pre-merge
```

Require:

- Ubuntu PASS;
- macOS PASS;
- Windows PASS.

Workflow must be testing:

- current PR branch revision;
- integrated with current master at run time.

If PR branch changes:

- review + CI stale;
- PR -> Draft.

If master changes after CI but PR branch does not:

- Independent Review stays valid unless diff/conflict semantics changed;
- rerun final CI against new master;
- no re-review solely for unrelated base movement.

If integration conflict resolution changes the PR branch:

- PR -> Draft;
- review stale;
- re-review required.

---

## 20. Task 15 — Merge and post-merge reconciliation

### Pre-merge semantic check

Require:

- PR #24 open and Ready;
- current Independent Review state PASS;
- latest final manual CI for PR #24 PASS on all three OS;
- no PR-branch mutation since Review PASS/final CI;
- no unresolved merge conflict;
- no base movement after final CI, otherwise rerun CI.

No raw SHA comparison procedure.

Squash merge PR #24.

### Post-merge reconciliation

Create one small docs/evidence-only PR.

Allowed changes:

- Roadmap/current milestone projection;
- qualification status/current semantic closure fields;
- completed corrective plan external-outcome addendum if desired;
- plan index.

Forbidden:

- production code;
- tests;
- runtime behavior;
- new package;
- new compatibility behavior.

Final semantic state:

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

Record:

- Independent Review PASS;
- final cross-platform CI PASS;
- PR #24 merged;
- remaining product qualification residuals honestly as PARTIAL/NOT_RUN.

Do not add:

- merge SHA;
- base/head SHA;
- checksum manifests.

Run normal docs/repository gates and `pnpm verify` as applicable to the reconciliation tree.

Only after this reconciliation merges may an H3 implementation plan become ACTIVE.

---

## 21. Permanent invariants after this migration

### Repository identity

```text
Git revisions are implementation identity, not project semantic Authority.
```

### Candidate integrity

```text
current live PR + PR lifecycle + machine-bound CI
```

not:

```text
human-maintained exact commit tuple
```

### Source integrity

```text
Git history + structural repository checks
```

not:

```text
editable source file + editable sibling checksum of that same file
```

### Agent context

```text
root AGENTS
+ nearest package AGENTS
+ package README
+ routed Corpus
+ active plan
```

not:

```text
one oversized root instruction file
+ repeated global rules
+ no local package description
```

### Compatibility

Unchanged:

```text
PRE_PRODUCTION
no declared obligation
=> rewrite/reset/reject/delete
```

### Supply-chain integrity

Unchanged:

- lockfile;
- exact dependency policy;
- immutable GitHub Action pins;
- relevant product-domain digest/fencing semantics.

---

## 22. Stop conditions

Stop with `PLAN_GAP` instead of extending scope if any correction requires:

- a new runtime/Bootstrap subsystem;
- production dependency from `bootstrap-runtime` to runtime-kernel/runtime-substrate/Cordis;
- a new compatibility obligation;
- a second canonical migration history for project development chronology;
- replacement of Cordis or current adopted dependency route;
- a new external service for review attestation;
- a GitHub App/bot solely to implement closure governance;
- automatic CI on ordinary pushes/PR events;
- H3 durable-work/effect semantics;
- relaxing package ownership boundaries merely to make docs match current code;
- weakening third-party Action pins or pnpm lockfile integrity.

---

## 23. Review budget / scope budget

This corrective cycle is still bounded if it remains:

- governance simplification in existing repository tooling/docs;
- local package documentation;
- one Runtime activation cancellation correction;
- existing boundary/hygiene gate hardening;
- existing Bootstrap ownership integration proof;
- evidence/schema cleanup.

Stop and re-scope if execution begins creating:

- more than one new production package;
- a review service/database;
- a custom Git abstraction layer;
- a custom documentation generator;
- a new compatibility/migration framework;
- a broad Runtime lifecycle rewrite unrelated to STARTING cancellation.

---

## 24. Expected end state

The repository should end this corrective cycle with:

```text
Architecture_Corpus/
  README.md
  INDEX.md
  ... normative/current documents ...
  # no manifest.json
  # no SHA256SUMS.txt

.agents/heptalogos/
  README.md
  corpus-routes.json
  tests/skill-routing-cases.json
  validate-skill-resources.mjs
  # no package-manifest.json

packages/
  README.md
  bootstrap-runtime/
    README.md
    AGENTS.md
    ...
  bootstrap-state/
    README.md
    AGENTS.md
    ...
  ...
  time-service/
    README.md
    AGENTS.md
    ...

.github/workflows/verify.yml
  inputs: pr_number + reason
  no base_sha/target_sha inputs

AGENTS.md
  no exact-pair instructions
  local package guidance enabled

qualification/current plans
  no current candidate SHA fields

PR closure
  Draft -> Ready -> Independent Review -> Final CI -> Squash Merge
```

The result is intentionally less ceremonious but more useful to Agents: semantic boundaries and local context are made stronger, while Git bookkeeping is pushed back into Git/GitHub tooling where it belongs.
