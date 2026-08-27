# Heptalogos Repository Stabilization & Topology Reset — Master Implementation Plan v2

> **SUPERSEDES / INVALIDATES:** `Heptalogos_Repository_Stabilization_Master_Plan_2026-08-27.md` v1. The v1 RS-0 revert/re-land sequence MUST NOT be executed. If an executor created a local RS-0A branch from v1, stop it before push/merge and discard that branch after confirming remote `master` is unchanged.


> **For agentic workers:** Execute this plan as a sequence of independently reviewable change sets. Do not collapse P0 and RS-1 through RS-6 into one unreviewable mega-change. Before implementation, create an isolated worktree/branch. Every task below has explicit exit criteria; do not advance while the current task is red.
>
> **Required execution discipline:** current repository `AGENTS.md` remains authoritative. The project is `PRE_PRODUCTION`; undeclared compatibility with development history is forbidden. Do not preserve old repository paths, aliases, redirect stubs, deprecated package entrypoints, dual readers, old document homes, or phase-era executable identities merely because they existed before this reset.

**Goal:** Starting only after the separate H3A-1 premature-merge governance anomaly is resolved, restructure the repository documentation topology and repository control plane, harden package/repository boundaries, remove dead and speculative surfaces, and leave a clean Foundation baseline from which H3A-2 can resume without carrying development-stage repository debt.

**Architecture:** Treat the repository itself as an engineered system. Physical topology must encode responsibility and lifecycle; documentation Authority must be logical rather than tied to one special root directory; repository mechanics must be executable, self-discovering, testable, and library-first; source, test, tooling, evidence, and historical planes must be explicit. Borrow DeepSeek Harness mechanisms where they are strong, but do not reproduce its organization-scale workflow or its flat `scripts/` layout.

**Tech Stack:** Node.js 24, pnpm 11, Nx 23, TypeScript 7 primary + TS6 compiler-API lane, ESLint, Vitest, Prettier, existing `@heptalogos/repo-kit`, `@nx/eslint-plugin` matched to the repository Nx version, Knip, existing manual GitHub Actions verification workflow.

> Remaining mechanics/library-first corrective work is governed by the named
> active plan `mechanics-ownership-library-first-convergence-2026-08-28.md`.

**Repository destination when adopted:** `docs/plans/active/repository/repository-stabilization-topology-reset-2026-08-27.md`

**Spec / authority inputs:**
- repository root `AGENTS.md`
- `packages/AGENTS.md`
- current Architecture Corpus semantics
- `docs/roadmap/development-roadmap.md`
- current H3A active implementation plan
- current repository/package READMEs
- current repository verification gates
- current `.agents/heptalogos/corpus-routes.json`
- current `tools/repo-kit`
- DeepSeek Harness repository-topology / scripts / docs / package-governance patterns reviewed before this plan

---

## Global Constraints

1. **H3A-2 is frozen for the duration of this plan.** Repository stabilization is not H3A-2 implementation.
2. **H3A-1 governance is repaired by a separate explicitly approved recovery plan before structural reset work begins.** This plan MUST NOT revert, re-land, rewrite, or otherwise mutate H3A-1 product history as a governance transport.
3. **No development compatibility.** `CompatibilityEpoch = PRE_PRODUCTION`; only the canonical current shape remains.
4. **No translation work in this plan.**
   - no `*.zh.md` mirror files;
   - no translation sidecars;
   - no translation manifest;
   - no translation CI;
   - no `docs/i18n/` scaffolding;
   - no bilingual parity requirement.
5. **Future i18n must not be blocked.** New durable document paths use language-neutral ASCII semantic slugs while document content may remain Chinese.
6. **Architecture Corpus remains a logical Authority concept, not a physical root directory.**
7. **One home per fact.** Current-state architecture, governance, engineering procedure, qualification evidence, roadmap guidance, and historical implementation records have different homes.
8. **No package-local `AGENTS.md`.** Keep repository root `AGENTS.md`, `packages/AGENTS.md`, and add only a single `docs/AGENTS.md` for documentation-specific rules.
9. **Library-first repository governance.** Use Nx/ESLint/Knip for generic dependency/import/dead-code mechanics. Custom scripts own only Heptalogos-specific repository semantics that mature tools cannot express cleanly.
10. **No empty future architecture.** Do not create `apps/`, `native/`, `vendor/`, `examples/`, `experiments/`, `scripts/release/`, `scripts/generate/`, or `docs/i18n/` until a real current owner exists.
11. **Do not encode stage/PR/session provenance into current executable identities.** Historical plans and Git history remain the provenance store.
12. **Every permanent mechanically checkable repository promise must have an executable failing gate.**
13. **Generated facts are derived from their source of truth.** Do not manually maintain a second catalog when workspace/package/source metadata can generate or validate it.
14. **Unknown cleanup targets fail closed.** A cleanup tool must refuse deletion if a candidate path contains unknown material.
15. **Focused validation during edits; full `pnpm verify` before each stabilization PR is declared complete.**
16. **No commit SHA copied into plan/roadmap/qualification/Agent instructions.** Git/GitHub may use revision identities internally.

---

# 0. Target Repository Shape

The target after this reset is intentionally small:

```text
/
├── .agents/                 # agent routing/skills/tests only
├── .github/                 # repository-host integration; manual verification workflow
├── docs/                    # complete documentation knowledge system
├── packages/                # product/Foundation workspace packages
├── scripts/                 # thin repository command entrypoints, grouped by responsibility
├── tests/                   # repository-wide/toolchain tests that do not belong to one package
├── tools/                   # reusable repository tooling packages
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── nx.json
├── eslint.config.mjs
├── tsconfig*.json
└── ordinary root configuration files
```

The following are explicitly **not** permanent root responsibilities after this reset:

```text
former physical Corpus root          # removed after Authority migration
.codegraph/                  # remove tracked placeholder because no current executable consumer exists
fixtures/                    # current root fixture is re-homed under tests/toolchain/
phase/stage script roots     # forbidden as historical storage
generated build output       # ignored / cleaned, never source Authority
```

Before enforcing the final root topology, P0 MUST inventory every current root entry and classify it by owner, lifecycle, and plane. The validator is derived from that reviewed inventory; it must not begin from a guessed allowlist.

`packages/*` remains physically flat in this reset. The package count is currently small enough that a forced `packages/<group>/<pkg>` migration would create path churn without enough independent family-level ownership. Semantic families are encoded first through docs, Nx metadata, generated navigation, and dependency constraints. A future physical package-family migration requires all of:

1. at least two independently evolving packages in a family;
2. a family-level contract/navigation need not expressible cleanly at repository/package level;
3. stable family identity that is not merely a temporary development layer;
4. measurable reduction in navigation or dependency-governance complexity;
5. a migration plan with no old-path compatibility.

---

# P0 — Execution Baseline, Plan Adoption & Root Inventory

## Objective

Begin repository stabilization from a truthful post-recovery `master`, make this plan a tracked active repository plan before implementation, and establish the complete root responsibility inventory before any topology validator is written.

## Hard precondition

The separate H3A-1 premature-merge recovery decision/plan must already be closed.

Required current state:

```yaml
H3A_1: CLOSED
H3A_2: BLOCKED_BY_REPOSITORY_STABILIZATION
prematureMergeRecovery: CLOSED
```

