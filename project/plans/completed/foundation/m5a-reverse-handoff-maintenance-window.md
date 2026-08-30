# Foundation M5A Reverse Handoff & PostgreSQL Maintenance Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: execute task-by-task with TDD. Use a fresh review boundary between tasks that change Authority semantics. Do not widen this milestone into M5B abandoned-lock Recovery, H2A Persistence, or H2B Runtime Kernel work. Every behavior-bearing completion claim must be tied to actually executed evidence.

**Status:** ACTIVE — the PONR close-rejection correction candidate is recorded; re-review and final cross-platform CI remain pending.

## Corrective pass — independent review corrections (2026-08-22)

```text
Independent review @ 65a56c7a8906e49658d8a304d0903668d8f64228 = REQUEST_CHANGES

RC-1 MaintenanceJournal partial target ownership acceptance
RC-2 stale old-Host capability after PONR / RECOVERY_REQUIRED
RC-3 Scenario F did not exercise live PostgreSQL Host-lease backend death

Correction status = COMPLETE through Task 5
corrected behavior candidate = 9fd68d4656921c344a0ef637d31e91f127d53eaf
RC-1 = PASS
RC-2 = PASS
RC-3 = PASS on Linux PostgreSQL 18.6
final CI = NOT_AUTHORIZED
merge = NOT_AUTHORIZED
```

This corrective pass preserves the fixed M5A Authority semantics, PONR, and
two-phase `BOOTSTRAP_RELEASE_ARMED` finalization. It does not widen scope into
M5B recovery, force-unlock, or a generic Recovery framework.

### Corrective pass 2 — PONR old-Host close rejection observation (2026-08-22)

```text
Independent review @ 001ef97f070ecf3a6993c6e129a26de1925862e7 = REQUEST_CHANGES

New blocker: the verified-revocation PONR path started old Host close without
an immediate rejection observer, allowing a fast close Promise rejection to
become an unhandled rejection while HOST_TOKEN_REVOKED journaling was delayed.

Correction status = COMPLETE locally through regression and qualification gates
corrected behavior candidate = f9f105c47a8559d386fabd761d026441a8dd2764
PONR close rejection observer = PASS
RECOVERY_REQUIRED-before-close-completion ordering = PASS
re-review = NOT_RUN
final CI = NOT_AUTHORIZED
merge = NOT_AUTHORIZED
```

This second corrective pass keeps the old managed Host terminal at retirement,
installs an operation-local rejection observer synchronously when retirement
starts, persists `RECOVERY_REQUIRED` while bootstrap ownership remains held,
and only then awaits the observed close result. It does not change PONR,
Scenario F, or the M5A/M5B boundary.

**Goal:** Starting from a live, M4-established normal Host that owns the dedicated PostgreSQL advisory lease and current `HostOwnershipToken`, establish the reverse `Host → bootstrap` Authority handoff, enter a bounded PostgreSQL maintenance window without an ownership gap, support controlled private-PostgreSQL stop or same-cluster restart, and reacquire a fresh Host lease/token before normal Host operation can resume.

**Architecture:** `@heptalogos/bootstrap-runtime` remains the orchestration/Authority owner. It acquires bootstrap ownership **before** any normal Host Authority is revoked, persists a crash-safe `MaintenanceJournal`, obtains an explicit quiescence proof, revokes the current fence token through a bootstrap-admin PostgreSQL transaction, closes the old Host lease, then grants an `@heptalogos/private-postgres` maintenance controller only while the stronger reverse-handoff control guard is valid. Restart resumes by validating the same private cluster, obtaining a new dedicated Host lease, publishing a **fresh** token, and only then releasing bootstrap ownership. Low-level PostgreSQL mechanics remain in `host-ownership` / `private-postgres`; raw `pg`, `pg_ctl`, XState, and lockfile objects do not leak into stable Host contracts.

**Tech Stack:** Node.js 24.19.0; pnpm 11.22.0 / Catalog strict; Nx 23.1.1; TypeScript 7.0.2 primary; PostgreSQL 18 architecture line / current qualified 18.6 lane; `pg` 8.23.0; `proper-lockfile` 4.1.2; XState 5.32.5 pure-transition APIs; TypeBox 1.3.16 + Ajv 8.20.0; `write-file-atomic` 8.0.0; Vitest 4.1.11.

**Spec / authority basis:**

- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/02-架构原则与反NIH约束.md`
- `Architecture_Corpus/03-核心概念与Authority.md`
- `Architecture_Corpus/04-总体系统架构.md`
- `Architecture_Corpus/05-整机执行模型.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md`
- `Architecture_Corpus/references/dependency-routing.json`
- `Architecture_Corpus/qualification/results/qualification-status.json`
- `docs/roadmap/development-roadmap.md`
- M4 merged completion record and actual post-merge `master` state.

**Intended repository path:** `docs/plans/active/foundation/m5a-reverse-handoff-maintenance-window.md`

---

## 0. Planning conclusion and milestone decomposition

### 0.1 M5 remains split into M5A + M5B

The roadmap describes M5 as one capability horizon step, but milestone boundaries are explicitly flexible. After re-checking the Corpus and current implementation, the safest implementation split remains:

```text
M5A — Reverse Handoff & PostgreSQL Maintenance Window
    live Host intentionally enters maintenance
    Host lease is initially healthy
    bootstrap ownership can be acquired normally
    MaintenanceJournal is created while the process is alive
    normal private-PG stop / same-cluster restart is executed
    fresh Host lease/token is reacquired when restarting

M5B — Bounded Bootstrap Recovery & H1 Closure
    process/owner may already be dead
    bootstrap lock may be abandoned
    MaintenanceJournal may be incomplete
    LOCAL_INSTALLATION_OWNER must be proven
    stale/abandoned ownership needs explicit recovery adjudication
    real process kill/restart recovery is qualified
    H1 may close only here
```

This is a semantic split, not merely a PR-size split.

M5A proves **intentional bidirectional Authority transfer**.

M5B proves **recovery when the intentional protocol was interrupted by process death or abandoned ownership**.

Do not merge the two failure models back into one implementation merely to keep the roadmap label `M5`.

### 0.2 Why M5A is independently valuable

M4 intentionally ends with:

```text
Host lease + current HostOwnershipToken
bootstrap filesystem ownership released
old ReadyPrivatePostgres lifecycle capability invalidated
```

The current normal Host ownership context can close its dedicated lease, but it cannot:

```text
reacquire bootstrap ownership
record MaintenanceJournal
revoke HostOwnershipToken
control an already-running private PostgreSQL
restart it under reverse-handoff Authority
publish a new HostOwnershipToken
```

M5A closes exactly that live-maintenance gap.

### 0.3 Why M5A must not claim H1 closure

The following remain M5B work:

```text
abandoned M2 proper-lockfile recovery
RecoveryPrincipal = LOCAL_INSTALLATION_OWNER proof
OS-level stale-owner/process-liveness adjudication
recovery of an incomplete MaintenanceJournal after process death
bounded repair/recovery CLI semantics
real kill/restart recovery qualification
```

Therefore:

```text
M5A merged  != H1 CLOSED
M5B merged + required evidence -> H1 may become CLOSED
```

---

## 1. Baseline and execution preconditions

M5A MUST NOT branch from the M4 PR head.

Current planning reference:

```text
reviewed M4 PR head:
9f10389563e009fe4908cd8fb2f0abc7cf4f600b
```

That SHA is a review target, not the future M5A baseline.

Before execution:

```bash
git switch master
git pull --ff-only
git rev-parse HEAD
```

Then verify all of the following:

```text
PR #6 M4 squash merge exists in master                       = true
actual M4 squash-merge SHA                                   = recorded
M4 independent review exact SHA                              = PASS
M4 final cross-platform CI exact reviewed SHA                = PASS
M4 plan completion/evidence truth                            = reconciled
Q-PRIVATE-POSTGRES-01 residual product qualification debt    = preserved truthfully
H1                                                           = OPEN
```

Run before creating the M5A behavior branch:

```bash
pnpm verify
```

Expected: exit code 0.

Only then:

```bash
git switch -c dev/m5a-reverse-handoff-maintenance-window
```

If M4 is merged by explicit owner override without the normal review/final-CI gate, record the actual state as `NOT_RUN` rather than inventing PASS; do not silently reinterpret repository governance.

---

## 2. M5A capability boundary

### 2.1 Input seam

M5A consumes a Host established by M4:

```text
private PostgreSQL = READY
dedicated HostLeaseConnection = ACTIVE
HostOwnershipFence = valid
HostOwnershipToken = current
bootstrap lock = RELEASED
BootId = current process boot
```

M5A also requires the Bootstrap Closure to retain enough process-local provenance to re-enter bootstrap ownership safely:

```text
InstallationId
InstanceId
BootId
BootstrapActivityId / BootstrapJournal access
BootstrapPathProfile
BootstrapKeyProvider
Host ownership timing options
qualified private-PG toolchain/lifecycle descriptor
current private-PG canonical identity
```

These mechanics MUST be retained behind an authentic process-local capability. Do not make consumers reconstruct them from arbitrary paths, environment variables, or raw PostgreSQL connections.

M5A must acquire a **fresh bootstrap ownership lease generation** for maintenance. The M2/M4 `OwnedBootstrapPrelude` and its released `BootstrapOwnershipLease` are terminal after forward handoff and MUST NOT be reused or reactivated. Maintenance re-entry calls the bootstrap ownership adapter again against the canonical Instance root and receives a new authentic lease object.

```text
old bootstrap lease RELEASED
!= reusable capability

