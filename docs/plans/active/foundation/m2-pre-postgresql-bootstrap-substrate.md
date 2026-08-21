# Foundation M2 Pre-PostgreSQL Bootstrap Substrate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** ACTIVE

**Goal:** Establish the first executable H1 bootstrap closure segment: a Heptalogos installation can resolve its persistent installation/instance identity and independent lifecycle roots, create a per-boot early-observability chain, acquire exactly one pre-PostgreSQL bootstrap owner, and guard BootstrapState mutation under that ownership without yet starting PostgreSQL.

**Roadmap Position:** H1 — *Own the Machine*, first milestone only. **M2 does not close H1.** It closes the pre-PostgreSQL bootstrap substrate required before private PostgreSQL and Host ownership handoff can be implemented safely.

**Architecture:** Add a narrow `@heptalogos/bootstrap-runtime` package above the existing `bootstrap-state` primitive. The new package owns bootstrap locator decoding, bootstrap root resolution, pre-PG ownership, and an owned bootstrap prelude/session. Existing `@heptalogos/bootstrap-state` remains the low-level crash-safe state/journal persistence primitive. `proper-lockfile` remains the ADOPTED pre-PG lock mechanics behind one adapter, but M2 deliberately disables automatic stale-lock reclamation because current 4.1.2 source/upstream evidence leaves a double-owner race unresolved; an abandoned lock therefore becomes explicit recovery-required state rather than being automatically stolen.

**Tech Stack:** Current repository baseline Node.js 24.19.0, pnpm 11.22.0 strict Catalog, Nx 23.1.1, TypeScript 7.0.2 canonical compiler, TypeScript 6.0.2 compatibility lane, ESLint 10.8.1 + typescript-eslint 8.67.0, Vitest 4.1.11, TypeBox 1.x + Ajv 8 for strict bootstrap locator schemas, existing `write-file-atomic` 8.x through `bootstrap-state`, and the ADOPTED `proper-lockfile` 4.x route. Current registry evidence on 2026-08-21 is `proper-lockfile@4.1.2`; the executor MUST re-check registry/upstream evidence immediately before pinning it and must not silently leave the adopted 4.x role.

**Spec / Authority:**
- `AGENTS.md`
- `docs/roadmap/development-roadmap.md` — H1 and plan-derivation guidance
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/05-整机执行模型.md`
- `Architecture_Corpus/14-跨平台产品运行与分发.md`
- `Architecture_Corpus/16-验证与资格认定体系.md`
- `Architecture_Corpus/23-存储拓扑-生命周期根与DataOwner.md`
- `Architecture_Corpus/24-依赖使用与实现路由.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md`
- `Architecture_Corpus/specs/S17-Storage-Workspace-DataLifecycle.md`
- `Architecture_Corpus/references/dependency-routing.json`
- `Architecture_Corpus/qualification/dependency-status.json`

## Global Constraints

- Start from current `master`; at plan authoring time the merged governance/roadmap baseline is `fed29824f089f0b5cee96d458c0a4b6124525da7`. Record the actual execution base SHA; do not assume this SHA if `master` has moved.
- `Architecture_Corpus/` remains semantic/architecture Authority. This plan sequences implementation and may not silently alter Subject/System Authority, bootstrap ownership semantics, lifecycle-root semantics, or recovery invariants.
- Consult `docs/roadmap/development-roadmap.md` before modifying this plan. M2 is an H1 partial closure, not “all of H1”.
- Use the existing branch → Draft PR → Ready → independent review → manual final cross-platform CI → squash merge workflow. Do not trigger final CI before independent review PASS.
- Use TDD for behavior-bearing code. Each task ends in one reviewable commit unless the task hits a STOP condition.
- Library-first is mandatory. `proper-lockfile` is the current ADOPTED pre-PG lock route; do not silently replace it or introduce a second lock provider.
- Exact dependency versions are refreshed from registry/upstream evidence at materialization time. Preserve `minimumReleaseAge: 1440`; do not add an exception for an ordinary JavaScript release.
- Stable Foundation/public contracts must use Heptalogos-owned types. No `proper-lockfile`, Ajv, TypeBox, Node `Stats`, raw path library object, or other mechanics type may leak from `@heptalogos/bootstrap-runtime` public API.
- Bootstrap locator/config input validation is strict and non-mutating: no coercion, implicit default insertion, or silent unknown-field removal.
- `InstallationId`, `InstanceId`, and `BootId` are UUIDv7 generated identities. They are identifiers, never credentials or Authority.
- `BootId` changes for every bootstrap attempt. `InstallationId` and `InstanceId` are loaded from installation-owned bootstrap metadata and are not regenerated during ordinary startup.
- M2 may read BootstrapState before ownership for diagnostics, but **all BootstrapState mutation requires current bootstrap ownership**. After ownership acquisition, BootstrapState must be reloaded before it is treated as authoritative for subsequent work.
- Per-BootId BootstrapJournal remains writable before bootstrap ownership is acquired so failed/blocked startup attempts can leave bounded early evidence. Journal content itself does not grant ownership. Locator/root-resolution events may be buffered in memory until a validated `INSTANCE` root exists; never write early evidence to an unvalidated path merely to claim earlier durability.
- Do not store normal Configuration, business state, Secret plaintext, Provider credentials, or future H2/H3 state in bootstrap locator/state/journal.
- M2 does not claim full S17 `StorageWorkspaceService`, full DataOwner lifecycle, full platform installer path policy, or shipping path/ACL qualification.
- Path claims must remain bounded: M2 validates configured roots as existing directories, canonicalizes them, and rejects a configured root whose terminal entry is a symlink/junction according to the tested Node behavior. It does **not** claim complete resistance to arbitrary reparse-point/parent-component TOCTOU attacks. Those remain product/platform qualification debt under the Corpus no-untrusted-writer/ACL assumptions.
- **Do not enable `proper-lockfile` automatic stale reclamation in M2.** Current 4.1.2 source and unresolved upstream issue #121 provide concrete evidence that concurrent stale reclaim can create a double-owner window. M2 must fail safe on an abandoned lock and report recovery required. If the executor wants automatic reclaim, STOP and reopen the dependency/ownership decision with evidence first.
- Do not add a fake stale-recovery path, manual `rm -rf` command, PID guessing, or a second lock implementation to make tests green.
- Verification truth is exactly `PASS | FAIL | NOT_RUN | BLOCKED`.

## Explicitly Out of Scope

M2 MUST NOT implement or materialize:

- private PostgreSQL installation/start/stop/port selection;
- PostgreSQL `pg` driver or Kysely product persistence;
- BootstrapKeyProvider or normal SecretService;
- Host advisory lease;
- `HostOwnershipFence` / `HostOwnershipToken`;
- bootstrap → Host or Host → bootstrap ownership handoff;
- RuntimeSubstrate/Cordis, RuntimeGraph, Reconciler, ServiceRegistry, CapabilityRegistry;
- DBOS, WorkQueue, Signal, EffectOperation;
- normal ConfigurationService/Policy/Approval/Management/CLI/HTTP;
- Extension PackageManager/DataOwner/StorageWorkspaceService;
- Messaging, AI SDK, MCP, Subject, Reactor, advanced cognition;
- source-less PostgreSQL packaging, OS service wrapper, installer, updater, backup/restore;
- automatic abandoned-lock recovery.

If implementing a task appears to require any item above, STOP and report the dependency rather than widening M2.

---

## Why M2 Is Split From the Rest of H1

H1 contains two distinct authority transitions:

```text
A. installation/instance discovery
   → lifecycle-root resolution
   → pre-PG bootstrap ownership

