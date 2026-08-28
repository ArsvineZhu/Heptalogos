# Heptalogos H3A-2 — DBOS Durable Execution & Crash Recovery

## Decision-Complete Implementation & Qualification Plan

**Plan date:** 2026-08-29  
**Status:** ACTIVE  
**Roadmap position:** H3 — Survive Asynchrony → H3A-2  
**Scope:** real DBOS durable execution, WorkItem engine projection, process-crash recovery, durable-engine authority isolation, Host lifecycle integration  
**Authority:** subordinate to the current Architecture Corpus; once explicitly activated, this file is the sole implementation-plan Authority for H3A-2  
**Canonical active path:** `docs/plans/active/foundation/h3a2-dbos-durable-execution-crash-recovery-2026-08-29.md`

> **Executor rule**
>
> This plan is decision-complete. The implementation Agent executes it; the Agent does not select architecture, dependency providers, package ownership, durable identities, queue semantics, recovery policy, lifecycle order, compatibility behavior, qualification scope, or alternative failure handling.
>
> Local code organization is discretionary only when alternatives are semantically equivalent and do not change a contract, owner, dependency direction, persisted shape, stable identity, lifecycle, or evidence claim.
>
> If implementation evidence contradicts a locked decision in a non-trivial way, stop with `PLAN_GAP` and provide the smallest concrete counter-evidence. Do not improvise a fallback provider, second scheduler, compatibility path, alternate Authority, or later-horizon subsystem.

---

# 0. Executive outcome

H3A-1 has already established the engine-neutral product semantics:

```text
canonical WorkItem
generation-pinned WorkHandler
dispatchRevision / DispatchAttemptId
Signal wakeup + canonical rescan
WorkAdmissionPort
retry / dependency / cancellation / supersession
Host-fenced WorkItem repository
engine-neutral WorkAttemptExecutor
```

H3A-2 must turn that semantic spine into a real crash-surviving execution system without moving product Authority into DBOS.

The required end state is:

```text
canonical WorkItem
        │
        │ product Authority
        ▼
WorkQueue reconciliation
        │
        │ DurableDispatchPort
        ▼
@heptalogos/durable-execution
        │
        ├─ DBOS 4.27.6 durable workflow
        ├─ DBOS Queue scheduling mechanics
        ├─ dbos.* vendor-private schema
        └─ dedicated least-privilege PostgreSQL role
        │
        ▼
static dispatchWorkItem(WorkItemId, dispatchRevision)
        │
        ▼
WorkAttemptExecutor
        │
        ▼
exact generation-bound WorkHandler
```

The stage closes only when real PostgreSQL + real DBOS + process kill/restart prove:

1. a committed obligation survives a crash before engine projection;
2. duplicate projection of one revision remains one engine attempt;
3. a process crash after `RUNNING` can re-enter the **same** attempt;
4. a canonical terminal commit before the DBOS step checkpoint does not re-run logical work;
5. a stale revision cannot commit;
6. a different durable-code version cannot accidentally recover an old workflow;
7. DBOS remains an engine-private projection and cannot mutate `heptalogos.*`;
8. planned Host shutdown/quiescence settles DurableExecution before Host ownership is released;
9. H3A still contains no consequential external-effect path.

H3A-2 does **not** implement `EffectOperation`, ConfigurationService, real `CONFIG_PINNED`, ResourceGovernor, Subject, Messaging, AI, Management, extension package lifecycle, source-less product packaging, or service-mode product closure.

---

# 1. Current living baseline

The implementation Agent must verify these facts before editing. If `master` has materially moved, compare the movement with this plan; do not mechanically execute against a different architecture.

## 1.1 Repository baseline

Current inspected baseline:

```text
master:
  1e54a3abea1876acac773c7fbccc352d038a9ca8
```

The repository-stabilization candidate has already been merged. Any stale pre-merge roadmap/plan status is normal post-merge housekeeping and is reconciled in Task 0; it is not a new engineering stage.

Current root toolchain Authority includes:

```text
Node.js: 24.20.0
pnpm: 11.24.0
TypeScript 7 primary
TS6 compiler-API compatibility lane
Nx 23
Vitest
Oxlint + residual ESLint/Nx boundaries
Prettier
TypeDoc declaration-first API projection
minimumReleaseAge: 1440 minutes
```

Do not weaken repository release-age, catalog, boundary, lint, documentation, or verification policy to make H3A-2 easier.

## 1.2 Current product packages

The current tree contains H3A-1 owners:

```text
@heptalogos/signal
@heptalogos/work-queue
@heptalogos/runtime-kernel
@heptalogos/persistence
@heptalogos/execution-lineage
```

There is **no** current `@heptalogos/durable-execution` package.

Creating it is authorized by this plan and must exercise the repository's current package discovery/navigation/API-documentation machinery. A new product package should become part of package discovery, generated navigation and TypeDoc projection through the repository owner chain; do not add a parallel handwritten inventory mechanism.

## 1.3 Current WorkQueue implementation reality

Current `@heptalogos/work-queue` already owns:

```text
WorkItem
WorkItemState
WorkRetryClass
WorkConfigurationBinding
WorkQueueProfileId
ResourceAdmissionClassId
DurableDispatchRequest
DurableDispatchPort
WorkQueueRuntimeOptions
WorkQueueService
WorkQueueReconciler
WorkAttemptExecutor
WorkQueueRepository
```

`DurableDispatchRequest` already contains:

```text
WorkItemId
dispatchRevision
DispatchAttemptId
queueProfileId
priority
partitionKey?
notBefore?
```

Current reconciliation already proves:

```text
initial scan
Signal wake -> scan
lost Signal -> reconnect/rescan
bounded anti-entropy
fair PENDING scan
fair WAITING_DEPENDENCY scan
due retry wake -> revision++
same revision -> same DispatchAttemptId
dispatch failure leaves canonical WorkItem recoverable
```

Current real PostgreSQL/Host integration already proves generation pinning, cancellation/supersession, payload/outcome snapshot detachment, projection-index query shape and Host fencing.

H3A-2 must extend this implementation. Do not replace it with a DBOS-centric WorkQueue.

## 1.4 Critical current recovery gap

Current `WorkAttemptExecutor.execute()` behaves approximately as:

```text
terminal
  -> TERMINAL_REPLAY

revision mismatch OR state != PENDING
  -> STALE_NOOP

PENDING
  -> reserve exact handler
  -> PENDING -> RUNNING
  -> execute handler
  -> terminal / RETRY_WAIT
```

That is correct for H3A-1 but insufficient for real process recovery.

If the process dies after:

```text
PENDING -> RUNNING
```

and before terminal commit, DBOS will re-enter the durable step after restart. The current executor sees `RUNNING` and returns `STALE_NOOP`, leaving the WorkItem permanently RUNNING.

**H3A-2 therefore MUST add same-attempt RUNNING recovery.** This is a product semantic correction required to make the already-designed restartable-attempt contract executable.

No second attempt identity is created. No revision is incremented.

## 1.5 Current PostgreSQL authority reality

Current protected roles are:

```text
heptalogos_owner
heptalogos_host_lease
heptalogos_runtime
heptalogos_migration
```

`heptalogos_migration` is not the schema owner. Existing canonical migration mechanics connect as:

```text
session_user = heptalogos_migration
current_user = heptalogos_owner
```

through an explicit role switch.

H3A-2 adds exactly one new role:

```text
heptalogos_durable_execution
```

and the role inspection becomes a five-role closed world. There is no compatibility branch for the old four-role development database.

## 1.6 Current Host composition seam

`BootstrapManagedHostContext` currently exposes:

```text
persistence: HostPersistenceAuthority
```

and bootstrap-runtime already owns the terminal fence, secret callback materialization, forward handoff and reverse maintenance handoff.

H3A-2 extends this same owner with:

```text
durableExecution: HostDurableExecutionAuthority
```

Bootstrap Runtime supplies the engine DB authority but never imports DBOS in production source.

## 1.7 Current qualification truth

`Q-ASYNC-01` already records H3A-1 semantic properties. Relevant residuals remain:

```yaml
h3a1_dbos_real_engine: NOT_RUN
h3a1_process_crash_after_terminal_commit: NOT_RUN
crash_after_terminal_commit: NOT_RUN
```

Do not rewrite historical H3A-1 `NOT_RUN` Independent Review/final-CI fields into PASS. H3A-2 must add new evidence rather than manufacture retrospective evidence.

---

# 2. Architecture invariants

These are non-negotiable.

## 2.1 WorkItem remains the only durable-work product Authority

```text
heptalogos.work_item
  = product obligation/state/outcome Authority

dbos workflow / queue rows
  = engine-private execution projection

Signal payload
  = best-effort wakeup hint

Runtime WorkHandler registry
  = current executable availability
```

DBOS status may be inspected for projection/recovery diagnostics. DBOS status never directly terminalizes a WorkItem.

Forbidden:

```text
DBOS SUCCESS -> mark WorkItem SUCCEEDED
DBOS ERROR -> mark WorkItem FAILED
DBOS CANCELLED -> mark WorkItem CANCELLED
```

Product state transitions remain owned by WorkQueue repository + WorkAttemptExecutor under Persistence/Host fence.

## 2.2 Product and vendor schemas remain separate

```text
heptalogos.*
  product canonical schema

dbos.*
  DBOS engine-private schema
```

No DBOS table enters `0001-foundation-baseline.ts`.