managed Host provenance
+ canonical Instance root
→ acquireBootstrapOwnership(...)
→ new BootstrapOwnershipLease HELD
```

### 2.2 Successful output seams

#### Restart operation

```text
old Host token A          = revoked
old Host lease            = closed
private PostgreSQL        = stopped with proof
same private PostgreSQL   = started + revalidated
new Host lease            = ACTIVE
new Host token B          = fresh and current; B != A
bootstrap lock            = RELEASED only after B publication
new managed Host context  = returned ACTIVE
old managed Host context  = terminal / unusable
```

`BootId` MAY remain the same for an in-process PostgreSQL maintenance restart. `HostOwnershipToken` MUST change.

#### Stop-and-exit operation

```text
old Host token            = revoked
old Host lease            = closed
private PostgreSQL        = STOPPED with proof
MaintenanceJournal        = terminal success
bootstrap lock            = RELEASED after no further mutation remains
normal Host Authority     = absent by design because the process is shutting down
```

#### Keep-PostgreSQL-running shutdown

This is not a destructive maintenance window:

```text
quiesce consequential runtime
→ close Host lease
→ PostgreSQL remains running
→ no bootstrap reverse handoff required
```

The token may remain in the fence as historical state, but without a live Host lease it is not Authority. A later Bootstrap Closure publishes a fresh token before normal writes resume.

### 2.3 Explicit non-goals

M5A does NOT implement:

- abandoned bootstrap-lock takeover;
- `LOCAL_INSTALLATION_OWNER` RecoveryPrincipal proof;
- arbitrary lock force-unlock;
- Recovery CLI;
- generic RecoveryOperation executor;
- restore;
- ProductGeneration switch;
- bootstrap/runtime generation switch;
- PostgreSQL major upgrade;
- port relocation;
- database/schema migration framework;
- H2A PersistenceService or Kysely;
- canonical mutation wrapper;
- H2B RuntimeSubstrate/Cordis/Reconciler;
- DBOS/WorkQueue/Signal;
- normal Management/SystemAction/Policy/Approval;
- Subject/Messaging/AI;
- source-less product closure;
- service-account installation/ACL closure.

---

## 3. Fixed Authority chain

### 3.1 Reverse handoff entry

The successful entry sequence is fixed:

```text
Host lease ACTIVE + token A current
→ acquire bootstrap ownership FIRST
→ create crash-safe MaintenanceJournal
→ commit BootstrapState lastCommittedOperationRef
→ prove Host still ACTIVE and fence still token A
→ quiesce new consequential admission/work
→ bootstrap-admin transaction obtains HostOwnershipFence FOR UPDATE
→ verify InstanceId + token A + BootId
→ set token = NULL, boot_id = NULL, revision = revision + 1
→ COMMIT + re-read/verify revocation
→ synchronously transition old Host lease toward close
→ close old Host lease
→ maintenance window ENTERED
```

At no point on the successful path may both Authorities be absent while the operation continues.

### 3.2 Why revocation uses bootstrap-admin, not HostLeaseConnection.query()

Do **not** implement normal reverse-handoff revocation by executing the `FOR UPDATE` transaction through the dedicated Host lease connection.

Current `HostLeaseConnection.query()` conservatively treats any query rejection as ownership uncertainty and fences the lease. That is correct for M4 lease-health behavior, but a maintenance `FOR UPDATE` can legitimately encounter bounded `lock_timeout`/`statement_timeout` while waiting for already-entered transactions.

Therefore M5A uses:

```text
bootstrap lock HELD
+ Host lease still ACTIVE
+ bootstrap-admin PostgreSQL transaction
```

for token revocation.

The Host lease remains held as the other side of the overlap until revocation has committed. The revocation function must not expose a general bootstrap SQL API; it is one fixed fence mutation.

### 3.3 Point of no return

Define:

```text
PONR = HostOwnershipToken revocation is known committed
       OR commit outcome cannot be proven not committed
```

Before PONR, abort may resume the old Host **only** if all are proven:

```text
old Host lease still ACTIVE
fence still contains exact old token + BootId
bootstrap ownership still HELD
quiescence rollback/resume succeeds
```

After PONR:

```text
NEVER resume old Host
NEVER republish/reuse old token
NEVER release bootstrap ownership merely to simplify error handling
```

The operation either:

```text
continues to a known safe terminal state
or
enters RECOVERY_REQUIRED / UNCERTAIN
```

M5B later owns recovery after process death.

### 3.4 Expected SQL revocation semantics

The fixed revocation transaction is conceptually:

```sql
BEGIN;

SELECT set_config('lock_timeout', $1, true);
SELECT set_config('statement_timeout', $2, true);

SELECT singleton, instance_id, ownership_revision,
       host_ownership_token, boot_id
FROM heptalogos.host_ownership_fence
WHERE singleton = true
FOR UPDATE;

-- verify:
-- singleton=true
-- instance_id=current InstanceId
-- token=current local HostOwnershipToken
-- boot_id=current BootId

UPDATE heptalogos.host_ownership_fence
SET ownership_revision = ownership_revision + 1,
    host_ownership_token = NULL,
    boot_id = NULL
WHERE singleton = true;

COMMIT;

-- read back and prove token/boot are NULL
-- prove revision == previous revision + 1
```

Never convert `ownership_revision` to JS `number`; compare using decimal-string/`BigInt` semantics.

### 3.5 Already-entered transaction serialization

Future H2A mutating transactions will hold a shared/read-compatible fence lock for the transaction lifetime. M5A must already prove the inverse side:

```text
Tx A holds fence FOR SHARE with token A
→ M5A revocation FOR UPDATE blocks
→ Tx A commits
→ revocation commits NULL token
→ old Host cannot authorize a new mutation
```

This is a real-PostgreSQL M5A qualification scenario.

---

## 4. MaintenanceJournal design

### 4.1 Journal is separate from BootstrapJournal

`BootstrapJournal` remains per-BootId early observability.

`MaintenanceJournal` is a crash-safe operation state record that may be consumed by a later boot/recovery attempt.

Do not merge them.

### 4.2 Storage layout

Use the logical Instance root:

```text
<InstanceRoot>/
└─ maintenance-journal/
   └─ <MaintenanceOperationId>/
      ├─ maintenance-state.json
      └─ maintenance-state.previous.json
```

The journal path is not user configuration.

### 4.3 Stable v1 body

Implement a bounded V1 contract along these lines:

```ts
export type MaintenanceOperationId = UuidV7Id<"MaintenanceOperationId">;

export type MaintenanceOperationType =
  "PRIVATE_POSTGRES_RESTART" | "PRIVATE_POSTGRES_STOP";

export type MaintenanceStage =
  | "BOOTSTRAP_OWNERSHIP_ACQUIRED"
  | "HOST_QUIESCED"
  | "HOST_TOKEN_REVOKED"
  | "HOST_LEASE_CLOSED"
  | "POSTGRES_STOPPED"
  | "POSTGRES_READY"
  | "HOST_LEASE_ACQUIRED"
  | "HOST_TOKEN_PUBLISHED"
  | "BOOTSTRAP_RELEASE_ARMED"
  | "ABORTED"
  | "RECOVERY_REQUIRED";

export type MaintenanceTerminalOutcome =
  "SUCCEEDED" | "ABORTED" | "FAILED" | "UNCERTAIN";

export interface MaintenanceJournalBodyV1 {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly operationId: MaintenanceOperationId;
  readonly activityId: UuidV7Id<"ActivityId">;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly operationType: MaintenanceOperationType;

  readonly source: {
    readonly hostOwnershipToken: HostOwnershipToken;
    readonly hostOwnershipRevision: string;
    readonly postgresClusterSystemIdentifier: string;
    readonly persistedPort: number;
  };

  readonly target: {
    readonly privatePostgres: "RUNNING_SAME_IDENTITY" | "STOPPED";
    readonly hostOwnershipToken?: HostOwnershipToken;
    readonly hostOwnershipRevision?: string;
  };

  readonly verifiedPrerequisites: {
    readonly bootstrapStateDigest: Sha256Digest;
    readonly privatePostgresInitializationProfileRevision: PrivatePostgresInitializationProfileRevision;
  };

  readonly lastCompletedStage: MaintenanceStage;
  readonly updatedAt: string;
  readonly terminalOutcome?: MaintenanceTerminalOutcome;
  readonly problemCode?: string;
}
```

Do not add generic payload bags.

Enforce semantic invariants in code in addition to structural schema validation:

```text
ABORTED stage              -> terminalOutcome = ABORTED
RECOVERY_REQUIRED stage    -> terminalOutcome = FAILED | UNCERTAIN
BOOTSTRAP_RELEASE_ARMED    -> terminalOutcome absent
restart + RELEASE_ARMED    -> target.hostOwnershipToken + hostOwnershipRevision required
stop + RELEASE_ARMED       -> target host token/revision absent
all ownership revisions    -> unsigned decimal strings; no JS-number coercion
```

Do not store:

```text
password
SCRAM verifier
argv
environment
raw SQL
absolute sensitive path
arbitrary diagnostic object
```

### 4.4 Envelope / integrity

Use:

```text
RFC8785-JCS canonicalization
domain-separated SHA-256
domain = heptalogos.maintenance-journal/v1
monotonic revision
current + previous valid revision fallback
atomic publication via existing write-file-atomic route
```

A newer unsupported schema must fail explicitly.

Corrupt current with valid previous may recover previous and surface the integrity Problem, following the established BootstrapState pattern.

### 4.5 BootstrapState pointer

Reuse the already-existing `BootstrapStateBodyV2.lastCommittedOperationRef`.

Define one versioned logical reference helper, for example:

```text
maintenance-journal/v1/<MaintenanceOperationId>
```

Creation order:

```text
bootstrap ownership HELD
→ create first valid MaintenanceJournal revision
→ commit next BootstrapState revision with lastCommittedOperationRef
```

If journal creation succeeds but BootstrapState pointer commit fails:

```text
orphan journal may remain
NO Host token revocation
NO private-PG lifecycle mutation
safe abort
```

Do not introduce BootstrapState V3 merely for M5A.

Do not repurpose `lastCompletedStageRef` unless an existing authoritative contract is found during execution that requires it. `MaintenanceJournal` itself owns maintenance stage truth.

### 4.6 Two-phase finalization across bootstrap-lock release

`MaintenanceJournal` and `proper-lockfile.release()` cannot be committed atomically. M5A MUST model that fact rather than manufacture an atomicity guarantee.

While bootstrap ownership is still proven, the last durable success-side write is:

```text
all material maintenance work proven
→ for restart: new Host lease ACTIVE + fresh token B published/re-read
→ for stop: private PostgreSQL proven STOPPED
→ persist MaintenanceJournal stage = BOOTSTRAP_RELEASE_ARMED
→ for restart, persist target hostOwnershipToken/token revision in the journal
```

`BOOTSTRAP_RELEASE_ARMED` means:

```text
No further product/bootstrap mutation is required for this operation.
The only remaining step is releasing the bootstrap ownership lock.
It is NOT a persisted claim that lock release succeeded.
```

Then:

```text
release bootstrap ownership
→ if release succeeds: record bootstrap.maintenance.completed in BootstrapJournal
   and transition the in-memory maintenance capability to COMPLETED