This plan does **not** define how that recovery is achieved and MUST NOT:
- revert H3A-1;
- re-land H3A-1;
- manufacture a zero-diff candidate;
- alter H3A-1 product code to obtain review transport;
- retroactively label a post-merge event as a pre-merge review/CI PASS.

If the precondition is not true, stop with `PLAN_GAP_GOVERNANCE_RECOVERY`.

## P0.1 — Confirm the actual integration baseline

- [ ] Fetch/refresh remote `master`.
- [ ] Require the local branch base to equal current remote `master`.
- [ ] Require a clean tracked working tree before creating the stabilization branch.
- [ ] Confirm H3A-2 code is not present beyond the already frozen H3A-1 boundary.
- [ ] Confirm no v1 RS-0 revert/re-land commit is present on remote `master`.

If a v1 recovery branch exists only locally or remotely but is unmerged:
- do not merge it;
- close/delete it after preserving any useful diagnostics in the execution report;
- do not preserve it as a current repository artifact.

## P0.2 — Create the stabilization branch

Create one ordinary short-lived branch from the confirmed `master`.

Do not require a second worktree. A worktree is an executor convenience, not a repository semantic requirement.

The branch name may follow current local conventions; branch names are Git transport identity and are not copied into current architecture/source identities.

## P0.3 — Adopt this plan into its canonical active home first

Create:

```text
docs/plans/active/repository/repository-stabilization-topology-reset-2026-08-27.md
```

The file content is this v2 plan.

Modify:

```text
docs/plans/README.md
```

Rules:
- keep the H3A plan active; H3A-2 is explicitly blocked by repository stabilization;
- list this repository plan as a separate active plan with non-overlapping scope;
- do not copy the external/downloaded v2 plan to a second repository location;
- after the canonical tracked copy is created, the external input file is no longer part of repository state.

Run the existing documentation/repository gates that are available before RS-1.

Commit this plan adoption as the first stabilization commit.

## P0.4 — Produce the root responsibility inventory before changing topology

Inspect every tracked root file/directory and classify:

```text
path
owner
current purpose
plane
lifecycle
keep | move | delete
consumer/evidence
```

At minimum the inventory must cover:

```text
.agents/
.codegraph/
.github/
former physical Corpus root
docs/
fixtures/
packages/
scripts/
tools/
all root configuration/manifests
```

Known evidence at plan authoring time:

```text
.codegraph/
  contains only a tracked .gitignore
  no current executable consumer found
  disposition: delete in RS-4/RS-5

fixtures/ts6-api-lane.ts
  current consumer: tsconfig.ts6.json
  purpose: repository toolchain/API compatibility test input
  disposition: move to tests/toolchain/ts6-api-lane.ts and update tsconfig.ts6.json / lint-ignore references

former physical Corpus root
  current normative documentation Authority root
  disposition: decompose/migrate into docs/ during RS-1, then remove root

docs/
  current engineering/plans/roadmap knowledge
  disposition: expand into complete knowledge system

packages/
  product/Foundation workspaces
  disposition: keep physically flat in this reset unless evidence discovered during the inventory invalidates the current assumption

scripts/
  repository command entrypoints
  disposition: keep and restructure by command responsibility

tools/repo-kit/
  reusable repository mechanics
  disposition: keep and strengthen
```

Do not create the final root-topology gate until this inventory is reviewed against actual current consumers.

## P0 acceptance

```bash
git status --short
pnpm check:agents
pnpm check:repository
pnpm check:hygiene
pnpm format:check
```

Expected:
- canonical active v2 plan is tracked;
- no untracked plan copy is being used as candidate state;
- H3A-2 remains untouched;
- no v1 RS-0 revert/re-land work is part of the branch.

---


# RS-1 — Documentation & Authority Topology Reset

## Objective

Eliminate the former physical Corpus root while preserving Architecture Corpus as the logical authoritative knowledge closure used by agents and implementation plans.

## Target documentation topology

```text
docs/
├── README.md
├── INDEX.md
├── AGENTS.md
├── governance/
│   ├── constitution.md
│   ├── engineering-principles.md
│   ├── pre-production-evolution.md
│   └── compatibility-obligations.json
├── product/
│   └── product-goals.md
├── architecture/
│   ├── README.md
│   ├── authority-and-core-concepts.md
│   ├── system-architecture.md
│   ├── execution-model.md
│   ├── extensions.md
│   ├── foundation-services.md
│   ├── subject.md
│   ├── messaging.md
│   ├── ai-runtime.md
│   ├── management-authority.md
│   ├── data-evidence-persistence.md
│   ├── backup-portability-update-recovery.md
│   ├── platform-distribution.md
│   ├── research-subsystem-integration.md
│   ├── management-presentation.md
│   ├── configuration.md
│   ├── execution-lineage.md
│   ├── storage-lifecycle.md
│   └── contracts/
├── dependencies/
│   ├── README.md
│   ├── decision-ledger.md
│   ├── implementation-routing.md
│   └── dependency-routing.json
├── qualification/
│   ├── README.md
│   ├── verification-system.md
│   ├── dependencies.md
│   ├── dependency-matrix.md
│   ├── result-template.md
│   ├── dependency-status.json
│   ├── deferred-and-implementation-qualification.md
│   ├── evidence/
│   └── results/
├── reference/
│   └── glossary.md
├── engineering/
│   ├── README.md
│   ├── repository/
│   │   ├── architecture-review.md
│   │   └── toolchain.md
│   ├── gotchas/
│   ├── playbooks/
│   └── specs/
├── roadmap/
└── plans/
```

## 1.1 Exact migration map — top-level Corpus documents

