# Heptalogos H3A — Durable Obligation & Signal Spine
## Decision-Complete Implementation & Qualification Plan

**Plan date:** 2026-08-26  
**Status:** ACTIVE  
**Authority level:** Implementation Plan below the Architecture Corpus; this plan may prescribe exact Roadmap/qualification updates, but it does not silently override Corpus Authority.  
**Canonical active path after activation:** `docs/plans/active/foundation/h3a-durable-obligation-signal-spine.md`  
**Supersedes:** the earlier draft `Heptalogos_H3A_Durable_Work_and_Signal_Spine_Implementation_Plan_2026-08-26.md`  
**Behavior branches:**  
- `dev/h3a1-canonical-work-signal`
- `dev/h3a2-dbos-durable-recovery`

> **Executor rule:** This plan is decision-complete. The development Agent implements the decisions below; it does not select architecture, invent fallback providers, broaden scope, add compatibility behavior, redefine Authority, or replace adopted dependencies. If reality contradicts a locked decision in a non-trivial way, stop with `PLAN_GAP` and provide concrete evidence.
>
> **Required execution disciplines:** TDD for behavior-bearing changes; evidence vocabulary `PASS | FAIL | NOT_RUN | BLOCKED`; verification before completion claims; external Independent Review is out-of-band and is never inferred from GitHub review/approval state.

## H3A-1 Candidate Correction Amendment — 2026-08-26

**Status:** ACTIVE

This is a bounded correctness correction cycle for the existing
`dev/h3a1-canonical-work-signal` candidate. It is not a new H3A stage, does not
introduce a compatibility path, and does not change the H3A-1 package ownership
boundaries. The prior H3A-1 qualification remains a historical observed run;
candidate mutation makes its PASS evidence stale for the current candidate.

Current truth during this cycle is:

```yaml
H3: OPEN
H3A: ACTIVE
H3A_1: ACTIVE
H3A_2: NOT_ELIGIBLE
candidateFreeze: BLOCKED
independentReview: NOT_RUN
```

The following semantic decisions are locked for this correction:

- Signal owns a connection slot with source identity/generation. Events from a
  stale or closed connection are no-ops; closing the last subscription cancels
  reconnect and connecting-client work and disposes any late client.
- An admitted WorkHandler invocation returns a generation-fenced,
  schema-validated outcome. WorkQueue may enforce canonical JSON and byte-size
  bounds, but it must not request a second generation admission for outcome
  validation.
- Exact handler availability includes the requested payload version without
  changing the registry's exact registration key. Unsupported payload versions
  remain dependency-unavailable; immutable invalid payloads terminalize as
  `FAILED` with retry class `invalid`.
- Every `PENDING` WorkItem is a projection candidate, including one with a
  future `notBefore`. Projection carries the canonical `notBefore`; the
  executor's early-fire check remains the final invocation fence. The repository
  API is named `listProjectionCandidates` and has no compatibility alias.
- Committed-work dispatch uses a mandatory `beforeDispatch` admission seam with
  only `ALLOW`, `DELAY`, and `THROTTLE`. `DELAY` and `THROTTLE` skip the current
  projection scan without changing canonical WorkItem state or creating a
  second durable timer.
- For one WorkItem/revision, the first accepted cancel or supersede intent wins.
  Idle non-terminal states may atomically terminalize; `RUNNING` records the
  intent and relies on cooperative abort plus attempt-fenced terminalization;
  `WAITING_RESTORE_RECONCILIATION` is not terminalized by H3A-1. Wake paths
  carry the same intent fence.
- `pg_notify` publication is part of the WorkItem creation transaction. A
  transaction-time publisher failure aborts the creation transaction; only
  post-commit delivery loss is best effort and recovered by reconciliation.
- The H3A-1 classifier cannot retain `external-effect-uncertain` because H3A-1
  has no external-effect capability. That forbidden decision terminalizes the
  WorkItem as bounded `FAILED`/`invalid` rather than leaving `RUNNING`.
- WorkHandler descriptors use canonical structural comparison and immutable
  deep snapshots. Payload-version declarations are normalized for comparison.
  Payload versions share PostgreSQL `integer`'s maximum, and the canonical
  schema enforces `RUNNING` exactly when `active_attempt_id` is non-null.
- Bootstrap production-import restrictions and current package documentation
  must describe the current H3A-1 tree only. Fresh focused, real PostgreSQL,
  and repository verification is required before candidate truth can return to
  a review-ready state.

This amendment is the governing correction for the implementation tasks below;
H3A-2 remains prohibited until H3A-1 is externally reviewed and closed.

---

# 0. Executive Decision Record

This section freezes the non-trivial decisions that implementation Agents are **not** allowed to make.

## D-01 — H3 is decomposed, but the Architecture horizon is not redefined

The current Roadmap H3 question remains:

> Can the system make a durable promise, crash anywhere around dispatch/processing/external effects, and resume without losing the obligation or inventing false certainty?

Implementation is decomposed as:

```text
H3A — Durable Obligation & Signal Spine
  H3A-1 — Canonical Work Contract, Handler Binding & Signal
  H3A-2 — DBOS Durable Execution & Crash Recovery

H3B — Consequential Effect & Uncertainty

H3-S — bounded stabilization / current-tree cleanup / closure evidence
```

This is a **Roadmap implementation decomposition**, not a new Architecture Authority layer.

Rationale:

1. WorkItem Authority and generation fencing must be correct independently of DBOS.
2. DBOS is adopted mechanics, not product semantics.
3. Effect uncertainty only becomes meaningful after durable obligation/replay semantics actually survive process failure.
4. Two bounded behavior candidates are substantially easier to review and diagnose than one mixed semantic/engine candidate.

H3A completion means:

```yaml
H3: OPEN
H3A: CLOSED
H3B: ELIGIBLE
H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: NOT_ELIGIBLE
```

H3 is **not** closed by this plan.

---

## D-02 — No broad normative Corpus rewrite is required before H3A

The Architecture Corpus is living Authority and may be revised when engineering evidence exposes a true semantic conflict. No broad rewrite is required before H3A. The bounded correction amendment adds the narrow first-accepted-terminal-intent clarification to S02 §12; that clarification is the only normative Corpus change in this cycle.

Specifically, **do not add** a new `CONFIG_INDEPENDENT` policy now.

The existing S02 policies remain:

```text
CONFIG_PINNED
LATEST_COMPATIBLE_AT_ATTEMPT
```

H3A qualifies a deliberately configuration-free WorkHandler path using:

```text
LATEST_COMPATIBLE_AT_ATTEMPT
```

with no Configuration client exposed to H3A handlers and therefore an empty effective configuration dependency set.

`CONFIG_PINNED` remains structurally representable, but H3A must fail closed if asked to materialize or execute a pinned binding without a real ConfigurationRevision resolver. No fake/opaque “probably valid” configuration reference is accepted merely to satisfy a field.

The **Roadmap** is updated to clarify this staging:

```text
H3 closes durable binding metadata, propagation and fail-closed semantics.
Real ConfigurationRevision materialization/activation remains owned by H4.
H3A qualification uses configuration-free built-in handlers.
```

If implementation evidence proves this staging is semantically insufficient, stop `PLAN_GAP` and return to Corpus revision. Do not invent a third binding policy in code.

---

## D-03 — Resource/pressure semantics are represented by an explicit admission port, not a fake ResourceGovernor

H3A must not pretend that H8 ResourceGovernor/PressureSnapshot exists.

H3A introduces an explicit Heptalogos-owned port:

```text
WorkAdmissionPort
```

that consumes the S15 admission vocabulary and is mandatory at WorkQueue composition.

It returns exactly:

```text
ALLOW
DELAY
THROTTLE
REJECT_OPTIONAL
REJECT_NEW_WORK
```

Rules:

```text
before durable obligation commit:
  REJECT_NEW_WORK / REJECT_OPTIONAL may reject creation

after WorkItem commit:
  the durable promise already exists
  admission may delay/throttle dispatch
  admission may NOT silently delete, cancel, fail, or forget the WorkItem
```

H3A uses deterministic test/composition admission providers. A real PressureSnapshot/ResourceGovernor provider is deferred to H8 and remains `NOT_RUN`.

No production “allow everything if provider missing” default exists.

---

## D-04 — Semantic package owners are fixed

H3A creates exactly these new semantic packages:

```text
packages/signal
packages/work-queue
packages/durable-execution
```

Ownership:

```text
signal
  PostgreSQL LISTEN/NOTIFY hint mechanics only

work-queue
  WorkItem product semantics, state transitions, reconciliation,
  dispatchRevision, retry/wakeup, cancellation/supersession,
  dedup semantics, admission interaction, attempt fences

durable-execution
  DBOS adapter, static workflow registration, DBOS Queue projection,
  applicationVersion mechanics, engine lifecycle, engine schema provisioning adapter
```

Existing owners remain:

```text
canonical-schema
  heptalogos.* current product schema materialization

persistence
  normal Host-fenced product transactions

runtime-kernel
  MicroSystem / generation lifecycle and exact WorkHandler runtime binding

execution-lineage
  ExecutionContext / Activity / LineageContextRef

host-ownership + bootstrap-runtime
  database principals, bootstrap/Host/migration authority, credential materialization
```

Forbidden dependency inversion:

```text
runtime-kernel -> work-queue
runtime-kernel -> durable-execution
persistence -> work-queue
bootstrap-runtime production source -> work-queue
bootstrap-runtime production source -> durable-execution
bootstrap-runtime production source -> runtime-kernel
```

`bootstrap-runtime` may use H3 packages only from cross-package integration tests/devDependencies.

---

## D-05 — Runtime Kernel gets a narrow WorkHandler seam, not a generic Contribution framework

H3A adds one dedicated generation-bound registry/resolver:

```text
WorkHandlerRegistry
```

Exact resolution key:

```text
MicroSystemId
+ ContributionId
+ PackageGenerationId
```

A WorkHandler-providing MicroSystem must have an exact `PackageGenerationId`.

Durable payload versioning is not represented by a version number alone. Each
declared payload version carries a plain JSON Schema 2020-12 definition and the
current handler outcome carries a bounded result schema. Runtime Kernel compiles
those schemas through `@heptalogos/schema-runtime`; AJV/TypeBox objects do not
become the WorkHandler public contract. The exact generation-bound handler lease
therefore owns non-mutating `validatePayload(version, value)` and
`validateOutcome(value)` gates in addition to invocation.

The Runtime Kernel may own:

```text
declaration validation
generation-bound publication
fenced exact lookup
invocation admission
cooperative AbortSignal
retirement/removal
Host-assigned contribution origin for lineage
```

It must not own:

```text
WorkItem rows
DBOS
queue scheduling
retry semantics
dedup semantics
EffectOperation
generic Contribution framework
Extension Package Manager
```

Do **not** create:

```text
GenericContributionRegistry<T>
ContributionManager
UniversalContributionRuntime
DynamicWorkflowContribution
```

If a second concrete Contribution family later demonstrates shared mechanics, generalization can be revisited with evidence.

---

## D-06 — WorkItem is the only product Authority for durable work

```text
heptalogos.work_item = canonical product truth
DBOS workflow/queue status = engine projection
Signal payload = wakeup hint
Runtime handler registry = current executable availability
```

No second authoritative queue table is created by Heptalogos.

No WorkItem terminal state is inferred from DBOS terminal status alone.

No Signal payload carries unique durable truth.

---

## D-07 — Current PRE_PRODUCTION schema is rewritten; no H3 migration history is accumulated

Current repository has one Foundation baseline:

```text
packages/canonical-schema/src/migrations/0001-foundation-baseline.ts
```

H3A-1 rewrites that current baseline to include current WorkItem and Contribution-origin semantics.

Forbidden:

```text
0002-h3a...
legacy WorkItem reader
old/new dual schema
compatibility trigger
migration bridge for development history
upcaster for an unshipped WorkItem shape
```

This is PRE_PRODUCTION and `compatibility-obligations.json` declares no obligation.

DBOS's own `dbos.*` vendor schema is **not** placed into this canonical product migration. It is provisioned separately under the same authorized migration window.

---

## D-08 — Signal uses one fixed PostgreSQL channel and typed hint payload

Foundation channel:

```text
heptalogos_signal_v1
```

Signal payload V1:

```json
{
  "schemaVersion": 1,
  "topic": "work.available"
}
```

Rules:

- fixed PostgreSQL channel, not caller-selected SQL identifiers;
- topic is a bounded namespaced semantic ID;
- payload contains no WorkItem ID, payload, result, credential, or unique durable fact;
- listener establishment triggers an initial rescan;
- reconnect triggers `LISTEN` again and then a rescan;
- notification only wakes a canonical re-query.

H3A WorkQueue topic:

```text
work.available
```

---

## D-09 — WorkQueue uses reconciliation, not a second scheduler

There is one adopted scheduling engine:

```text
DBOS Queue
```

WorkQueue has a bounded anti-entropy reconciliation loop because a canonical commit or notification may survive while an immediate engine dispatch is lost.

That loop may:

```text
scan canonical eligible WorkItems
repair lost WorkItem -> engine projection
wake due RETRY_WAIT through an authoritative transition
re-evaluate WAITING_DEPENDENCY
```

It may **not** implement:

```text
queue concurrency scheduler
rate limiter
worker pool
priority heap
per-item durable timer engine
```

For `notBefore`:

- initial engine projection uses DBOS delayed enqueue mechanics where available;
- canonical `notBefore` remains Authority;
- anti-entropy can reproduce a lost delayed enqueue using the same deterministic attempt identity.

For `RETRY_WAIT`:

```text
due condition
→ WorkQueue canonical transition increments dispatchRevision
→ new DispatchAttemptId
→ DBOS projection
```

No old DBOS workflow is “resurrected” as a logical retry.

---

## D-10 — Product-level dedup semantics are fixed

Optional `dedupKey` means:

> Suppress a second simultaneously non-terminal obligation for the same logical handler/dedup key.

Scope:

```text
handler MicroSystemId
+ handler ContributionId
+ dedupKey
```

PackageGeneration is deliberately **not** part of dedup scope; an upgrade must not manufacture a second concurrent obligation solely because code generation changed.

Database partial uniqueness applies only while existing WorkItem is non-terminal.

Behavior:

```text
existing matching non-terminal item
→ creation returns DEDUPLICATED(existing WorkItemId)
→ no second WorkItem

only terminal matching items exist
→ a new WorkItem may be created
```

This dedup is **not** external-effect idempotency and does not replace EffectFence.

---

## D-11 — Attempt identity and product fencing are fixed

```text
WorkItemId = UUIDv7 product durable obligation identity

DispatchAttemptId =
  domain-separated digest(
    "heptalogos/work-dispatch-attempt/v1",
    WorkItemId,
    dispatchRevision
  )
```

Properties:

```text
same WorkItemId + same revision
→ same DispatchAttemptId
→ same DBOS workflow ID

true retry / dependency wake
→ increment canonical dispatchRevision first
→ new DispatchAttemptId
```

DBOS workflow ID:

```text
heptalogos.work.<DispatchAttemptId>
```

No Git SHA, package path, DBOS-generated random UUID, or source hash is product attempt identity.

---

## D-12 — Handler execution never spans a product DB transaction

Required execution boundary:

```text
Tx A
  load canonical WorkItem
  verify Host fence + state + revision
  verify cancel/supersede request
  resolve exact handler availability
  PENDING -> RUNNING
  set activeAttemptId
  retain required work.execute lineage
COMMIT

invoke exact WorkHandler
  OUTSIDE product transaction

Tx B
  re-read WorkItem
  verify Host fence
  verify state == RUNNING
  verify expected dispatchRevision
  verify activeAttemptId
  re-check cancellation/supersession
  commit terminal / RETRY_WAIT
COMMIT
```

If Tx B precondition fails, the attempt is stale and cannot overwrite current Authority.

Terminal replay:

```text
canonical terminal already committed
+ same DBOS attempt retries
→ return stored terminal result/no-op
→ do not invoke handler again
```

---

## D-13 — H3A prohibits consequential external effects

H3A WorkHandlers may:

```text
read canonical state
perform Host-fenced canonical mutation
create follow-up WorkItems
produce bounded canonical outcomes
record lineage/evidence
```

They may not:

```text
send external messages
perform HTTP write
mutate remote service
launch consequential external process
write arbitrary external files
use a hidden direct Driver/Network client
```

No `EffectOperation` implementation belongs in H3A.

`external-effect-uncertain` stays in the architectural retry vocabulary but H3A execution paths must not produce it.

H3B owns EffectOperation/EffectFence/uncertainty.

---

## D-14 — DBOS exact dependency is frozen to stable 4.26.10 for this plan

Current external evidence at planning time:

```yaml
package: "@dbos-inc/dbos-sdk"
stable: "4.26.10"
npmTag: "latest"
preview: "4.27.5-preview"
nodeEngine: ">=20"
```

Use:

```text
@dbos-inc/dbos-sdk 4.26.10
```

Do not use preview.

At the start of H3A-2, refresh npm/upstream metadata:

- if 4.26.10 remains current stable, proceed;
- if a newer stable has replaced it, **do not auto-upgrade**; return `PLAN_GAP_DEPENDENCY_REFRESH` with the new package/version evidence so the exact version decision can be revalidated.

No Agent-selected downgrade, preview adoption, or second engine.

---

## D-15 — DBOS gets a dedicated least-privilege PostgreSQL principal

Add:

```text
heptalogos_durable_execution
```

This is a semantic role, not vendor-named `dbos_user`.

Normal responsibilities:

```text
CONNECT to canonical database
minimum DBOS-generated privileges on dbos.* only
no heptalogos.* product-table privileges
no DDL privilege
no CREATEDB
no CREATEROLE
no SUPERUSER
no membership in heptalogos_owner
```

Product state mutation inside a WorkHandler continues through `PersistenceService` as `heptalogos_runtime`.

DBOS never receives `heptalogos_runtime` as a convenience credential.

---

## D-16 — DBOS vendor schema is provisioned under Heptalogos migration Authority

Normal DBOS runtime is always:

```yaml
systemDatabaseSchemaName: dbos
runMigrations: false
runAdminServer: false
```

Provisioning occurs only during the existing canonical migration authority window, before normal managed Host exposure.

Mechanics:

```text
HostCanonicalMigrationAuthority
→ durable-execution DbosSystemSchemaProvisioner
→ exact installed DBOS 4.26.10 CLI as vendor migration mechanics
→ existing heptalogos database
→ dbos schema
→ grant vendor-declared minimum privileges to heptalogos_durable_execution
```

The provisioner invokes the exact installed CLI **without `npx` and without a shell**:

```text
process.execPath
<absolute resolved @dbos-inc/dbos-sdk dist/src/cli/cli.js>
schema
postgresql://heptalogos_migration@127.0.0.1:<port>/heptalogos
--schema dbos
--app-role heptalogos_durable_execution
```

Migration password:

```text
PGPASSWORD environment only
```

Never argv, file, plan, log, Problem detail, Activity attribute, or artifact.

The child environment is sanitized. The migration authority signal aborts the child if authority is lost.

After exit:

```text
assert migration authority current
verify vendor schema version/currentness
verify durable role grants
```

A partial/failed vendor migration blocks normal Host startup and requires bounded recovery/repair. Do not create a “fallback empty dbos schema” or let normal DBOS launch repair it.

The DBOS CLI is mechanics. Heptalogos retains Authority over **when**, **under which principal**, **against which database/schema**, and **whether normal Host is admitted**.

---

## D-17 — DBOS runtime receives its own caller-owned pg Pool

`durable-execution` creates a dedicated `pg.Pool` using `HostDurableExecutionAuthority`.

DBOS configuration uses:

```text
systemDatabasePool
```

rather than a password-bearing URL.

The pool:

- user `heptalogos_durable_execution`;
- database `heptalogos`;
- host `127.0.0.1`;
- bounded pool size from explicit DurableExecution options;
- permanent background error sink;
- password callback materialized through BootstrapKeyProvider-backed authority;
- caller-owned lifecycle: DBOS shutdown does not close it; DurableExecution closes it after DBOS shutdown.

DBOS cannot borrow the normal Persistence pool.

---

## D-18 — DBOS application version is explicit and independent of PackageGeneration

Define Heptalogos-owned:

```text
DurableCodeVersion
```

It is an explicit stable semantic version supplied to DurableExecution composition.

For the current static dispatcher ABI, qualification uses:

```text
durable.dispatch.v1
```

Rules:

```text
DurableCodeVersion != ProductGenerationId
DurableCodeVersion != PackageGenerationId
DurableCodeVersion != Git SHA
DurableCodeVersion != auto source hash
```

Product Update later owns how ProductGeneration selects/retains durable-code versions.

H3A-2 must prove:

- version A does not recover version-B-incompatible workflow history;
- same version recovers interrupted workflow;
- PackageGeneration A→B does not change DBOS applicationVersion or relaunch DBOS.

Do not implement blue/green Product Update in H3A.

---

## D-19 — Queue profile configuration is Heptalogos Authority; DBOS is projection

Define:

```text
WorkQueueProfileDefinition
```

as explicit composition input.

No hidden default profile.

DBOS queue registration:

```text
after DBOS.launch()
onConflict: "never_update"
```

Then read back DBOS queue mechanics and compare with expected current Heptalogos definition.

Mismatch:

```text
fail closed: durable-execution.queue-profile-mismatch
```

Do not let an older process silently overwrite a newer queue profile.

No runtime queue-management UI or dynamic Management action is added in H3A.

---

## D-20 — H3A uses two externally reviewed behavior candidates

Candidate 1:

```text
H3A-1 — canonical WorkItem / handler binding / Signal / WorkQueue semantics
```

Candidate 2:

```text
H3A-2 — DBOS / dedicated principal / vendor schema / crash recovery
```

Each behavior candidate requires:

```text
local/Ubuntu qualification
candidate freeze
external Independent Review PASS
squash merge
post-merge living-truth reconciliation
```

H3 final Ubuntu/macOS/Windows manual CI remains a **H3-S closure gate**, not a per-substage tax.

---

# 1. Planning Basis — Current Master Truth

The executor must re-read these at Task 0 and verify they still hold.

Current master expected entry truth:

```yaml
M5B: CLOSED
H1: CLOSED
H2: CLOSED
H2_STABILIZATION: CLOSED
H3: ELIGIBLE
activeImplementationPlan: NONE
```

Current product qualification expected:

```yaml
windows_real_postgres: PASS
ubuntu_linux_real_postgres: PASS
macos_real_postgres: NOT_RUN
source_less: NOT_RUN
service_headless: NOT_RUN
service_account_acl: NOT_RUN
hardware_power_loss: NOT_RUN
```

Current package set contains no:

```text
work-queue
durable-execution
signal
```

Current Q-ASYNC state:

```yaml
roleDecision: ADOPTED
qualificationState: OPEN
crash_after_terminal_commit: NOT_RUN
```

Current dependency Authority:

```text
durable.execution = DBOS 4.x ADOPTED
workqueue.mechanics = DBOS Queue ADOPTED
signal = PostgreSQL LISTEN/NOTIFY ADOPTED
state.machine = XState stable 5.x ADOPTED for local complex machines
```

If master no longer matches this entry state, stop:

```text
BLOCKED_BASE_MOVED
```

and produce the changed living-truth evidence. Do not execute an old plan against a moved Authority baseline.

---

# 2. Required Reading Before Editing

## Repository governance

```text
AGENTS.md
packages/AGENTS.md
packages/README.md
packages/INDEX.md
docs/plans/README.md
docs/roadmap/development-roadmap.md
```

## Architecture Corpus

