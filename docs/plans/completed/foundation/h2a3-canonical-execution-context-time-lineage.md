# Heptalogos H2A-3 Canonical Execution Context, Time & Lineage Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: read the repository Heptalogos architecture/runtime-durability/dependencies/verification skills first, then execute this plan task-by-task with TDD. If the execution harness provides `superpowers:executing-plans` or `superpowers:subagent-driven-development`, use one of those execution modes rather than improvising a new workflow. This plan intentionally retains architectural decisions here. The implementing Agent may make ordinary local coding choices, but **must not reinterpret service ownership, package boundaries, durable shapes, dependency routes, transaction semantics, migration policy, or milestone scope**. If an implementation fact contradicts a Decision Lock below, stop and report the contradiction instead of inventing a new architecture.

**State:** `COMPLETED / MERGED_WITH_DEFERRED_FINAL_CI`
**Baseline:** `master@446d0f6bce449f177c66fb569341020757b44c9b`
**Target branch:** `dev/h2a3-canonical-execution-context-time-lineage`  
**Integration unit:** one branch → one Draft PR → local qualification → external independent review on exact `(base_sha, head_sha)` → manual exact-pair final CI → squash merge → separate docs/evidence-only repository-truth reconciliation  
**Compatibility epoch:** `PRE_PRODUCTION`

**Closure record (2026-08-25):** The final reviewed candidate was
`446d0f6bce449f177c66fb569341020757b44c9b` →
`2482b6e380cbad37407e99b0ce7c7560ccc709c6`. Independent review was `PASS`.
PR #19 was squash-merged at
`7b51468c2c41895bde7091868d688d98dfc6c957`. Final cross-platform CI remains
`NOT_RUN` by explicit operator direction pending the H2-wide run; this record
does not promote that deferred gate to `PASS`. H2A-3 is closed as an
implementation milestone, H2A is functionally complete, H2B is the active
implementation milestone, and H2 remains open.

**Goal:** complete the remaining functional core of H2A by establishing canonical `Instant`/monotonic time semantics, the normal-runtime SchemaRuntime boundary, Heptalogos-owned Activity/ExecutionContext propagation over Node AsyncLocalStorage plus OpenTelemetry Context, a durable `LineageContextRef V1`, minimum retained Activity/Evidence records, and same-transaction participation so a normal canonical mutation can be fenced by Host ownership and bound to trusted causal identity and required evidence without leaking raw persistence or telemetry mechanics.

**Architecture:** H2A-1 already owns Host-fenced normal transactions; H2A-2 owns current canonical schema initialization and continuity identity. H2A-3 adds an execution semantic spine above those mechanics without introducing H2B runtime composition or H3 durable work. `PersistenceService` remains the transaction Authority and does not depend on `execution-lineage`; it consumes a small injected current-execution identity provider. `ExecutionLineageService` and `EvidenceService` are distinct semantic services and participate in caller-owned `PersistenceMutationTransactionContext` through a restricted Foundation repository subpath. `Activity` remains Heptalogos Authority; OpenTelemetry is correlation/projection only.

**Tech Stack:** Node 24.19.0, pnpm 11.22.0, Nx 23.1.1, TypeScript 7.0.2 canonical / TS6.0.2 compiler-API compatibility lane only, PostgreSQL 18.x, `pg` 8.23.0, Kysely 0.29.5, TypeBox 1.3.16, Ajv 8.20.0, `@opentelemetry/api` **1.9.1**, UUID 14.0.2, Vitest 4.1.11, fast-check 4.9.0.

**Spec / design authority:** the current Architecture Corpus—especially S03, S15, S16—plus the living H2A roadmap and the approved architectural decisions frozen as Decision Locks in this plan. There is no separate feature spec whose choices the implementing Agent may reinterpret.

**Normative sources to read before editing:**

- `AGENTS.md`
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/03-核心概念与Authority.md`
- `Architecture_Corpus/07-Foundation系统服务目录.md`
- `Architecture_Corpus/16-验证与资格认定体系.md`
- `Architecture_Corpus/20-架构审查清单.md`
- `Architecture_Corpus/24-依赖使用与实现路由.md`
- `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md`
- `Architecture_Corpus/specs/S17-Storage-Workspace-DataLifecycle.md`
- `Architecture_Corpus/references/dependency-routing.json`
- `Architecture_Corpus/qualification/dependency-status.json`
- `Architecture_Corpus/qualification/results/C-SCHEMA-01.md`
- `docs/roadmap/development-roadmap.md`
- `docs/engineering/playbooks/repository/milestone-pr-closure.md`
- `docs/plans/completed/foundation/h2a1-host-fenced-persistence-authority.md`
- `docs/plans/completed/foundation/h2a2-canonical-schema-continuity-authority.md`
- `.agents/skills/heptalogos-architecture/SKILL.md`
- `.agents/skills/heptalogos-runtime-durability/SKILL.md`
- `.agents/skills/heptalogos-dependencies/SKILL.md`
- `.agents/skills/heptalogos-verification/SKILL.md`

---

# Global constraints

- `CompatibilityEpoch = PRE_PRODUCTION`: rewrite the current V1/baseline in place; never preserve repository-development history through compatibility code.
- Adopted dependency routes are directives. Do not add or substitute providers; `@opentelemetry/api` is pinned here at 1.9.1 and no OTel SDK/context-manager/exporter package is authorized by this plan.
- H2A-1 Host ownership/database fencing remains the sole normal mutation Authority; ExecutionContext metadata is provenance/admission only.
- Required retained Activity/Evidence must participate in the caller's same PostgreSQL transaction when the owning contract requires them.
- Bootstrap/Recovery must remain usable without normal SchemaRuntime, TimeService, ExecutionLineage, OTel, or canonical PostgreSQL availability.
- Framework/runtime objects (`pg`, Kysely, Ajv, TypeBox, OTel Context/provider objects) may exist only behind the exact boundaries below; they are not stable product/Extension contracts.
- Real PostgreSQL evidence must record the exact PostgreSQL version/toolchain actually executed. A skipped integration suite is `NOT_RUN`, never PASS.
- No task may dispatch CI, infer Independent Review from GitHub review objects, merge, or write directly to master without the existing explicit workflow authorization.

---

# 1. Milestone outcome and non-goals

H2A-3 must answer this bounded question:

> Given a current Host that already owns normal canonical mutation authority, can a meaningful operation carry trusted execution identity and semantic time through normal asynchronous control flow, cross a durable handoff as an explicit causal ref, and atomically retain the minimum Activity/Evidence required by a canonical Authority transition?

The milestone is functionally complete only when the executable chain is:

```text
BootstrapActivityId / BootstrapJournal
        ↓ causal handoff
current Host trusted origin
        ↓
ExecutionContextRuntime
  ActivityId + Instant + causal relations + optional OTel correlation
        ↓
PersistenceService.mutate
  Host authority + database fence + current execution admission
        ↓
PersistenceMutationTransactionContext
        ├─ retained ActivityRecord
        ├─ required EvidenceRecord
        └─ canonical mutation
             all in one PostgreSQL transaction where required
```

## Explicit non-goals

Do **not** implement or pull into H2A-3:

- Cordis / `RuntimeSubstrate` / `RuntimeReconciler` / MicroSystem lifecycle;
- ServiceRegistry / CapabilityRegistry / GenerationFence;
- DBOS / WorkQueue / Signal / DurableExecution;
- EffectOperation or external-effect dispatch;
- Management API / CLI / Web / Operator Assistant;
- Subject / Messaging / AI runtime / MCP;
- complete LineageQueryService or user-facing activity graph queries;
- Pino logging implementation;
- OpenTelemetry SDK, tracer provider, exporters, collector, OTLP, metrics backend, or OpenInference runtime;
- arbitrary W3C inbound/outbound network propagation policy;
- full retention/redaction engine;
- full DataLifecycleRegistry, BackupCoordinator, or StorageWorkspaceService;
- new file-watch/configuration/storage dependencies;
- refactoring stable H1 Bootstrap Closure to depend on normal `TimeService` or `SchemaRuntime`;
- production compatibility readers, V2/V3 durable formats, migration bridges, upcasters, aliases, shims, or dual formats.

StorageWorkspace remains architecturally valid under S17, but its implementation is deferred until a concrete Foundation owner needs filesystem workspace mechanics. H2A-3 has no such owner: Activity/Evidence are canonical PostgreSQL records and the other H2A-3 services are process-memory mechanics.

---

# 2. Decision Locks — implementing Agent has no discretion to change these

## DL-01 — package boundaries

Create exactly these new workspaces:

```text
@heptalogos/schema-runtime
@heptalogos/time-service
@heptalogos/execution-lineage
@heptalogos/evidence
```

Do not create a generic `foundation-utils`, `runtime-core`, `observability-core`, or `common` workspace.

Semantic ownership:

```text
foundation-contracts
  → stable primitive identities, canonical Instant value contract,
    cross-cutting RetentionClass/Sensitivity vocabulary

schema-runtime
  → normal-runtime JSON Schema validation mechanics

time-service
  → wall-clock/monotonic/timezone/fake-time semantics

execution-lineage
  → Activity, ExecutionContext, in-process propagation,
    LineageContextRef, retained Activity repository

evidence
  → durable typed/versioned/causal Evidence service/repository
```

`EvidenceService` is deliberately **not** owned by `execution-lineage`: Evidence and Activity are distinct Authority objects in the Corpus, have different future consumers, and must be able to evolve independently.

## DL-02 — stable primitive additions

Add to `@heptalogos/foundation-contracts`:

```ts
export type ActivityId = UuidV7Id<"ActivityId">;
export type EvidenceId = UuidV7Id<"EvidenceId">;
export type Instant = Branded<string, "Instant">;

export type RetentionClass =
  | "ephemeral"
  | "operational"
  | "retained"
  | "audit";

export type Sensitivity =
  | "public"
  | "operational"
  | "sensitive"
  | "pii"
  | "secret";

export const createActivityId: () => ActivityId;
export const parseActivityId: (value: unknown) => ActivityId | undefined;
export const createEvidenceId: () => EvidenceId;
export const parseEvidenceId: (value: unknown) => EvidenceId | undefined;
export const parseInstant: (value: unknown) => Instant | undefined;
export const formatInstant: (value: Date) => Instant;
```

Canonical `Instant` remains exactly the existing millisecond UTC form:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
```

`formatInstant` formats an already-supplied `Date`; it does not own a clock. `foundation-contracts` must not gain `now()`.

Existing `BootstrapActivityId = UuidV7Id<"ActivityId">` converges to the same primitive. Keep a local alias if it avoids unrelated H1 churn, but it must be defined in terms of `ActivityId`, not a second brand.

`RetentionClass` and `Sensitivity` are placed in `foundation-contracts` because they are cross-cutting governance vocabulary consumed by Activity, Evidence, and later data-lifecycle/security surfaces. Do not make Evidence depend on execution-lineage merely to reuse these two enums. `ActivityImportance` remains owned by execution-lineage.

## DL-03 — TimeService uses Node/Intl only

Do not add Temporal/polyfill/date-fns/Luxon/Moment/Day.js or another date-time provider in this milestone.

Use:

```text
wall clock Instant  → Date / Date.now() + foundation-contracts formatter
monotonic clock     → process.hrtime.bigint()
IANA timezone check → Intl.DateTimeFormat
fake/replay time    → Heptalogos testable implementation
```

Required public contract:

```ts
export type MonotonicTick = Branded<bigint, "MonotonicTick">;
export type ElapsedNanoseconds = Branded<bigint, "ElapsedNanoseconds">;
export type TimeZoneId = Branded<string, "TimeZoneId">;

export interface TimeService {
  now(): Instant;
  monotonicNow(): MonotonicTick;
  elapsedSince(start: MonotonicTick): ElapsedNanoseconds;
}

export interface FakeTimeService extends TimeService {
  setWallClock(value: Instant): void;
  advanceWallClock(milliseconds: number): void;
  advanceMonotonic(nanoseconds: bigint): void;
}

export const parseTimeZoneId: (value: unknown) => TimeZoneId | undefined;
export const createSystemTimeService: () => TimeService;
export const createFakeTimeService: (
  initialWallClock: Instant,
  initialMonotonic?: bigint,
) => FakeTimeService;
```

Wall and monotonic fake clocks must be independently movable so tests can simulate wall-clock jumps without corrupting elapsed duration. The monotonic clock must never move backward: `advanceMonotonic` rejects negative deltas, and `elapsedSince` rejects a mark greater than the current monotonic tick. These are programmer-contract failures (`RangeError` is sufficient); do not create product scheduling semantics around them.

H2A-3 does not implement scheduling, recurrence, cron, Commitment semantics, DST recurrence resolution, or human calendar calculations.

## DL-04 — SchemaRuntime route and containment

`schema.typebox-ajv` is already ADOPTED and `C-SCHEMA-01` is CLOSED. Do not re-select the provider.

Normal-runtime rule:

```text
Ajv compilation/runtime
→ only @heptalogos/schema-runtime internals

TypeBox authoring in new normal Foundation code
→ only through @heptalogos/schema-runtime/typebox
```

Bootstrap Closure is a bounded exception. The **only frozen direct `typebox`/`ajv` import exceptions** for this milestone are the files that already use them on the H2A-2 baseline:

```text
packages/bootstrap-state/src/codec.ts
packages/bootstrap-state/src/journal.ts
packages/bootstrap-state/src/bootstrap-owner-witness-codec.ts
packages/bootstrap-state/src/maintenance-codec.ts
packages/bootstrap-runtime/src/locator.ts
```

Do not refactor these H1 files onto a normal-runtime package merely for consistency, and do not add another direct-import exception without stopping for architecture review.

`@heptalogos/schema-runtime` exports:

```ts
export interface SchemaValidationIssue {
  readonly instancePath: string;
  readonly keyword: string;
  readonly message: string;
}

export type SchemaValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly SchemaValidationIssue[] };

export interface SchemaValidator<T> {
  validate(value: unknown): SchemaValidationResult<T>;
}

export function compileSchema<T>(schema: object): SchemaValidator<T>;
```

Use the JSON Schema 2020-12 validator entry point already proven by current Bootstrap code:

```ts
import { Ajv2020 } from "ajv/dist/2020.js";
```

Ajv profile is fixed and non-configurable in this milestone:

```ts
{
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
  strict: true,
}
```

Validation must not clone or mutate a valid caller object; success returns the original value typed as `T`. Ajv objects/errors do not cross the package root.

`@heptalogos/schema-runtime/typebox` may re-export the selected TypeBox authoring surface needed by Foundation schema definitions. This subpath is Foundation implementation tooling, not a stable Extension ABI. `packages/schema-runtime/package.json` must export exactly `.` and `./typebox`; the package root must not star-export or type-export TypeBox framework types.

## DL-05 — ExecutionContext origin is Host-assigned

H2A-3 trusted normal-host origin is exactly:

```ts
export interface HostExecutionOrigin {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly hostOwnershipToken: HostOwnershipToken;
}
```

The runtime is created with this seed. Activity callers cannot supply or override these fields.

Do not pre-invent H2B Package/MicroSystem/Contribution generations as authoritative identities in this milestone. The `ExecutionContext` contract may carry a bounded optional semantic section, but future H2B origin fields are added when their actual owners exist.

## DL-06 — Activity model is Heptalogos-owned, not an OTel span

Minimum current contracts:

```ts
export type ActivityImportance =
  | "diagnostic"
  | "routine"
  | "significant"
  | "critical";

export interface ActivityLink {
  readonly kind: "linked-to" | "supersedes" | "resumes" | "fan-out" | "fan-in";
  readonly targetActivityId: ActivityId;
}

export interface ActivityTelemetryCorrelation {
  readonly traceId: string;
  readonly spanId: string;
  readonly traceFlags: number;
}

export interface ExecutionContext {
  readonly activityId: ActivityId;
  readonly kind: string;
  readonly startedAt: Instant;
  readonly parentActivityId?: ActivityId;
  readonly causationActivityId?: ActivityId;
  readonly links: readonly ActivityLink[];
  readonly origin: HostExecutionOrigin;
  readonly semantic: Readonly<{
    operationId?: string;
    featureId?: string;
    serviceId?: string;
    capabilityId?: string;
    providerId?: string;
    contractVersion?: string;
  }>;
  readonly importance: ActivityImportance;
  readonly retentionClass: RetentionClass;
  readonly sensitivity: Sensitivity;
  readonly telemetry?: ActivityTelemetryCorrelation;
}
```

The exact semantic optional fields above are permitted, but H2A-3 must not create registries for concepts whose owning H2B/H4 services do not exist.

## DL-07 — one in-process context stack

`@heptalogos/execution-lineage` owns one Node `AsyncLocalStorage<ExecutionContext>` instance per `ExecutionContextRuntime`.

Do not use raw `async_hooks`, continuation-local-storage, Zone.js, another CLS package, or a second Heptalogos async-context stack.

Use OpenTelemetry Context API only for telemetry correlation/projection. Absence of an OTel SDK is valid: `@opentelemetry/api` 1.9.1 has no-op defaults. H2A-3 does not create or export a tracer provider.

Required runtime surface:

```ts
export interface ActivityRequest {
  readonly kind: string;
  readonly causationActivityId?: ActivityId;
  readonly links?: readonly ActivityLink[];
  readonly semantic?: ExecutionContext["semantic"];
  readonly importance: ActivityImportance;
  readonly retentionClass: RetentionClass;
  readonly sensitivity: Sensitivity;
}

export interface ExecutionContextRuntime {
  current(): ExecutionContext | undefined;
  runActivity<T>(
    request: ActivityRequest,
    operation: (context: ExecutionContext) => Promise<T>,
  ): Promise<T>;
  capture<TArgs extends readonly unknown[], TResult>(
    callback: (...args: TArgs) => TResult,
  ): (...args: TArgs) => TResult;
  createLineageContextRef(): LineageContextRefV1;
  runFromLineageContextRef<T>(
    ref: LineageContextRefV1,
    request: Omit<ActivityRequest, "causationActivityId">,
    operation: (context: ExecutionContext) => Promise<T>,
  ): Promise<T>;
}
```

Factory signature is fixed:

```ts
export function createExecutionContextRuntime(
  origin: HostExecutionOrigin,
  time: TimeService,
): ExecutionContextRuntime;
```

Internally the ALS store may carry both the Heptalogos `ExecutionContext` and a captured OpenTelemetry `Context`, but the raw OTel `Context` must not cross the package root. H2A-3 does not install a global OpenTelemetry ContextManager. The runtime reads `context.active()` when entering a root scope, preserves that `Context` object internally for nested/captured scopes, and projects a valid `SpanContext` into `ExecutionContext.telemetry` when present. If no ContextManager/SDK is registered, the OTel side is legitimately the root/no-span context while Heptalogos ALS propagation still works.

`runActivity` semantics:

- no current context → root Activity;
- ordinary `runActivity` with a current context → `parentActivityId = current.activityId`, regardless of whether an independent `causationActivityId` is also present;
- explicit `causationActivityId` is retained separately and must not be rewritten into a fake parent;
- `runFromLineageContextRef` is the durable-handoff exception: it creates a new local root (`parentActivityId` absent) with `causationActivityId = ref.sourceActivityId`, even if the caller itself happens to have an ambient Activity. Durable resume must not be disguised as synchronous nesting;
- origin is always the runtime seed;
- context is immutable/frozen enough that consumers cannot mutate origin;
- success/failure restores the previous ambient context;
- thrown errors are rethrown unchanged after the transient Activity scope is ended/restored;
- Activity creation does not automatically make the record durable;
- H2A-3 does **not** expose a durable Activity-completion mutation API. `ended_at/outcome` columns are reserved by the current baseline, while the first real lifecycle owner that needs durable completion will add the narrowly owned update path during later Runtime instrumentation. Do not grant UPDATE merely because the columns exist.

## DL-08 — durable `LineageContextRef V1` is causal, not Authority

Use exactly one current PRE_PRODUCTION shape:

```ts
export interface LineageContextRefV1 {
  readonly schemaVersion: 1;
  readonly sourceActivityId: ActivityId;
  readonly sourceInstanceId: InstanceId;
  readonly sourceContinuityEpochId: ContinuityEpochId;
  readonly telemetry?: ActivityTelemetryCorrelation;
}

export type LineageContextRef = LineageContextRefV1;
```

Do **not** put current `BootId`, `InstallationId`, or `HostOwnershipToken` in the durable ref. Those values are source-host provenance and must not be replayed as current origin/Authority after a wait or restart.

Resume semantics are fixed:

```text
ref.sourceInstanceId != current InstanceId
→ reject

ref.sourceContinuityEpochId != current ContinuityEpochId
→ reject as timeline discontinuity

valid ref
→ create a NEW Activity with current Host origin
→ parentActivityId = absent
→ causationActivityId = ref.sourceActivityId
→ new Activity telemetry comes only from the current local OTel Context
→ optional old ref.telemetry remains source correlation/link data only and must never be copied as the new current span identity
```

Validation uses `SchemaRuntime`, is non-mutating, and rejects obsolete/future PRE_PRODUCTION shapes. No V2/upcaster/legacy reader.

## DL-09 — Persistence does not depend on execution-lineage

`@heptalogos/persistence` must not import `@heptalogos/execution-lineage`.

Add a small persistence-owned contract:

```ts
export interface PersistenceExecutionMetadata {
  readonly activityId: ActivityId;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly hostOwnershipToken: HostOwnershipToken;
}

export interface PersistenceExecutionContextProvider {
  current(): PersistenceExecutionMetadata | undefined;
}
```

`createPersistenceService` and the test constructor receive this provider as a required argument with these exact signatures:

```ts
export function createPersistenceService(
  authority: HostPersistenceAuthority,
  options: PersistenceRuntimeOptions,
  executionContextProvider: PersistenceExecutionContextProvider,
): PersistenceService;

export function createPersistenceServiceForTests(
  authority: HostPersistenceAuthority,
  options: PersistenceRuntimeOptions,
  executionContextProvider: PersistenceExecutionContextProvider,
  database: PersistenceDatabaseLike,
  hooks?: PersistenceServiceTestHooks,
): PersistenceService;
```

Do not add an optional/default provider that silently restores context-free mutation. Tests that need context-free reads pass `{ current: () => undefined }` explicitly.

`@heptalogos/execution-lineage` may export an adapter that implements this persistence contract by reading its current `ExecutionContext`; this direction is allowed:

```text
execution-lineage -> persistence
persistence -X-> execution-lineage
```

## DL-10 — mutation requires current execution identity; read does not

Replace the generic transaction context with a discriminated pair:

```ts
export interface PersistenceReadTransactionContext {
  readonly mode: "READ";
  readonly execution?: PersistenceExecutionMetadata;
}

export interface PersistenceMutationTransactionContext {
  readonly mode: "MUTATION";
  readonly execution: PersistenceExecutionMetadata;
}

export type PersistenceTransactionContext =
  | PersistenceReadTransactionContext
  | PersistenceMutationTransactionContext;
```