No `0002-h3a2-*` product migration is added merely to record development chronology.

If H3A-2 needs a current product-schema correction, rewrite the current baseline and current callers under PRE_PRODUCTION rules.

## 2.3 One scheduling engine

DBOS Queue is the adopted generic scheduling provider.

Do not add:

```text
custom worker pool
priority heap
second durable queue
per-item timer engine
fallback in-memory scheduler
BullMQ / Temporal / pg-boss / custom scheduler
```

WorkQueue reconciliation remains anti-entropy and product projection logic, not a second scheduler.

## 2.4 One static durable workflow

Exactly one Foundation durable WorkItem workflow is registered:

```text
dispatchWorkItem
```

Its durable step is:

```text
executeWorkAttempt
```

Dynamic MicroSystems, WorkHandlers and Extensions never register DBOS workflows or steps.

## 2.5 No consequential external effects

H3A-2 WorkHandlers may perform restartable H3A work only.

They may not send messages, invoke consequential remote writes, run arbitrary network effects, mutate external processes, or claim `external-effect-uncertain`.

`EffectOperation` and uncertainty enter H3B.

## 2.6 Three version axes stay orthogonal

```text
ProductGenerationId
DurableCodeVersion / DBOS applicationVersion
PackageGenerationId
```

They are not aliases.

`DurableCodeVersion` is not an npm version, Git SHA, ProductGenerationId or PackageGenerationId.

## 2.7 PRE_PRODUCTION means no development-history compatibility

No:

```text
legacy DBOS adapter
4.26 compatibility path
old/new queue profile reader
four-role compatibility branch
H3A-1/H3A-2 migration bridge
deprecated alias
dual workflow registration
fallback parser
```

Current code represents one current design.

---

# 3. External provider decision — DBOS 4.27.6

## 3.1 Exact dependency

Use exactly:

```text
@dbos-inc/dbos-sdk 4.27.6
```

Current external snapshot when this plan was authored:

```yaml
latest: 4.27.6
preview: 4.28.3-preview
license: MIT
nodeEngine: ">=20"
```

Do not use preview.

Do not create a separate dependency-selection experiment. DBOS 4.x and DBOS Queue are already `ADOPTED`; H3A-2 is implementation/product qualification.

Do not bypass `minimumReleaseAge`. If package-manager policy temporarily rejects the just-published exact patch, the repository policy wins; do not downgrade, add an age exclusion, or switch provider merely to proceed.

## 3.2 Current DBOS Queue API used by this plan

Use current database-backed queues:

```ts
DBOS.registerQueue(name, {
  globalConcurrency?,
  workerConcurrency?,
  rateLimit?,
  partitionConcurrency?,
  partitionWorkerConcurrency?,
  partitionRateLimit?,
  minPollingIntervalMs?,
  onConflict: "never_update",
})
```

Do not implement the old/deprecated plan shape:

```text
priorityEnabled
partitionQueue
new WorkflowQueue(...)
```

Priority is an enqueue property in current DBOS and is always available.

For `DBOS.startWorkflow`, project:

```text
workflowID
queueName
enqueueOptions.priority
enqueueOptions.delaySeconds
enqueueOptions.queuePartitionKey
enqueueOptions.applicationVersion
```

DBOS priority semantics match the current WorkItem range:

```text
1 .. 2147483647
lower number = higher priority
```

Use the WorkItem priority directly; do not invert or rescale it.

## 3.3 Current DBOS partition rule

A DBOS queue is partitioned if any partition limit is configured.

Therefore:

```text
partitioned profile
  -> every dispatch MUST provide partitionKey

unpartitioned profile
  -> dispatch MUST NOT provide partitionKey
```

This becomes a WorkQueue creation invariant, not a DBOS runtime surprise.

DBOS queue deduplication is not used for product correctness and is not used by this plan.

## 3.4 Current DBOS lifecycle

Use caller-owned:

```text
systemDatabasePool
```

DBOS does not own that pool's final lifecycle. `@heptalogos/durable-execution` closes it after DBOS shutdown.

Set explicitly:

```text
name = "heptalogos"
applicationVersion = DurableCodeVersion
executorID = InstanceId
systemDatabaseSchemaName = "dbos"
systemDatabasePool = caller-owned dedicated pg.Pool
systemDatabasePollingConcurrency = explicit option
runMigrations = false
runAdminServer = false
listenQueues = exact projected queue names
maxConcurrentQueueDispatches = explicit option
```

## 3.5 Critical executor identity decision

**Use stable `InstanceId` as DBOS `executorID`. Do NOT use BootId.**

Reason:

```text
BootId changes on every Host restart.
DBOS self-hosted recovery associates pending workflows with executor identity.
Using BootId would strand the previous Boot's PENDING workflows.
```

Heptalogos already guarantees one active normal Host per Instance through the Host lease/fence. That makes InstanceId the correct stable single-server executor identity for current H3A.

Do not add a second DBOS executor in this stage.

## 3.6 DBOS shutdown semantics

Use the current 4.27 API:

```ts
DBOS.shutdown({
  workflowCompletionTimeoutMS: explicitShutdownDrainTimeoutMs,
});
```

Do not use:

```text
deregister: true
```

Production static registration persists for the process lifetime.

The intended order is:

```text
stop DBOS event/queue processing
-> bounded drain of workflows already executing in this process
-> DBOS executor shutdown
-> caller-owned DBOS pool close
```

## 3.7 Workflow recovery semantics

DBOS automatically recovers interrupted `PENDING` workflows when the same self-hosted executor identity restarts with the same compatible application version.

An uncaught workflow exception becomes DBOS `ERROR` and is not normal automatic crash recovery.

Therefore the static H3A workflow must ensure all **expected product outcomes** are returned as bounded `EngineAttemptDisposition` values rather than escaping as uncaught workflow exceptions.

Unexpected infrastructure/programming failures may still produce engine `ERROR`. H3A-2 does not lie about those by converting DBOS error state into product failure. The canonical WorkItem remains nonterminal and engine-projection reconciliation reports it as blocked/inconsistent.

`MAX_RECOVERY_ATTEMPTS_EXCEEDED` is also a fail-closed condition. H3A-2 does not automatically reset the engine's crash-loop safety budget.

---

# 4. New Heptalogos contracts frozen by this plan

## 4.1 DurableCodeVersion

Add to `@heptalogos/foundation-contracts`:

```ts
export type DurableCodeVersion = ContentDigest<"DurableCodeVersion">;
```

Add parse/as helpers following existing content-digest identity mechanics.

Rules:

```text
required explicit composition input
64-hex content-digest shape
never generated randomly
never derived from Git SHA
never aliased to ProductGenerationId
never aliased to PackageGenerationId
```

H3A-2 qualification fixtures derive deterministic test values through the existing canonical digest owner.

H8 ProductGeneration/update tooling will later own release-grade derivation from the actual durable-code artifact closure. H3A-2 does not invent update metadata.

## 4.2 WorkQueue profile contract

`@heptalogos/work-queue` owns the product scheduling-profile vocabulary.

`WorkQueueProfileId` remains the current runtime-kernel-owned namespaced ID to preserve dependency direction.

Add:

```ts
export interface WorkQueueRateLimit {
  readonly limitPerPeriod: number;
  readonly periodSeconds: number;
}

export interface WorkQueuePartitionLimits {
  readonly concurrency?: number;
  readonly workerConcurrency?: number;
  readonly rateLimit?: WorkQueueRateLimit;
}

export interface WorkQueueProfileDefinition {
  readonly profileId: WorkQueueProfileId;
  readonly globalConcurrency?: number;
  readonly workerConcurrency?: number;
  readonly rateLimit?: WorkQueueRateLimit;
  readonly partition?: WorkQueuePartitionLimits;
  readonly minPollingIntervalMs: number;
}

export interface WorkQueueProfileCatalog {
  get(profileId: WorkQueueProfileId): WorkQueueProfileDefinition | undefined;
  list(): readonly WorkQueueProfileDefinition[];
}
```

Add one current implementation factory:

```ts
createWorkQueueProfileCatalog(
  definitions: readonly WorkQueueProfileDefinition[],
): WorkQueueProfileCatalog
```

Validation is fail-closed:

```text
profile IDs unique
all numeric fields positive safe integers
minPollingIntervalMs > 0

workerConcurrency <= globalConcurrency when both exist

partition.concurrency <= globalConcurrency when both exist

partition.workerConcurrency <= partition.concurrency when both exist
partition.workerConcurrency <= workerConcurrency when both exist
partition.workerConcurrency <= globalConcurrency when both exist

rateLimit.limitPerPeriod > 0
rateLimit.periodSeconds > 0

partition rate fields follow the same positive rule
```

`partitioned` is derived:

```text
profile.partition exists with at least one configured limit
```

Do not persist a second Heptalogos queue-profile table in H3A.

The catalog is immutable Host composition input. H4 later owns configurable activation.

## 4.3 Work creation/profile enforcement

Extend `WorkQueueServiceOptions` with mandatory:

```ts
profiles: WorkQueueProfileCatalog;
```

During creation:

```text
exact WorkHandler descriptor queueProfileId
-> catalog lookup must exist
-> request profile must match descriptor
-> partition rule enforced
```

Rules:

```text
partitioned profile + missing partitionKey
  -> work.queue.partition_required

unpartitioned profile + partitionKey
  -> work.queue.partition_not_supported
```

Do not defer this error to DBOS.

## 4.4 RUNNING same-attempt recovery

