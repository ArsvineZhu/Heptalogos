# Foundation M3 Private PostgreSQL Bootstrap & Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Use `superpowers:test-driven-development` for every behavior-bearing change and `superpowers:verification-before-completion` before any PASS/completion claim. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** ACTIVE

**Goal:** Extend the proven M2 pre-PostgreSQL bootstrap substrate so that a bootstrap owner can safely initialize or validate one private PostgreSQL 18 cluster for its Instance, persist portable cluster identity, start/verify/stop/restart the exact cluster, and expose a `ReadyPrivatePostgres` handoff seam without yet granting Host ownership or normal canonical mutation authority.

**Roadmap Position:** H1 — *Own the Machine*, second implementation milestone after M2. **M3 does not close H1.** M4 will establish PostgreSQL advisory Host lease + `HostOwnershipFence` + `HostOwnershipToken` and forward handoff. M5 will close reverse handoff and bounded bootstrap Recovery.

**Architecture:** Add a narrow `@heptalogos/private-postgres` mechanics package below `@heptalogos/bootstrap-runtime`. The mechanics package owns explicit PostgreSQL toolchain resolution/validation, subprocess invocation through Execa, safe cluster initialization/inspection, bounded lifecycle control, and PostgreSQL-specific diagnostics; it does **not** own BootstrapState, bootstrap ownership, Host authority, Recovery policy, normal Persistence, or product migrations. `@heptalogos/bootstrap-runtime` remains the orchestration/Authority layer: it holds the authentic M2 bootstrap ownership capability, resolves logical roots, obtains bootstrap credential material through a minimal `BootstrapKeyProvider`, commits BootstrapState V2, journals stages, and returns `ReadyPrivatePostgres` while keeping bootstrap ownership held.

**Tech Stack / Frozen Implementation Evidence at Plan Authoring (2026-08-21):**

- repository baseline: `master@fdc2af95e4c90b6ca0093ab96fd72a808e05ed57`;
- Node.js `24.19.0` repository execution lane;
- pnpm `11.22.0`, strict Catalog;
- Nx `23.1.1`;
- TypeScript `7.0.2` canonical compiler; TS6 compatibility lane remains `6.0.2`;
- Vitest `4.1.11`;
- PostgreSQL architecture line: `18`;
- exact M3 qualification candidate: **PostgreSQL `18.6`** (released 2026-08-13; 18.5 was not released); future 18.x patch changes require refreshed evidence but do not change the architecture major;
- process adapter route: Execa; current Catalog and current npm latest are **`10.0.1`**;
- pre-PG ownership remains `proper-lockfile@4.1.2` in the M2 no-automatic-stale-takeover profile.

**External evidence used to freeze M3 behavior:**

- PostgreSQL 18.6 official release notes, release date 2026-08-13;
- PostgreSQL 18 `initdb`: `--pwfile` reads the bootstrap superuser password from a file; data checksums are enabled by default unless explicitly disabled;
- PostgreSQL 18 `pg_ctl`: supported standard mechanics for start/stop/restart/status and log redirection;
- PostgreSQL 18 `pg_controldata`: cluster-wide control metadata inspection;
- Execa `10.0.1`: current npm latest at plan authoring time.

**Spec / Authority:**

- `AGENTS.md`
- `docs/roadmap/development-roadmap.md`
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/05-整机执行模型.md`
- `Architecture_Corpus/14-跨平台产品运行与分发.md`
- `Architecture_Corpus/16-验证与资格认定体系.md`
- `Architecture_Corpus/23-存储拓扑-生命周期根与DataOwner.md`
- `Architecture_Corpus/24-依赖使用与实现路由.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S04-配置-Secret-管理Surface.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md`
- `Architecture_Corpus/specs/S17-Storage-Workspace-DataLifecycle.md`
- `Architecture_Corpus/references/dependency-routing.json`
- `Architecture_Corpus/qualification/dependency-status.json`
- `Architecture_Corpus/qualification/results/qualification-status.json`
- `docs/plans/completed/foundation/m2-pre-postgresql-bootstrap-substrate.md`

---

# 1. M3 Capability Boundary

M3 must prove this closed executable chain:

```text
InstallationAnchor / existing bootstrap caller
→ prepareBootstrapPrelude(anchorRoot)
→ PreparedBootstrapPrelude
→ acquire authentic M2 bootstrap ownership
→ OwnedBootstrapPrelude
→ validate exact PostgreSQL toolchain
→ resolve portable private-PG placement under logical DATA
→ inspect existing BootstrapState
→ initialize a new cluster only when state + directory prove first initialization
   OR validate the already-recorded cluster
→ persist/validate portable PostgreSQL identity in BootstrapState V2
→ start exact private PostgreSQL
→ prove readiness for the recorded cluster/port
→ return ReadyPrivatePostgres
→ controlled stop/restart preserves same cluster identity and port
```

At the M3 boundary:

```text
bootstrap ownership = HELD
private PostgreSQL = READY
Host advisory lease = NOT ACQUIRED
HostOwnershipFence = NOT CREATED
HostOwnershipToken = NOT PUBLISHED
normal canonical mutation = FORBIDDEN
```

`ReadyPrivatePostgres` means only:

> the PostgreSQL process reachable at the recorded loopback port has been started from the validated Heptalogos private cluster/toolchain under current bootstrap ownership.

It does **not** mean:

- Host ownership exists;
- normal application SQL may run;
- migrations may run;
- DBOS may run;
- first administrator state may be committed;
- normal System/Subject mutation authority is available.

---

# 2. Global Constraints

- Start from the actual current `master`. At plan authoring time it is `fdc2af95e4c90b6ca0093ab96fd72a808e05ed57`. If `master` moved, inspect the intervening commits before proceeding; never reset or overwrite user work just to reproduce this SHA.
- Canonical feature branch: `dev/m3-private-postgresql-bootstrap`.
- Canonical active plan path: `docs/plans/active/foundation/m3-private-postgresql-bootstrap.md`.
- M3 must be the only active Foundation implementation plan unless the repository explicitly designates non-overlapping plan authority.
- Preserve the repository workflow exactly:

```text
branch
→ Draft PR
→ local reproducible verification
→ Ready for Review
→ independent review PASS on exact HEAD SHA
→ manual final Windows/macOS/Linux CI on that exact reviewed SHA
→ verify HEAD unchanged
→ squash merge
```

- Any commit after independent review invalidates that review. Any commit after final CI invalidates both review authorization and final-CI authorization.
- Verification states are exactly `PASS | FAIL | NOT_RUN | BLOCKED`. A skip, missing binary, missing OS, or unavailable credential is never PASS.
- Library-first is mandatory. PostgreSQL 18 and Execa are ADOPTED routes. Do not replace them or introduce a second process manager/database just because a local shortcut appears easier.
- M3 must not use `child_process.spawn/exec/execFile` directly in product code. PostgreSQL process mechanics go through one Execa-backed adapter in `@heptalogos/private-postgres`.
- M3 must never discover production PostgreSQL from `PATH`, a system service, the default `localhost:5432`, registry/service auto-discovery, Docker, Homebrew, apt, or another machine-global convention. The caller provides one explicit PostgreSQL `bin` directory/toolchain root.
- Every PostgreSQL executable is resolved to an absolute path and version-validated before cluster mutation.
- Current qualification candidate is exactly PostgreSQL `18.6`; all required tools must report the same exact version during M3 qualification.
- PostgreSQL major `18` is the architecture-level identity. Exact minor `18.6` is implementation/product qualification state. A future 18.x patch update is not a `pg_upgrade` event by itself.
- No silent adoption: a non-empty private-PG target directory without matching authoritative BootstrapState is `RECOVERY_REQUIRED`, never “probably our database”.
- No silent re-initialization: version/identity/placement/port/profile mismatch must fail closed.
- No silent port relocation. The initial port is explicit bootstrap input; after the first committed V2 state, the persisted port is Authority. Relocation is a later explicit bootstrap mutation/recovery operation.
- BootstrapState continues to be mutation-guarded by the authentic, instance-bound M2 ownership capability. M3 must not expose a raw `BootstrapStateStore` bypass.
- BootstrapState V1 remains readable. V1 → V2 is a one-way schema transition. V2 → V1 downgrade is rejected.
- Durable private-PG identity must be portable: store logical `DATA` root + bounded relative path, not an absolute path.
- The selected M3 data placement is:

```text
rootId = DATA
relativePath = private-postgres
```

  `private-postgres` is an `IMPLEMENTATION_CONSTANT` for this layout version, not an inferred common-parent path.
- The initial port is `INSTALLATION_CONFIG` supplied explicitly to the M3 bootstrap call. There is no hardcoded default port and no automatic “pick any free port” behavior in M3.
- PostgreSQL startup is loopback-only. M3 does not expose PostgreSQL on wildcard/external addresses.
- Secret plaintext must not enter:
  - argv;
  - global Host environment mutation;
  - BootstrapState;
  - BootstrapJournal;
  - Problem detail;
  - ordinary logs;
  - test snapshots.
- PostgreSQL bootstrap password delivery uses `BootstrapKeyProvider` + a restricted ephemeral password file consumed by `initdb --pwfile`. The file must be deleted in `finally` paths.
- M3 does not claim Windows ACL/macOS/Linux ownership hardening for the eventual shipping artifact merely because a temp-file test passes. Product ACL/service-account/source-less closure stays `NOT_RUN` until later qualification.
- M3 does not enable proper-lockfile stale takeover. An abandoned M2 bootstrap lock remains bounded Recovery debt for M5.
- M3 does not implement or use normal `SecretService`; `BootstrapKeyProvider != SecretService` remains explicit.
- Do not put PostgreSQL credentials, exact OS paths, or generated cluster identifiers in ordinary config files or locator JSON.
- All behavior-affecting values introduced here must be classified. Specifically:
  - PostgreSQL major 18: `PRODUCT_INVARIANT`;
  - exact qualified version 18.6: `IMPLEMENTATION_CONSTANT / qualification pin`;
  - private-PG relative path: `IMPLEMENTATION_CONSTANT` for data-layout v1;
  - initial/persisted port: `INSTALLATION_CONFIG` then durable bootstrap state;
  - startup/readiness/stop timeouts: explicit M3 bootstrap options classified `INSTALLATION_CONFIG` or bounded internal execution budget; do not hide them as literals;
  - retry count: M3 uses no generic retry loop. Readiness polling interval is an explicit bounded adapter option.

---

# 3. Explicit Non-Goals

M3 MUST NOT implement or materialize:

- `pg` driver as normal application persistence;
- Kysely;
- `PersistenceService`;
- normal product schema/migrations;
- application database/schema inventory;
- DBOS / WorkQueue / Signal;
- PostgreSQL advisory Host lease;
- `HostLeaseConnection`;
- `HostOwnershipFence` / `HostOwnershipToken`;
- bootstrap → Host forward handoff;
- Host → bootstrap reverse handoff;
- automatic abandoned-lock recovery;
- `RecoveryPrincipal` ceremony beyond the existing bounded bootstrap ownership behavior;
- normal `ConfigurationService`;
- normal `SecretService` or OS keyring production backend;
- first-administrator claim;
- RuntimeSubstrate/Cordis;
- RuntimeGraph/Reconciler/ServiceRegistry/CapabilityRegistry;
- Management/CLI/HTTP/Web;
- DBOS migrations or DBOS runtime;
- Subject/Messaging/AI/MCP;
- installer/service wrapper;
- vendored shipping PostgreSQL payload;
- source-less package closure/SBOM/license closure;
- PostgreSQL major upgrade;
- port relocation workflow;
- backup/restore;
- full hostile-filesystem/reparse-point defense beyond currently claimed path policy.

If correctness appears to require any item above, STOP and report the dependency rather than widening M3.

---

# 4. STOP Conditions

STOP implementation and return to architecture/plan review if any of the following becomes true:

1. Private PostgreSQL cannot be safely identified without normal `ConfigurationService`.
2. PostgreSQL bootstrap credential requires normal `SecretService` or PostgreSQL itself.
3. Cluster identity correctness requires Kysely/PersistenceService/application schemas.
4. `PrivatePostgresController` requires Host advisory lease to be correct.
5. Correctness requires DBOS, Cordis, RuntimeReconciler, Management, Subject, or another later-horizon subsystem.
6. A proposed fix requires automatic proper-lockfile stale takeover or a second filesystem lock provider.
7. A proposed first-start path deletes, renames, initializes over, or adopts a non-empty unknown data directory.
8. A proposed runtime path connects to a PostgreSQL server that was not started/validated from the explicit toolchain + recorded cluster.
9. Cross-platform correctness would require claims stronger than evidence available for Node/Execa/PostgreSQL on the tested platforms.
10. Exact PostgreSQL 18.6 has a concrete hard blocker that makes the adopted PostgreSQL 18 route unusable for this boundary. In that case collect evidence and reopen the role/version decision explicitly; do not silently fall back to 17/19/SQLite/system PostgreSQL.
11. M3 expands into multiple independent capability closures instead of the private-PG bootstrap/identity boundary.

---

# 5. Target Repository Shape

After M3, the intended shape is:

```text
packages/
├─ foundation-contracts/
├─ bootstrap-state/
│  └─ src/
│     ├─ model.ts
│     ├─ codec.ts
│     ├─ store.ts
│     ├─ model/codec/store tests
│     └─ index.ts
├─ private-postgres/
│  ├─ package.json
│  ├─ project.json
│  ├─ tsconfig.json
│  ├─ tsconfig.build.json
│  └─ src/
│     ├─ contracts.ts
│     ├─ toolchain.ts
│     ├─ toolchain.test.ts
│     ├─ process-adapter.ts
│     ├─ credential-file.ts
│     ├─ credential-file.test.ts
│     ├─ cluster-layout.ts
│     ├─ cluster-layout.test.ts
│     ├─ cluster-inspection.ts
│     ├─ cluster-inspection.test.ts
│     ├─ controller.ts
│     ├─ controller.integration.test.ts
│     └─ index.ts
└─ bootstrap-runtime/
   └─ src/
      ├─ bootstrap-key-provider.ts
      ├─ bootstrap-key-provider.test.ts
      ├─ private-postgres-bootstrap.ts
      ├─ private-postgres-bootstrap.test.ts
      ├─ private-postgres-bootstrap.integration.test.ts
      ├─ bootstrap-prelude.ts
      ├─ bootstrap-prelude.test.ts
      ├─ bootstrap-state-access.ts
      └─ index.ts