| Current path | Target path |
|---|---|
| `former physical Corpus root/00-项目宪法与工程宪法.md` | `docs/governance/constitution.md` |
| `former physical Corpus root/01-产品目标与差异化.md` | `docs/product/product-goals.md` |
| `former physical Corpus root/02-架构原则与反NIH约束.md` | `docs/governance/engineering-principles.md` |
| `former physical Corpus root/03-核心概念与Authority.md` | `docs/architecture/authority-and-core-concepts.md` |
| `former physical Corpus root/04-总体系统架构.md` | `docs/architecture/system-architecture.md` |
| `former physical Corpus root/05-整机执行模型.md` | `docs/architecture/execution-model.md` |
| `former physical Corpus root/06-MicroSystem与Extension架构.md` | `docs/architecture/extensions.md` |
| `former physical Corpus root/07-Foundation系统服务目录.md` | `docs/architecture/foundation-services.md` |
| `former physical Corpus root/08-Subject与认知系统.md` | `docs/architecture/subject.md` |
| `former physical Corpus root/09-Messaging与Subject-Chat.md` | `docs/architecture/messaging.md` |
| `former physical Corpus root/10-AI-Runtime-Capability-MCP.md` | `docs/architecture/ai-runtime.md` |
| `former physical Corpus root/11-System-Authority与Operator-Assistant.md` | `docs/architecture/management-authority.md` |
| `former physical Corpus root/12-数据-证据-内容与持久化.md` | `docs/architecture/data-evidence-persistence.md` |
| `former physical Corpus root/13-备份-Subject可移植性-更新与恢复.md` | `docs/architecture/backup-portability-update-recovery.md` |
| `former physical Corpus root/14-跨平台产品运行与分发.md` | `docs/architecture/platform-distribution.md` |
| `former physical Corpus root/15-技术与依赖决策账本.md` | `docs/dependencies/decision-ledger.md` |
| `former physical Corpus root/16-验证与资格认定体系.md` | `docs/qualification/verification-system.md` |
| `former physical Corpus root/17-高级研究子系统接入地图.md` | `docs/architecture/research-subsystem-integration.md` |
| `former physical Corpus root/18-接口-CLI-Web与Presentation.md` | `docs/architecture/management-presentation.md` |
| `former physical Corpus root/19-术语表.md` | `docs/reference/glossary.md` |
| `former physical Corpus root/20-架构审查清单.md` | `docs/engineering/repository/architecture-review.md` |
| `former physical Corpus root/21-配置治理与Configuration-Surface.md` | `docs/architecture/configuration.md` |
| `former physical Corpus root/22-Execution-Lineage与可观测执行.md` | `docs/architecture/execution-lineage.md` |
| `former physical Corpus root/23-存储拓扑-生命周期根与DataOwner.md` | `docs/architecture/storage-lifecycle.md` |
| `former physical Corpus root/24-依赖使用与实现路由.md` | `docs/dependencies/implementation-routing.md` |
| `former physical Corpus root/25-TypeScript与仓库工具链.md` | `docs/engineering/repository/toolchain.md` |
| `former physical Corpus root/26-开发阶段闭包-稳定化与兼容性治理.md` | `docs/governance/pre-production-evolution.md` |

### Former physical Corpus README

Do not move it wholesale.

Split its responsibilities:

- repository/documentation entry and Authority ordering → `docs/README.md`
- architecture overview / Foundation scope / architecture reading path → `docs/architecture/README.md`
- duplicated text already owned by constitution/architecture documents → delete from the README rather than copy again

### Former physical Corpus index

Do not preserve as a second index.

- `docs/INDEX.md` becomes the sole global documentation navigation index.
- architecture-local navigation lives in `docs/architecture/README.md`.
- machine completeness is enforced by the documentation gate, not by a second manually duplicated Corpus index.

## 1.2 Exact migration map — detailed contracts

Move and rename the S-series while preserving their content semantics:

```text
S01-启动-恢复-运行时监督.md
→ docs/architecture/contracts/startup-recovery-runtime-supervision.md

S02-异步-WorkQueue-Durable-Time.md
→ docs/architecture/contracts/async-work-queue-durable-time.md

S03-持久化-事务-EffectFence.md
→ docs/architecture/contracts/persistence-transactions-effect-fence.md

S04-配置-Secret-管理Surface.md
→ docs/architecture/contracts/configuration-secret-management-surface.md

S05-Policy-Approval-Management-Operator.md
→ docs/architecture/contracts/policy-approval-management-operator.md

S06-Extension-Package-Trust-ExecutionDomain.md
→ docs/architecture/contracts/extension-package-trust-execution-domain.md

S07-Messaging-SubjectChat-Drivers.md
→ docs/architecture/contracts/messaging-subject-chat-drivers.md

S08-AI-Capability-MCP.md
→ docs/architecture/contracts/ai-capability-mcp.md

S09-Reactor-Context-Prompt与高级认知接入.md
→ docs/architecture/contracts/reactor-context-prompt-research-integration.md

S10-Evidence-Replay-Observability-Content.md
→ docs/architecture/contracts/evidence-replay-observability-content.md

S11-备份-更新-分发-平台.md
→ docs/architecture/contracts/backup-update-distribution-platform.md

S12-验证-Research-Evaluation.md
→ docs/architecture/contracts/verification-research-evaluation.md

S13-Foundation-Service-Capability-Readiness-Catalog.md
→ docs/architecture/contracts/foundation-service-capability-readiness-catalog.md

S14-Canonical-End-to-End-Flows.md
→ docs/architecture/contracts/canonical-end-to-end-flows.md

S15-Foundation横切合同.md
→ docs/architecture/contracts/foundation-cross-cutting-contracts.md

S16-Execution-Lineage-Observability.md
→ docs/architecture/contracts/execution-lineage-observability.md

S17-Storage-Workspace-DataLifecycle.md
→ docs/architecture/contracts/storage-workspace-data-lifecycle.md
```

Do not add S-numbers to new filenames. Those numbers are an editorial ordering device, not semantic identity.

## 1.3 Qualification migration

```text
former physical Corpus root/qualification/DEPENDENCY-QUALIFICATION.md
→ docs/qualification/dependencies.md

former physical Corpus root/qualification/dependency-status.json
→ docs/qualification/dependency-status.json

former physical Corpus root/qualification/依赖资格矩阵.md
→ docs/qualification/dependency-matrix.md

former physical Corpus root/qualification/验证结果模板.md
→ docs/qualification/result-template.md

former physical Corpus root/qualification/results/**
→ docs/qualification/results/**
```

Move evidence/reference material:

```text
former physical Corpus root/references/Foundation依赖证据基线-2026-08-20.md
→ docs/qualification/evidence/dependency-baseline-2026-08-20.md

former physical Corpus root/references/延期与实现期资格.md
→ docs/qualification/deferred-and-implementation-qualification.md
```

## 1.4 Machine-readable governance/reference classification

Apply these decisions:

### Keep as machine Authority

```text
former compatibility-register source
→ docs/governance/compatibility-obligations.json

former physical Corpus root/references/dependency-routing.json
→ docs/dependencies/dependency-routing.json

former physical Corpus root/qualification/dependency-status.json
→ docs/qualification/dependency-status.json
```

Rationale:
- each has current executable/agent governance consumers;
- each expresses state that is intentionally machine-readable;
- they are not merely prose-format duplicates.

### Delete as manually duplicated current-tree projection

```text
former physical Corpus root/references/constitution.json
former physical Corpus root/references/configuration-governance.json
former physical Corpus root/references/storage-governance.json
```

Before deletion:
- update every current `.agents` Skill/resource route to consume the canonical Markdown owner;
- preserve references inside historical completed plans without trying to rewrite history;
- add tests proving no current executable/active knowledge route requires these JSON files.

Do not replace them with newly named duplicate JSON files.

## 1.5 Create `docs/AGENTS.md`

`docs/AGENTS.md` is technical English and must contain these rules, concisely:

```text
- docs/ is the complete current documentation system.
- Authority is determined by document class, not by being outside docs/.
- one home per fact;
- current-state prose for standing docs;
- plans/history may preserve chronology;
- no reasoning transcript in standing docs;
- no development-stage provenance in current architecture/governance/reference docs;
- no translation work during PRE_PRODUCTION development unless explicitly reopened by project governance;
- filenames are language-neutral ASCII semantic slugs;
- generated facts must be generated or freshness-checked;
- do not create nested AGENTS.md under docs/;
- every current local Markdown link must resolve;
- historical completed plans may reference historical paths as historical facts.
```

## 1.6 Replace Corpus physical routing with logical document routing

### Modify

- `.agents/heptalogos/corpus-routes.json`
- `.agents/heptalogos/README.md`
- `.agents/heptalogos/validate-skill-resources.mjs`
- `.agents/heptalogos/tests/**`
- `.agents/skills/heptalogos-*/SKILL.md` where old paths are embedded

