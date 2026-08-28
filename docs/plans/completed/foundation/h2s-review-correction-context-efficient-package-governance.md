# PR #24 H2-S Corrective Plan — Context-Efficient Package Governance

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to execute this plan task-by-task. This plan is decision-complete for the authorized corrective scope. Do not make new architecture, lifecycle, compatibility, governance, evidence, or package-boundary decisions. If an implementation fact contradicts this plan or current Architecture Corpus Authority, stop with `PLAN_GAP`.

**Goal:** Close the remaining PR #24 Independent Review blockers while replacing the over-granular `packages/*/AGENTS.md` layout with a context-efficient package documentation model: one `packages/AGENTS.md`, one `packages/README.md`, one `packages/INDEX.md`, and one substantive `README.md` per package.

**Architecture:** Harness-auto-loaded instructions remain deliberately sparse. Root `AGENTS.md` carries repository-wide execution constraints; `packages/AGENTS.md` carries only package-subtree routing and shared package rules; package-specific knowledge lives in opt-in `README.md` files. The same corrective cycle also closes the Runtime start-admission race, removes the imperative second topology-mutation path, fixes final-CI candidate snapshot binding, hardens hygiene scanning, and removes remaining self-certifying qualification state.

**Tech Stack:** Node.js 24.19.0, pnpm 11.22.0, Nx 23.1.1, TypeScript 7.0.2 + TS6 compatibility lane, Vitest, PostgreSQL 18.6, GitHub Actions.

**Transition vehicle:** existing PR #24 on `dev/h2-stabilization`.

**Current review state:** `REQUEST_CHANGES`. Final cross-platform CI remains `NOT_RUN`.

---

## 1. Locked decisions

These are not questions for the execution Agent.

### D1 — PR #24 returns to Draft before repository mutation

Any correction commit invalidates the current Independent Review attempt.

Required sequence:

```text
Ready
→ REQUEST_CHANGES
→ Draft
→ corrective implementation
→ fresh local qualification
→ Ready
→ new Independent Review
→ PASS
→ final manual CI
→ squash merge
```

Do not run final CI before a new Independent Review PASS.

### D2 — Do not create `AGENTS.md` in every package

Delete all current:

```text
packages/*/AGENTS.md
```

and make their reintroduction a repository-gate failure.

Reason: these files are automatically loaded by the Agent Harness when scoped into package subtrees. Repeating package-local contracts across thirteen packages creates permanent context overhead and duplicated governance.

Package-specific durable knowledge moves into each package's `README.md`.

### D3 — One `packages/AGENTS.md` is the only package-subtree Agent overlay

Create:

```text
packages/AGENTS.md
```

It must be concise: target 120–180 English words; hard limit 220 words.

It contains only:

1. scope: applies to `packages/**`;
2. before changing a package, read that package's `README.md`;
3. package README is local navigation/implementation guidance, below root AGENTS and Architecture Corpus Authority;
4. do not infer package Authority from code history;
5. do not create nested package `AGENTS.md`;
6. cross-package or boundary-changing work requires reading `packages/INDEX.md`;
7. run focused package verification plus repository-level affected gates;
8. stop on Corpus conflict or unresolved package ownership/boundary questions.

It must not contain:

- Skill routing;
- milestone/PR procedure;
- compatibility-policy essay;
- architecture invariant dump;
- package-by-package catalog;
- copied root AGENTS prose.

### D4 — `packages/README.md` explains the package subsystem; `packages/INDEX.md` is navigation

`packages/README.md` owns:

- what the workspace package layer is;
- how package ownership is interpreted;
- how to read package README files;
- shared package-boundary principles;
- how to add/remove a package;
- link to `packages/INDEX.md`.

`packages/INDEX.md` owns:

- compact package inventory;
- semantic layer/category;
- one-line responsibility;
- direct link to each package README.

Do not duplicate long package descriptions in both files.

### D5 — Every package keeps one substantive `README.md`