Change `WorkAttemptExecutor.execute(workItemId, expectedRevision)`.

New state handling:

```text
terminal
  -> TERMINAL_REPLAY

revision mismatch
  -> STALE_NOOP

PENDING
  -> existing fresh-attempt path

RUNNING
  -> same-attempt recovery path

other nonterminal states
  -> STALE_NOOP
```

For `RUNNING`:

```text
derive expected DispatchAttemptId(workItemId, expectedRevision)

require:
  activeAttemptId exists
  activeAttemptId == derived attempt ID

if mismatch:
  -> throw work.recovery.active_attempt_mismatch
  -> category integrity
  -> no mutation

if cancellation/supersession request already accepted:
  H3A has no consequential effects and the old process is gone
  -> attempt-fenced terminalization without invoking handler

otherwise:
  resolve exact pinned WorkHandler generation

if exact generation missing:
  -> throw/report work.recovery.handler_generation_missing
  -> keep RUNNING
  -> never bind latest generation
  -> never change revision

validate persisted payload with exact handler contract
reserve exact invocation
execute outside transaction
commit through existing Tx B:
  expected RUNNING
  expected revision
  expected activeAttemptId
```

Do **not** call `markRunning` again.

A recovered attempt creates a fresh Execution Activity for the new process/Boot while retaining the same WorkItemId, dispatchRevision and DispatchAttemptId.

This is at-least-once attempt execution before terminal product commit. H3A handlers remain restartable and consequential external effects remain forbidden.

## 4.5 Engine projection inspection port

WorkQueue owns the interpretation of canonical RUNNING state; DurableExecution only reports engine projection.

Add to WorkQueue:

```ts
export interface DurableAttemptInspectionRequest {
  readonly workItemId: WorkItemId;
  readonly dispatchRevision: number;
  readonly dispatchAttemptId: DispatchAttemptId;
  readonly queueProfileId: WorkQueueProfileId;
}

export type DurableAttemptProjection =
  | { readonly kind: "ACTIVE"; readonly applicationVersion: DurableCodeVersion }
  | { readonly kind: "ABSENT" }
  | { readonly kind: "ENGINE_SUCCESS"; readonly applicationVersion?: string }
  | { readonly kind: "ENGINE_ERROR"; readonly applicationVersion?: string }
  | { readonly kind: "ENGINE_CANCELLED"; readonly applicationVersion?: string }
  | { readonly kind: "RECOVERY_EXHAUSTED"; readonly applicationVersion?: string }
  | { readonly kind: "VERSION_MISMATCH"; readonly applicationVersion: string };

export interface DurableAttemptInspectionPort {
  inspect(request: DurableAttemptInspectionRequest): Promise<DurableAttemptProjection>;
}
```

`@heptalogos/durable-execution` implements this with DBOS workflow-status APIs.

## 4.6 Canonical RUNNING recovery coordinator

Add a WorkQueue-owned recovery coordinator:

```ts
createWorkQueueRecoveryCoordinator({
  repository,
  durableInspection,
  onBackgroundError,
  batchSize,
});
```

Add a repository scan for canonical `RUNNING` rows using the existing current projection index shape:

```text
(state, created_at, work_item_id)
```

No new scheduler/table/cursor persistence.

For each RUNNING item:

```text
assert activeAttemptId == deterministic DispatchAttemptId

inspect engine projection

ACTIVE + current DurableCodeVersion
  -> healthy; DBOS launch/recovery owns re-entry

VERSION_MISMATCH
  -> report blocked; keep WorkItem RUNNING

ABSENT
  -> report integrity contradiction; keep RUNNING

ENGINE_SUCCESS + canonical RUNNING
  -> report integrity contradiction; do NOT mark success

ENGINE_ERROR
  -> report engine failure; keep canonical obligation nonterminal

ENGINE_CANCELLED
  -> report engine contradiction; H3A exposes no engine cancellation owner

RECOVERY_EXHAUSTED
  -> report blocked; do not reset budget automatically
```

This coordinator is diagnostic/anti-corruption reconciliation. It does not become a scheduler and does not mutate canonical outcome from engine state.

Normal process-crash recovery is DBOS automatic recovery of the same `PENDING` engine workflow; the WorkAttemptExecutor RUNNING path makes that recovery product-correct.

---

# 5. Target package and dependency topology

After H3A-2:

```text
foundation-contracts
     │
     ├─────────────► runtime-kernel
     ├─────────────► execution-lineage
     ├─────────────► work-queue
     └─────────────► durable-execution

persistence ───────────────► work-queue
time-service ──────────────► work-queue
runtime-kernel ────────────► work-queue
signal ────────────────────► work-queue

work-queue ────────────────► durable-execution
host-ownership ────────────► durable-execution

@dbos-inc/dbos-sdk ────────► durable-execution
pg ────────────────────────► durable-execution
execa ─────────────────────► durable-execution

bootstrap-runtime production
  -> host-ownership
  -> private-postgres
  -> existing bootstrap owners
  X no DBOS
  X no work-queue
  X no durable-execution
  X no runtime-kernel

bootstrap-runtime integration/dev
  -> work-queue
  -> durable-execution
  -> runtime-kernel
  -> signal
  -> persistence
```

Forbidden inversions:

```text
runtime-kernel -> work-queue
runtime-kernel -> durable-execution
persistence -> work-queue
host-ownership -> durable-execution
bootstrap-runtime production -> H3 packages
work-queue -> @dbos-inc/dbos-sdk
work-queue -> pg
```

`durable-execution` tag:

```json
["kind:product", "area:execution"]
```

---

# 6. Durable database authority

## 6.1 Protected role

Add:

```text
HOST_DURABLE_EXECUTION_ROLE =
  "heptalogos_durable_execution"
```

Role properties:

```yaml
LOGIN: true
SUPERUSER: false
CREATEDB: false
CREATEROLE: false
REPLICATION: false
BYPASSRLS: false
INHERIT: true
membership_in_heptalogos_owner: false
```

Database:

```text
CONNECT heptalogos: yes
CREATE database: no
CREATE schema: no
heptalogos schema USAGE: no
heptalogos tables: no privileges
```

DBOS vendor provisioning grants only the rights required on `dbos.*`.

The durable role does not gain product mutation Authority merely because WorkAttemptExecutor also exists in the same process. Product writes continue through the separate normal PersistenceService pool and Host fence.

## 6.2 Bootstrap secret purpose

Extend current Bootstrap key vocabulary with exactly:

```text
private-postgres-durable-execution-role
```

Add:

```ts
BootstrapAdminPasswordProvider.withDurableExecutionPassword(...)
BootstrapKeyProvider.withPrivatePostgresDurableExecutionPassword(...)
```

Secret bytes remain callback-scoped.

Do not put the password in normal Configuration, Environment Authority, CLI args, logs, Evidence, Lineage or DBOS workflow inputs.

## 6.3 HostDurableExecutionAuthority

Add to `@heptalogos/host-ownership`:

```ts
export interface HostDurableExecutionAuthority {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly token: HostOwnershipToken;
  readonly target: {
    readonly host: "127.0.0.1";
    readonly port: number;
    readonly database: "heptalogos";
    readonly user: "heptalogos_durable_execution";
  };
  readonly signal: AbortSignal;

  assertActive(): void;

  withDurableExecutionDatabasePassword<T>(
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
}
```

Extend:

```ts
BootstrapManagedHostContext {
  persistence: HostPersistenceAuthority;
  durableExecution: HostDurableExecutionAuthority;
}
```

`createManagedHostContext()` wraps durable authority with the same terminal fence used by Persistence.

Once managed Host is terminal:

```text
durableExecution.assertActive()
durableExecution.withDurableExecutionDatabasePassword(...)
```

must both fail.

No `@dbos-inc/dbos-sdk` import is allowed in bootstrap-runtime.

---

# 7. DBOS package resolution and CLI execution

## 7.1 Package resolver

`@heptalogos/durable-execution` owns a DBOS-specific package resolver.

Use the installed package metadata. Do not hardcode a globally installed CLI.

Resolve:

```text
@dbos-inc/dbos-sdk package.json
-> assert package name
-> assert exact version 4.27.6
-> read package.json bin.dbos
-> resolve package-contained regular file
```

Use Node 24 standard package-resolution facilities where practical.

Do not:

```text
npx
PATH lookup
shell command
global DBOS installation
hardcode another package-manager store path
```

## 7.2 DBOS process adapter

Use adopted Execa mechanics behind a package-private DBOS CLI process adapter.

Do not create a new generic product process package in this stage.

Follow the established private-postgres safety pattern:

```text
absolute executable
shell: false
bounded timeout
bounded stdout/stderr
sanitized inherited environment
LC_ALL=C
LANG=C
```

Remove inherited PostgreSQL connection variables before adding this invocation's explicit values:

```text
PGPASSWORD
PGHOST
PGPORT
PGUSER
PGDATABASE
PGOPTIONS
PGSERVICE
PGSERVICEFILE
PGPASSFILE
PGDATA
```

Durable diagnostic text must be bounded and sanitized before entering a Problem.

---

# 8. DBOS schema provisioning

Create:

```ts
interface DurableExecutionSchemaProvisioner {
  ensureCurrent(authority: HostCanonicalMigrationAuthority): Promise<void>;
}
```

## 8.1 Required authority semantics

The DBOS CLI must execute under the same semantic migration identity as the canonical schema:

```text
session_user = heptalogos_migration
current_user = heptalogos_owner
```

The current migration role is NOINHERIT; merely connecting with the migration user is insufficient.

Invoke the installed DBOS CLI through `process.execPath`:

```text
node
<absolute dbos CLI file>
schema
postgresql://heptalogos_migration@127.0.0.1:<port>/heptalogos
--schema
dbos
--app-role
heptalogos_durable_execution
```

Environment:

```text
PGPASSWORD=<callback-scoped migration password>
PGOPTIONS=-c role=heptalogos_owner
```

No password appears in argv.

Before and after subprocess execution:

```text
authority.assertCurrent()
```

## 8.2 Post-provision verification

Verify with the migration Authority:

```text
dbos schema exists
dbos schema owner is heptalogos_owner
durable role has required DBOS runtime rights
durable role cannot DDL
durable role cannot SELECT/INSERT/UPDATE/DELETE heptalogos.*
migration session/user relationship is the expected one
```

Normal DurableExecution startup always uses:

```text
runMigrations: false
```

Missing or outdated DBOS schema causes launch failure. Normal Host startup does not auto-repair vendor schema.

Forbidden:

```text
dbos reset
runMigrations:true
runtime DDL
bootstrap superuser for DBOS runtime
```

---

# 9. DurableExecution runtime contract

Create package:

```text
packages/durable-execution/
  README.md
  package.json
  project.json
  tsconfig.json
  tsconfig.build.json
  src/
  test/unit/
```

## 9.1 Public contract

Expose Heptalogos types only. Do not expose DBOS classes, WorkflowQueue, WorkflowHandle, pg Pool, Execa result types or DBOS config objects.

Required public surface:

```ts
export interface DurableExecutionPoolOptions {
  readonly maxConnections: number;
  readonly idleTimeoutMs: number;
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly idleInTransactionSessionTimeoutMs: number;
}

export interface DurableExecutionRuntimeOptions {
  readonly durableCodeVersion: DurableCodeVersion;
  readonly systemPool: DurableExecutionPoolOptions;
  readonly systemDatabasePollingConcurrency: number;
  readonly maxConcurrentQueueDispatches: number;
  readonly workflowMaxRecoveryAttempts: number;
  readonly shutdownDrainTimeoutMs: number;
  readonly profiles: WorkQueueProfileCatalog;
  readonly onBackgroundError: (error: unknown) => void;
}
```

No production numeric fallback defaults.

Validation:

```text
all counts/timeouts positive safe integers
pool max > 0
polling concurrency <= pool max
maxConcurrentQueueDispatches > 0
workflowMaxRecoveryAttempts > 0
shutdownDrainTimeoutMs > 0
profile catalog non-empty for a runtime that will dispatch work
```

H3A qualification fixtures use explicit test values. H4 later classifies production behavior-affecting values as Configuration.

## 9.2 Dedicated pg Pool

Create a caller-owned `pg.Pool` with:

```text
target from HostDurableExecutionAuthority
user = heptalogos_durable_execution
password callback
application_name = heptalogos-durable-execution
explicit pool timeouts
permanent background error sinks
```

The pool has no role switch to `heptalogos_owner`.

DBOS receives this pool through `systemDatabasePool`.

DBOS shutdown does not own final pool close; DurableExecution closes the pool.

## 9.3 Lifecycle state machine

Use adopted XState 5 as package-private local lifecycle mechanics.

Public semantic states:

```text
CREATED
STARTING
OPEN
QUIESCING
QUIESCED
RESUMING
CLOSING
CLOSED
FAILED
```

No XState object escapes the package.

Legal high-level transitions:

```text
CREATED -> STARTING -> OPEN
STARTING -> FAILED

OPEN -> QUIESCING -> QUIESCED
QUIESCING -> FAILED

QUIESCED -> RESUMING -> OPEN
RESUMING -> FAILED

OPEN | QUIESCED | FAILED -> CLOSING -> CLOSED
CLOSING -> CLOSED
```

Close is idempotent.

Dispatch is accepted only in `OPEN`.

Host authority abort immediately closes dispatch admission and starts terminal shutdown; it never reacquires Host ownership in place.

## 9.4 Process-global DBOS registration

DBOS is process-global. H3A-2 must not pretend it is an ordinary per-object engine.

Implement one package-private process-global registration/binding owner:

```text
one static dispatchWorkItem registration per process
one active WorkAttemptExecutor binding per process
```

Rules:

```text
first runtime initialization:
  register static workflow exactly once

same-process Host restart:
  reuse static registration
  replace active binding only after old DurableExecution is QUIESCED/CLOSED

second simultaneous active binding:
  fail closed

DBOS.shutdown():
  no deregister
```

The workflow wrapper resolves the **current active binding at invocation time**; it must not close over an obsolete Host/WorkAttemptExecutor from the first boot.

During DBOS shutdown drain, keep the current binding alive until DBOS has finished draining. Clear/replace only after shutdown has settled.

---

# 10. Static dispatcher

## 10.1 Workflow registration

Register:

```text
workflow name: dispatchWorkItem
step name: executeWorkAttempt
```

Workflow input is exactly:

```text
WorkItemId
dispatchRevision
```

It does not contain:

```text
WorkItem payload
canonical outcome
Secret
Configuration material
PackageGeneration object
full ExecutionContext
handler code
DB connection
```

The workflow reloads canonical product truth through WorkAttemptExecutor.

## 10.2 Recovery budget

Register the workflow with:

```text
maxRecoveryAttempts =
  DurableExecutionRuntimeOptions.workflowMaxRecoveryAttempts
```

Because DBOS registration is process-global, a second runtime in the same process may only reuse the same static registration configuration. If a later same-process Host asks for a different recovery budget, fail closed rather than silently changing process-global registration.

No hardcoded production default.

## 10.3 Step behavior

Call:

```ts
DBOS.runStep(() => currentBinding.execute(workItemId, dispatchRevision), {
  name: "executeWorkAttempt",
  retriesAllowed: false,
});
```

Why `retriesAllowed:false`:

```text
WorkItem retry semantics are product Authority.
Handler failures are already normalized/classified by WorkAttemptExecutor.
DBOS step retry must not become a hidden second retry policy.
Process crash recovery remains DBOS workflow recovery of the same step/attempt.
```

Unexpected infrastructure/programming exceptions may produce DBOS `ERROR`. Do not convert those into WorkItem terminal truth.

## 10.4 Engine output

DBOS stores only a minimal projection:

```ts
interface EngineAttemptDisposition {
  readonly workItemId: WorkItemId;
  readonly dispatchRevision: number;
  readonly disposition:
    | "TERMINAL_REPLAY"
    | "STALE_NOOP"
    | "WAITING_DEPENDENCY"
    | "RETRY_WAIT"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "SUPERSEDED";
}
```

Do not copy canonical payload or domain outcome into DBOS workflow output.

Before an exception crosses the DBOS step boundary, normalize arbitrary non-Problem errors to a bounded, non-secret engine error. Do not serialize arbitrary handler objects/stacks as a second durable application error store.

---

# 11. DBOS queue projection

## 11.1 Queue naming

Map:

```text
WorkQueueProfileId = <profile>

DBOS queue name =
  "heptalogos.queue." + <profile>
```

Queue names are deterministic.

## 11.2 Profile projection

For each WorkQueue profile:

```text
globalConcurrency
  -> globalConcurrency

workerConcurrency
  -> workerConcurrency

rateLimit.limitPerPeriod
  -> rateLimit.limitPerPeriod

rateLimit.periodSeconds
  -> rateLimit.periodSec

partition.concurrency
  -> partitionConcurrency

partition.workerConcurrency
  -> partitionWorkerConcurrency

partition.rateLimit
  -> partitionRateLimit

minPollingIntervalMs
  -> minPollingIntervalMs
```

Call after DBOS launch:

```ts
DBOS.registerQueue(name, {
  ...mappedOptions,
  onConflict: "never_update",
});
```

Then use returned/readback queue getters to compare every expected field with persisted configuration.

Mismatch:

```text
durable_execution.queue_profile_mismatch
-> fail OPEN transition
```

Do not overwrite the persisted profile during normal H3A runtime.

H3A exposes no DBOS queue mutation API.

## 11.3 Dispatch mapping

`DurableDispatchPort.dispatch(request)`:

```text
require lifecycle OPEN
require HostDurableExecutionAuthority active
lookup exact WorkQueueProfileDefinition
validate partition rule again
derive DBOS queue name
derive DBOS workflow ID
compute delaySeconds from TimeService/current Instant

DBOS.startWorkflow(staticDispatcher, {
  workflowID,
  queueName,
  enqueueOptions: {
    priority,
    delaySeconds,
    queuePartitionKey?,
    applicationVersion: durableCodeVersion,
  },
})(workItemId, dispatchRevision)
```

Workflow ID:

```text
"heptalogos.work." + DispatchAttemptId
```

`delaySeconds`:

```text
max(0, ceil((notBefore - now) / 1000))
```

Canonical `notBefore` remains Authority; WorkAttemptExecutor still rechecks time immediately before `RUNNING` admission.

No:

```text
deduplicationID
random workflow ID
DBOS-generated attempt identity
applicationVersion omitted
```

Same WorkItem/revision may be dispatched repeatedly; DBOS workflow ID idempotency must collapse the engine projection.

---

# 12. Startup and recovery composition

## 12.1 Canonical/vendor initialization order