docs/
├─ plans/active/foundation/m3-private-postgresql-bootstrap.md
├─ roadmap/development-roadmap.md
└─ engineering/
   ├─ GOTCHAS.md
   └─ gotchas/bootstrap/...
```

Do not create an `apps/host`, persistence package, DBOS package, Runtime Kernel package, CLI, launcher, installer, or service package in M3.

---

# 6. Public/Internal Interface Contract

The executor may refine private helper names, but the following semantic boundaries are fixed.

## 6.1 `@heptalogos/private-postgres`

`packages/private-postgres/src/contracts.ts`:

```ts
import type {
  ContentDigest,
  InstallationId,
  InstanceId,
} from "@heptalogos/foundation-contracts";

export const PRIVATE_POSTGRES_ARCHITECTURE_MAJOR = 18 as const;
export const PRIVATE_POSTGRES_QUALIFIED_VERSION = "18.6" as const;
export const PRIVATE_POSTGRES_DATA_LAYOUT_VERSION = 1 as const;
export const PRIVATE_POSTGRES_RELATIVE_DATA_PATH = "private-postgres" as const;

export type PrivatePostgresInitializationProfileRevision =
  ContentDigest<"PrivatePostgresInitializationProfileRevision">;

export interface PrivatePostgresToolchain {
  readonly version: "18.6";
  readonly major: 18;
  readonly binDirectory: string;
  readonly postgres: string;
  readonly initdb: string;
  readonly pgCtl: string;
  readonly pgControldata: string;
  readonly pgIsReady: string;
}

export interface PrivatePostgresPlacement {
  readonly rootId: "DATA";
  readonly relativePath: "private-postgres";
  readonly dataLayoutVersion: 1;
  readonly canonicalDataDirectory: string;
}

export interface PrivatePostgresClusterIdentity {
  readonly clusterSystemIdentifier: string;
  readonly postgresMajor: 18;
}

export interface PrivatePostgresExpectedIdentity {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly placement: Omit<PrivatePostgresPlacement, "canonicalDataDirectory">;
  readonly persistedPort: number;
  readonly clusterSystemIdentifier: string;
  readonly initializationProfileRevision: PrivatePostgresInitializationProfileRevision;
}

export interface PrivatePostgresLifecycleOptions {
  readonly startupTimeoutMs: number;
  readonly shutdownTimeoutMs: number;
  readonly readinessPollIntervalMs: number;
}

export interface ReadyPrivatePostgresMechanics {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly identity: PrivatePostgresClusterIdentity;
  readonly port: number;
  stop(): Promise<void>;
  restart(): Promise<void>;
}
```

`ReadyPrivatePostgresMechanics` is an internal Foundation mechanics handle, not Host Authority.

## 6.2 `BootstrapKeyProvider`

`packages/bootstrap-runtime/src/bootstrap-key-provider.ts`:

```ts
import type {
  BootId,
  InstallationId,
  InstanceId,
} from "@heptalogos/foundation-contracts";

export interface BootstrapKeyRequestContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly purpose: "private-postgres-bootstrap-superuser";
}