For every direct `packages/*` workspace package, require `README.md`.

Required headings:

```markdown
# @heptalogos/<package>

## Purpose

## Owns

## Does not own

## Public surface

## Dependencies and boundaries

## Change constraints

## Verification

## Architecture references
```

`Change constraints` receives useful package-specific rules migrated from the deleted local `AGENTS.md`.

Package README target: 250–800 words. No hard lower bound.

Long-lived README content must be current-state semantic documentation:

- no H2A/H2B/H2-S development chronology;
- no PR numbers;
- no commit IDs;
- no session history;
- no "temporary until milestone X";
- no duplicated global Agent rules.

### D6 — Architecture references must be direct relative links

Do not write:

```text
Read Corpus S01, S13, S15
```

Write actual relative Markdown links, e.g.:

```markdown
- [`05 — 整机执行模型`](../../Architecture_Corpus/05-整机执行模型.md)
- [`S01 — 启动、恢复与运行时监督`](../../Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md)
```

Every package README must contain at least one valid relative link resolving inside `Architecture_Corpus/`.

`packages/AGENTS.md` links only to:

- `README.md`
- `INDEX.md`

It should not carry a large Corpus reading list.

### D7 — Do not broaden this rule to unrelated trees

This corrective cycle changes the `packages/**` documentation topology only.

Do not redesign all `tools/**` Agent documentation in the same PR.

`tools/repo-kit/AGENTS.md` may remain if currently useful. A future repository-wide auto-context policy can evaluate `tools/**` separately.

### D8 — `check:repository` mechanically enforces the package topology

Required:

```text
packages/README.md       REQUIRED
packages/INDEX.md        REQUIRED
packages/AGENTS.md       REQUIRED

packages/<workspace>/README.md   REQUIRED
packages/<workspace>/AGENTS.md   FORBIDDEN
```

The verifier must discover direct package workspace directories from actual package layout, not a hard-coded thirteen-name list.

Do not require nested `AGENTS.md`.

### D9 — Root `AGENTS.md` stays small

Modify only enough to establish routing:

```text
For work under packages/**, follow packages/AGENTS.md and read the target
package README before editing.
```

Do not re-add package catalog or Skill routing to root AGENTS.

### D10 — Remaining Runtime review blockers stay in this corrective cycle

The package-documentation correction does not replace prior Independent Review findings.

This cycle must also close:

1. START action admitted before lineage retention but started after quiesce/terminal transition;
2. public imperative Runtime topology mutation path;
3. manual final-CI matrix resolving different candidate/base revisions;
4. ambiguous base-movement review rule;
5. hygiene scanner generic directory escape;
6. self-certifying `completedAfterLastRepositoryMutation`;
7. Corpus structural-gate test gaps.

### D11 — Runtime topology mutation has one canonical entry

Final public semantic model:

```text
DesiredRuntimeSnapshot
→ reconciliation
→ Actual runtime topology
```

Do not retain a public general-purpose imperative `executePlan()` path.

`RuntimeReconciler.execute()` public API is removed.

`MicroSystemSupervisor.executePlan()` becomes private/internal implementation.

No deprecated aliases or compatibility shims.

### D12 — START admission gets a second check at actual start entry

There are two checks for different races:

1. reconciliation/action scheduling admission check;
2. `start()` entry admission check after any asynchronous retained-lineage prelude.

The second check occurs before:

- Actual state mutation;
- GenerationFence creation;
- STARTING AbortController creation;
- substrate activation.

If supervisor no longer accepts START admission, `definition.activate()` is never entered.

### D13 — Final CI uses one internally frozen machine snapshot

No user/Agent SHA fields return.

Workflow topology:

```text
resolve-candidate
       ↓
verify matrix: Ubuntu / macOS / Windows
       ↓
revalidate-candidate
```

`resolve-candidate` captures PR-head and base revisions once as internal job outputs.

All matrix jobs test those same exact internal revisions.