→ if release fails/is uncertain: do not rewrite MaintenanceJournal without Authority;
   keep its last authorized state at BOOTSTRAP_RELEASE_ARMED,
   fence/close any newly reacquired Host, and enter in-memory RECOVERY_REQUIRED
```

`BootstrapJournal` is the non-authoritative rescue/observability projection and may record the post-release completion/failure observation, as existing bootstrap code already records release observations after releasing the lock. It does not replace `MaintenanceJournal` Authority.

Consequences:

- `MaintenanceJournal.terminalOutcome = SUCCEEDED` is **not** written by M5A before lock release.
- A successful M5A operation may remain durably `BOOTSTRAP_RELEASE_ARMED` until a later bootstrap/recovery reconciliation finalizes it.
- M5B owns reconciliation/finalization after process death: `release-armed + lock state + expected fence/PG state + BootstrapJournal evidence` determines the safe terminal interpretation.
- If a failure/abort is known while bootstrap ownership is still valid, M5A may persist `ABORTED`, `FAILED`, or `UNCERTAIN` before release as appropriate.
- If bootstrap ownership itself is already `COMPROMISED`, M5A MUST NOT mutate `MaintenanceJournal`; preserve the last authorized revision and record only non-authoritative BootstrapJournal/fallback diagnostics where possible.

This is deliberately a write-ahead/reconciliation protocol. Do not add a second lock or a bespoke distributed transaction solely to hide this boundary.

---

## 5. Process-local capability model

### 5.1 Do not return the raw M4 close capability as the normal Host shell

M5A should evolve `bootstrap-runtime` so the normal Bootstrap Closure returns a managed Host view rather than handing callers the raw low-level `HostOwnershipContext.close()` orchestration primitive.

Target shape:

```ts
export interface BootstrapManagedHostContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly token: HostOwnershipToken;
  readonly state: HostOwnershipState;
  readonly signal: AbortSignal;

  assertActive(): void;

  preparePrivatePostgresMaintenance(
    request: PrivatePostgresMaintenanceRequest,
  ): Promise<PreparedPrivatePostgresMaintenance>;

  shutdownKeepingPrivatePostgres(quiescence: HostMaintenanceQuiescence): Promise<void>;
}
```

The implementation retains the authentic raw M4 context and bootstrap mechanics in a module-private `WeakMap`.

A structurally forged object must be rejected.

### 5.2 Quiescence seam

H2B does not exist yet. M5A must not implement a fake RuntimeReconciler.

Define only the minimum seam:

```ts
export interface HostMaintenanceQuiescence {
  quiesce(): Promise<HostQuiescenceLease>;
}

export interface HostQuiescenceLease {
  resumeAfterAbort(): Promise<void>;
}
```

Contract:

```text
quiesce() resolve
= caller proves it has stopped admitting new consequential work
  and has brought the currently implemented process-memory surface
  to the bounded state required for Authority transfer.

resumeAfterAbort()
= may be called only before PONR when old Host Authority is still proven.
```

M5A tests use a synthetic implementation with an event trace.

H2B later implements this seam using real Runtime Supervisor / resource scopes.

### 5.3 Prepared maintenance capability

Use an explicit process-local capability because post-PONR failures must not lose the bootstrap-ownership handle merely because a Promise rejected.

Target shape:

```ts
export type PrivatePostgresMaintenanceRequest =
  | { readonly kind: "RESTART_PRIVATE_POSTGRES" }
  | { readonly kind: "STOP_PRIVATE_POSTGRES" };

export type PreparedMaintenanceState =
  | "PREPARED"
  | "QUIESCED"
  | "TOKEN_REVOKED"
  | "ENTERED"
  | "POSTGRES_STOPPED"
  | "POSTGRES_READY"
  | "HOST_REACQUIRED"
  | "COMPLETED"
  | "ABORTED"
  | "RECOVERY_REQUIRED";

export type PrivatePostgresMaintenanceResult =
  | {
      readonly kind: "RESTARTED";
      readonly host: BootstrapManagedHostContext;
    }
  | {
      readonly kind: "STOPPED";
    };

export interface PreparedPrivatePostgresMaintenance {
  readonly operationId: MaintenanceOperationId;
  readonly state: PreparedMaintenanceState;
  readonly signal: AbortSignal;

  execute(
    quiescence: HostMaintenanceQuiescence,
  ): Promise<PrivatePostgresMaintenanceResult>;

  abortBeforeEntry(): Promise<void>;
}
```

`abortBeforeEntry()` is legal only while no PONR has been crossed.

Do not expose a generic `executeSql`, `runShell`, `replaceDataRoot`, or arbitrary Recovery verb.

### 5.4 Local state-machine mechanics

The maintenance capability has enough failure-sensitive transitions to justify the already-ADOPTED XState local state-machine route.

Add `xstate: catalog:` to `@heptalogos/bootstrap-runtime`.

Use pure transition APIs only.

Do not leak XState types from public contracts.

---

## 6. Private PostgreSQL maintenance controller

### 6.1 Do not resurrect ReadyPrivatePostgres

The M4 forward handoff intentionally invalidates the M3 `ReadyPrivatePostgres` lifecycle session.

M5A MUST NOT:

```text
reset old session token
mark HANDED_OFF back to READY
reuse old stop()/restart()
weaken ALREADY_RUNNING control denial
```

### 6.2 Add a stronger maintenance-only controller

Inside `@heptalogos/private-postgres`, add a separate existing-cluster maintenance controller whose only Authority input remains a narrow guard callback supplied by `bootstrap-runtime`.

Target semantics:

```ts
export interface PrivatePostgresMaintenanceController {
  readonly state: "READY" | "STOPPED" | "STARTING" | "STOPPING" | "UNCERTAIN";

  stop(): Promise<void>;
  start(): Promise<void>;
}

export interface OpenPrivatePostgresMaintenanceControllerOptions {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly expectedIdentity: PrivatePostgresExpectedIdentity;
  readonly logFilePath: string;
  readonly lifecycle: PrivatePostgresLifecycleOptions;
  readonly assertControlAuthority: PrivatePostgresControlGuard;
}

export async function openPrivatePostgresMaintenanceController(
  options: OpenPrivatePostgresMaintenanceControllerOptions,
): Promise<PrivatePostgresMaintenanceController>;
```

Opening it:

```text
assert Authority
→ validate exact cluster identity/profile
→ prove pg_ctl status
→ if RUNNING: prove readiness + profile + identity, state READY
→ if STOPPED: state STOPPED
→ ambiguous: fail/UNCERTAIN
```

### 6.3 Reuse lifecycle mechanics rather than duplicate process control

`controller.ts` is already large. Do not copy/paste the pg_ctl status/start/stop/readiness logic.

Extract the smallest shared internal lifecycle mechanics required by both:

```text
normal bootstrap controller
maintenance controller
```

into an implementation-only module such as:

```text
packages/private-postgres/src/lifecycle-operations.ts
```

Keep the public controller surfaces separate.

Add an XState event for a fully validated already-running process, e.g.:

```text
READY_OBSERVED
STOPPED -> READY
```

Only send it after process status + readiness + cluster/profile validation all succeed.

### 6.4 Restart is stop + start, not pg_ctl restart

M5A maintenance restart must expose the durable boundary:

```text
POSTGRES_STOPPED
```

before starting again.

Therefore:

```text
maintenance restart
= controller.stop()
→ journal POSTGRES_STOPPED
→ controller.start()
→ journal POSTGRES_READY
```

Do not use one opaque `pg_ctl restart` operation for the M5A recovery-aware path.

---

## 7. Failure classification

### 7.1 Safe pre-PONR abort

The operation may abort and return the old Host to service only if:

```text
token revocation is proven NOT committed
old Host lease is still ACTIVE
fence still equals old token + BootId
bootstrap lock is still HELD
quiescence resumeAfterAbort succeeds
```

Then:

```text
MaintenanceJournal -> ABORTED
bootstrap ownership -> RELEASED
old Host remains current
```

### 7.2 Recovery-required conditions

At minimum, enter `RECOVERY_REQUIRED` when:

```text
revocation COMMIT outcome ambiguous
revocation committed but old lease close outcome ambiguous
Host lease lost unexpectedly during entry
fence no longer equals either exact old state or exact revoked state
bootstrap ownership becomes COMPROMISED
private-PG stop outcome cannot be proven
private-PG start outcome cannot be proven safely
private-PG identity changes
new Host lease acquired but token publication outcome becomes uncertain
new token committed but bootstrap release result is uncertain
```

After `RECOVERY_REQUIRED`:

```text
do not resume old Host
do not publish old token
do not start arbitrary repair
do not release bootstrap ownership merely to make cleanup convenient
```

If the process subsequently terminates, the abandoned lock + journal is intentionally left for M5B.

### 7.3 Known failure after PONR

Some failures are known rather than uncertain, e.g.:

```text
PG start definitively failed and PG is proven STOPPED
```

Even when the physical state is known, old Host Authority is already revoked.

The operation remains non-normal and must not resume the old Host. M5A may keep the in-process maintenance capability alive for an explicitly permitted retry of the same bounded action; it must not invent a generic Recovery loop.

---

## 8. Target repository shape

Expected delta, adjusted to actual implementation as needed:

```text
packages/
├─ bootstrap-state/
│  └─ src/
│     ├─ maintenance-model.ts
│     ├─ maintenance-model.test.ts
│     ├─ maintenance-codec.ts
│     ├─ maintenance-codec.test.ts
│     ├─ maintenance-store.ts
│     ├─ maintenance-store.test.ts
│     └─ index.ts
│
├─ host-ownership/
│  └─ src/
│     ├─ ownership-revocation.ts
│     ├─ ownership-revocation.test.ts
│     ├─ host-ownership.ts
│     ├─ host-ownership.test.ts
│     ├─ host-ownership.integration.test.ts
│     └─ index.ts
│
├─ private-postgres/
│  └─ src/
│     ├─ lifecycle-operations.ts
│     ├─ lifecycle-machine.ts
│     ├─ lifecycle-machine.test.ts
│     ├─ maintenance-controller.ts
│     ├─ maintenance-controller.test.ts
│     ├─ controller.ts
│     ├─ controller*.test.ts
│     └─ index.ts
│
└─ bootstrap-runtime/
   ├─ package.json
   └─ src/
      ├─ maintenance-state-access.ts
      ├─ maintenance-state-access.test.ts
      ├─ host-maintenance-machine.ts
      ├─ host-maintenance-machine.test.ts
      ├─ managed-host.ts
      ├─ managed-host.test.ts
      ├─ host-maintenance.ts
      ├─ host-maintenance.test.ts
      ├─ host-maintenance.integration.test.ts
      ├─ host-ownership-handoff.ts
      ├─ host-ownership-handoff.test.ts
      ├─ bootstrap-prelude.ts
      └─ index.ts