B. private PostgreSQL ready
   → advisory Host lease
   → HostOwnershipFence token publication
   → normal canonical mutation admitted
```

M2 closes **A** only. A later H1 milestone will close **B** and the forward/reverse handoff. This split prevents one PR from simultaneously inventing platform paths, bootstrap locking, PostgreSQL process control, credential bootstrapping, SQL ownership fencing, and Host lifecycle.

M2 acceptance is therefore:

```text
trusted installation anchor
→ strict bootstrap locator
→ InstallationId / InstanceId
→ independent resolved lifecycle roots
→ new BootId + early BootstrapJournal
→ exclusive bootstrap ownership
→ authoritative BootstrapState reload
→ guarded bootstrap-state mutation
→ explicit release
```

Not:

```text
... → PostgreSQL → Host READY
```

---

## Known Dependency Risk: `proper-lockfile` Stale Reclaim

Current 2026-08-21 evidence:

- npm latest is `proper-lockfile@4.1.2`;
- upstream `lib/lockfile.js` removes a stale lock directory and then retries `mkdir`;
- upstream issue #121 (opened 2025-09-20, still open at plan authoring time) describes a race where two stale reclaimers can remove/recreate the same lock directory and temporarily both believe they acquired it;
- this is unacceptable as an unqualified Heptalogos Authority fence.

M2 uses `proper-lockfile` only in a **no-automatic-stale-reclaim safety profile**:

```text
exclusive atomic mkdir + ownership heartbeat + compromised callback
YES

automatic stale takeover
NO

abandoned lock after ungraceful process death
→ BLOCKED / RECOVERY_REQUIRED
```

The adapter must pass an effectively non-expiring stale duration and an explicit heartbeat interval. The stale value is an adapter safety invariant, not an end-user tuneable value in M2. The heartbeat interval is an explicit adapter input so it is not hidden as a magic product behavior value.

The later H1 closure must design/qualify the bounded Recovery path for an abandoned pre-PG lock before normal product recovery can be claimed.

---

## Target Repository Shape After M2

The exact file split may be adjusted if existing code makes a smaller boundary clearer, but do not add more product packages than this plan requires.

```text
packages/
├─ foundation-contracts/
│  └─ src/
│     ├─ identity.ts                 # add InstallationId/InstanceId/BootId aliases/helpers
│     ├─ identity.test.ts
│     ├─ lifecycle-root.ts           # stable Foundation lifecycle-root names
│     ├─ lifecycle-root.test.ts
│     └─ index.ts
├─ bootstrap-state/
│  └─ src/
│     ├─ journal.ts                  # evolve journal for earliest pre-ownership stages
│     ├─ journal.test.ts
│     └─ index.ts
└─ bootstrap-runtime/
   ├─ package.json
   ├─ project.json
   ├─ tsconfig.json
   ├─ tsconfig.build.json
   ├─ src/
   │  ├─ locator.ts
   │  ├─ locator.test.ts
   │  ├─ roots.ts
   │  ├─ roots.test.ts
   │  ├─ bootstrap-ownership.ts
   │  ├─ bootstrap-ownership.test.ts
   │  ├─ bootstrap-state-access.ts
   │  ├─ bootstrap-state-access.test.ts
   │  ├─ bootstrap-prelude.ts
   │  ├─ bootstrap-prelude.test.ts
   │  └─ index.ts
   └─ test/
      └─ fixtures/
         └─ lock-contender.mjs

docs/
├─ plans/active/foundation/m2-pre-postgresql-bootstrap-substrate.md
└─ engineering/gotchas/bootstrap/proper-lockfile-stale-reclaim.md
```

Do not create `apps/`, installer packages, PostgreSQL packages, runtime-kernel packages, or future H2 topology in M2.

---

# Preflight: Establish the Exact Execution Baseline

- [ ] Read root `AGENTS.md` before editing.
- [ ] Read the current Heptalogos architecture/dependency/verification/runtime-durability/config-data skills applicable to this task.
- [ ] Read every Authority file listed in this plan header.
- [ ] Read `docs/engineering/GOTCHAS.md` and `docs/engineering/PLAYBOOK.md`; do not create a duplicate entry for an existing lock/path issue.
- [ ] Confirm there is no other active Foundation plan:

```bash
find docs/plans/active -type f -not -name '.gitkeep' -print
```

Expected before M2 activation: no other governing Foundation plan. If another active plan exists, STOP and resolve plan authority first.

- [ ] Confirm clean working tree and exact base:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
```

Expected: clean tree. Record the actual base SHA in the M2 execution record.

- [ ] Create an isolated feature branch/worktree according to repository policy. Recommended branch:

```text
dev/m2-pre-postgresql-bootstrap-substrate
```

- [ ] Install exactly the locked baseline and prove the inherited repository is green before M2:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Expected: `PASS`. If the inherited baseline fails, STOP and repair the pre-existing failure separately.

- [ ] Refresh `proper-lockfile` evidence before pinning:

```bash
pnpm view proper-lockfile version dist-tags time --json
```

Inspect upstream README/source/issues for the exact release. Current plan evidence expects 4.x and observed `4.1.2`; if the latest eligible release is no longer 4.x, if the package identity changes, or if upstream materially changes stale-reclaim semantics, STOP and update the dependency evidence/plan before implementation.

- [ ] Record at least the following evidence in the active plan execution record:

```text
execution base SHA
Node version
pnpm version
proper-lockfile exact version selected
proper-lockfile source commit/tag when identifiable
status of upstream stale-reclaim issue/equivalent behavior
```

---

# Task 1: Activate M2 and Materialize the Bootstrap Runtime Package Boundary

**Files:**
- Create: `docs/plans/active/foundation/m2-pre-postgresql-bootstrap-substrate.md` from this exact approved plan
- Create: `packages/bootstrap-runtime/package.json`
- Create: `packages/bootstrap-runtime/project.json`
- Create: `packages/bootstrap-runtime/tsconfig.json`
- Create: `packages/bootstrap-runtime/tsconfig.build.json`
- Create: `packages/bootstrap-runtime/src/index.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.json`
- Modify: `package.json` only if root project references/scripts genuinely require it

**Interfaces:**
- Produces: private workspace package `@heptalogos/bootstrap-runtime`.
- Consumes: `@heptalogos/foundation-contracts`, `@heptalogos/bootstrap-state`, TypeBox/Ajv, and `proper-lockfile` behind later adapter code.
- Does not yet produce bootstrap behavior.

- [ ] **Step 1: Save this exact plan as the active plan**

Create:

```text
docs/plans/active/foundation/m2-pre-postgresql-bootstrap-substrate.md
```

Change only the plan header status from `PROPOSED` to:

```markdown
**Status:** ACTIVE
```

Append an `## Execution Record` section containing the exact preflight base SHA and selected `proper-lockfile` version. Do not rewrite roadmap/architecture content into the plan.

- [ ] **Step 2: Add the exact eligible `proper-lockfile` release to the strict Catalog**

At plan authoring time the expected line is:

```yaml
catalog:
  proper-lockfile: 4.1.2
```

Use the refreshed exact eligible release from Preflight if it differs while remaining within the ADOPTED 4.x role. Do not add `@types/proper-lockfile`; the adapter will use a narrow local mechanics type via `createRequire`, matching the repository's existing CJS-adapter pattern.

Run:

```bash
pnpm install
```

Expected: lockfile changes only for the authorized dependency closure; `minimumReleaseAge` remains intact.

- [ ] **Step 3: Create `packages/bootstrap-runtime/package.json`**

Use this dependency shape, substituting only the Catalog-selected exact lockfile version through `catalog:`:

```json
{
  "name": "@heptalogos/bootstrap-runtime",
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
    "@heptalogos/bootstrap-state": "workspace:*",
    "@heptalogos/foundation-contracts": "workspace:*",
    "ajv": "catalog:",
    "proper-lockfile": "catalog:",
    "typebox": "catalog:"
  },
  "devDependencies": {
    "vitest": "catalog:"
  }
}
```

- [ ] **Step 4: Create Nx/TypeScript package metadata following existing package conventions**

`project.json` must provide at least lint/test targets equivalent to existing Foundation libraries.

`tsconfig.build.json` must:

```text
extend ../../tsconfig.base.json
composite = true
declaration = true
declarationMap = true
rootDir = src
outDir = dist
types = ["node"]
reference foundation-contracts and bootstrap-state build configs
exclude *.test.ts
```

Update the root TypeScript reference graph so `pnpm typecheck`, `pnpm tsc6`, and `pnpm build` discover the new package through the existing repository model.

- [ ] **Step 5: Keep the initial public surface intentionally empty**

Create `src/index.ts` with no speculative API beyond a package marker:

```ts
export const BOOTSTRAP_RUNTIME_PACKAGE = "@heptalogos/bootstrap-runtime" as const;
```

This marker may be removed once real exports exist later in the plan.

- [ ] **Step 6: Prove package/toolchain materialization**

Run:

```bash
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
pnpm build
```

Expected: all `PASS`.

- [ ] **Step 7: Commit**

```bash
git add docs/plans/active/foundation/m2-pre-postgresql-bootstrap-substrate.md \
  packages/bootstrap-runtime pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json package.json

git commit -m "chore: establish M2 bootstrap runtime boundary"
```

Stage only paths actually changed; omit root files that did not require modification.

---

# Task 2: Promote Bootstrap Identities/Lifecycle-Root Names and Evolve Early Journal Semantics

**Files:**
- Modify: `packages/foundation-contracts/src/identity.ts`
- Modify: `packages/foundation-contracts/src/identity.test.ts`
- Create: `packages/foundation-contracts/src/lifecycle-root.ts`
- Create: `packages/foundation-contracts/src/lifecycle-root.test.ts`
- Modify: `packages/foundation-contracts/src/index.ts`
- Modify: `packages/bootstrap-state/src/journal.ts`
- Modify: `packages/bootstrap-state/src/journal.test.ts`
- Modify: `packages/bootstrap-state/src/index.ts`

**Interfaces:**
- Produces: `InstallationId`, `InstanceId`, `BootId` stable aliases and create/parse helpers from `foundation-contracts`.
- Produces: stable `LifecycleRootId` / `LIFECYCLE_ROOT_IDS` from `foundation-contracts`, so later Storage/Backup code never needs to depend on `bootstrap-runtime` merely to name a root.
- Produces: `BootstrapJournalCheckpointV2`, which can record stages before ProductGeneration/BootstrapRuntime generation resolution while retaining V1 read compatibility.
- Existing `bootstrap-state` consumers may continue importing the `BootId` type through `@heptalogos/bootstrap-state` during transition.

- [ ] **Step 1: Write failing identity tests**

Extend `identity.test.ts` with concrete tests equivalent to:

```ts
import {
  createBootId,
  createInstallationId,
  createInstanceId,
  parseBootId,
  parseInstallationId,
  parseInstanceId,
} from "./identity.js";

test("installation, instance, and boot identities are UUIDv7 but remain distinct brands", () => {
  const installationId = createInstallationId();
  const instanceId = createInstanceId();
  const bootId = createBootId();

  expect(parseInstallationId(installationId)).toBe(installationId);
  expect(parseInstanceId(instanceId)).toBe(instanceId);
  expect(parseBootId(bootId)).toBe(bootId);
  expect(new Set([installationId, instanceId, bootId]).size).toBe(3);
});

test("typed identity parsers reject malformed or non-v7 values", () => {
  expect(parseInstallationId("banana")).toBeUndefined();
  expect(parseInstanceId("00000000-0000-4000-8000-000000000000")).toBeUndefined();
  expect(parseBootId(null)).toBeUndefined();
});
```

Run the focused test and confirm it fails because the named helpers do not yet exist.

- [ ] **Step 2: Implement stable identity aliases/helpers**

Add to `identity.ts` using the existing generic UUIDv7 primitives:

```ts
export type InstallationId = UuidV7Id<"InstallationId">;
export type InstanceId = UuidV7Id<"InstanceId">;
export type BootId = UuidV7Id<"BootId">;

export const createInstallationId = (): InstallationId =>
  createUuidV7Id("InstallationId");
export const createInstanceId = (): InstanceId => createUuidV7Id("InstanceId");
export const createBootId = (): BootId => createUuidV7Id("BootId");

export const parseInstallationId = (value: unknown): InstallationId | undefined =>
  parseUuidV7Id("InstallationId", value);
export const parseInstanceId = (value: unknown): InstanceId | undefined =>
  parseUuidV7Id("InstanceId", value);
export const parseBootId = (value: unknown): BootId | undefined =>
  parseUuidV7Id("BootId", value);
```

Export them from `foundation-contracts/src/index.ts`.

- [ ] **Step 3: Add stable lifecycle-root names to `foundation-contracts`**

Create `lifecycle-root.ts` with exactly the S17 stable root family names:

```ts
export const LIFECYCLE_ROOT_IDS = [
  "PROGRAM",
  "INSTANCE",
  "CONFIGURATION",
  "DATA",
  "SECRET",
  "BLOB",
  "BACKUP",
  "LOG",
  "CACHE",
  "TEMP",
  "RUN",
  "PACKAGE_STAGING",
] as const;

export type LifecycleRootId = (typeof LIFECYCLE_ROOT_IDS)[number];
```

`lifecycle-root.test.ts` must prove the list is unique, contains exactly the twelve S17 names above, and does not add package/workspace-specific aliases. Export both symbols from `foundation-contracts/src/index.ts`.

- [ ] **Step 4: Write failing journal V2 tests for earliest bootstrap stages**

Add tests proving a V2 checkpoint can exist before generation selection:

```ts
const early: BootstrapJournalCheckpointV2 = {
  schemaVersion: 2,
  bootId: createBootId(),
  bootstrapActivityId: createUuidV7Id("ActivityId"),
  installationId: createInstallationId(),
  instanceId: createInstanceId(),
  stage: "bootstrap.locator.resolved",
  at: "2026-08-21T09:00:00.000Z",
  outcome: "SUCCEEDED",
};
```

The test must checkpoint/read the entry successfully without attempted generation fields.

Add a compatibility fixture using an existing valid V1 journal entry and prove `read()` still accepts it.

Add a mismatch test proving a V2 entry with a different `bootId` from its filename fails with the existing stable mismatch Problem semantics.

- [ ] **Step 5: Implement `BootstrapJournalCheckpointV2` and V1/V2 reader compatibility**

V2 must be exactly:

```ts
export interface BootstrapJournalCheckpointV2 {
  readonly schemaVersion: 2;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly attemptedBootstrapRuntimeGeneration?: BootstrapRuntimeGenerationId;
  readonly attemptedProductGeneration?: ProductGenerationId;
  readonly stage: string;
  readonly at: string;
  readonly outcome: BootstrapStageOutcome;
  readonly problemCode?: string;
}
```

Define:

```ts
export type BootstrapJournalCheckpoint =
  | BootstrapJournalCheckpointV1
  | BootstrapJournalCheckpointV2;
```

The post-M2 class signatures must be explicit:

```ts
checkpoint(entry: BootstrapJournalCheckpointV2): Promise<void>;
read(bootId: BootId): Promise<readonly BootstrapJournalCheckpoint[]>;
```

Rules:

- `checkpoint()` writes V2 only after M2 changes;
- `read()` accepts both V1 and V2 entries for historical compatibility;
- V2 requires `InstallationId` and `InstanceId` and validates them as UUIDv7;
- generation refs remain optional only in V2;
- canonical Instant validation remains unchanged;
- `additionalProperties: false` remains enforced;
- no default insertion/coercion.

Import `BootId`, `InstallationId`, and `InstanceId` from `foundation-contracts`; keep `bootstrap-state` index re-exporting `BootId` for compatibility rather than creating a second brand.

- [ ] **Step 6: Run focused compatibility tests**

```bash
pnpm exec vitest run packages/foundation-contracts/src/identity.test.ts
pnpm exec vitest run packages/foundation-contracts/src/lifecycle-root.test.ts
pnpm exec vitest run packages/bootstrap-state/src/journal.test.ts
pnpm typecheck
pnpm tsc6
```

Expected: `PASS`.

- [ ] **Step 7: Commit**

```bash
git add packages/foundation-contracts/src packages/bootstrap-state/src

git commit -m "feat: establish installation and early boot identity"
```

---

# Task 3: Define and Strictly Decode the Bootstrap Locator

**Files:**
- Create: `packages/bootstrap-runtime/src/locator.ts`
- Create: `packages/bootstrap-runtime/src/locator.test.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Interfaces:**
- Produces: `BootstrapLocatorV1`, `loadBootstrapLocator(anchorRoot)`, and stable locator Problem codes.
- Consumes: the stable `LifecycleRootId` family from `foundation-contracts`; `bootstrap-runtime` does not own or duplicate root names.
- Consumes: `InstallationId`, `InstanceId` and Node filesystem/path primitives.
- Does not provision or mutate the locator.

## Locator Contract for M2

The M2 runtime consumes a fully materialized, installation-owned JSON locator at:

```text
<anchorRoot>/heptalogos.bootstrap.json
```

The installer/platform-default materializer that creates this file is **not** implemented in M2.

The locator schema is intentionally fixed and bounded:

```ts
import type { InstallationId, InstanceId, LifecycleRootId } from
  "@heptalogos/foundation-contracts";

export interface BootstrapLocatorV1 {
  readonly schemaVersion: 1;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly roots: Readonly<Record<LifecycleRootId, string>>;
}
```

Every root path must be absolute. The `PROGRAM` configured path must resolve to the supplied `anchorRoot`. This prevents the installation locator from claiming a different program anchor than the entrypoint that loaded it.

- [ ] **Step 1: Write failing strict-decoding tests**

Cover at least:

```text
valid all-root locator
invalid JSON
unknown top-level field
unknown/missing root key
relative root path
invalid InstallationId
invalid InstanceId
PROGRAM path inconsistent with anchor
```

Representative test:

```ts
test("locator rejects unknown fields instead of silently dropping them", async () => {
  await writeFile(
    join(anchor, "heptalogos.bootstrap.json"),
    JSON.stringify({ ...validLocator, surprise: true }),
  );

  await expect(loadBootstrapLocator(anchor)).rejects.toMatchObject({
    problem: { problemCode: "bootstrap.locator.invalid_schema" },
  });
});
```

Use the repository's `ProblemError` shape rather than asserting raw Ajv text.

- [ ] **Step 2: Implement TypeBox/Ajv validation behind `locator.ts` only**

Use `Ajv2020` with:

```ts
{
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
  strict: true,
}
```

The TypeBox schema must set `additionalProperties: false` at every object level.

Do not export the Ajv validator/schema object as a public mechanics API.

- [ ] **Step 3: Validate semantic identity/path rules after structural validation**

After schema validation:

```text
parse InstallationId
parse InstanceId
for every root: path.isAbsolute(value) == true
realpath(PROGRAM) == realpath(anchorRoot)
```

Map failures to bounded Problems:

```text
bootstrap.locator.not_found
bootstrap.locator.invalid_json
bootstrap.locator.invalid_schema
bootstrap.locator.invalid_installation_id
bootstrap.locator.invalid_instance_id
bootstrap.locator.relative_root
bootstrap.locator.program_root_mismatch
```

Do not include raw file content, stack trace, or unbounded Ajv diagnostics in `Problem.detail`.

- [ ] **Step 4: Export only semantic types/functions**

`index.ts` may export:

```ts
export {
  loadBootstrapLocator,
  type BootstrapLocatorV1,
} from "./locator.js";
```

Do not export validator internals.

- [ ] **Step 5: Verify**

```bash
pnpm exec vitest run packages/bootstrap-runtime/src/locator.test.ts
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

Expected: `PASS`.

- [ ] **Step 6: Commit**

```bash
git add packages/bootstrap-runtime/src

git commit -m "feat: add strict bootstrap locator contract"
```

---

# Task 4: Resolve Independent Bootstrap Lifecycle Roots Without Overclaiming Path Security

**Files:**
- Create: `packages/bootstrap-runtime/src/roots.ts`
- Create: `packages/bootstrap-runtime/src/roots.test.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Interfaces:**
- Consumes: `BootstrapLocatorV1`.
- Produces: `ResolvedLifecycleRoot`, `BootstrapPathProfile`, `resolveBootstrapPathProfile(locator)`.
- M2 implements only bootstrap root resolution; it does **not** claim full future S17 workspace/data-owner API.

Define the public semantic shape:

```ts
export interface ResolvedLifecycleRoot {
  readonly id: LifecycleRootId;
  readonly configuredPath: string;
  readonly canonicalPath: string;
}