### New route model

Remove:

```json
"corpusRoot": "Architecture_Corpus",
"skillRelativeCorpusRoot": "../../../Architecture_Corpus"
```

Every route entry becomes repository-relative:

```json
{
  "version": 2,
  "routes": {
    "heptalogos-architecture": {
      "core": [
        "docs/governance/constitution.md",
        "docs/product/product-goals.md",
        "docs/architecture/authority-and-core-concepts.md",
        "docs/architecture/system-architecture.md"
      ]
    }
  }
}
```

The route validator must assert:

1. every route target is repository-relative;
2. target exists;
3. target is under an allowed current knowledge root (`docs/`);
4. active route targets do not point into `docs/plans/completed/`;
5. no duplicate path occurs inside one route list;
6. no route contains the former physical Corpus root marker;
7. JSON parses under the checked-in schema/version.

## 1.7 Replace `corpus-structure.mjs`

### Delete

- `scripts/verify/corpus-structure.mjs`
- corresponding Corpus-specific tests after equivalent tests are added

### Create

- `scripts/verify/documentation.mjs`
- `tools/repo-kit/src/documentation.mjs`
- `tools/repo-kit/test/documentation.test.mjs`

### `validateDocumentation()` contract

```js
validateDocumentation({ root }) -> {
  errors: Array<{
    code: string,
    path: string,
    message: string
  }>,
  markdownCount: number,
  jsonCount: number
}
```

It must verify:

- required top-level documentation entrypoints:
  - `docs/README.md`
  - `docs/INDEX.md`
  - `docs/AGENTS.md`
  - `docs/governance/constitution.md`
  - `docs/governance/pre-production-evolution.md`
  - `docs/governance/compatibility-obligations.json`
  - `docs/architecture/README.md`
  - `docs/dependencies/dependency-routing.json`
  - `docs/qualification/dependency-status.json`
- local Markdown links in current standing docs resolve;
- active/current docs do not link to the deleted former physical Corpus root;
- completed plans are allowed to retain historical literal paths;
- JSON Authority files parse;
- `docs/INDEX.md` links each first-level documentation area exactly once;
- `docs/architecture/README.md` links every direct architecture page and every contract page;
- no `*.zh.md`, `*.i18n.yaml`, or translation manifest exists during this development policy;
- no nested `docs/**/AGENTS.md` exists below `docs/AGENTS.md`.

## RS-1 tests

Add failing fixtures for:

1. route to missing doc;
2. route to completed historical plan;
3. broken current Markdown link;
4. current doc links to the deleted former physical Corpus root;
5. completed plan contains historical former-Corpus-root text and is accepted;
6. unindexed architecture contract;
7. forbidden nested docs AGENTS;
8. forbidden translation sidecar.

## RS-1 acceptance commands

```bash
pnpm check:agents
pnpm check:documentation
pnpm check:repository
pnpm check:hygiene
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

Then:

```bash
git grep -n "Architecture_Corpus" -- \
  ':!docs/plans/completed/**'
```

Expected: no current-tree match except an explicitly justified historical record outside executable/current authority; preferred result is zero outside completed historical material.

## RS-1 exit

- the former physical Corpus root no longer exists;
- Architecture Corpus continues to exist as a logical route/Authority concept;
- no compatibility alias exists;
- no translation machinery exists;
- all current Agent routes resolve.

---

# RS-2 — Repository Scripts & Gate Control Plane

## Objective

Turn repository verification from a growing shell chain into a small explicit gate graph while preserving independently runnable leaf commands.

## Target scripts layout

```text
scripts/
├── README.md
├── gates/
│   └── run.mjs
├── verify/
│   ├── documentation.mjs
│   ├── repository.mjs
│   ├── current-tree-hygiene.mjs
│   ├── dependencies.mjs
│   ├── boundaries.mjs
│   └── toolchain.mjs
└── maintenance/
    └── clean.mjs
```

Do not create other directories until a real script exists.

## 2.1 Gate scheduler belongs in repo-kit

### Create

- `tools/repo-kit/src/gates.mjs`
- `tools/repo-kit/test/gates.test.mjs`

### Export

```js
defineGate(spec)
validateGateGraph(gates)
runGateGraph({ gates, concurrency, cwd, onResult })
```

### Gate shape

```js
{
  id: string,
  label: string,
  command: string,
  args: string[],
  needs?: string[],       // dependency must PASS
  after?: string[],       // dependency must settle
  env?: Record<string, string>,
  allowFailure?: boolean
}
```

### Required graph validation

Reject:

- duplicate IDs;
- missing referenced dependencies;
- self-dependency;
- dependency cycles;
- empty command;
- `needs` and `after` duplicate relationships;
- invalid concurrency `< 1`.

### Required scheduler semantics

- ready gates run concurrently up to the configured limit;
- a failed `needs` dependency causes dependent gate to be `skipped`;
- `after` waits for settlement but does not require PASS;
- non-allowed failure makes the aggregate fail;
- results contain duration, exit status, and captured stdout/stderr;
- output order is deterministic in final summary even when execution is parallel.

## 2.2 Thin aggregate entrypoint

Create `scripts/gates/run.mjs`.

Supported modes:

```text
static
repository
verify
```

### `static`

```text
documentation
repository
hygiene
dependencies
boundaries
toolchain
format:check
lint
typecheck
tsc6
```

### `repository`

```text
documentation
repository
hygiene
dependencies
boundaries
toolchain
unused/dead-surface (after RS-3 adds it)
```

### `verify`

```text
all static gates
test
build
```

`verify` must preserve current semantics: it is locally runnable and exhaustive enough for a completion claim. Developers/agents should run focused leaf gates during edits.

## 2.3 Simplify root `package.json`

Replace the long `&&` aggregate with:

```json
"verify": "node scripts/gates/run.mjs verify",
"check:static": "node scripts/gates/run.mjs static",
"check:repo": "node scripts/gates/run.mjs repository"
```

Keep leaf scripts such as:

```json
"check:documentation": "node scripts/verify/documentation.mjs",
"check:repository": "node scripts/verify/repository.mjs",
"check:hygiene": "node scripts/verify/current-tree-hygiene.mjs",
"check:dependencies": "node scripts/verify/dependencies.mjs",
"check:boundaries": "node scripts/verify/boundaries.mjs",
"toolchain:check": "node scripts/verify/toolchain.mjs"
```

`check:repo` is the repository aggregate. `check:repository` remains the single repository-correctness leaf gate; do not overload one public script name with both meanings.

Do not hide leaf behavior behind an aggregate-only interface.

## 2.4 Clean command

Create:

- `scripts/maintenance/clean.mjs`
- `tools/repo-kit/src/clean.mjs`
- `tools/repo-kit/test/clean.test.mjs`

### Rules

The cleaner derives candidate build outputs from current project/workspace configuration, not a manually duplicated package list.

Known removable residue may include only currently established generated/build directories such as:

```text
dist/
coverage/
.nx/ local cache where appropriate
package-local tsbuildinfo/build output declared by project config
```

The actual implementation must discover package/workspace outputs from checked-in config.

Safety requirements:

1. target resolves inside repository;
2. symlink ancestors cannot escape repository;
3. missing output is normal;
4. manifest-less orphan package directory may be removed only when every remaining entry is known generated residue;
5. unknown files abort the whole destructive plan before any deletion begins;
6. `--dry-run` prints targets and performs no mutation.

Public commands:

```bash
pnpm clean
pnpm clean -- --dry-run
```

## 2.5 Scripts README

Rewrite `scripts/README.md` to define:

```text
verify/      permanent leaf gates
gates/       aggregate orchestration only
maintenance/ safe repository mutation/cleanup commands
repo-kit     reusable implementation, tests, process mechanics
```

Also state:

- phase-specific acceptance scripts are not archives;
- release/generate/i18n directories appear only with actual current work;
- scripts contain repository control-plane behavior, never product runtime logic.

## RS-2 acceptance

```bash
pnpm nx run repo-kit:test
pnpm check:static
pnpm check:repo
pnpm verify
pnpm clean -- --dry-run
```

Add scheduler tests for:
- parallel independent gates;
- dependency ordering;
- failure skip;
- `after` behavior;
- cycle rejection;
- deterministic summary.

---

# RS-3 — Package/Test Plane & Architecture-Boundary Reset

## Objective

Make workspace topology mechanically legible without prematurely forcing physical package families; separate product source from package tests; migrate generic dependency enforcement away from the custom path-string scanner.

## 3.1 Adopt Nx ESLint boundary support

### Dependency decision

Add `@nx/eslint-plugin` at the **exact same version as the current Nx line**.

At the current repository baseline:

```text
nx = 23.1.1
@nx/eslint-plugin = 23.1.1
```

If Nx is intentionally refreshed before this task executes, refresh both together according to the existing toolchain policy.

Update:
- `pnpm-workspace.yaml` catalog
- root `package.json`
- lockfile

Do not add a second architecture-lint framework.

## 3.2 Add small semantic tags

Use Nx project tags, not a new Heptalogos-specific topology JSON.

Initial tag taxonomy:

```text
kind:product
kind:tooling