```text
Architecture_Corpus/README.md
Architecture_Corpus/00-项目宪法与工程宪法.md
Architecture_Corpus/02-架构原则与反NIH约束.md
Architecture_Corpus/03-核心概念与Authority.md
Architecture_Corpus/05-整机执行模型.md
Architecture_Corpus/06-MicroSystem与Extension架构.md
Architecture_Corpus/12-数据-证据-内容与持久化.md
Architecture_Corpus/14-跨平台产品运行与分发.md
Architecture_Corpus/15-技术与依赖决策账本.md
Architecture_Corpus/16-验证与资格认定体系.md
Architecture_Corpus/20-架构审查清单.md
Architecture_Corpus/21-配置治理与Configuration-Surface.md
Architecture_Corpus/24-依赖使用与实现路由.md
Architecture_Corpus/25-TypeScript与仓库工具链.md
Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md

Architecture_Corpus/specs/S02-异步-WorkQueue-Durable-Time.md
Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md
Architecture_Corpus/specs/S04-配置-Secret-管理Surface.md
Architecture_Corpus/specs/S13-Foundation-Service-Capability-Readiness-Catalog.md
Architecture_Corpus/specs/S14-Canonical-End-to-End-Flows.md
Architecture_Corpus/specs/S15-Foundation横切合同.md
Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md
```

## Qualification / machine-readable routing

```text
Architecture_Corpus/qualification/dependency-status.json
Architecture_Corpus/qualification/results/qualification-status.json
Architecture_Corpus/qualification/results/Q-ASYNC-01.md
Architecture_Corpus/references/dependency-routing.json
Architecture_Corpus/references/compatibility-obligations.json
```

## Existing implementation boundaries

```text
packages/foundation-contracts/README.md
packages/foundation-contracts/src/runtime-identity.ts

packages/host-ownership/README.md
packages/host-ownership/src/contracts.ts
packages/host-ownership/src/bootstrap-admin.ts
packages/host-ownership/src/ownership-schema.ts

packages/bootstrap-runtime/README.md
packages/bootstrap-runtime/src/bootstrap-key-provider.ts
packages/bootstrap-runtime/src/host-ownership-handoff.ts
packages/bootstrap-runtime/src/managed-host.ts
packages/bootstrap-runtime/src/runtime-host-lifecycle.integration.test.ts
packages/bootstrap-runtime/src/test-support/canonical-postgres.ts

packages/canonical-schema/README.md
packages/canonical-schema/src/migrations/0001-foundation-baseline.ts

packages/persistence/README.md
packages/persistence/src/contracts.ts
packages/persistence/src/persistence-service.ts
packages/persistence/src/foundation-repository.ts

packages/execution-lineage/README.md
packages/execution-lineage/src/contracts.ts
packages/execution-lineage/src/execution-context-runtime.ts
packages/execution-lineage/src/activity-repository.ts

packages/runtime-kernel/README.md
packages/runtime-kernel/src/contracts.ts
packages/runtime-kernel/src/generation-fence.ts
packages/runtime-kernel/src/supervisor.ts
```

---

# 3. External Dependency Evidence Frozen by This Plan

Evidence refreshed 2026-08-26:

```text
npm @dbos-inc/dbos-sdk:
  latest = 4.26.10
  preview = 4.27.5-preview

DBOS TypeScript configuration:
  systemDatabasePool supported
  systemDatabaseSchemaName supported
  runMigrations defaults true
  runMigrations=false verifies schema and fails if missing/behind
  runAdminServer configurable

DBOS CLI:
  dbos schema
  --app-role
  --schema
  --print-migrations
  --print-user-role

DBOS Queue:
  registerQueue persists configuration
  must run after DBOS.launch()
  onConflict supports never_update
  queue priority/partition/concurrency/rate-limit are engine mechanics

DBOS workflow versioning:
  explicit applicationVersion supported
  recovery only continues matching application version
  incompatible versions use version/drain strategy
```

Reference URLs for the human reviewer:

```text
https://www.npmjs.com/package/@dbos-inc/dbos-sdk
https://docs.dbos.dev/typescript/reference/configuration
https://docs.dbos.dev/typescript/reference/cli
https://docs.dbos.dev/typescript/reference/queues
https://docs.dbos.dev/typescript/tutorials/upgrading-workflows
```

Implementation Agent must not substitute memory for these facts.

---

# 4. Target Package Dependency DAG

After H3A:

```text
foundation-contracts
        │
        ├──────────► execution-lineage
        │
        ├──────────► schema-runtime ──────► runtime-kernel
        │
        ├──────────► runtime-kernel
        │
        ├──────────► signal
        │
        └──────────► work-queue
                        │
persistence ────────────┤
time-service ───────────┤
execution-lineage ──────┤
runtime-kernel ─────────┤
signal ─────────────────┘

work-queue
    ▲
    │ implements DurableDispatchPort
durable-execution
    │
    ├── @dbos-inc/dbos-sdk
    ├── pg
    ├── execa
    └── host-ownership authority contracts

host-ownership
    ↑
bootstrap-runtime
  composes credentials/authorities

bootstrap-runtime production
  DOES NOT import work-queue/runtime-kernel/durable-execution/signal

bootstrap-runtime integration tests
  MAY dev-import all of them
```

No cycle is accepted.

---

# 5. Current WorkItem V1 Contract

## 5.1 IDs

Add to `foundation-contracts`:

```ts
ContributionId
WorkItemId
```

`ContributionId` uses the current namespaced semantic-ID mechanics.

`WorkItemId` uses current UUIDv7 generated-ID mechanics.

`DispatchAttemptId` is WorkQueue-owned content digest because it is derived identity, not a generated semantic ID.

---

## 5.2 WorkHandler target

```ts
interface WorkHandlerTarget {
  productGenerationId: ProductGenerationId;
  microSystemId: MicroSystemId;
  contributionId: ContributionId;
  packageGenerationId: PackageGenerationId;
  payloadVersion: number;
}
```

All fields are mandatory in current H3A WorkItems.

No “latest generation” target exists.

---

## 5.3 WorkHandler descriptor

Runtime Kernel descriptor:

```ts
interface WorkHandlerPayloadContract {
  version: number;
  schema: Readonly<Record<string, unknown>>; // JSON Schema 2020-12
}

interface WorkHandlerProvisionDescriptor {
  contributionId: ContributionId;
  contractVersion: ContractVersion;
  payloadContracts: readonly WorkHandlerPayloadContract[];
  outcomeSchema: Readonly<Record<string, unknown>>; // JSON Schema 2020-12
  queueProfileId: WorkQueueProfileId;
  resourceAdmissionClass: ResourceAdmissionClassId;
  configurationBindingPolicy:
    | "CONFIG_PINNED"
    | "LATEST_COMPATIBLE_AT_ATTEMPT";
  restoreReplayClass:
    | "RECONCILE_REQUIRED"
    | "RESTORE_SAFE";
}
```

Current H3A registration rule:

```text
configurationBindingPolicy must be LATEST_COMPATIBLE_AT_ATTEMPT
```

because H3A exposes no Configuration client to the handler.

`payloadContracts` must contain at least one unique positive version. Schemas are
compiled once at publication through `schema-runtime`; WorkQueue never persists
an unvalidated payload and never trusts TypeScript's erased type surface.
Handler results are likewise validated before they can become canonical outcome.

If a handler attempts to declare `CONFIG_PINNED` before a real configuration binding provider is composed:

```text
fail: runtime.work-handler.configuration-binding-unavailable
```

Do not silently convert it to latest-compatible.

---

## 5.4 WorkItem state

Exact canonical states:

```text
PENDING
RUNNING
WAITING_DEPENDENCY
RETRY_WAIT
WAITING_RESTORE_RECONCILIATION
SUCCEEDED
FAILED
CANCELLED
SUPERSEDED
```

Terminal:

```text
SUCCEEDED
FAILED
CANCELLED
SUPERSEDED
```

`WAITING_RESTORE_RECONCILIATION` is in the durable vocabulary but ordinary H3A runtime exposes no transition into it. Restore work later owns that operation.

---

## 5.5 Transition model

Use XState 5 only as an implementation mechanic for validating legal local transition structure.

Canonical transition is the PostgreSQL row mutation with Host/revision/attempt preconditions.

Required transitions:

```text
PENDING
  -> RUNNING
  -> WAITING_DEPENDENCY
  -> RETRY_WAIT  # early notBefore revalidation; handler not invoked
  -> CANCELLED
  -> SUPERSEDED

RUNNING
  -> SUCCEEDED
  -> FAILED
  -> RETRY_WAIT
  -> CANCELLED
  -> SUPERSEDED

WAITING_DEPENDENCY
  -> PENDING  # revision increments

RETRY_WAIT
  -> PENDING  # only when due; revision increments
  -> CANCELLED
  -> SUPERSEDED
```

No terminal exit.

Cancellation/supersession request is a field-level Authority request, not an immediate state transition in all cases.

---

# 6. Canonical PostgreSQL WorkItem Shape

Rewrite current `0001-foundation-baseline.ts`.

Table:

```text
heptalogos.work_item
```

Columns:

```text
work_item_id                  uuid primary key

target_product_generation_id  text not null
handler_micro_system_id       text not null
handler_contribution_id       text not null
handler_package_generation_id text not null
payload_version               integer not null
payload                       jsonb not null

queue_profile_id              text not null
resource_admission_class      text not null
partition_key                 text null
priority                      integer not null
not_before                    timestamptz(3) null
dedup_key                     text null

created_continuity_epoch_id   uuid not null
lineage_context_ref           jsonb not null

configuration_binding_policy  text not null
config_revision_ref           text null
restore_replay_class          text not null

dispatch_revision             bigint not null
active_attempt_id             text null
state                         text not null

retry_class                   text null
state_reason_code             text null

cancel_requested_at           timestamptz(3) null
cancellation_reason_code      text null
superseded_by                 uuid null

outcome                       jsonb null

created_at                    timestamptz(3) not null
updated_at                    timestamptz(3) not null
```

Constraints:

```text
target_product_generation_id / package_generation_id
  exact 64-hex current generation shape

micro_system_id / contribution_id
  current namespaced semantic-ID shape

payload_version > 0

payload size
  validated against required WorkQueueRuntimeOptions.maxInlinePayloadBytes
  before insertion; the database does not encode an environment-specific
  runtime limit as a hard-coded schema constant

queue_profile_id/resource_admission_class
  bounded non-empty namespaced strings

partition_key
  null or 1..256 UTF-8 bytes

priority
  1..2147483647
  lower number means higher DBOS queue priority projection
  does not encode product importance/Authority

dedup_key
  null or 1..256 UTF-8 bytes

dispatch_revision >= 1

active_attempt_id
  null unless state == RUNNING
  when non-null exact DispatchAttemptId digest shape

configuration_binding_policy
  CONFIG_PINNED | LATEST_COMPATIBLE_AT_ATTEMPT

CONFIG_PINNED
  config_revision_ref must be non-null
LATEST_COMPATIBLE_AT_ATTEMPT
  config_revision_ref must be null in current H3A

restore_replay_class
  RECONCILE_REQUIRED | RESTORE_SAFE

state
  exact WorkItem state set

terminal state
  outcome non-null
non-terminal state
  outcome null

RETRY_WAIT
  retry_class non-null
  not_before non-null

SUCCEEDED/CANCELLED/SUPERSEDED
  retry_class null
```

Required indexes:

```text
(state, not_before, priority, created_at, work_item_id)

(handler_micro_system_id,
 handler_contribution_id,
 handler_package_generation_id,
 state)

unique partial:
(handler_micro_system_id, handler_contribution_id, dedup_key)
WHERE dedup_key IS NOT NULL
  AND state IN (
    PENDING,
    RUNNING,
    WAITING_DEPENDENCY,
    RETRY_WAIT,
    WAITING_RESTORE_RECONCILIATION
  )
```

Do not add domain-specific Messaging/Subject/Effect columns.

---

# 7. Execution Lineage Alignment

Current `RuntimeExecutionOrigin` lacks `ContributionId`; H3A fixes that existing Corpus/implementation gap.

Add:

```text
contributionId?
```

Origin coherence:

```text
contributionId
→ requires productGenerationId
→ requires packageGenerationId
→ requires microSystemId
→ requires microSystemInstanceId
```

Retained `activity_record` gains:

```text
contribution_id
```

and the completion SECURITY DEFINER function binds it as part of immutable origin.

WorkQueue activities:

```text
work.create
work.dispatch
work.execute
contribution.invoke
```

Durable handoff:

```text
LineageContextRef
```

is persisted on WorkItem.

A DBOS retry after process restart must resume through explicit durable lineage causation; it must not depend on AsyncLocalStorage surviving restart.

---

# 8. H3A-1 — Canonical Work Contract, Handler Binding & Signal

## H3A-1 acceptance question

