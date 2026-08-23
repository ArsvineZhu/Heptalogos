# H2 Entry + H2A-1 Host-Fenced Persistence Authority Implementation Plan

**Repository plan state:** `ACTIVE`  
**H2 base SHA:** `54688d2bb0da2b8516a84634459495956bd96b8c`  
**Behavior branch:** `dev/h2a1-host-fenced-persistence-authority`

> **For agentic workers:** REQUIRED SUB-SKILL: execute this plan task-by-task with TDD. Use `superpowers:subagent-driven-development` where available, or `superpowers:executing-plans` for inline execution. Use a fresh review boundary for every task that changes Authority, credential, transaction, or PostgreSQL privilege semantics. Do not widen this plan into H2B RuntimeSubstrate, DBOS, Lineage/Evidence, Management, Subject, Messaging, AI, or Extension runtime work.

**Goal:** Reconcile the already-merged H1 closure truth, then establish the first normal-runtime persistence boundary in which every canonical mutation is admitted by the current Host, holds the database `HostOwnershipFence` for the transaction lifetime, verifies the current `HostOwnershipToken`, and commits through `pg` + Kysely without leaking framework objects into stable contracts.

**Architecture:** H1 remains the owner of machine/bootstrap/Host fencing. H2A-1 adds a separate least-privilege PostgreSQL runtime principal and a narrow `HostPersistenceAuthority` capability issued by the H1 handoff. A new `@heptalogos/persistence` package owns pool/Kysely mechanics. Read transactions are database-enforced read-only. Mutating transactions acquire the singleton fence row with `FOR SHARE`, verify `InstanceId + BootId + HostOwnershipToken`, re-check process-local Host activity while the row lock is held, then admit the operation. After that admission point, an already-entered transaction may finish even if the dedicated Host lease is lost; a newer owner cannot publish its token until the shared fence is released.

**Tech Stack:** Node.js 24.19.0; pnpm 11.22.0 with strict Catalog; Nx 23.1.1; TypeScript 7.0.2 primary; PostgreSQL 18 architecture line / current H1 qualification lane 18.6; `pg` 8.23.0; Kysely `0.29.5` as the plan-time stable registry baseline; Vitest 4.1.11. Kysely `0.30.x` prereleases are not part of this plan.

**Spec / authority basis:**

- `AGENTS.md`
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/02-架构原则与反NIH约束.md`
- `Architecture_Corpus/03-核心概念与Authority.md`
- `Architecture_Corpus/04-总体系统架构.md`
- `Architecture_Corpus/06-MicroSystem与Extension架构.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md`
- `Architecture_Corpus/specs/S13-Foundation-Service-Capability-Readiness-Catalog.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md`
- `Architecture_Corpus/16-验证与资格认定体系.md`
- `Architecture_Corpus/24-依赖使用与实现路由.md`
- `Architecture_Corpus/qualification/dependency-status.json`
- `Architecture_Corpus/references/dependency-routing.json`
- `Architecture_Corpus/qualification/results/qualification-status.json`
- `docs/roadmap/development-roadmap.md`
- `docs/engineering/playbooks/repository/h-stage-stabilization-closure.md`
- Current merged H1 state on `master`.

**Planning baseline:**

```text
master at plan creation:
82541933bc2b5e6add0eeee711b4f36350f5d5ff

H1 reviewed pair:
base = 257ad6fe73924bcd1c9a00cad6a15938d6e6a2da
head = 80440e89918f3141c087fff65118754bb07e09ca

H1 final manual CI:
run = 32643262593
head_sha = 80440e89918f3141c087fff65118754bb07e09ca
conclusion = success

H1 squash merge:
82541933bc2b5e6add0eeee711b4f36350f5d5ff
```

**Intended repository path after the H1 truth-reconciliation PR merges:**

`docs/plans/active/foundation/h2a1-host-fenced-persistence-authority.md`

---

# 0. Global constraints

These constraints apply to every task.

1. **The merged H1 candidate is immutable as closure evidence.** Task 0 is docs/evidence-only and must not change production code, tests, behavior contracts, workflow logic, or the merged H1 candidate. H2A-1 may later extend the H1→H2 seam in a new behavior branch, but existing H1 ownership/recovery semantics must remain regression-PASS.
2. **H2 behavior work is blocked until H1 repository truth says `H1: CLOSED / H2: ELIGIBLE` on merged `master`.** Do not create the H2A-1 behavior branch from `82541933...` while the reconciliation PR is still open.
3. **Normal runtime PostgreSQL identity is distinct from both existing H1 roles.** Do not reuse `heptalogos_bootstrap`, `heptalogos_owner`, or `heptalogos_host_lease` as the normal application pool principal.
4. **`heptalogos_owner` remains `NOLOGIN`; `heptalogos_host_lease` remains the dedicated connection-limit-1 advisory-lease principal.** H2A-1 introduces `heptalogos_runtime` as a separate least-privilege login role.
5. **The runtime principal never owns the product schema and cannot publish/revoke the Host token.** It receives only `CONNECT`, product-schema `USAGE`, fence `SELECT`, and later per-table DML granted by migration/schema authority. H2A-1 does not install default DML grants for future product tables.
6. **No raw framework leakage.** Stable package-root contracts must not expose `pg.Client`, `pg.Pool`, Kysely, Kysely `Transaction`, dialect objects, raw SQL builders, or driver error types.
7. **Kysely is already ADOPTED.** H2A-1 does not compare Prisma/Drizzle/TypeORM or create a temporary raw-`pg` repository layer. Kysely is used behind the persistence mechanics boundary from the first implementation.
8. **Kysely exact version is evidence-pinned.** Plan-time evidence is stable `0.29.5`. Before changing the Catalog, run `pnpm view kysely version engines peerDependencies dependencies --json`. If the stable version is no longer `0.29.5`, stop and amend this plan rather than silently selecting a different exact release. Do not switch to `0.30.x` beta/RC under this plan.
9. **Mutation fencing uses the row lock, not process memory alone.** Each normal mutating transaction must hold the singleton `HostOwnershipFence` row with `FOR SHARE` until commit/rollback.
10. **Do not use `FOR KEY SHARE`.** It is too weak because PostgreSQL permits non-key `UPDATE` to coexist with it. `FOR SHARE` is required because it conflicts with `FOR NO KEY UPDATE`/`FOR UPDATE` while allowing other `FOR SHARE` holders.
11. **Mutation admission linearization is explicit.** A mutating transaction is admitted only after: process-local `assertActive()` → transaction begin → fence `FOR SHARE` → exact fence identity/token verification → second `assertActive()` while still holding the row lock. Lease loss after that point does not retroactively invalidate the already-entered transaction; the new owner waits to publish a new token until that transaction exits.
12. **Reads do not take the Host write fence.** New reads still require an active Host at admission, but use PostgreSQL `SET TRANSACTION READ ONLY` and do not block token publication merely to read.
13. **COMMIT ambiguity is explicit.** If the operation callback completed and the transaction wrapper subsequently fails before a successful completion is observed, return `persistence.transaction.commit_uncertain`; do not claim rollback and do not automatically retry.
14. **Behavior-affecting database/pool budgets have no hidden product defaults in H2A-1.** The persistence factory receives explicit resource/timing options. They are `RESOURCE_CONFIG` inputs whose eventual ConfigurationService projection belongs to later H2A work.
15. **No transaction spans LLM/network/human/durable waits.** H2A-1 must not add any such call inside a persistence transaction test or implementation.
16. **One OS is not three OSes.** Real PostgreSQL evidence is recorded only for the host(s) actually run. Final repository CI is not a substitute for real private-PostgreSQL product qualification on each platform.
17. **No H2B work.** Do not add Cordis, graphlib, MicroSystemSupervisor, RuntimeReconciler, ServiceRegistry, CapabilityRegistry, Readiness, or OperatingMode code.
18. **No H3 work.** Do not add DBOS, WorkQueue, SignalService, EffectOperation, or durable workflow tables.
19. **No speculative generic repository ABI.** H2A-1 may expose an opaque `PersistenceTransactionContext`, but Kysely transaction access remains package-internal until a real Foundation repository consumer exists. Do not invent a custom SQL/query DSL to hide Kysely.
20. **Plan execution follows repository governance.** Behavior work is branch → Draft PR → complete candidate → independent review → manual exact-pair final CI → squash merge. Ordinary pushes do not dispatch CI.

---

# 1. Fixed design decisions for H2A-1

## 1.1 PostgreSQL role topology

After H2A-1 provisioning, the relevant role model is:

```text
heptalogos_bootstrap
  bootstrap/private-PG superuser credential
  bootstrap-only