export interface BootstrapPathProfile {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  resolve(root: LifecycleRootId): ResolvedLifecycleRoot;
  list(): readonly ResolvedLifecycleRoot[];
}
```

- [ ] **Step 1: Write failing independent-root tests**

Construct a fixture where at least `PROGRAM`, `INSTANCE`, `CONFIGURATION`, `DATA`, `SECRET`, and `RUN` live under unrelated temporary parents rather than one common root.

Test:

```ts
const profile = await resolveBootstrapPathProfile(locator);
expect(profile.resolve("DATA").canonicalPath).not.toContain(
  profile.resolve("CONFIGURATION").canonicalPath,
);
expect(profile.list()).toHaveLength(LIFECYCLE_ROOT_IDS.length);
```

Do not assert an accidental common-parent topology.

- [ ] **Step 2: Write failing root-existence/type tests**

Cover:

```text
configured root missing
configured root is a regular file
configured root is a direct POSIX symlink
configured root is a Windows junction when test is running on Windows
```

Expected stable Problems:

```text
bootstrap.root.not_found
bootstrap.root.not_directory
bootstrap.root.link_rejected
bootstrap.root.realpath_failed
```

For platform-specific tests:

```ts
const testOnWindows = process.platform === "win32" ? test : test.skip;
const testOnPosix = process.platform === "win32" ? test.skip : test;
```

A skip is not a PASS for the skipped platform; final manual CI supplies the cross-platform execution evidence.

- [ ] **Step 3: Implement bounded root resolution**

For each configured root:

1. `lstat()` the configured terminal entry;
2. require `isDirectory()`;
3. reject `isSymbolicLink()` for the configured terminal root in M2;
4. resolve `realpath()` to obtain `canonicalPath`;
5. retain both configured and canonical paths for diagnostics.

Do **not** implement child workspace resolution or string-prefix confinement here.

Do **not** claim that terminal `lstat` detects every Windows reparse-point class or eliminates parent-component TOCTOU. Add a code comment referencing S15's platform qualification boundary rather than inventing a false guarantee.

- [ ] **Step 4: Prove path resolution is read-only**

Add a test capturing directory contents before/after `resolveBootstrapPathProfile()` and prove it creates no files/directories. M2 runtime consumes a provisioned layout; installer/provisioning is out of scope.

- [ ] **Step 5: Verify**

```bash
pnpm exec vitest run packages/bootstrap-runtime/src/roots.test.ts
pnpm typecheck
pnpm tsc6
```

Expected local-host tests: `PASS`; opposite-platform cases remain skipped locally and will be exercised by final CI after review.

- [ ] **Step 6: Commit**

```bash
git add packages/bootstrap-runtime/src/roots.ts packages/bootstrap-runtime/src/roots.test.ts packages/bootstrap-runtime/src/index.ts

git commit -m "feat: resolve bootstrap lifecycle roots"
```

---

# Task 5: Implement the `proper-lockfile` Bootstrap Ownership Adapter in No-Stale-Takeover Mode

**Files:**
- Create: `packages/bootstrap-runtime/src/bootstrap-ownership.ts`
- Create: `packages/bootstrap-runtime/src/bootstrap-ownership.test.ts`
- Create: `packages/bootstrap-runtime/test/fixtures/lock-contender.mjs`
- Create: `docs/engineering/gotchas/bootstrap/proper-lockfile-stale-reclaim.md`
- Modify: `docs/engineering/GOTCHAS.md`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Interfaces:**
- Consumes: resolved `INSTANCE` root and explicit heartbeat interval.
- Produces: `BootstrapOwnershipLease` and `acquireBootstrapOwnership()`.
- `proper-lockfile` appears only inside `bootstrap-ownership.ts` in product TypeScript source.

Define:

```ts
export type BootstrapOwnershipState = "HELD" | "COMPROMISED" | "RELEASED";

export interface BootstrapOwnershipLease {
  readonly state: BootstrapOwnershipState;
  readonly signal: AbortSignal;
  assertHeld(): void;
  release(): Promise<void>;
}

export interface BootstrapOwnershipOptions {
  readonly heartbeatMs: number;
}

export async function acquireBootstrapOwnership(
  instanceRoot: ResolvedLifecycleRoot,
  options: BootstrapOwnershipOptions,
): Promise<BootstrapOwnershipLease>;
```

`heartbeatMs` must be an integer >= 1000 ms. M2 exposes no stale timeout and no acquisition retry policy.

- [ ] **Step 1: Write a failing single-process lease-state test**

Test state transitions:

```text
acquire → HELD
assertHeld succeeds
release → RELEASED
assertHeld after release → ProblemError bootstrap.ownership.not_held
second release is safe/idempotent or returns the chosen stable already-released result consistently
```

Prefer idempotent `release()` at the Heptalogos facade even if the underlying library release function is not idempotent.

- [ ] **Step 2: Implement a narrow CJS mechanics type with `createRequire`**

Do not add `@types/proper-lockfile`.

Inside `bootstrap-ownership.ts` define only the mechanics actually used:

```ts
type ProperLockOptions = {
  readonly stale: number;
  readonly update: number;
  readonly retries: number;
  readonly realpath: boolean;
  readonly lockfilePath: string;
  readonly onCompromised: (error: Error) => void;
};

type ProperLockfile = {
  lock(file: string, options: ProperLockOptions): Promise<() => Promise<void>>;
};
```

Load it using `createRequire(import.meta.url)` and cast only inside this adapter.

- [ ] **Step 3: Disable automatic stale reclamation by construction**

Use:

```ts
const NO_AUTOMATIC_STALE_RECLAIM_MS = Number.MAX_SAFE_INTEGER;
```

Call the library with:

```text
file = instanceRoot.canonicalPath
lockfilePath = <INSTANCE>/.heptalogos-bootstrap.lock
realpath = true
stale = NO_AUTOMATIC_STALE_RECLAIM_MS
update = heartbeatMs
retries = 0
```

This is an M2 safety invariant. Do not surface `stale` as a configuration option.

Map acquisition conflict to a bounded Problem:

```text
problemCode: bootstrap.ownership.already_held
category: conflict
retryClass: after-change
```

Do not expose raw library error messages as the machine contract.

- [ ] **Step 4: Implement compromised-lock fail-safe state**

The adapter's `onCompromised` callback must:

```text
state → COMPROMISED
AbortController.abort()
retain a bounded safe cause Problem for assertHeld()
```

It must not silently continue as HELD.

`assertHeld()` after compromise throws:

```text
bootstrap.ownership.compromised
```

Do not use an uncaught asynchronous throw as the product state model.

- [ ] **Step 5: Write real cross-process exclusivity test**

`lock-contender.mjs` must:

1. receive `instanceRoot`, `holdMs`, and a result-file path via argv;
2. use `proper-lockfile@selected-version` directly with the **same M2 no-stale settings**;
3. after acquisition, attempt `mkdir(<instanceRoot>/.critical-owner)`;
4. if `.critical-owner` already exists, write `DOUBLE_OWNER` to the result file and exit non-zero;
5. hold for `holdMs`, remove `.critical-owner`, release, and exit zero;
6. if lock acquisition reports held by another process, write `LOCKED` and exit with a distinct expected code.

The Vitest parent must launch at least two contenders nearly simultaneously against the same `INSTANCE` root and assert:

```text
exactly one contender enters the critical section at a time
no DOUBLE_OWNER result exists
```

Use `node:child_process` directly in the test; do not import repository-only `repo-kit` into product source.

- [ ] **Step 6: Write the abandoned-lock safety test**

Create the exact lock directory used by the adapter without an owning process, then use `utimes()` to set its mtime far enough in the past that the library default stale policy would ordinarily consider it stale.

Then acquire through the M2 adapter and assert it **does not steal the abandoned lock** and instead returns:

```text
bootstrap.ownership.already_held
```

Do not use process-kill timing or wait for the production stale duration. The test is deterministic: an ownerless, deliberately old lock directory remains locked/recovery-required under the M2 adapter.

- [ ] **Step 7: Record the real GOTCHA**

Create `docs/engineering/gotchas/bootstrap/proper-lockfile-stale-reclaim.md` with:

```text
symptom/risk: automatic stale takeover can create an overlapping-owner window
upstream evidence: proper-lockfile 4.1.2 acquire/remove/reacquire path + issue #121
Heptalogos consequence: cannot use stale takeover as pre-PG Authority fence without further qualification
current supported rule: M2 disables automatic stale reclaim; abandoned lock is recovery-required
regression evidence: named M2 ownership tests
reopen trigger: a proven upstream/new route or bounded recovery algorithm that closes the race
```

Add one index row to `docs/engineering/GOTCHAS.md`. Do not create a Recovery PLAYBOOK because M2 does not yet support recovery.

- [ ] **Step 8: Verify**

```bash
pnpm exec vitest run packages/bootstrap-runtime/src/bootstrap-ownership.test.ts
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