During authorized Bootstrap/Host migration window:

```text
canonical heptalogos.* initializer
-> DBOS dbos.* schema provisioner
-> verify both current
-> expose managed Host
```

Use existing injected `initializeCanonicalHost` composition seam in bootstrap-runtime tests. Bootstrap production code does not import durable-execution.

## 12.2 Normal Host runtime startup order

Once managed Host exists:

```text
create PersistenceService
create ExecutionContext/Lineage
create RuntimeKernel and publish exact WorkHandlers
create Signal
create WorkQueue repository/service/executor
create WorkQueue profile catalog
bind WorkAttemptExecutor to DurableExecution static dispatcher
create DurableExecution with HostDurableExecutionAuthority
DBOS.launch()
register/verify queue profiles
inspect canonical RUNNING/engine projections
start WorkQueue reconciler
OPEN
```

Critical ordering:

```text
exact WorkHandlers MUST exist before DBOS.launch()
```

DBOS recovery begins during launch. A recovered step must be able to resolve the exact generation-bound handler.

## 12.3 Crash recovery identity

Across a normal process/Host restart:

```text
InstanceId: same
BootId: new
HostOwnershipToken: new
DurableCodeVersion: same if durable code unchanged
DBOS executorID: same InstanceId
DispatchAttemptId: same for same WorkItem/revision
```

This exact property must be tested.

## 12.4 Application version isolation

If DurableCodeVersion changes from A to B:

```text
B MUST NOT execute A-bound pending durable workflow as B.
```

H3A-2 proves the version fence only.

H3A-2 does not implement blue/green old-version workers or Product Update.

If old version work remains during a future incompatible product update, H8 owns drain/update/LKG policy.

---

# 13. Planned shutdown and maintenance

The existing Host maintenance handoff expects a reversible quiescence lease before the point of no return.

H3A-2 must compose runtime quiescence in this exact order:

```text
1. stop WorkQueue new creation/dispatch admission as appropriate
2. stop WorkQueue reconciler / anti-entropy / Signal wake processing
3. DurableExecution -> QUIESCING
4. DBOS.shutdown({ workflowCompletionTimeoutMS })
   while exact RuntimeKernel handlers and Persistence are still available
5. close caller-owned DBOS pool
6. DurableExecution -> QUIESCED
7. RuntimeKernel quiesce and fence remaining handler leases
8. existing Host maintenance reverse handoff / Host lease release / PG stop
```

Reason:

DBOS must be allowed to drain already-running durable steps while the WorkHandler and Persistence owners still exist. Quiescing RuntimeKernel first would withdraw the very resources needed to settle those steps.

Pending/unstarted WorkItems remain durable. Shutdown does not terminalize them.

## 13.1 Reversible pre-entry abort

If a maintenance operation aborts before the point of no return:

```text
RuntimeKernel quiescence lease resumes
DurableExecution RESUMING
  -> create fresh dedicated pool
  -> re-bind current WorkAttemptExecutor
  -> DBOS.setConfig
  -> DBOS.launch
  -> register/verify same queue profiles
  -> inspect RUNNING projections
  -> OPEN
WorkQueue reconciler starts again
```

Prove same-process shutdown → relaunch with real DBOS.

If DBOS drain fails/timeouts in a way that leaves owned work unable to settle safely:

```text
do not release Host ownership
do not pretend quiescence succeeded
fail the maintenance entry
```

---

# 14. Required implementation tasks

Tasks are ordered by semantic dependency. TDD applies to behavior-bearing changes.

## Task 0 — Activate current plan and reconcile merged-stage truth

**Purpose:** normal phase entry housekeeping only.

**Move:**

```text
docs/plans/active/foundation/Heptalogos_H3A_Decision_Complete_Implementation_Plan_2026-08-26.md
->
docs/plans/superseded/foundation/h3a-durable-obligation-signal-spine-2026-08-26.md
```

Mark it `SUPERSEDED` for current execution. Its already-completed H3A-1 work remains historical truth through existing completed/governance/evidence records.

Move the already-merged repository-stabilization execution plan from active to completed.

**Add this plan** at its canonical active path.

**Update only current truth:**

```text
docs/plans/README.md
docs/roadmap/development-roadmap.md
```

Target state:

```yaml
H3: OPEN
H3A: ACTIVE
H3A_1: CLOSED
H3A_2: ACTIVE
H3B: NOT_ELIGIBLE
H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: NOT_ELIGIBLE
activeImplementationPlan: docs/plans/active/foundation/h3a2-dbos-durable-execution-crash-recovery-2026-08-29.md
```

Do not create a separate “post-merge reconciliation stage”.

**Commit:**

```text
docs: activate H3A-2 durable execution plan
```

---

## Task 1 — Materialize current DBOS dependency

**Modify:**

```text
pnpm-workspace.yaml
pnpm-lock.yaml
docs/dependencies/dependency-routing.json
docs/dependencies/implementation-routing.md
```

Add exact catalog entry:

```yaml
"@dbos-inc/dbos-sdk": 4.27.6
```

Update both adopted routes to name the real package:

```text
durable.execution.packages
  -> ["@dbos-inc/dbos-sdk"]

workqueue.mechanics.packages
  -> ["@dbos-inc/dbos-sdk"]
```

Do not change role decision: remains `ADOPTED`.

Do not keep 4.26 compatibility wording in active implementation instructions.

Run frozen install after catalog update.

**Commit:**

```text
build: materialize DBOS durable execution route
```

---

## Task 2 — Close H3A-2 WorkQueue contract gaps

**Modify:**

```text
packages/foundation-contracts/src/runtime-identity.ts
packages/foundation-contracts/src/index.ts
packages/foundation-contracts tests

packages/work-queue/src/contracts.ts
packages/work-queue/src/service.ts
packages/work-queue/src/attempt-executor.ts
packages/work-queue/src/repository.ts
packages/work-queue/src/index.ts
packages/work-queue/test/unit/*
packages/work-queue/README.md
```

Implement:

```text
DurableCodeVersion
WorkQueueProfileDefinition
WorkQueueProfileCatalog
profile validation
partition-key creation invariant
RUNNING same-attempt recovery
RUNNING repository scan
DurableAttemptInspectionPort
WorkQueueRecoveryCoordinator
```

Required unit cases:

```text
duplicate profile IDs rejected
invalid concurrency relations rejected
invalid rate limits rejected
partitioned profile requires key
unpartitioned profile rejects key

RUNNING + same revision + matching attempt
  -> exact handler re-entry
  -> markRunning NOT called

RUNNING + wrong activeAttemptId
  -> integrity failure

RUNNING + exact generation missing
  -> no latest binding
  -> canonical RUNNING preserved

RUNNING + accepted cancellation
  -> terminal cancellation without handler

terminal
  -> terminal replay

revision mismatch
  -> stale noop

engine ACTIVE projection
  -> no canonical mutation

engine SUCCESS/ERROR/CANCELLED/ABSENT/MAX_RECOVERY/version mismatch
  -> no product terminal inference
  -> typed blocked/integrity report
```

Do not add DBOS dependency to work-queue.

**Commit:**

```text
refactor: make WorkItem attempts recoverable across process restart
```

---

## Task 3 — Add durable-engine PostgreSQL authority

**Modify:**

```text
packages/host-ownership/src/contracts.ts
packages/host-ownership/src/bootstrap-admin.ts
packages/host-ownership/src/ownership-schema.ts
packages/host-ownership/src/index.ts
packages/host-ownership/test/unit/*
packages/host-ownership/test/integration/*

packages/bootstrap-runtime/src/bootstrap-key-provider.ts
packages/bootstrap-runtime/src/managed-host.ts
packages/bootstrap-runtime/src/host-ownership-handoff.ts
packages/bootstrap-runtime/test/support/canonical-postgres.ts
packages/bootstrap-runtime/test/unit/*
packages/bootstrap-runtime/README.md
```

Implement the exact five-role model and `HostDurableExecutionAuthority`.

Extend current test fixture with an explicit durable role password.

Required tests:

```text
fresh role provisioning produces exactly five protected roles
durable role is not member of owner
durable role cannot access heptalogos.*
durable password callback is scoped
managed Host terminal fence disables durable authority
fresh PRE_PRODUCTION database is rewritten/current; no four-role compatibility path
```

**Commit:**

```text
feat: isolate durable execution database authority
```

---

## Task 4 — Create @heptalogos/durable-execution

**Create:**

```text
packages/durable-execution/README.md
packages/durable-execution/package.json
packages/durable-execution/project.json
packages/durable-execution/tsconfig.json
packages/durable-execution/tsconfig.build.json

packages/durable-execution/src/contracts.ts
packages/durable-execution/src/problems.ts
packages/durable-execution/src/dbos-package.ts
packages/durable-execution/src/dbos-process.ts
packages/durable-execution/src/index.ts

packages/durable-execution/test/unit/*
```

Dependencies:

```text
@dbos-inc/dbos-sdk
@heptalogos/foundation-contracts
@heptalogos/host-ownership
@heptalogos/work-queue
pg
execa
xstate
```

Do not depend on:

```text
bootstrap-runtime
private-postgres
persistence
runtime-kernel
signal
```

Implement exact package resolver and DBOS-specific process adapter from §§7.

Repository discovery/navigation/API docs must include the new package through existing owners.

**Commit:**

```text
feat: create bounded durable execution adapter
```

---

## Task 5 — Implement DBOS vendor-schema provisioner