docs/
├─ plans/active/foundation/m5a-reverse-handoff-maintenance-window.md
├─ plans/completed/foundation/m4-host-ownership-fence-forward-handoff.md
└─ roadmap/development-roadmap.md
```

Do not create:

```text
packages/recovery
packages/persistence
packages/runtime-kernel
apps/host
apps/cli
```

solely for M5A.

---

## 9. Task-by-task execution plan

### Task 0 — Reconcile post-M4 baseline and open M5A

**Status: COMPLETE.** Baseline `master` is `c4b54b7dbe888c62b81d28203553c953d5a749c3`; the implementation branch is `dev/m5a-reverse-handoff-maintenance-window`. The canonical Node 24 baseline `pnpm verify` passed before implementation.

**Files:**

- Move after actual M4 merge: `docs/plans/active/foundation/m4-host-ownership-fence-forward-handoff.md` → `docs/plans/completed/foundation/m4-host-ownership-fence-forward-handoff.md`
- Modify only if necessary for truthful current state: `docs/roadmap/development-roadmap.md`
- Create this plan at: `docs/plans/active/foundation/m5a-reverse-handoff-maintenance-window.md`

**Interfaces:**

- Consumes: actual squash-merged M4 `master`.
- Produces: clean M5A branch with no behavior delta yet.

- [ ] **Step 1: Resolve actual baseline**

```bash
git switch master
git pull --ff-only
git rev-parse HEAD
git log -1 --oneline
git status --short
```

Expected:

```text
working tree clean
HEAD is the actual M4 squash merge or a later approved master commit containing it
```

- [ ] **Step 2: Verify M4 PR is no longer the execution baseline**

Record:

```text
planning review head = 9f10389563e009fe4908cd8fb2f0abc7cf4f600b
actual M5A baseline  = <resolved master SHA>
```

Never substitute the PR head for the squash-merge SHA.

- [ ] **Step 3: Run baseline permanent verification**

```bash
pnpm verify
```

Expected: PASS / exit 0.

If it fails, stop. Do not begin M5A on an already-failing baseline.

- [ ] **Step 4: Create branch**

```bash
git switch -c dev/m5a-reverse-handoff-maintenance-window
```

- [ ] **Step 5: Reconcile M4 plan/roadmap truth without rewriting evidence**

Move the M4 plan to completed only because it is merged.

Preserve any residual:

```text
NOT_RUN
BLOCKED
PARTIAL
```

qualification exactly.

- [ ] **Step 6: Commit baseline planning state**

```bash
git add docs/plans docs/roadmap
git commit -m "docs: open Foundation M5A maintenance handoff"
```

---

### Task 1 — Add versioned crash-safe MaintenanceJournal

**Status: COMPLETE.** MaintenanceJournal V1 codec, JCS digest, atomic current/previous store, recovery semantics, and focused tests are implemented in `bootstrap-state`.

**Files:**

- Create: `packages/bootstrap-state/src/maintenance-model.ts`
- Create: `packages/bootstrap-state/src/maintenance-model.test.ts`
- Create: `packages/bootstrap-state/src/maintenance-codec.ts`
- Create: `packages/bootstrap-state/src/maintenance-codec.test.ts`
- Create: `packages/bootstrap-state/src/maintenance-store.ts`
- Create: `packages/bootstrap-state/src/maintenance-store.test.ts`
- Modify: `packages/bootstrap-state/src/index.ts`

**Interfaces:**

- Produces:
  - `MaintenanceOperationId`
  - `MaintenanceJournalBodyV1`
  - `MaintenanceJournalEnvelopeV1`
  - `MaintenanceJournalLoadResult`
  - `createMaintenanceOperationId()`
  - `MaintenanceJournalStore`
  - `maintenanceOperationRef()`

- [ ] **Step 1: Write failing codec/model tests**

Cover:

```text
valid v1 round trip
operationId/activityId/InstallationId/InstanceId/BootId UUID validation
host token validation
decimal ownership revision validation
canonical Instant validation
persisted port bounds
target enum exactness
unknown field rejected
coercion/default insertion disabled
unsupported future schema rejected
digest domain mismatch rejected
tampered body rejected
terminalOutcome only accepts fixed enum
ABORTED stage requires terminalOutcome=ABORTED
RECOVERY_REQUIRED requires terminalOutcome=FAILED|UNCERTAIN
BOOTSTRAP_RELEASE_ARMED forbids terminalOutcome
restart release-armed requires target token + target ownership revision
stop release-armed forbids target Host token/revision
```

- [ ] **Step 2: Run focused tests and verify RED**

```bash
pnpm exec vitest run --root packages/bootstrap-state \
  src/maintenance-model.test.ts \
  src/maintenance-codec.test.ts
```

Expected: FAIL because the contracts do not exist.

- [ ] **Step 3: Implement exact V1 types and codec**

Use existing Foundation primitives:

```ts
createUuidV7Id("MaintenanceOperationId");
digestCanonicalJson("heptalogos.maintenance-journal/v1", body);
```

Use TypeBox + Ajv in the same non-mutating profile as existing bootstrap-state codecs:

```text
coerceTypes=false
removeAdditional=false
useDefaults=false
strict=true
```

- [ ] **Step 4: Verify codec tests GREEN**

Run the same focused command.

Expected: PASS.

- [ ] **Step 5: Write failing store tests**

Cover:

```text
EMPTY before creation
create revision = 1
advance requires exact next revision
current valid loads CURRENT
corrupt current + valid previous -> RECOVERED_PREVIOUS
both invalid -> CORRUPT
atomic write leaves no accepted torn state
operationId path mismatch rejected
future schema fails closed
```

- [ ] **Step 6: Implement MaintenanceJournalStore**

Use:

```text
<instance>/maintenance-journal/<operationId>/
maintenance-state.json
maintenance-state.previous.json
```

Use existing `writeAtomicPublishedFile`.

Do not create a generic reusable workflow/journal framework.

- [ ] **Step 7: Run bootstrap-state suite**

```bash
pnpm nx run bootstrap-state:test
```

If no Nx target exists after baseline reconciliation, use the repository's actual package test target discovered from `project.json`; do not invent a command.

- [ ] **Step 8: Commit**

```bash
git add packages/bootstrap-state
git commit -m "feat: add crash safe maintenance journal"
```

---

### Task 2 — Bind MaintenanceJournal to authentic bootstrap ownership

**Status: COMPLETE.** Fresh maintenance ownership and authority-scoped BootstrapState operation-pointer commits are implemented and tested.

**Files:**

- Create: `packages/bootstrap-runtime/src/maintenance-state-access.ts`
- Create: `packages/bootstrap-runtime/src/maintenance-state-access.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-state-access.ts` only if shared ownership guarding can be reused without broad abstraction.

**Interfaces:**

- Consumes:
  - `BootstrapPathProfile`
  - authentic `BootstrapOwnershipLease`
  - `OwnedBootstrapStateStore`
  - `MaintenanceJournalStore`

- Produces:

```ts
export interface OwnedMaintenanceStateAccess {
  readonly journal: MaintenanceJournalStore;
  readonly state: OwnedBootstrapStateStore;
  commitOperationPointer(
    operationId: MaintenanceOperationId,
  ): Promise<BootstrapStateEnvelopeV2>;
}
```

- [ ] **Step 1: Write failing provenance/ordering tests**

Required event trace:

```text
ownership assert
journal v1 created
BootstrapState load
BootstrapState commit with operation ref
```

Negative cases:

```text
forged BootstrapOwnershipLease -> reject
scope mismatch -> reject
released ownership -> reject
BootstrapState V1/no privatePostgres -> reject
corrupt BootstrapState -> reject
journal write failure -> no state pointer commit
state pointer commit failure -> no Host/fence/PG mutation
```

- [ ] **Step 2: Verify RED**

```bash
pnpm exec vitest run --root packages/bootstrap-runtime \
  src/maintenance-state-access.test.ts
```

- [ ] **Step 3: Implement ownership-scoped access**

The BootstrapState pointer format is fixed/versioned:

```text
maintenance-journal/v1/<MaintenanceOperationId>
```

Commit by cloning the authoritative V2 body:

```ts
{
  ...currentState,
  revision: currentState.revision + 1,
  lastCommittedOperationRef: maintenanceOperationRef(operationId),
}
```

Leave `lastCompletedStageRef` unchanged in M5A.

- [ ] **Step 4: Verify GREEN and run bootstrap-runtime unit suite**

```bash
pnpm nx run bootstrap-runtime:test
```

- [ ] **Step 5: Commit**

```bash
git add packages/bootstrap-runtime/src/maintenance-state-access*
git commit -m "feat: bind maintenance journal to bootstrap authority"
```

---

### Task 3 — Add managed Host capability and quiescence contract

**Status: COMPLETE.** The managed Host capability, authenticity boundary, local maintenance tracker, and quiescence seam are implemented; raw `close()` is not exposed on the managed contract.

**Files:**

- Create: `packages/bootstrap-runtime/src/managed-host.ts`
- Create: `packages/bootstrap-runtime/src/managed-host.test.ts`
- Create: `packages/bootstrap-runtime/src/host-maintenance-machine.ts`
- Create: `packages/bootstrap-runtime/src/host-maintenance-machine.test.ts`
- Modify: `packages/bootstrap-runtime/package.json`
- Modify: `packages/bootstrap-runtime/src/host-ownership-handoff.ts`
- Modify: `packages/bootstrap-runtime/src/host-ownership-handoff.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Interfaces:**