> Can Heptalogos commit a durable WorkItem as canonical product truth, resolve only the exact generation-pinned WorkHandler, survive lost Signal/dispatch projection at the semantic boundary, and enforce revision/admission/cancellation semantics before any durable engine is connected?

H3A-1 deliberately uses a test `DurableDispatchPort` implementation. It does not add DBOS yet.

---

## Task 0 — Activate the H3A master plan and Roadmap decomposition

**Branch:**

```text
dev/h3a1-canonical-work-signal
```

**Create:**

```text
docs/plans/active/foundation/h3a-durable-obligation-signal-spine.md
```

**Modify:**

```text
docs/plans/README.md
docs/roadmap/development-roadmap.md
```

Steps:

1. refresh `master`;
2. require clean working tree;
3. prove Section 1 entry state;
4. copy this plan verbatim to active path;
5. update Plans README to exactly one active plan;
6. update Roadmap H3 implementation decomposition and staging clarification;
7. set current progress:

```yaml
H3: OPEN
H3A: ACTIVE
H3A_1: ACTIVE
H3A_2: NOT_ELIGIBLE
H3B: NOT_ELIGIBLE
H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: NOT_ELIGIBLE
```

Roadmap text must explicitly state:

```text
- H3A-1 implements canonical work/handler/signal semantics without DBOS.
- H3A-2 materializes DBOS durable mechanics and crash recovery.
- H3B adds EffectOperation/uncertainty.
- real CONFIG_PINNED ConfigurationRevision resolution remains H4-owned;
  H3A uses configuration-free handlers and fail-closed pinned binding.
- real PressureSnapshot/ResourceGovernor remains H8-owned;
  H3A establishes explicit WorkAdmissionPort semantics.
```

Do not modify normative Corpus in Task 0.

Run:

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:hygiene
pnpm format:check
```

Commit:

```text
docs: activate H3A durable obligation plan
```

---

## Task 1 — Add Work/Contribution identity primitives

**Modify:**

```text
packages/foundation-contracts/src/runtime-identity.ts
packages/foundation-contracts/src/runtime-identity.test.ts
packages/foundation-contracts/src/index.ts
```

TDD first:

- valid ContributionId;
- invalid shape/length;
- valid WorkItemId UUIDv7 generation/parser;
- invalid UUID/non-v7 rejection.

Implementation:

```ts
ContributionId = NamespacedId<"ContributionId">
WorkItemId = UuidV7Id<"WorkItemId">
```

Do not create an `AttemptId` random ID.

Run:

```bash
pnpm nx run foundation-contracts:test
pnpm nx run foundation-contracts:lint
pnpm typecheck
pnpm tsc6
```

Commit:

```text
feat: add durable work identities
```

---

## Task 2 — Carry Contribution origin through Execution Lineage

**Modify:**

```text
packages/execution-lineage/src/contracts.ts
packages/execution-lineage/src/execution-context-runtime.ts
packages/execution-lineage/src/activity-repository.ts
packages/execution-lineage/src/activity-repository.test.ts
packages/execution-lineage/src/execution-context-runtime.test.ts
packages/execution-lineage/src/persistence-adapter.test.ts
```

TDD:

1. contribution origin requires full runtime generation origin;
2. caller cannot replace Host-bound package generation;
3. child contribution Activity receives exact ContributionId;
4. LineageContextRef remains cross-restart representation;
5. non-Contribution Activity behavior unchanged.

Implementation requirement:

Use the existing Host-owned/internal runtime-origin binding mechanism. Do not add a public “set arbitrary origin” API.

No package/Contribution identity comes from WorkItem payload.

Run focused suite + typecheck + TS6.

Commit:

```text
feat: bind contribution origin to execution lineage
```

---

## Task 3 — Rewrite canonical baseline for Contribution origin and WorkItem

**Modify:**

```text
packages/canonical-schema/src/migrations/0001-foundation-baseline.ts
packages/canonical-schema/src/initializer.test.ts
packages/canonical-schema/README.md
```

Add:

```text
activity_record.contribution_id
heptalogos.work_item
```

Update:

```text
activity origin constraints
complete_activity_record(...) origin arguments/comparison
runtime grants required for WorkQueue repository
```

Privilege rule:

```text
heptalogos_runtime
  SELECT/INSERT/UPDATE only where required on work_item

PUBLIC
  none

no DDL grant to runtime
```

Do not create a WorkItem SECURITY DEFINER function merely to avoid using normal Persistence; normal WorkQueue mutations already pass through Persistence/Host fence.

Real baseline test must create the full schema on a fresh database.

Commit:

```text
feat: materialize current durable work schema
```

---

## Task 4 — Add narrow WorkHandler lifecycle to Runtime Kernel

**Create:**

```text
packages/runtime-kernel/src/work-handler-contracts.ts
packages/runtime-kernel/src/work-handler-registry.ts
packages/runtime-kernel/src/work-handler-registry.test.ts
```

**Modify:**

```text
packages/runtime-kernel/src/contracts.ts
packages/runtime-kernel/src/supervisor.ts
packages/runtime-kernel/src/supervisor.test.ts
packages/runtime-kernel/src/index.ts
packages/runtime-kernel/README.md
```

Public shape:

```ts
interface RuntimeWorkHandlerInvocation {
  workItemId: WorkItemId;
  dispatchRevision: number;
  payloadVersion: number;
  payload: RuntimeContractData;
  signal: AbortSignal;
}

interface RuntimeWorkHandlerResult {
  outcome: RuntimeContractData;
}

interface RuntimeWorkHandler {
  execute(input: RuntimeWorkHandlerInvocation):
    Promise<RuntimeWorkHandlerResult>;
}
```

`MicroSystemDefinition` adds optional declarative:

```text
workHandlerProvisions?
```

`MicroSystemActivationContext` adds:

```text
publishWorkHandler(descriptor, implementation)
```

Publication is allowed only if:

```text
descriptor was declared
definition.generation.packageGenerationId exists
descriptor configuration policy is allowed by current H3A rule
payloadContracts are non-empty with unique positive versions
every payload JSON Schema compiles under schema-runtime strict profile
outcome JSON Schema compiles under schema-runtime strict profile
queue/profile/admission IDs are valid
```

Add `@heptalogos/schema-runtime` to Runtime Kernel dependencies. The registry
compiles schemas once and exposes validation through the generation-fenced lease;
WorkQueue does not import AJV or TypeBox directly.

Registry tests:

- exact generation resolution;
- duplicate exact registration rejects;
- generation B does not replace A;
- missing A never returns B;
- retiring A closes new admission;
- admitted A invocation may settle under GenerationFence rules;
- retirement removes A;
- handler signal aborts cooperatively;
- `contribution.invoke` lineage uses Host-bound origin;
- no WorkQueue/DBOS imports in runtime-kernel.

Commit:

```text
feat: add generation-pinned WorkHandler runtime seam
```

---

## Task 5 — Create Signal package

**Create:**

```text
packages/signal/README.md
packages/signal/package.json
packages/signal/project.json
packages/signal/tsconfig.json
packages/signal/tsconfig.build.json
packages/signal/src/contracts.ts
packages/signal/src/hint-codec.ts
packages/signal/src/postgres-signal.ts
packages/signal/src/postgres-signal.test.ts
packages/signal/src/problems.ts
packages/signal/src/index.ts
```

**Modify:**

```text
packages/README.md
packages/INDEX.md
```

Contract:

`signal` depends on the Host persistence authority contract for its dedicated
listener credential/Host lifetime, and uses the existing Foundation mutation
transaction for publication. It does not reuse a pooled transaction connection
for `LISTEN`.

```ts
type SignalTopic = NamespacedId<"SignalTopic">;

interface SignalSubscription {
  close(): Promise<void>;
}

interface SignalService {
  subscribe(
    topic: SignalTopic,
    listener: {
      onWakeup(): void | Promise<void>;
      onRescanRequired(): void | Promise<void>;
      onBackgroundError(error: unknown): void;
    }
  ): Promise<SignalSubscription>;
}
```

Internal fixed channel:

```text
heptalogos_signal_v1
```

Foundation-only transactional publisher receives the existing Foundation mutation transaction and executes:

```sql
SELECT pg_notify('heptalogos_signal_v1', $1)
```

with encoded bounded hint.

Dedicated listener:

- one `pg.Client`;
- runtime DB role credentials;
- permanent error handling;
- Host abort closes/reconnect loop;
- reconnect backoff bounded/configured;
- no raw `pg.Client` exported.

Unit tests:

- codec exactness;
- rejects extra fields/oversize/unknown schemaVersion;
- no WorkItem payload in hint;
- subscriber topic filtering;
- close idempotent;
- failure normalizes to canonical Problem.

Real PostgreSQL behavior is qualified later in H3A-1 system tests.

Commit:

```text
feat: add PostgreSQL signal hint service
```

---

## Task 6 — Create WorkQueue package contracts, attempt identity and state machine

**Create:**

```text
packages/work-queue/README.md
packages/work-queue/package.json
packages/work-queue/project.json
packages/work-queue/tsconfig.json
packages/work-queue/tsconfig.build.json
packages/work-queue/src/contracts.ts
packages/work-queue/src/attempt-identity.ts
packages/work-queue/src/attempt-identity.test.ts
packages/work-queue/src/state-machine.ts
packages/work-queue/src/state-machine.test.ts
packages/work-queue/src/problems.ts
packages/work-queue/src/index.ts
```

**Modify navigation:**

```text
packages/README.md
packages/INDEX.md
```

Dependencies:

```text
foundation-contracts
execution-lineage
persistence
time-service
runtime-kernel
signal
xstate
```

No DBOS dependency.

Define:

```text
WorkQueueProfileId
ResourceAdmissionClassId
WorkRetryClass
WorkItemState
WorkConfigurationBinding
WorkItem
WorkItemOutcome
WorkCreationAdmissionDecision
DurableDispatchPort
WorkErrorClassifier
WorkQueueRuntimeOptions
```

Required runtime options, with no production fallback defaults:

```ts
interface WorkQueueRuntimeOptions {
  maxInlinePayloadBytes: number;
  maxOutcomeBytes: number;
  reconciliationBatchSize: number;
  antiEntropyIntervalMs: number;
}
```

`WorkErrorClassifier` is mandatory composition input. It maps a normalized
handler failure to either a terminal failure or an explicit retry request with
`retryClass`, safe reason code and exact `notBefore`. WorkQueue itself does not
invent a global exponential-backoff policy.

Retry class exact vocabulary:

```text
transient
rate-limited
dependency-unavailable
not-configured
policy-blocked
invalid
permanent
external-effect-uncertain
```

H3A execution must reject attempts to classify an H3A handler result as `external-effect-uncertain`.

Attempt ID test includes domain-separation change detection.

State-machine tests exhaust legal and illegal transitions.

Commit:

```text
feat: define durable WorkItem semantics
```

---

## Task 7 — Implement WorkQueue repository on Persistence

**Create:**

```text
packages/work-queue/src/repository.ts
packages/work-queue/src/repository.test.ts
```

Only product mutation entry:

```text
PersistenceService.mutate(...)
→ @heptalogos/persistence/foundation-repository
```

No WorkQueue-owned `pg.Pool`.

Repository operations:

```text
insertWorkItem
getWorkItem
findNonTerminalDedup
listProjectionCandidates
listDueRetry
listWaitingDependency
markRunning
markWaitingDependency
wakeDependency
markRetryWait
wakeDueRetry
requestCancel
requestSupersede
commitTerminal
```

Every mutation that changes an existing item takes explicit:

```text
expected dispatchRevision
expected state
expected activeAttemptId when RUNNING
```

and relies on Persistence for Host fence.

Return typed CAS outcome:

```text
APPLIED
STALE
NOT_FOUND
TERMINAL
```

No boolean ambiguity.

Dedup creation handles database uniqueness race and returns existing item.

Repository tests must prove no product transaction is retained outside the callback.

Commit:

```text
feat: persist Host-fenced WorkItem authority
```

---

## Task 8 — Implement WorkAdmissionPort and WorkQueueService creation semantics

**Create:**

```text
packages/work-queue/src/admission.ts
packages/work-queue/src/admission.test.ts
packages/work-queue/src/service.ts
packages/work-queue/src/service.test.ts
```

`WorkAdmissionPort` is mandatory constructor input.

Creation flow:

```text
current ExecutionContext required
→ exact WorkHandler lease lookup
→ validate payloadVersion and payload against generation-bound JSON Schema
→ canonicalize payload as CanonicalJsonValue
→ enforce WorkQueueRuntimeOptions.maxInlinePayloadBytes
→ validate queueProfileId/resourceAdmissionClass against descriptor
→ enforce current H3A configuration-binding rule
→ WorkAdmissionPort.beforeCreate(...)
→ if rejected: no WorkItem committed
→ enter work.create Activity
→ Persistence transaction:
     retain required lineage
     insert canonical WorkItem
     pg_notify(work.available)
  COMMIT