Expected: `PASS` on the current host.

**STOP condition:** if the selected 4.x package cannot provide exclusive ownership even in the no-stale-takeover profile, mark this task `BLOCKED`, do not add a fallback, and reopen `bootstrap.lock` RoleDecision with the concrete failure evidence.

- [ ] **Step 9: Commit**

```bash
git add packages/bootstrap-runtime docs/engineering/GOTCHAS.md docs/engineering/gotchas/bootstrap/proper-lockfile-stale-reclaim.md

git commit -m "feat: add fail-safe bootstrap ownership"
```

---

# Task 6: Bind BootstrapState Mutation to Ownership While Keeping Journal Pre-Ownership

**Files:**
- Create: `packages/bootstrap-runtime/src/bootstrap-state-access.ts`
- Create: `packages/bootstrap-runtime/src/bootstrap-state-access.test.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`
- Modify: `scripts/verify/boundaries.mjs`
- Modify: `tools/repo-kit/test/...` only if the repository verifier has an existing appropriate fixture location and a new fixture is required

**Interfaces:**
- Consumes: `BootstrapStateStore`, `BootstrapJournal`, `BootstrapOwnershipLease`, `BootstrapPathProfile`.
- Produces: `OwnedBootstrapStateStore`, `openBootstrapStateAccess()`.
- Journal remains available without ownership; state mutation does not.

Define:

```ts
export interface BootstrapStateAccess {
  readonly journal: BootstrapJournal;
  readonly state: OwnedBootstrapStateStore;
}

export interface OwnedBootstrapStateStore {
  load(): Promise<BootstrapStateLoadResult>;
  commit(candidate: BootstrapStateBodyV1): Promise<BootstrapStateEnvelopeV1>;
}
```

The bound directories are fixed by M2:

```text
BootstrapStateStore directory = <INSTANCE>/bootstrap-state
BootstrapJournal base directory = <INSTANCE>
```

The existing journal implementation then stores:

```text
<INSTANCE>/bootstrap-journal/<BootId>.json
```

- [ ] **Step 1: Write failing ownership-guard tests**

Use a fake `BootstrapOwnershipLease` that can switch state.

Test:

```text
state.load before ownership assertion is allowed
state.commit while lease HELD succeeds
state.commit after lease RELEASED fails before touching disk
state.commit after lease COMPROMISED fails before touching disk
journal.checkpoint can be written before lock acquisition
```

For the last three cases compare directory contents/mtime to prove the rejected commit does not write.

- [ ] **Step 2: Implement the owned state wrapper**

`OwnedBootstrapStateStore.commit()` must execute:

```ts
lease.assertHeld();
return raw.commit(candidate);
```

Do not expose `raw` publicly.

`load()` is read-only and may call the raw store without asserting ownership.

- [ ] **Step 3: Bind paths through `BootstrapPathProfile` only**

No consumer constructs bootstrap-state paths with `process.cwd()`, package directory, or ad hoc literals.

`openBootstrapStateAccess(profile, lease)` derives only from the resolved `INSTANCE` root.

- [ ] **Step 4: Add a mechanical workspace-boundary rule**

Extend `scripts/verify/boundaries.mjs` narrowly so product source outside:

```text
packages/bootstrap-state/**
packages/bootstrap-runtime/**
```

cannot import `@heptalogos/bootstrap-state` directly.

Also ensure product TypeScript source may import `proper-lockfile` only from:

```text
packages/bootstrap-runtime/src/bootstrap-ownership.ts
```

Implement this as a small data-driven restricted-import table, not scattered special-case `if` statements, so future boundary rules can use the same mechanism.

Example shape:

```js
const restrictedImports = new Map([
  ["@heptalogos/bootstrap-state", ["packages/bootstrap-runtime/", "packages/bootstrap-state/"]],
  ["proper-lockfile", ["packages/bootstrap-runtime/src/bootstrap-ownership.ts"]],
]);
```

Normalize paths to `/` before matching. Existing dependency-authority checks must remain intact.

- [ ] **Step 5: Add verifier regression fixtures/tests**

If the existing boundary verifier has no direct test harness, add the smallest repository-tooling fixture/test necessary to prove:

```text
allowed bootstrap-runtime import passes
forbidden external proper-lockfile import fails
forbidden future product direct bootstrap-state import fails
```

Do not weaken the repository verifier to make the new package pass.

- [ ] **Step 6: Verify**

```bash
pnpm exec vitest run packages/bootstrap-runtime/src/bootstrap-state-access.test.ts
pnpm check:boundaries
pnpm check:repository
pnpm typecheck
pnpm tsc6
```

Expected: `PASS`.

- [ ] **Step 7: Commit**

```bash
git add packages/bootstrap-runtime/src scripts/verify/boundaries.mjs tools/repo-kit

git commit -m "feat: fence bootstrap state mutation by ownership"
```

Stage `tools/repo-kit` only if a verifier regression fixture/test was actually added there.

---

# Task 7: Implement the Executable Pre-PostgreSQL Bootstrap Prelude

**Files:**
- Create: `packages/bootstrap-runtime/src/bootstrap-prelude.ts`
- Create: `packages/bootstrap-runtime/src/bootstrap-prelude.test.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Interfaces:**
- Consumes: locator loader, path resolver, identity helpers, V2 journal, bootstrap ownership, owned state access.
- Produces: `prepareBootstrapPrelude()` and `PreparedBootstrapPrelude.acquireOwnership()`.
- This is the M2 system-level executable closure; it still does not start PostgreSQL.

Define:

```ts
export interface PreparedBootstrapPrelude {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly journal: BootstrapJournal;
  readonly preliminaryState: BootstrapStateLoadResult;
  acquireOwnership(options: BootstrapOwnershipOptions): Promise<OwnedBootstrapPrelude>;
}