`revalidate-candidate` fails if live PR head, base revision, PR state, or branch identity changed before completion.

These revision IDs are implementation details only:

- not workflow inputs;
- not PR body;
- not plans;
- not qualification fields.

### D14 — Stable-base closure window

Remove the previous "base movement may preserve review if semantically unchanged" judgment.

New rule:

```text
Ready
→ Independent Review
→ Final CI
→ Merge
```

operates as a short stable-base closure window.

Other merges to `master` are operationally deferred during this window.

If `master` nevertheless moves:

- candidate becomes stale;
- PR returns to Draft;
- integrate/rebase as appropriate;
- rerun affected qualification;
- Ready;
- obtain new Independent Review;
- then final CI.

Do not ask an Agent to decide "semantic equivalence" of base movement.

### D15 — Hygiene scans tracked current-tree files, not guessed directory names

Production hygiene discovery uses Git tracked paths (`git ls-files`) under the scanner's explicit current/canonical roots.

Therefore:

- tracked `generated/**` is scanned;
- tracked `caches/**` is scanned;
- untracked build/cache output is naturally absent;
- `node_modules`/dist guesses are no longer the core trust model.

Unit tests do not need a real Git repository: expose/inject a tracked-path list into the pure scanner function.

Do not add generic ignore/allowlist escape hatches.

### D16 — Remove self-certifying qualification booleans

Delete current candidate fields such as:

```text
completedAfterLastRepositoryMutation: true
```

Do not replace them with:

- `treeFrozen: true`
- `candidateCurrent: true`
- `reviewStillValid: true`
- similar repository-state claims stored inside the repository itself.

Repository freshness is governed by PR lifecycle and machine checks.

Qualification files record concrete evidence and status, not self-attestation of tree freshness.

---

## 2. Desired documentation topology

Final package tree:

```text
packages/
├── AGENTS.md
├── README.md
├── INDEX.md
├── bootstrap-runtime/
│   └── README.md
├── bootstrap-state/
│   └── README.md
├── canonical-schema/
│   └── README.md
├── evidence/
│   └── README.md
├── execution-lineage/
│   └── README.md
├── foundation-contracts/
│   └── README.md
├── host-ownership/
│   └── README.md
├── persistence/
│   └── README.md
├── private-postgres/
│   └── README.md
├── runtime-kernel/
│   └── README.md
├── runtime-substrate/
│   └── README.md
├── schema-runtime/
│   └── README.md
└── time-service/
    └── README.md
```

No package child directory contains `AGENTS.md`.

---

## 3. Task 0 — Return PR #24 to Draft and activate correction

**Files:**

- Create/update the current corrective plan under `docs/plans/active/foundation/`.
- Modify: `docs/plans/README.md`
- PR metadata only; no production files yet.

- [x] Change PR #24 to Draft.
- [x] Update PR body: Independent Review `REQUEST_CHANGES`; corrective cycle active; final CI `NOT_RUN`; merge not authorized.
- [x] Install this plan as the active correction plan.
- [x] Keep the earlier H2-S implementation plan as completed history.
- [x] Run current baseline gates: `pnpm check:repository`, `pnpm check:hygiene`, `pnpm check:agents`.
- [x] Record actual baseline PASS/FAIL only.

**Commit:** `docs: activate PR24 review correction`

---

## 4. Task 1 — Collapse package Agent guidance into one subtree overlay

**Files:**

- Create: `packages/AGENTS.md`
- Modify: `packages/README.md`
- Create: `packages/INDEX.md`
- Delete: every `packages/*/AGENTS.md`
- Modify: root `AGENTS.md`

### Required `packages/AGENTS.md`

Use this semantic content, keeping final prose under 220 words:

```markdown
# Package Workspace Agent Contract

## Scope

This file governs work under `packages/**`.

Before editing a package, read that package's `README.md`. For cross-package
changes, also read [`INDEX.md`](./INDEX.md) and [`README.md`](./README.md).

Package READMEs are implementation-local navigation and boundary guidance.
They are subordinate to the repository root `AGENTS.md` and the Architecture
Corpus. Do not infer Authority from code history, previous milestones, tests,
or existing dependency accidents.

Do not create `AGENTS.md` inside individual package directories. Durable
package-specific constraints belong in the package `README.md`.

Keep changes inside the package's declared ownership and dependency direction.
If a change requires moving Authority, introducing a new cross-package
dependency, adding compatibility behavior, or contradicting the Corpus, stop
with `PLAN_GAP`.

Run the package's focused verification targets and all affected repository
gates before claiming completion.
```

Small wording edits are allowed only for grammar/accuracy, not semantics.

### `packages/README.md`

Remove the statement that each package has its own `AGENTS.md`.

Add:

- purpose of package workspace;
- difference among root AGENTS / packages AGENTS / package README;
- how to navigate via INDEX;
- package-addition rules;
- current package README schema;
- semantic dependency-direction guidance.

Do not duplicate the entire INDEX table.

### `packages/INDEX.md`

Create a compact table with direct README links for all discovered package workspaces. Required semantic roles:

- `foundation-contracts` — shared IDs, Problems, digest/shared semantic primitives.
- `schema-runtime` — generic runtime schema compilation/validation.
- `bootstrap-state` — crash-safe bootstrap state/journals.
- `private-postgres` — private PostgreSQL process/toolchain mechanics.
- `host-ownership` — Host lease/fence/ownership token.
- `bootstrap-runtime` — installation/recovery/Host handoff and maintenance orchestration.
- `canonical-schema` — current PRE_PRODUCTION PostgreSQL schema baseline.
- `persistence` — Host-fenced normal PostgreSQL transactions/service.
- `time-service` — time abstraction/test time.
- `execution-lineage` — ExecutionContext and retained lineage.
- `evidence` — retained Evidence contract/service.
- `runtime-substrate` — Cordis-backed activation/resource mechanics adapter.
- `runtime-kernel` — reconciliation, generations, Service/Capability lifecycle, readiness, quiescence.

Do not include milestone/status columns.

### Delete local package AGENTS

Delete every current `packages/*/AGENTS.md`.

Migrate only useful package-specific rules into the matching README's `Change constraints`.

Discard repeated:

- root/global rules;
- Skill routing;
- PR lifecycle prose;
- compatibility-policy boilerplate;
- generic verification prose already present under `Verification`.

### Root AGENTS edit

Add only:

```text
For work under `packages/**`, follow `packages/AGENTS.md` and read the target
package `README.md` before editing.
```

If equivalent wording already exists, replace rather than duplicate.

**Verification:** `pnpm check:agents`, formatting, and manual `find packages -mindepth 2 -name AGENTS.md` equivalent.

**Commit:** `docs: simplify package agent context`

---

## 5. Task 2 — Upgrade every package README

**Files:** modify all thirteen `packages/*/README.md`.

Required headings:

```text
Purpose
Owns
Does not own
Public surface
Dependencies and boundaries
Change constraints
Verification
Architecture references
```

For each deleted local AGENTS:

1. read it;
2. keep only package-specific executable constraints;
3. move those to `Change constraints`;
4. discard duplicated global constraints.

Specific required constraints:

### `runtime-kernel`

- Runtime topology Authority is Desired-state reconciliation.
- no Bootstrap private types.
- Cordis mechanics remain behind runtime-substrate.
- do not introduce H3 durable-work/effect semantics.
- lifecycle/quiescence changes require focused concurrency/cancellation tests.

If current README says `runtime contract compatibility registration/helpers`, disambiguate it as current contract matching/evaluation if that is the actual meaning; do not imply historical legacy support.

#### `runtime-substrate`

- Cordis objects/mechanics do not escape the adapter boundary.
- substrate owns mechanics, not Desired/Actual, Service/Capability meaning, provider selection, or Generation Authority.

#### `bootstrap-runtime`

- production source does not depend on runtime-kernel/runtime-substrate/Cordis.
- integration/test composition may use them.
- Bootstrap/Host ownership order is not bypassed for cleanup convenience.

#### `canonical-schema`

- one current PRE_PRODUCTION baseline.
- development chronology does not justify append-only compatibility migrations.

#### `persistence`

- canonical normal mutation remains Host-fenced.
- no second direct canonical mutation path.

#### `foundation-contracts`

- no database/process/filesystem/framework mechanics.
- no higher-level runtime ownership.

Replace all plain Corpus labels with real relative Markdown links. Every README requires at least one valid link resolving under `Architecture_Corpus/`; normally use 2–6.

**Verification:** `pnpm format:check`; repository gate after Task 3.

**Commit:** `docs: consolidate package constraints into readmes`

---

## 6. Task 3 — Rewrite package documentation repository gate

**Files:**

- Modify: `scripts/verify/repository.mjs`
- Add/update tests under `tools/repo-kit/test/`.

Required top-level package docs:

- `packages/README.md`
- `packages/INDEX.md`
- `packages/AGENTS.md`

Fail if `packages/AGENTS.md` exceeds 220 words.

For each direct child of `packages/` containing `package.json`:

- require `README.md`;
- forbid `AGENTS.md`.

Do not hard-code package names.

Require README headings:

- Purpose
- Owns
- Does not own
- Public surface
- Dependencies and boundaries
- Change constraints
- Verification
- Architecture references

Parse relative Markdown links from `Architecture references`:

- at least one must resolve inside `Architecture_Corpus/`;
- all such local references must exist;
- links escaping elsewhere do not count.

INDEX coverage:

- every discovered package appears exactly once as a link to its README;
- INDEX must not list a nonexistent package.

Tests:

1. missing packages/AGENTS -> FAIL;
2. missing packages/INDEX -> FAIL;
3. package missing README -> FAIL;
4. nested package AGENTS -> FAIL;
5. README missing Change constraints -> FAIL;
6. README lacks Corpus link -> FAIL;
7. broken Corpus link -> FAIL;
8. INDEX omits existing package -> FAIL;
9. INDEX links nonexistent package -> FAIL;
10. valid topology -> PASS.

If `repository.mjs` is too monolithic for clean tests, extract only package-doc validation into `tools/repo-kit/src/package-docs.mjs`; do not build a generic docs framework.

**Verification:**

```bash
pnpm nx run repo-kit:test
pnpm check:repository
pnpm check:agents
```

**Commit:** `test: enforce context-efficient package docs`

---

## 7. Task 4 — Close the delayed START admission race

**Files:**

- `packages/runtime-kernel/src/supervisor.ts`
- `packages/runtime-kernel/src/supervisor.test.ts`

At the beginning of semantic `start(...)`, before Actual mutation, GenerationFence creation, STARTING AbortController creation, or substrate activation, re-check `acceptsStartAdmission()`.

Use the repository's existing Problem style/code if an equivalent not-active Problem already exists; do not invent a duplicate error taxonomy.

Retain the earlier reconciliation admission check and post-activation fencing.

Add two regressions with a lifecycle-lineage test double that blocks before invoking the retained operation:

A. delayed START + quiesce:

- Desired requires START;
- retained prelude blocks;
- request quiesce;
- release prelude;
- `definition.activate()` count remains 0;
- quiesce completes.

B. delayed START + owner abort:

- retained prelude blocks;
- abort owner;
- release;
- activate count remains 0;
- terminal close completes.

Do not cancel Persistence/lineage retention itself.

**Verification:**

```bash
pnpm nx run runtime-kernel:test
pnpm typecheck
pnpm tsc6
```

**Commit:** `fix: fence delayed runtime starts`

---

## 8. Task 5 — Remove the second Runtime topology Authority path

**Files:**

- `packages/runtime-kernel/src/reconciler.ts`
- `packages/runtime-kernel/src/supervisor.ts`
- `packages/runtime-kernel/src/index.ts` if required
- affected tests
- `packages/runtime-kernel/README.md`

Remove public `RuntimeReconciler.execute(...)`.

Make Supervisor plan execution private/internal and non-exported.

Final public mutation path:

```text
DesiredRuntimeSnapshot
→ reconciliation
→ Actual
```

Do not add deprecated aliases, unsafe variants, or test-only public escape hatches.

Tests that directly execute arbitrary plans must be rewritten through Desired snapshots.

Pure plan computation may remain public if it cannot mutate Actual state.

**Verification:**

```bash
pnpm nx run runtime-kernel:test
pnpm typecheck
pnpm tsc6
pnpm check:boundaries
```

**Commit:** `refactor: make desired state the runtime mutation authority`

---

## 9. Task 6 — Freeze one manual-CI candidate internally

**Files:**

- `.github/workflows/verify.yml`
- `scripts/verify/repository.mjs`
- `docs/engineering/playbooks/repository/milestone-pr-closure.md`
- applicable H-stage closure governance text.

Workflow becomes:

1. `resolve-candidate`
2. three-OS `verify` matrix
3. `revalidate-candidate`

`resolve-candidate`:

- require PR open;
- require Ready for final-pre-merge;
- require base branch master;
- require dispatched branch = PR head branch;
- internally resolve PR-head revision and current master revision once.

Matrix:

- all jobs consume exactly those internal revisions;
- checkout resolved PR state;
- fetch resolved base;
- temporary merge;
- run `pnpm verify`;
- do not independently re-resolve live revisions.

`revalidate-candidate`:

- PR still open/Ready;
- same head branch;
- live PR revision equals internally resolved head;
- current master equals internally resolved base;
- otherwise FAIL.

Concurrency:

```yaml
group: verify-manual-pr-${{ inputs.pr_number }}
cancel-in-progress: true
```

No SHA workflow inputs or docs/evidence fields.

Keep third-party Action immutable commit pins.

Stable-base governance:

- Ready → Review → Final CI → Merge is a short stable-base window.
- defer unrelated master merges during it.
- if master moves, candidate returns Draft; integrate; rerun affected qualification; Ready; new review.
- delete any "semantically unchanged base movement" exception.

**Verification:** workflow static inspection + `pnpm check:repository`.

**Commit:** `ci: freeze one live PR candidate internally`

---

## 10. Task 7 — Make hygiene use tracked-file discovery

**Files:**

- `tools/repo-kit/src/current-tree-hygiene.mjs`
- `tools/repo-kit/test/current-tree-hygiene.test.mjs`
- production wrapper if needed.

Separate tracked-file discovery from pure scanning.

Production discovery:

- `git ls-files -z`;
- normalize repo-relative paths;
- filter by explicit current/canonical scan roots;
- pass list to scanner.

Pure scanner:

- scans only supplied tracked paths;
- no broad `generated` or `caches` basename exclusion;
- preserves explicit historical/evidence-root classification;
- tracked symlink in canonical/executable surface remains FAIL.

Tests:

1. tracked `generated/**` residue -> FAIL;
2. tracked `caches/**` residue -> FAIL;
3. omitted/untracked equivalent path not scanned;
4. tracked canonical symlink -> FAIL;
5. historical evidence path excluded semantically;
6. clean tracked surface -> PASS.

No `.hygieneignore`, allowlist, baseline, or suppression comments.

**Verification:**

```bash
pnpm nx run repo-kit:test
pnpm check:hygiene
pnpm check:repository
```

**Commit:** `refactor: scan tracked current-tree hygiene surfaces`

---

## 11. Task 8 — Remove self-certifying qualification state

Modify current H2-S candidate sections in:

- `Q-RUNTIME-01.md`
- `Q-PERSISTENCE-01.md` where applicable
- `qualification-status.json`
- current corrective plan/roadmap projections if applicable.

Delete:

```text
completedAfterLastRepositoryMutation
```

and equivalent self-certifying fields.

Do not replace with `treeFrozen`, `candidateCurrent`, `reviewStillValid`, or similar.

Keep concrete evidence:

- PR number/state;
- local verification status;
- PostgreSQL environment/version;
- named PG scenario outcomes;
- Independent Review status;
- final CI status;
- merge status.

Do not add commit IDs.

**Verification:** `pnpm check:corpus`, `pnpm format:check`.

**Commit:** `docs: remove self-certifying candidate state`

---

## 12. Task 9 — Close Corpus structural-gate gaps

**Files:**

- `scripts/verify/corpus-structure.mjs`
- relevant tests.

Add a real unindexed normative-document test:

- create an existing numbered document fixture;
- omit it from INDEX;
- expect index-coverage FAIL.

Add Corpus-local containment:

- local normative links must resolve to existing files;
- resolved path must remain inside `Architecture_Corpus/`;
- an existing `../docs/foo.md` target still fails as a normative local dependency.
- external http/https informational links remain allowed.

**Verification:**

```bash
pnpm nx run repo-kit:test
pnpm check:corpus
```

**Commit:** `test: close corpus navigation gaps`

---

## 13. Task 10 — Reconcile long-lived docs

After source changes, reread and update only affected:

- `packages/runtime-kernel/README.md`
- `packages/README.md`
- `packages/INDEX.md`
- relevant closure playbook/Corpus sections
- root/packages AGENTS only if factual routing changed.

Do not mention PR #24, REQUEST_CHANGES, or H2-S chronology inside permanent package docs.

Run:

```bash
pnpm check:agents
pnpm check:repository
pnpm check:corpus
pnpm check:hygiene
pnpm format:check
```

---

## 14. Task 11 — Fresh verification and PostgreSQL 18.6 qualification

Because Runtime behavior/public API changes, prior candidate evidence is not sufficient.

Focused first:

```bash
pnpm nx run runtime-kernel:test
pnpm nx run repo-kit:test
pnpm check:repository
pnpm check:hygiene
pnpm check:boundaries
pnpm check:corpus
pnpm check:agents
```

Run affected Bootstrap Runtime tests, including PG6.

Run complete fresh H2-S PostgreSQL 18.6 integration:

1. normal Host + Runtime composition;
2. authentic Host close/loss terminality;
3. planned STOP via Runtime quiescence;
4. planned RESTART continuity/fresh Runtime generation;
5. safe-abort `resumeAfterAbort()` structural compatibility;
6. shutdown-keep-Postgres then Bootstrap-owned reacquisition/cleanup.

Then run:

```bash
pnpm verify
```

No skipped required PG scenario may be reported PASS.

---

## 15. Task 12 — Final evidence and candidate readiness

Update current evidence semantically:

```text
PR #24
candidate state: READY_FOR_REVIEW
local qualification: PASS
fresh PostgreSQL 18.6: PASS
Independent Review: NOT_RUN
final cross-platform CI: NOT_RUN
merge: NOT_RUN
```

No base/head SHA. No self-certifying freshness boolean.

After evidence-only repository mutation run:

```bash
pnpm check:corpus
pnpm check:repository
pnpm check:hygiene
pnpm verify
```

PG18.6 need not be rerun solely for evidence-only Markdown/JSON edits if no production/test/runtime/database-path file changed. If such a file changes, rerun claim-matched PG qualification.

Complete/move the corrective plan, keep H2 OPEN and H3 NOT_ELIGIBLE, push all changes, update PR body, and mark PR #24 Ready.

Final CI remains NOT_RUN.

---

## 16. Task 13 — New Independent Review

Review current live Ready PR #24.

Required review surfaces:

- Runtime delayed-start race;
- Desired-state-only topology mutation;
- package Agent-context topology;
- package README boundary accuracy/direct Corpus navigation;
- repository/hygiene gates;
- final-CI snapshot binding;
- qualification truthfulness;
- absence of undeclared PRE_PRODUCTION legacy compatibility.

Result:

- REQUEST_CHANGES -> Draft before edits.
- PASS -> no further repository mutation; proceed to final CI.

Do not require operator-maintained SHA tuples.

---

## 17. Task 14 — Final CI and merge

After Independent Review PASS:

```bash
gh workflow run verify.yml   --ref dev/h2-stabilization   -f pr_number=24   -f reason=final-pre-merge
```

Require:

- resolve-candidate PASS;
- Ubuntu PASS;
- macOS PASS;
- Windows PASS;
- revalidate-candidate PASS.

Keep master stable during closure window.

Any PR/base mutation -> candidate stale -> Draft; do not perform semantic-equivalence judgment.

If all remain current, squash merge PR #24.

---

## 18. Task 15 — Post-merge reconciliation

Create the small docs/evidence-only reconciliation PR.

Record:

- Independent Review PASS;
- final cross-platform CI PASS;
- PR #24 merged;
- H2-S CLOSED;
- H2 CLOSED;
- H3 ELIGIBLE;
- remaining product qualification residuals honestly.

Do not add:

- merge SHA;
- exact pair;
- checksum manifest;
- package-local AGENTS.

Only after reconciliation merges may H3 become ACTIVE.

---

## 19. Permanent invariants after correction

### Agent context

```text
root AGENTS.md
+ packages/AGENTS.md under packages/**
```

Package-specific knowledge:

```text
target package README
+ packages/INDEX.md for cross-package navigation
+ direct Corpus links from README
```

Forbidden:

```text
packages/*/AGENTS.md
```

### Runtime

```text
DesiredRuntimeSnapshot → reconcile → Actual
```

No public arbitrary execution-plan mutation.

### Review

```text
live PR lifecycle + machine-internal revision binding
```

No human-maintained SHA tuple.

### Compatibility

```text
PRE_PRODUCTION + no declared external compatibility obligation
→ no historical compatibility mechanism
```

---

## 20. Stop conditions

Stop with `PLAN_GAP` if correction requires:

- new production package;
- new Runtime subsystem;
- Bootstrap production dependency on runtime-kernel/runtime-substrate/Cordis;
- new compatibility obligation;
- retaining public imperative topology API for an unknown caller;
- review database/service/bot;
- automatic CI on ordinary push/PR;
- custom Git abstraction layer;
- docs generator/framework;
- H3 WorkQueue/effect/durable-work semantics;
- broad unrelated `tools/**` documentation redesign;
- weakening third-party Action pins;
- generic hygiene allowlist/suppression.

---

## 21. Completion checklist

PR #24 may request Independent Review again only when:

- [x] PR stayed Draft during correction.
- [x] all `packages/*/AGENTS.md` removed.
- [x] `packages/AGENTS.md`, `README.md`, `INDEX.md` present.
- [x] package AGENTS hard limit <=220 words.
- [x] every package README contains `Change constraints`.
- [x] every package README has valid direct Corpus links.
- [x] repository gate enforces required/forbidden topology and INDEX coverage.
- [x] delayed START race fixed and tested.
- [x] public arbitrary Runtime execution-plan mutation removed.
- [x] final CI resolves one internal candidate/base snapshot for all OS jobs.
- [x] stable-base rule replaces semantic base-equivalence judgment.
- [x] hygiene uses tracked current-tree input.
- [x] self-certifying qualification state removed.
- [x] Corpus structural gaps tested.
- [x] fresh PostgreSQL 18.6 H2-S qualification PASS.
- [x] fresh `pnpm verify` PASS.
- [x] current evidence truthful and SHA-governance-free.
- [x] corrective plan completed.
- [x] PR body reconciled.
- [ ] PR returned Ready.
- [ ] final CI still NOT_RUN until new Independent Review PASS.