area:shared
area:bootstrap
area:data
area:execution
area:service
area:runtime
area:repository
```

Package assignment:

```text
foundation-contracts -> kind:product, area:shared
schema-runtime       -> kind:product, area:shared

bootstrap-state      -> kind:product, area:bootstrap
private-postgres     -> kind:product, area:bootstrap
host-ownership       -> kind:product, area:bootstrap
bootstrap-runtime    -> kind:product, area:bootstrap

canonical-schema     -> kind:product, area:data
persistence          -> kind:product, area:data

time-service         -> kind:product, area:execution
execution-lineage    -> kind:product, area:execution
evidence             -> kind:product, area:execution

signal               -> kind:product, area:service
work-queue           -> kind:product, area:service

runtime-substrate    -> kind:product, area:runtime
runtime-kernel       -> kind:product, area:runtime

repo-kit             -> kind:tooling, area:repository
```

Put tags in existing Nx project configuration (`project.json` or supported package-level Nx configuration). Do not create one additional metadata file merely for tags.

## 3.3 Enforce only proven dependency directions

The first boundary rule set must be conservative and match current architecture, not invent a rigid theoretical total order.

Required invariants:

1. `kind:product` may not import `kind:tooling`.
2. `kind:tooling` must not become a production/runtime dependency of product packages.
3. `area:shared` must not depend on bootstrap/data/execution/service/runtime.
4. `area:bootstrap` must not depend on execution/service/runtime composition.
5. `area:data` must not depend on service/runtime.
6. `area:execution` must not depend on service/runtime.
7. `area:service` must not depend on runtime implementation packages unless an explicit architecture contract later authorizes it.
8. `runtime-substrate` remains below `runtime-kernel`; the inverse dependency is forbidden.

Before enabling the rule as blocking:
- generate/inspect current Nx dependency graph;
- any existing violation must be classified as either:
  - real architecture bug → fix now; or
  - rule model is wrong → correct the rule;
- do not create an exception list for a rule known to be false.

## 3.4 Shrink custom `boundaries.mjs`

Current `scripts/verify/boundaries.mjs` contains generic path allowlists for libraries such as Ajv, TypeBox, Cordis, graphlib, pg, Kysely, and package subpaths.

Refactor responsibilities:

### Move to Nx/ESLint when expressible

- workspace-to-workspace dependency direction;
- normal restricted import ownership;
- product → tooling prohibition;
- broad external package import restrictions.

### Keep custom only when Heptalogos semantic inspection is required

Examples that may remain:

- a package root must not expose raw pg/Kysely mechanics;
- a specific restricted Foundation subpath must not leak through the public root;
- bootstrap/recovery raw Authority primitives must not be exported publicly;
- framework object vocabulary must not appear in a stable public contract when simple static lint cannot express the semantic surface.

Each remaining custom check must have:
- a stable finding code;
- a fixture/test proving rejection;
- a comment naming the Heptalogos invariant, not the milestone that introduced it.

## 3.5 Move tests out of `src/`

Adopt package-local test plane:

```text
packages/<pkg>/
├── src/
├── test/
│   ├── unit/
│   ├── integration/
│   └── support/       # only when package-specific support exists
├── README.md
├── package.json
├── project.json
├── tsconfig.json
└── tsconfig.build.json
```

Do **not** force empty `unit/`, `integration/`, or `support/` directories.

Migration rules:

```text
src/foo.test.ts
→ test/unit/foo.test.ts

src/foo.integration.test.ts
→ test/integration/foo.integration.test.ts

src/test-support/**
→ test/support/** if used only by tests
```

If a helper is consumed by production/integration composition outside tests, it is not test support and must remain under an appropriate product/tooling owner.

Update:
- relative imports in moved tests;
- Vitest discovery;
- TypeScript project includes;
- ESLint coverage;
- Nx target inputs as required;
- build configs so production build consumes only `src/`.

No compatibility copies remain under `src/`.

## 3.6 Package documentation invariant

Continue current policy:
- one substantive `README.md` per package;
- no package-local `AGENTS.md`.

Modify `tools/repo-kit/src/package-docs.mjs` so workspace discovery rather than a manual list is the source of truth for:
- package README requirement;
- package index completeness;
- forbidden child AGENTS.

## RS-3 acceptance

```bash
pnpm lint
pnpm typecheck
pnpm tsc6
pnpm test
pnpm build
pnpm check:boundaries
pnpm check:repository
```

Permanent acceptance is owned by `check:repository`: it must reject any tracked `packages/*/src/**/*.test.ts` or `packages/*/src/**/*.integration.test.ts` after the migration. Do not rely on a POSIX-only ad hoc shell command as the repository contract.

---

# RS-4 — Dead-Code / Dead-Surface Governance

## Objective

Add a mature mechanical unused-code/dependency detector and combine it with a semantic “current owner/current consumer” audit.

## 4.1 Adopt Knip

Current audited stable baseline on 2026-08-27: `knip 6.32.2`.

Execution rule:
- refresh registry/upstream evidence immediately before editing the catalog;
- use the latest stable version compatible with the current Node/pnpm/TypeScript/Nx baseline and `minimumReleaseAge`;
- if the refreshed stable version is blocked only by `minimumReleaseAge`, do not bypass that policy merely for speed;
- if 6.32.2 remains the eligible current stable, pin it exactly.

Add:
- `knip` to root repository tooling dependencies;
- exact catalog entry;
- lockfile update.

## 4.2 Minimal `knip.json`

Create root `knip.json`.

Start from real repository entrypoints, not a large ignore list.

Required coverage:

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "workspaces": {
    ".": {
      "entry": [
        "scripts/**/*.mjs",
        ".agents/**/*.mjs"
      ],
      "project": [
        "scripts/**/*.mjs",
        ".agents/**/*.mjs"
      ]
    },
    "packages/*": {
      "project": [
        "src/**/*.ts",
        "test/**/*.ts"
      ]
    },
    "tools/*": {
      "project": [
        "src/**/*.mjs",
        "test/**/*.mjs"
      ]
    }
  }
}
```