**Create:**

```text
packages/durable-execution/src/dbos-schema-provisioner.ts
packages/durable-execution/test/unit/dbos-schema-provisioner.test.ts
```

Implement §8 exactly.

Add real PostgreSQL coverage through bootstrap-runtime integration rather than inventing another long-lived product composition owner.

Required real cases:

```text
fresh DB -> heptalogos.* + dbos.* current
restart -> provisioning idempotently accepts current schema
durable runtime role can operate dbos.* as required
durable role cannot access heptalogos.work_item/activity/evidence
durable role cannot DDL
migration user without owner role cannot provision
authorized migration session with PGOPTIONS role can provision
failed vendor migration blocks normal Host exposure
password absent from argv/safe diagnostics
```

**Commit:**

```text
feat: provision DBOS schema under migration authority
```

---

## Task 6 — Implement DBOS pool, global binding and lifecycle

**Create:**

```text
packages/durable-execution/src/dbos-pool.ts
packages/durable-execution/src/dbos-binding.ts
packages/durable-execution/src/dbos-lifecycle-machine.ts
packages/durable-execution/src/dbos-runtime.ts
packages/durable-execution/test/unit/*
```

Implement §§9.2–9.4.

DBOS config is exact:

```text
name: heptalogos
applicationVersion: DurableCodeVersion
executorID: InstanceId
systemDatabaseSchemaName: dbos
systemDatabasePool: dedicated caller-owned pool
systemDatabasePollingConcurrency: explicit
runMigrations: false
runAdminServer: false
listenQueues: exact queue names
maxConcurrentQueueDispatches: explicit
```

Required tests:

```text
BootId changes do not alter executorID for same InstanceId
different InstanceId changes executorID
caller-owned pool closed exactly once
DBOS shutdown happens before pool close
dispatch rejected outside OPEN
Host abort closes admission
second active process binding rejected
same-process rebind after QUIESCED accepted
different process-global recovery budget rejected
no deregister on shutdown
```

**Commit:**

```text
feat: launch Host-bound durable execution runtime
```

---

## Task 7 — Implement current DBOS queue-profile projection

**Create:**

```text
packages/durable-execution/src/dbos-queue-profiles.ts
packages/durable-execution/test/unit/dbos-queue-profiles.test.ts
```

Project current WorkQueue profile contract to current DBOS 4.27 API exactly.

Use:

```text
onConflict: never_update
```

Read back persisted values through DBOS queue getters and compare exact semantics.

Required tests:

```text
all queue-wide fields projected
all partition fields projected
rate-limit field name mapping correct
profile mismatch fails closed
absent queue created
existing matching queue accepted
existing mismatching queue not overwritten
partition rule consistent with WorkQueue creation
no deprecated in-memory WorkflowQueue constructor
```

**Commit:**

```text
feat: project WorkQueue profiles to DBOS queues
```

---

## Task 8 — Implement static dispatcher and DurableDispatchPort

**Create:**

```text
packages/durable-execution/src/dbos-dispatcher.ts
packages/durable-execution/src/dbos-dispatch-port.ts
packages/durable-execution/src/dbos-attempt-inspection.ts
packages/durable-execution/test/unit/*
```

Implement §§10–11.

Required tests:

```text
one static workflow registration
dynamic WorkHandler cannot register DBOS workflow
workflow input only id + revision
same revision -> same workflow ID
retry revision -> different workflow ID
priority direct mapping
future notBefore -> ceil delaySeconds
already due -> zero delay
partition key iff partitioned
explicit applicationVersion always present
no deduplicationID
minimal engine output only
engine status normalization does not expose DBOS object publicly
```

**Commit:**

```text
feat: project WorkItems through the static durable dispatcher
```

---

## Task 9 — Real DBOS/PostgreSQL system integration

**Modify dev-only integration composition:**

```text
packages/bootstrap-runtime/package.json
packages/bootstrap-runtime/project.json
packages/bootstrap-runtime/test/integration/durable-work-host.integration.test.ts
packages/bootstrap-runtime/test/support/canonical-postgres.ts
```

Add devDependency:

```text
@heptalogos/durable-execution
```

Production bootstrap-runtime source remains H3-free except the Host authority types it already owns through host-ownership.

Replace the fake DurableDispatchPort only in new/extended real-engine scenarios; retain focused engine-neutral H3A-1 tests where they still prove WorkQueue independently.

Required real DBOS cases:

### D1 — canonical commit / lost immediate projection

```text
commit WorkItem
suppress first dispatch
anti-entropy redispatches same revision
DBOS executes
canonical WorkItem terminal
```

### D2 — duplicate projection

```text
dispatch same WorkItem/revision twice
same DBOS workflow ID
one canonical terminal result
```

### D3 — notBefore

```text
DBOS receives delaySeconds
engine cannot produce authoritative RUNNING before canonical due time
WorkAttemptExecutor remains final time fence
```

### D4 — retry revision

```text
attempt -> explicit RETRY_WAIT
due wake -> canonical revision++
new DispatchAttemptId
new DBOS workflow ID
old engine workflow remains old attempt
```

### D5 — exact generation

```text
A pinned
B current
A missing -> no B execution
A restored -> legal wake/new revision
A executes
```

### D6 — role isolation

```text
DBOS engine works with heptalogos_durable_execution
role has zero product table rights
WorkAttemptExecutor accesses product truth through normal Persistence pool
```

### D7 — queue profile mismatch

```text
persisted DBOS profile != expected catalog
startup fails closed
no runtime overwrite
```

### D8 — missing/outdated vendor schema

```text
runMigrations:false
launch fails
normal runtime does not auto-repair
```

### D9 — partitioned profile

```text
partition limits persisted
partition key required
two partitions execute under correct per-partition mechanics
```

### D10 — stable executor identity

```text
same InstanceId
new BootId
same DBOS executorID
```

**Commit:**

```text
test: qualify real DBOS WorkItem projection
```

---

## Task 10 — Process-level crash/recovery harness

Create semantic process tests:

```text
packages/bootstrap-runtime/test/integration/durable-work-recovery.integration.test.ts
packages/bootstrap-runtime/test/support/durable-work-child.ts
```

Add Nx target:

```text
test:durable-recovery-process
```

It depends on build.

Use Execa for the child process. No raw shell. Test-only barriers live only under test support and use semantic event names, never milestone names in production code.

### P1 — crash after canonical commit, before DBOS dispatch

```text
child:
  authentic Host
  commit PENDING
  signal WORK_COMMITTED
  block before DurableDispatchPort

parent:
  independently verify PENDING
  kill child

restart:
  new BootId / same InstanceId
  launch DBOS + WorkQueue
  canonical scan projects same revision
  WorkItem completes
```

### P2 — crash after engine projection, before RUNNING claim

```text
DBOS workflow exists
process killed before WorkAttemptExecutor claims RUNNING

restart same DurableCodeVersion:
  stable InstanceId executorID
  DBOS recovers/queue continues
  same workflow ID
  one logical attempt
```

### P3 — crash after RUNNING claim, before handler terminalization

Test-only handler barrier:

```text
PENDING -> RUNNING committed
activeAttemptId persisted
child signals RUNNING_COMMITTED
parent kills child
```

Restart:

```text
same WorkItem revision
same DispatchAttemptId
DBOS re-enters executeWorkAttempt
WorkAttemptExecutor takes RUNNING recovery path
markRunning not repeated
exact handler re-reserved
terminal commit succeeds
```

This test is mandatory; it proves the new H3A-2 semantic correction.

### P4 — crash after canonical terminal commit, before DBOS step checkpoint

Barrier:

```text
handler executes
WorkAttemptExecutor commits SUCCEEDED
child signals TERMINAL_COMMITTED
block before DBOS step returns/checkpoints
parent kills child
```

Restart:

```text
DBOS recovers same workflow/step
WorkAttemptExecutor reads terminal
TERMINAL_REPLAY
handler logical durable counter remains one
canonical outcome unchanged
```

Use a durable test counter/record capable of distinguishing duplicate logical handler execution across processes. Do not rely only on process-memory mocks.

### P5 — applicationVersion isolation

```text
DurableCodeVersion A
start nonterminal workflow
kill process

start Version B:
  same InstanceId
  must not execute A workflow as B

start Version A:
  may recover A
```

No blue/green implementation.

### P6 — Signal loss + process crash

Lose listener, commit work, kill process. Restart canonical scan still finds obligation; Signal loss only changes latency.

### P7 — Host lease loss during attempt

```text
handler outside transaction
terminate authentic Host lease
Tx B cannot commit
old Host runtime terminates
canonical state does not fabricate success
```

After valid new Host boot with same DurableCodeVersion/InstanceId, the same engine attempt may recover according to canonical RUNNING semantics.

### P8 — repeated crash budget

Deliberately crash the same workflow until DBOS reaches its configured recovery ceiling.

Required result:

```text
engine projection = RECOVERY_EXHAUSTED
canonical WorkItem remains nonterminal
no automatic reset
no product terminal inference
typed/background diagnostic emitted
```

**Commit:**

```text
test: prove process-level durable work recovery
```

---

## Task 11 — Host maintenance/quiescence integration

Extend:

```text
packages/bootstrap-runtime/test/integration/runtime-host-lifecycle.integration.test.ts
```

Build a dev-only composition containing:

```text
ManagedHost
Persistence
ExecutionLineage
RuntimeKernel
Signal
WorkQueue
DurableExecution
```