Update the service signatures:

```ts
read<T>(
  operation: (context: PersistenceReadTransactionContext) => Promise<T>,
): Promise<T>;

mutate<T>(
  operation: (context: PersistenceMutationTransactionContext) => Promise<T>,
): Promise<T>;
```

Before a mutating transaction is admitted, the current execution metadata must exist and exactly match the current `HostPersistenceAuthority` for:

```text
InstallationId
InstanceId
BootId
ContinuityEpochId
HostOwnershipToken
```

Failure cases:

```text
no ambient execution identity
→ persistence.execution_context.required

identity mismatch
→ persistence.execution_context.stale_origin
```

This check is an additional stale-work guard. It is **not Authority**. Actual mutation Authority remains `HostPersistenceAuthority.assertActive()` plus the database `HostOwnershipFence` verification. A structurally valid execution metadata object must never be sufficient to create mutation authority.

Read transactions may attach a current execution snapshot when one exists, but lack of an execution context does not block a read. If a provider does return metadata for a read, compare the same five origin fields to the active `HostPersistenceAuthority`; mismatch uses `persistence.execution_context.stale_origin` rather than attaching misleading provenance. Both read and mutation transaction contexts receive a copied/frozen metadata snapshot, not the provider object's mutable reference.

## DL-11 — restricted Foundation repository seam exposes Kysely only internally

Add package subpath:

```text
@heptalogos/persistence/foundation-repository
```

It may expose Kysely transaction mechanics only to mechanically allowlisted Foundation repository packages. The package root `@heptalogos/persistence` must continue to contain no `Kysely`, `Transaction`, `Pool`, `Client`, `CompiledQuery`, or other framework object.

Required helper:

```ts
export async function useFoundationMutationTransaction<T>(
  context: PersistenceMutationTransactionContext,
  operation: (transaction: PersistenceInternalTransaction) => Promise<T>,
): Promise<T>;
```

The helper resolves only a genuine WeakMap-issued transaction context and rejects read/fake/released contexts. Initial allowlist:

```text
packages/execution-lineage/
packages/evidence/
packages/persistence/ tests
```

The existing `boundaries.mjs` restricted-import map normalizes imports to package names, so it cannot safely enforce this subpath by itself. Extend the verifier with a **full-specifier restriction layer** (for example `restrictedSpecifiers: Map<string, allowedPaths[]>`) checked before package-name normalization. Add `@heptalogos/persistence/foundation-repository` there. Do **not** restrict the entire `@heptalogos/persistence` package merely to enforce this subpath.

Do not create a custom SQL DSL to hide Kysely from trusted Foundation repository implementation code.

## DL-12 — retained Activity and Evidence remain separate services

`ExecutionLineageService` persists Activity facts; `EvidenceService` persists product evidence. The H2A-3 write surface is intentionally narrow: generic callers may retain only the **current transaction Activity**. A separate bounded bootstrap-reference method exists because Early Observability predates the normal Host transaction context.

```ts
export interface BootstrapRetainedActivityDraft {
  readonly activityId: ActivityId;
  readonly startedAt: Instant;
  readonly endedAt: Instant;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly outcome: "SUCCEEDED" | "FAILED";
  readonly outcomeRef?: string;
}

export interface ExecutionLineageService {
  retainCurrent(
    transaction: PersistenceMutationTransactionContext,
    context: ExecutionContext,
  ): Promise<void>;

  retainBootstrapReference(
    transaction: PersistenceMutationTransactionContext,
    draft: BootstrapRetainedActivityDraft,
  ): Promise<void>;
}
```

`retainCurrent` must fail closed unless:

```text
context.activityId == transaction.execution.activityId
context.origin.installationId == transaction.execution.installationId
context.origin.instanceId == transaction.execution.instanceId
context.origin.bootId == transaction.execution.bootId
context.origin.continuityEpochId == transaction.execution.continuityEpochId
context.origin.hostOwnershipToken == transaction.execution.hostOwnershipToken
```

Stable Problems:

```text
current Activity mismatch
→ lineage.persistence.current_activity_mismatch

current origin mismatch
→ lineage.persistence.origin_mismatch

current context has retentionClass = ephemeral
→ lineage.persistence.retention_not_durable
```

Factory signature is fixed:

```ts
export const createExecutionLineageService: () => ExecutionLineageService;
```

`retainBootstrapReference` is **not** a generic import API. It fixes:

```text
kind             = bootstrap.handoff
host token       = NULL
importance       = significant
retentionClass   = retained
sensitivity      = operational
```

and must require the draft `instanceId` and `continuityEpochId` to match the current mutation transaction; mismatch fails with:

```text
lineage.bootstrap_reference.discontinuity
```

It may preserve the Bootstrap `installationId` and `bootId` as source provenance. No caller-specified Package/MicroSystem/principal fields or arbitrary metadata are accepted. Re-import of the **exact same** Bootstrap summary is idempotent; the same `ActivityId` with any different persisted field is `lineage.bootstrap_reference.conflict`. `retainCurrent` is not an upsert: attempting to retain the same current `ActivityId` twice is `lineage.persistence.activity_already_retained`.

H2A-3 deliberately does **not** expose `complete(activityId, ...)` for a durable Activity. Transient `runActivity` still has start/end scope semantics. Durable completion becomes a narrowly owned persistence transition only when a concrete Runtime/operation lifecycle needs it; do not pre-build a generic updater now.

Minimum Evidence API:

```ts
export interface EvidenceDraft {
  readonly evidenceKind: string;
  readonly evidenceContractVersion: string;
  readonly subjectRef?: string;
  readonly objectRef?: string;
  readonly factRef?: string;
  readonly retentionClass: RetentionClass;
  readonly sensitivity: Sensitivity;
}

export interface EvidenceRecord extends EvidenceDraft {
  readonly evidenceId: EvidenceId;
  readonly activityId: ActivityId;
  readonly recordedAt: Instant;
}

export interface EvidenceService {
  recordRequired(
    transaction: PersistenceMutationTransactionContext,
    draft: EvidenceDraft,
  ): Promise<EvidenceRecord>;
}

export const createEvidenceService: (time: TimeService) => EvidenceService;
```

`recordRequired` derives `activityId` from `transaction.execution.activityId` and `recordedAt` from injected `TimeService`. Caller cannot forge the causal Activity for a required Evidence record. It must reject an empty/whitespace `evidenceKind` with `evidence.invalid_kind`, an empty/whitespace `evidenceContractVersion` with `evidence.invalid_contract_version`, and any present empty/whitespace reference with `evidence.invalid_reference` **inside the caller transaction before return**. These validation failures are intentionally usable by the atomicity test to prove rollback of earlier writes in the same transaction. `recordRequired` also rejects `retentionClass: "ephemeral"` with `evidence.retention_not_durable`; required durable evidence may use `operational`, `retained`, or `audit` according to the owning contract, but never ephemeral retention.

H2A-3 Evidence stores **bounded references/metadata only**. Structural limits are current contract/safety constants, not user-facing configuration:

```text
evidenceKind / evidenceContractVersion: 1..128 UTF-8 bytes
each subjectRef / objectRef / factRef:     1..1024 UTF-8 bytes when present
```

Activity semantic string limits are likewise bounded:

```text
Activity kind:                           1..128 UTF-8 bytes
operation/feature/service/capability/
provider/contractVersion when present:   1..256 UTF-8 bytes
outcomeRef when present:                 1..1024 UTF-8 bytes
```

Enforce the same limits in application validation and PostgreSQL `octet_length(...)` CHECK constraints. Do not introduce arbitrary evidence payload JSON, message/model content, Secret plaintext, blob data, or generic `metadata: Record<string, unknown>` in this milestone.

## DL-13 — canonical schema baseline is rewritten, not upgraded

Rename/squash the current migration to one current baseline:

```text
0001_foundation_baseline
```

The current baseline creates:

```text
heptalogos.instance_continuity
heptalogos.activity_record
heptalogos.activity_link
heptalogos.evidence_record
```

Do not add `0002_add_lineage` or any compatibility migration from the H2A-2 development database.

Old PRE_PRODUCTION database state containing migration metadata for `0001_foundation_continuity` is unsupported and requires reset. A test may prove rejection/fail-closed behavior; it must not implement an upgrade path.

## DL-14 — relational Activity/Evidence shape

Use this current canonical schema semantics.

### `activity_record`

```text
activity_id                 uuid PRIMARY KEY
kind                        text NOT NULL
started_at                  timestamptz(3) NOT NULL
ended_at                    timestamptz(3) NULL
parent_activity_id          uuid NULL
causation_activity_id       uuid NULL
installation_id             uuid NOT NULL
instance_id                 uuid NOT NULL
boot_id                     uuid NOT NULL
continuity_epoch_id         uuid NOT NULL
host_ownership_token        uuid NULL
importance                  text NOT NULL
retention_class             text NOT NULL
sensitivity                 text NOT NULL
operation_id                text NULL
feature_id                  text NULL
service_id                  text NULL
capability_id               text NULL
provider_id                 text NULL
contract_version            text NULL
outcome                     text NULL
outcome_ref                 text NULL
```

Do not add FK constraints from `parent_activity_id` or `causation_activity_id` to `activity_record`: an Activity may legitimately reference an ephemeral/unretained Activity.

Add database CHECK constraints for the canonical closed sets and basic structural truth:

```text
importance      IN (diagnostic, routine, significant, critical)
retention_class IN (operational, retained, audit)  # persisted rows only; ephemeral is process-memory only
sensitivity     IN (public, operational, sensitive, pii, secret)
outcome         IS NULL OR IN (SUCCEEDED, FAILED, CANCELLED)
(kind is non-empty after trim and <= 128 UTF-8 bytes)
(ended_at IS NULL AND outcome IS NULL) OR
(ended_at IS NOT NULL AND outcome IS NOT NULL)
```

Optional semantic IDs/refs, when non-null, must be non-empty after trim and obey the DL-12 byte limits. These are persistence invariants; application validation does not replace them.

For `retainCurrent`, `ended_at/outcome/outcome_ref` are null in H2A-3. For the bounded Bootstrap summary inserted by `retainBootstrapReference`, `ended_at` and `outcome` are populated from the completed BootstrapJournal projection. H2A-3 creates **no generic UPDATE path** for normal retained Activities; the nullable completion columns are reserved canonical shape for the later concrete lifecycle owner.

### `activity_link`

```text
source_activity_id  uuid NOT NULL REFERENCES activity_record(activity_id)
link_kind           text NOT NULL
target_activity_id  uuid NOT NULL
PRIMARY KEY (source_activity_id, link_kind, target_activity_id)
```

Do not FK `target_activity_id`: the linked Activity may be unretained. Add a CHECK that `link_kind` is one of the DL-06 `ActivityLink.kind` values.

### `evidence_record`

```text
evidence_id               uuid PRIMARY KEY
activity_id               uuid NOT NULL REFERENCES activity_record(activity_id)
evidence_kind             text NOT NULL
evidence_contract_version text NOT NULL
recorded_at               timestamptz(3) NOT NULL
subject_ref               text NULL
object_ref                text NULL
fact_ref                  text NULL
retention_class           text NOT NULL
sensitivity               text NOT NULL
```

The FK from Evidence to Activity is intentional: a required durable Evidence record cannot exist without the retained Activity that provides its causal identity.

Add CHECK constraints that `evidence_kind` and `evidence_contract_version` are non-empty after trim and at most 128 UTF-8 bytes; any non-null `subject_ref` / `object_ref` / `fact_ref` is non-empty after trim and at most 1024 UTF-8 bytes; persisted Evidence retention is not `ephemeral`. Evidence application validation must match these database invariants.