Allow Knip’s package manifest/export/Vitest/Nx/workspace discovery to infer normal entrypoints where supported.

Do not add a broad ignore until a finding has been investigated.

## 4.3 New command/gate

Add:

```json
"check:unused": "knip"
```

Add the leaf to repository/static verification after the repository is clean.

## 4.4 Cleanup order

Follow this exact order because findings cascade:

1. unused files;
2. unused dependencies / unlisted dependencies;
3. unused exports/types;
4. duplicate/obsolete test support revealed by removal;
5. unnecessary ignore/config entries.

For each finding:

```text
production consumer?
  yes -> keep/fix entry detection
  no
    current contract requires it?
      yes -> keep only with concrete current contract
      no -> delete
```

Do not preserve an unused export because:
- a completed plan mentions it;
- a test imports it solely to keep it alive;
- it “might be useful later”;
- it resembles a future architecture concept.

## 4.5 Semantic simplification audit

Knip is not enough. Perform repository searches and call-site reads for:

```text
legacy
compat
fallback
deprecated
migration
upcast
downcast
alias
old
previous
v1
v2
temporary
TODO
FIXME
XXX
```

Do not mechanically delete every lexical match. Classify each production occurrence:

```text
CURRENT_EXTERNAL_CONTRACT
CURRENT_INTERNAL_REQUIREMENT
DEVELOPMENT_HISTORY_COMPATIBILITY
SPECULATIVE_FUTURE
DEAD
```

Rules:
- `DEVELOPMENT_HISTORY_COMPATIBILITY` → delete unless declared in compatibility obligations.
- `SPECULATIVE_FUTURE` → delete or defer to docs; no dormant implementation.
- `DEAD` → delete.
- `CURRENT_EXTERNAL_CONTRACT` / `CURRENT_INTERNAL_REQUIREMENT` → retain with current owner and tests.

Audit especially:
- state machines;
- public options;
- defensive copies;
- alternate parsers;
- schema-version branches;
- fallback readers;
- bridge migrations;
- aliases;
- public methods with one internal caller.

## 4.6 Remove `.codegraph/` tracked placeholder

Current `.codegraph/` contains only a tracked `.gitignore`, and no current executable consumer was found in the repository audit.

Therefore:
- delete `.codegraph/.gitignore`;
- allow the empty directory to disappear;
- retain `.codegraph/**` in a root ignore file only if the external development tool actually generates local data there and the ignore remains useful;
- do not keep a tracked empty directory as architecture.

## RS-4 acceptance

```bash
pnpm check:unused
pnpm check:hygiene
pnpm check:dependencies
pnpm check:boundaries
pnpm test
pnpm build
```

Knip acceptance:
- unused files: 0
- unused direct dependencies: 0
- unlisted dependencies: 0
- unused internal exports: 0, except a narrowly justified configuration entry that is verified to be a real external entrypoint

No “ignore graveyard” is acceptable.

---

# RS-5 — Generated Navigation, Current-Tree Hygiene & Knowledge Coupling

## Objective

Ensure repository topology stays correct automatically after the reset instead of decaying back into hand-maintained lists.

## 5.1 Package index generation/check

Current `packages/INDEX.md` is useful for low-token navigation, but manual completeness should not be its Authority.

Create in `repo-kit`:

```js
collectPackageIndex({ root })
renderPackageIndex(model)
validatePackageIndex({ root, text })
```

Source of truth:
- pnpm-discovered workspaces under `packages/*`;
- package README;
- Nx tags;
- package manifest name.

`packages/INDEX.md` remains checked in for fast human/Agent navigation, but `check:repository` must fail when:
- a workspace package is missing;
- a listed package does not exist;
- one package appears twice;
- package link does not point to that package’s README;
- semantic tag shown in the index does not match Nx metadata.

Do not manually maintain a separate package registry JSON.

## 5.2 Root topology validator

Extend `repository.mjs`/repo-kit with current-root responsibilities.

Final reviewed long-lived responsibility roots for this reset:

```text
.agents
.github
docs
packages
scripts
tests
tools
```

Known ordinary root configuration/manifests remain allowed.

Before enabling the rule:
- move `fixtures/ts6-api-lane.ts` to `tests/toolchain/ts6-api-lane.ts`;
- update `tsconfig.ts6.json`;
- update `eslint.config.mjs` or other exact references;
- prove `pnpm tsc6` still exercises the same compatibility claim.

The validator must reject newly introduced broad responsibility roots unless the change explicitly updates the repository topology contract.

Do **not** block legitimate future `apps/`, `native/`, `vendor/`, etc. forever. The rule is:
- a new responsibility root requires a corresponding documented owner and repository topology update in the same change.

## 5.3 Hygiene scanner scope

Continue using the existing current-tree hygiene scanner as the semantic hygiene
mechanism for executable/current surfaces. Keep standing-document link and
current-home correctness in `check:documentation`, and root topology/machine
Authority ownership in `check:repository`. Extend hygiene itself to detect in
executable/current files:

- phase/milestone/PR/session provenance in stable identifiers;
- undeclared compatibility patterns;
- forbidden phase-tools directories;
- duplicate old/new path bridges.

Standing-document references to removed homes are checked by
`check:documentation`; do not make either gate scan completed historical plans as
though they were current product truth.

## 5.4 Machine Authority consumer tests

Add tests proving every retained machine Authority has at least one current consumer:

```text
docs/governance/compatibility-obligations.json
docs/dependencies/dependency-routing.json
docs/qualification/dependency-status.json
```

If a future change removes the final real consumer, the corresponding data file must be reconsidered rather than preserved automatically.

## 5.5 No translation gate

The documentation validator owns the current policy:

```text
translation work = disabled during development
```

It rejects accidental translation sidecars/mirrors introduced by copy/paste or an Agent.

Do not build translation-generation code.

## RS-5 acceptance

```bash
pnpm check:documentation
pnpm check:agents
pnpm check:repository
pnpm check:hygiene
pnpm check:unused
pnpm check:dependencies
pnpm check:boundaries
pnpm verify
```

---

# RS-6 — Repository Stabilization Closure

## Objective

Prove the repository reset itself is complete and remove the stabilization scaffolding before H3A-2 resumes.

## 6.1 Current-tree audit

Run a final review across:

```text
source
tests
test support
scripts
repo-kit
configuration
Agent resources
current docs
active plan
roadmap
manual CI workflow
```