export interface BootstrapKeyProvider {
  withPrivatePostgresBootstrapPassword<T>(
    context: BootstrapKeyRequestContext,
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
}
```

The callback shape is deliberate: callers receive plaintext only for a bounded in-memory lifetime. M3 provides only test/fake implementations. No production OS keyring backend is added.

## 6.3 BootstrapState V2

`packages/bootstrap-state/src/model.ts` adds:

```ts
import type {
  InstallationId,
  InstanceId,
} from "@heptalogos/foundation-contracts";
import type { ContentDigest } from "@heptalogos/foundation-contracts";

export type PrivatePostgresInitializationProfileRevision =
  ContentDigest<"PrivatePostgresInitializationProfileRevision">;

export interface PrivatePostgresBootstrapStateV1 {
  readonly schemaVersion: 1;
  readonly postgresMajor: 18;
  readonly initializedByPostgresVersion: string;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly dataPlacement: {
    readonly rootId: "DATA";
    readonly relativePath: "private-postgres";
    readonly dataLayoutVersion: 1;
  };
  readonly persistedPort: number;
  readonly clusterSystemIdentifier: string;
  readonly initializationProfileRevision: PrivatePostgresInitializationProfileRevision;
}

export interface BootstrapStateBodyV2 {
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly activeBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly previousBootstrapRuntimeGeneration?: BootstrapRuntimeGenerationId;
  readonly activeProductGeneration: ProductGenerationId;
  readonly lastKnownGoodProductGeneration?: ProductGenerationId;
  readonly lastCommittedOperationRef?: string;
  readonly lastCompletedStageRef?: string;
  readonly privatePostgres: PrivatePostgresBootstrapStateV1;
}

export interface BootstrapStateEnvelopeV2 {
  readonly state: BootstrapStateBodyV2;
  readonly digest: Sha256Digest;
}

export type BootstrapStateBody = BootstrapStateBodyV1 | BootstrapStateBodyV2;
export type BootstrapStateEnvelope = BootstrapStateEnvelopeV1 | BootstrapStateEnvelopeV2;
```

Rules:

```text
EMPTY → V1 or V2 allowed by low-level store
V1 current → V1 next revision allowed for legacy/bootstrap compatibility
V1 current → V2 next revision allowed
V2 current → V2 next revision allowed
V2 current → V1 rejected as bootstrap.state.schema_downgrade
unknown future schema → bootstrap.state.unsupported_schema
```

M3 private-PG orchestration performs the V1 → V2 transition when it commits the first authoritative private-PG identity.

## 6.4 Bootstrap orchestration seam

`packages/bootstrap-runtime/src/private-postgres-bootstrap.ts`:

```ts
import type {
  PrivatePostgresLifecycleOptions,
  PrivatePostgresToolchain,
  ReadyPrivatePostgresMechanics,
} from "@heptalogos/private-postgres";
import type { BootstrapKeyProvider } from "./bootstrap-key-provider.js";

export interface PreparePrivatePostgresOptions {
  readonly toolchainBinDirectory: string;
  readonly initialPort?: number;
  readonly lifecycle: PrivatePostgresLifecycleOptions;
  readonly keyProvider: BootstrapKeyProvider;
}

export interface ReadyPrivatePostgres {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly port: number;
  readonly clusterSystemIdentifier: string;
  readonly toolchainVersion: "18.6";
  readonly mechanics: ReadyPrivatePostgresMechanics;
}
```

Rules:

- `initialPort` is required only when authoritative BootstrapState does not yet contain private-PG state.
- If BootstrapState V2 already contains private-PG state, a supplied `initialPort` must either be absent or equal the persisted port; mismatch is a structured conflict and never causes relocation.
- `preparePrivatePostgres` is callable only from an authentic `OwnedBootstrapPrelude` path. Do not export an orchestration function that accepts a structurally forgeable “owned” argument from arbitrary callers.

Recommended API integration:

```ts
export interface OwnedBootstrapPrelude {
  // existing fields ...
  preparePrivatePostgres(options: PreparePrivatePostgresOptions): Promise<ReadyPrivatePostgres>;
  close(): Promise<void>;
}
```

The returned `ReadyPrivatePostgres` does not release the bootstrap lease. `OwnedBootstrapPrelude.close()` remains responsible for releasing bootstrap ownership; M3 tests must prove the lease stays held while PostgreSQL is ready.

---

# 7. Preflight — Establish Exact Execution Baseline

- [ ] Read root `AGENTS.md` before editing.
- [ ] Read every Authority file listed in the plan header.
- [ ] Read `docs/engineering/GOTCHAS.md` and `docs/engineering/PLAYBOOK.md` plus bootstrap subentries.
- [ ] Confirm the current active-plan set:

```bash
find docs/plans/active -type f -not -name '.gitkeep' -print
```

Expected at authoring baseline: no active plan. If another overlapping active Foundation plan exists, STOP and resolve plan authority first.

- [ ] Confirm repository state:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse master
```

Expected at authoring baseline:

```text
working tree = clean
branch = master
HEAD/master = fdc2af95e4c90b6ca0093ab96fd72a808e05ed57
```

If `master` has moved, inspect the new commits and record the actual base SHA in this plan's Execution Record before implementation.

- [ ] Confirm execution toolchain:

```bash
node --version
pnpm --version
```

Expected repository lane:

```text
v24.19.0
11.22.0
```

- [ ] Establish inherited green baseline:

```bash
pnpm install --frozen-lockfile
pnpm nx reset
pnpm verify
```

Expected: PASS. If baseline fails before M3 changes, STOP and classify the failure; do not absorb unrelated repair into M3 without explicit scope review.

- [ ] Create the isolated feature branch/worktree using repository policy:

```text
dev/m3-private-postgresql-bootstrap
```

- [ ] Create Draft PR immediately after the plan-activation commit, according to repository workflow.

---

# 8. Task 0 — Activate M3 and Reconcile Repository Truth

**Files:**

- Create: `docs/plans/active/foundation/m3-private-postgresql-bootstrap.md`
- Modify: `docs/plans/README.md`
- Modify: `docs/roadmap/development-roadmap.md`
- Conditionally modify: `docs/plans/completed/foundation/m2-pre-postgresql-bootstrap-substrate.md`
- Conditionally modify: qualification result metadata only if exact evidence is available and the existing format has a canonical place for it.

**Produces:** one authoritative active M3 plan and current planning/evidence truth before product code changes.

- [ ] **Step 1: Save this exact approved plan to the canonical active path.**

Do not paraphrase it into a shorter implementation checklist.

- [ ] **Step 2: Update `docs/plans/README.md`.**

Change Active from “No active plans” to:

```markdown
## Active

- [Foundation M3 Private PostgreSQL Bootstrap & Identity](active/foundation/m3-private-postgresql-bootstrap.md) — `ACTIVE`
```

Keep all completed-plan entries.

- [ ] **Step 3: Refresh roadmap current-state facts without changing Architecture semantics.**

Required corrections:

```text
repository baseline → master@fdc2af95e4c90b6ca0093ab96fd72a808e05ed57 (M2 merged)
H1 progress → M2 pre-PG substrate closed; private PG/Host ownership/recovery remain
PostgreSQL current stable 18 minor snapshot → 18.6, released 2026-08-13
PostgreSQL 18.5 → explicitly note never released due regression if the snapshot discusses version sequence
M2 stale takeover → automatic takeover intentionally disabled; abandoned lock remains recovery-required
```

Do not change the H1 Authority chain or architecture route `PostgreSQL 18`.

- [ ] **Step 4: Reconcile the M2 closure record only from exact evidence.**

The merged M2 file still contains pre-finalization `independent review = NOT_RUN` / `final cross-platform CI = NOT_RUN` text because no post-review commit was allowed. Inspect the actual review/final-CI evidence for reviewed SHA:

```text
36a2215bb070379c093fc03d5758794e4bc1950b
```

If exact independent-review and Windows/macOS/Linux final-CI run/job evidence is retrievable, append a post-merge closure addendum with exact reviewed SHA + run IDs/job conclusions. If that evidence is not retrievable, **do not write PASS from memory or chat history**; leave the historical record intact and record an evidence-provenance gap as `BLOCKED` in M3's Execution Record. This documentation gap is not permission to rerun or change M2 code.

- [ ] **Step 5: Run documentation/governance gates.**

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm format:check
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add docs/plans/active/foundation/m3-private-postgresql-bootstrap.md \
  docs/plans/README.md \
  docs/roadmap/development-roadmap.md \
  docs/plans/completed/foundation/m2-pre-postgresql-bootstrap-substrate.md

git commit -m "docs: activate Foundation M3 private PostgreSQL plan"
```

Only stage the M2 completed plan if it was actually changed from exact evidence.

---

# 9. Task 1 — Materialize the `private-postgres` Package Boundary

**Files:**

- Create: `packages/private-postgres/package.json`
- Create: `packages/private-postgres/project.json`
- Create: `packages/private-postgres/tsconfig.json`
- Create: `packages/private-postgres/tsconfig.build.json`
- Create: `packages/private-postgres/src/contracts.ts`
- Create: `packages/private-postgres/src/index.ts`
- Modify: `packages/bootstrap-runtime/package.json`
- Modify: `packages/bootstrap-runtime/tsconfig.json`
- Modify: `packages/bootstrap-runtime/tsconfig.build.json`
- Modify: root `tsconfig.json`
- Modify: `scripts/verify/boundaries.mjs`
- Modify: `tools/repo-kit/test/boundaries.test.mjs`

**Consumes:** `@heptalogos/foundation-contracts`, Catalog `execa@10.0.1`.

**Produces:** a buildable private-PG mechanics package with mechanical dependency routing.

- [ ] **Step 1: Write boundary regression tests first.**

Add tests proving:

```text
packages/private-postgres/** may import execa
packages/bootstrap-runtime/** may NOT import execa directly
another future package may NOT import execa until dependency-routing authority is deliberately expanded
cross-workspace relative import into private-postgres internals is rejected
@heptalogos/private-postgres package import from bootstrap-runtime is allowed
```

Run:

```bash
pnpm exec vitest run tools/repo-kit/test/boundaries.test.mjs
```

Expected before boundary implementation: FAIL for at least the new Execa/private-PG routing assertions.

- [ ] **Step 2: Create package metadata.**

`packages/private-postgres/package.json` must follow existing package shape:

```json
{
  "name": "@heptalogos/private-postgres",
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
    "execa": "catalog:"
  },
  "devDependencies": {
    "vitest": "catalog:"
  }
}
```

Do not add `pg`, Kysely, Ajv, TypeBox, DBOS, Testcontainers, or another process package.

- [ ] **Step 3: Create Nx project metadata.**

`project.json`:

```json
{
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "name": "private-postgres",
  "projectType": "library",
  "sourceRoot": "packages/private-postgres/src",
  "targets": {
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "eslint packages/private-postgres"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run --root packages/private-postgres --exclude **/*.integration.test.ts"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run --root packages/private-postgres src/controller.integration.test.ts"
      }
    }
  }
}
```

The integration target must fail with a bounded preflight error if `HEPTALOGOS_TEST_PG_BIN` is absent or does not point to exact PostgreSQL 18.6. It must not silently skip and report green.

- [ ] **Step 4: Create TS project files by mirroring the existing repository library pattern.**

`tsconfig.json` references `../foundation-contracts`. `tsconfig.build.json` references `../foundation-contracts/tsconfig.build.json`. Do not reference bootstrap-runtime or bootstrap-state from private-postgres.

- [ ] **Step 5: Add root/build references.**

Root `tsconfig.json` order:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/foundation-contracts" },
    { "path": "./packages/bootstrap-state" },
    { "path": "./packages/private-postgres" },
    { "path": "./packages/bootstrap-runtime" }
  ]
}
```

Add `@heptalogos/private-postgres: workspace:*` to `bootstrap-runtime/package.json`, and add matching TS references in bootstrap-runtime TS configs.

- [ ] **Step 6: Create `contracts.ts` and a minimal `index.ts` exporting only Heptalogos-owned contracts/constants.**

Do not export Execa types or subprocess result types.

- [ ] **Step 7: Implement the boundary verifier rule and run gates.**

```bash
pnpm exec vitest run tools/repo-kit/test/boundaries.test.mjs
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
pnpm build
```

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add packages/private-postgres \
  packages/bootstrap-runtime/package.json \
  packages/bootstrap-runtime/tsconfig.json \
  packages/bootstrap-runtime/tsconfig.build.json \
  tsconfig.json \
  scripts/verify/boundaries.mjs \
  tools/repo-kit/test/boundaries.test.mjs \
  pnpm-lock.yaml