- Produces:
  - `BootstrapManagedHostContext`
  - `HostMaintenanceQuiescence`
  - `HostQuiescenceLease`
  - module-private managed-host provenance record
  - maintenance lifecycle tracker

- [ ] **Step 1: Add XState through the existing Catalog**

`packages/bootstrap-runtime/package.json`:

```json
"xstate": "catalog:"
```

Do not change the catalog version.

- [ ] **Step 2: Write failing managed-host provenance tests**

Prove:

```text
M4 handoff returns BootstrapManagedHostContext
same identity/token/state/signal view remains available
raw close() is not exposed from the managed bootstrap-runtime contract
structurally forged context is rejected by maintenance entry
old context becomes terminal after successful maintenance entry
XState implementation type is absent from public .d.ts contract
```

- [ ] **Step 3: Write failing maintenance-machine transition tests**

Minimum allowed states:

```text
PREPARED
QUIESCED
TOKEN_REVOKED
ENTERED
POSTGRES_STOPPED
POSTGRES_READY
HOST_REACQUIRED
COMPLETED
ABORTED
RECOVERY_REQUIRED
```

Prove:

```text
COMPLETED never re-enters active maintenance
ABORTED never crosses PONR
RECOVERY_REQUIRED never returns PREPARED/QUIESCED
TOKEN_REVOKED cannot transition to ABORTED
old Host cannot become reusable after ENTERED
```

- [ ] **Step 4: Implement pure XState tracker**

No XState actor runtime is required.

No XState types exported.

- [ ] **Step 5: Wrap M4 handoff internals in module-private provenance**

Retain:

```text
raw HostOwnershipContext
BootstrapPathProfile
BootstrapJournal
BootstrapKeyProvider
HostOwnershipTimingOptions
clientFactory test seam if present
private-PG maintenance descriptor
```

behind a `WeakMap`.

Do not expose raw `HostLeaseConnection`.

- [ ] **Step 6: Run focused and package tests**

```bash
pnpm exec vitest run --root packages/bootstrap-runtime \
  src/managed-host.test.ts \
  src/host-maintenance-machine.test.ts \
  src/host-ownership-handoff.test.ts

pnpm nx run bootstrap-runtime:test
```

- [ ] **Step 7: Commit**

```bash
git add packages/bootstrap-runtime
git commit -m "feat: add managed host maintenance capability"
```

---

### Task 4 — Implement fixed HostOwnershipToken revocation via bootstrap admin

**Status: COMPLETE.** Fixed bootstrap-admin revocation transaction, exact fence verification, BigInt-safe revision handling, and uncertainty classification are implemented and tested.

**Files:**

- Create: `packages/host-ownership/src/ownership-revocation.ts`
- Create: `packages/host-ownership/src/ownership-revocation.test.ts`
- Modify: `packages/host-ownership/src/host-ownership.ts`
- Modify/create the existing focused publication test file resolved from the post-M4 tree.
- Modify: `packages/host-ownership/src/index.ts`
- Extend: `packages/host-ownership/src/host-ownership.integration.test.ts`

**Interfaces:**

- Consumes:
  - `BootstrapAdminPasswordProvider`
  - `BootstrapMutationAuthority`
  - current `InstanceId`
  - current `BootId`
  - current `HostOwnershipToken`
  - timing budgets
  - bootstrap-admin client factory test seam

- Produces:

```ts
export interface HostOwnershipRevocationResult {
  readonly previousRevision: string;
  readonly revokedRevision: string;
}

export async function revokeHostOwnershipTokenForBootstrap(
  options: RevokeHostOwnershipTokenOptions,
): Promise<HostOwnershipRevocationResult>;

export interface HostOwnershipPublicationResult {
  readonly previousRevision: string;
  readonly publishedRevision: string;
}

// Evolve the existing M4 function from Promise<void> to this proven result.
export async function publishHostOwnershipToken(
  options: PublishHostOwnershipTokenOptions,
): Promise<HostOwnershipPublicationResult>;
```

The M4 caller may ignore the new return value. M5A uses `publishedRevision` to persist the exact release-armed target state. Both results use decimal strings.

- [ ] **Step 1: Write failing unit tests for exact SQL ordering**

Expected trace:

```text
BEGIN
set local lock_timeout
set local statement_timeout
SELECT fence FOR UPDATE
verify exact InstanceId/token/BootId/revision
UPDATE token=NULL, boot_id=NULL, revision+1
COMMIT
SELECT fence
verify NULL/NULL and exact +1 revision
```

- [ ] **Step 2: Add failure classification tests**

Required:

```text
wrong InstanceId -> no UPDATE
wrong token -> no UPDATE
wrong BootId -> no UPDATE
invalid revision -> no UPDATE
lock timeout before COMMIT -> ROLLBACK, known not committed
statement failure before COMMIT -> ROLLBACK, known not committed
COMMIT issued + response ambiguous -> revocation_uncertain
COMMIT acknowledged + reread mismatch -> revocation_unverified
bootstrap authority lost before mutation -> no mutation
bootstrap authority lost during transaction -> no false success
```

The function must distinguish:

```text
known-not-committed
unknown-commit-outcome
known-committed-but-unverified
```

through stable Problem codes.

- [ ] **Step 3: Implement with `withBootstrapAdminClient`**

Do not use `HostLeaseConnection.query()` for this transaction.

Do not export the bootstrap admin client.

- [ ] **Step 4: Strengthen M4 publication to return the proven revision pair**

From the row locked before UPDATE, capture `previousRevision` as a decimal string. After COMMIT, re-read and require:

```text
publishedRevision = previousRevision + 1
token = requested fresh token
bootId = requested BootId
```

Return both revisions. A mismatch is `publication_unverified` and fences the Host connection using the existing M4 failure semantics.

- [ ] **Step 5: Verify unit suite**

```bash
pnpm exec vitest run --root packages/host-ownership \
  src/ownership-revocation.test.ts

pnpm nx run host-ownership:test
```

- [ ] **Step 6: Add real-PG revocation scenario**

Prove:

```text
token A current
bootstrap-admin FOR UPDATE revocation
revision increments by exactly 1
token/boot become NULL
host lease session itself was still live until caller closes it
```

- [ ] **Step 7: Commit**

```bash
git add packages/host-ownership
git commit -m "feat: revoke host ownership under bootstrap authority"
```

---

### Task 5 — Add existing-cluster private-PG maintenance control

**Status: COMPLETE.** The maintenance-only existing-cluster controller and shared private-postgres process mechanics are implemented; normal lifecycle and maintenance paths use the same bounded process/readiness primitives.

**Files:**

- Create: `packages/private-postgres/src/lifecycle-operations.ts`
- Create: `packages/private-postgres/src/maintenance-controller.ts`
- Create: `packages/private-postgres/src/maintenance-controller.test.ts`
- Modify: `packages/private-postgres/src/lifecycle-machine.ts`
- Modify: `packages/private-postgres/src/lifecycle-machine.test.ts`
- Modify: `packages/private-postgres/src/controller.ts`
- Modify affected controller tests.
- Modify: `packages/private-postgres/src/index.ts`

**Interfaces:**

- Produces:
  - `openPrivatePostgresMaintenanceController()`
  - `PrivatePostgresMaintenanceController`

- [ ] **Step 1: Characterize existing lifecycle behavior before refactor**

Run current focused tests:

```bash
pnpm nx run private-postgres:test
```

Record baseline.

- [ ] **Step 2: Write failing maintenance-controller tests**

Scenarios:

```text
validated existing RUNNING cluster -> READY controller
validated existing STOPPED cluster -> STOPPED controller
wrong cluster identity -> reject
wrong effective profile -> reject
status ambiguous -> reject/UNCERTAIN
control guard lost before stop -> no pg_ctl stop
control guard lost after stop command -> outcome must be re-proven or UNCERTAIN
stop success -> STOPPED only after pg_ctl status proof
start from STOPPED -> READY only after readiness + identity/profile revalidation
start outcome ambiguous -> UNCERTAIN
start from READY -> reject
stop from STOPPED -> idempotent known STOPPED
```

- [ ] **Step 3: Add `READY_OBSERVED` lifecycle transition**

Only:

```text
STOPPED -> READY
```

after full readiness/identity proof.

Do not treat mere `pg_ctl status=RUNNING` as READY.

- [ ] **Step 4: Extract shared lifecycle operations without changing public semantics**

Move only implementation mechanics shared by bootstrap and maintenance:

```text
process status probe
bounded readiness wait
pg_ctl start
pg_ctl stop with proof
identity revalidation helpers where appropriate
```

Do not create a generic process manager.

- [ ] **Step 5: Implement maintenance controller**

The guard callback is the only control-authority input.

It must not import bootstrap-runtime or host-ownership.

- [ ] **Step 6: Prove M3/M4 behavior did not weaken**

Especially:

```text
ReadyPrivatePostgres with startupDisposition=ALREADY_RUNNING
still rejects old stop()/restart()
```

Run:

```bash
pnpm nx run private-postgres:test
pnpm nx run bootstrap-runtime:test
```

- [ ] **Step 7: Commit**

```bash
git add packages/private-postgres
git commit -m "feat: add private postgres maintenance control"
```

---

### Task 6 — Prepare and enter the reverse-handoff maintenance window

**Status: COMPLETE.** Preparation, quiescence-before-revocation, point-of-no-return handling, safe abort proof, recovery-required handling, and old Host terminalization are implemented and tested.

**Files:**