→ best-effort schedule reconciliation wake
```

Important:

```text
transaction-time pg_notify failure aborts the creation transaction
post-commit notification delivery loss does not roll back or erase WorkItem
```

If `CONFIG_PINNED` requested without a real resolver:

```text
Problem:
  work.configuration.binding_unavailable
  retryClass: dependency
```

Do not persist a caller-provided ref without validation.

Admission tests cover all decision variants and prove no hidden allow fallback.

Commit:

```text
feat: govern durable work creation and admission
```

---

## Task 9 — Implement WorkQueue reconciliation semantics with a DurableDispatchPort

**Create:**

```text
packages/work-queue/src/reconciler.ts
packages/work-queue/src/reconciler.test.ts
```

`DurableDispatchPort`:

```ts
interface DurableDispatchRequest {
  workItemId: WorkItemId;
  dispatchRevision: number;
  dispatchAttemptId: DispatchAttemptId;
  queueProfileId: WorkQueueProfileId;
  priority: number;
  partitionKey?: string;
  notBefore?: Instant;
}

interface DurableDispatchPort {
  dispatch(request: DurableDispatchRequest): Promise<void>;
}
```

Reconciler responsibilities:

```text
Signal wake -> scan
initial start -> scan
bounded anti-entropy -> scan
due RETRY_WAIT -> authoritative revision wake
WAITING_DEPENDENCY exact handler becomes available -> revision wake
PENDING -> dispatch projection
```

Rules:

- duplicate scans produce same DispatchAttemptId;
- a dispatch adapter exception leaves canonical item recoverable;
- anti-entropy has one bounded in-flight scan; no overlapping scan storm;
- no handler is invoked by reconciler;
- no in-memory queue of durable obligations;
- no per-item timer.

Use TimeService for due checks.

Commit:

```text
feat: reconcile canonical work into dispatch projection
```

---

## Task 10 — Implement WorkAttemptExecutor without DBOS

**Create:**

```text
packages/work-queue/src/attempt-executor.ts
packages/work-queue/src/attempt-executor.test.ts
```

`WorkAttemptExecutor` is engine-neutral and will be called by DBOS in H3A-2.

Algorithm:

```text
execute(workItemId, expectedRevision):

  load item

  if item terminal:
    return TERMINAL_REPLAY(stored outcome)

  if expectedRevision != item.dispatchRevision:
    return STALE_NOOP

  if item PENDING and cancellation/supersession request already exists:
    terminalize under CAS
    return terminal

  resolve exact pinned WorkHandler

  if exact handler missing or payload version no longer accepted:
    CAS PENDING -> WAITING_DEPENDENCY
    return WAITING_DEPENDENCY

  derive expected DispatchAttemptId

  Tx A:
    expected state PENDING
    expected revision
    set RUNNING
    set activeAttemptId
    retain work.execute lineage
  COMMIT

  invoke exact handler outside DB transaction

  Tx B:
    expected state RUNNING
    expected revision
    expected activeAttemptId
    re-check cancel/supersede
    apply handler classification:
      success -> SUCCEEDED
      permanent/invalid/etc -> FAILED
      allowed retry -> RETRY_WAIT with explicit notBefore
      cancel/supersede -> terminal matching request
  COMMIT