git commit -m "feat: establish private PostgreSQL mechanics boundary"
```

---

# 10. Task 2 — Resolve and Validate the Exact PostgreSQL Toolchain

**Files:**

- Create: `packages/private-postgres/src/toolchain.ts`
- Create: `packages/private-postgres/src/toolchain.test.ts`
- Create: `packages/private-postgres/src/process-adapter.ts`
- Modify: `packages/private-postgres/src/index.ts`

**Produces:** `resolvePrivatePostgresToolchain(binDirectory): Promise<PrivatePostgresToolchain>`.

- [ ] **Step 1: Write pure parsing tests.**

Required version parser cases:

```ts
expect(parsePostgresVersion("postgres (PostgreSQL) 18.6\n")).toEqual({ major: 18, version: "18.6" });
expect(parsePostgresVersion("pg_ctl (PostgreSQL) 18.6\n")).toEqual({ major: 18, version: "18.6" });
expect(() => parsePostgresVersion("postgres (PostgreSQL) 18.4\n")).toThrow();
expect(() => parsePostgresVersion("postgres (PostgreSQL) 19beta3\n")).toThrow();
expect(() => parsePostgresVersion("garbage")).toThrow();
```

Do not make the parser permissive enough to accept arbitrary “18.x” during M3 qualification.

- [ ] **Step 2: Write toolchain path tests.**

Test deterministic platform executable naming:

```text
POSIX: postgres, initdb, pg_ctl, pg_controldata, pg_isready
Windows: postgres.exe, initdb.exe, pg_ctl.exe, pg_controldata.exe, pg_isready.exe
```

Reject a relative `binDirectory`. Reject missing/non-file tools. Do not search PATH.

- [ ] **Step 3: Run tests and confirm RED.**

```bash
pnpm exec vitest run packages/private-postgres/src/toolchain.test.ts
```

- [ ] **Step 4: Implement `process-adapter.ts`.**

Only this adapter imports Execa. It exposes a private Heptalogos result shape, for example:

```ts
interface PostgresProcessResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export async function runPostgresTool(
  executable: string,
  args: readonly string[],
  options: {
    readonly cwd?: string;
    readonly timeoutMs: number;
    readonly env?: Readonly<Record<string, string>>;
  },
): Promise<PostgresProcessResult>;
```

Rules:

- `shell: false`;
- absolute executable path required;
- no command string concatenation;
- no secret values in diagnostic command rendering;
- do not mutate `process.env`;
- sanitize PostgreSQL-affecting inherited env keys before execution (`PGDATA`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, `PGSERVICE`, `PGSERVICEFILE`, `PGPASSFILE`, `PGOPTIONS`);
- force deterministic diagnostic language where practical with `LC_ALL=C`, `LANG=C`, `PG_COLOR=never`, while preserving platform environment required to execute the binary;
- map timeout/process-launch errors into bounded canonical `ProblemError` values; do not leak full environment or secrets.

- [ ] **Step 5: Implement `resolvePrivatePostgresToolchain`.**

Algorithm:

```text
require absolute bin directory
→ derive five required absolute executable paths
→ lstat each and require regular file
→ run each with --version
→ parse exact version
→ require every version == 18.6 and major == 18
→ return frozen PrivatePostgresToolchain
```

A mixed directory such as `postgres 18.6 + pg_ctl 18.4` must fail.

- [ ] **Step 6: Run tests/gates.**

```bash
pnpm exec vitest run packages/private-postgres/src/toolchain.test.ts
pnpm nx run private-postgres:lint
pnpm typecheck
pnpm tsc6
pnpm check:boundaries
```

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add packages/private-postgres/src/toolchain.ts \
  packages/private-postgres/src/toolchain.test.ts \
  packages/private-postgres/src/process-adapter.ts \
  packages/private-postgres/src/index.ts

git commit -m "feat: validate exact PostgreSQL bootstrap toolchain"
```

---

# 11. Task 3 — Add the Minimal Bootstrap Credential Boundary

**Files:**

- Create: `packages/bootstrap-runtime/src/bootstrap-key-provider.ts`
- Create: `packages/bootstrap-runtime/src/bootstrap-key-provider.test.ts`
- Create: `packages/private-postgres/src/credential-file.ts`
- Create: `packages/private-postgres/src/credential-file.test.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Produces:** a bounded secret-delivery contract plus restricted ephemeral pwfile mechanics.

- [ ] **Step 1: Write `BootstrapKeyProvider` lifetime tests.**

Use a test provider that:

- allocates a fresh `Uint8Array` inside `withPrivatePostgresBootstrapPassword`;
- invokes the callback exactly once;
- zeroes its local buffer in `finally`;
- never stores the plaintext in a public field/log.

Assert the production contract is callback-scoped and does not expose a `getPassword(): string` convenience method.

- [ ] **Step 2: Write credential-file tests.**

`withRestrictedPasswordFile(tempRoot, passwordUtf8, use)` must:

```text
create one fresh unpredictable filename under validated TEMP root
write password + single newline
use restrictive file mode where the platform supports the Node mode contract
invoke callback with absolute path
unlink file in finally after callback success
unlink file in finally after callback throw
never return password text
never include password in thrown Problem
```

After callback completion:

```ts
await expect(access(path)).rejects.toMatchObject({ code: "ENOENT" });
```

Do not claim this unit test proves final Windows ACL/service-account secrecy.

- [ ] **Step 3: Run tests and confirm RED.**

```bash
pnpm exec vitest run \
  packages/bootstrap-runtime/src/bootstrap-key-provider.test.ts \
  packages/private-postgres/src/credential-file.test.ts
```

- [ ] **Step 4: Implement the minimal interfaces/helpers.**

Credential file creation must use Node filesystem primitives directly; do not add a secret-file dependency. Secret delivery mode is the S04 `RESTRICTED_EPHEMERAL_FILE` path.

- [ ] **Step 5: Export only the Heptalogos `BootstrapKeyProvider` contract from bootstrap-runtime.**

Do not export the test provider. `credential-file.ts` may remain package-internal unless controller tests need a public mechanics function; prefer internal.

- [ ] **Step 6: Run gates.**

```bash
pnpm exec vitest run \
  packages/bootstrap-runtime/src/bootstrap-key-provider.test.ts \
  packages/private-postgres/src/credential-file.test.ts
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
pnpm lint
```

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add packages/bootstrap-runtime/src/bootstrap-key-provider.ts \
  packages/bootstrap-runtime/src/bootstrap-key-provider.test.ts \
  packages/bootstrap-runtime/src/index.ts \
  packages/private-postgres/src/credential-file.ts \
  packages/private-postgres/src/credential-file.test.ts

git commit -m "feat: add scoped bootstrap PostgreSQL credential delivery"
```

---

# 12. Task 4 — Evolve BootstrapState to V2 Without Breaking V1 Recovery

**Files:**

- Modify: `packages/bootstrap-state/src/model.ts`
- Modify: `packages/bootstrap-state/src/codec.ts`
- Modify: `packages/bootstrap-state/src/store.ts`
- Modify: `packages/bootstrap-state/src/index.ts`
- Modify: `packages/bootstrap-state/src/codec.test.ts`
- Modify: `packages/bootstrap-state/src/store.test.ts`
- Modify: `packages/bootstrap-state/src/platform-behavior.test.ts` only if type fixtures require it
- Modify: `packages/bootstrap-runtime/src/bootstrap-state-access.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-state-access.test.ts`

**Produces:** V1 readable, V2 readable/writeable, one-way schema transition, ownership-guarded V2 commits.

- [ ] **Step 1: Add failing V2 codec tests.**

Cover:

```text
V1 valid fixture → parses as schemaVersion 1
V2 valid fixture → parses as schemaVersion 2
V2 unknown field → invalid_schema
V2 bad UUID/port/system identifier/digest → invalid_schema or digest_mismatch as appropriate
schemaVersion 3 → bootstrap.state.unsupported_schema
V1 digest still uses heptalogos.bootstrap-state/v1
V2 digest uses heptalogos.bootstrap-state/v2
```

Port schema:

```text
integer 1..65535
```

Cluster system identifier schema:

```text
non-empty decimal string, preserve as string; never coerce to JS number
```

- [ ] **Step 2: Add failing store transition tests.**

Cover:

```text
EMPTY → V1 revision 1 PASS
EMPTY → V2 revision 1 PASS
V1 rev1 → V1 rev2 PASS
V1 rev1 → V2 rev2 PASS
V2 rev2 → V2 rev3 PASS
V2 rev2 → V1 rev3 FAIL bootstrap.state.schema_downgrade
revision jump/backward → bootstrap.state.revision_conflict
corrupt current + valid previous V1/V2 recovery semantics unchanged
```

- [ ] **Step 3: Add failing bootstrap ownership tests for V2 mutation.**

A genuine matching lease can commit V2. Fake/released/compromised/cross-instance lease remains rejected before disk mutation.

- [ ] **Step 4: Run focused RED suite.**

```bash
pnpm exec vitest run \
  packages/bootstrap-state/src/codec.test.ts \
  packages/bootstrap-state/src/store.test.ts \
  packages/bootstrap-runtime/src/bootstrap-state-access.test.ts
```

- [ ] **Step 5: Implement model union and dual-schema parser.**

Do not weaken Ajv profile:

```text
coerceTypes = false
removeAdditional = false
useDefaults = false
strict = true
```

The parser must first JSON-parse, inspect `state.schemaVersion` only as a discriminator, then validate against the exact schema. Never mutate caller input.

- [ ] **Step 6: Implement domain-separated V2 sealing.**

Keep existing V1 digest semantics byte-for-byte compatible. Add V2 domain:

```text
heptalogos.bootstrap-state/v2
```

- [ ] **Step 7: Implement store one-way schema transition.**

Do not automatically rewrite a V1 state merely because it was read. Migration occurs only through an explicit next revision commit under bootstrap ownership.

- [ ] **Step 8: Update `OwnedBootstrapStateStore` types.**

It must load the union and commit allowed V1/V2 bodies while preserving `assertBootstrapOwnershipFor(...)` on every commit.

- [ ] **Step 9: Run focused/full gates.**

```bash
pnpm exec vitest run \
  packages/bootstrap-state/src/codec.test.ts \
  packages/bootstrap-state/src/store.test.ts \
  packages/bootstrap-state/src/platform-behavior.test.ts \
  packages/bootstrap-runtime/src/bootstrap-state-access.test.ts
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
pnpm test
```

Expected: PASS with only pre-existing platform-specific skips where legitimately not runnable.

- [ ] **Step 10: Commit.**

```bash
git add packages/bootstrap-state/src \
  packages/bootstrap-runtime/src/bootstrap-state-access.ts \
  packages/bootstrap-runtime/src/bootstrap-state-access.test.ts

git commit -m "feat: persist private PostgreSQL identity in BootstrapState V2"
```

---

# 13. Task 5 — Define Portable Cluster Placement and Inspection

**Files:**

- Create: `packages/private-postgres/src/cluster-layout.ts`
- Create: `packages/private-postgres/src/cluster-layout.test.ts`
- Create: `packages/private-postgres/src/cluster-inspection.ts`
- Create: `packages/private-postgres/src/cluster-inspection.test.ts`
- Modify: `packages/private-postgres/src/index.ts`

**Produces:** portable placement calculation and stable parsing/inspection primitives.

- [ ] **Step 1: Write layout tests.**

Given canonical DATA root `/x/data` (or Windows equivalent), placement resolves exactly one child:

```text
DATA/private-postgres
```

Assertions:

- result remains under DATA after path resolution;
- relative path is exactly `private-postgres`;
- no common-parent assumption with INSTANCE/LOG/TEMP;
- relative or malformed DATA root is rejected;
- the function does not create/delete the directory.

- [ ] **Step 2: Write directory classification tests.**

Implement a pure/bounded classification:

```ts
type ClusterDirectoryState =
  | { kind: "ABSENT" }
  | { kind: "EMPTY" }
  | { kind: "NON_EMPTY"; entryCountLowerBound: number };
```