- Create: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Create: `packages/bootstrap-runtime/src/host-maintenance.test.ts`
- Modify: `packages/bootstrap-runtime/src/managed-host.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Interfaces:**

- Implements:
  - `BootstrapManagedHostContext.preparePrivatePostgresMaintenance()`
  - `PreparedPrivatePostgresMaintenance.execute()`
  - `abortBeforeEntry()`

- [ ] **Step 1: Write failing prepare-order tests**

Exact ordering:

```text
managed Host provenance validated
old Host assertActive
acquire NEW bootstrap ownership lease (never reuse released M4 lease/OwnedPrelude)
open authoritative BootstrapState
inspect current fence snapshot
prove source token/revision/BootId/PG identity
create MaintenanceJournal revision 1
commit BootstrapState operation pointer
return PREPARED capability
```

Prove no quiesce/token/PG mutation occurs during `prepare()`.

- [ ] **Step 2: Write failing entry-order tests**

Exact ordering:

```text
bootstrap ownership assert
old Host assertActive
quiesce()
journal HOST_QUIESCED
old Host assertActive
revoke token through bootstrap-admin transaction
journal HOST_TOKEN_REVOKED
old Host close() invoked synchronously
prove old lease CLOSED
journal HOST_LEASE_CLOSED
state ENTERED
```

- [ ] **Step 3: Add safe-abort tests**

Before PONR:

```text
revocation known-not-committed
+ old Host ACTIVE
+ snapshot still exact token A
→ resumeAfterAbort()
→ journal ABORTED
→ release bootstrap lock
→ old managed Host remains ACTIVE
```

If `resumeAfterAbort()` fails:

```text
do not report normal resume
surface structured failure
```

- [ ] **Step 4: Add PONR/uncertainty tests**

Cases:

```text
revocation commit outcome uncertain
revocation committed but Host lease dies
Host close outcome uncertain
bootstrap ownership compromised
fence observed in unexpected third state
```

Expected:

```text
state = RECOVERY_REQUIRED
old Host never resumed
bootstrap lock not voluntarily released
if bootstrap ownership is still HELD:
  journal terminalOutcome = UNCERTAIN or known FAILED as appropriate
if bootstrap ownership is COMPROMISED:
  do not mutate MaintenanceJournal; preserve its last authorized revision
  record non-authoritative BootstrapJournal/fallback diagnostics where possible
```

- [ ] **Step 5: Implement preparation and entry**

Do not call the private-PG controller before:

```text
token revoked
old Host lease CLOSED with known outcome
```

M5A intentionally treats an ambiguous old-lease close as `RECOVERY_REQUIRED` rather than stopping PostgreSQL as an implicit way to break the advisory session. That more aggressive recovery is possible only after its safety proof is designed; keep routine M5A maintenance conservative.

- [ ] **Step 6: Run focused tests**

```bash
pnpm exec vitest run --root packages/bootstrap-runtime \
  src/host-maintenance.test.ts \
  src/managed-host.test.ts \
  src/host-maintenance-machine.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add packages/bootstrap-runtime
git commit -m "feat: enter bootstrap owned maintenance window"
```

---

### Task 7 — Implement stop-private-PostgreSQL-and-exit

**Status: COMPLETE.** Stop proof, `POSTGRES_STOPPED`, `BOOTSTRAP_RELEASE_ARMED`, bootstrap release, non-authoritative completion checkpoint, and `{ kind: "STOPPED" }` are implemented and tested.

**Files:**

- Modify: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Extend: `packages/bootstrap-runtime/src/host-maintenance.test.ts`
- Extend private-PG tests if a new edge is discovered.

**Interfaces:**

- Consumes maintenance state `ENTERED`.
- Produces `{ kind: "STOPPED" }`.

- [ ] **Step 1: Write failing success trace**

```text
ENTERED
→ open maintenance controller under reverse-handoff guard
→ controller.stop()
→ prove STOPPED
→ journal POSTGRES_STOPPED
→ journal BOOTSTRAP_RELEASE_ARMED (terminalOutcome still absent)
→ release bootstrap ownership
→ BootstrapJournal records bootstrap.maintenance.completed
→ in-memory state COMPLETED
→ journal/pointer remains inspectable
→ result STOPPED
```

No Host lease/token reacquisition.

- [ ] **Step 2: Write failing uncertain-stop trace**

If stop cannot be proven:

```text
journal RECOVERY_REQUIRED / UNCERTAIN
bootstrap ownership remains held
no start
no Host reacquire
no old Host resume
```

- [ ] **Step 3: Implement minimal stop terminal path**

Release bootstrap ownership only after there is no remaining planned mutation.

- [ ] **Step 4: Verify**

```bash
pnpm nx run bootstrap-runtime:test
pnpm nx run private-postgres:test
```

- [ ] **Step 5: Commit**

```bash
git add packages/bootstrap-runtime
git commit -m "feat: stop private postgres through reverse handoff"
```

---

### Task 8 — Implement same-cluster restart and fresh Host reacquisition

**Status: COMPLETE.** Explicit stop→start, same-cluster/profile validation, fresh Host lease/token publication, release ordering, candidate cleanup, and `{ kind: "RESTARTED" }` are implemented and tested.

**Files:**

- Modify: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Modify: `packages/bootstrap-runtime/src/managed-host.ts`
- Extend: `packages/bootstrap-runtime/src/host-maintenance.test.ts`
- Extend: `packages/bootstrap-runtime/src/host-ownership-handoff.test.ts` if shared creation logic is factored.

**Interfaces:**

- Consumes maintenance state `ENTERED`.
- Produces a new `BootstrapManagedHostContext`.

- [ ] **Step 1: Write failing restart trace**

```text
ENTERED
→ open maintenance controller
→ stop()
→ POSTGRES_STOPPED
→ start()
→ validate same clusterSystemIdentifier
→ validate same persisted port/profile revision
→ POSTGRES_READY
→ acquire new dedicated Host lease while bootstrap lock still HELD
→ HOST_LEASE_ACQUIRED
→ create fresh HostOwnershipToken B
→ publish B under fence and receive HostOwnershipPublicationResult
→ HOST_TOKEN_PUBLISHED
→ persist token B + publishedRevision in MaintenanceJournal
→ assert new Host ACTIVE
→ journal BOOTSTRAP_RELEASE_ARMED (terminalOutcome still absent)
→ release bootstrap ownership
→ BootstrapJournal records bootstrap.maintenance.completed
→ in-memory state COMPLETED
→ return new managed Host
```

- [ ] **Step 2: Prove identity/fencing requirements**

Tests:

```text
new token B != old token A
same BootId allowed
fence revision increments for revoke and again for publish
cluster system identifier unchanged
persisted port unchanged
old managed Host cannot be reused
new managed Host state ACTIVE
bootstrap release occurs after token B commit
```

- [ ] **Step 3: Do not provision missing ownership artifacts during normal maintenance**

The established Host database/schema/roles are expected to exist.

If reacquisition cannot connect/authenticate/publish because canonical ownership artifacts are missing/incompatible:

```text
fail closed
RECOVERY_REQUIRED
```

Do not silently recreate a corrupted established ownership substrate as part of routine restart.

- [ ] **Step 4: Add late-failure tests**

At minimum:

```text
PG ready, new lease acquisition fails
new lease acquired, token publication fails
token B committed, bootstrap release fails
new lease dies before return
```

Rules:

```text
never return false ACTIVE
never reuse token A
if token B committed but bootstrap release uncertain -> new Host fenced/closed, RECOVERY_REQUIRED
```

- [ ] **Step 5: Implement restart/reacquire**

Reuse the existing M4 Host ownership primitives.

Do not copy M4 provisioning logic wholesale.

- [ ] **Step 6: Verify**

```bash
pnpm nx run foundation-contracts:test
pnpm nx run private-postgres:test
pnpm nx run host-ownership:test
pnpm nx run bootstrap-runtime:test
```

- [ ] **Step 7: Commit**

```bash
git add packages/bootstrap-runtime
git commit -m "feat: reacquire host after postgres maintenance"
```

---

### Task 9 — Fence raw lease release behind quiesced managed shutdown

**Status: COMPLETE.** Managed shutdown now proves quiescence before raw lease close and leaves PostgreSQL lifecycle untouched; failure ordering tests are present.

**Files:**

- Modify: `packages/bootstrap-runtime/src/managed-host.ts`
- Extend: `packages/bootstrap-runtime/src/managed-host.test.ts`
- Extend bootstrap journal stage tests if shutdown fallback records are added.

**Interfaces:**

- Implements:
  - `shutdownKeepingPrivatePostgres(quiescence)`

- [ ] **Step 1: Write failing ordering test**

```text
Host ACTIVE
→ quiesce()
→ Host assertActive
→ raw Host ownership close
→ Host CLOSED
→ PostgreSQL lifecycle control never called
```

- [ ] **Step 2: Add failure tests**

```text
quiesce failure -> lease not closed
lease closes after quiesce -> no resume
lease close uncertain -> Host not reported ACTIVE
```

- [ ] **Step 3: Implement**

The raw low-level Host ownership context remains an internal mechanics object of the Bootstrap Closure.

- [ ] **Step 4: Verify**

```bash
pnpm nx run bootstrap-runtime:test
```

- [ ] **Step 5: Commit**

```bash
git add packages/bootstrap-runtime
git commit -m "fix: require quiescence before host lease shutdown"
```

---

### Task 10 — Fault-injection matrix for Authority continuity

**Status: COMPLETE for deterministic unit seams.** Revocation, maintenance-controller, safe-abort, stop uncertainty, publication failure, and release-order failure seams are covered by deterministic tests. Live PostgreSQL concurrency/failure evidence remains Task 11.

**Files:**

- Extend: `packages/bootstrap-runtime/src/host-maintenance.test.ts`
- Extend: `packages/host-ownership/src/ownership-revocation.test.ts`
- Extend: `packages/private-postgres/src/maintenance-controller.test.ts`

**Interfaces:** no new public interface unless a missing test seam is strictly necessary.

- [ ] **Step 1: Add deterministic failpoints**

Cover at least:

```text
after bootstrap lock acquired before journal create
after journal create before BootstrapState pointer commit
after pointer commit before quiesce
during quiesce
after quiesce before fence lock
while fence FOR UPDATE waits
after fence lock before UPDATE
after UPDATE before COMMIT
COMMIT response ambiguous
after committed revocation before old lease close
during old lease close
after old lease close before PG stop
during PG stop
after proven PG stop before PG start
during PG start
after PG ready before new lease
after new lease before token B publication
after token B COMMIT before verification
after token B verified before bootstrap release
during bootstrap release
```

- [ ] **Step 2: Assert the phase policy**

Table-driven expected rules:

```text
before PONR + exact old Host still proven
  -> abort/resume permitted

revocation uncertain or committed
  -> old Host never resumes

PG process outcome uncertain
  -> no opposite lifecycle command issued

new token not proven
  -> bootstrap not released

bootstrap release uncertain after token B
  -> MaintenanceJournal remains BOOTSTRAP_RELEASE_ARMED
  -> new Host fenced/closed and not returned ACTIVE
  -> BootstrapJournal records release failure/uncertainty where possible