### Runtime grants

```text
instance_continuity → SELECT only (unchanged)
activity_record     → SELECT, INSERT
activity_link       → SELECT, INSERT
evidence_record     → SELECT, INSERT
```

No normal runtime DELETE or DDL grant is added.

## DL-15 — required atomicity is proved with a test-only canonical fixture

There is not yet a real H2B/H4 domain table whose Authority transition naturally requires Evidence. Do not invent a fake production domain object just to test atomicity.

Use a test-only PostgreSQL fixture table created and dropped by the H2A-3 integration test under test-owned setup. The test transaction must perform:

```text
insert test canonical fact
+ retain current ActivityRecord
+ record required EvidenceRecord
```

and prove:

```text
forced failure → all three absent
success        → all three present
Evidence failure → canonical fact absent
```

This fixture is verification code only and does not enter the canonical migration.

## DL-16 — Bootstrap handoff is a reference/import, not payload duplication

H2A-3 must connect the existing Bootstrap activity identity to normal lineage without rewriting Bootstrap Closure around normal runtime services.

Rules:

- `BootstrapJournal` remains readable without PostgreSQL/SchemaRuntime/TimeService/OTel SDK;
- its `bootstrapActivityId` is the same `ActivityId` brand;
- once canonical PostgreSQL + Host are ready, normal composition may create one retained bootstrap Activity summary/reference from the bounded journal;
- do not persist every BootstrapJournal checkpoint as a new normal Activity row;
- the first normal Host root Activity is caused by the existing `bootstrapActivityId`;
- bootstrap import failure must not rewrite or corrupt the BootstrapJournal;
- H2A-3 does not remove Early Observability.

## DL-17 — minimal instrumentation recursion suppression exists but is internal

Because lineage/evidence persistence itself uses Persistence transaction mechanics, add an internal suppression scope in `execution-lineage` for observability plumbing. It is not a public business API.

Minimum semantics:

```ts
runWithLineageSuppressed<T>(operation: () => T): T;
isLineageSuppressed(): boolean;
```

Keep it in a non-exported or mechanically restricted internal module. H2A-3 does **not** automatically instrument all Persistence calls, so suppression is primarily a future-proof recursion fence and is used around retained-lineage plumbing tests where appropriate.

Business code and Extension contracts must not obtain this function.

## DL-18 — no new qualification taxonomy

Do not invent `Q-LINEAGE-*` or another permanent qualification family inside this implementation plan.

Record H2A-3 evidence in:

- executable tests;
- this active plan’s evidence/closure section;
- existing `Q-PERSISTENCE-01` only for properties that genuinely extend persistence qualification (current execution admission and required Activity/Evidence transaction atomicity);
- dependency/catalog truth for `@opentelemetry/api@1.9.1`.

Whether a permanent standalone Lineage qualification record is desirable is a separate H2A stabilization/architecture decision.

## DL-19 — H2A-3 merge does not by itself declare H2A CLOSED

Successful H2A-3 implementation makes H2A functionally complete and H2B eligible. After squash merge, run a bounded H2A stabilization/closure review. Only that closure may change H2A from OPEN to CLOSED.

Do not add H2B behavior to this PR to “prove” H2A.

## DL-20 — reuse the existing Bootstrap/PostgreSQL integration harness

Do not make `canonical-schema`, `execution-lineage`, and `evidence` each learn how to start/provision/stop private PostgreSQL. The repository already has a real PostgreSQL + Host + canonical initialization harness in `packages/bootstrap-runtime/src/canonical-initialization.integration.test.ts` and related H1/H2A fixtures.

H2A-3 real-PostgreSQL composition qualification therefore lives in `bootstrap-runtime` **test code only**:

```text
canonical-schema fresh-baseline/table/grant assertions
required Activity/Evidence transaction atomicity
BootstrapJournal → normal lineage handoff
```

`packages/bootstrap-runtime/package.json` may add `@heptalogos/persistence`, `@heptalogos/execution-lineage`, `@heptalogos/evidence`, and `@heptalogos/time-service` as **devDependencies only**. Production bootstrap source must not import them. If fixture reuse requires extracting existing setup into a test-only helper, do that mechanically without changing production Bootstrap APIs or semantics. Do not duplicate a second private-PostgreSQL process/provisioning harness in the new packages.

---

# 3. Target dependency graph

```text
foundation-contracts
  ├─ bootstrap-state
  ├─ host-ownership
  ├─ time-service
  ├─ persistence
  ├─ execution-lineage
  └─ evidence

schema-runtime
  ├─ typebox
  └─ ajv

time-service
  └─ foundation-contracts

persistence
  ├─ foundation-contracts
  ├─ host-ownership
  ├─ pg
  └─ kysely

execution-lineage
  ├─ foundation-contracts
  ├─ schema-runtime
  ├─ time-service
  ├─ persistence
  └─ @opentelemetry/api

evidence
  ├─ foundation-contracts
  ├─ time-service
  └─ persistence

canonical-schema
  ├─ foundation-contracts
  ├─ host-ownership
  ├─ pg
  └─ kysely
```

Forbidden dependency edges:

```text
persistence -> execution-lineage
persistence -> evidence
bootstrap-state -> schema-runtime
bootstrap-runtime -> schema-runtime
bootstrap-runtime -> time-service
bootstrap-runtime -> execution-lineage   # normal production dependency
execution-lineage -> pg
execution-lineage -> raw pg Pool/Client
evidence -> pg
evidence -> raw pg Pool/Client
```

A bootstrap-runtime **integration test/composition seam** may import execution-lineage if required to prove the handoff, but production Bootstrap Closure must remain independent.

---

# 4. Target file map

The Agent may split a listed implementation file if it becomes materially hard to review, but must preserve the responsibility boundary and public signatures in this plan.

## Modify existing

```text
pnpm-workspace.yaml
pnpm-lock.yaml
scripts/verify/boundaries.mjs
packages/foundation-contracts/src/identity.ts
packages/foundation-contracts/src/index.ts
packages/bootstrap-state/src/journal.ts
packages/persistence/package.json
packages/persistence/src/contracts.ts
packages/persistence/src/transaction-context.ts
packages/persistence/src/persistence-service.ts
packages/persistence/src/problems.ts
packages/persistence/src/index.ts
packages/persistence/src/persistence-service.test.ts
packages/persistence/src/persistence.integration.test.ts
packages/canonical-schema/src/migration-provider.ts
packages/canonical-schema/src/migration-pool.ts
packages/bootstrap-runtime/package.json
packages/bootstrap-runtime/project.json
packages/bootstrap-runtime/src/canonical-initialization.integration.test.ts
docs/plans/README.md
docs/roadmap/development-roadmap.md
Architecture_Corpus/qualification/results/Q-PERSISTENCE-01.md
Architecture_Corpus/qualification/results/qualification-status.json
Architecture_Corpus/manifest.json
Architecture_Corpus/SHA256SUMS.txt
```

`packages/persistence/src/persistence-service.test.ts` is the existing unit suite for the service internals; extend it rather than creating a duplicate persistence-service unit suite.

## Rename

```text
packages/canonical-schema/src/migrations/0001-foundation-continuity.ts
→ packages/canonical-schema/src/migrations/0001-foundation-baseline.ts
```

## Create

```text
packages/foundation-contracts/src/data-governance.ts

packages/schema-runtime/package.json
packages/schema-runtime/project.json
packages/schema-runtime/tsconfig.json
packages/schema-runtime/tsconfig.lib.json
packages/schema-runtime/src/contracts.ts
packages/schema-runtime/src/validator.ts
packages/schema-runtime/src/typebox.ts
packages/schema-runtime/src/index.ts
packages/schema-runtime/src/validator.test.ts

packages/time-service/package.json
packages/time-service/project.json
packages/time-service/tsconfig.json
packages/time-service/tsconfig.lib.json
packages/time-service/src/contracts.ts
packages/time-service/src/system-time-service.ts
packages/time-service/src/fake-time-service.ts
packages/time-service/src/time-zone.ts
packages/time-service/src/index.ts
packages/time-service/src/time-service.test.ts

packages/persistence/src/foundation-repository.ts

packages/execution-lineage/package.json
packages/execution-lineage/project.json
packages/execution-lineage/tsconfig.json
packages/execution-lineage/tsconfig.lib.json
packages/execution-lineage/src/contracts.ts
packages/execution-lineage/src/execution-context-runtime.ts
packages/execution-lineage/src/lineage-context-ref.ts
packages/execution-lineage/src/activity-repository.ts
packages/execution-lineage/src/persistence-adapter.ts
packages/execution-lineage/src/bootstrap-handoff.ts
packages/execution-lineage/src/suppression.ts
packages/execution-lineage/src/problems.ts
packages/execution-lineage/src/index.ts
packages/execution-lineage/src/execution-context-runtime.test.ts
packages/execution-lineage/src/lineage-context-ref.test.ts
packages/execution-lineage/src/bootstrap-handoff.test.ts

packages/evidence/package.json
packages/evidence/project.json
packages/evidence/tsconfig.json
packages/evidence/tsconfig.lib.json
packages/evidence/src/contracts.ts
packages/evidence/src/evidence-service.ts
packages/evidence/src/problems.ts
packages/evidence/src/index.ts
packages/evidence/src/evidence-service.test.ts

packages/canonical-schema/src/migrations/0001-foundation-baseline.ts

packages/bootstrap-runtime/src/h2a3-execution-foundation.integration.test.ts
```

A test-only fixture helper under `packages/bootstrap-runtime/src/test-support/` may be created **only if needed to reuse existing canonical/PostgreSQL setup without duplication**; it must not be exported by the package root.

```text

docs/plans/active/foundation/h2a3-canonical-execution-context-time-lineage.md
```

If the existing workspace generator/pattern does not use one of the listed `tsconfig.*` files, follow the existing package skeleton exactly rather than introducing a new repository convention.

---

# 5. Task sequence

The tasks below are deliberately coarse enough to preserve development velocity. Each task ends in a coherent, independently reviewable behavior increment. Do not split them into new milestone branches.

---

# Task 0 — Preflight, active-plan registration, roadmap truth alignment

**Purpose:** bind work to current master, make the plan authoritative for this branch, and remove the known stale roadmap metadata before behavior changes.

**Files:**

- Create: `docs/plans/active/foundation/h2a3-canonical-execution-context-time-lineage.md`
- Modify: `docs/plans/README.md`
- Modify: `docs/roadmap/development-roadmap.md`
- Modify Corpus manifest/checksums only if roadmap is represented there by current repository tooling; do not modify Corpus semantics for a roadmap-only edit.

### Interface produced

```text
one active H2A-3 plan
one exact base SHA
one Draft PR branch
roadmap accurately describing current H2A execution order
```

- [x] **0.1 Verify the exact baseline and clean tree**

```bash
git fetch --no-tags origin master
git status --short
git rev-parse origin/master
```

Expected:

```text
working tree clean
origin/master = 446d0f6bce449f177c66fb569341020757b44c9b
```

If master differs, **STOP**. Report the new SHA and `git log --oneline 446d0f6..origin/master`. Do not silently rebase this plan or decide that new commits are irrelevant.

- [x] **0.2 Verify the baseline**

```bash
git switch master
git reset --hard origin/master
pnpm install --frozen-lockfile
pnpm verify
```

Expected: `pnpm verify` PASS.

If baseline verification fails, classify and report it before H2A-3 changes. Do not absorb an unrelated baseline failure into this milestone.

- [x] **0.3 Create the branch**

```bash
git switch -c dev/h2a3-canonical-execution-context-time-lineage
```