Do not treat presence of `PG_VERSION` as proof of ownership.

- [ ] **Step 3: Write `pg_controldata` parsing tests using deterministic C-locale fixtures.**

Extract at minimum:

```text
Database system identifier
Database cluster state
Catalog version number (diagnostics only)
Data page checksum version (diagnostics/validation)
```

Preserve system identifier as decimal string.

If current PostgreSQL 18 output on Windows/macOS/Linux differs materially under the forced C locale, STOP and adjust the parser based on real evidence rather than regex guesswork.

- [ ] **Step 4: Write `PG_VERSION` validation tests.**

Only exact major text `18` is accepted for the architecture major. Missing/malformed/other major is a structured Problem.

- [ ] **Step 5: Run RED suite.**

```bash
pnpm exec vitest run \
  packages/private-postgres/src/cluster-layout.test.ts \
  packages/private-postgres/src/cluster-inspection.test.ts
```

- [ ] **Step 6: Implement layout/classification/parsing.**

No directory mutation in inspection functions.

- [ ] **Step 7: Run gates.**

```bash
pnpm exec vitest run \
  packages/private-postgres/src/cluster-layout.test.ts \
  packages/private-postgres/src/cluster-inspection.test.ts
pnpm nx run private-postgres:lint
pnpm typecheck
pnpm tsc6
```

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add packages/private-postgres/src/cluster-layout.ts \
  packages/private-postgres/src/cluster-layout.test.ts \
  packages/private-postgres/src/cluster-inspection.ts \
  packages/private-postgres/src/cluster-inspection.test.ts \
  packages/private-postgres/src/index.ts

git commit -m "feat: define portable private PostgreSQL cluster identity"
```

---

# 14. Task 6 — Implement Safe First Initialization

**Files:**

- Create: `packages/private-postgres/src/controller.ts`
- Create: `packages/private-postgres/src/controller.integration.test.ts`
- Modify: `packages/private-postgres/src/index.ts`

**Consumes:** validated toolchain, validated placement, restricted password file, explicit initial port, explicit lifecycle options.

**Produces:** mechanics to initialize a new cluster only when the caller has already proven first-initialization eligibility.

- [ ] **Step 1: Add real-PG integration preflight.**

At the top of the integration suite:

```ts
const pgBin = process.env.HEPTALOGOS_TEST_PG_BIN;
if (!pgBin) {
  throw new Error("BLOCKED: HEPTALOGOS_TEST_PG_BIN is required for private PostgreSQL integration qualification");
}
```

Then call the real toolchain validator; exact version mismatch must fail before tests mutate a cluster.

Default `pnpm test` excludes this file. `nx run private-postgres:test:integration` includes it and therefore cannot false-green without real PostgreSQL.

- [ ] **Step 2: Write first-init integration tests before implementation.**

Using a temporary DATA/TEMP/LOG root set and a real 18.6 toolchain, prove:

```text
ABSENT/EMPTY target → initialization succeeds
NON_EMPTY target → initialization refuses before initdb
password not present in captured argv
password not present in Problem/log snapshots
PG_VERSION == 18
pg_controldata returns stable system identifier
checksums are enabled
host auth is SCRAM
recorded profile revision is deterministic
```

Do not assert production ACL qualification from the temp-directory test.

- [ ] **Step 3: Define deterministic initialization profile.**

The profile semantics are:

```text
encoding = UTF8
dataChecksums = enabled
host authentication = scram-sha-256
local authentication = scram-sha-256 where applicable
listen_addresses = 127.0.0.1
persisted port = explicit installation input
Unix socket exposure = disabled where PostgreSQL/platform supports the configured setting
```

Compute `initializationProfileRevision` from canonical JSON of the semantic profile using the existing Foundation canonical digest primitive. Do not include absolute paths, passwords, BootId, timestamps, or machine hostname in this digest.

- [ ] **Step 4: Implement `initdb` invocation.**

Required characteristics:

- explicit absolute `initdb` path;
- explicit `-D` target;
- explicit UTF-8 encoding;
- explicit SCRAM auth settings;
- password only via an argument constructed as ``--pwfile=${passwordFilePath}``, where `passwordFilePath` is the absolute path created by `withRestrictedPasswordFile`;
- no shell;
- bounded timeout from options;
- structured Problem on failure;
- no cleanup that deletes a partially initialized directory after failure. Partial state must remain visible for bounded recovery instead of being hidden.

- [ ] **Step 5: Materialize Heptalogos PostgreSQL runtime profile.**

After successful initdb, write an explicitly owned PostgreSQL config fragment or deterministic config update that sets at least:

```text
listen_addresses = '127.0.0.1'
port = persistedPort
password_encryption = 'scram-sha-256'
```

On POSIX, disable external Unix-socket exposure if the exact PostgreSQL setting is portable enough under evidence; if this cannot be made cross-platform without overclaiming, keep Unix socket behavior explicitly documented/qualified rather than inventing platform conditionals. The authoritative requirement is that TCP exposure is loopback-only.

Validate effective settings with PostgreSQL's own config inspection mechanics where practical rather than trusting a handwritten parser.

- [ ] **Step 6: Inspect initialized cluster identity.**

After initdb/config materialization:

```text
PG_VERSION == 18
pg_controldata system identifier captured
checksum state validated
profile revision computed
```

Return a mechanics initialization result containing no secret.

- [ ] **Step 7: Run real integration suite.**

With `HEPTALOGOS_TEST_PG_BIN` pointing at official PostgreSQL 18.6 binaries:

```bash
pnpm nx run private-postgres:test:integration
```

Expected: PASS on the current host.

If no 18.6 runtime is available on the current host, record `BLOCKED`, not PASS, and do not fake the integration with mocks.

- [ ] **Step 8: Run ordinary gates.**

```bash
pnpm nx run private-postgres:test
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
pnpm lint
```

- [ ] **Step 9: Commit.**

```bash
git add packages/private-postgres/src/controller.ts \
  packages/private-postgres/src/controller.integration.test.ts \
  packages/private-postgres/src/index.ts

git commit -m "feat: initialize private PostgreSQL clusters fail-safe"
```

---

# 15. Task 7 — Validate an Existing Authoritative Cluster

**Files:**

- Modify: `packages/private-postgres/src/controller.ts`
- Modify: `packages/private-postgres/src/controller.integration.test.ts`
- Modify: `packages/private-postgres/src/cluster-inspection.ts`
- Modify tests as required

**Produces:** validation that an existing cluster matches durable BootstrapState identity before start.

- [ ] **Step 1: Add mismatch integration tests.**

Create a known real cluster, then construct expected identities with exactly one altered field per test:

```text
postgres major mismatch
cluster system identifier mismatch
DATA placement relative-path/layout mismatch
persisted port mismatch at orchestration boundary
initialization profile revision mismatch
InstallationId mismatch at orchestration boundary
InstanceId mismatch at orchestration boundary
```

Expected for every mismatch:

```text
structured Problem
no initdb
no directory delete
no port relocation
no server start
```

- [ ] **Step 2: Add unknown-directory test.**

A non-empty `DATA/private-postgres` with no authoritative private-PG BootstrapState must produce recovery-required semantics. Even if it contains a valid-looking `PG_VERSION`, it is not adopted automatically.

- [ ] **Step 3: Implement `validateExistingCluster`.**

It reads only bounded PostgreSQL/FS metadata and compares against `PrivatePostgresExpectedIdentity`. It must not connect to a server and must not mutate the cluster.

- [ ] **Step 4: Run integration suite.**

```bash
pnpm nx run private-postgres:test:integration
```

Expected: PASS with exact 18.6 runtime.

- [ ] **Step 5: Commit.**

```bash
git add packages/private-postgres/src/controller.ts \
  packages/private-postgres/src/controller.integration.test.ts \
  packages/private-postgres/src/cluster-inspection.ts \
  packages/private-postgres/src/cluster-inspection.test.ts

git commit -m "feat: validate authoritative private PostgreSQL identity"
```

---

# 16. Task 8 — Start, Prove Readiness, Stop, and Restart the Same Cluster

**Files:**

- Modify: `packages/private-postgres/src/controller.ts`
- Modify: `packages/private-postgres/src/controller.integration.test.ts`
- Modify: `packages/private-postgres/src/contracts.ts`

**Produces:** `ReadyPrivatePostgresMechanics` for the exact cluster.

- [ ] **Step 1: Add lifecycle integration tests.**

Prove:

```text
initialized cluster → start → ready
ready cluster → stop → stopped
stopped cluster → restart → ready
cluster system identifier before/after restart is identical
port before/after restart is identical
log file is under logical LOG root, not DATA/INSTANCE common parent
second unrelated process occupying persisted port → start fails; no relocation
unexpected server exit → readiness/lifecycle method reports failure; no auto-init
```

- [ ] **Step 2: Implement controlled `pg_ctl` lifecycle.**

Use absolute validated `pg_ctl` path. Start with explicit data dir and log target. Stop mode defaults to bounded `fast` shutdown for M3 tests unless Corpus/repository policy already dictates another exact normal-shutdown mode. Do not use `immediate` as the normal path.

- [ ] **Step 3: Implement bounded readiness.**

Readiness loop:

```text
until startupTimeoutMs deadline:
  verify pg_ctl/status process state as appropriate
  run pg_isready with host `127.0.0.1` and `port = persistedPort`
  if accepting → success
  if process exited → fail immediately
  wait readinessPollIntervalMs
on deadline → structured timeout Problem
```

No unbounded retry loop. No fallback to another port/address.

- [ ] **Step 4: Re-inspect identity after readiness.**

The controller must retain the placement/system identifier validated before start. It does not treat “something accepts connections on the port” as sufficient ownership proof.

- [ ] **Step 5: Run integration/gates.**

```bash
pnpm nx run private-postgres:test:integration
pnpm nx run private-postgres:test
pnpm typecheck
pnpm tsc6
pnpm lint
```

Expected: PASS on current host with exact runtime.

- [ ] **Step 6: Commit.**

```bash
git add packages/private-postgres/src/contracts.ts \
  packages/private-postgres/src/controller.ts \
  packages/private-postgres/src/controller.integration.test.ts

git commit -m "feat: control private PostgreSQL lifecycle"
```

---

# 17. Task 9 — Orchestrate Private PostgreSQL Under Authentic Bootstrap Ownership

**Files:**

- Create: `packages/bootstrap-runtime/src/private-postgres-bootstrap.ts`
- Create: `packages/bootstrap-runtime/src/private-postgres-bootstrap.test.ts`
- Create: `packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.test.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Produces:** `OwnedBootstrapPrelude.preparePrivatePostgres(...) → ReadyPrivatePostgres`.