```

- [ ] **Step 3: Assert journal and state-pointer truth**

For every injected failure:

```text
MaintenanceJournal stage/outcome matches proven reality
BootstrapState operation ref points to the operation once committed
no secret/plaintext/path leakage
```

- [ ] **Step 4: Run package suites**

```bash
pnpm nx run bootstrap-state:test
pnpm nx run private-postgres:test
pnpm nx run host-ownership:test
pnpm nx run bootstrap-runtime:test
```

- [ ] **Step 5: Commit**

```bash
git add packages
git commit -m "test: harden m5a maintenance authority failures"
```

---

### Task 11 — Real PostgreSQL 18.6 M5A qualification

**Status: COMPLETE for Linux qualification; Windows/macOS remain NOT_RUN.** The explicit PostgreSQL 18.6 bin root was supplied from an extracted Ubuntu 26.04 package qualification root. The three real-PG targets passed: private-postgres 20/20, host-ownership 8/8, and bootstrap-runtime 17/17.

**Files:**

- Extend: `packages/host-ownership/src/host-ownership.integration.test.ts`
- Create: `packages/bootstrap-runtime/src/host-maintenance.integration.test.ts`
- Modify: `packages/bootstrap-runtime/project.json`
- Modify other integration target declarations only where required.

**Prerequisite:**

Use the repository's qualified toolchain resolver and explicit `HEPTALOGOS_TEST_PG_BIN`.

Do not hardcode `.exe`.

- [ ] **Step 1: Add integration target**

`bootstrap-runtime:test:integration` must include:

```text
private-postgres-bootstrap.integration.test.ts
host-ownership-handoff.integration.test.ts
host-maintenance.integration.test.ts
```

- [ ] **Step 2: Scenario A — complete reverse restart**

Prove:

```text
Host A ACTIVE token A
→ M5A bootstrap lock acquired
→ journal/pointer created
→ quiesce
→ token A revoked
→ Host A lease closed
→ PG stopped
→ PG started same identity/port
→ Host B lease acquired
→ fresh token B published
→ bootstrap released
→ B ACTIVE
→ A unusable
```

Assert fence revision delta is exactly the two ownership mutations:

```text
+1 revoke
+1 publish B
```

- [ ] **Step 3: Scenario B — old FOR SHARE transaction blocks revocation**

Using a test-only PostgreSQL client:

```text
Host A token A active
→ Tx A locks fence FOR SHARE
→ maintenance revocation starts and blocks
→ Tx A commits
→ revocation completes
```

This proves reverse handoff serializes behind already-entered old canonical transactions.

- [ ] **Step 4: Scenario C — bootstrap lock prevents competing bootstrap**

While M5A owns bootstrap lock:

```text
Bootstrap B acquisition -> conflict
Bootstrap B cannot start/stop/restart PG
Bootstrap B cannot acquire/publish normal Host
```

After successful restart and bootstrap release, a new bootstrap attempt may acquire the filesystem lock and then must yield when the new Host lease is active.

- [ ] **Step 5: Scenario D — stop-and-exit**

Prove:

```text
token revoked
lease closed
PG proven STOPPED
MaintenanceJournal = BOOTSTRAP_RELEASE_ARMED (not terminal SUCCEEDED)
bootstrap lock released
BootstrapJournal records bootstrap.maintenance.completed
no active Host
```

- [ ] **Step 6: Scenario E — keep-PG-running shutdown**

Prove:

```text
quiescence happens before lease close
PG remains running
old token remains only as non-authoritative historical fence value
next legitimate bootstrap/Host acquisition publishes a fresh token
```

- [ ] **Step 7: Scenario F — Host lease loss during maintenance entry**

Force the dedicated lease session to die after bootstrap ownership is acquired.

Expected:

```text
no normal ACTIVE result
no unsafe old Host resume
no PG lifecycle command unless token state and Authority path are safely resolved
MaintenanceJournal records RECOVERY_REQUIRED/UNCERTAIN as proven
```

This is a live concurrency/failure test, not yet the M5B process-death recovery test.

- [ ] **Step 8: Scenario G — private-PG same-identity proof**

After restart:

```text
cluster system identifier identical
persisted port identical
effective loopback/HBA/profile identical
```

- [ ] **Step 9: Run real PostgreSQL suites**

```bash
pnpm nx run private-postgres:test:integration
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
```

Record exact:

```text
candidate SHA
OS/platform
Node/pnpm
PostgreSQL exact version
HEPTALOGOS_TEST_PG_BIN provenance
suite counts
```

- [ ] **Step 10: Commit**

```bash
git add packages
git commit -m "test: qualify m5a postgres reverse handoff"
```

---

### Task 12 — Boundary enforcement, evidence, roadmap truth, and review gate

**Status: COMPLETE for local and Linux qualification evidence.** Boundary/dependency/repository/corpus checks, full local verification, and Linux PostgreSQL 18.6 qualification are recorded. Independent review, final cross-platform CI, Windows/macOS qualification, and merge remain outstanding.

**Files:**

- Modify relevant repository boundary/dependency governance checks.
- Modify: `Architecture_Corpus/qualification/results/Q-PRIVATE-POSTGRES-01.md`
- Modify: `Architecture_Corpus/qualification/results/qualification-status.json`
- Regenerate: `Architecture_Corpus/manifest.json`
- Regenerate: `Architecture_Corpus/SHA256SUMS.txt`
- Modify: `docs/roadmap/development-roadmap.md`
- Keep this plan active until merge.

**Boundary requirements:**

```text
raw pg imports
  -> host-ownership only

raw HostOwnershipContext.close orchestration
  -> bootstrap-runtime managed Host wrapper only for normal Host consumers

proper-lockfile mechanics
  -> bootstrap-runtime bootstrap ownership adapter only

pg_ctl/process mechanics
  -> private-postgres only

MaintenanceJournal file mechanics
  -> bootstrap-state
  -> bootstrap-runtime owns Authority-scoped access

XState in bootstrap-runtime
  -> local maintenance FSM mechanics only
  -> no XState public type leakage

old ReadyPrivatePostgres stop/restart
  -> still cannot control ALREADY_RUNNING after M4 handoff

Kysely / DBOS / Cordis
  -> absent from M5A implementation