- [x] **0.4 Register this exact plan**

Copy this document verbatim to:

```text
docs/plans/active/foundation/h2a3-canonical-execution-context-time-lineage.md
```

Change `docs/plans/README.md` Active section to:

```markdown
## Active

- [H2A-3 Canonical Execution Context, Time & Lineage Foundation](active/foundation/h2a3-canonical-execution-context-time-lineage.md) — `ACTIVE`
```

Do not edit completed H2A-1/H2A-2 historical plan records.

- [x] **0.5 Correct the living roadmap**

Update the roadmap header baseline from the stale H2A-1 baseline to:

```text
master@446d0f6bce449f177c66fb569341020757b44c9b
(H2A-2 post-merge truth reconciliation)
```

Keep H2A OPEN.

Clarify the H2A storage bullet to the following semantics:

```text
scoped storage primitives are pulled into H2A only if a concrete H2A Foundation owner requires them;
otherwise StorageWorkspace implementation waits for its first real consumer.
```

Keep S17 architecture intact; this is implementation ordering, not a rejection of StorageWorkspace.

Keep:

```text
H2B: ELIGIBLE_BY_H1_BUT_IMPLEMENTATION_DEFERRED_PENDING_EXECUTION_CONTEXT_SPINE
```

until H2A-3 is functionally complete.

- [x] **0.6 Run doc/repository gates and commit**

```bash
pnpm check:corpus
pnpm check:repository
pnpm format:check
git add docs/plans docs/roadmap Architecture_Corpus/manifest.json Architecture_Corpus/SHA256SUMS.txt
git commit -m "docs: activate H2A3 execution context plan"
```

Only add manifest/checksum files if repository tooling changed them.

Open one Draft PR. Ordinary pushes do not dispatch final CI.

---

# Task 1 — Canonical primitives, SchemaRuntime, and TimeService

**Purpose:** establish the reusable value/validation/time contracts before execution lineage depends on them.

**Files:**

- Modify `packages/foundation-contracts/src/identity.ts`
- Modify `packages/foundation-contracts/src/index.ts`
- Modify `packages/bootstrap-state/src/journal.ts`
- Create all `packages/schema-runtime/*`
- Create all `packages/time-service/*`
- Modify `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- Modify `scripts/verify/boundaries.mjs`

### Interfaces produced

The exact contracts are fixed by DL-02, DL-03, and DL-04.

### Required tests before implementation

Create tests proving at minimum:

```ts
it("parses only canonical millisecond UTC Instants", () => {
  expect(parseInstant("2026-08-24T15:00:00.123Z")).toBeDefined();
  expect(parseInstant("2026-08-24T15:00:00Z")).toBeUndefined();
  expect(parseInstant("2026-08-24T23:00:00.123+08:00")).toBeUndefined();
});

it("formats Date to the canonical Instant contract", () => {
  expect(formatInstant(new Date("2026-08-24T15:00:00.123Z"))).toBe(
    "2026-08-24T15:00:00.123Z",
  );
});

it("SchemaRuntime does not mutate, coerce, default, or remove fields", () => {
  const schema = Type.Object(
    { count: Type.Number() },
    { additionalProperties: false },
  );
  const validator = compileSchema<{ count: number }>(schema);
  const input = { count: "1", extra: true };
  const before = structuredClone(input);
  const result = validator.validate(input);
  expect(result.ok).toBe(false);
  expect(input).toEqual(before);
});

it("returns the same object identity after successful validation", () => {
  const schema = Type.Object({ count: Type.Number() });
  const validator = compileSchema<{ count: number }>(schema);
  const input = { count: 1 };
  const result = validator.validate(input);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe(input);
});

it("monotonic elapsed is independent from a backwards wall-clock jump", () => {
  const time = createFakeTimeService(parseInstant("2026-08-24T15:00:00.000Z")!);
  const start = time.monotonicNow();
  time.advanceMonotonic(2_000_000_000n);
  time.advanceWallClock(-60_000);
  expect(time.elapsedSince(start)).toBe(2_000_000_000n);
});

it("validates IANA timezone identifiers without inventing scheduling semantics", () => {
  expect(parseTimeZoneId("Asia/Shanghai")).toBeDefined();
  expect(parseTimeZoneId("America/Los_Angeles")).toBeDefined();
  expect(parseTimeZoneId("Mars/Olympus_Mons")).toBeUndefined();
});
```

Use the real project import paths; the snippets show required behavior.

### Implementation steps

- [x] **1.1 Add `ActivityId`, `EvidenceId`, `Instant`, `RetentionClass`, and `Sensitivity` primitives** exactly as DL-02 specifies; place the two cross-cutting governance unions in `foundation-contracts/src/data-governance.ts` and export them from the package root.
- [x] **1.2 Make `BootstrapActivityId` an alias of `ActivityId`** without changing the journal file format or making bootstrap depend on new normal-runtime packages.
- [x] **1.3 Add `@opentelemetry/api: 1.9.1` to the strict pnpm Catalog**. Do not add an OTel SDK package.
- [x] **1.4 Create `@heptalogos/schema-runtime`** with fixed `Ajv2020` profile, normalized Heptalogos validation issues, and `package.json` exports for exactly `.` and `./typebox` as specified by DL-04.
- [x] **1.5 Create `@heptalogos/time-service`** with system/fake implementations and IANA timezone validation.
- [x] **1.6 Extend boundary enforcement**:

Required restricted-import semantics:

```text
direct "ajv"
→ packages/schema-runtime/**
→ exactly the five frozen Bootstrap files listed in DL-04

direct "typebox"
→ packages/schema-runtime/**
→ exactly the five frozen Bootstrap files listed in DL-04

@heptalogos/schema-runtime/typebox
→ normal Foundation schema-definition packages allowed
```

Do not broaden the five-file Bootstrap exception set. If implementation discovers another existing baseline direct import that the plan missed, STOP and report the exact file rather than silently extending the allowlist.

- [x] **1.7 Run focused gates**

```bash
pnpm exec vitest run --root packages/foundation-contracts
pnpm exec vitest run --root packages/schema-runtime
pnpm exec vitest run --root packages/time-service
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

Expected: PASS.

- [x] **1.8 Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml scripts/verify/boundaries.mjs \
  packages/foundation-contracts packages/bootstrap-state/src/journal.ts \
  packages/schema-runtime packages/time-service
git commit -m "feat: establish H2A3 time and schema runtime contracts"
```

---

# Task 2 — ExecutionContext runtime, Activity semantics, OTel correlation, and durable causal refs

**Purpose:** build the normal process-memory execution spine independently of database retention.

**Files:**

- Create `packages/execution-lineage/package.json`
- Create `packages/execution-lineage/project.json`
- Create `packages/execution-lineage/tsconfig*.json` following repository pattern
- Create:
  - `src/contracts.ts`
  - `src/execution-context-runtime.ts`
  - `src/lineage-context-ref.ts`
  - `src/suppression.ts`
  - `src/problems.ts`
  - `src/index.ts`
  - unit tests
- Modify `scripts/verify/boundaries.mjs`

### Interfaces consumed

```text
ActivityId / Instant / RetentionClass / Sensitivity / host identities from foundation-contracts
TimeService from @heptalogos/time-service
SchemaRuntime + TypeBox authoring bridge
The persistence adapter is intentionally NOT part of Task 2. Task 3 creates it only after PersistenceExecutionContextProvider exists. Do not invent a temporary duplicate provider interface.
```

### Required unit scenarios

Implement tests equivalent to:

```ts
it("isolates concurrent root Activities", async () => {
  const [a, b] = await Promise.all([
    runtime.runActivity(ROOT_REQUEST, async () => {
      await Promise.resolve();
      return runtime.current()!.activityId;
    }),
    runtime.runActivity(ROOT_REQUEST, async () => {
      await Promise.resolve();
      return runtime.current()!.activityId;
    }),
  ]);
  expect(a).not.toBe(b);
  expect(runtime.current()).toBeUndefined();
});

it("makes a nested synchronous/async Activity a child without forging causation", async () => {
  await runtime.runActivity(ROOT_REQUEST, async (parent) => {
    await runtime.runActivity(CHILD_REQUEST, async (child) => {
      expect(child.parentActivityId).toBe(parent.activityId);
      expect(child.causationActivityId).toBeUndefined();
    });
  });
});

it("propagates through Promise and timer boundaries", async () => {
  await runtime.runActivity(ROOT_REQUEST, async (root) => {
    await Promise.resolve();
    expect(runtime.current()!.activityId).toBe(root.activityId);
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(runtime.current()!.activityId).toBe(root.activityId);
        resolve();
      }, 0),
    );
  });
});

it("captured callbacks restore the captured context and do not leak afterward", async () => {
  let captured!: () => ActivityId | undefined;
  await runtime.runActivity(ROOT_REQUEST, async (root) => {
    captured = runtime.capture(() => runtime.current()?.activityId);
    expect(captured()).toBe(root.activityId);
  });
  expect(runtime.current()).toBeUndefined();
  expect(captured()).toBeDefined();
  expect(runtime.current()).toBeUndefined();
});

it("does not allow request data to override trusted Host origin", async () => {
  await runtime.runActivity(ROOT_REQUEST, async (context) => {
    expect(context.origin).toEqual(TRUSTED_ORIGIN);
    expect(Object.isFrozen(context.origin)).toBe(true);
  });
});

it("creates a minimal durable causal ref without BootId or HostOwnershipToken", async () => {
  await runtime.runActivity(ROOT_REQUEST, async (context) => {
    const ref = runtime.createLineageContextRef();
    expect(ref.sourceActivityId).toBe(context.activityId);
    expect(ref.sourceInstanceId).toBe(TRUSTED_ORIGIN.instanceId);
    expect(ref.sourceContinuityEpochId).toBe(TRUSTED_ORIGIN.continuityEpochId);
    expect(ref).not.toHaveProperty("bootId");
    expect(ref).not.toHaveProperty("hostOwnershipToken");
  });
});

it("resumes with current Host origin and old Activity only as causation", async () => {
  const ref = VALID_REF_FROM_PRIOR_BOOT;
  await runtime.runFromLineageContextRef(ref, ROOT_REQUEST, async (context) => {
    expect(context.origin).toEqual(CURRENT_HOST_ORIGIN);
    expect(context.causationActivityId).toBe(ref.sourceActivityId);
  });
});

it("rejects a ref from another Instance or ContinuityEpoch", async () => {
  await expect(
    runtime.runFromLineageContextRef(OTHER_EPOCH_REF, ROOT_REQUEST, async () => undefined),
  ).rejects.toMatchObject({
    problem: { problemCode: "lineage.context_ref.discontinuity" },
  });
});

it("rejects future or obsolete PRE_PRODUCTION LineageContextRef shapes", () => {
  expect(() => decodeLineageContextRef({ schemaVersion: 2 })).toThrow();
  expect(() => decodeLineageContextRef({ schemaVersion: 1, legacyBootId: "x" })).toThrow();
});
```

Add an OTel API-only projection test without installing a ContextManager/SDK: construct an explicit OTel `Context` from `ROOT_CONTEXT` with `trace.setSpanContext(...)`, pass it through an **internal test seam/helper** that uses the same projection logic as the runtime, and prove the valid span context maps to `ExecutionContext.telemetry`. Separately prove that the normal runtime works with the default root/no-span OTel context. Do not claim global OTel async propagation is qualified until an actual ContextManager/SDK exists in the later observability composition.

### Implementation steps

- [x] **2.1 Implement Activity/ExecutionContext contracts** exactly within DL-05 through DL-08.
- [x] **2.2 Implement one ALS-based runtime**; use `AsyncLocalStorage.run`, never `enterWith` for normal Activity scopes.
- [x] **2.3 Capture OTel correlation** from active OpenTelemetry Context if a valid span is present. Do not derive ActivityId from trace/span IDs.
- [x] **2.4 Implement `capture()`** by capturing the current Heptalogos context and current OTel Context and restoring both only for the callback scope.
- [x] **2.5 Implement SchemaRuntime-backed `LineageContextRef V1` encode/decode** and continuity checks.
- [x] **2.6 Implement internal suppression scope**; do not export it from package root.
- [x] **2.7 Add package-root leakage checks** so `AsyncLocalStorage`, OTel SDK/provider objects, Ajv objects, and Kysely objects are not exported as stable execution-lineage contracts.
- [x] **2.8 Run focused gates**

```bash
pnpm exec vitest run --root packages/execution-lineage --exclude '**/*.integration.test.ts'
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

