# H2A-2 Canonical Schema & Continuity Authority Implementation Plan

**Repository plan state:** `ACTIVE`  
**H2A-2 base SHA:** `b306975bba3592a0d8c2e2e6d1649f2523af27bc`  
**Behavior branch:** `dev/h2a2-canonical-schema-continuity-authority`  
**Phase A merge PR:** [#14](https://github.com/ArsvineZhu/Heptalogos/pull/14)  
**Phase A merge SHA:** `b306975bba3592a0d8c2e2e6d1649f2523af27bc`

This active implementation record copies the Phase B design, tasks, invariants,
verification requirements, and closure procedure from the approved control plan
`.superpowers/Heptalogos-H2A-2-Execution-Control-Plan-2026-08-24.md`. The
recorded base SHA is frozen before behavior implementation begins.

---

# Phase B — H2A-2 Canonical Schema & Continuity Authority

**Hard precondition:** Phase A is merged and its exact merge SHA has been read from live `origin/master`.

Create:

```bash
git switch master
git pull --ff-only origin master
H2A2_BASE_SHA="$(git rev-parse HEAD)"
test "$H2A2_BASE_SHA" = "$(git rev-parse origin/master)"
git switch -c dev/h2a2-canonical-schema-continuity-authority
```

Create the repository plan:

`docs/plans/active/foundation/h2a2-canonical-schema-continuity-authority.md`

Copy the Phase B design/tasks from this control plan and record the actual `H2A2_BASE_SHA` in its header before behavior code is changed.

Open a Draft PR early. Ordinary pushes do not dispatch CI.

---

## Task B1 — Add `ContinuityEpochId` primitive

**Modify:**
- `packages/foundation-contracts/src/identity.ts`
- `packages/foundation-contracts/src/index.ts`
- corresponding identity tests

### Interface

Add:

```ts
export type ContinuityEpochId = UuidV7Id<"ContinuityEpochId">;

export const createContinuityEpochId = (): ContinuityEpochId =>
  createUuidV7Id("ContinuityEpochId");

export const parseContinuityEpochId = (
  value: unknown,
): ContinuityEpochId | undefined =>
  parseUuidV7Id("ContinuityEpochId", value);
```

Do not introduce a second UUID implementation.

### Tests

Prove:
- generated ID is UUIDv7;
- parser accepts generated/current valid value;
- parser rejects wrong UUID version and malformed values;
- package-root export is present.

Run targeted test, then package typecheck/build.

Commit:

```bash
git commit -am "feat: add continuity epoch identity"
```

---

## Task B2 — Evolve BootstrapState to V2 with bounded V1→V2 upgrade

**Modify:**
- `packages/bootstrap-state/src/model.ts`
- `packages/bootstrap-state/src/codec.ts`
- `packages/bootstrap-state/src/store.ts`
- `packages/bootstrap-state/src/index.ts`
- relevant `codec.test.ts`, `store.test.ts`, fixtures

### Model

Define `BootstrapStateBodyV2` with:

```ts
readonly schemaVersion: 2;
readonly revision: number;
readonly continuityEpochId: ContinuityEpochId;
```

plus all current required V1 fields.

Keep V1 only as the explicitly declared immediate-upgrade input. Normal post-upgrade canonical writes seal V2.

### Upgrade semantics

Under bootstrap ownership:

```text
V2
→ reuse exact continuityEpochId

V1 current H2A-1 shape
→ generate ContinuityEpochId once
→ commit V2 through BootstrapStateStore crash-safe replace
→ reload/verify committed V2
→ all retry paths reuse committed epoch

unknown/obsolete non-declared shape
→ reject
```

Do not silently create an epoch while merely parsing an unowned file.

### Tests

Prove:
- V2 canonical encode/digest/parse;
- V1→V2 upgrade only with owning mutation path;
- same V1 upgrade attempt cannot commit two different epochs;
- crash/retry after V2 commit reuses same epoch;
- unknown historical shape remains rejected;
- recovered previous state is never silently promoted over current committed state.

Commit:

```bash
git commit -am "feat: persist continuity epoch in bootstrap state"
```

---

## Task B3 — Add a distinct PostgreSQL migration principal

**Modify:**
- `packages/host-ownership/src/contracts.ts`
- `packages/host-ownership/src/bootstrap-admin.ts`
- role/schema verification tests
- `packages/bootstrap-runtime/src/bootstrap-key-provider.ts`
- bootstrap key-provider tests
- any exact role provisioning/inspection code that currently enumerates bootstrap/owner/lease/runtime roles

### Role topology

Add:

```text
heptalogos_migration
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  NOBYPASSRLS
  NOINHERIT
  member of heptalogos_owner
  dedicated migration credential
  not used by normal application pool
```

Migration code must explicitly activate owner privileges for the bounded migration session; normal runtime remains without role membership/escalation.

Do not reuse:
- bootstrap superuser as the normal migration connection;
- `heptalogos_runtime`;
- `heptalogos_host_lease`.

Extend `BootstrapKeyProvider` with a distinct purpose/method for the migration role. Secret material remains scoped and never appears in argv/log/Problem/Evidence.

### Tests

Prove:
- role exact properties;
- distinct credential;
- runtime cannot `SET ROLE heptalogos_owner`;
- migration role can enter only the intended owner role path;
- migration role is not the Host lease principal;
- existing H2A-1 runtime least-privilege matrix remains PASS.

Commit:

```bash
git commit -am "feat: provision canonical migration authority"
```

---

## Task B4 — Define a no-cycle canonical-initialization authority seam

**Modify:**
- `packages/host-ownership/src/contracts.ts`
- `packages/host-ownership/src/index.ts`
- `packages/bootstrap-runtime/src/managed-host.ts`
- `packages/bootstrap-runtime/src/host-ownership-handoff.ts`
- relevant tests

### Contract

Define these exact Heptalogos-owned lower-level authority contracts in `host-ownership`:

```ts
export interface HostCanonicalMigrationAuthority {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly token: HostOwnershipToken;
  readonly continuityEpochId: ContinuityEpochId;
  readonly target: HostMigrationDatabaseTarget;
  readonly signal: AbortSignal;

  assertCurrent(): void;

  withMigrationDatabasePassword<T>(
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
}

export interface CanonicalInitializationHandler {
  initialize(authority: HostCanonicalMigrationAuthority): Promise<void>;
}
```

These names are part of this implementation plan. If existing repository naming creates a concrete collision, stop and amend the plan instead of silently renaming the contract.

`assertCurrent()` must prove both:
- bootstrap ownership is still current;
- provisional Host lease/ownership is still active.

### Dependency rule

```text
host-ownership          <- contract only
bootstrap-runtime       <- issues/calls authority
persistence             <- implements handler/mechanics

bootstrap-runtime -X-> persistence
```

Production dependency graph must remain acyclic.

### Managed Host context

Expose `continuityEpochId` on `BootstrapManagedHostContext` and the H1→H2 persistence capability so H2A-3 can construct trusted `ExecutionContext` without re-reading ad-hoc state.

Do not give normal runtime any method that rotates the epoch.

Commit:

```bash
git commit -am "feat: add canonical initialization authority seam"
```

---

## Task B5 — Move bootstrap release after canonical initialization

**Modify:**
- `packages/bootstrap-runtime/src/host-ownership-handoff.ts`
- bootstrap handoff tests
- bootstrap journal stage assertions

### Required order

Change the forward handoff to:

```text
bootstrap ownership held
→ private DB validated/provisioned
→ Host reservation/lease
→ HostOwnershipFence validated
→ fresh HostOwnershipToken published
→ expected ContinuityEpochId loaded from committed BootstrapState V2
→ invoke CanonicalInitializationHandler under HostCanonicalMigrationAuthority
→ handler succeeds and authority still current
→ mark private PG handed off
→ release bootstrap ownership
→ verify Host lease still active
→ return managed Host
```

The handler is required for the H2A-2 normal Host path; do not retain a silent bypass that returns normal runtime before canonical initialization.

### Failure

If canonical initialization fails:
- no managed Host is returned;
- bootstrap ownership is not deliberately released as a success handoff;
- provisional Host lease is closed/fenced;
- failure is journaled with a stable Problem code;
- retry after reboot reuses the already-committed ContinuityEpochId.

Add bounded journal stages for:
- continuity epoch ready;
- canonical initialization started;
- canonical initialization succeeded/failed;
- forward handoff completed.

Commit:

```bash
git commit -am "feat: gate host handoff on canonical initialization"
```

---

## Task B6 — Implement Kysely canonical migration mechanics in `@heptalogos/persistence`

**Create/modify under `packages/persistence/src/`:**
- `canonical-initialization.ts`
- `schema-migrations.ts`
- `migrations/0001-system-continuity.ts`
- focused tests
- package root exports only for Heptalogos-owned initialization entrypoint/types; do not export Kysely objects

Use the installed Kysely version and inspect its local type declarations before coding the `Migrator`/`MigrationProvider` calls. Do not change dependency/provider route.

### Source-less-friendly migration provider

Migrations must be compiled/imported code, not runtime discovery of repository source files. Use an in-memory/static migration provider/registry so the product does not require `src/`, globbing, or a developer filesystem at runtime.

### Migration connection

- connect as `heptalogos_migration`;
- explicitly activate `heptalogos_owner` for migration work;
- bounded connection/session;
- migration objects/tables owned by `heptalogos_owner`;
- no migration framework object leaks out.

### First migration

Create the minimum canonical continuity relation, e.g. semantic shape:

```text
heptalogos.system_continuity
  singleton boolean primary key constrained true
  instance_id uuid/text canonical identity
  continuity_epoch_id uuid/text canonical identity
```

Use repository conventions for PostgreSQL identity representation.

Grant:
- runtime `SELECT` only on continuity state;
- no runtime `INSERT/UPDATE/DELETE`;
- no runtime schema `CREATE`.

Migration metadata tables also remain inaccessible for normal mutation except what is strictly necessary for read diagnostics later; default is no ordinary runtime write access.

Commit:

```bash
git add packages/persistence/src
git commit -m "feat: add canonical schema migrator"
```

---

## Task B7 — Materialize and verify the ContinuityEpoch

**Modify:**
- `packages/persistence/src/canonical-initialization.ts`
- tests

After Kysely migrations:

```text
read system_continuity singleton

missing:
  insert expected InstanceId + ContinuityEpochId under migration authority
  re-read exact committed row

present and exact:
  PASS

present but InstanceId mismatch:
  FAIL integrity

present but ContinuityEpochId mismatch:
  FAIL continuity/recovery integrity
```

Normal initialization must never overwrite a mismatched epoch.

Define stable Problems at least for:
- canonical migration failure;
- continuity state malformed;
- continuity instance mismatch;
- continuity epoch mismatch;
- migration authority fenced/lost.

Do not include SQL text, password, or raw driver errors in stable Problems.

Commit:

```bash
git commit -am "feat: materialize canonical continuity epoch"
```

---

## Task B8 — Real PostgreSQL integration and restart/failure matrix

Extend the real PostgreSQL integration path rather than proving these semantics with mocks only.

### Required scenarios

At minimum prove:

**C1 — fresh initialization**
```text
BootstrapState V1/V2 preparation
→ current Host ownership
→ migration
→ continuity row
→ normal managed Host returned
```

**C2 — ordinary restart**
```text
new BootId
new HostOwnershipToken
same InstanceId
same ContinuityEpochId
```

**C3 — migration idempotence**
Repeated normal startup does not create a second epoch or duplicate migration.

**C4 — runtime privilege closure**
`heptalogos_runtime` can read continuity state but cannot update it, create schema/table, mutate migration tables, or `SET ROLE` to owner/migration authority.

**C5 — failure before DB materialization**
Inject failure after BootstrapState V2 epoch commit but before continuity insert; next authorized attempt reuses the same epoch and completes.

**C6 — failure after migration before handoff release**
No normal Host escapes; next attempt completes safely.

**C7 — canonical epoch mismatch**
Bootstrap expected epoch != DB epoch ⇒ startup blocked with structured integrity/recovery Problem; no overwrite.

**C8 — lease/authority loss during initialization**
Initialization fails closed and does not release bootstrap as a successful handoff.

**C9 — H2A-1 regression**
Existing persistence P1–P8 and Host/bootstrap integration suites remain PASS.

### Evidence discipline

Record only the platform/runtime actually exercised. If real PostgreSQL runs on Windows only:

```text
windows_real_postgres = PASS
linux_real_postgres   = NOT_RUN
macos_real_postgres   = NOT_RUN
```

Repository final CI is not a substitute for those real-PG claims.

If a process-level restart harness is used, it must use real committed BootstrapState/PostgreSQL state across process boundaries. If only deterministic in-process failpoints are used for a scenario, describe it as deterministic restart/failure semantics, not hardware/process crash evidence.

Commit:

```bash
git commit -am "test: qualify canonical continuity initialization"
```

---

## Task B9 — Qualification, roadmap, and active-plan candidate freeze

**Modify:**
- `Architecture_Corpus/qualification/results/qualification-status.json`
- relevant qualification result Markdown if the repository keeps a companion record
- `docs/roadmap/development-roadmap.md`
- `docs/plans/active/foundation/h2a2-canonical-schema-continuity-authority.md`
- Corpus manifest/SHA files if Corpus content changed

`Q-PERSISTENCE-01` may be extended with H2A-2 implementation evidence because it is the existing persistence/Kysely/PostgreSQL implementation qualification route. Do not mark it CLOSED while any already-required platform/source-less/service properties remain NOT_RUN.

Record H2A-2-specific evidence keys such as:

```text
continuity_epoch_identity
bootstrap_state_v2_upgrade
migration_role_least_privilege
kysely_static_migration_provider
canonical_migration_real_postgres
continuity_materialization
normal_restart_same_epoch
mismatch_fail_closed
runtime_continuity_read_only
h2a1_regression
```

Roadmap current truth after implementation candidate freeze:

```yaml
H2A_1: CLOSED
H2A_2_IMPLEMENTATION: COMPLETE
H2A: OPEN
remaining:
  - TimeService
  - ExecutionContext / Activity identity
  - AsyncLocalStorage + OTel Context
  - minimal retained Lineage/Evidence
  - required evidence atomicity
  - SchemaRuntime integration
```

Do not claim H2A closed.

Run:

```bash
pnpm verify
git status --short
```

Freeze the exact candidate:

```bash
H2A2_HEAD_SHA="$(git rev-parse HEAD)"
printf 'H2A2_BASE_SHA=%s\nH2A2_HEAD_SHA=%s\n' "$H2A2_BASE_SHA" "$H2A2_HEAD_SHA"
```

Update the Draft PR to Ready only after local verification and required real-PG qualification are truthfully recorded.

---

# Phase B review / final CI / merge closure

## External independent review

The implementing Agent must hand off:

```text
base_sha = $H2A2_BASE_SHA
head_sha = $H2A2_HEAD_SHA
PR
plan path
local verification summary
real PostgreSQL evidence summary
NOT_RUN list
```

Then stop for the user/operator-supplied external review result.

**Do not query GitHub reviews/approvals to determine the result.**

If external result is `REQUEST_CHANGES`:
- apply corrections;
- rerun local + claim-matched qualification;
- freeze a new head;
- obtain a new external review.

If external result is `PASS` for the exact pair:
- verify live GitHub base/head still equal that pair;
- manually dispatch final CI for exactly that pair with `reason=final-pre-merge`;
- require Ubuntu/macOS/Windows repository CI PASS;
- re-check base/head immediately before merge;
- squash merge.

Any SHA mismatch invalidates review and final CI.

After H2A-2 squash merge, use a separate docs/evidence-only reconciliation PR exactly as required by `AGENTS.md`; do not mutate the merged behavior candidate.

---

# Explicit non-goals

H2A-2 does **not** implement:

- `TimeService`;
- `ExecutionContext` / AsyncLocalStorage / OTel propagation;
- retained `ActivityRecord` / `EvidenceService`;
- full repository abstraction framework;
- DBOS / WorkQueue / Signal;
- Cordis RuntimeSubstrate / RuntimeReconciler;
- Management/Auth/Policy;
- Subject/Messaging/AI;
- destructive Restore itself;
- generic database migration API for Extensions;
- DataLifecycle/Backup;
- source-less shipping closure.

It only establishes the canonical migration/continuity substrate that those later systems can safely consume.

---

# Completion criteria

Phase A is complete only when:
- H2A-1 merged truth is reconciled;
- Independent Review source semantics are explicit in always-on governance + playbook + gotcha;
- ContinuityEpoch initial/normal/restore authority is unambiguous in Corpus;
- docs-only PR is merged.

Phase B is locally complete only when:
- `ContinuityEpochId` exists as a stable primitive;
- BootstrapState V2 durably anchors the current epoch;
- bounded V1→V2 upgrade is tested;
- distinct migration role/credential exists;
- bootstrap-runtime and persistence remain production-dependency acyclic;
- canonical initialization occurs before bootstrap ownership release;
- Kysely migrations run through the migration authority;
- canonical DB continuity matches BootstrapState;
- normal runtime has read-only continuity visibility and no DDL/epoch-rotation authority;
- mismatch/failure paths fail closed;
- real PostgreSQL qualification is recorded truthfully;
- H2A-1 regressions and `pnpm verify` PASS;
- H2A remains OPEN.

Milestone closure additionally requires:
- external independent review `PASS` on exact `(base_sha, head_sha)`;
- manual final cross-platform CI PASS on the same pair;
- squash merge;
- subsequent docs/evidence-only post-merge truth reconciliation.