export interface OwnedBootstrapPrelude {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly ownership: BootstrapOwnershipLease;
  readonly state: OwnedBootstrapStateStore;
  readonly authoritativeState: BootstrapStateLoadResult;
  close(): Promise<void>;
}

export async function prepareBootstrapPrelude(
  anchorRoot: string,
): Promise<PreparedBootstrapPrelude>;
```

- [ ] **Step 1: Write the failing happy-path system test**

Create a complete temporary locator/root fixture and valid BootstrapState.

Call:

```ts
const prepared = await prepareBootstrapPrelude(anchorRoot);
const owned = await prepared.acquireOwnership({ heartbeatMs: 1000 });
```

Assert:

```text
InstallationId/InstanceId come from locator
BootId is new UUIDv7
preliminaryState is read before ownership
owned.authoritativeState is reloaded after ownership
journal contains early locator/root/preliminary-state/ownership stages
state commit succeeds only through owned.state
close releases ownership
```

- [ ] **Step 2: Implement stage ordering explicitly**

The prelude must capture bounded V2 stages in this semantic order:

```text
bootstrap.prelude.started
bootstrap.locator.resolved
bootstrap.roots.resolved
bootstrap.state.preliminary_read
bootstrap.ownership.acquired | bootstrap.ownership.blocked
bootstrap.state.authoritative_reload
bootstrap.prelude.owned
bootstrap.prelude.released
```

`bootstrap.prelude.started` and `bootstrap.locator.resolved` occur before a validated journal directory is available. Capture their canonical timestamps and stage data in a bounded in-memory list. After `bootstrap.roots.resolved` validates the `INSTANCE` root, construct `BootstrapJournal` and flush the buffered V2 checkpoints in original order before continuing. Never write to the raw configured `INSTANCE` path before root validation.

If locator/root resolution fails before a validated `INSTANCE` root exists, return the structured `Problem`; durable journal evidence is legitimately unavailable because the product has not yet established a trusted journal location. Do not invent an anchor-local fallback journal.

Do not make stage strings dynamically generated. Checkpoint failures after the journal location exists must surface as bootstrap failure; do not silently discard early evidence errors.

- [ ] **Step 3: Re-read BootstrapState after ownership acquisition**

This is mandatory:

```text
pre-lock state read = diagnostics/candidate only
post-lock state read = authoritative input for later bootstrap work
```

Do not return the preliminary object as the owned authoritative state.

- [ ] **Step 4: Write the competing-prelude test**

Launch two prepared preludes for the same instance.

Assert:

```text
both get distinct BootIds
both may write their own journal files
exactly one acquires ownership
blocked contender receives bootstrap.ownership.already_held
blocked contender does not mutate BootstrapState
winning owner remains valid
```

This directly proves the reason journals are per-BootId.

- [ ] **Step 5: Write the different-instance concurrency test**

Create two locators sharing the same `PROGRAM` root but different `INSTANCE` roots and IDs.

Acquire both simultaneously and assert both succeed. Bootstrap ownership is per logical instance, not a global host-wide mutex.

- [ ] **Step 6: Write the abandoned-lock test at prelude level**

Pre-create an abandoned `.heptalogos-bootstrap.lock` with very old mtime.

`prepareBootstrapPrelude()` may still resolve/read/journal. `acquireOwnership()` must return the stable locked/recovery-required Problem and must not delete/reclaim the lock directory.

This is the accepted M2 behavior.

- [ ] **Step 7: Export only the bootstrap semantic facade**

Remove the temporary package marker from `index.ts` and export the semantic contracts/functions needed by the later H1 PostgreSQL milestone. Do not export `proper-lockfile` mechanics or raw Ajv schemas.

- [ ] **Step 8: Verify focused system tests**

```bash
pnpm exec vitest run packages/bootstrap-runtime/src/bootstrap-prelude.test.ts
pnpm test
pnpm typecheck
pnpm tsc6
pnpm build
```

Expected: `PASS` locally except explicit platform-specific skips in root tests.

- [ ] **Step 9: Commit**

```bash
git add packages/bootstrap-runtime/src

git commit -m "feat: add pre-postgresql bootstrap prelude"
```

---

# Task 8: M2 Acceptance, Cross-Platform Evidence Preparation, and Plan Closure

**Files:**
- Modify: `docs/plans/active/foundation/m2-pre-postgresql-bootstrap-substrate.md` execution record during local verification
- Move on successful implementation closure: `docs/plans/active/foundation/m2-pre-postgresql-bootstrap-substrate.md` → `docs/plans/completed/foundation/m2-pre-postgresql-bootstrap-substrate.md`
- Modify: `docs/plans/README.md` only if its current index format requires the completed plan to be listed
- Modify: `.agents/heptalogos/package-manifest.json` only if a governed resource changed and the existing validator requires synchronization
- Modify: `Architecture_Corpus` manifests/hashes only if the implementation legitimately changed Corpus current-state documentation; normal M2 code must not do so merely for bookkeeping

## M2 Acceptance Matrix

Before moving the plan to completed, record these claims exactly:

| Claim | Required local evidence before review | Final cross-platform CI expectation |
|---|---|---|
| strict locator decoding | PASS | PASS all OS |
| InstallationId/InstanceId/BootId semantics | PASS | PASS all OS |
| independent lifecycle roots | PASS | PASS all OS |
| configured terminal POSIX symlink rejection | current POSIX host PASS or NOT_RUN | Linux/macOS PASS |
| configured terminal Windows junction rejection | Windows PASS or NOT_RUN | Windows PASS |
| same-instance cross-process exclusive bootstrap owner | PASS current host | PASS all OS |
| different-instance concurrent owners | PASS current host | PASS all OS |
| abandoned lock is not automatically stolen | PASS current host | PASS all OS |
| BootstrapState commit requires HELD ownership | PASS | PASS all OS |
| per-BootId blocked contender journal survives | PASS | PASS all OS |
| full reparse/parent-component TOCTOU resistance | NOT_RUN | NOT_RUN unless separately qualified |
| abandoned-lock Recovery | NOT_RUN | NOT_RUN — later H1 milestone |
| private PostgreSQL | NOT_RUN | NOT_RUN — later H1 milestone |
| Host lease/fence | NOT_RUN | NOT_RUN — later H1 milestone |
| source-less/service packaging | NOT_RUN | NOT_RUN — later product qualification |

- [ ] **Step 1: Run focused M2 suite from a clean build state**

```bash
pnpm exec vitest run packages/foundation-contracts/src/identity.test.ts
pnpm exec vitest run packages/foundation-contracts/src/lifecycle-root.test.ts
pnpm exec vitest run packages/bootstrap-state/src/journal.test.ts
pnpm exec vitest run packages/bootstrap-runtime
```

Expected current-host applicable cases: `PASS`.

- [ ] **Step 2: Run permanent repository gates**

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

Then run the canonical aggregate:

```bash
pnpm verify
```

Expected: `PASS`.

- [ ] **Step 3: Inspect all behavior-affecting literals introduced by M2**

At minimum classify:

```text
proper-lockfile stale = M2 SAFETY INVARIANT (automatic stale takeover disabled)
heartbeatMs = explicit bootstrap adapter input, no hidden default
lock directory name = stable implementation constant scoped to INSTANCE root
locator filename = stable bootstrap contract constant
journal stage names = stable semantic convention
```

Do not leave an unclassified retry count/timeout/backoff/TTL in product code.

- [ ] **Step 4: Inspect dependency/framework leakage**

Search:

```bash
rg -n 'proper-lockfile|Ajv|typebox' packages --glob '*.ts'
```

Expected:

```text
proper-lockfile product import only in bootstrap-ownership.ts
Ajv/TypeBox locator mechanics only behind locator/bootstrap-state internals
no mechanics types in exported semantic signatures
```

Run `pnpm check:boundaries` again after the inspection.

- [ ] **Step 5: Inspect git diff and scope**

```bash
git status --short
git diff --stat master...HEAD
git diff master...HEAD
```

Expected scope only:

```text
Foundation identity refinement
early journal compatibility
bootstrap-runtime package
proper-lockfile Catalog materialization
bootstrap ownership/path/locator tests
boundary governance for the new adapters
one real GOTCHA
active/completed M2 plan record
```

If PostgreSQL/DBOS/Cordis/Management/Subject or another future subsystem appears, M2 scope has leaked; remove it or STOP.

- [ ] **Step 6: Update the plan execution record truthfully**

Record:

```text
exact base SHA
exact final implementation HEAD SHA
exact proper-lockfile version
every verification command result
platform-sensitive PASS/NOT_RUN status
remaining H1 debt
proper-lockfile automatic stale reclaim = intentionally disabled/unqualified
abandoned lock recovery = NOT_RUN
```

Do not state H1 `PASS`; only M2 pre-PG substrate may be `PASS`.

- [ ] **Step 7: Move the plan to completed only after local implementation gates PASS**

```bash
git mv \
  docs/plans/active/foundation/m2-pre-postgresql-bootstrap-substrate.md \
  docs/plans/completed/foundation/m2-pre-postgresql-bootstrap-substrate.md