Expected: PASS.

- [x] **2.9 Commit**

```bash
git add packages/execution-lineage scripts/verify/boundaries.mjs
git commit -m "feat: add H2A3 execution context and causal propagation"
```

---

# Task 3 — Bind Persistence mutation admission to current ExecutionContext and expose the restricted repository seam

**Purpose:** make causal identity mechanically present at every normal canonical mutation while preserving H2A-1 Host/database Authority.

**Files:**

- Modify `packages/persistence/package.json`
- Modify `packages/persistence/src/contracts.ts`
- Modify `packages/persistence/src/transaction-context.ts`
- Modify `packages/persistence/src/persistence-service.ts`
- Modify `packages/persistence/src/problems.ts`
- Modify `packages/persistence/src/index.ts`
- Create `packages/persistence/src/foundation-repository.ts`
- Modify persistence unit/integration tests
- Modify `packages/execution-lineage/package.json` to add `@heptalogos/persistence` only when the adapter is introduced
- Create `packages/execution-lineage/src/persistence-adapter.ts`
- Modify `scripts/verify/boundaries.mjs`

### Public interfaces produced

Use DL-09 through DL-11 exactly.

Add `package.json` export:

```json
"./foundation-repository": {
  "types": "./dist/foundation-repository.d.ts",
  "import": "./dist/foundation-repository.js",
  "default": "./dist/foundation-repository.js"
}
```

Do not star-export this subpath through `src/index.ts`.

### Required tests

Add tests equivalent to:

```ts
it("rejects mutation without ambient execution metadata", async () => {
  const service = createPersistenceServiceForTests(
    authority,
    options,
    { current: () => undefined },
    database,
  );
  await expect(service.mutate(async () => undefined)).rejects.toMatchObject({
    problem: { problemCode: "persistence.execution_context.required" },
  });
});

it("rejects stale Boot/token/continuity execution origin before domain mutation", async () => {
  const service = createPersistenceServiceForTests(
    authority,
    options,
    { current: () => STALE_EXECUTION_METADATA },
    database,
  );
  await expect(service.mutate(async () => undefined)).rejects.toMatchObject({
    problem: { problemCode: "persistence.execution_context.stale_origin" },
  });
});

it("still requires the database Host fence even with matching execution metadata", async () => {
  // Matching metadata + stale DB fence must fail with the existing stale-owner/fence Problem.
});

it("issues a mutation context containing the admitted execution snapshot", async () => {
  await service.mutate(async (tx) => {
    expect(tx.mode).toBe("MUTATION");
    expect(tx.execution).toEqual(CURRENT_EXECUTION_METADATA);
  });
});

it("read remains usable without an ambient execution context", async () => {
  await expect(service.read(async (tx) => tx.mode)).resolves.toBe("READ");
});

it("foundation repository seam rejects a read, fake, or released context", async () => {
  // Assert all three fail with the existing/extended transaction-context Problem family.
});
```

Add an integration scenario using real PostgreSQL proving:

```text
old Host Activity captured
→ ownership transferred/new token published
→ old callback resumes
→ mutation is rejected
```

The existing DB fence remains the final Authority proof. The test must show both layers are preserved, not replace the H2A-1 fence with an in-memory check.

### Implementation sequence

- [x] **3.1 Introduce discriminated read/mutation transaction context types**.
- [x] **3.2 Change `PersistenceService` constructors to the exact DL-09 signatures** and update all existing call sites/tests explicitly; do not retain an overload with the old context-free mutation signature.
- [x] **3.3 Capture execution metadata at transaction admission**. For mutation, require it and compare all five origin fields to `HostPersistenceAuthority`.
- [x] **3.4 Preserve existing H2A-1 ordering** inside the mutating transaction:

```text
assert service/Host active
→ require current execution metadata and compare current authority identity
→ open DB transaction
→ verify Host fence under lock
→ assert Host active again
→ issue opaque MutationTransactionContext with captured execution metadata
→ operation
→ commit
```

Do not remove or weaken any existing fence/lifecycle check.

- [x] **3.5 Add `foundation-repository` callback seam** over genuine WeakMap-issued transactions.
- [x] **3.6 Mechanically restrict the subpath** using the DL-11 full-specifier verifier layer to execution-lineage/evidence/persistence test code. Raw Kysely remains forbidden in ordinary package roots and unrelated packages.
- [x] **3.7 Add `execution-lineage` provider adapter**:

```ts
export function createPersistenceExecutionContextProvider(
  runtime: ExecutionContextRuntime,
): PersistenceExecutionContextProvider;
```

It returns `undefined` when no Activity is current and otherwise maps only the fields in `PersistenceExecutionMetadata`.

- [x] **3.8 Run regression gates**

```bash
pnpm exec vitest run --root packages/persistence --exclude '**/*.integration.test.ts'
pnpm exec vitest run --root packages/execution-lineage --exclude '**/*.integration.test.ts'
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

Then run the existing real PostgreSQL persistence integration target using the same repository procedure used by H2A-1. Expected: all prior H2A-1 scenarios PASS plus new execution-admission scenarios PASS.

- [x] **3.9 Commit**

```bash
git add packages/persistence packages/execution-lineage/src/persistence-adapter.ts \
  scripts/verify/boundaries.mjs
git commit -m "feat: bind canonical mutations to current execution context"
```

---

# Task 4 — Rewrite the current canonical baseline and add retained Activity/Evidence repositories

**Purpose:** establish the minimum durable records and same-transaction mechanics required by H2A without inventing a complete observability product.

**Files:**

- Rename/rewrite canonical baseline migration
- Modify migration provider/pool typing
- Extend `packages/bootstrap-runtime/src/canonical-initialization.integration.test.ts` for fresh-schema/grant qualification
- Create `execution-lineage/src/activity-repository.ts`
- Create `packages/evidence/*`
- Modify `scripts/verify/boundaries.mjs`

### Interfaces consumed

```text
PersistenceMutationTransactionContext
@heptalogos/persistence/foundation-repository
TimeService
ExecutionContext
ActivityId/EvidenceId/Instant/RetentionClass/Sensitivity
```

### Required canonical-schema tests

On a fresh database, prove:

```text
migration name = 0001_foundation_baseline
instance_continuity exists with existing semantics
activity_record exists with exact required columns/constraints
activity_link table exists with source FK but no target FK
evidence_record has FK to activity_record
runtime role grants match DL-14
runtime role has no DELETE/DDL authority
migration role remains distinct
```

Add a PRE_PRODUCTION rejection fixture showing a database with old `0001_foundation_continuity` migration metadata is not silently upgraded to the new baseline. Expected result: canonical initialization fails/reset-required; no compatibility code is added.

### Required repository tests

Execution-lineage integration:

```ts
it("retains only the current transaction Activity and its links", async () => {
  // After commit, one activity row and expected link rows exist.
});

it("rejects a context whose ActivityId or trusted origin differs from the mutation transaction", async () => {
  // Expect the fixed lineage.persistence.* Problems from DL-12.
});

it("does not require parent/causation Activities themselves to be retained", async () => {
  // Insert a retained current child referring to non-retained UUIDs; commit succeeds.
});

it("imports only the bounded Bootstrap summary form and makes exact replay idempotent", async () => {
  // Fixed kind/retention/sensitivity, NULL Host token; exact replay succeeds/no-ops.
});

it("rejects Bootstrap same-id drift and duplicate retainCurrent", async () => {
  // Expect lineage.bootstrap_reference.conflict / lineage.persistence.activity_already_retained.
});
```

Evidence integration:

```ts
it("derives required Evidence activityId from the mutation transaction", async () => {
  // Caller does not supply an ActivityId; stored evidence matches tx.execution.activityId.
});

it("cannot insert Evidence without a retained Activity", async () => {
  // FK violation is translated to a stable evidence persistence Problem.
});

it("rejects empty kind/version/reference and ephemeral required retention", async () => {
  // Assert the fixed evidence.* Problems from DL-12.
});

it("stores references only and exposes no arbitrary payload field", () => {
  // Compile-time/public-contract assertion or source boundary test.
});
```

### Implementation sequence

- [x] **4.1 Rename and rewrite migration key/file** to `0001_foundation_baseline`. Do not retain the old migration as a second entry.
- [x] **4.2 Add Activity/Link/Evidence tables and least-privilege grants** exactly as DL-14.
- [x] **4.3 Update `CanonicalDatabase` typing** so migration code reflects the current baseline. Do not expose this migration typing as a normal runtime repository API.
- [x] **4.4 Implement `ExecutionLineageService.retainCurrent` and `retainBootstrapReference`** using the restricted persistence repository seam. Enforce the exact transaction/origin checks and fixed Problems from DL-12. Do not add a generic Activity import or completion updater.
- [x] **4.5 Implement `EvidenceService.recordRequired`**. Inject `TimeService`; create `EvidenceId`; derive ActivityId from transaction; insert only the bounded fields in DL-12.
- [x] **4.6 Add boundary checks** so execution-lineage/evidence package roots do not export Kysely/pg objects and only approved repository source files can import `@heptalogos/persistence/foundation-repository`.
- [x] **4.7 Extend the existing `bootstrap-runtime` canonical initialization integration** to assert the rewritten migration name, new tables/CHECKs/FKs, and least-privilege grants after a fresh H2A-2-style bootstrap/canonical initialization. Reuse its existing `HEPTALOGOS_TEST_PG_BIN` process fixture; do not create another PG launcher in `canonical-schema`.
- [x] **4.8 Run focused gates**

```bash
pnpm exec vitest run --root packages/canonical-schema --exclude '**/*.integration.test.ts'
pnpm exec vitest run --root packages/execution-lineage --exclude '**/*.integration.test.ts'
pnpm exec vitest run --root packages/evidence --exclude '**/*.integration.test.ts'
pnpm check:dependencies
pnpm check:boundaries
pnpm typecheck
pnpm tsc6
```

Then, when an actual PostgreSQL 18.x toolchain path is available, run the existing Bootstrap integration target containing `canonical-initialization.integration.test.ts` with `HEPTALOGOS_TEST_PG_BIN=<postgres-bin-directory>`. Expected when actually exercised: PASS. If no toolchain is available, record this real-PG property as `NOT_RUN`; a skipped/non-executed suite is never PASS.

- [x] **4.9 Commit**

```bash
git add packages/canonical-schema packages/execution-lineage packages/evidence \
  packages/bootstrap-runtime/src/canonical-initialization.integration.test.ts \
  scripts/verify/boundaries.mjs