Required cases:

### Q1 — planned STOP

Prove exact order:

```text
WorkQueue reconciliation stopped
DurableExecution admission closed
DBOS drain completed
DBOS pool closed
RuntimeKernel quiesced
Host reverse handoff
PostgreSQL stopped
```

No pending WorkItem terminalization.

### Q2 — in-flight DBOS step settles during drain

A running handler is allowed to finish while RuntimeKernel/Persistence are still available. DBOS finishes before RuntimeKernel final quiescence.

### Q3 — pre-entry maintenance abort resumes runtime

```text
DurableExecution QUIESCED
maintenance aborts before destructive entry
same process DBOS relaunch
same static workflow registration
new pool
same profile verification
WorkQueue reconciler restarts
Host remains usable
```

### Q4 — Host terminality

Authentic Host lease loss:

```text
new durable dispatch rejected
DBOS terminal shutdown starts
old WorkHandler lease cannot be used after RuntimeKernel settlement
```

### Q5 — bounded drain failure

If DBOS cannot reach safe quiescence inside configured budget:

```text
maintenance does not claim success
Host ownership is not voluntarily released as if all work settled
```

**Commit:**

```text
test: integrate durable execution with Host lifecycle
```

---

## Task 12 — Queue/admission pressure mechanics

This is still H3A, not H8 ResourceGovernor.

Use deterministic `WorkAdmissionPort` + explicit WorkQueue profiles.

Prove:

```text
beforeCreate REJECT_NEW_WORK
  -> no durable row

after WorkItem commit:
  DELAY / THROTTLE
  -> obligation retained

DBOS worker/global concurrency
  -> bounds actual execution

DBOS rate limit
  -> bounds start rate

DBOS partition concurrency
  -> per-partition bound

priority
  -> engine scheduling influence only
  -> no Authority/admission bypass
```

Do not instantiate a fake `PressureSnapshot` and claim ResourceGovernor complete.

Record:

```yaml
real_resource_governor_pressure_snapshot: NOT_RUN
```

**Commit:**

```text
test: qualify durable admission and queue mechanics
```

---

## Task 13 — Architecture, library-first and current-tree audit

Run structural searches and dependency/boundary gates.

Required semantic results:

```yaml
raw_dbos_import_outside_durable_execution_production: 0
dynamic_workhandler_dbos_registration: 0
second_queue_scheduler: 0
dbos_in_memory_legacy_queue_constructor: 0
normal_dbos_run_migrations_true: 0
dbos_admin_server_enabled: 0
durable_role_heptalogos_table_grants: 0
bootstrap_runtime_production_h3_imports: 0
work_queue_dbos_imports: 0
h3a_consequential_effect_path: 0
h3a_external_effect_uncertain_acceptance: 0
development_history_compatibility_behavior: 0
legacy_shim_fallback_upcaster: 0
milestone_identity_in_permanent_executable_source: 0
```

Search at least:

```bash
rg -n '@dbos-inc/dbos-sdk' packages
rg -n 'registerWorkflow|registerStep|registerQueue|new WorkflowQueue' packages
rg -n 'runMigrations|runAdminServer|deregister' packages/durable-execution
rg -n 'heptalogos_durable_execution' packages
rg -n 'EffectOperation|external-effect-uncertain|network\.request' \
  packages/work-queue packages/durable-execution packages/signal
rg -n 'legacy|obsolete|shim|fallback|compat|upcast|downcast' \
  packages/work-queue packages/durable-execution packages/signal \
  packages/runtime-kernel packages/host-ownership
```

Do not game grep by deleting legitimate architecture terminology from documentation/tests. Inspect semantics.

Any generic process/lifecycle/queue mechanic discovered as a custom duplicate must be moved to the existing owner/adopted provider or explicitly justified by this plan. Do not create `utils/common/shared`.

**Commit:**

```text
refactor: converge H3 durable execution ownership
```

Only create this commit if the audit actually requires code changes.

---

## Task 14 — Full local and Ubuntu real qualification

Current primary real-product qualification environment for H3A-2:

```text
Ubuntu/Linux x86_64
Node current repository exact 24.x
pnpm current repository exact 11.x
TypeScript current repository exact 7.0.x primary
PostgreSQL 18.6 explicit private toolchain
DBOS 4.27.6 exact
```

Focused:

```bash
pnpm nx run foundation-contracts:test
pnpm nx run host-ownership:test
pnpm nx run host-ownership:test:integration
pnpm nx run work-queue:test
pnpm nx run durable-execution:test
pnpm nx run bootstrap-runtime:test:integration
pnpm nx run bootstrap-runtime:test:durable-recovery-process
```

Affected existing owners:

```bash
pnpm nx run canonical-schema:test
pnpm nx run persistence:test
pnpm nx run execution-lineage:test
pnpm nx run runtime-kernel:test
pnpm nx run signal:test
```

Repository:

```bash
pnpm check:agents
pnpm check:documentation
pnpm check:repository
pnpm check:hygiene
pnpm check:dependencies
pnpm check:boundaries
pnpm check:unused
pnpm check:duplicates
pnpm toolchain:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm tsc6
pnpm test
pnpm build
pnpm docs:api:check
pnpm verify
```

Also run:

```bash
git diff --check
```

No skipped real PostgreSQL/DBOS/process target is PASS.

Do not convert one-OS DBOS evidence into Windows/macOS product qualification.

---

## Task 15 — Qualification and living documentation

Update:

```text
docs/qualification/results/Q-ASYNC-01.md
docs/qualification/results/qualification-status.json
docs/roadmap/development-roadmap.md
packages/durable-execution/README.md
packages/work-queue/README.md
packages/host-ownership/README.md
packages/bootstrap-runtime/README.md
```

Generated navigation/API projection must be refreshed through repository owners where required.

Expected H3A-2 properties, only if actually proven:

```yaml
h3a2_exact_dbos_4_27_6: PASS
h3a2_workitem_product_authority: PASS
h3a2_dedicated_engine_principal: PASS
h3a2_engine_zero_product_table_privilege: PASS
h3a2_dbos_schema_migration_authority: PASS
h3a2_normal_runtime_no_ddl: PASS
h3a2_static_dispatcher_real_dbos: PASS
h3a2_same_revision_engine_idempotency: PASS
h3a2_delayed_not_before: PASS
h3a2_retry_new_revision: PASS
h3a2_queue_profile_projection: PASS
h3a2_partition_profile_projection: PASS
h3a2_stable_instance_executor_identity: PASS
h3a2_application_version_isolation: PASS
h3a2_lost_predispatch_process_recovery: PASS
h3a2_running_same_attempt_recovery: PASS
h3a2_crash_after_terminal_commit_no_duplicate_handler: PASS
h3a2_host_loss_fence: PASS
h3a2_host_shutdown_settlement: PASS
h3a2_same_process_quiesce_resume: PASS
h3a2_recovery_budget_fail_closed: PASS
h3a2_ubuntu_postgres_18_6_real_dbos: PASS

h3a1_independent_review: NOT_RUN
h3a1_final_manual_ci: NOT_RUN

real_config_pinned_revision_resolution: NOT_RUN
real_resource_governor_pressure_snapshot: NOT_RUN
h3_windows_real_dbos: PASS
h3_macos_real_dbos: NOT_RUN
h3_source_less_durable_execution: NOT_RUN
h3_service_headless_durable_execution: NOT_RUN
```

Before external review:

```yaml
H3: OPEN
H3A: IMPLEMENTATION_COMPLETE_AWAITING_REVIEW
H3A_1: CLOSED
H3A_2: IMPLEMENTATION_COMPLETE_AWAITING_REVIEW
H3B: NOT_ELIGIBLE
H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: NOT_ELIGIBLE
```

Do not record test counts before observing them.

**Commit:**

```text
docs: record durable execution qualification
```

---

## Task 16 — Candidate freeze, Independent Review and final manual CI

Candidate title:

```text
H3A-2: durable execution and crash recovery
```

PR must state current semantic facts, not development chronology:

```text
DBOS 4.27.6 exact
WorkItem remains product Authority
dedicated engine PostgreSQL role/schema
stable InstanceId executor identity
DurableCodeVersion application-version fence
one static dispatcher
current DBOS queue API
same-attempt RUNNING recovery
real process kill/restart matrix
Host shutdown/quiescence integration
H3A only; no EffectOperation
```

Before Ready:

```text
all required focused tests PASS
real Ubuntu PostgreSQL/DBOS tests PASS
process crash matrix PASS
pnpm verify PASS
architecture/hygiene audit PASS
no behavior TODO/TBD
no unclassified plan gap
```

Then:

```text
Draft -> Ready
freeze candidate
external Independent Review
```

Independent Review is out-of-band and is not GitHub review state.

If external review returns `REQUEST_CHANGES`:

```text
Ready -> Draft
fix exact findings
requalify affected/full required gates
Ready again
new Independent Review
```

After external Independent Review `PASS` and no mutation:

```text
run final manual CI on exact Ready candidate
```

Final manual CI must exercise current standard cross-platform repository/static/unit closure as configured. It does **not** magically promote Windows/macOS real DBOS product evidence unless those real engine scenarios actually run there.

If final CI requires mutation, review is stale; return Draft and repeat.

On PASS:

```text
squash merge
```

No branch mutation after final CI.

---

## Task 17 — H3A post-merge closure

After H3A-2 squash merge, use a fresh docs/evidence-only branch.

Move:

```text
docs/plans/active/foundation/h3a2-dbos-durable-execution-crash-recovery-2026-08-29.md
->
docs/plans/completed/foundation/h3a2-dbos-durable-execution-crash-recovery.md
```

Update:

```text
docs/plans/README.md
docs/roadmap/development-roadmap.md
docs/qualification/results/Q-ASYNC-01.md
docs/qualification/results/qualification-status.json
```

Final living state:

```yaml
H3: OPEN
H3A: CLOSED
H3A_1: CLOSED
H3A_2: CLOSED
H3B: ELIGIBLE
H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: NOT_ELIGIBLE
activeImplementationPlan: NONE
```

Preserve truthful historical H3A-1 evidence:

```yaml
h3a1_implementation: PASS
h3a1_merge: PASS
h3a1_governance_recovery: PASS
h3a1_independent_review: NOT_RUN
h3a1_final_manual_ci: NOT_RUN
```

Record H3A-2 closure:

```yaml
h3a2_independent_review: PASS
h3a2_final_manual_ci: PASS
h3a2_merge: PASS
```

No new behavior Independent Review exists solely to record already-proven post-merge truth.

---

# 15. Required qualification matrix

Every `REQUIRED` H3A-2 row must be PASS before H3A closes.

| ID    | Property                                                                         | Evidence                                       |
| ----- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| A2-01 | WorkItem remains the only product durable-work Authority                         | code/API audit + real PG                       |
| A2-02 | DBOS 4.27.6 is the only durable engine                                           | package/runtime evidence                       |
| A2-03 | DBOS role has zero `heptalogos.*` data privileges                                | real PG ACL                                    |
| A2-04 | DBOS schema changes only under migration Authority                               | fresh/restart real PG                          |
| A2-05 | normal DBOS runtime performs no DDL                                              | `runMigrations:false` + missing-schema failure |
| A2-06 | static dispatcher is the only DBOS WorkItem workflow                             | static audit + runtime                         |
| A2-07 | same WorkItem/revision maps to one DBOS workflow ID                              | real DBOS duplicate projection                 |
| A2-08 | retry/wakeup increments revision before new engine identity                      | real DBOS + PG                                 |
| A2-09 | canonical `notBefore` remains final time Authority                               | delayed DBOS + executor recheck                |
| A2-10 | queue profiles project exactly to current DBOS Queue API                         | readback                                       |
| A2-11 | partition profile/key contract is fail-closed                                    | WorkQueue + real DBOS                          |
| A2-12 | DBOS executor identity survives BootId change                                    | process restart                                |
| A2-13 | applicationVersion is an orthogonal durable-code axis                            | A/B process test                               |
| A2-14 | crash after WorkItem commit before dispatch recovers                             | process kill                                   |
| A2-15 | crash after engine projection before RUNNING recovers                            | process kill                                   |
| A2-16 | RUNNING same revision/attempt re-enters after process death                      | process kill                                   |
| A2-17 | crash after terminal commit before DBOS checkpoint does not re-run logical work  | deterministic barrier                          |
| A2-18 | stale revision cannot commit after recovery                                      | real PG CAS                                    |
| A2-19 | exact pinned generation remains mandatory during recovery                        | A/B generation                                 |
| A2-20 | engine SUCCESS/ERROR/CANCELLED never directly determines WorkItem terminal truth | projection reconciliation tests                |
| A2-21 | recovery budget exhaustion fails closed                                          | repeated crash                                 |
| A2-22 | Host lease loss prevents terminal product commit                                 | authentic lease kill                           |
| A2-23 | planned Host shutdown settles DBOS before ownership release                      | authentic Host                                 |
| A2-24 | maintenance pre-entry abort can resume same-process durable runtime              | real DBOS                                      |
| A2-25 | committed obligation survives admission delay/throttle                           | real row + queue mechanics                     |
| A2-26 | no consequential external-effect path exists                                     | static API/source audit                        |
| A2-27 | no development-history compatibility path exists                                 | hygiene/source audit                           |
| A2-28 | new durable-execution package is covered by package/API navigation owners        | repository/API-doc gates                       |

Residual product properties remain `NOT_RUN` rather than blocking H3A:

```text
real CONFIG_PINNED ConfigurationRevision resolution -> H4
real PressureSnapshot / ResourceGovernor -> H8
Windows real DBOS product qualification
macOS real DBOS product qualification
source-less durable-execution packaging
service/headless durable-execution product qualification
```

---

# 16. Failure and stop conditions

The Agent must stop with evidence instead of selecting a new design if any of the following is required.

## 16.1 Corpus conflict

```text
required behavior contradicts current Architecture Corpus
```

Return:

```text
PLAN_GAP_CORPUS_CONFLICT
```

## 16.2 DBOS hard blocker

Only a reproducible blocker in the exact adopted role may reopen the role decision.

Examples:

```text
cannot use caller-owned system pool safely
cannot preserve applicationVersion fence
cannot recover same workflow ID across real process crash with stable executor identity
cannot use queue mechanics without moving WorkItem Authority into DBOS
cannot provision/operate vendor schema under required least privilege
```

Return evidence. Do not choose another engine.

## 16.3 Provider API materially differs

If installed 4.27.6 public API contradicts this plan in a way that changes semantics, stop.

Do not silently use preview, legacy queue API, internal private DBOS module, or source patch.

## 16.4 Package/lifecycle boundary would need inversion

Stop if correctness appears to require:

```text
work-queue importing DBOS
runtime-kernel importing work-queue
bootstrap-runtime production importing durable-execution
durable-execution mutating WorkItem tables directly
```

## 16.5 H3B semantics are required

If correct implementation requires:

```text
EffectOperation
external-effect uncertainty
remote idempotency/reconciliation
network write semantics
```

stop; do not pull H3B into H3A-2.

## 16.6 Compatibility temptation

If a test/development database fails because it has the old four-role/current-development shape:

```text
reset/recreate current development state
```

Do not add compatibility.

---

# 17. Agent execution discipline

## Before each behavior-bearing task

1. Read root `AGENTS.md`.
2. Read `packages/AGENTS.md`.
3. Read the target package README.
4. Read this plan's relevant decision section.
5. Search for existing owner/mechanics before adding helpers.
6. Write/adjust failing focused test first.
7. Implement minimum semantics required by the locked decision.
8. Run focused tests.
9. Run affected lint/typecheck/build.
10. Keep current-tree names semantic and phase-neutral.

## Agent is explicitly forbidden to decide

```text
DBOS vs another engine
DBOS exact package version
executorID identity
applicationVersion identity
queue profile contract
partition semantics
workflow/step count
workflow ID mapping
step retry policy
recovery-budget ownership
RUNNING recovery semantics
engine-status/product-status mapping
PostgreSQL role topology
schema owner
Host lifecycle ordering
shutdown drain semantics
package ownership
dependency direction
compatibility strategy
which residual product claims are PASS
whether H3B/H4/H8 work is pulled forward
```

All are decided in this file.

---

# 18. External evidence snapshot used by this plan

This section is evidence/rationale, not a second runtime Authority.

Checked 2026-08-29:

```text
npm:
https://www.npmjs.com/package/@dbos-inc/dbos-sdk
  latest stable: 4.27.6
  preview: 4.28.3-preview

DBOS configuration:
https://docs.dbos.dev/typescript/reference/configuration

DBOS queues:
https://docs.dbos.dev/typescript/reference/queues
https://docs.dbos.dev/typescript/tutorials/queue-tutorial

DBOS workflow/method APIs:
https://docs.dbos.dev/typescript/reference/methods
https://docs.dbos.dev/typescript/reference/workflows-steps

DBOS workflow recovery:
https://docs.dbos.dev/production/workflow-recovery
https://docs.dbos.dev/typescript/tutorials/workflow-tutorial

DBOS integration lifecycle:
https://docs.dbos.dev/typescript/integrating-dbos

DBOS CLI:
https://docs.dbos.dev/typescript/reference/cli

DBOS upstream source/package:
https://github.com/dbos-inc/dbos-transact-ts
```

Observed current provider facts incorporated into the locked decisions:

```text
database-backed registerQueue API
partition queues require partition key
priority/delay/applicationVersion are enqueue options
caller-owned systemDatabasePool is supported
runMigrations=false verifies instead of migrating
workflow recovery starts at DBOS launch
self-hosted executor identity affects which pending workflows recover
workflow maxRecoveryAttempts is an engine crash-loop safety bound
workflow ERROR is not ordinary automatic crash recovery
DBOS 4.27 shutdown supports workflowCompletionTimeoutMS
```

---

# 19. Definition of done

H3A-2 is not complete because:

```text
the package compiles
DBOS launches
a queue test passes
a WorkItem completes once
```

It is complete when the current system proves the following whole capability:

```text
an authentic Host
owns canonical PostgreSQL mutation Authority
        ↓
commits a generation-bound WorkItem
        ↓
projects it idempotently into current DBOS Queue
        ↓
crashes at arbitrary pre-dispatch / RUNNING / post-terminal boundaries
        ↓
restarts with a new BootId but the same InstanceId
        ↓
recovers the correct durable-code version and exact attempt/generation
        ↓
never lets engine-private state override WorkItem truth
        ↓
settles or preserves the obligation through planned shutdown
        ↓
and remains free of consequential external-effect semantics
```

Only then:

```text
H3A = CLOSED
H3B = ELIGIBLE
```

H3 itself remains OPEN.