Explicitly inspect for:
- development provenance;
- legacy/compatibility code;
- dead code/dependencies/exports;
- duplicate Authority;
- obsolete old paths;
- copied DeepSeek-specific concepts without a Heptalogos owner;
- empty speculative directories;
- translation scaffolding;
- stage-specific stabilization script residue.

## 6.2 Full local verification

Run:

```bash
pnpm install --frozen-lockfile
pnpm clean
pnpm verify
```

Then rerun from a clean checkout/worktree:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Claims:
- clean checkout succeeds;
- build output is not required by static gates unless a gate explicitly declares it;
- source tests and artifact/build verification are not accidentally mixed.

## 6.3 Cross-platform scope

This reset changes repository tooling, file paths, test layout, and script orchestration. Therefore run the existing manual cross-platform verification matrix after Independent Review.

Required:
- Ubuntu/Linux repository/tooling lanes;
- Windows repository/tooling lanes;
- macOS repository/tooling lanes if the existing final CI matrix provides them.

Do not reinterpret this as product qualification for macOS PostgreSQL/source-less/service claims.

## 6.4 Independent Review

The review must explicitly assess:

1. no Architecture Corpus semantic Authority was lost during physical migration;
2. current docs have one home per fact;
3. machine Authorities are not duplicated manually;
4. no old-path compatibility remains;
5. scripts are grouped by responsibility and repo-kit does not become product runtime;
6. gate graph semantics are correct;
7. Nx/ESLint rules replace generic custom scans rather than duplicate them;
8. Knip cleanup did not remove real entrypoints;
9. test-plane migration did not change product behavior;
10. no translation implementation entered scope;
11. H3A-2 remained untouched.

## 6.5 Final manual CI and merge

After Independent Review PASS:
- dispatch final manual CI;
- mutate nothing after PASS;
- merge according to current closure governance.

## 6.6 Post-merge reconciliation

Update living roadmap/current plan state so it says, in current-state language:

```yaml
REPOSITORY_STABILIZATION: CLOSED
H3A_1: CLOSED
H3A_2: ELIGIBLE_FOR_DEPENDENCY_REFRESH
```

Do not mark H3A-2 implementation started.

Move this stabilization plan from active to completed only after merge/reconciliation.

Delete any stabilization-only executable helper that has no permanent repository use.

---

# 7. H3A-2 Resume Gate

H3A-2 may begin only when all of the following are true:

```text
[x] H3A-1 governance recovery is closed.
[x] former physical Corpus root no longer exists.
[x] all current Authority routes resolve under docs/.
[x] documentation gate passes.
[x] repository gate graph is active.
[x] package tests are outside src/.
[x] Nx/ESLint generic boundaries are active.
[x] custom boundary scanner is reduced to Heptalogos-specific semantics.
[x] Knip is clean.
[x] current-tree hygiene is clean.
[ ] stabilization Independent Review PASS.
[ ] final manual CI PASS.
[ ] stabilization merge/reconciliation complete.
```

Then, and only then:

1. refresh the exact DBOS stable version from current registry/upstream evidence;
2. respect `minimumReleaseAge`;
3. update the dependency catalog/lockfile;
4. revalidate DBOS API/engine assumptions in the H3A plan;
5. if the refreshed DBOS line materially changes the planned integration, update the H3A-2 plan before code;
6. start H3A-2.

---

# 8. Explicit Non-Goals

Do **not** introduce during this plan:

```text
documentation translation
VitePress / docs website
bilingual pairing
package-local AGENTS
organization-scale issue/project management
stacked-PR framework
release automation
npm publishing
vendor source management without an actual vendored dependency
native/ or python/ roots without a current implementation
experimental/ root without a real experiment
jscpd duplication gate
100%-per-file coverage mandate
new product capability
DBOS runtime implementation
H3B EffectOperation implementation
H4 configuration implementation
presentation/UI implementation
```

---

# 9. Commit / Review Decomposition

Use independent reviewable commits/change sets. Recommended decomposition:

```text
P0     adopt v2 plan + root responsibility inventory

RS-1A  establish docs authority taxonomy + docs/AGENTS
RS-1B  migrate Architecture Corpus documents
RS-1C  migrate Agent routes + documentation validator
RS-1D  remove old Corpus root and obsolete projection JSON

RS-2A  gate runner core + tests
RS-2B  root aggregate migration
RS-2C  safe cleaner + tests

RS-3A  Nx ESLint plugin + semantic tags
RS-3B  migrate generic boundary enforcement
RS-3C  package test-plane migration
RS-3D  reduce custom semantic boundary gate

RS-4A  Knip adoption/configuration
RS-4B  mechanical dead-surface deletion
RS-4C  semantic compatibility/speculation audit

RS-5A  generated/validated package navigation
RS-5B  root topology + machine Authority consumer checks
RS-5C  final hygiene hardening

RS-6    stabilization closure candidate
```

Do not mechanically force one Git commit per line if two adjacent changes cannot pass independently. The rule is: every commit presented for review should be coherent and should not intentionally leave the repository red.

---

# 10. Failure / Stop Conditions

Stop and report `PLAN_GAP` if implementation would require any of these:

- changing Subject/Authority/product semantics merely to fit new docs paths;
- introducing a new package family whose semantics are not covered here;
- adding a second dependency-analysis framework beyond Nx/ESLint/Knip;
- preserving an old repository path for compatibility;
- deciding a new product compatibility obligation;
- adding translation work;
- moving a product package to a new semantic family because current dependencies contradict the planned tag model and the correct architecture cannot be inferred from existing Authority;
- changing H3A-1 product behavior during governance recovery;
- implementing H3A-2/DBOS early;
- removing a machine-readable file that still has an unexplained current executable consumer;
- deleting a file identified by Knip when investigation proves it is a real dynamic/external entrypoint;
- destructive cleanup cannot prove a target is repository-owned generated residue;
- Independent Review or final CI evidence cannot actually be produced.

---

# 11. Definition of Done

Repository stabilization is complete only when the repository satisfies all of these simultaneously:

### Topology

```text
[x] no former physical Corpus root
[x] docs/ is the complete knowledge system
[x] scripts/ has responsibility-based structure
[x] tools/repo-kit owns reusable repo mechanics only
[x] packages remain clean product workspaces
[x] no speculative empty top-level roots
```

### Documentation Authority

```text
[x] Architecture Corpus is logical, not physical
[x] one home per current fact
[x] current docs contain no development-stage provenance
[x] completed plans remain historical
[x] machine Authority files are minimal and consumed
[x] no duplicated constitution/config/storage JSON projection remains
[x] no translation files or translation tooling
```

### Code / package hygiene

```text
[x] package tests are not under src/
[x] product packages cannot depend on repo tooling
[x] Nx/ESLint handles generic module boundaries
[x] custom gate handles only project-specific semantics
[x] Knip clean
[x] no undeclared legacy/compatibility paths
[x] no speculative production abstraction retained without current owner/consumer
```

### Repository control plane

```text
[x] leaf gates remain directly runnable
[x] aggregate gate graph is validated and tested
[x] pnpm verify no longer relies on one long && chain
[x] clean is derived and fail-closed
[x] package navigation completeness is mechanically checked
[x] documentation, repository, and current-tree hygiene gates collectively cover old-path/provenance/compatibility residue
```