git commit -m "feat: add retained activity and evidence foundation"
```

---

# Task 5 — Prove required Activity/Evidence atomicity with canonical mutation

**Purpose:** close the core H2A transaction invariant with real PostgreSQL, without introducing a fake production domain.

**Files:**

- Modify `packages/bootstrap-runtime/package.json` to add the DL-20 test-only workspace devDependencies.
- Modify `packages/bootstrap-runtime/project.json` so its explicit `test:integration` target includes `src/h2a3-execution-foundation.integration.test.ts`.
- Create `packages/bootstrap-runtime/src/h2a3-execution-foundation.integration.test.ts`.
- Optionally extract existing canonical/PostgreSQL fixture setup to a non-exported `packages/bootstrap-runtime/src/test-support/*` helper only to avoid code duplication.
- Do not modify the canonical migration to add the test fixture.

### Fixed fixture semantics

In test setup, under the test-owned database/schema, create:

```sql
CREATE TABLE heptalogos.h2a3_atomicity_fixture (
  fact_id uuid PRIMARY KEY,
  value text NOT NULL
);
GRANT SELECT, INSERT ON heptalogos.h2a3_atomicity_fixture TO heptalogos_runtime;
```

Drop it in test teardown. This table must not enter production migration/source.

### Required scenarios

Use a real `ExecutionContextRuntime`, its persistence provider adapter, real `PersistenceService`, `ExecutionLineageService`, and `EvidenceService`.

#### A1 — successful atomic commit

Inside one `PersistenceService.mutate` callback:

```text
insert fixture canonical fact
retain current Activity
record required Evidence
return success
```

After commit:

```text
fixture fact = present
activity_record = present
evidence_record = present
same ActivityId links tx.execution and evidence
```

#### A2 — failure after all writes

Inside the same transaction perform all three writes, then throw a sentinel error.

After rollback:

```text
fixture fact = absent
activity_record = absent
evidence_record = absent
```

#### A3 — required Evidence failure blocks canonical commit

After the fixture insert and `retainCurrent` have already executed, call `EvidenceService.recordRequired` with `evidenceKind: ""`. The fixed `evidence.invalid_kind` validation failure must escape the callback and roll back the already-issued SQL writes.

After transaction failure:

```text
fixture fact = absent
activity_record = absent
evidence_record = absent
```

Do not simulate this with a mocked repository. The EvidenceService validation failure occurs inside the real `PersistenceService.mutate` callback after earlier PostgreSQL writes, so the real transaction rollback is what removes them.

#### A4 — read-only transaction cannot obtain write repository capability

Pass a real `PersistenceReadTransactionContext` to the Foundation mutation repository helper or Evidence/Lineage write method. Expected stable rejection before any write.

#### A5 — no slow work is introduced inside transaction

The integration code must contain no timer wait, network call, subprocess call, model call, or user-wait simulation inside the transaction. Add a source-level/architectural assertion only if the existing verifier has a natural mechanism; do not build a general static effect system in H2A-3.

### Execution steps

- [x] **5.1 Add the DL-20 devDependencies and test target entry, then write A1-A5 failing scenarios in `h2a3-execution-foundation.integration.test.ts`**.
- [x] **5.2 Run the explicit Bootstrap integration target with `HEPTALOGOS_TEST_PG_BIN` and verify the new A1-A5 scenarios fail for the expected missing behavior, while existing integration scenarios remain green**.
- [x] **5.3 Implement only missing transaction/repository behavior needed by the fixed design**. If a failure implies a new generic transaction API or domain owner, STOP and report instead of expanding scope.
- [x] **5.4 Run A1-A5 to PASS**.
- [x] **5.5 Re-run H2A-1 persistence integration regression** to prove no loss of Host-fence behavior.
- [x] **5.6 Commit**

```bash
git add packages/bootstrap-runtime packages/execution-lineage packages/evidence packages/persistence
git commit -m "test: prove H2A3 lineage evidence transaction atomicity"
```

---

# Task 6 — Bootstrap → normal execution lineage handoff

**Purpose:** connect Early Observability to the normal Activity graph without making Bootstrap Closure depend on the normal lineage runtime.

**Files:**

- Modify `packages/bootstrap-state/src/journal.ts` only as needed for the `ActivityId` alias/type convergence.
- Create `packages/execution-lineage/src/bootstrap-handoff.ts` and `bootstrap-handoff.test.ts` for the pure bounded journal-summary projection.
- Extend the existing `packages/bootstrap-runtime/src/h2a3-execution-foundation.integration.test.ts` with B1-B6 composition scenarios.
- Modify normal composition/test helpers, not bootstrap production orchestration, unless an existing clean injection seam already owns post-Host normal startup.
- Do not add a production `bootstrap-runtime -> execution-lineage` dependency; the bootstrap-runtime dependency remains dev/test-only under DL-20.

### Fixed semantic projection

For a successful bootstrap sequence, construct one retained Activity record representing the bootstrap execution from the existing journal:

```text
activityId          = existing bootstrapActivityId
kind                = bootstrap.handoff
startedAt           = earliest checkpoint Instant for that Activity
endedAt             = latest terminal/successful handoff checkpoint Instant
origin.instance     = journal/bootstrap InstanceId
origin.installation = journal/bootstrap InstallationId
origin.boot          = journal BootId
origin.continuity    = current BootstrapState/canonical ContinuityEpochId
host token           = null for the bootstrap Activity summary
importance          = significant
retention            = retained
sensitivity          = operational
```

Do not invent a Host token for the bootstrap Activity.

Then create the first normal Host Activity through the current `ExecutionContextRuntime`:

```text
new ActivityId
current Host origin including current HostOwnershipToken
causationActivityId = bootstrapActivityId
```

Inside that first normal Activity's `PersistenceService.mutate` callback, use one transaction to:

```text
retainBootstrapReference(bootstrap summary)
→ retainCurrent(first normal Host Activity)
```

The historical Bootstrap row may be inserted before the current row because causation is intentionally not an FK. The mutation itself is still admitted by the **current** normal Host Activity/Host fence; the historical bootstrap record grants no Authority.

### Required integration scenarios

```text
B1 normal bootstrap journal identity is a valid ActivityId
B2 bounded journal summary becomes one retained bootstrap Activity
B3 first normal Activity uses current Host origin and causation to bootstrap Activity
B4 bootstrap journal remains unchanged after import/reference
B5 the pure journal-summary projector represents failed/incomplete journal input as bounded failure/incomplete evidence and never silently marks it success; persistence of a failed historical boot is not made a normal-bootstrap prerequisite in H2A-3
B6 normal lineage unavailable must not make BootstrapJournal unreadable or rewrite Bootstrap ownership semantics
```

The test may use real PostgreSQL because retained Activity persistence is being proven. It must not require OTel SDK/exporters.

### Execution steps

- [x] **6.1 Write pure projector unit tests for successful, failed, and incomplete BootstrapJournal input, then implement only the bounded summary projection in `execution-lineage/bootstrap-handoff.ts`**.
- [x] **6.2 Extend the already-registered H2A-3 Bootstrap integration suite with B1-B6 using the same real-PostgreSQL/Host fixture from Task 5**.
- [x] **6.3 Prove the first current-Host Activity is caused by the existing bootstrap Activity and that BootstrapJournal bytes remain unchanged**.
- [x] **6.4 Run bootstrap-state, bootstrap-runtime, host-ownership, persistence, canonical-schema, execution-lineage regressions**.
- [x] **6.5 Commit**

```bash
git add packages/bootstrap-state packages/bootstrap-runtime packages/execution-lineage
git commit -m "feat: connect bootstrap activity to normal execution lineage"
```

---

# Task 7 — Mechanical boundaries, local qualification, evidence truth, and review candidate freeze

**Purpose:** finish the implementation candidate without claiming external review/CI/merge that has not happened.

**Files:**

- `scripts/verify/boundaries.mjs`
- dependency/catalog files if diagnostics reveal missing declared routes
- `Architecture_Corpus/qualification/results/Q-PERSISTENCE-01.md`
- `Architecture_Corpus/qualification/results/qualification-status.json`
- `Architecture_Corpus/manifest.json`
- `Architecture_Corpus/SHA256SUMS.txt`
- active H2A-3 plan evidence section
- `docs/roadmap/development-roadmap.md`

### Mandatory boundary assertions

The verifier must mechanically prove at least:

```text
raw ajv imports
→ schema-runtime + exactly the five DL-04 Bootstrap exceptions

raw typebox imports
→ schema-runtime + exactly the five DL-04 Bootstrap exceptions

@opentelemetry/api
→ execution-lineage/observability adapter code only for H2A-3

@heptalogos/persistence/foundation-repository
→ execution-lineage + evidence + persistence tests only

raw kysely/pg
→ existing persistence/canonical-schema/host adapter zones only

persistence package root
→ no Kysely/pg/OTel/execution-lineage objects

execution-lineage package root
→ no AsyncLocalStorage instance, raw OTel provider/tracer, Kysely/pg objects,
  suppression primitive, or repository transaction object

evidence package root
→ no Kysely/pg object and no arbitrary generic evidence payload contract
```

### Required local qualification matrix

Run and record exact results for:

```text
T1  canonical Instant parsing/formatting
T2  SchemaRuntime non-mutation and unknown-field rejection
T3  wall-clock jump vs monotonic elapsed
T4  fake time deterministic control
T5  concurrent root Activity isolation
T6  nested parent semantics
T7  Promise/timer propagation
T8  captured callback restore/release
T9  trusted Host origin cannot be overridden
T10 OTel API correlation projection without installing/claiming a global ContextManager
T11 LineageContextRef V1 validation and non-mutation
T12 LineageContextRef rejects future/obsolete shapes
T13 resume uses new Host origin and old Activity as causation only
T14 mutation requires current ExecutionContext
T15 stale execution origin rejected
T16 matching execution identity cannot bypass stale DB Host fence
T17 read-only context cannot use write repository seam
T18 canonical clean baseline creates Activity/Evidence schema
T19 obsolete PRE_PRODUCTION migration history is not upgraded
T20 required Activity/Evidence/canonical mutation atomic success
T21 rollback removes all three
T22 required Evidence failure blocks canonical fact commit
T23 BootstrapActivityId → retained bootstrap Activity → current Host Activity causation
T24 framework/raw mechanics do not leak package roots
T25 existing H1/H2A-1/H2A-2 regressions
T26 full pnpm verify
```

### `Q-PERSISTENCE-01` update rule

Add only these genuinely persistence-coupled observed properties, using exact field naming consistent with the current JSON style:

```text
current_execution_context_required_for_mutation = PASS
stale_execution_origin_unit = PASS
stale_execution_origin_real_postgres = PASS
stale_database_host_fence_real_postgres = PASS
required_lineage_evidence_atomicity = PASS
read_context_cannot_obtain_mutation_repository = PASS
```

Do not change residual Linux/macOS/source-less/service qualification from `NOT_RUN` unless those exact product scenarios were actually run. `Q-PERSISTENCE-01` remains `PARTIAL` while required L3 properties remain not run.

Do not create a new Lineage qualification ID.

### Roadmap status before external closure

After local implementation qualification passes, update current progress truth to:

```text
H2A_1: CLOSED
H2A_2: CLOSED
H2A_3: CLOSED
H2A: FUNCTIONALLY_COMPLETE
H2B: IMPLEMENTATION_COMPLETE_AWAITING_REVIEW
H2_FUNCTIONAL: COMPLETE_PENDING_H2B_CLOSURE
H2_STABILIZATION: NOT_STARTED
H2: OPEN
```

H2A-3 is closed as an implementation milestone; H2A stabilization/closure
remains a later bounded joint review and is not pre-claimed here.

### Full local gate

- [x] **7.1 Run every focused test/integration target** and record counts/status in this plan.
- [x] **7.2 Run Corpus/repository/dependency/boundary gates**:

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check
```

- [x] **7.3 Run full verification**

```bash
pnpm verify
```

Expected: PASS.

- [x] **7.4 Inspect working tree and branch diff**

```bash
git status --short
git diff --check
git diff origin/master...HEAD --stat
git log --oneline --decorate origin/master..HEAD
```

No untracked/generated accidental files.

- [x] **7.5 Commit final local evidence/truth only after tests actually passed**

Example commit:

```bash
git add Architecture_Corpus docs scripts packages pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "docs: record H2A3 local qualification"
```

- [x] **7.6 Re-run `pnpm verify` after the evidence commit**.

- [x] **7.7 Freeze exact review candidate pair**

```bash
BASE_SHA="$(git rev-parse origin/master)"
HEAD_SHA="$(git rev-parse HEAD)"
printf 'BASE=%s\nHEAD=%s\n' "$BASE_SHA" "$HEAD_SHA"
```

Record these values in the active plan.

No code/docs commit may be added after external Independent Review begins without invalidating that review pair.

---

# 6. External Independent Review gate

Independent Review is external/out-of-band. The implementing Agent must not query GitHub review/approval/comment objects to infer it.

Reviewer scope must include the exact `(BASE_SHA, HEAD_SHA)` diff and focus on:

```text
R1 no persistence ↔ execution-lineage dependency cycle
R2 current execution identity is not mistaken for Authority
R3 H2A-1 Host fence remains authoritative and unchanged in strength
R4 LineageContextRef cannot replay Boot/token authority
R5 Activity != OTel Span
R6 Evidence != telemetry/log
R7 required Activity/Evidence atomicity is real PostgreSQL evidence
R8 PRE_PRODUCTION baseline is rewritten, not upgraded
R9 retained parent/causation refs do not require all Activities to be durable
R10 bootstrap early observability remains independent
R11 framework/raw persistence/OTel/schema mechanics are contained
R12 H2A scope did not absorb H2B/H3/Storage/Management work
```

The only accepted review states for branch progression are the repository’s external review semantics. If the user/operator reports `REQUEST_CHANGES`, make corrections, rerun local gates, freeze a new exact pair, and obtain a new external review. Do not reuse prior review evidence.

---

# 7. Manual exact-pair final CI

Only after external Independent Review PASS on the current exact pair:

1. verify `origin/master` still equals the reviewed `BASE_SHA`;
2. verify branch HEAD still equals reviewed `HEAD_SHA`;
3. dispatch the repository’s manual final CI workflow for that exact pair using the existing milestone closure procedure;
4. require Ubuntu, macOS, and Windows repository CI lanes to PASS;
5. do not interpret repository CI as proof of live PostgreSQL on an OS unless the workflow actually starts and tests PostgreSQL there.

Any base/head drift invalidates both review and final CI.

H2A-3 does not require new Linux/macOS real private PostgreSQL L3 qualification merely because the code is cross-platform TypeScript. Existing product-level `NOT_RUN` claims remain truthful.

---

# 8. Squash merge and post-merge truth

After exact-pair review PASS and exact-pair final CI PASS:

- squash merge the H2A-3 Draft PR using the repository workflow;
- do not direct-push master;
- do not rewrite the reviewed behavior candidate after merge;
- create a separate docs/evidence-only reconciliation PR;
- reconciliation may update plan state/history, roadmap SHA/truth, qualification evidence, and current merge record;
- reconciliation must not change production code/tests/behavior.

Post-merge state should be:

```text
H2A-3: CLOSED as an implementation milestone
H2A: FUNCTIONALLY_COMPLETE, awaiting bounded H2A stabilization/closure
H2B: ELIGIBLE
```

Then create a **small separate H2A stabilization/closure plan**, not another feature milestone. That plan reviews the joint H2A invariants across H2A-1/2/3 and either closes H2A or returns bounded corrections. It must not pull H2B into H2A.

---

# 9. Stop / escalation conditions — Agent must report, not decide

Stop implementation and return to the user/architect if any of the following occurs:

1. A required design appears to need `persistence -> execution-lineage` or another dependency cycle.
2. Kysely cannot support the repository transaction participation without exposing raw DB handles through stable package roots.
3. Required Evidence atomicity appears to require opening a second transaction or best-effort post-commit write.
4. The canonical Activity/Evidence schema requires a production compatibility migration to preserve an older development DB.
5. `LineageContextRef` appears to need HostOwnershipToken/BootId to resume work as current Authority.
6. OpenTelemetry API cannot provide correlation without installing SDK/provider mechanics that materially widen scope.
7. A normal runtime package must depend on Bootstrap Closure internals to establish Activity identity.
8. A proposed Evidence design needs arbitrary unbounded payload storage in this milestone.
9. A real consumer proves StorageWorkspace is actually required for H2A-3.
10. Existing H1/H2A behavior has to be weakened to make the new runtime work.
11. A behavior-affecting hardcoded limit/retry/timeout is required but has no existing configuration/safety classification.
12. A new third-party dependency role appears necessary beyond the already adopted `@opentelemetry/api` route.
13. Baseline/master changes after plan activation in a way that touches H2A semantics.
14. External review or final CI is requested against a different base/head pair.

The Agent may make ordinary code-organization choices such as private helper names, test helper factoring, SQL builder expression style, and file-local error normalization **only when they preserve every Decision Lock**.

---

# 10. Acceptance checklist

H2A-3 is ready for external review only when all are true:

```text
[ ] ActivityId/EvidenceId/Instant are canonical Foundation primitives
[ ] TimeService separates wall time from monotonic elapsed time
[ ] Fake time can simulate independent wall/monotonic movement
[ ] SchemaRuntime is non-mutating and owns normal Ajv mechanics
[ ] exactly the five DL-04 Bootstrap files remain the only direct Ajv/TypeBox exceptions
[ ] existing Bootstrap codecs remain independent of normal SchemaRuntime
[ ] @opentelemetry/api is exactly Catalog-pinned at 1.9.1
[ ] ExecutionContext uses one Heptalogos ALS stack
[ ] OTel context is correlation only
[ ] trusted Host origin cannot be caller-forged
[ ] LineageContextRef V1 is current-only, durable, causal, and non-authoritative
[ ] resume rejects Instance/ContinuityEpoch discontinuity
[ ] resume creates a new Activity with current Host origin
[ ] Persistence mutation requires matching current execution metadata
[ ] matching execution metadata cannot bypass Host database fence
[ ] read path remains read-only and does not require Activity
[ ] Foundation repository Kysely seam is restricted and absent from package root
[ ] current canonical migration is one rewritten 0001 baseline
[ ] no H2A-2 development upgrade migration exists
[ ] ActivityRecord permits references to unretained parent/causation Activities
[ ] No generic durable Activity completion UPDATE API/grant was introduced
[ ] EvidenceRecord requires a retained causal Activity
[ ] Evidence caller cannot forge the transaction ActivityId
[ ] Evidence/reference fields are structurally bounded and no arbitrary payload field exists
[ ] required Activity + Evidence + canonical mutation commit/rollback atomically
[ ] Bootstrap Activity identity connects to normal Host causation
[ ] BootstrapJournal remains independently readable and unchanged by normal import
[ ] no Pino/OTel SDK/exporter/DBOS/Cordis/Management/Subject/StorageWorkspace scope creep
[ ] package-boundary gates mechanically enforce adopted routes
[ ] H1/H2A-1/H2A-2 regressions PASS
[ ] pnpm verify PASS on final local candidate
[ ] active plan records exact candidate base/head and truthful evidence states
```

---

# 11. Evidence record template to fill during execution

Do not pre-fill PASS. The implementing Agent records only observed results.

```yaml
h2a3:
 baseline: 446d0f6bce449f177c66fb569341020757b44c9b
 branch: dev/h2a3-canonical-execution-context-time-lineage
behaviorCandidate: 2482b6e380cbad37407e99b0ce7c7560ccc709c6
 reviewPair:
base: 446d0f6bce449f177c66fb569341020757b44c9b
head: 2482b6e380cbad37407e99b0ce7c7560ccc709c6
 local:
 foundation_contracts: PASS (19/19)
 schema_runtime: PASS (2/2)
 time_service: PASS (4/4)
 execution_context: PASS (23/23)
 lineage_context_ref: PASS (included in execution-lineage 23/23)
 persistence_execution_admission: PASS (19/19 unit; 9/9 real PostgreSQL)
 canonical_schema_clean_baseline: PASS (3/3 unit; bootstrap-runtime integration)
 retained_activity_repository: PASS (execution-lineage 23/23; real PostgreSQL)
 evidence_repository: PASS (4/4)
 required_atomicity_real_postgres: PASS (A1-A5, 5/5)
 bootstrap_lineage_handoff: PASS (B1-B6, 9/9 test cases)
 h1_regression: PASS (bootstrap-runtime existing scenarios included)
 stale_execution_origin_unit: PASS (19/19)
 stale_execution_origin_real_postgres: PASS (P9)
 stale_database_host_fence_real_postgres: PASS (P9)
 h2a1_persistence_regression: PASS (9/9; P9 covers both stale-origin and stale-fence layers)
 h2a2_canonical_regression: PASS (bootstrap-runtime target 47/47)
 check_dependencies: PASS
 check_boundaries: PASS
 pnpm_verify: PASS
externalIndependentReview: PASS
 finalCrossPlatformCI: NOT_RUN
squashMerge: PASS (PR #19 merge 7b51468c2c41895bde7091868d688d98dfc6c957)
```

Status vocabulary for executable gates remains exactly:

```text
PASS | FAIL | NOT_RUN | BLOCKED
```

---

# 12. Architectural rationale retained for future reviewers

These decisions are intentional and should not be “simplified” during implementation:

1. **H2A-3 is one capability milestone, not three micro-milestones.** Transient ExecutionContext without durable required evidence would leave the H2A question unanswered and create temporary contracts that later need retrofit.
2. **Evidence is separate from Lineage.** Activity describes execution/causality; Evidence proves product facts. Telemetry is a third object. Conflating them would make later security, management, Subject, Effect, and retention semantics difficult to govern.
3. **Persistence receives a tiny execution snapshot instead of importing lineage.** This gives every canonical mutation causal admission without introducing a package cycle or letting Lineage own transaction Authority.
4. **The restricted Kysely repository seam is preferable to a custom SQL abstraction.** Kysely is already the adopted typed SQL/transaction mechanic; raw types are acceptable inside mechanically restricted Foundation repository implementation code, but not stable service/Extension contracts.
5. **LineageContextRef intentionally omits current Host token/Boot identity.** Durable causation must survive restart without turning stale runtime identity into Authority. A resumed Activity is always newly rooted in the current Host origin.
6. **Evidence V1 carries references, not arbitrary payload.** H2A only needs the required-record skeleton. Payload ownership, typed Evidence families, Artifact integration, retention/redaction, and query projection need real future owners before they are generalized.
7. **Activity parent/causation refs are not FKs.** Not every Activity is retained; database referential integrity must not force unlimited retention. Evidence→Activity is an FK because required Evidence is defined to require a retained causal Activity.
8. **The canonical migration is rewritten in PRE_PRODUCTION.** Repository history is not a product compatibility obligation. The current best baseline remains the only supported development schema.
9. **Bootstrap remains independent.** H1 recovery must continue working when normal PostgreSQL/lineage/OTel is broken. H2A imports/references Early Observability after normal runtime becomes available; it does not invert that dependency.
10. **StorageWorkspace stays deferred until a real filesystem owner exists.** S17 remains authoritative, but implementing an unused workspace subsystem in H2A would increase maintenance burden without closing an H2A invariant.