```

Handler exception:

```text
does not mean automatic retry
```

The mandatory `WorkErrorClassifier` maps a normalized bounded error to an
explicit terminal or retry decision. Unknown/unclassified failure becomes
terminal `FAILED/permanent` rather than “retry until it works”. A retry decision
must supply the exact `notBefore`; WorkQueue contains no hidden backoff formula.

`lease.execute()` admits the handler invocation and validates its outcome
inside the same generation fence. WorkQueue must not request a second outcome
admission after the lease settles; it only canonicalizes the returned outcome
and checks `WorkQueueRuntimeOptions.maxOutcomeBytes` before Tx B can commit it.

Before marking RUNNING, WorkAttemptExecutor re-checks canonical `notBefore`
against TimeService. If an engine projection fires early (for example after a
wall-clock change), it does not invoke the handler: it transitions the item into
`RETRY_WAIT` with a safe `transient`/`not-before-not-yet-due` reason and preserves
the canonical `notBefore`; the later due wake increments `dispatchRevision`
before a new attempt is projected.

Tests:

- terminal replay;
- stale revision no-op;
- exact A vs B;
- missing A does not call B;
- no transaction during handler execution;
- cancellation request wins stale success;
- supersession wins stale success;
- host fence loss blocks Tx B;
- retry requires notBefore;
- no external-effect-uncertain;
- handler output size/shape validated before persistence;
- secret sentinel absent from Problem detail and test diagnostic capture.

Commit:

```text
feat: execute WorkItems through generation and revision fences
```

---

## Task 11 — H3A-1 real PostgreSQL / Host integration qualification

**Do not create a new permanent product composition package.**

Use the existing higher-level integration owner:

```text
packages/bootstrap-runtime
```

Add devDependencies only:

```text
@heptalogos/signal
@heptalogos/work-queue
@heptalogos/runtime-kernel
```

**Create:**

```text
packages/bootstrap-runtime/src/durable-work-host.integration.test.ts
```

**Modify:**

```text
packages/bootstrap-runtime/project.json
packages/bootstrap-runtime/package.json
```

Production `packages/bootstrap-runtime/src/*.ts` files must not import H3 packages.

Use existing real private PostgreSQL fixture in the same package.

Required scenarios:

### W1 — canonical creation + signal

```text
authentic Host
→ WorkHandler A running
→ work.create transaction
→ WorkItem + lineage + pg_notify commit
→ listener wake
→ canonical requery observes item
```

### W2 — lost notification

```text
listener connection killed
→ WorkItem commit succeeds
→ reconnect
→ re-LISTEN
→ rescan
→ item discovered
```

### W3 — lost dispatch projection

```text
WorkItem commits
→ fake DurableDispatchPort unavailable / dispatch call dropped
→ item remains PENDING
→ later anti-entropy scan
→ same revision / same attempt ID redispatched
```

### W4 — same revision deterministic

duplicate reconciliation produces exactly the same DispatchAttemptId.

### W5 — stale revision fence

legal retry/dependency wake advances revision; old attempt cannot terminal-commit.

### W6 — generation A pinned, B available

A missing -> WAITING_DEPENDENCY; B is never invoked.

Restore A -> wake -> revision increments -> A executes.

### W7 — cancellation/supersession

PENDING cancel terminalizes without invoke.

RUNNING cooperative cancel aborts handler; stale success cannot overwrite request.

### W8 — Host authority loss

terminate authentic Host lease:

- Persistence mutations reject;
- WorkQueue cannot terminal-commit;
- pending/nonterminal WorkItem remains durable;
- no new accepted dispatch projection after lifecycle closure.

### W9 — dedup

two concurrent create requests with same logical handler + dedup key produce one non-terminal WorkItem.

After it becomes terminal, same key may create a new WorkItem.

### W10 — lineage

`work.create -> work.execute -> contribution.invoke` reconstructs exact causal/generation origin.

Run using explicit PostgreSQL 18.6 toolchain path; no PATH fallback.

---

## Task 12 — H3A-1 repository verification and qualification record

Run:

```bash
pnpm nx run foundation-contracts:test
pnpm nx run execution-lineage:test
pnpm nx run canonical-schema:test
pnpm nx run runtime-kernel:test
pnpm nx run signal:test
pnpm nx run work-queue:test
pnpm nx run bootstrap-runtime:test:integration

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

Update:

```text
Architecture_Corpus/qualification/results/Q-ASYNC-01.md
Architecture_Corpus/qualification/results/qualification-status.json
docs/roadmap/development-roadmap.md
```

Add only observed evidence.

Expected semantic keys:

```yaml
h3a1_contribution_origin: PASS
h3a1_workitem_canonical_state: PASS
h3a1_generation_pinned_handler: PASS
h3a1_revision_fence: PASS
h3a1_terminal_replay_semantics: PASS
h3a1_signal_reconnect_rescan: PASS
h3a1_lost_dispatch_reconciliation: PASS
h3a1_cancel_supersede_semantics: PASS
h3a1_nonterminal_dedup: PASS
h3a1_admission_contract: PASS
h3a1_real_postgres_18_6_ubuntu: PASS

h3a1_dbos_real_engine: NOT_RUN
h3a1_process_crash_after_terminal_commit: NOT_RUN
```

Roadmap candidate state:

```yaml
H3: OPEN
H3A: ACTIVE
H3A_1: IMPLEMENTATION_COMPLETE_AWAITING_REVIEW
H3A_2: NOT_ELIGIBLE
H3B: NOT_ELIGIBLE
```

Do not add commit SHA evidence.

Commit:

```text
docs: record H3A-1 canonical work qualification
```

---

## Task 13 — H3A-1 candidate freeze, review, merge

Candidate title:

```text
H3A-1: canonical durable work and signal semantics
```

Candidate body states:

- WorkItem canonical Authority;
- narrow WorkHandler generation binding;
- Signal best-effort hint + rescan;
- WorkAdmissionPort;
- engine-neutral WorkAttemptExecutor;
- real Ubuntu PostgreSQL 18.6;
- DBOS deliberately not yet integrated;
- Effect deliberately absent.

Before Ready:

```text
working tree clean
pnpm verify PASS
real PG H3A-1 scenarios PASS
raw DBOS production imports == 0
new nested AGENTS == 0
development-history compatibility residue == 0
```

External Independent Review is out-of-band.

On `REQUEST_CHANGES`:

```text
Draft
→ apply bounded review corrections
→ rerun affected + full candidate qualification
→ freeze
→ new external review
```

Any candidate mutation or base movement makes prior PASS stale.

After external PASS:

```text
squash merge
```

No final 3-platform H3 CI yet.

---

## Task 14 — H3A-1 post-merge living-truth reconciliation

Short docs/evidence-only branch from new `master`.

Keep the H3A master plan active.

Update:

```yaml
H3: OPEN
H3A: ACTIVE
H3A_1: CLOSED
H3A_2: ELIGIBLE
H3B: NOT_ELIGIBLE
```

Record:

```yaml
h3a1_independent_review: PASS
h3a1_merge: PASS
```

No SHA.

Allowed scope:

```text
docs/roadmap/development-roadmap.md
docs/plans/README.md
docs/plans/active/foundation/h3a-durable-obligation-signal-spine.md
Architecture_Corpus/qualification/results/Q-ASYNC-01.md
Architecture_Corpus/qualification/results/qualification-status.json
```

The active plan file itself may receive only an execution-record block, not semantic redesign.

Run docs/repository checks and `pnpm verify`.

Squash merge reconciliation.

---

# 9. H3A-2 — DBOS Durable Execution & Crash Recovery

## H3A-2 acceptance question

> Can the canonical H3A-1 obligation be projected into the exact adopted DBOS Queue, survive process crash/restart and engine replay, use a least-privilege engine-private database boundary, and still leave WorkItem/revision/generation Authority with Heptalogos?

---

## Task 15 — Revalidate DBOS exact package before materialization

From reconciled `master`, create:

```text
dev/h3a2-dbos-durable-recovery
```

Refresh:

```text
npm latest
npm preview
Node engine
DBOS config API
DBOS queue registration API
DBOS schema CLI
DBOS workflow versioning docs
```

Proceed only if exact stable decision remains valid:

```text
@dbos-inc/dbos-sdk 4.26.10
```

If latest stable changed:

```text
PLAN_GAP_DEPENDENCY_REFRESH
```

Do not let Agent pick.

---

## Task 16 — Materialize DBOS dependency routing

**Modify:**

```text
pnpm-workspace.yaml
pnpm-lock.yaml
Architecture_Corpus/references/dependency-routing.json
```

Catalog:

```yaml
"@dbos-inc/dbos-sdk": 4.26.10
```

Routing:

```text
durable.execution.packages:
  ["@dbos-inc/dbos-sdk"]

workqueue.mechanics.packages:
  ["@dbos-inc/dbos-sdk"]
```

Keep provider decision:

```text
DBOS 4.x ADOPTED
```

Do not rewrite qualification role selection.

Add no competing queue package.

Run:

```bash
pnpm install
pnpm check:dependencies
pnpm toolchain:check
pnpm typecheck
pnpm tsc6
```

Commit:

```text
build: materialize adopted DBOS durable execution route
```

---

## Task 17 — Add dedicated durable-execution database principal

**Modify:**

```text
packages/host-ownership/src/contracts.ts
packages/host-ownership/src/bootstrap-admin.ts
packages/host-ownership/src/bootstrap-admin.test.ts
packages/host-ownership/src/ownership-schema.ts
packages/host-ownership/src/host-ownership.integration.test.ts
packages/host-ownership/src/index.ts
packages/host-ownership/README.md

packages/bootstrap-runtime/src/bootstrap-key-provider.ts
packages/bootstrap-runtime/src/bootstrap-key-provider.test.ts
packages/bootstrap-runtime/src/host-ownership-handoff.ts
packages/bootstrap-runtime/src/host-ownership-handoff.integration.test.ts
packages/bootstrap-runtime/src/managed-host.ts
packages/bootstrap-runtime/src/test-support/canonical-postgres.ts
packages/bootstrap-runtime/README.md
```

Add constant:

```text
HOST_DURABLE_EXECUTION_ROLE =
  "heptalogos_durable_execution"
```

Role attributes:

```yaml
LOGIN: true
SUPERUSER: false
CREATEDB: false
CREATEROLE: false
REPLICATION: false
BYPASSRLS: false
INHERIT: true
CONNECTION LIMIT: -1
membership_in_heptalogos_owner: false
```

Database ACL:

```text
CONNECT: yes
CREATE database/schema: no
heptalogos schema/table rights: none
```

Add credential purpose:

```text
private-postgres-durable-execution-role
```

Extend both credential seams:

```text
BootstrapAdminPasswordProvider.withDurableExecutionPassword(...)
BootstrapKeyProvider.withPrivatePostgresDurableExecutionPassword(...)
```

The `passwordProvider(...)` adapter in `host-ownership-handoff.ts` must bind the
new purpose to both provisioning and later managed-Host authority materialization.

Add Host authority:

```ts
interface HostDurableExecutionAuthority {
  installationId;
  instanceId;
  bootId;
  continuityEpochId;
  token;
  target: {
    host: "127.0.0.1";
    port: number;
    database: "heptalogos";
    user: "heptalogos_durable_execution";
  };
  signal: AbortSignal;
  assertActive(): void;
  withDurableExecutionDatabasePassword<T>(...): Promise<T>;
}
```

This authority grants engine DB connectivity only; it does not grant product mutation Authority.

`BootstrapManagedHostContext` gains:

```text
durableExecution: HostDurableExecutionAuthority
```

`createManagedHostContext(...)` receives explicit durable-execution authority
options alongside the existing persistence options and wraps them with the same
managed-Host terminal fence. `host-ownership-handoff.ts` constructs that option
from `BootstrapKeyProvider`; it does not import `@heptalogos/durable-execution`.

Bootstrap closed-world role inspection must now expect exactly the new protected role as part of current truth.

No compatibility branch for four-role databases.

Commit:

```text
feat: isolate durable execution database authority
```

---

## Task 18 — Create DurableExecution package skeleton and vendor CLI resolver

**Create:**

```text
packages/durable-execution/README.md
packages/durable-execution/package.json
packages/durable-execution/project.json
packages/durable-execution/tsconfig.json
packages/durable-execution/tsconfig.build.json

packages/durable-execution/src/contracts.ts
packages/durable-execution/src/dbos-package.ts
packages/durable-execution/src/dbos-package.test.ts
packages/durable-execution/src/problems.ts
packages/durable-execution/src/index.ts
```

**Modify navigation:**

```text
packages/README.md
packages/INDEX.md
```

Dependencies:

```text
@dbos-inc/dbos-sdk
@heptalogos/foundation-contracts
@heptalogos/host-ownership
@heptalogos/work-queue
pg
execa
```

The package resolver must:

1. resolve `@dbos-inc/dbos-sdk` public package entry;
2. locate its package root;
3. read package metadata;
4. assert package name exact;
5. assert version exact `4.26.10`;
6. resolve absolute `dist/src/cli/cli.js`;
7. require it to be a regular file.

No `npx`, PATH lookup, shell, or globally installed DBOS.

Commit:

```text
feat: create bounded DBOS durable execution adapter
```

---

## Task 19 — Implement controlled DBOS system-schema provisioner

**Create:**

```text
packages/durable-execution/src/dbos-schema-provisioner.ts
packages/durable-execution/src/dbos-schema-provisioner.test.ts
```

Contract:

```ts
interface DurableExecutionSchemaProvisioner {
  ensureCurrent(
    authority: HostCanonicalMigrationAuthority
  ): Promise<void>;
}
```

Execution:

```text
authority.assertCurrent()
resolve exact DBOS CLI
authority.withMigrationDatabasePassword(...)
  launch Node CLI subprocess with:
    safe passwordless URL in argv
    PGPASSWORD in sanitized environment
    --schema dbos
    --app-role heptalogos_durable_execution
    no shell
    bounded timeout
    AbortSignal bound to migration authority
check exit 0
authority.assertCurrent()
verify dbos schema exists/current
verify durable role grants
```

Subprocess Problem normalization must never copy arbitrary stderr unboundedly into a durable Problem. Store bounded sanitized diagnostics only.

Do not call:

```text
runMigrations:true
npx dbos schema
dbos reset
```

Do not grant durable role access to `heptalogos.*`.

Add an integration path to existing canonical initialization composition:

```text
canonical product schema initializer
→ DBOS engine schema provisioner
→ normal Host exposure
```

`bootstrap-runtime` remains orchestrator only through callback/composed initializer; it does not own DBOS semantics.

Required real-PG test:

- fresh DB: canonical + dbos schemas created in authorized window;
- restart: current DBOS schema accepted idempotently;
- durable role cannot SELECT canonical product WorkItem/activity tables;
- durable role can operate required DBOS tables;
- migration role is required for DBOS schema change;
- normal durable role cannot DDL;
- failed vendor migration blocks normal Host admission;
- password never appears in argv/log snapshot.

Commit:

```text
feat: provision DBOS schema under migration authority
```

---

## Task 20 — Implement caller-owned DBOS pool and DurableExecution lifecycle

**Create:**

```text
packages/durable-execution/src/dbos-pool.ts
packages/durable-execution/src/dbos-pool.test.ts
packages/durable-execution/src/dbos-runtime.ts
packages/durable-execution/src/dbos-runtime.test.ts
```

DurableExecution options are explicit:

```ts
interface DurableExecutionOptions {
  applicationName: "heptalogos";
  durableCodeVersion: DurableCodeVersion;
  systemPoolSize: number;
  systemPollingConcurrency: number;
  maxConcurrentQueueDispatches: number;
  queueProfiles: readonly WorkQueueProfileDefinition[];
  onBackgroundError(error: unknown): void;
}
```

No hidden numeric defaults in Heptalogos adapter. Test fixtures supply explicit values.

DBOS config:

```text
name = "heptalogos"
applicationVersion = durableCodeVersion
executorID = stable encoding of current BootId
systemDatabaseSchemaName = "dbos"
systemDatabasePool = caller-owned dedicated pool
runMigrations = false
runAdminServer = false
```

Explicitly configure DBOS logging through a bounded adapter; do not let raw DBOS console logs become Evidence.

Lifecycle:

```text
CREATED
→ launch:
     setConfig
     register static workflow/step
     DBOS.launch
     register/verify queue profiles
     OPEN
→ closeAdmission:
     QUIESCING
→ settleAndClose:
     DBOS.shutdown
     close caller-owned pool
     CLOSED
```

Launch failure:

```text
admission never opens
pool/DBOS cleanup attempted
canonical WorkItems remain untouched
```

Commit:

```text
feat: launch least-privilege DBOS runtime
```

---

## Task 21 — Register exactly one static durable WorkItem workflow

Static workflow name:

```text
dispatchWorkItem
```

Conceptual shape:

```text
dispatchWorkItem(workItemId, dispatchRevision)
→ DBOS.runStep(
     executeWorkAttempt(workItemId, dispatchRevision)
  )
→ WorkAttemptExecutor
```

Registration happens before `DBOS.launch()`.

No dynamic Extension/WorkHandler workflow registration.

The workflow argument contains only:

```text
WorkItemId
dispatchRevision
```

It does not contain canonical payload, config material, Secret, handler code,
PackageGeneration, or full ExecutionContext. The attempt reloads canonical
truth.

DBOS workflow/step output is also deliberately non-authoritative and minimal:
only an `EngineAttemptDisposition` code plus WorkItemId/revision may be stored
under `dbos.*`. Do not copy the canonical WorkItem payload or domain outcome into
DBOS workflow output. Arbitrary handler exceptions are normalized before
crossing the DBOS step boundary so DBOS does not become a second long-lived
store of sensitive application error material.

`DurableDispatchPort` implementation:

```text
request
→ verify OPEN admission
→ deterministic workflow ID
→ select registered queue profile
→ DBOS.startWorkflow(
     workflowID,
     queueName,
     priority,
     delaySeconds,
     queuePartitionKey,
     explicit applicationVersion
  )
```

`notBefore` projection uses the DBOS enqueue `delaySeconds` mechanic derived
from TimeService (`ceil(remainingMs / 1000)`, zero when already due). Canonical
`notBefore` remains Authority and WorkAttemptExecutor re-checks it immediately
before claiming RUNNING; an early engine wake never invokes the handler and is
converted through the canonical RETRY_WAIT/new-revision path defined above.

Same request/revision can be sent repeatedly.

No DBOS queue dedup ID is necessary for product correctness; deterministic workflow ID owns engine attempt identity.

Commit:

```text
feat: project WorkItems through static DBOS dispatcher
```

---

## Task 22 — Register and verify DBOS queue profiles

After launch:

```text
for each expected WorkQueueProfileDefinition:
  DBOS.registerQueue(name, {
    concurrency,
    workerConcurrency,
    rateLimit?,
    priorityEnabled,
    partitionQueue,
    minPollingIntervalMs,
    onConflict: "never_update"
  })

  read back
  compare exact projected mechanics
  mismatch -> fail closed
```

No runtime mutation API exported from DurableExecution in H3A.

Queue profiles are explicit composition/config input; DBOS persisted rows are projection.

Qualification covers:

```text
concurrency
workerConcurrency
priority
partition
rate limit
```

only if the profile under test actually configures those mechanics.

Do not claim ResourceGovernor.

Commit:

```text
feat: bind queue profiles to DBOS mechanics
```

---

## Task 23 — Integrate WorkQueue reconciliation with real DurableExecution

Modify H3A-1 system composition tests and WorkQueue tests.

Required real DBOS/PostgreSQL cases:

### D1 — committed WorkItem, lost immediate engine dispatch

Commit WorkItem; suppress dispatch call; later anti-entropy projects it; handler completes.

### D2 — duplicate same revision

Project same request twice; same DBOS workflow identity; one logical handler execution; one canonical terminal outcome.

### D3 — delayed notBefore

WorkItem projected with DBOS delay; handler cannot run before canonical due Instant within bounded clock tolerance.

### D4 — retry creates a new revision

Attempt classifies explicit retry; canonical `RETRY_WAIT`; due wake increments revision; new DBOS workflow ID; old ID remains old attempt.

### D5 — exact generation A/B

Same H3A-1 pin test but through real DBOS.

### D6 — dedicated role isolation

DBOS runtime works while its role remains unable to read/write `heptalogos.work_item` directly.

The WorkAttemptExecutor accesses product truth through normal Persistence role separately.

### D7 — queue profile mismatch

Persisted DBOS profile differs from expected; DurableExecution fails closed rather than overwrite.

### D8 — missing/outdated dbos schema

Normal `runMigrations:false` launch fails closed.

No runtime auto-repair.

Commit:

```text
test: qualify DBOS WorkItem projection
```

---

## Task 24 — Process-level crash/recovery matrix

Use a subprocess because DBOS runtime is process-global/singleton-like and process crash semantics cannot be proven by an in-process mock.

Keep process qualification under:

```text
packages/bootstrap-runtime
```

where real private PostgreSQL fixture already exists.

**Create current semantic test files, not milestone-named production hooks:**

```text
packages/bootstrap-runtime/src/durable-work-recovery.integration.test.ts
packages/bootstrap-runtime/src/test-support/durable-work-child.ts
```

**Modify:**

```text
packages/bootstrap-runtime/project.json
```

Add a dedicated target such as:

```text
test:durable-recovery-process
```

that depends on build.

Use the existing adopted subprocess mechanics/execa route. No raw shell.

### P1 — crash between canonical commit and engine dispatch

```text
child:
  start authentic Host
  commit PENDING WorkItem
  signal parent WORK_COMMITTED
  block before DurableDispatchPort dispatch

parent:
  independently verify WorkItem exists
  kill child

restart child:
  same product DB
  start DBOS/reconciler
  initial scan finds PENDING
  item completes
```

### P2 — crash after terminal product commit before DBOS step checkpoint

Deterministic **test-only** barrier:

```text
child:
  static DBOS attempt executes
  WorkAttemptExecutor commits SUCCEEDED
  fixture signals parent TERMINAL_COMMITTED
  fixture blocks before DBOS step callback returns

parent:
  independently verify terminal WorkItem
  kill child

restart:
  same DurableCodeVersion
  DBOS recovers same attempt
  WorkAttemptExecutor sees canonical terminal
  returns TERMINAL_REPLAY
  WorkHandler logical execution counter remains one
```

The barrier is test-support only and uses semantic event names; no production H3A hook.

### P3 — crash after RUNNING claim before handler outcome

Restart same version:

- attempt resumes;
- exact handler is restartable;
- canonical revision/attempt fence remains valid;
- no duplicate terminal outcome.

### P4 — applicationVersion isolation

Version A starts nonterminal attempt; process crashes.

Version B process:

```text
must not recover A as B
```

Version A process:

```text
may recover A
```

This proves version axis only; no Product Update/blue-green implementation.

### P5 — Signal connection loss plus process restart

Work survives even when notification is not observed.

### P6 — Host lease loss during attempt

Terminate authentic Host lease while handler is outside transaction.

Tx B must fail product commit. After valid Host restart, canonical state is reconciled conservatively; no fabricated success.

For a RUNNING item whose process died and whose H3A handler has no external effects:

```text
same revision recovery may re-enter restartable handler
```

provided exact generation exists and cancellation/supersession does not fence it.

Commit:

```text
test: prove process-level durable work recovery
```

---

## Task 25 — Authentic Host shutdown / quiescence integration

Extend existing:

```text
packages/bootstrap-runtime/src/runtime-host-lifecycle.integration.test.ts
```

Dev-only composition:

```text
ManagedHost
Persistence
ExecutionLineage
RuntimeKernel
Signal
WorkQueue
DurableExecution
```

Shutdown ordering:

```text
stop admission of new consequential work
→ WorkQueue close creation/dispatch admission as appropriate
→ stop/settle anti-entropy
→ DurableExecution close dispatch admission
→ quiesce Runtime Kernel / WorkHandlers
→ preserve canonical pending/waiting obligations
→ DBOS shutdown
→ caller-owned DBOS pool close
→ existing Host reverse handoff / PostgreSQL stop
```

Do not terminalize pending WorkItems merely to shut down.

Required tests:

- planned PostgreSQL stop waits for durable execution shutdown;
- Host terminality closes H3 admission;
- old WorkHandler leases are fenced;
- DBOS pool no longer usable after close;
- WorkItems remain for next boot;
- bootstrap-runtime production import boundary remains clean.

Commit:

```text
test: integrate durable execution with Host lifecycle
```

---

## Task 26 — Queue pressure/admission mechanics qualification

This is **not** H8 ResourceGovernor.

Use deterministic WorkAdmissionPort + explicit DBOS profile.

Prove:

```text
before create:
  REJECT_NEW_WORK -> no durable row

after commit:
  DELAY/THROTTLE -> item retained

DBOS:
  concurrency/rate/partition mechanics limit execution as configured

queue priority:
  changes engine scheduling order only
  does not bypass admission
  does not change WorkItem Authority
```

Record:

```text
real_resource_governor_pressure_snapshot: NOT_RUN
```

Do not instantiate a fake PressureSnapshot and call the Foundation feature complete.

Commit:

```text
test: qualify durable admission and queue pressure mechanics
```

---

## Task 27 — H3A-2 architecture/hygiene audit

Run:

```bash
rg -n '@dbos-inc/dbos-sdk' packages
rg -n 'DBOS\.registerWorkflow|DBOS\.registerStep|DBOS\.registerQueue' packages
rg -n 'runMigrations|runAdminServer' packages/durable-execution
rg -n 'heptalogos_durable_execution' packages
rg -n 'GenericContribution|ContributionManager|legacy|obsolete|shim|fallback' \
  packages/work-queue packages/durable-execution packages/signal packages/runtime-kernel
rg -n 'EffectOperation|external-effect-uncertain|network\.request' \
  packages/work-queue packages/durable-execution packages/signal
rg -n 'child_process' packages/work-queue packages/durable-execution packages/signal
```

Required semantic result:

```yaml
raw_dbos_import_outside_durable_execution_production: 0
dynamic_workhandler_dbos_registration: 0
second_queue_scheduler: 0
normal_dbos_run_migrations_true: 0
durable_role_heptalogos_table_grants: 0
h3a_external_effect_path: 0
development_history_compatibility_behavior: 0
new_nested_agents: 0
milestone_identity_in_current_executable_source: 0
```

Do not make grep empty by deleting legitimate architecture words from docs/tests.

---

## Task 28 — Full Ubuntu real qualification

Exact environment:

```yaml
OS: Ubuntu/Linux x86_64
Node: 24.19.0
pnpm: 11.22.0
TypeScript: 7.0.2 primary
TS6 lane: 6.0.2
PostgreSQL: 18.6 explicit private toolchain
DBOS: 4.26.10 exact
```

Run all affected package suites.

Expected new Nx targets should make this explicit:

```bash
pnpm nx run signal:test
pnpm nx run work-queue:test
pnpm nx run durable-execution:test

pnpm nx run bootstrap-runtime:test:integration
pnpm nx run bootstrap-runtime:test:durable-recovery-process
```

Plus:

```bash
pnpm nx run foundation-contracts:test
pnpm nx run host-ownership:test
pnpm nx run host-ownership:test:integration
pnpm nx run canonical-schema:test
pnpm nx run persistence:test
pnpm nx run execution-lineage:test
pnpm nx run runtime-kernel:test

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

No skipped real PostgreSQL/DBOS/process target is PASS.

Record actual test counts only after observing them.

---

## Task 29 — H3A-2 / H3A qualification ledger

Update:

```text
Architecture_Corpus/qualification/results/Q-ASYNC-01.md
Architecture_Corpus/qualification/results/qualification-status.json
docs/roadmap/development-roadmap.md
```

Expected keys, only if proven:

```yaml
h3a2_exact_dbos_4_26_10: PASS
h3a2_dedicated_engine_principal: PASS
h3a2_dbos_schema_migration_authority: PASS
h3a2_normal_runtime_no_ddl: PASS
h3a2_static_dispatcher_real_dbos: PASS
h3a2_same_revision_engine_idempotency: PASS
h3a2_delayed_not_before: PASS
h3a2_retry_new_revision: PASS
h3a2_queue_profile_projection: PASS
h3a2_application_version_isolation: PASS
h3a2_lost_predispatch_process_recovery: PASS
crash_after_terminal_commit: PASS
h3a2_host_loss_fence: PASS
h3a2_host_shutdown_settlement: PASS
h3a2_ubuntu_real_postgres_18_6: PASS

real_config_pinned_revision_resolution: NOT_RUN
real_resource_governor_pressure_snapshot: NOT_RUN
h3a_windows_real_dbos: NOT_RUN
h3a_macos_real_dbos: NOT_RUN
h3_source_less_durable_execution: NOT_RUN
h3_service_headless_durable_execution: NOT_RUN
h3_final_cross_platform_ci: NOT_RUN
```

`Q-ASYNC roleDecision` remains:

```text
ADOPTED
```

unless a reproducible hard blocker requires explicit reopening.

Roadmap pre-review:

```yaml
H3: OPEN
H3A: IMPLEMENTATION_COMPLETE_AWAITING_REVIEW
H3A_1: CLOSED
H3A_2: IMPLEMENTATION_COMPLETE_AWAITING_REVIEW
H3B: NOT_ELIGIBLE
H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: NOT_ELIGIBLE
```

Commit:

```text
docs: record H3A durable execution qualification
```

---

## Task 30 — H3A-2 candidate freeze, external review, squash merge

Candidate title:

```text
H3A-2: DBOS durable execution and crash recovery
```

PR body must state:

- exact DBOS 4.26.10;
- separate `heptalogos_durable_execution` role;
- DBOS vendor schema provisioned under migration Authority;
- normal DBOS runtime `runMigrations:false`;
- static WorkItem dispatcher;
- deterministic DispatchAttemptId;
- real process crash/restart;
- H3A only, no EffectOperation;
- H4 real CONFIG_PINNED remains NOT_RUN;
- H8 real ResourceGovernor remains NOT_RUN;
- H3 final cross-platform/product packaging gates remain NOT_RUN.

No commit SHA.

Candidate freeze requires:

```text
pnpm verify PASS
all Ubuntu H3A-2 real tests PASS
process crash matrix PASS
changed-path boundary audit PASS
no behavior TODO/TBD
```

External Independent Review applies exactly as in H3A-1.

After PASS and no candidate/base mutation:

```text
squash merge
```

No final H3 3-platform CI.

---

## Task 31 — H3A final post-merge truth reconciliation

Fresh docs/evidence-only branch from merged master.

**Move:**

```text
docs/plans/active/foundation/h3a-durable-obligation-signal-spine.md
→
docs/plans/completed/foundation/h3a-durable-obligation-signal-spine.md
```

**Modify:**

```text
docs/plans/README.md
docs/roadmap/development-roadmap.md
Architecture_Corpus/qualification/results/Q-ASYNC-01.md
Architecture_Corpus/qualification/results/qualification-status.json
```

Final living truth:

```yaml
H2: CLOSED
H3: OPEN

H3A: CLOSED
H3A_1: CLOSED
H3A_2: CLOSED

H3B: ELIGIBLE

H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: NOT_ELIGIBLE

activeImplementationPlan: NONE
```

Record:

```yaml
h3a1_independent_review: PASS
h3a1_merge: PASS
h3a2_independent_review: PASS
h3a2_merge: PASS
h3a_post_merge_reconciliation: PASS
```

Residual truth remains:

```yaml
real_config_pinned_revision_resolution: NOT_RUN
real_resource_governor_pressure_snapshot: NOT_RUN
h3_windows_real_dbos: NOT_RUN
h3_macos_real_dbos: NOT_RUN
h3_source_less_durable_execution: NOT_RUN
h3_service_headless_durable_execution: NOT_RUN
h3_final_cross_platform_ci: NOT_RUN
```

Run:

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:hygiene
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check
pnpm format:check
pnpm verify
```

Open docs/evidence-only reconciliation PR and squash merge.

No new behavior Independent Review solely for recording already completed closure facts.

---

# 10. Required H3A Qualification Matrix

Every `REQUIRED` row must be PASS before H3A closes.

| ID | Property | Stage | Evidence |
| --- | --- | --- | --- |
| A01 | WorkItem is canonical product truth | H3A-1 | real PG |
| A02 | exact generation-pinned WorkHandler | H3A-1 | Runtime + real Host |
| A03 | same revision -> same attempt identity | H3A-1 | deterministic tests + real projection |
| A04 | stale revision cannot commit | H3A-1 | real PG CAS |
| A05 | Signal loss/reconnect cannot lose work | H3A-1 | killed listener + rescan |
| A06 | lost immediate dispatch remains recoverable | H3A-1 | anti-entropy |
| A07 | cancellation/supersession fences stale success | H3A-1 | real PG + handler |
| A08 | nonterminal dedup is race-safe | H3A-1 | concurrent real PG |
| A09 | admission cannot erase committed obligation | H3A-1 | deterministic port + real row |
| A10 | durable lineage crosses async handoff | H3A-1 | causal graph assertions |
| A11 | exact DBOS 4.26.10 is the only engine | H3A-2 | package/runtime evidence |
| A12 | dedicated DBOS principal has no product-table rights | H3A-2 | ACL qualification |
| A13 | DBOS schema changes only under migration Authority | H3A-2 | fresh/restart real PG |
| A14 | normal DBOS runtime performs no DDL | H3A-2 | runMigrations=false + fail-closed |
| A15 | static dispatcher + DBOS Queue works | H3A-2 | real DBOS |
| A16 | duplicate same-revision engine dispatch is idempotent | H3A-2 | real DBOS |
| A17 | retry/wakeup creates new revision before new engine attempt | H3A-2 | real DBOS + PG |
| A18 | notBefore uses durable engine delay without changing Authority | H3A-2 | real DBOS |
| A19 | applicationVersion is distinct recovery axis | H3A-2 | process A/B |
| A20 | crash after WorkItem commit before engine dispatch recovers | H3A-2 | process kill |
| A21 | crash after terminal commit before DBOS checkpoint does not re-run logical handler | H3A-2 | deterministic process barrier |
| A22 | Host loss prevents terminal product commit | H3A-2 | authentic lease kill |
| A23 | planned shutdown settles DBOS before PG handoff | H3A-2 | authentic Host |
| A24 | queue profile mechanics are projection, not Authority | H3A-2 | DBOS profile readback |
| A25 | no consequential external effect path exists | both | static audit + API surface |

Residual/not H3A closure requirements:

| Property | State after H3A |
| --- | --- |
| real CONFIG_PINNED ConfigurationRevision resolution | NOT_RUN / H4 |
| real PressureSnapshot + ResourceGovernor | NOT_RUN / H8 |
| Windows real DBOS product qualification | NOT_RUN |
| macOS real DBOS product qualification | NOT_RUN |
| source-less durable execution | NOT_RUN |
| installed service/headless durable execution | NOT_RUN |
| H3 final cross-platform CI | NOT_RUN / H3-S |
| EffectOperation uncertainty | NOT_RUN / H3B |

---

# 11. Failure Semantics

## WorkHandler unavailable

```text
PENDING
→ WAITING_DEPENDENCY
```

No latest-generation fallback.

When exact generation appears:

```text
WAITING_DEPENDENCY
→ PENDING
dispatchRevision += 1
```

---

## Handler exception

Unknown exception:

```text
FAILED / permanent
```

unless an explicit classifier proves a specific allowed retry class.

No catch-all retry.

---

## Dispatch adapter unavailable

```text
canonical WorkItem unchanged/recoverable
reconciler retries projection later with same revision/attempt ID
```

---

## Signal unavailable

```text
latency increases
anti-entropy rescan remains correctness path
```

---

## DBOS schema missing/behind

```text
normal DurableExecution launch fails
normal Host must not claim DurableExecution READY
```

Schema is repaired only under migration Authority.

---

## DBOS queue profile mismatch

```text
DurableExecution not READY
```

Do not overwrite persisted mechanics silently.

---

## Host ownership lost

```text
close new admission
abort resident handler cooperatively
Persistence fence prevents product commit
DBOS engine state does not create product Authority
```

---

## Crash after canonical terminal commit

```text
terminal WorkItem is Authority
DBOS replay returns terminal replay/no-op
handler not logically executed again
```

---

# 12. STOP / PLAN_GAP Conditions

The development Agent must stop rather than decide if any of these occurs.

1. master entry state moved materially;
2. a normative Corpus semantic conflict appears that this plan did not resolve;
3. exact DBOS 4.26.10 is no longer current stable at H3A-2 start;
4. DBOS 4.26.10 has a reproducible hard blocker for static workflow/Queue/applicationVersion/schema role;
5. correctness would require DBOS preview;
6. correctness would require Temporal/BullMQ/Agenda/custom second queue;
7. Runtime Kernel would need to own WorkItem/DBOS/retry;
8. WorkQueue would need raw DBOS public types;
9. exact generation pin would require building the full Extension Package Manager;
10. a generic Contribution framework becomes necessary for correctness rather than convenience;
11. H3A requires a consequential external effect;
12. normal DBOS runtime would need DDL rights;
13. vendor schema cannot be provisioned inside the existing migration authority window;
14. DBOS migration mechanics would require credentials in argv or persistent plaintext file;
15. dedicated DBOS principal cannot run the exact engine with vendor minimum grants;
16. bootstrap-runtime production code would need to import H3 normal-runtime packages;
17. a permanent new product composition package becomes necessary;
18. WorkItem correctness would depend on DBOS status or Signal payload;
19. a retry policy cannot be classified explicitly;
20. process crash point cannot be deterministically armed/proven;
21. real PG/DBOS tests are skipped but a PASS claim is proposed;
22. a check can pass only by adding an ignore/baseline/suppression loophole;
23. a development-history compatibility shim/migration/reader is proposed;
24. an H3B EffectOperation implementation appears in the H3A candidate;
25. H4/H8 implementation is pulled in just to make H3A fields look “complete”.

Return:

```text
PLAN_GAP
```

for architecture/semantic/scope contradiction.

Return:

```text
BLOCKED
```

for missing environment/evidence or failed required qualification.

Include the exact failing evidence and the narrowest decision that must be made.

---

# 13. Prohibited Shortcuts

```text
NO raw DBOS workflow registration by Extension/WorkHandler
NO DBOS workflow status as WorkItem Authority
NO DBOS applicationVersion = PackageGeneration
NO DBOS applicationVersion = Git SHA
NO source-hash governance manifest
NO runMigrations:true in normal Host
NO DBOS superuser/runtime product role
NO durable DB role access to heptalogos product tables
NO npx/shell for product schema migration
NO credential in argv
NO notification payload as durable truth
NO EventEmitter/in-memory bus as Signal durability
NO second queue/scheduler
NO transaction spanning WorkHandler execution
NO catch-all automatic retry
NO latest-generation fallback
NO fake CONFIG_PINNED ref
NO fake ResourceGovernor
NO H3A external effect
NO appended PRE_PRODUCTION history migration
NO legacy reader/shim/alias/dual writer
NO per-package AGENTS.md
NO ordinary GitHub approval as Independent Review
NO commit SHA in plan/PR/human qualification additions
NO Windows/macOS/source-less claim inferred from Ubuntu
```

---

# 14. Package README / Navigation Requirements

Every new package README must have the repository-standard sections:

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

Specific “Does not own” statements:

## signal

```text
does not own WorkItem, queue scheduling, canonical payload, EventBus semantics
```

## work-queue

```text
does not own DBOS, EffectOperation, ConfigurationService, ResourceGovernor,
Runtime generation lifecycle
```

## durable-execution

```text
does not own WorkItem truth, WorkHandler selection semantics,
product mutation, Effect truth, Management Authority
```

Update:

```text
packages/README.md
packages/INDEX.md
```

No nested AGENTS.

---

# 15. Recommended Commit Envelope

H3A-1:

```text
docs: activate H3A durable obligation plan
feat: add durable work identities
feat: bind contribution origin to execution lineage
feat: materialize current durable work schema
feat: add generation-pinned WorkHandler runtime seam
feat: add PostgreSQL signal hint service
feat: define durable WorkItem semantics
feat: persist Host-fenced WorkItem authority
feat: govern durable work creation and admission
feat: reconcile canonical work into dispatch projection
feat: execute WorkItems through generation and revision fences
test: qualify canonical durable work on real PostgreSQL
docs: record H3A-1 canonical work qualification
```

H3A-2:

```text
build: materialize adopted DBOS durable execution route
feat: isolate durable execution database authority
feat: create bounded DBOS durable execution adapter
feat: provision DBOS schema under migration authority
feat: launch least-privilege DBOS runtime
feat: project WorkItems through static DBOS dispatcher
feat: bind queue profiles to DBOS mechanics
test: qualify DBOS WorkItem projection
test: prove process-level durable work recovery
test: integrate durable execution with Host lifecycle
test: qualify durable admission and queue pressure mechanics
docs: record H3A durable execution qualification
```

Exact count may vary for tightly coupled TDD changes.

If implementation requires a materially broader commit class, stop; do not hide scope expansion in “refactor”.

---

# 16. Candidate Self-Review

Before H3A-1 Ready:

- [ ] WorkItem exists independently of DBOS.
- [ ] Signal loss cannot lose work.
- [ ] same revision gives same attempt ID.
- [ ] stale revision cannot commit.
- [ ] missing generation never falls forward.
- [ ] cancellation/supersession wins stale result.
- [ ] WorkAdmissionPort is mandatory.
- [ ] no fake config pin exists.
- [ ] no DBOS dependency exists yet.
- [ ] no external effect API exists.

Before H3A-2 Ready:

- [ ] exact DBOS 4.26.10 used.
- [ ] dependency routing materialized.
- [ ] DBOS has dedicated role.
- [ ] durable role cannot access product tables.
- [ ] vendor schema provisioned only under migration Authority.
- [ ] normal launch runMigrations=false.
- [ ] no npx/shell/credential argv.
- [ ] static workflow only.
- [ ] queue registration after launch.
- [ ] queue profile mismatch fails closed.
- [ ] DBOS applicationVersion explicit.
- [ ] process crash after terminal commit actually executed.
- [ ] same-version recovery works.
- [ ] different version does not steal recovery.
- [ ] Host loss prevents product commit.
- [ ] shutdown settles engine before PostgreSQL handoff.
- [ ] no EffectOperation.
- [ ] full `pnpm verify` passed after final behavior mutation.

---

# 17. H3A Closure Handoff

After the final post-merge reconciliation, current truth must be:

```text
H2 CLOSED

H3 OPEN
  H3A CLOSED
    H3A-1 CLOSED
    H3A-2 CLOSED
  H3B ELIGIBLE
  H3-S NOT_ELIGIBLE

Active Plan NONE
```

The next plan is then:

```text
H3B — Consequential Effect & Uncertainty
```

H3B must consume, not reopen without evidence:

```text
WorkItem Authority
dispatchRevision
DispatchAttemptId
generation-pinned WorkHandler
LineageContextRef
WorkAdmissionPort boundary
Signal rescan model
DBOS static dispatcher
dedicated DBOS principal/schema boundary
DurableCodeVersion axis
terminal replay semantics
```

H3B adds:

```text
EffectOperation
EffectFence
prepared -> dispatching -> terminal/uncertain
external request identity
no-auto-retry uncertainty
provider reconciliation
crash after dispatching
WorkItem/Effect outcome coupling
```

H3-S remains mandatory after H3 functional completion and must perform the project-wide current-tree/history/compatibility cleanup defined by `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`.

---

# 18. Final Executor Rule

The purpose of this plan is not to tell an Agent “roughly what to build.”

The Agent is expected to make only local, trivial coding choices such as:

```text
helper extraction
test fixture variable naming
equivalent private function decomposition
formatting
```

The Agent must **not** decide:

```text
whether WorkItem or DBOS owns truth
whether to add another queue
whether to add CONFIG_INDEPENDENT
whether pinned config can be faked
whether to create a generic Contribution runtime
whether to reuse heptalogos_runtime for DBOS
whether DBOS may run migrations on normal launch
whether DBOS version should change
whether queue mismatch should overwrite
whether retry is safe
whether a missing generation may fall forward
whether to add EffectOperation
whether to add compatibility handling
whether to modify normative Corpus
whether to broaden H3A
```

Those decisions are already made here.

If implementation reality invalidates one of them:

```text
STOP
→ preserve evidence
→ report PLAN_GAP
→ return decision to Architecture
```

Do not improvise.