- [ ] **Step 1: Write ownership-gate tests first.**

The private-PG orchestration path must be reachable only from a genuine `OwnedBootstrapPrelude`. Regression tests must prove:

```text
PreparedBootstrapPrelude has no preparePrivatePostgres
structural fake object cannot call internal orchestration bypass
released bootstrap ownership → preparation rejected before cluster mutation
compromised ownership → preparation rejected before cluster mutation
same-instance genuine ownership → allowed
```

Do not reintroduce the forgeable Authority defect fixed in M2.

- [ ] **Step 2: Write first-init orchestration integration test.**

Arrange:

```text
strict locator
independent DATA/TEMP/LOG roots
BootstrapState current = V1 (or EMPTY if fixture supports first materialization)
authentic bootstrap ownership
explicit initialPort
real exact PG 18.6 toolchain
fake callback-scoped BootstrapKeyProvider
```

Act:

```text
preparePrivatePostgres(...)
```

Assert:

```text
cluster initialized
BootstrapState becomes V2 at exactly next revision
privatePostgres.installationId/instanceId match locator
portable placement is DATA/private-postgres
persisted port equals explicit initialPort
system identifier equals pg_controldata result
password absent from state/journal/problems
ReadyPrivatePostgres returned
bootstrap ownership remains HELD
```

- [ ] **Step 3: Write restart orchestration integration test.**

Close PostgreSQL mechanics but preserve roots/state, start a new BootId/bootstrap attempt, reacquire bootstrap ownership, call `preparePrivatePostgres` without a new initial port, and assert:

```text
no initdb occurs
same persisted port
same cluster system identifier
same InstallationId/InstanceId
V2 state remains authoritative
PostgreSQL becomes ready
```

- [ ] **Step 4: Write explicit port-conflict test.**

If V2 persists port X and caller supplies `initialPort=Y`, return a structured conflict before start or mutation. M3 does not reinterpret this as relocation intent.

- [ ] **Step 5: Implement orchestration algorithm.**

Required order:

```text
assert authentic current bootstrap ownership
→ resolve exact toolchain
→ resolve DATA/TEMP/LOG private-PG paths
→ authoritative BootstrapState load already available / re-read if needed
→ classify state + cluster directory

case A: state has no privatePostgres
  require explicit initialPort
  require target ABSENT/EMPTY
  obtain bootstrap password via callback-scoped BootstrapKeyProvider
  initialize cluster
  inspect identity
  construct next-revision BootstrapState V2 from current semantic fields + privatePostgres record
  commit V2 while ownership HELD
  start cluster
  prove readiness

case B: state is V2 with privatePostgres
  reject conflicting supplied initialPort
  validate InstallationId/InstanceId/placement/profile/major/system identifier
  start cluster
  prove readiness

case C: state lacks privatePostgres AND target NON_EMPTY
  fail recovery-required; do not initialize/adopt/delete

case D: state CORRUPT / mismatched identity
  fail closed; do not initialize/start
```

- [ ] **Step 6: Journal bounded M3 stages.**

Extend BootstrapJournal stage vocabulary only with safe metadata; do not store secret/path dumps. Suggested stages:

```text
bootstrap.postgres.toolchain_validated
bootstrap.postgres.cluster_initialization_started
bootstrap.postgres.cluster_initialized
bootstrap.postgres.identity_committed
bootstrap.postgres.cluster_validated
bootstrap.postgres.start_started
bootstrap.postgres.ready
bootstrap.postgres.failed
```

Journal continues to be evidence/projection, never Authority.

- [ ] **Step 7: Keep ownership held.**

`preparePrivatePostgres` must not release M2 ownership. `OwnedBootstrapPrelude.close()` remains the only existing explicit release path. Add a test that a second bootstrap contender remains blocked while `ReadyPrivatePostgres` exists.

- [ ] **Step 8: Run focused tests.**

```bash
pnpm exec vitest run \
  packages/bootstrap-runtime/src/private-postgres-bootstrap.test.ts \
  packages/bootstrap-runtime/src/bootstrap-prelude.test.ts
```

Then with exact PG runtime:

```bash
pnpm exec vitest run packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts
```

Integration test must fail/record BLOCKED when exact runtime input is unavailable; do not silently skip during qualification.

- [ ] **Step 9: Run gates.**

```bash
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
pnpm lint
pnpm test
pnpm build
```

Expected: PASS.

- [ ] **Step 10: Commit.**

```bash
git add packages/bootstrap-runtime/src/private-postgres-bootstrap.ts \
  packages/bootstrap-runtime/src/private-postgres-bootstrap.test.ts \
  packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts \
  packages/bootstrap-runtime/src/bootstrap-prelude.ts \
  packages/bootstrap-runtime/src/bootstrap-prelude.test.ts \
  packages/bootstrap-runtime/src/index.ts

git commit -m "feat: bootstrap validated private PostgreSQL under ownership"
```

---

# 18. Task 10 — Crash/Failure Matrix and No-Silent-Adoption Proof

**Files:**

- Modify/add fixtures under `packages/private-postgres/test/` or `packages/bootstrap-runtime/test/` only where a separate process is necessary
- Modify: integration test files from Tasks 6–9
- Add a GOTCHA only if execution discovers a reusable PostgreSQL/Execa/platform failure mode not already documented

**Produces:** executable evidence for the unsafe boundaries M3 is specifically intended to close.

- [ ] **Step 1: Add fault injection seam only at orchestration test boundary.**

Do not add product feature flags. A test-only internal hook may stop the test after named phases:

```text
after-initdb-before-state-commit
after-state-commit-before-start
after-start-before-ready-return
```

Keep the hook non-exported from package public API.

- [ ] **Step 2: Prove crash after initdb before BootstrapState commit.**

Scenario:

```text
V1/no PG identity
→ initdb succeeds
→ process/test aborts before V2 commit
→ next bootstrap sees non-empty DATA/private-postgres + no authoritative privatePostgres state
→ RECOVERY_REQUIRED
→ no initdb
→ no automatic adoption
```

This is intentionally availability-negative and safety-positive.

- [ ] **Step 3: Prove crash after V2 commit before PostgreSQL start.**

Scenario:

```text
V2 private-PG identity committed
→ abort before start
→ next bootstrap validates exact same cluster
→ starts it
→ same system identifier/port
```

- [ ] **Step 4: Prove unknown valid-looking PostgreSQL directory is not adopted.**

Initialize a separate real PostgreSQL cluster manually with the toolchain, place it at the target directory without matching BootstrapState, then run M3 orchestration. Expected: recovery-required failure, not adoption.

- [ ] **Step 5: Prove port occupation fails closed.**

Bind/listen on the persisted loopback port with an unrelated process/socket before PostgreSQL start. Expected:

```text
PostgreSQL start/readiness FAIL
BootstrapState persisted port unchanged
no fallback port
no second cluster initialization
```

- [ ] **Step 6: Prove toolchain mismatch fails before mutation.**

If a non-18.6 toolchain is available in a controlled fixture, require failure before touching PGDATA. If no second real version is available, unit parser/path tests remain PASS and this exact cross-version product case is `NOT_RUN`; do not fake version output inside production adapter qualification.

- [ ] **Step 7: Secret leakage audit.**

Search generated test logs/state/journal fixtures for the sentinel bootstrap password used by the test:

```text
M3_TEST_SENTINEL_DO_NOT_LEAK_4f88b1c6
```

The test must fail if the sentinel appears outside the ephemeral pwfile while it exists in the test.

Also run repository search over changed files to prove the sentinel was not committed.

- [ ] **Step 8: Run current-host failure matrix.**

```bash
pnpm nx run private-postgres:test:integration
pnpm exec vitest run packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts
```

Record each claim individually as PASS/FAIL/NOT_RUN/BLOCKED.

- [ ] **Step 9: Commit.**

```bash
git add packages/private-postgres packages/bootstrap-runtime docs/engineering

git commit -m "test: prove private PostgreSQL bootstrap failure boundaries"
```

Do not stage unrelated engineering docs.

---

# 19. Task 11 — Qualification Evidence and Documentation Closure

**Files:**

- Modify: `Architecture_Corpus/qualification/results/qualification-status.json` only according to its current schema/authority rules
- Modify: `Architecture_Corpus/qualification/run-metadata/latest.json` only if the repository's current qualification workflow requires it
- Modify: `docs/roadmap/development-roadmap.md` only for evidence/state refresh, not semantic architecture changes
- Modify: `docs/plans/active/foundation/m3-private-postgresql-bootstrap.md` Execution Record
- Modify: GOTCHAS/PLAYBOOK indexes and entries only when execution produced reusable knowledge

**Produces:** truthful implementation qualification record; no product-closure overclaim.

- [ ] **Step 1: Define/extend the private PostgreSQL qualification record using the repository's existing result schema.**

Required properties must distinguish at least:

```text
exact_toolchain_18_6
first_init_empty_directory
nonempty_unknown_directory_rejected
cluster_system_identifier_persisted
restart_same_cluster_identity
persisted_port_stable
port_occupied_fails_closed
secret_not_in_argv_state_journal_logs
crash_after_init_before_state_commit_recovery_required
crash_after_state_commit_before_start_recovers
windows_real_pg
macos_real_pg
linux_real_pg
source_less_shipping_closure
service_account_acl_closure
```

Do not mark source-less/service-account closure PASS in M3; those are later product qualification.

- [ ] **Step 2: Record current-host results with exact evidence.**

Evidence must include:

```text
OS/platform
Node version
pnpm version
exact PostgreSQL --version outputs
toolchain bin root provenance sufficient for qualification
exact git SHA
test commands
PASS/FAIL/NOT_RUN/BLOCKED
```

Do not record bootstrap password or sensitive environment dumps.

- [ ] **Step 3: Update roadmap M3 position.**

Before merge, describe M3 as active/in review. Do not mark H1 complete.

- [ ] **Step 4: Update knowledge docs only from actual findings.**

Examples worth a GOTCHA only if observed/proven:

- PostgreSQL tool output/platform parsing variation;
- `pg_ctl` Windows lifecycle behavior requiring a bounded workaround;
- exact configuration/locale issue;
- Execa process termination behavior affecting PostgreSQL;
- temp credential file behavior that changes platform qualification.

Do not create speculative empty categories.

- [ ] **Step 5: Run documentation/qualification gates.**