heptalogos_owner
  NOLOGIN
  owns canonical database/schema/objects
  never used by application pool

heptalogos_host_lease
  LOGIN
  CONNECTION LIMIT 1
  dedicated advisory lease session
  SELECT + UPDATE HostOwnershipFence
  not an application pool

heptalogos_runtime
  LOGIN
  NOSUPERUSER / NOCREATEDB / NOCREATEROLE / NOREPLICATION / NOBYPASSRLS / NOINHERIT
  CONNECTION LIMIT -1 at role level; pool limits are H2 resource configuration
  CONNECT canonical database
  USAGE product schema
  SELECT HostOwnershipFence
  no UPDATE on HostOwnershipFence
  no schema ownership / CREATE
  no role membership / SET ROLE escalation
  product-table DML only when explicitly granted by schema/migration authority
```

Names, ownership split, fence privilege split and `NOINHERIT` are `PRODUCT_INVARIANT` for this implementation stage. Pool-size/timeouts are `RESOURCE_CONFIG`.

## 1.2 Credential topology

`BootstrapKeyProvider` remains the pre-normal-runtime credential source and gains a third distinct purpose:

```text
private-postgres-bootstrap-superuser
private-postgres-host-lease-role
private-postgres-runtime-role
```

`@heptalogos/persistence` never receives the whole `BootstrapKeyProvider`. The H1 handoff issues a narrower `HostPersistenceAuthority` that can materialize only the runtime-role password for a connection attempt.

`pg.Pool` must use its dynamic password callback. The pool configuration must not store a long-lived static password string created by H2 code. A transient JavaScript string necessarily exists while `pg` authenticates; it must not be logged, persisted, added to Problems, or copied into long-lived H2 state.

## 1.3 Stable H1→H2 capability

Add this Heptalogos-owned contract to `@heptalogos/host-ownership`:

```ts
export interface HostRuntimeDatabaseTarget {
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: typeof HOST_OWNERSHIP_CANONICAL_DATABASE;
  readonly user: typeof HOST_RUNTIME_ROLE;
}