### Governance

```text
[x] separate H3A-1 premature-merge recovery was already closed before this plan began
[x] this plan performed no H3A-1 revert/re-land transport
[ ] stabilization Independent Review PASS
[ ] final manual CI PASS
[ ] stabilization merged
[ ] roadmap reconciled
[ ] H3A-2 only becomes eligible after repository closure
```

---

# 12. Research Patterns Adopted / Rejected

This section records the architectural intent so implementers do not copy reference projects mechanically.

## Adopt from DeepSeek Harness

```text
- repository layout as responsibility map
- semantic package families as an eventual scaling mechanism
- ordinary package internals stay simple
- product/support/experimental lifecycle should be physically legible when those categories actually exist
- source plane and artifact plane are explicit
- tests outside product src
- every mechanically checkable governance promise should have a gate
- gate orchestration is code, not a shell chain
- workspace/package checks discover the current tree rather than depend on stale manual package lists
- clean derives outputs and fails closed
- maintained dependencies replace hand-written generic mechanics when they delete owned code
- dead/speculative/compatibility surfaces require current owner and current consumer
- one home per documentation fact
- architecture map and subsystem/contract reference are different document roles
- generated catalogs/reference should be freshness-checked
```

## Improve rather than copy

```text
DeepSeek Harness flat scripts/
→ Heptalogos responsibility-grouped scripts/

DeepSeek Harness large package family tree
→ Heptalogos keeps packages flat until family-level ownership is real

DeepSeek Harness bilingual docs/pairing
→ Heptalogos explicitly defers translation during development

DeepSeek Harness large organization/release processes
→ out of scope for current Heptalogos research/prototype repository
```

---

# 13. Executor First Read

Before touching files, executor reads in this order:

```text
0. completed/approved H3A-1 premature-merge recovery record and current resulting roadmap state
1. repository root AGENTS.md
2. packages/AGENTS.md
3. current docs/roadmap/development-roadmap.md
4. current H3A active plan
5. current Architecture Corpus README/INDEX + 00 + 20 + 25 + 26
6. scripts/README.md
7. tools/repo-kit/README.md
8. packages/README.md + packages/INDEX.md
9. .agents/heptalogos/README.md + corpus-routes.json
10. this plan
```

After RS-1, replace item 5 with the new `docs/` authoritative homes.

---

## External review disposition (2026-08-27)

The supplied external review returned `REQUEST_CHANGES`. Its IR-01 finding is
marked `WITHDRAWN / reviewer correction`: the operator-approved recovery model
is the non-destructive post-merge governance reconciliation already recorded in
`docs/plans/completed/foundation/h3a1-premature-merge-governance-recovery.md`.
The constraints that stopped v1 RS-0, prohibited revert/re-land, preserved the
merged H3A-1 baseline, and kept Independent Review/final manual CI as `NOT_RUN`
are the explicit recovery authorization. No new recovery branch or PR is
required, and the H3A-1 record must not be rewritten.

IR-02 through IR-08 are active corrective work in this candidate. IR-09 is
treated as candidate-transport and closure sequencing: after local corrections
and qualification, freeze the candidate and obtain a new external Independent
Review; final manual CI remains prohibited until that review returns `PASS`.

| Finding | Candidate disposition |
| --- | --- |
| IR-01 | `WITHDRAWN / reviewer correction`; the operator-approved non-destructive H3A-1 reconciliation remains current. |
| IR-02 | `IMPLEMENTED`; standing links are repository-contained and target existence is checked. |
| IR-03 | `IMPLEMENTED`; moved current-home references are rejected and the standing governance links are current. |
| IR-04 | `IMPLEMENTED`; generic import rules are owned by ESLint/Nx and the custom gate retains semantic checks. |
| IR-05 | `IMPLEMENTED`; repository/domain version Authorities are read instead of duplicated in verification. |
| IR-06 | `IMPLEMENTED`; product package consumers use one workspace-derived discovery operation. |
| IR-07 | `IMPLEMENTED`; documentation, repository, and hygiene gates have distinct declared coverage. |
| IR-08 | `IMPLEMENTED`; scheduler concurrency semantics use an injected deterministic barrier. |
| IR-09 | `SEQUENCING`; candidate transport and external review remain outside local code remediation. |

**Plan status:** `READY_FOR_ROUND3_EXTERNAL_REVIEW`

**Local execution state (2026-08-27):** H3A-1 recovery remains `CLOSED`;
P0 and RS-1 through RS-5 are locally complete, and IR-02 through IR-08 were
implemented on the prior stabilization candidate. Round 2 returned
`REQUEST_CHANGES`; R2-01 through R2-04 are now implemented on this corrected
candidate. Focused repo-kit/private-postgres tests and documentation,
repository, hygiene, dependency, boundary, and toolchain checks are `PASS`.
Two frozen-install/clean cycles completed, and both full `pnpm verify` runs
reported all 14 local gates `PASS` (agents, documentation, repository, hygiene,
dependencies, boundaries, unused, toolchain, format:check, lint, typecheck,
tsc6, test, and build). A qualified PostgreSQL runtime is not present on this
host, so affected real-PostgreSQL/L3 evidence remains `NOT_RUN` as recorded by
the qualification ledger. Cross-platform CI, stabilization Independent
Review, final manual CI, and merge/reconciliation remain `NOT_RUN`.
H3A-2 remains `BLOCKED_BY_REPOSITORY_STABILIZATION`.

**Execution ordering:** `separate H3A-1 recovery CLOSED → P0 → RS-1 → RS-2 → RS-3 → RS-4 → RS-5 → RS-6 → H3A-2 refresh`

**Primary principle:** this reset is successful only if the repository becomes simpler to reason about, harder to drift, and cheaper for future agents to navigate. New machinery that merely moves complexity from one hand-maintained file to another is not an improvement.

---

## External review disposition — Round 2 (2026-08-27)

The attached external Independent Review for Round 2 returned
`REQUEST_CHANGES`. It is out-of-band governance evidence, not a GitHub review
object, and it does not authorize final manual CI. The first-round IR-01
correction remains `WITHDRAWN`; H3A-1 non-destructive governance reconciliation
remains `CLOSED`. The candidate was returned to Draft before mutation.

Round 2 required only these four corrections:

| Finding | Disposition |
| --- | --- |
| R2-01 | `IMPLEMENTED`; root private package identity is current-semantic and repository-gated. |
| R2-02 | `IMPLEMENTED`; `docs/plans/README.md` and `docs/plans/active/**` are current documents, while only completed plans receive historical-path exemption. |
| R2-03 | `IMPLEMENTED`; Node projections and standing dependency records are checked against their owning Authorities, and package-local data-layout typing derives from its constant. |
| R2-04 | `IMPLEMENTED`; generic dependency/import analysis is delegated to Knip, ESLint/Nx, and dependency governance; the custom boundary gate retains Heptalogos-specific checks. |

The corrected candidate must complete focused tests, a frozen install/clean
cycle, and full local `pnpm verify` before it is frozen and returned to Ready
for a new external Independent Review. Final manual CI remains `NOT_RUN` until
that new review returns `PASS`; merge and post-merge reconciliation remain
outside the current candidate.