```bash
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm format:check
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add Architecture_Corpus/qualification \
  docs/roadmap/development-roadmap.md \
  docs/plans/active/foundation/m3-private-postgresql-bootstrap.md \
  docs/engineering

git commit -m "docs: record Foundation M3 private PostgreSQL evidence"
```

Stage only files actually updated.

---

# 20. Task 12 — Exact Candidate Verification and PR Handoff

No new implementation occurs in this task unless verification exposes a defect.

- [ ] **Step 1: Reset Nx state.**

```bash
pnpm nx reset
```

- [ ] **Step 2: Run focused unit suites.**

```bash
pnpm exec vitest run \
  packages/bootstrap-state/src/codec.test.ts \
  packages/bootstrap-state/src/store.test.ts \
  packages/bootstrap-runtime/src/bootstrap-state-access.test.ts \
  packages/bootstrap-runtime/src/bootstrap-prelude.test.ts \
  packages/bootstrap-runtime/src/bootstrap-key-provider.test.ts \
  packages/bootstrap-runtime/src/private-postgres-bootstrap.test.ts \
  packages/private-postgres/src/toolchain.test.ts \
  packages/private-postgres/src/credential-file.test.ts \
  packages/private-postgres/src/cluster-layout.test.ts \
  packages/private-postgres/src/cluster-inspection.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run current-host real PostgreSQL 18.6 qualification.**

First prove the runtime:

```bash
"$HEPTALOGOS_TEST_PG_BIN/postgres" --version
"$HEPTALOGOS_TEST_PG_BIN/initdb" --version
"$HEPTALOGOS_TEST_PG_BIN/pg_ctl" --version
"$HEPTALOGOS_TEST_PG_BIN/pg_controldata" --version
"$HEPTALOGOS_TEST_PG_BIN/pg_isready" --version
```

On Windows use the corresponding `.exe` paths. Every output must be PostgreSQL 18.6.

Then run:

```bash
pnpm nx run private-postgres:test:integration
pnpm exec vitest run packages/bootstrap-runtime/src/private-postgres-bootstrap.integration.test.ts
```

Expected: PASS on the platform actually being claimed. Missing/mismatched runtime = BLOCKED.

- [ ] **Step 4: Run every permanent repository gate individually.**

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm tsc6
pnpm test
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Run canonical aggregate.**

```bash
pnpm verify
```

Expected: PASS.

- [ ] **Step 6: Audit dependency/framework leakage.**

```bash
rg -n 'from ["'"']execa["'"']|require\(["'"']execa["'"']\)' packages
rg -n '@heptalogos/private-postgres' packages
rg -n '@heptalogos/bootstrap-state' packages
rg -n 'child_process|node:child_process' packages
```

Expected:

```text
Execa product import only inside designated private-postgres process adapter
no raw child_process PostgreSQL path
bootstrap-state still restricted to approved bootstrap packages
private-postgres does not import bootstrap-runtime/bootstrap-state
no pg/Kysely/DBOS introduced
```

- [ ] **Step 7: Audit scope.**

```bash
git diff --stat master...HEAD
git diff --name-only master...HEAD
```

No H2/H3/Management/Subject/packaging expansion.

- [ ] **Step 8: Record exact local candidate SHA mechanically.**

```bash
git status --short
git rev-parse HEAD
```

Required:

```text
working tree = clean
```

Repository execution record stores the implementation/evidence parent SHA and verification facts available before the final documentation commit.

After the final documentation commit, capture `git rev-parse HEAD` mechanically and record the final exact candidate SHA in the PR body and independent-review/CI metadata, which do not change the commit.

No post-verification repository commit is made solely to write the final SHA back into the repository.

- [ ] **Step 9: Update Draft PR body with truthful state.**

Required sections:

```text
Summary
Architecture boundary
Exact dependency/toolchain evidence
Local verification
Current-host real-PG qualification
Known NOT_RUN/BLOCKED product/platform claims
Exact candidate SHA
Independent review = NOT_RUN
Final cross-platform CI = NOT_RUN
```

- [ ] **Step 10: Keep the PR Draft until implementation is locally complete.**

Do not dispatch final CI.

- [ ] **Step 11: Independent review.**

After PR is Ready, an independent reviewer must review the exact candidate SHA and produce PASS/REQUEST_CHANGES. Implementing Agent self-review does not satisfy this gate.

- [ ] **Step 12: Final cross-platform CI only after independent review PASS.**

The final workflow must target the exact reviewed SHA and run the real PostgreSQL 18.6 qualification on:

```text
Windows  PASS required
macOS    PASS required
Linux    PASS required
```

Each job must prove all five PostgreSQL tools report 18.6 before tests execute.

A platform that merely compiles or skips integration tests is not qualified.

- [ ] **Step 13: Verify HEAD unchanged after final CI.**

```bash
git rev-parse HEAD
```

It must equal the exact independently reviewed/final-CI SHA.

- [ ] **Step 14: Squash merge only after all required gates pass.**

Do not create a post-CI “documentation-only” commit on the PR. That would invalidate the review/CI authorization. Post-merge roadmap/plan archival updates, if required by repository policy, must be designed so they do not falsify the exact-SHA closure rule.

---

# 21. M3 Acceptance Matrix

M3 may be declared implementation-complete only when the following are true for the exact candidate:

```text
[PASS] M2 authentic bootstrap ownership still gates all BootstrapState mutation
[PASS] private-postgres mechanics package has no Bootstrap/Host Authority
[PASS] PostgreSQL executable discovery is explicit; no PATH/system-service/default-port discovery
[PASS] all required PostgreSQL tools are exact 18.6 for qualification
[PASS] PostgreSQL architecture major is 18
[PASS] V1 BootstrapState remains readable
[PASS] V1 → V2 one-way migration works under ownership
[PASS] V2 → V1 downgrade is rejected
[PASS] durable private-PG identity uses logical DATA + relative path, not absolute path
[PASS] first initialization requires authoritative no-PG state + ABSENT/EMPTY target
[PASS] non-empty unknown target is recovery-required and never auto-adopted
[PASS] initialized cluster persists InstallationId/InstanceId association, port, system identifier, profile revision
[PASS] bootstrap password uses callback-scoped provider + ephemeral pwfile
[PASS] password does not appear in argv/state/journal/Problem/log evidence
[PASS] cluster starts loopback-only at persisted port
[PASS] port occupation fails closed; no silent relocation
[PASS] controlled stop/restart preserves system identifier and port
[PASS] crash after initdb before state commit becomes recovery-required
[PASS] crash after state commit before start validates and resumes same cluster
[PASS] ReadyPrivatePostgres is returned only under authentic current bootstrap ownership
[PASS] bootstrap ownership remains HELD after PostgreSQL becomes ready
[PASS] no pg/Kysely/DBOS/HostOwnershipFence/normal mutation path introduced
[PASS] permanent repository gates pass
[PASS] pnpm verify passes
[PASS] independent review passes on exact candidate SHA
[PASS] final Windows real-PG 18.6 qualification passes on exact reviewed SHA
[PASS] final macOS real-PG 18.6 qualification passes on exact reviewed SHA
[PASS] final Linux real-PG 18.6 qualification passes on exact reviewed SHA
[PASS] HEAD unchanged after final CI

[NOT_RUN] source-less vendored PostgreSQL shipping closure
[NOT_RUN] OS service-account/installer ACL closure unless independently qualified elsewhere
[NOT_RUN] Host advisory lease
[NOT_RUN] HostOwnershipFence / HostOwnershipToken
[NOT_RUN] bootstrap → Host forward handoff
[NOT_RUN] reverse handoff
[NOT_RUN] abandoned pre-PG lock Recovery
[NOT_RUN] normal PersistenceService/Kysely
[NOT_RUN] DBOS
```

If any required PASS item is `FAIL`, fix it and invalidate prior candidate review/CI as required.

If a required platform/runtime is unavailable, record `BLOCKED`; do not lower the acceptance matrix.

---

# 22. Expected M3 Product Truth at Completion

If M3 closes, Heptalogos may truthfully claim:

```text
A bootstrap owner can require one explicit PostgreSQL toolchain and reject the wrong toolchain.
A first private cluster is created only in a proven empty target.
An existing non-empty unowned/unknown directory is never silently adopted or overwritten.
The private cluster is bound durably to InstallationId + InstanceId + logical DATA placement + PostgreSQL major + system identifier + persisted port + initialization profile revision.
BootstrapState V1 remains readable and the private-PG identity is added through a one-way V2 transition under bootstrap ownership.
The bootstrap password is delivered through a bounded BootstrapKeyProvider path and initdb pwfile, not argv/global env/state/journal/logs.
The validated private cluster can start, become ready, stop, and restart on the same persisted port while preserving its cluster system identifier.
A crash before identity commit leaves an explicit recovery-required unknown cluster rather than triggering automatic adoption/reinit.
A crash after identity commit can validate and resume the same cluster.
Private PostgreSQL can be READY while bootstrap ownership is still HELD.
```

M3 may **not** claim:

```text
H1 complete
normal canonical mutation admitted
Host ownership proven
Host failover/fencing correct
lease loss fencing complete
abandoned bootstrap lock Recovery complete
private PostgreSQL shipping/source-less closure complete
OS service integration complete
normal SecretService complete
PersistenceService/DBOS ready
```

---

# 23. M4 Handoff Contract

M4 begins from this seam and must not reopen M3 mechanics without evidence:

```text
OwnedBootstrapPrelude
+
ReadyPrivatePostgres
```

M4 is responsible for:

```text
pg driver exact-version refresh
→ dedicated HostLeaseConnection
→ PostgreSQL session-level advisory Host lease
→ minimal HostOwnershipFence schema under bootstrap+lease ownership
→ publish HostOwnershipToken + BootId
→ stale/old Host transaction fencing tests
→ lease-loss FENCED/quiesce semantics
→ ONLY THEN normal canonical mutation admission
→ release bootstrap ownership as forward handoff completes
```

M4 must not re-decide which PGDATA belongs to the instance, how the cluster is initialized, or how its persisted port/system identifier is validated unless M3 evidence proves that boundary wrong.

---

# 24. Execution Record

The implementing Agent must update this section throughout execution. Use exact evidence only.

Initial authoring baseline:

```text
plan approved: 2026-08-21
repository authoring baseline: fdc2af95e4c90b6ca0093ab96fd72a808e05ed57
recommended branch: dev/m3-private-postgresql-bootstrap
PostgreSQL architecture line: 18
PostgreSQL exact qualification candidate: 18.6
Execa exact Catalog/current latest: 10.0.1
```

Execution start evidence (2026-08-21):

```text
actual execution base SHA: fdc2af95e4c90b6ca0093ab96fd72a808e05ed57
execution branch: dev/m3-private-postgresql-bootstrap
active plan set at activation: M3 only
Node version: 24.19.0 (selected explicitly through nvm; default shell Node 26.5.0 was not used)
pnpm version: 11.22.0
OS/platform: Linux x86_64
Execa registry/Catalog version: 10.0.1
proper-lockfile Catalog version: 4.1.2; inherited M2 no-automatic-stale-takeover profile retained
HEPTALOGOS_TEST_PG_BIN: UNSET
exact PostgreSQL 18.6 current-host runtime: BLOCKED (no explicit test toolchain supplied; no five-tool binary set available)
inherited install baseline: PASS — pnpm install --frozen-lockfile under Node 24.19.0
inherited aggregate baseline: PASS — pnpm nx reset; pnpm verify under Node 24.19.0 before M3 changes
plan source materialization: PASS — canonical active plan byte-compared to attached source before execution-record append
independent review: NOT_RUN
final Windows/macOS/Linux CI: NOT_RUN
```

Task 0–10 execution evidence (current candidate before documentation closure):

```text
current implementation candidate SHA: 46e66c776f17b43ae06c0cef8229c4cd4666919c
PostgreSQL toolchain provenance: Ubuntu package artifacts postgresql-18, postgresql-client-18, and libpq5 version 18.6-0ubuntu0.26.04.1, extracted into /tmp qualification roots; not a source-less shipping artifact
PostgreSQL bin root: /tmp/tmp.lVC5dLOdfp/root/usr/lib/postgresql/18/bin
postgres --version: postgres (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
initdb --version: initdb (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
pg_ctl --version: pg_ctl (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
pg_controldata --version: pg_controldata (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
pg_isready --version: pg_isready (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
focused unit status: PASS — bootstrap-runtime ownership/prelude tests 9/9; repository permanent unit suites PASS (bootstrap-state 47 passed + 2 skipped, private-postgres 27, bootstrap-runtime 34 + 1 skipped)
real-PG integration status: PASS — private-postgres lifecycle/identity integration 11/11; bootstrap-runtime orchestration/failure matrix 8/8
failure-matrix status: PASS — initdb-before-commit recovery-required, V2-before-start recovery, post-start recovery, unknown-directory rejection, and occupied-port fail-closed cases
secret leakage audit: PASS — sentinel absent from generated state/journal/log assertions and from non-test source; ephemeral pwfile removed by callback-scoped credential helper
permanent gate status: PASS — check:dependencies, check:boundaries, typecheck, tsc6, lint, test, build
documentation gate status: PASS — check:corpus, check:repository, check:dependencies, and format:check
pnpm verify status: PASS for inherited pre-M3 baseline; final post-documentation verify: NOT_RUN
independent review: NOT_RUN on the current candidate SHA
final Windows/macOS/Linux CI: NOT_RUN
remaining NOT_RUN qualification debt: Windows real PostgreSQL; macOS real PostgreSQL; source-less shipping/ReleaseManifest/SBOM closure; service-account/installer ACL closure; cross-platform final CI; independent review
new GOTCHA/PLAYBOOK knowledge: GOTCHA added at docs/engineering/gotchas/postgres/private-runtime.md — extracted/unprivileged PostgreSQL may fail on the default Unix socket directory; owned profile disables Unix sockets and readiness uses loopback TCP
roadmap assumptions: CONFIRMED — M3 remains active/in review; H1 Host lease/fence, forward/reverse handoff, and abandoned-lock Recovery remain later work
```

At execution start, append concrete entries for:

```text
actual execution base SHA
Node version
pnpm version
OS/platform
PostgreSQL toolchain source/provenance
all five PostgreSQL --version outputs
focused unit status
real-PG integration status
failure-matrix status
permanent gate status
pnpm verify status
exact implementation candidate SHA
independent review status + exact SHA
final Windows CI status + run/job evidence
final macOS CI status + run/job evidence
final Linux CI status + run/job evidence
remaining NOT_RUN qualification debt
new GOTCHA/PLAYBOOK knowledge
roadmap assumptions confirmed/invalidated
```

Never replace missing evidence with prose such as “should work”, “covered by similar test”, or “CI expected to pass”.

## Independent Review Correction (2026-08-22)

The preceding Task 0–10 execution block is historical pre-correction evidence
for candidate `46e66c776f17b43ae06c0cef8229c4cd4666919c`; it does not qualify the
corrected candidate below.

```text
Independent review baseline:
  SHA 9109e7a0ad4634aad11929034c35529bb95a291e
  result REQUEST_CHANGES

Corrective findings:
  lifecycle Authority gap
  false effective-profile proof
  patch-version provenance semantics
  exact-candidate evidence discipline

Current correction host:
  Windows

Corrective local qualification:
  exact evidence only

Independent re-review:
  NOT_RUN

Final cross-platform CI:
  NOT_RUN
```

Corrective evidence parent and implementation SHA before the documentation
commit:

```text
3771b0f8dd1c47bb350b864cb7d3f11257971a5e
```

Windows evidence:

```text
platform: Windows x64
os_version: Microsoft Windows NT 10.0.26200.0
runtime: Node 24.19.0 / pnpm 11.22.0
postgres_provenance: EDB PostgreSQL 18.6 Windows x86-64 binary archive; complete tar extraction
postgres --version: postgres (PostgreSQL) 18.6
initdb --version: initdb (PostgreSQL) 18.6
pg_ctl --version: pg_ctl (PostgreSQL) 18.6
pg_controldata --version: pg_controldata (PostgreSQL) 18.6
pg_isready --version: pg_isready (PostgreSQL) 18.6
private-postgres real integration: PASS — 19/19
bootstrap-runtime real integration: PASS — 9/9
Windows spaces/non-ASCII TEMP/TMP path audit: PASS
postgres -C effective data_directory/hba_file path probe: PASS — absolute paths observed
permanent gates: PASS
pnpm verify: PASS
windows_real_pg: PASS
corrected_linux_real_pg: NOT_RUN
corrected_macos_real_pg: NOT_RUN
service_account_acl_closure: NOT_RUN
source_less_shipping_closure: NOT_RUN
```

The Windows real-PG evidence includes bootstrap release blocking while the
private PostgreSQL session is READY/uncertain, stale Ready rejection after
release, live ownership guards for process control, fail-safe start cleanup,
PostgreSQL `-C` effective-profile validation, duplicate-setting rejection,
canonical HBA/tamper rejection, and patch-version provenance semantics. The
prior Linux PASS remains historical evidence at its recorded SHA only.

New reusable Windows GOTCHA: when `pg_ctl start` or `restart` inherits captured
stdout/stderr pipes on Windows, the server descendant can keep those handles
open and prevent the parent process-control promise from completing while the
server remains running. Detached start/restart therefore use ignored stdio;
diagnostic capture remains available for bounded commands.

## Follow-up Independent Review Correction (2026-08-22)

The exact candidate reviewed after the first corrective documentation commit
was `7cf02b0812fdcd3d443c8c0a93e642a2b0a809e3`. The follow-up review result was
`REQUEST_CHANGES` with two P1 lifecycle blockers:

```text
follow-up review baseline:
  SHA 7cf02b0812fdcd3d443c8c0a93e642a2b0a809e3
  result REQUEST_CHANGES

follow-up findings:
  OwnedBootstrapPrelude exposed a direct ownership release capability
  ownership release had no synchronous RELEASING fence
  pg_ctl start timeout/nonzero could be treated as not-started
  STOPPED in-memory state could hide a running process after restart failure

current correction host:
  Windows

corrective local qualification:
  exact evidence only

independent re-review:
  NOT_RUN

final cross-platform CI:
  NOT_RUN
```

The corrected implementation/evidence parent SHA before the next documentation
commit is:

```text
b0f01aaa00acd505754acaaed31cf4e05e6892bd
```

The follow-up local evidence is:

```text
Windows exact PostgreSQL 18.6 five-tool proof: PASS
private-postgres real integration: PASS — 20/20
bootstrap-runtime real integration: PASS — 9/9
spaces/non-ASCII TEMP/TMP path audit: PASS
ownership release capability absent from OwnedBootstrapPrelude: PASS
ownership release-start fence / RELEASING state: PASS
pg_ctl timeout uncertainty status/stop/status proof: PASS — focused lifecycle unit
STOPPED restart-readiness failure bounded-stop proof: PASS — real Windows integration
pnpm verify: PASS
corrected-head Linux: NOT_RUN
corrected-head macOS: NOT_RUN
service-account ACL closure: NOT_RUN
source-less shipping closure: NOT_RUN
```

This follow-up correction remains inside M3 private PostgreSQL lifecycle and
bootstrap ownership boundaries; no M4 Host lease/fence or normal mutation path
was introduced.

---

# 25. Plan Self-Review

This plan was checked against the approved M3 design and current repository reality before delivery.

## Spec coverage

- M2 authentic ownership consumed rather than bypassed: covered Tasks 4, 9.
- explicit PostgreSQL 18.6 toolchain: Tasks 1, 2, 12.
- separate private-postgres mechanics package: Task 1.
- BootstrapKeyProvider minimal boundary, no normal SecretService: Task 3.
- BootstrapState V2, V1 compatibility, portable identity: Task 4.
- empty-only first init, unknown-directory fail-safe: Tasks 6, 7, 10.
- real cluster system identifier + persisted port: Tasks 5–9.
- lifecycle start/readiness/stop/restart: Task 8.
- `ReadyPrivatePostgres` seam while bootstrap ownership remains held: Task 9.
- crash/failure matrix and uncertainty: Task 10.
- truthful qualification and exact-SHA cross-platform closure: Tasks 11–12.
- M4/M5 deferred: Global Constraints, Non-Goals, M4 Handoff.

## Placeholder scan

No unresolved placeholder marker, generic “add tests”, unspecified provider replacement, or unbounded generic error-handling step is permitted. Unknown future evidence is handled by explicit PASS/FAIL/NOT_RUN/BLOCKED branches rather than placeholders.

## Type consistency

The plan uses one `PrivatePostgresToolchain`, one portable placement model, one `PrivatePostgresBootstrapStateV1`, one `ReadyPrivatePostgresMechanics`, one `BootstrapKeyProvider`, and one `ReadyPrivatePostgres` orchestration seam consistently across tasks.

## Scope check

M3 remains one capability closure: private PostgreSQL bootstrap and identity. Host ownership/fencing, Recovery, Persistence, Runtime, DBOS, Management, Subject, and shipping closure remain outside the milestone.