export interface HostPersistenceAuthority {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly token: HostOwnershipToken;
  readonly target: HostRuntimeDatabaseTarget;
  readonly signal: AbortSignal;
  assertActive(): void;
  withRuntimeDatabasePassword<T>(
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
}
```

`BootstrapManagedHostContext` exposes:

```ts
readonly persistence: HostPersistenceAuthority;
```

The capability is issued by `bootstrap-runtime`; `host-ownership` only owns the structural contract and constants. Its `assertActive()` must share the same terminal/fenced state as the managed Host, so `markManagedHostTerminal()` immediately rejects new persistence admission even if the raw lease close is still settling.

## 1.4 Persistence public root

The initial package-root contract is intentionally narrow:

```ts
export type PersistenceTransactionMode = "READ" | "MUTATION";

export interface PersistenceTransactionContext {
  readonly mode: PersistenceTransactionMode;
}

export interface PersistenceRuntimeOptions {
  readonly maxConnections: number;
  readonly idleTimeoutMs: number;
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly lockTimeoutMs: number;
  readonly idleInTransactionSessionTimeoutMs: number;
  readonly onBackgroundError: (error: unknown) => void;
}

export type PersistenceServiceState = "OPEN" | "FENCED" | "CLOSING" | "CLOSED";

export interface PersistenceService {
  readonly state: PersistenceServiceState;
  read<T>(
    operation: (context: PersistenceTransactionContext) => Promise<T>,
  ): Promise<T>;
  mutate<T>(
    operation: (context: PersistenceTransactionContext) => Promise<T>,
  ): Promise<T>;
  close(): Promise<void>;
}

export function createPersistenceService(
  authority: HostPersistenceAuthority,
  options: PersistenceRuntimeOptions,
): PersistenceService;
```

`PersistenceTransactionContext` is an issued/opaque token. H2A-1 does **not** export a package subpath that reveals Kysely. Internal tests/repositories in this package can resolve the token to the current Kysely transaction through a private `WeakMap`. A later H2A task may define an implementation-only repository adapter boundary when the first real repository exists.

## 1.5 Required Problem identities

At minimum, H2A-1 owns these stable machine failures:

```text
persistence.service.closed
persistence.service.fenced
persistence.host_fence.incompatible
persistence.host_fence.stale_owner
persistence.transaction.commit_uncertain
persistence.transaction.failed
```

Rules:

- propagate an operation-thrown `ProblemError` unchanged;
- do not expose raw `pg`/Kysely error objects through the stable service boundary;
- `stale_owner` and `service.fenced` are not automatically retried in the same Host;
- `commit_uncertain` uses `retryClass = manual` and requires authoritative re-read/reconciliation before any caller decides to repeat work;
- Problem metadata contains no password, SQL text, connection string, or secret material.

---

# 2. Repository file map

## Phase A — H1 post-merge truth reconciliation only

**Modify:**

- `docs/plans/completed/foundation/h1s-control-record.md`
- `docs/plans/README.md`
- `docs/roadmap/development-roadmap.md`
- `Architecture_Corpus/qualification/results/qualification-status.json`

**Do not modify:**

- `packages/**`
- tests
- `.github/workflows/**`
- H1 behavior/spec semantics

The H1 spec may retain historical/procedural text such as “Before H1-S final closure”. Do not mechanically replace every occurrence of `H1: OPEN` inside historical examples. Reconcile **current truth**, not history.

## Phase B — H2A-1 behavior branch

**Create:**

- `docs/plans/active/foundation/h2a1-host-fenced-persistence-authority.md`
- `packages/persistence/package.json`
- `packages/persistence/project.json`
- `packages/persistence/tsconfig.json`
- `packages/persistence/tsconfig.build.json`
- `packages/persistence/src/contracts.ts`
- `packages/persistence/src/problems.ts`
- `packages/persistence/src/transaction-context.ts`
- `packages/persistence/src/pg-pool.ts`
- `packages/persistence/src/kysely-adapter.ts`
- `packages/persistence/src/persistence-service.ts`
- `packages/persistence/src/index.ts`
- `packages/persistence/src/persistence-service.test.ts`
- `packages/persistence/src/persistence.integration.test.ts`

**Modify:**

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `packages/bootstrap-runtime/src/bootstrap-key-provider.ts`
- `packages/bootstrap-runtime/src/managed-host.ts`
- `packages/bootstrap-runtime/src/host-ownership-handoff.ts`
- `packages/bootstrap-runtime/src/index.ts`
- all bootstrap-runtime tests/fakes implementing `BootstrapKeyProvider`
- `packages/host-ownership/src/contracts.ts`
- `packages/host-ownership/src/bootstrap-admin.ts`
- `packages/host-ownership/src/ownership-schema.ts`
- `packages/host-ownership/src/index.ts`
- `packages/host-ownership/src/bootstrap-admin.test.ts`
- `packages/host-ownership/src/host-ownership.integration.test.ts`
- `packages/host-ownership/project.json` only if its existing integration target needs an added focused file; otherwise keep target topology unchanged
- `scripts/verify/boundaries.mjs`
- `Architecture_Corpus/qualification/results/qualification-status.json`
- `docs/roadmap/development-roadmap.md`
- `docs/plans/README.md`

**Move before candidate freeze:**

- `docs/plans/active/foundation/h2a1-host-fenced-persistence-authority.md`
  → `docs/plans/completed/foundation/h2a1-host-fenced-persistence-authority.md`

---

# 3. Task sequence

## Task 0: Reconcile H1 post-merge truth in a separate docs/evidence-only PR

**Purpose:** Satisfy the existing H-stage closure rule before any H2 behavior branch exists.

**Files:** Phase A files only.

### Interfaces / evidence

**Consumes:** externally observed H1 closure evidence:

```text
review pair:
(257ad6fe73924bcd1c9a00cad6a15938d6e6a2da,
 80440e89918f3141c087fff65118754bb07e09ca)

independent review = PASS
final CI run = 32643262593
final CI head_sha = 80440e89918f3141c087fff65118754bb07e09ca
final CI conclusion = success
squash merge = 82541933bc2b5e6add0eeee711b4f36350f5d5ff
```

**Produces:** current repository truth:

```yaml
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: CLOSED
H1: CLOSED
H2: ELIGIBLE
independentReview: PASS
finalCrossPlatformCI: PASS
squashMerge: PASS
```

Residual product qualification such as Linux/macOS real PostgreSQL, source-less recovery, service-account ACL, and hardware power-loss remains exactly `NOT_RUN` unless separately executed.

- [ ] **Step 0.1: Verify the actual merged baseline before editing**

```bash
git switch master
git pull --ff-only
test "$(git rev-parse HEAD)" = "82541933bc2b5e6add0eeee711b4f36350f5d5ff"
gh pr view 11 --json state,mergedAt,mergeCommit,headRefOid,baseRefOid
```

Expected: PR #11 is merged; merge commit is `82541933...`; head is `80440e...`; base is `257ad6...`.

- [ ] **Step 0.2: Create the docs-only reconciliation branch**

```bash
git switch -c docs/h1-postmerge-truth-reconciliation
```

- [ ] **Step 0.3: Enumerate current-truth references before changing them**

```bash
rg -n \
  'H1: OPEN|H2: NOT_ELIGIBLE|independentReview: NOT_RUN|final cross-platform CI: NOT_RUN|squash merge: NOT_RUN|final_cross_platform_ci.*NOT_RUN|squash_merge.*NOT_RUN' \
  docs Architecture_Corpus
```

Classify each hit as either:

```text
CURRENT_TRUTH     -> must be reconciled
HISTORICAL/RULE   -> must remain historical/procedural
```

Known current-truth files include the four Phase A files. If another machine-readable/current-status projection appears, include it in this PR. If the hit is a historical plan/spec narrative, leave it unchanged.

- [ ] **Step 0.4: Update `h1s-control-record.md` with the exact closure tuple**

Required current block:

```yaml
M5B: CLOSED
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: CLOSED
H1: CLOSED
H2: ELIGIBLE
executionStatus: CLOSED
externalClosureGates: CLOSED
independentReview: PASS
reviewCandidateBase: 257ad6fe73924bcd1c9a00cad6a15938d6e6a2da
reviewCandidateHead: 80440e89918f3141c087fff65118754bb07e09ca
finalCrossPlatformCI: PASS
finalCiRunId: 32643262593
finalCiHeadSha: 80440e89918f3141c087fff65118754bb07e09ca
squashMerge: PASS
squashMergeSha: 82541933bc2b5e6add0eeee711b4f36350f5d5ff
```

Preserve the previous REQUEST_CHANGES record as historical evidence; do not erase chronology.

- [ ] **Step 0.5: Update the current qualification ledger without inflating product claims**

In `Q-BOOT-01`:

```text
independent_review       -> PASS
final_cross_platform_ci  -> PASS
squash_merge             -> PASS
```

Add exact evidence refs for reviewed pair, CI run/head and squash SHA. Keep:

```text
linux_real_postgres_recovery = NOT_RUN
macos_real_postgres_recovery = NOT_RUN
source_less_recovery = NOT_RUN
service_account_acl = NOT_RUN
hardware_power_loss = NOT_RUN
```

Do not change `ImplementationQualification = REQUIRED` merely because H1 stage closure succeeded.

- [ ] **Step 0.6: Reconcile roadmap and plan navigation**

`docs/roadmap/development-roadmap.md` current H1 block must say H1 is closed and H2 is eligible, while preserving residual qualification debt. Update the stale repository baseline to the actual merged H1 commit or explicitly state the newer planning baseline.

`docs/plans/README.md` must no longer say H2 is `NOT_ELIGIBLE`. It should state that no H2 implementation plan is active **yet**, but H2 is eligible to begin.

- [ ] **Step 0.7: Verify that no behavior file changed**

```bash
git diff --name-only master...HEAD
```

Expected paths are documentation/evidence only. Any `packages/**`, test, workflow, or behavior-bearing script change is a hard failure for Task 0.

- [ ] **Step 0.8: Run reconciliation gates**

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm format:check
```

Expected: all PASS.

- [ ] **Step 0.9: Commit and open the reconciliation PR**

```bash
cat > /tmp/h1-reconciliation-pr-body.md <<'BODY'
## Closure evidence

- Reviewed pair: `(257ad6fe73924bcd1c9a00cad6a15938d6e6a2da, 80440e89918f3141c087fff65118754bb07e09ca)`
- Independent review: PASS
- Manual final CI: PASS, run `32643262593`, head `80440e89918f3141c087fff65118754bb07e09ca`
- Squash merge: `82541933bc2b5e6add0eeee711b4f36350f5d5ff`
- Scope: docs/evidence-only truth reconciliation; no production code, tests, workflow logic, or behavior contract changes.
- Residual product qualification remains truthful; unexecuted Linux/macOS/source-less/service-account/power-loss claims remain NOT_RUN.
BODY

git add docs Architecture_Corpus/qualification/results/qualification-status.json
git commit -m "docs: reconcile H1 post-merge closure truth"
git push -u origin docs/h1-postmerge-truth-reconciliation
gh pr create --base master --head docs/h1-postmerge-truth-reconciliation \
  --title "docs: reconcile H1 closure truth" \
  --body-file /tmp/h1-reconciliation-pr-body.md
```

The PR body must include the exact review pair, CI run ID/head SHA, merge SHA, and a statement that no production/test/behavior contract changed.

Do **not** dispatch manual cross-platform final CI for this docs/evidence-only reconciliation PR.

- [ ] **Step 0.10: Merge only after explicit authorization, then refresh master**

Use squash merge only if the execution session has explicit merge authorization. After merge:

```bash
git switch master
git pull --ff-only
H2_BASE_SHA="$(git rev-parse HEAD)"
rg -n 'H1: CLOSED|H2: ELIGIBLE' \
  docs/plans/completed/foundation/h1s-control-record.md \
  docs/roadmap/development-roadmap.md \
  docs/plans/README.md
```

**Gate:** no H2 behavior branch may exist before this step is complete.

---

## Task 1: Activate H2A-1 on the reconciled master

**Files:**

- Create `docs/plans/active/foundation/h2a1-host-fenced-persistence-authority.md`
- Modify `docs/plans/README.md`

**Consumes:** reconciled `master` from Task 0.

**Produces:** one active H2A-1 plan and branch.

- [ ] **Step 1.1: Verify entry truth and clean baseline**

```bash
git switch master
git pull --ff-only
git status --short
test -z "$(git status --porcelain)"
rg -n 'H1: CLOSED|H2: ELIGIBLE' \
  docs/plans/completed/foundation/h1s-control-record.md \
  docs/roadmap/development-roadmap.md
pnpm verify
```

Expected: clean tree, H2 eligible, `pnpm verify` PASS.

- [ ] **Step 1.2: Create the behavior branch**

```bash
H2_BASE_SHA="$(git rev-parse HEAD)"
git switch -c dev/h2a1-host-fenced-persistence-authority
```

Record `H2_BASE_SHA` in the active plan header when installing this file.

- [ ] **Step 1.3: Install this plan as repository Authority**

Create `docs/plans/active/foundation/` if it does not exist. Copy this plan to the intended path and mark its repository plan state `ACTIVE`. Update `docs/plans/README.md` so this exact path is the sole active plan.

- [ ] **Step 1.4: Commit only plan activation**

```bash
git add docs/plans
git commit -m "docs: activate H2A1 persistence authority plan"
```

---

## Task 2: Pin Kysely and materialize the persistence workspace

**Files:**

- Modify `pnpm-workspace.yaml`
- Modify `pnpm-lock.yaml`
- Create `packages/persistence/package.json`
- Create `packages/persistence/project.json`
- Create `packages/persistence/tsconfig.json`
- Create `packages/persistence/tsconfig.build.json`
- Create `packages/persistence/src/index.ts`

**Consumes:** adopted dependency routes `pg` + Kysely.

**Produces:** compilable empty persistence workspace with exact Catalog routing; no persistence behavior yet.

- [ ] **Step 2.1: Refresh exact Kysely registry evidence**

```bash
pnpm view kysely version engines peerDependencies dependencies --json
```

Expected for this plan: stable version `0.29.5`. If not, stop and amend the plan before modifying the Catalog.

- [ ] **Step 2.2: Add exact Catalog pin**

Add:

```yaml
catalog:
  kysely: 0.29.5
```

Do not add a range and do not add a prerelease.

- [ ] **Step 2.3: Create `@heptalogos/persistence` package metadata**

`packages/persistence/package.json`:

```json
{
  "name": "@heptalogos/persistence",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "dependencies": {
    "@heptalogos/foundation-contracts": "workspace:*",
    "@heptalogos/host-ownership": "workspace:*",
    "kysely": "catalog:",
    "pg": "catalog:"
  },
  "devDependencies": {
    "@heptalogos/bootstrap-runtime": "workspace:*",
    "@heptalogos/bootstrap-state": "workspace:*",
    "@heptalogos/private-postgres": "workspace:*",
    "@types/pg": "catalog:",
    "vitest": "catalog:"
  }
}
```

Dev dependencies are for real H1→H2 integration setup only; production persistence must not import bootstrap-runtime/private-postgres.

- [ ] **Step 2.4: Create Nx/test targets following existing package patterns**

`project.json` must provide `lint`, unit `test`, and `test:integration`. Integration command runs only `src/persistence.integration.test.ts` and requires `HEPTALOGOS_TEST_PG_BIN`, matching existing real-PG qualification style.

- [ ] **Step 2.5: Create TS configs by following existing TS7/NodeNext package references**

Do not introduce a package-local compiler baseline or `skipLibCheck=true`.

- [ ] **Step 2.6: Install and prove routing before behavior code**

```bash
pnpm install
pnpm check:dependencies
pnpm typecheck
```

Expected: all PASS.

- [ ] **Step 2.7: Commit workspace materialization**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml packages/persistence
git commit -m "build: add persistence workspace and Kysely route"
```

---

## Task 3: Add the least-privilege normal runtime PostgreSQL principal

**Files:**

- Modify `packages/bootstrap-runtime/src/bootstrap-key-provider.ts`
- Modify all structural fakes implementing `BootstrapKeyProvider`
- Modify `packages/host-ownership/src/contracts.ts`
- Modify `packages/host-ownership/src/bootstrap-admin.ts`
- Modify `packages/host-ownership/src/ownership-schema.ts`
- Modify `packages/host-ownership/src/index.ts`
- Modify `packages/host-ownership/src/bootstrap-admin.test.ts`
- Modify `packages/host-ownership/src/host-ownership.integration.test.ts`

**Consumes:** existing bootstrap-admin provisioning authority.

**Produces:** `heptalogos_runtime` exists with exact least privilege and a distinct SCRAM credential.

- [ ] **Step 3.1: Write failing BootstrapKeyProvider contract tests/fake compile changes**

Extend the purpose union:

```ts
readonly purpose:
  | "private-postgres-bootstrap-superuser"
  | "private-postgres-host-lease-role"
  | "private-postgres-runtime-role";
```

Add:

```ts
withPrivatePostgresRuntimePassword<T>(
  context: BootstrapKeyRequestContext,
  use: (passwordUtf8: Uint8Array) => Promise<T>,
): Promise<T>;
```

Run the affected bootstrap-runtime unit target. Expected: FAIL until all provider fakes implement the method.

- [ ] **Step 3.2: Add role constants and exact role contract**

In `host-ownership/src/contracts.ts`:

```ts
export const HOST_RUNTIME_ROLE = "heptalogos_runtime" as const;
```

Extend `BootstrapAdminPasswordProvider` with `withRuntimePassword`.

`ensureRole()` for runtime must require:

```text
LOGIN
NOSUPERUSER
NOCREATEDB
NOCREATEROLE
NOREPLICATION
NOBYPASSRLS
NOINHERIT
CONNECTION LIMIT -1
no membership edges
SCRAM verifier matches provided runtime credential
```

Existing mismatched credentials remain fail-closed; no silent password reset.

- [ ] **Step 3.3: Write failing ACL tests before changing grants**

Required final explicit ACL set:

```text
canonical database:
  heptalogos_host_lease CONNECT
  heptalogos_runtime CONNECT

heptalogos schema:
  heptalogos_host_lease USAGE
  heptalogos_runtime USAGE

host_ownership_fence:
  heptalogos_host_lease SELECT
  heptalogos_host_lease UPDATE
  heptalogos_runtime SELECT
```

Explicitly assert the absence of runtime `UPDATE`, schema `CREATE`, role membership and ownership.

- [ ] **Step 3.4: Implement provisioning/grants and update canonical snapshot inspection**

`HostOwnershipCanonicalSnapshot.roles` must include the runtime role. The runtime role must be created before schema ACL materialization needs to grant it privileges.

Do not grant DML on hypothetical future product tables here.

- [ ] **Step 3.5: Run host-ownership unit tests**

```bash
pnpm nx test host-ownership
```

Expected: PASS.

- [ ] **Step 3.6: Run real-PG role/ACL qualification on the current host**

```bash
: "${HEPTALOGOS_TEST_PG_BIN:?Set HEPTALOGOS_TEST_PG_BIN to the qualified PostgreSQL 18.6 bin directory}"
pnpm nx run host-ownership:test:integration
```

Assertions must prove that the runtime credential can connect and `SELECT` the fence, but cannot:

```text
UPDATE host_ownership_fence
CREATE TABLE in heptalogos schema
CREATE ROLE
SET ROLE heptalogos_owner
```

Record only the OS actually executed.

- [ ] **Step 3.7: Commit the runtime-principal boundary**

```bash
git add packages/bootstrap-runtime packages/host-ownership
git commit -m "feat: provision least-privilege runtime database principal"
```

---

## Task 4: Issue a narrow HostPersistenceAuthority from the H1 handoff

**Files:**

- Modify `packages/host-ownership/src/contracts.ts`
- Modify `packages/host-ownership/src/index.ts`
- Modify `packages/bootstrap-runtime/src/managed-host.ts`
- Modify `packages/bootstrap-runtime/src/host-ownership-handoff.ts`
- Modify `packages/bootstrap-runtime/src/index.ts`
- Create `packages/bootstrap-runtime/src/host-persistence-authority.test.ts`
- Update existing bootstrap-runtime handoff/integration fakes for the runtime credential

**Consumes:** current managed Host + runtime-role password source.

**Produces:** `BootstrapManagedHostContext.persistence: HostPersistenceAuthority` with no raw bootstrap or pg capability.

- [ ] **Step 4.1: Add the structural contract to host-ownership**

Implement the interfaces from §1.3 and export only those types/constants at package root. Do not export a raw password value or provider implementation.

- [ ] **Step 4.2: Write failing managed-host terminality tests**

Required case:

```ts
const host = createManagedHostContext(/* fixture */);
host.persistence.assertActive(); // succeeds
markManagedHostTerminal(host);
expect(() => host.persistence.assertActive()).toThrow();
```

Also assert that `.persistence` exposes no bootstrap password, host-lease password, raw `HostLeaseConnection`, `pg` client or Kysely object.

- [ ] **Step 4.3: Construct the capability inside bootstrap-runtime**

The capability target is:

```ts
{
  host: "127.0.0.1",
  port: ready.port,
  database: HOST_OWNERSHIP_CANONICAL_DATABASE,
  user: HOST_RUNTIME_ROLE,
}
```

`withRuntimeDatabasePassword()` first checks the same managed-Host terminal/active fence, then delegates only to `BootstrapKeyProvider.withPrivatePostgresRuntimePassword()` with purpose `private-postgres-runtime-role`. A terminal/fenced Host cannot materialize a fresh runtime database credential.

`assertActive()` must check the same `ManagedHostRecord.terminal` fence used by the managed Host **and** the underlying raw Host ownership context.

- [ ] **Step 4.4: Add capability to public managed Host**

`BootstrapManagedHostContext` gains only:

```ts
readonly persistence: HostPersistenceAuthority;
```

Do not expose the whole key provider.

- [ ] **Step 4.5: Run bootstrap-runtime units and existing real handoff integration**

```bash
pnpm nx test bootstrap-runtime
: "${HEPTALOGOS_TEST_PG_BIN:?Set HEPTALOGOS_TEST_PG_BIN to the qualified PostgreSQL 18.6 bin directory}"
pnpm nx run bootstrap-runtime:test:integration
```

Expected: existing H1 scenarios remain PASS and new runtime role/capability does not change ownership ordering.

- [ ] **Step 4.6: Commit the H1→H2 capability seam**

```bash
git add packages/host-ownership packages/bootstrap-runtime
git commit -m "feat: issue host-scoped persistence authority"
```

---

## Task 5: Implement the persistence package boundary without framework leakage

**Files:**

- Create/modify all `packages/persistence/src/*` unit files listed in Phase B.

**Consumes:** `HostPersistenceAuthority`.

**Produces:** public PersistenceService contract + private pg/Kysely mechanics.

- [ ] **Step 5.1: Write the public contract first**

Implement exactly the public types in §1.4 in `contracts.ts`. `index.ts` exports only Heptalogos-owned contracts, Problem-safe factory, and no implementation-library types.

- [ ] **Step 5.2: Write a failing public-surface test**

The test must import only from `./index.js` and assert representative exports exist. Add a static boundary check later in Task 9; do not depend only on runtime reflection.

- [ ] **Step 5.3: Implement issued transaction-context tokens**

`transaction-context.ts` uses a private `WeakMap<object, Kysely transaction>`.

Required behavior:

```text
context is created only by persistence-service
context.mode is READ or MUTATION
context cannot be resolved after the callback finishes
unknown/forged context is rejected internally
no Kysely type appears in package-root declarations
```

The internal resolver is not exported from `index.ts`.

- [ ] **Step 5.4: Implement pg Pool adapter with dynamic password callback**

Pool configuration must use:

```ts
password: () =>
  authority.withRuntimeDatabasePassword(async (passwordUtf8) =>
    new TextDecoder("utf-8", { fatal: true }).decode(passwordUtf8),
  )
```

Use explicit options for max/idle/connection/statement/lock/idle-in-transaction budgets. Set a fixed non-secret `application_name` such as `heptalogos-runtime` as an `IMPLEMENTATION_CONSTANT`.

Attach an `error` listener. It calls `onBackgroundError(error)` and must not throw from the event handler or start unowned retry work.

- [ ] **Step 5.5: Implement Kysely adapter**

Production mechanics:

```ts
new Kysely({
  dialect: new PostgresDialect({ pool }),
});
```

Kysely remains private to this package. Do not expose the dialect/database instance.

- [ ] **Step 5.6: Implement service lifecycle**

State:

```text
OPEN
  -- authority abort --> FENCED
OPEN/FENCED
  -- close() --> CLOSING --> CLOSED
```

Rules:

- new `read()`/`mutate()` reject while `FENCED/CLOSING/CLOSED`;
- authority abort synchronously stops admission and starts one owned pool-close/drain promise; it must not forcibly terminate a transaction that already crossed the mutation-admission point;
- repeated `close()` returns the same settlement;
- no fire-and-forget cleanup promise is untracked;
- pool close does not attempt Host lease reacquisition.

- [ ] **Step 5.7: Run persistence unit tests**

```bash
pnpm nx test persistence
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5.8: Commit the package boundary**

```bash
git add packages/persistence
git commit -m "feat: add persistence service boundary"
```

---

## Task 6: Implement read-only and Host-fenced mutation transaction semantics

**Files:**

- Modify `packages/persistence/src/persistence-service.ts`
- Modify `packages/persistence/src/transaction-context.ts`
- Modify `packages/persistence/src/problems.ts`
- Modify `packages/persistence/src/persistence-service.test.ts`

**Consumes:** pool/Kysely adapter, HostPersistenceAuthority.

**Produces:** the H2A-1 Authority invariant.

- [ ] **Step 6.1: Write failing mutation ordering tests using fake internal transaction mechanics**

The test double must record this exact order:

```text
1 authority.assertActive
2 transaction begins
3 authority.assertActive
4 SELECT fence FOR SHARE
5 verify singleton/InstanceId/BootId/token
6 authority.assertActive while fence is held
7 invoke operation
8 transaction completion
```

If the third `assertActive()` fails, operation invocation count must remain zero.

Do not add an `assertActive()` after operation completion as a prerequisite for commit; an already-admitted transaction is allowed to complete under the held shared fence.

- [ ] **Step 6.2: Implement exact fence query**

The internal query selects:

```sql
SELECT singleton,
       instance_id,
       ownership_revision,
       host_ownership_token,
       boot_id
FROM "heptalogos"."host_ownership_fence"
WHERE singleton = true
FOR SHARE
```

Require exactly one row. Verify:

```text
singleton == true
instance_id == authority.instanceId
host_ownership_token == authority.token
boot_id == authority.bootId
ownership_revision is a valid non-negative integer representation
```

Mismatch is `persistence.host_fence.stale_owner` when identity is structurally valid but no longer current; malformed/missing fence shape is `persistence.host_fence.incompatible`.

- [ ] **Step 6.3: Write failing read-only test**

Within `read()`, an internal test operation attempts an `INSERT` into a qualification table. Expected: PostgreSQL rejects it because the transaction is read-only, not because application code inspected the SQL.

- [ ] **Step 6.4: Implement read transaction**

First transaction statement:

```sql
SET TRANSACTION READ ONLY
```

Then issue a READ context. Admission requires active service/Host, but no `FOR SHARE` fence is taken.

- [ ] **Step 6.5: Implement mutation transaction**

Use Kysely transaction mechanics. Create the context only after all fence/admission checks pass. Remove its WeakMap binding in `finally` when the callback scope ends.

- [ ] **Step 6.6: Map framework failures to stable Problems**

Rules:

```text
operation throws ProblemError -> rethrow unchanged
operation throws other error   -> persistence.transaction.failed
body completed, outer transaction completion rejects
                               -> persistence.transaction.commit_uncertain
```

Do not attach raw SQL or credentials to Problem metadata.

- [ ] **Step 6.7: Run unit tests**

```bash
pnpm nx test persistence
```

Expected: PASS.

- [ ] **Step 6.8: Commit fenced transaction semantics**

```bash
git add packages/persistence
git commit -m "feat: fence canonical persistence mutations"
```

---

## Task 7: Prove lifecycle and commit-uncertainty semantics

**Files:**

- Modify `packages/persistence/src/persistence-service.test.ts`
- Modify `packages/persistence/src/persistence-service.ts`
- Modify `packages/persistence/src/problems.ts`

**Consumes:** Task 6 semantics.

**Produces:** fail-safe service behavior around lease loss and ambiguous commit acknowledgement.

- [ ] **Step 7.1: Test lease loss before mutation admission**

Use an authority fake whose first checks succeed but whose final in-lock `assertActive()` throws. Expected:

```text
operation not invoked
transaction rolled back
service reports fenced/ownership failure
```

- [ ] **Step 7.2: Test lease loss after admission**

Once the operation callback has started, flip the process-local authority to fenced. Expected: the already-entered transaction is not cancelled merely by a late process-local check; transaction completion is allowed. The real PostgreSQL serialization proof is Task 8.

- [ ] **Step 7.3: Test commit uncertainty classification**

Use the internal transaction-mechanics seam to simulate:

```text
operation callback returned successfully
then transaction executor rejected
```

Expected Problem:

```text
problemCode = persistence.transaction.commit_uncertain
retryClass = manual
```

- [ ] **Step 7.4: Test close/fence idempotency**

Repeated abort + repeated `close()` must cause one pool close sequence and terminal `CLOSED` state.

- [ ] **Step 7.5: Run unit suite and commit**

```bash
pnpm nx test persistence
git add packages/persistence
git commit -m "fix: fail safe on persistence ownership loss"
```

---

## Task 8: Run the real PostgreSQL H1→H2 qualification matrix

**Files:**

- Create/modify `packages/persistence/src/persistence.integration.test.ts`
- May modify `packages/host-ownership/src/host-ownership.integration.test.ts` only for shared role/ACL assertions; do not duplicate product semantics there.

**Consumes:** real PostgreSQL 18.6 bin path, H1 ownership mechanics, H2 persistence service.

**Produces:** claim-matched evidence for transaction fencing.

Use `HEPTALOGOS_TEST_PG_BIN` exactly like existing H1 PostgreSQL qualification. Prefer public H1 boot/handoff APIs where practical. For tests needing deterministic access to lease publication order, low-level host-ownership test fixtures are allowed inside integration tests; do not expose those seams in product APIs.

### Scenario P1 — current Host mutation succeeds

- [ ] Start a private PostgreSQL fixture.
- [ ] Provision owner/lease/runtime roles and ownership schema.
- [ ] Acquire Host A lease and publish token A.
- [ ] Create a qualification table owned by `heptalogos_owner` and explicitly grant runtime role the DML required by the test.
- [ ] Build PersistenceService A from Host A authority.
- [ ] `mutate()` inserts/updates one row.
- [ ] Verify committed row through an independent read.

Expected: PASS.

### Scenario P2 — structurally active but stale token fails at the database fence

- [ ] Publish token B as the current fence token.
- [ ] Construct a test-only structurally active authority carrying old token A but the valid runtime credential/target.
- [ ] Call `mutate()`.

Expected:

```text
persistence.host_fence.stale_owner
operation callback not invoked
domain row unchanged
```

This proves database fencing independently of process-local admission correctness.

### Scenario P3 — already-entered old transaction serializes before new token publication

- [ ] Host A holds lease/token A.
- [ ] Start `mutate()` A and pause inside the operation callback; reaching the callback proves the shared fence is already held and post-lock `assertActive()` passed.
- [ ] Close/lose Host A dedicated lease.
- [ ] Acquire Host B lease.
- [ ] Start `publishHostOwnershipToken(... token B ...)` from Host B.
- [ ] Verify publication has not completed while A's operation remains paused.
- [ ] Release A's operation barrier and let A commit.
- [ ] Verify B publication now completes.
- [ ] Verify fence row contains B.

Expected ordering:

```text
A shared fence acquired
A admitted
A lease lost
B lease acquired
B publication waits
A commits
B publishes token B
```

This is the central E34/S03 proof.

### Scenario P4 — no new mutation after Host A loss

- [ ] After P3 closes lease A, call another `mutate()` through A.

Expected: fail before operation invocation. Do not reconnect/reacquire in-place.

### Scenario P5 — read-only database enforcement

- [ ] `read()` attempts qualification-table DML through the package-internal test resolver.

Expected: PostgreSQL read-only transaction error; no row mutation.

### Scenario P6 — read does not block Host token publication

- [ ] Hold a long `read()` transaction after `SET TRANSACTION READ ONLY`.
- [ ] Publish a new Host token from a valid new owner sequence.

Expected: the read transaction itself does not hold the `HostOwnershipFence` row and therefore is not the blocker. Any lease/ownership prerequisite is handled separately by the test fixture.

### Scenario P7 — commit acknowledgement loss is explicit uncertainty

- [ ] Inside a mutating transaction, perform the final qualification-table DML.
- [ ] Query that transaction connection's `pg_backend_pid()` through the package-internal test resolver.
- [ ] From an independent bootstrap/admin test connection, terminate that backend after the last DML but before the operation callback returns.
- [ ] Let the callback return so Kysely attempts transaction completion on the dead connection.

Expected:

```text
persistence.transaction.commit_uncertain
retryClass = manual
```

Do not assert that the client could know committed-vs-rolled-back truth. An independent admin read after the fact may be recorded as test-environment evidence, but must not change the service's uncertainty classification rule.

### Scenario P8 — runtime role privilege closure

Prove the runtime principal can:

```text
CONNECT
USAGE heptalogos schema
SELECT HostOwnershipFence
use explicitly granted qualification-table DML
```

and cannot:

```text
UPDATE HostOwnershipFence
CREATE in product schema
CREATE DATABASE
CREATE ROLE
SET ROLE heptalogos_owner
```

- [ ] **Step 8.9: Execute the matrix on the available real-PG host**

```bash
: "${HEPTALOGOS_TEST_PG_BIN:?Set HEPTALOGOS_TEST_PG_BIN to the qualified PostgreSQL 18.6 bin directory}"
pnpm nx run persistence:test:integration
```

Expected: all P1-P8 tests PASS on the actually executed host.

- [ ] **Step 8.10: Re-run H1 real-PG regression targets**

```bash
: "${HEPTALOGOS_TEST_PG_BIN:?Set HEPTALOGOS_TEST_PG_BIN to the qualified PostgreSQL 18.6 bin directory}"
pnpm nx run host-ownership:test:integration

: "${HEPTALOGOS_TEST_PG_BIN:?Set HEPTALOGOS_TEST_PG_BIN to the qualified PostgreSQL 18.6 bin directory}"
pnpm nx run bootstrap-runtime:test:integration
```

Expected: PASS. H2A-1 must not regress H1 ownership or handoff.

- [ ] **Step 8.11: Commit integration proof**

```bash
git add packages/persistence packages/host-ownership packages/bootstrap-runtime
git commit -m "test: prove host-fenced persistence on real postgres"
```

---

## Task 9: Strengthen mechanical dependency and framework-leakage boundaries

**Files:**

- Modify `scripts/verify/boundaries.mjs`
- Modify package manifests only if the gate exposes an undeclared/incorrect route

**Consumes:** new persistence package.

**Produces:** mechanical enforcement of the architecture route.

- [ ] **Step 9.1: Write failing boundary assertions before relaxing existing `pg` restriction**

Required import policy:

```text
pg production imports:
  packages/host-ownership/... existing approved adapters
  packages/persistence/... persistence mechanics

kysely production imports:
  packages/persistence/... only
```

Do not broadly permit `pg` or Kysely under `packages/**`.

- [ ] **Step 9.2: Add package-root leakage checks**

Read `packages/persistence/src/index.ts` and fail if it exports/imports public names matching concrete mechanics such as:

```text
Pool
PoolClient
Client
Kysely
PostgresDialect
Transaction<
CompiledQuery
```

Also reject package-root `export *` from internal files that import `pg`/Kysely.

- [ ] **Step 9.3: Preserve host-ownership anti-capture guard**

Existing rule that `host-ownership` must not materialize `Kysely`, `DBOS`, or `PersistenceService` remains in force. Do not move persistence mechanics back into H1 packages.

- [ ] **Step 9.4: Run static gates**

```bash
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

Expected: PASS.

- [ ] **Step 9.5: Commit enforcement**

```bash
git add scripts/verify/boundaries.mjs
git commit -m "chore: enforce persistence dependency boundaries"
```

---

## Task 10: Record H2A-1 evidence, close the active plan, and freeze the review candidate

**Files:**

- Modify `Architecture_Corpus/qualification/results/qualification-status.json`
- Modify `docs/roadmap/development-roadmap.md`
- Move active plan to completed path
- Modify `docs/plans/README.md`

**Consumes:** executed test/gate results only.

**Produces:** truthful current evidence and a reviewable candidate.

- [ ] **Step 10.1: Add a current persistence qualification record**

Record the exact qualification ID `Q-PERSISTENCE-01` with at least:

```text
kysely_exact_version_consumer_compile      PASS
runtime_role_least_privilege               PASS
current_token_mutation                     PASS
stale_token_database_fence                 PASS
shared_fence_new_owner_serialization       PASS
lease_loss_new_mutation_rejected           PASS
read_only_database_enforcement             PASS
commit_acknowledgement_uncertainty          PASS
framework_leakage_gate                     PASS
real_postgres_windows                      PASS | NOT_RUN
real_postgres_linux                        PASS | NOT_RUN
real_postgres_macos                        PASS | NOT_RUN
source_less_persistence                     NOT_RUN
service_headless_persistence                NOT_RUN
```

Set `qualificationState` to `PARTIAL` unless every declared product-qualification boundary is actually proven. Keep `pg` and Kysely `ImplementationQualification = REQUIRED` unless the Architecture qualification contract's full closure conditions have genuinely been met.

- [ ] **Step 10.2: Update roadmap progress without claiming H2 closure**

Record that H2A-1 persistence Authority is implemented/qualified on the candidate, but:

```text
H2A != CLOSED
H2 != CLOSED
```

H2A still needs Schema/Time/ExecutionContext/minimal Lineage/Evidence work. H2B remains separate.

- [ ] **Step 10.3: Run full clean local verification**

```bash
pnpm verify
```

Then run the claim-specific real-PG targets again from a clean state if they are not part of `pnpm verify`:

```bash
: "${HEPTALOGOS_TEST_PG_BIN:?Set HEPTALOGOS_TEST_PG_BIN to the qualified PostgreSQL 18.6 bin directory}"
pnpm nx run persistence:test:integration
: "${HEPTALOGOS_TEST_PG_BIN:?Set HEPTALOGOS_TEST_PG_BIN to the qualified PostgreSQL 18.6 bin directory}"
pnpm nx run host-ownership:test:integration
: "${HEPTALOGOS_TEST_PG_BIN:?Set HEPTALOGOS_TEST_PG_BIN to the qualified PostgreSQL 18.6 bin directory}"
pnpm nx run bootstrap-runtime:test:integration
```

Record exact PASS/FAIL/NOT_RUN. Never infer another OS.

- [ ] **Step 10.4: Close/move the plan before review**

Move:

```text
docs/plans/active/foundation/h2a1-host-fenced-persistence-authority.md
→ docs/plans/completed/foundation/h2a1-host-fenced-persistence-authority.md
```

Set plan state `COMPLETED` only if all implementation tasks and local evidence gates in this plan are complete. Update `docs/plans/README.md` so no stale active path remains.

- [ ] **Step 10.5: Run repository gates again after documentation movement**

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm check:boundaries
pnpm format:check
pnpm verify
```

Expected: all PASS.

- [ ] **Step 10.6: Commit final evidence/documentation reconciliation**

```bash
git add Architecture_Corpus docs
git commit -m "docs: record H2A1 persistence qualification"
```

- [ ] **Step 10.7: Freeze candidate identity and update Draft PR body**

```bash
git fetch --no-tags origin master
BASE_SHA="$(git rev-parse origin/master)"
HEAD_SHA="$(git rev-parse HEAD)"
git merge-base --is-ancestor "$BASE_SHA" "$HEAD_SHA"
```

The PR body must record:

```text
H2A-1 base SHA
H2A-1 final repository candidate HEAD
local pnpm verify result
real PostgreSQL host/18.6 evidence
P1-P8 results
residual NOT_RUN platform/source-less/service claims
```

Any subsequent branch commit invalidates the review candidate.

- [ ] **Step 10.8: Request independent review of the exact pair**

Independent reviewer checks the full `(BASE_SHA, HEAD_SHA)` diff, especially:

```text
runtime role privilege closure
HostPersistenceAuthority narrowing
mutation admission linearization
FOR SHARE vs publication ordering
commit uncertainty
framework leakage
no H2B/H3 scope creep
```

Implementer self-review is not sufficient.

- [ ] **Step 10.9: After independent review PASS, run manual final CI on the same pair**

Follow `docs/engineering/playbooks/repository/milestone-pr-closure.md`. Dispatch `verify.yml` from the reviewed head branch, with the reviewed base/head inputs. Require Ubuntu/macOS/Windows PASS and verify the workflow run `headSha` equals `HEAD_SHA`.

Final CI is repository cross-platform closure only. It does not turn real PostgreSQL tests that were not run on an OS into PASS.

- [ ] **Step 10.10: Pre-merge exact-pair check and squash merge**

Immediately before merge:

```bash
git fetch --no-tags origin master
test "$(git rev-parse origin/master)" = "$BASE_SHA"
test "$(git rev-parse HEAD)" = "$HEAD_SHA"
test "$(gh pr view --json baseRefOid --jq .baseRefOid)" = "$BASE_SHA"
test "$(gh pr view --json headRefOid --jq .headRefOid)" = "$HEAD_SHA"
```

If either SHA moved, review and final CI are stale. Rebase/update, rerun local gates, obtain a fresh review, and rerun final CI.

Squash merge only with explicit authorization. H2 remains open after this merge; no H2-stage closure reconciliation is created merely because H2A-1 landed.

---

# 4. Acceptance matrix

H2A-1 is locally implementation-complete only when all mandatory rows below are true on the candidate.

| ID | Claim | Required evidence |
|---|---|---|
| A1 | H1 closure truth is reconciled before H2 behavior work | merged docs/evidence-only reconciliation PR |
| A2 | normal runtime uses a distinct least-privilege PostgreSQL principal | unit + real-PG ACL tests |
| A3 | bootstrap/owner/lease credentials are not reused as runtime pool identity | contract + connection tests |
| A4 | PersistenceService package root leaks no pg/Kysely types | static boundary gate + TS declarations |
| A5 | read transaction is database-enforced read-only | real PostgreSQL |
| A6 | mutation takes `FOR SHARE` and verifies exact current fence tuple | unit ordering + real PostgreSQL |
| A7 | process-local lease loss before final admission check prevents operation | unit deterministic authority fake |
| A8 | already-admitted old mutation may complete and blocks new token publication until exit | real PostgreSQL multi-connection test |
| A9 | stale token cannot mutate even if process-local authority is falsely active | real PostgreSQL stale-token test |
| A10 | no new old-Host mutation starts after lease loss | unit + real PostgreSQL |
| A11 | commit acknowledgement loss becomes explicit `commit_uncertain` | unit + real PostgreSQL backend termination |
| A12 | dynamic password materialization uses only runtime credential purpose | unit/integration |
| A13 | existing H1 ownership/bootstrap regressions remain PASS | H1 unit + real-PG integration |
| A14 | adopted dependency route is mechanically enforced | `check:dependencies` + `check:boundaries` |
| A15 | full repository gate passes | `pnpm verify` |
| A16 | residual platform/source-less claims remain truthful | qualification ledger |

---

# 5. Explicit non-goals / stop conditions

Stop and surface the issue instead of expanding this plan if any of the following becomes necessary:

1. A general schema migration framework beyond what is needed to provision the fixed runtime role/fence ACL.
2. A custom query language/ORM abstraction to avoid exposing Kysely.
3. A second PostgreSQL ownership/fencing mechanism.
4. Reusing `heptalogos_host_lease` as the application pool because runtime credential work is inconvenient.
5. Making `heptalogos_owner` LOGIN or granting runtime role membership in the owner role.
6. Full ConfigurationService just to choose pool settings. H2A-1 accepts explicit required options and records their future configuration class.
7. Full ExecutionContext/Activity/Evidence implementation. H2A-1 must leave an obvious seam but does not retrofit Lineage here.
8. Cordis/Graphlib/RuntimeReconciler implementation.
9. DBOS/WorkQueue/Signal/Effect implementation.
10. Management/CLI/Web or Subject/Messaging/AI work.
11. Kysely 0.29.5 exhibiting a reproducible hard blocker. In that case reopen the existing adopted-role decision with evidence; do not silently write a raw-pg fallback.
12. A PostgreSQL lock mode different from `FOR SHARE` being required for the fence invariant. Stop and prove the lock conflict semantics before changing the contract.
13. A requirement for normal mutation to continue without current Host token proof. This contradicts E34/S03 and requires architecture review.
14. Any reconciliation change to H1 production/tests. H1 post-merge behavior is immutable.

---

# 6. Deferred follow-on after H2A-1

Only after this plan is squash-merged should the next planning session decide between:

```text
H2A-2 — SchemaRuntime + TimeService + ExecutionContext identity/context spine

and, if the persistence contract is stable enough,

H2B-1 — RuntimeSubstrate/Cordis integration and Kernel composition semantics
```

H2A-1 deliberately does not predefine the final cross-package repository transaction ABI, Activity persistence schema, migration catalog, or runtime composition model. Those decisions need their first real consumers and their own plan/review boundaries.

---

# 7. Plan self-review checklist

Before using this file as an active repository plan, verify:

- [ ] H1 merge/CI/review evidence still matches the exact values in Task 0.
- [ ] H1 reconciliation PR is separate and docs/evidence-only.
- [ ] H2 behavior branch starts from the merged reconciliation master, not `82541933...` directly.
- [ ] Kysely registry stable exact version is still `0.29.5`; otherwise amend the plan.
- [ ] No task introduces Cordis/DBOS/Management/Subject scope.
- [ ] `heptalogos_runtime` is distinct, least-privilege, `NOINHERIT`, and cannot mutate the fence.
- [ ] `HostPersistenceAuthority` does not expose BootstrapKeyProvider or raw pg/Kysely objects.
- [ ] Mutation ordering contains the **post-lock active check** and no post-operation active check that would incorrectly invalidate already-linearized transactions.
- [ ] Real-PG P3 proves B publication waits for A's already-entered shared-fence transaction.
- [ ] Real-PG P7 classifies commit acknowledgement loss as uncertainty without automatic retry.
- [ ] Public persistence root has no framework leakage.
- [ ] Current evidence ledger preserves all genuinely NOT_RUN platform/source-less claims.
- [ ] Final review/CI candidate is bound to exact `(base_sha, head_sha)`.