```

Set:

```markdown
**Status:** COMPLETED
```

The completion record must still show final CI as `NOT_RUN` at this moment because independent review has not happened yet. Do not create a commit claiming final CI PASS before it runs.

- [ ] **Step 8: Commit the local closure record**

```bash
git add docs/plans docs/engineering .agents/heptalogos/package-manifest.json Architecture_Corpus

git commit -m "docs: close Foundation M2 implementation"
```

Stage `.agents`/`Architecture_Corpus` only if actually changed by governed-resource synchronization. Do not touch Corpus merely to create a closure commit.

- [ ] **Step 9: Re-run `pnpm verify` on the exact final candidate HEAD**

```bash
pnpm verify
git status --short
git rev-parse HEAD
```

Expected:

```text
pnpm verify = PASS
working tree = clean
HEAD = exact review candidate SHA
```

Update PR metadata with that mechanically copied full SHA. Never reconstruct a 40-character SHA from a short prefix.

- [ ] **Step 10: Mark Draft PR Ready and STOP for independent review**

Do not trigger final CI yet.

Independent reviewer must review the exact current HEAD.

After independent review PASS, the repository's manual final CI must run the trusted workflow from `master` against that exact reviewed target SHA on Ubuntu/macOS/Windows. Any commit after review invalidates review; any commit after final CI invalidates both review and CI authorization.

Only after all three platform jobs PASS and HEAD remains unchanged may the PR be squash-merged.

---

# Mandatory STOP Conditions

Stop implementation and report instead of improvising if any of these occur:

1. `proper-lockfile` 4.x cannot provide exclusive ownership in the no-stale-takeover profile.
2. Correct M2 behavior appears to require automatic stale lock reclamation.
3. Correctness requires a second filesystem/OS lock provider.
4. Root safety requires claims beyond what Node/platform evidence can prove in this milestone.
5. The locator requires normal ConfigurationService or SecretService.
6. Bootstrap ownership requires PostgreSQL to become correct — that means the M2 split is wrong and must be revised explicitly.
7. M2 needs to mutate normal canonical product state.
8. Implementing bootstrap state fencing requires exposing raw `BootstrapStateStore` to arbitrary future packages.
9. The plan starts implementing private PostgreSQL, Host lease/fence, Runtime Kernel, DBOS, Management, Messaging, AI, or Subject merely to make acceptance more impressive.
10. Architecture Corpus must be violated or silently reinterpreted.

No custom fallback may be committed behind the selected dependency route when a STOP condition is hit.

---

# Expected M2 Product Truth at Completion

If M2 passes, the repository may truthfully claim:

```text
A provisioned installation locator can be strictly decoded.
InstallationId and InstanceId survive ordinary restart; each attempt gets a new BootId.
Independent lifecycle roots are resolved without assuming a common parent.
The configured terminal root link policy has real cross-platform tests at the level claimed.
Every bootstrap attempt can leave a per-BootId early journal before PG exists.
Exactly one normal bootstrap attempt can hold the pre-PG bootstrap ownership lease per instance under the supported no-stale-takeover profile.
A second contender is blocked but can still record its own journal.
BootstrapState may be read before ownership, but mutation is mechanically guarded by current ownership.
BootstrapState is re-read after ownership before later bootstrap work treats it as authoritative.
Abandoned automatic lock takeover is intentionally NOT supported yet.
```

It may **not** claim:

```text
H1 complete
private PostgreSQL qualified
safe abandoned-lock Recovery complete
Host ownership/fencing complete
normal canonical mutation admitted
source-less/service-mode product boot complete
full malicious-filesystem/reparse-point hardening complete
```

The next H1 implementation plan should consume M2's `OwnedBootstrapPrelude` and close the private PostgreSQL + advisory Host lease + `HostOwnershipFence` handoff, including a safe explicit recovery path for an abandoned pre-PG lock. That follow-on scope must be planned separately after M2 evidence exists.


## Execution Record

- execution base SHA: `fed29824f089f0b5cee96d458c0a4b6124525da7`
- Node version: `24.19.0`
- pnpm version: `11.22.0`
- proper-lockfile exact version selected: `4.1.2`
- proper-lockfile source tag: `v4.1.2`; upstream source uses atomic `mkdir` acquisition and stale `rmdir`/reacquire.
- upstream stale-reclaim issue: moxystudio/node-proper-lockfile issue `#121` remains open; the reported concurrent stale-reclaim race is unresolved.
- M2 stale-reclaim policy: automatic stale takeover is intentionally disabled; abandoned locks remain recovery-required.
- inherited baseline: `pnpm install --frozen-lockfile` and `pnpm verify` passed under Node `24.19.0` / pnpm `11.22.0`.
- environment note: the default shell Node `26.5.0` was rejected by the repository engine constraint; all M2 commands use the installed Node `24.19.0` runtime.