```

- [ ] **Step 1: Run repository boundary gates**

```bash
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm check:boundaries
```

- [ ] **Step 2: Run formatting and full verification**

```bash
pnpm format:check
pnpm verify
```

Expected: exit 0.

- [ ] **Step 3: Record M5A qualification fields**

Add only evidence actually run, e.g.:

```text
m5a_maintenance_journal_integrity
m5a_bootstrap_before_host_revocation
m5a_quiescence_before_revocation
m5a_host_token_revocation
m5a_old_transaction_serialization
m5a_old_host_not_resumed_after_ponr
m5a_existing_cluster_maintenance_control
m5a_private_postgres_stop
m5a_same_cluster_restart
m5a_fresh_host_reacquisition
m5a_bootstrap_release_after_new_token
m5a_keep_postgres_running_shutdown_order
m5a_windows_real_pg
m5a_linux_real_pg
m5a_macos_real_pg
m5a_independent_review
m5a_final_cross_platform_ci
```

Use exactly:

```text
PASS | FAIL | NOT_RUN | BLOCKED
```

- [ ] **Step 4: Preserve H1 truth**

After M5A implementation:

```text
M5A reverse handoff / normal maintenance = implemented at recorded evidence level
M5B abandoned-lock / local Recovery       = OPEN
H1                                         = OPEN
H2A/H2B                                    = not yet authorized by H1 closure
```

Do not mark H1 closed.

- [ ] **Step 5: Ready for independent review**

Resolve exact candidate:

```bash
git rev-parse HEAD
```

Update PR body/evidence without falsely claiming independent review.

- [ ] **Step 6: Independent review**

Reviewer must review exact HEAD.

Any behavior/evidence commit afterward invalidates authorization.

- [ ] **Step 7: Final cross-platform CI**

Run the repository-required manual final CI on the **exact independently reviewed SHA**.

Do not commit a “final CI passed” evidence change afterward if doing so changes HEAD and violates exact-SHA governance. Record final-CI authorization/result in the approved non-git metadata path used by repository governance.

- [ ] **Step 8: Squash merge only after gates**

After merge, a subsequent milestone branch may move this plan to completed and open M5B.

---

## 10. Verification command set

Before using these commands, confirm the actual post-M4 project targets still match repository `project.json` files.

### Focused units

```bash
pnpm nx run foundation-contracts:test
pnpm nx run bootstrap-state:test
pnpm nx run private-postgres:test
pnpm nx run host-ownership:test
pnpm nx run bootstrap-runtime:test
```

### Real PostgreSQL

```bash
pnpm nx run private-postgres:test:integration
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
```

### Permanent gates

```bash
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm check:boundaries
pnpm format:check
pnpm verify
```

### Claim boundaries

Unit/mocked evidence MAY prove:

```text
state-machine transitions
ordering
capability provenance
journal codec/store
deterministic fault classification
secret absence in mocked surfaces
```

Real PostgreSQL evidence is REQUIRED for:

```text
FOR SHARE vs FOR UPDATE serialization
real advisory lease continuity
real token revoke/publish
real role/auth behavior
same-cluster stop/start
lease session destruction behavior
```

M5A MUST NOT claim:

```text
process-death recovery
abandoned-lock recovery
native OS RecoveryPrincipal proof
```

from unit or in-process integration tests. Those are M5B claims.

---

## 11. M5A acceptance matrix

Required before calling the implementation candidate ready for independent review:

```text
post-M4 actual master baseline used                              PASS
MaintenanceJournal V1 canonical/digested/atomic                 PASS
MaintenanceJournal current/previous recovery behavior           PASS
fresh bootstrap lease acquired; released M4 lease not reused    PASS
BootstrapState operation pointer committed under lock           PASS
raw M4 Host close hidden from managed normal Host surface       PASS
quiescence required before intentional Host lease release       PASS
bootstrap ownership acquired before token revocation            PASS
token revocation uses fixed bootstrap-admin transaction         PASS
revocation verifies exact token + BootId + InstanceId           PASS
revocation revision increments exactly                          PASS
old FOR SHARE transaction serializes before revocation          PASS
PONR defined and mechanically enforced                          PASS
safe pre-PONR abort verifies old Host before resume             PASS
old Host never resumes after PONR                               PASS
old ReadyPrivatePostgres capability remains invalidated         PASS
ALREADY_RUNNING M3 stop/restart denial remains                  PASS
maintenance-only existing-cluster controller added              PASS
maintenance restart is explicit stop -> start                   PASS
PG stop outcome proven or UNCERTAIN                             PASS
PG start outcome proven or UNCERTAIN                            PASS
restart preserves cluster identity / port / profile             PASS
fresh Host token after restart                                  PASS
bootstrap released only after fresh token publication           PASS
no false durable success across non-atomic lock release          PASS
release-armed journal survives release failure truthfully        PASS
old managed Host unusable after maintenance                     PASS
keep-PG-running shutdown quiesces before lease close            PASS
no automatic stale bootstrap-lock takeover                      PASS
no LOCAL_INSTALLATION_OWNER Recovery implementation             PASS
no H2A/H2B/DBOS/Management scope creep                          PASS
qualification truth records NOT_RUN where appropriate           PASS
```

Milestone merge additionally follows repository review/final-CI governance.

---

## 12. STOP conditions

Stop execution and return to architecture review if implementation appears to require any of the following:

1. Releasing the Host lease before bootstrap ownership is acquired.
2. Revoking the token before a quiescence proof.
3. Performing maintenance fence revocation through an API that turns expected SQL lock timeout into automatic Host lease loss without explicit design.
4. Reusing or resurrecting the M3/M4 `ReadyPrivatePostgres` session token.
5. Reusing/reactivating the released M2/M4 `BootstrapOwnershipLease` or `OwnedBootstrapPrelude` instead of acquiring a fresh maintenance lease.
6. Allowing plain bootstrap filesystem ownership alone to stop an already-running normal Host PostgreSQL before token revocation/lease handoff.
7. Reusing the old `HostOwnershipToken` after restart.
8. Resuming the old Host after revocation commit/uncertainty.
9. Voluntarily releasing bootstrap ownership from a `RECOVERY_REQUIRED` state merely to avoid a held lock.
10. Automatically deleting/unlocking an abandoned `proper-lockfile`.
11. Detecting stale ownership only from wall-clock age.
12. Creating a generic Recovery shell/SQL executor.
13. Creating a second PostgreSQL driver or process manager.
14. Pulling Kysely/PersistenceService into M5A.
15. Pulling Cordis/RuntimeReconciler into M5A to implement the quiescence seam.
16. Pulling DBOS/WorkQueue into M5A.
17. Adding normal Management/Policy/Approval solely to authorize this internal milestone.
18. Silently recreating missing/corrupt established Host ownership objects during routine maintenance.
19. Marking H1 CLOSED before M5B.

---

## 13. Successor contract: M5B — Bounded Bootstrap Recovery & H1 Closure

M5A must leave the following durable inputs for M5B:

```text
versioned MaintenanceJournal
BootstrapState lastCommittedOperationRef
explicit RECOVERY_REQUIRED / UNCERTAIN terminal/non-normal stages
no automatic stale-lock takeover
private-PG exact identity/profile metadata
HostOwnershipFence token/revision state
per-BootId BootstrapJournal
```

M5B then owns:

```text
RecoveryPrincipal = LOCAL_INSTALLATION_OWNER
bootstrap lock owner-record / abandoned-owner proof
OS process-liveness and ownership checks
explicit bounded unlock/recovery mechanics
incomplete MaintenanceJournal resume/adjudication
recovery with PostgreSQL running/stopped/uncertain
safe mode / diagnostics projection needed for H1
real kill/restart qualification
H1 closure decision
```

M5B MUST NOT infer:

```text
old token means old Host is alive
lock age alone means owner is dead
PostgreSQL process absent means data is safe to reinitialize
journal missing means destructive repair is allowed
```

Only after M5B closes the remaining H1 scenarios may the roadmap authorize parallel H2A/H2B work.

---

## 14. Recommended commit sequence

Prefer behaviorally meaningful commits:

```text
1. docs: open Foundation M5A maintenance handoff
2. feat: add crash safe maintenance journal
3. feat: bind maintenance journal to bootstrap authority
4. feat: add managed host maintenance capability
5. feat: revoke host ownership under bootstrap authority
6. feat: add private postgres maintenance control
7. feat: enter bootstrap owned maintenance window
8. feat: stop private postgres through reverse handoff
9. feat: reacquire host after postgres maintenance
10. fix: require quiescence before host lease shutdown
11. test: harden m5a maintenance authority failures
12. test: qualify m5a postgres reverse handoff
13. docs: record Foundation M5A evidence
```

Combining adjacent commits is acceptable only where splitting would leave an invalid build or create an artificial intermediate public contract.

Do not create dozens of mechanical “file added” commits.

---

## 15. Execution record template

Do not fill PASS until executed.

```text
M5A baseline master SHA:
M5A branch:
PostgreSQL qualification version:
Primary development OS:

Task 0 baseline pnpm verify:
Task 1 MaintenanceJournal:
Task 2 ownership-scoped journal pointer:
Task 3 managed Host/quiescence:
Task 4 token revocation:
Task 5 maintenance controller:
Task 6 reverse-handoff entry:
Task 7 stop path:
Task 8 restart/reacquire path:
Task 9 keep-PG-running shutdown:
Task 10 fault matrix:
Task 11 real PG integration:
Task 12 permanent gates:

Windows real PG:
Linux real PG:
macOS real PG:
source-less shipping closure:
service-account ACL closure:

M5A independent review:
M5A final cross-platform CI:
M5A squash merge:

M5B:
H1:
```

Recorded execution for the current branch:

```text
M5A baseline master SHA: c4b54b7dbe888c62b81d28203553c953d5a749c3
M5A branch: dev/m5a-reverse-handoff-maintenance-window
implementation candidate: 7ca699d16aeaf863dab091253ac42a11b744a0bf
PostgreSQL qualification version: 18.6 (Ubuntu 26.04 extracted package bin root)
Primary development OS: Linux x86_64

Task 0 baseline pnpm verify: PASS (Node 24.19.0; Node 26 engine mismatch is not the canonical toolchain)
Task 1 MaintenanceJournal: PASS
Task 2 ownership-scoped journal pointer: PASS
Task 3 managed Host/quiescence: PASS
Task 4 token revocation: PASS
Task 5 maintenance controller: PASS
Task 6 reverse-handoff entry: PASS
Task 7 stop path: PASS
Task 8 restart/reacquire path: PASS (unit/mocked evidence)
Task 9 keep-PG-running shutdown: PASS (unit evidence)
Task 10 fault matrix: PASS (deterministic unit seams)
Task 11 real PG integration: PASS on Linux (private-postgres 20/20, host-ownership 8/8, bootstrap-runtime 17/17)
Task 12 permanent gates: PASS locally; Windows/macOS qualification and independent review/final CI NOT_RUN

Windows real PG: NOT_RUN
Linux real PG: PASS
macOS real PG: NOT_RUN
source-less shipping closure: NOT_RUN
service-account ACL closure: NOT_RUN

M5A independent review: NOT_RUN
M5A final cross-platform CI: NOT_RUN
M5A squash merge: NOT_RUN

M5B: OPEN
H1: OPEN
```

Corrective execution record (2026-08-22):

```text
rejected review SHA: 65a56c7a8906e49658d8a304d0903668d8f64228
corrected behavior candidate: 9fd68d4656921c344a0ef637d31e91f127d53eaf

RC-1 MaintenanceJournal complete target ownership pair: PASS
RC-2 operation-local old-Host retirement across PONR/recovery uncertainty: PASS
RC-3 live Scenario F PostgreSQL Host-lease backend termination: PASS on Linux PostgreSQL 18.6

Task 0 review-correction record: PASS
Task 1 partial target ownership RED tests and pair validation: PASS
Task 2 old managed-Host terminalization and idempotent raw close: PASS
Task 3 live Scenario F using pg_terminate_backend during quiesce: PASS
Task 4 corrected candidate unit/package gates: PASS
Task 4 corrected candidate real PostgreSQL gates: PASS
Task 4 corrected candidate pnpm verify: PASS
Task 5 qualification/evidence reconciliation: PASS

Corrected candidate unit evidence: bootstrap-state 82 passed/2 skipped;
private-postgres 58 passed; host-ownership 70 passed; bootstrap-runtime
85 passed/1 skipped.
Corrected candidate real PostgreSQL 18.6 evidence on Linux:
private-postgres 20/20, host-ownership 8/8, bootstrap-runtime 17/17.

M5A independent review: NOT_RUN
M5A final cross-platform CI: NOT_RUN
Windows real PostgreSQL: NOT_RUN
macOS real PostgreSQL: NOT_RUN
M5B: OPEN
H1: OPEN
```

Corrective pass 2 execution record (2026-08-22):

```text
reviewed HEAD with REQUEST_CHANGES: 001ef97f070ecf3a6993c6e129a26de1925862e7
new blocker: PONR old-Host close Promise rejection was not observed immediately
corrected behavior candidate: f9f105c47a8559d386fabd761d026441a8dd2764

PONR close rejection observer regression: PASS
close-failure regression: immediate old Host close rejection + delayed HOST_TOKEN_REVOKED journal
close failure follows normal maintenance error path: PASS
old managed Host terminal after close rejection: PASS
RECOVERY_REQUIRED persisted while bootstrap ownership is HELD: PASS
no unhandledRejection escaped: PASS

Task 4 corrected candidate unit/package gates: PASS
Task 4 corrected candidate real PostgreSQL gates: PASS
Task 4 corrected candidate pnpm verify: PASS

Corrected candidate unit evidence: bootstrap-state 82 passed/2 skipped;
private-postgres 58 passed; host-ownership 70 passed; bootstrap-runtime
86 passed/1 skipped.
Corrected candidate real PostgreSQL 18.6 evidence on Linux:
private-postgres 20/20, host-ownership 8/8, bootstrap-runtime 17/17.

M5A review of prior HEAD: REQUEST_CHANGES
M5A re-review of corrected candidate: NOT_RUN
M5A final cross-platform CI: NOT_RUN
Windows real PostgreSQL: NOT_RUN
macOS real PostgreSQL: NOT_RUN
M5B: OPEN
H1: OPEN
```

Expected planning-time values:

```text
M5B = OPEN
H1  = OPEN
```
