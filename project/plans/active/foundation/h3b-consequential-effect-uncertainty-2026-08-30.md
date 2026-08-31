# Heptalogos H3B — Consequential Effect & Uncertainty

## Decision-Complete Implementation, Qualification & Closure Plan

**Plan date:** 2026-08-30
**Status:** ACTIVE
**Plan class:** Foundation / H3B behavior candidate
**Current Horizon:** H3 — Survive Asynchrony
**Executable Truth target:** H3 effect-boundary process proof on top of the already-green Foundation L3 spine
**Intended canonical active path:** `project/plans/active/foundation/h3b-consequential-effect-uncertainty-2026-08-30.md`
**Suggested behavior branch:** `dev/h3b-effect-uncertainty`
**Next bounded stage after closure:** H3-S Foundation Containment / Stabilization
**Ordinary GitHub Actions:** disabled; not a closure requirement unless the user explicitly authorizes a one-off run

> This artifact is not repository Authority until explicitly installed as the current ACTIVE Plan.
> Once activated, the executing Agent implements the decisions below. It does not choose a different architecture, provider route, state model, package owner, retry policy, compatibility strategy, or stage order. A material unresolved semantic/ownership/provider/state/failure/evidence decision that blocks the authorized work is `PLAN_GAP`.

---

## Active-plan amendment — PR #31 review correction (2026-08-31)

This bounded amendment supersedes only the original dispatch/recovery wording
that conflates a live concurrent observer with an abandoned dispatch.

```text
dispatch() observes DISPATCHING
→ return the current operation unchanged
→ no canonical mutation
→ no recovery
→ no external port call

explicit recoverDispatch() on a recovered WorkHandler invocation
→ Host-fenced DISPATCHING → UNCERTAIN
→ retain recovery Activity/Evidence
→ never call the external port
```

The current WorkHandler distinguishes these cases using the existing durable
WorkItem invocation boundary: an operation observed as `DISPATCHING` by
`prepare()` at invocation start takes explicit recovery, while a caller that
loses the `PREPARED → DISPATCHING` admission race only observes the live state.
The existing WorkHandler and Host abort signals are composed with Node's
`AbortSignal.any()` and passed into the admitted dispatch. Recovery failure is
fail-stop; there is no recovery-of-recovery, retry loop, scheduler, or state
expansion.

The corrected qualification boundary is six real PostgreSQL service tests plus
six process tests for EU-01 through EU-06, for twelve tests in the combined
target. Provider, cross-platform, source-less, service/headless, and hardware
claims remain individually `NOT_RUN` unless actually executed.

Where the original dispatch algorithm below says that calling `dispatch()` on
`DISPATCHING` recovers the operation, this amendment is authoritative for the
current candidate: only the explicit `recoverDispatch()` operation performs
that first-order recovery.

---

# 0. Activation, Authority and Current-Truth Reconciliation

## 0.1 Activation preconditions

Before source mutation:

1. start from the current merged `master`;
2. require a clean working tree except for deliberate Plan activation/current-truth edits;
3. read:
   - `/AGENTS.md`;
   - `project/plans/README.md`;
   - `project/roadmap/development-roadmap.md`;
   - `project/governance/constitution.md`;
   - `project/governance/engineering-principles.md`;
   - `project/governance/compatibility-obligations.json`;
   - `project/dependencies/dependency-routing.json`;
   - `project/qualification/dependency-status.json`;
   - `specs/INDEX.md`;
   - `specs/execution/work-item.md`;
   - `specs/execution/durable-dispatch.md`;
   - `specs/execution/execution-lineage.md`;
   - `specs/execution/evidence.md`;
   - `specs/data/persistence-transactions.md`;
   - `specs/data/canonical-schema.md`;
   - `docs/architecture/authority-and-core-concepts.md`;
   - `docs/architecture/execution-model.md`;
   - `docs/architecture/data-evidence-persistence.md`;
   - `docs/architecture/messaging.md`;
   - `docs/architecture/subject.md`;
4. confirm H3A-2 implementation remains closed and the existing Foundation executable-spine target remains present and green at its last recorded evidence boundary;
5. confirm no other ACTIVE product/Foundation Plan claims implementation Authority.

Do not persist a branch/commit SHA into this Plan as standing semantic Authority. If `master` has materially changed after this Plan was authored, re-read current typed Authority. If the change invalidates a locked decision below, stop with `PLAN_GAP`; otherwise execute against the current tree.

## 0.2 Plan installation

Activation creates the canonical active path if absent:

```text
project/plans/active/foundation/h3b-consequential-effect-uncertainty-2026-08-30.md
```

Update `project/plans/INDEX.md` with one ACTIVE entry. Do not create a second active H3B Plan.

## 0.3 Roadmap truth repair is Task 0, not a new governance project

Update only living current-truth statements in `project/roadmap/development-roadmap.md` that are stale or contradictory.

Required conceptual truth after activation:

```yaml
H3: OPEN
H3A: FUNCTIONALLY_COMPLETE
H3A_1: CLOSED
H3A_2: CLOSED
H3_FOUNDATION_EXECUTABLE_SPINE: PASS
H3B: IN_PROGRESS
H3_FUNCTIONAL: IN_PROGRESS
H3_STABILIZATION: ELIGIBLE_AFTER_H3B
currentRepositoryWork: H3B Consequential Effect & Uncertainty
githubActions: DISABLED_CURRENT_EXECUTION_POLICY
```

Use existing Roadmap prose/status vocabulary where possible. Do not build a new status enum merely to encode the text above.

Also:

- replace the deleted development-branch baseline wording with current merged-`master` integration wording;
- remove the H0 phrase that describes a “current live PR”;
- preserve all claim-scoped `NOT_RUN` evidence;
- do not reopen the completed Harness/governance Plan;
- do not claim H3 closed.

## 0.4 Sequencing decision: H3B precedes H3-S

H3-S is already technically eligible because H3A-2 and the Foundation executable spine are closed. It is nevertheless sequenced **after H3B** for this development line.

Reason:

```text
H3A durable obligation/recovery
→ H3B consequential external-effect truth
→ H3-S one-pass subtraction/containment
→ minimum provider prerequisites
→ H6 Subject L4 slice
```

Running H3-S before H3B would stabilize the H3 Foundation and then immediately add the final H3 semantic owner. That weakens the purpose of a single containment pass.

This is a Roadmap sequencing choice, not a new Architecture dependency.

---

# 1. Executive Outcome

H3B answers one bounded question:

> Can Heptalogos authorize one consequential external write, preserve the difference between “request attempted” and “effect known”, crash or lose Host authority around the external call, and recover without silently redispatching an effect whose real-world outcome is ambiguous?

H3B must establish:

```text
durable WorkItem / current domain obligation
→ deterministic EffectOperation identity
→ PREPARED canonical EffectOperation
→ Host-fenced PREPARED → DISPATCHING admission
→ exactly one admitted external dispatch call in the current H3B model
→ SUCCEEDED | FAILED | UNCERTAIN canonical effect truth
→ WorkItem settles from canonical effect truth
→ process restart does not redispatch DISPATCHING/UNCERTAIN
→ optional reconciliation may refine UNCERTAIN to SUCCEEDED/FAILED
   without re-performing the effect
```

The capability is complete when a real process-level test proves both a known effect outcome and:

```text
external side effect may have happened
+ process dies before canonical outcome commit
→ restart
→ EffectOperation = UNCERTAIN
→ no second external write
```

H3B does not prove a real network provider, IM Driver, Subject, Configuration, SecretService, NetworkAccess platform, or shipping artifact.

---

# 2. Existing Contracts H3B Consumes and Does Not Reopen

Unless current evidence exposes a blocking defect, consume as fixed inputs:

```text
HostOwnershipToken / Host-fenced canonical mutation
PersistenceService
ExecutionContext / Activity / LineageContextRef
EvidenceService
TimeService
canonical-schema PRE_PRODUCTION baseline
WorkItem canonical Authority
dispatchRevision / DispatchAttemptId
generation-pinned WorkHandler
WorkAdmissionPort
Signal = best-effort wakeup only
DBOS static durable dispatcher
DBOS Queue = scheduling mechanics only
DurableCodeVersion
Foundation executable-spine composition
bounded Host/runtime quiescence and close behavior
```

Hard boundaries:

```text
WorkItem state          != EffectOperation state
DBOS workflow status   != EffectOperation Authority
provider/transport ACK != EffectOperation Authority until canonically committed
throw/timeout           != FAILED by default
UNCERTAIN               != retry permission
EffectOperation         != generic workflow engine
EffectOperation         != CapabilityBroker
EffectOperation         != NetworkAccess
```

No H3B task is authorized to redesign H3A merely because a different shape would be aesthetically cleaner.

---

# 3. Locked Decisions

## D-01 — H3B scope is deliberately narrow

Implement only:

```text
canonical EffectOperation
EffectOperation identity
immutable versioned request envelope
PREPARED → DISPATCHING → SUCCEEDED | FAILED | UNCERTAIN
Host-fenced state transitions
one admitted dispatch per EffectOperation in the H3B model
external request key
no-auto-redispatch uncertainty
read-only reconciliation seam
WorkItem/effect outcome coupling
Lineage + required Evidence
process-level crash/restart proof
```

Explicit non-goals:

```text
full NetworkAccess platform
HTTP client abstraction
provider fleet/registry
Messaging Driver stack
Subject
AI provider integration
generic retry engine
global Effect broker
saga/compensation framework
multi-step transaction orchestration
ResourceGovernor
Backup/Restore
ContinuityEpoch restore reconciliation
Configuration/Secret implementation
Policy/Approval
MCP
source-less shipping closure
service/headless closure
hardware power-loss hardening
```

## D-02 — Add one semantic owner package

Create:

```text
packages/effect-operation/
```

Package identity:

```text
@heptalogos/effect-operation
```

It owns:

- EffectOperation contract and current state semantics;
- strict request/outcome normalization;
- canonical repository transitions;
- dispatch/reconciliation orchestration around an injected effect-specific port;
- Effect-specific Problems;
- Lineage/Evidence calls required by its transitions.

It does not own external protocol/network mechanics, provider discovery, WorkItem semantics, Runtime generation semantics, DBOS, Host lease, generic retry, or global scheduling.

A separate semantic owner is justified because EffectOperation is durable canonical product truth and must not be absorbed by `work-queue`, `persistence`, `durable-execution`, or `foundation-contracts`.

Do not create additional `effects-core`, `effect-runtime`, `effect-registry`, `effect-engine`, `effect-common`, or equivalent packages.

## D-03 — No new external dependency

H3B uses existing repository/adopted mechanics only.

Expected mechanics:

```text
PostgreSQL / PersistenceService
Kysely/pg only behind existing Persistence boundaries
TypeBox/Ajv only through SchemaRuntime where schema validation is required
ExecutionLineage / Evidence
TimeService
Node AbortSignal
existing test/process mechanics
```

Do not add another state-machine, retry, queue, workflow, network, or lifecycle dependency.

The EffectOperation state graph is small enough to remain explicit domain transition logic. Do not introduce XState solely for five canonical states.

If a new external dependency appears necessary, stop with `PLAN_GAP`.

## D-04 — Add Effect identities to the existing low-level identity owner

Extend `foundation-contracts` with:

```text
EffectOperationId = UUIDv7 branded identity
EffectKindId      = namespaced semantic identity
```

Required constructors/parsers:

```text
createEffectOperationId()
parseEffectOperationId(...)
createEffectKindId(...)
parseEffectKindId(...)
```

Reuse existing UUIDv7 and namespaced-ID mechanics. Do not duplicate identifier parsing inside the new package.

Do not add provider-specific identifiers to Foundation contracts.

## D-05 — EffectOperation current durable contract is V1

Current canonical shape:

```ts
interface EffectOperation {
  readonly schemaVersion: 1;
  readonly effectOperationId: EffectOperationId;
  readonly effectKind: EffectKindId;
  readonly requestVersion: number;
  readonly request: CanonicalJsonValue;
  readonly state: "PREPARED" | "DISPATCHING" | "SUCCEEDED" | "FAILED" | "UNCERTAIN";
  readonly lineageContextRef: LineageContextRef;
  readonly dispatchHostOwnershipToken?: HostOwnershipToken;
  readonly outcome?: EffectOutcome;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
}
```

The exact import location for existing branded types follows current repository ownership.

The request is immutable after first successful prepare.

No V2/V3 is created for development iteration. Compatibility remains governed by `project/governance/compatibility-obligations.json`.

## D-06 — Request is immutable and caller-supplied identity is required

Preparation request:

```ts
interface EffectPreparationRequest {
  readonly effectOperationId: EffectOperationId;
  readonly effectKind: EffectKindId;
  readonly requestVersion: number;
  readonly request: unknown;
}
```

`prepare()`:

1. requires current `ExecutionContext`;
2. validates identifiers and positive `requestVersion`;
3. snapshots request as canonical JSON without mutation/coercion;
4. inserts `PREPARED` with creation lineage;
5. if the same `effectOperationId` exists:
   - identical `effectKind + requestVersion + canonical request` returns existing operation idempotently;
   - any difference is `effect.identity_conflict`.

The service does not generate the ID internally. The caller generates it before durable handoff so a WorkItem payload can carry the same identity across retries.

## D-07 — External request identity is the EffectOperationId

For H3B:

```text
externalRequestKey = EffectOperationId
```

The dispatch port receives this stable key.

A future provider may map it to an idempotency key/request token if the external system supports that mechanic. H3B does not create a second dispatch-attempt identity because H3B permits only one admitted dispatch for an EffectOperation.

Do not add speculative attempt/revision tables for future redispatch.

## D-08 — Canonical state graph

Allowed:

```text
PREPARED
  → DISPATCHING

DISPATCHING
  → SUCCEEDED
  → FAILED
  → UNCERTAIN

UNCERTAIN
  → SUCCEEDED   // reconciliation only
  → FAILED      // reconciliation only
```

Forbidden:

```text
DISPATCHING → PREPARED
UNCERTAIN   → PREPARED
UNCERTAIN   → DISPATCHING
SUCCEEDED   → *
FAILED      → *
```

`SUCCEEDED` and `FAILED` are terminal.

`UNCERTAIN` is stable current truth that may later be refined only by positive external reconciliation evidence.

## D-09 — Only the PREPARED → DISPATCHING winner may call the port

Dispatch admission is a Host-fenced canonical mutation equivalent to:

```text
UPDATE effect_operation
SET state = DISPATCHING,
    dispatch_host_ownership_token = current Host token,
    updated_at = now
WHERE effect_operation_id = ?
  AND state = PREPARED
RETURNING ...
```

Semantics are fixed:

- concurrent callers cannot both receive dispatch admission;
- only the caller that committed `PREPARED → DISPATCHING` may invoke the external port;
- an observer of `DISPATCHING`, `SUCCEEDED`, `FAILED`, or `UNCERTAIN` must not invoke the external port.

No in-memory mutex is Authority.

## D-10 — Host ownership fences canonical transitions; uncertainty fences the real-world race

Immediately before the external call, check the caller's abort/ownership signal if the current Host/runtime composition supplies one.

If ownership/admission is already lost **before the call begins**, do not call the port.

If a definitive “not invoked / not applied” outcome can still be committed under current Host Authority, record `FAILED`.

If Host Authority is already lost and no definitive canonical outcome can be committed, fail the WorkItem attempt. A later owner observes `DISPATCHING` and applies D-12.

Once the external call may have started, ownership loss or cancellation cannot prove the external world rolled back. The operation therefore remains ambiguous until canonical evidence proves otherwise.

Do not implement lease reacquire or external-call rollback.

## D-11 — Dispatch port contract distinguishes knowledge, not retry policy

Use a narrow injected per-effect adapter contract equivalent to:

```ts
interface EffectDispatchPort {
  readonly effectKind: EffectKindId;

  dispatch(input: {
    readonly effectOperationId: EffectOperationId;
    readonly externalRequestKey: string;
    readonly requestVersion: number;
    readonly request: CanonicalJsonValue;
    readonly signal: AbortSignal;
  }): Promise<
    | { readonly status: "SUCCEEDED"; readonly receipt?: CanonicalJsonValue }
    | { readonly status: "FAILED"; readonly problem: Problem }
    | { readonly status: "UNCERTAIN"; readonly problem?: Problem }
  >;

  reconcile?(input: {
    readonly effectOperationId: EffectOperationId;
    readonly externalRequestKey: string;
    readonly requestVersion: number;
    readonly request: CanonicalJsonValue;
    readonly signal: AbortSignal;
  }): Promise<
    | { readonly status: "SUCCEEDED"; readonly receipt?: CanonicalJsonValue }
    | { readonly status: "FAILED"; readonly problem: Problem }
    | { readonly status: "UNKNOWN" }
  >;
}
```

Equivalent naming/decomposition is allowed. Semantics are not.

Rules:

- `FAILED` means the adapter has positive basis to claim the requested external effect did not succeed.
- an exception/rejected Promise from `dispatch()` is normalized to `UNCERTAIN` unless the adapter has already returned definitive `FAILED`;
- cancellation/timeout after call admission is `UNCERTAIN` unless positive evidence proves no effect;
- `UNKNOWN` reconciliation leaves `UNCERTAIN`;
- `reconcile()` is observation only. It cannot perform the write again.

No adapter registry is implemented in H3B. The current consumer passes the exact port directly.

## D-12 — Recovered DISPATCHING is ambiguous by construction

If WorkItem retry/restart encounters:

```text
EffectOperation.state = DISPATCHING
```

it must **not call `dispatch()` again**.

The first current owner handling that recovered operation performs a Host-fenced:

```text
DISPATCHING → UNCERTAIN
```

with a recovery Activity/Evidence record indicating dispatch admission was durable but external outcome was not canonically known.

This intentionally treats:

```text
crash after DISPATCHING commit but before actual external call
```

as `UNCERTAIN`.

That is conservative but prevents false certainty and duplicate external reality.

Do not add a “probably not sent” heuristic.

## D-13 — WorkItem success is not external-effect success

A WorkHandler whose obligation is to materialize EffectOperation truth succeeds when it has durably established:

```text
SUCCEEDED
FAILED
UNCERTAIN
```

The WorkItem outcome may report EffectOperationId and current effect state.

Thus:

```text
Effect FAILED    may correspond to WorkItem SUCCEEDED
Effect UNCERTAIN may correspond to WorkItem SUCCEEDED
```

because the durable processing obligation completed truthfully.

Do not throw an `external-effect-uncertain` WorkQueue retry merely because the effect is `UNCERTAIN`.

An infrastructure failure to read/commit canonical EffectOperation truth may fail the WorkItem attempt. On retry, D-09/D-12 still prevent another external dispatch.

## D-14 — Reconciliation only refines uncertainty

`EffectOperationService.reconcile()`:

- accepts only `UNCERTAIN`;
- requires exact matching `port.reconcile`;
- performs no external write;
- runs under current ExecutionContext and Host-fenced mutation for any refinement;
- maps `SUCCEEDED`/`FAILED` to canonical refinement;
- maps `UNKNOWN` to no state change;
- records Lineage/Evidence;
- never calls `dispatch()`.

Do not implement a background reconciliation scheduler in H3B.

## D-15 — Required Effect Evidence is explicit

State-changing Effect activities are product-significant.

Use current `ExecutionContextRuntime`, `ExecutionLineageService`, and `EvidenceService`.

Semantic Activity kinds:

```text
effect.prepare
effect.dispatch
effect.recover-uncertain
effect.reconcile
```

Required Evidence distinctions:

```text
effect.prepared
effect.dispatch-started
effect.outcome
effect.reconciled
```

Exact string spelling follows current naming conventions, but the semantic distinctions must remain.

Atomicity/fail-safe rules:

- `PREPARED` insert + retained prepare Activity + required prepare Evidence commit together;
- `PREPARED → DISPATCHING` + retained dispatch Activity + dispatch-started Evidence commit together;
- known `SUCCEEDED | FAILED | UNCERTAIN` + dispatch Activity completion + required outcome Evidence commit together where current APIs permit the owner transaction;
- recovery `DISPATCHING → UNCERTAIN` records its own retained Activity/Evidence in the same mutation;
- reconciliation refinement records its own retained Activity/Evidence in the same mutation.

Operational logs/telemetry are not substitutes.

## D-16 — H3B schema rewrites the PRE_PRODUCTION baseline

Modify:

```text
packages/canonical-schema/src/migrations/0001-foundation-baseline.ts
```

Do not add `0002-h3b`, an upgrade bridge, legacy reader, dual schema, or compatibility shim.

Current table:

```text
heptalogos.effect_operation
```

Required logical columns:

```text
effect_operation_id
schema_version
effect_kind
request_version
request
state
lineage_context_ref
dispatch_host_ownership_token
outcome
created_at
updated_at
```

Use current repository canonical PostgreSQL types/constraints.

Required invariants:

```text
schema_version = 1
request_version > 0
state in PREPARED | DISPATCHING | SUCCEEDED | FAILED | UNCERTAIN

PREPARED:
  dispatch_host_ownership_token IS NULL
  outcome IS NULL

DISPATCHING:
  dispatch_host_ownership_token IS NOT NULL
  outcome IS NULL

SUCCEEDED | FAILED | UNCERTAIN:
  dispatch_host_ownership_token IS NOT NULL
  outcome IS NOT NULL
  outcome.status matches state
```

Request fields and EffectOperationId never mutate.

No provider-specific table/column is added.

## D-17 — Outcome contract is V1 and minimal

```ts
type EffectOutcome =
  | {
      readonly schemaVersion: 1;
      readonly status: "SUCCEEDED";
      readonly receipt?: CanonicalJsonValue;
    }
  | {
      readonly schemaVersion: 1;
      readonly status: "FAILED";
      readonly problem: Problem;
    }
  | {
      readonly schemaVersion: 1;
      readonly status: "UNCERTAIN";
      readonly problem?: Problem;
    };
```

Do not create Blob/Artifact handling, media storage, or a global size-configuration surface in H3B.

If a real provider later requires large retained material, that provider/Horizon introduces an Artifact reference under a new Plan.

## D-18 — No production `work-queue` semantic change is planned

The new package integrates through a generation-pinned WorkHandler in qualification without changing WorkItem state semantics.

Production changes to `work-queue` are not authorized by default.

If the existing WorkHandler contract cannot represent:

```text
handler completed successfully
+ EffectOperation current state = FAILED or UNCERTAIN
```

stop with `PLAN_GAP` rather than redesigning WorkQueue ad hoc.

## D-19 — No production Bootstrap composition expansion

Use `bootstrap-runtime` only as the established integration/process proof boundary.

Production `packages/bootstrap-runtime/src/**` must not acquire EffectOperation, Messaging, Network, Subject, or provider orchestration.

H3B test/support code may compose the new package with the real Foundation stack.

## D-20 — H3B does not implement real provider/network policy

Qualification uses a deterministic synthetic external system.

Use a file-backed or equivalent test-only external sink outside canonical PostgreSQL so the test can prove:

```text
external write happened
while
canonical outcome commit did not
```

This is a semantic/process proof, not live-provider qualification.

Do not open H4/H6/H7 merely to make H3B “more realistic”.

---

# 4. Ownership and Dependency Direction

Target:

```text
foundation-contracts
        │
        ├──────────────► execution-lineage
        ├──────────────► evidence
        └──────────────► effect-operation
                               │
persistence ───────────────────┤
time-service ──────────────────┤
execution-lineage ─────────────┤
evidence ──────────────────────┘

canonical-schema
  materializes the table
  but does not depend on effect-operation

work-queue
  remains independent of effect-operation

durable-execution
  remains independent of effect-operation

runtime-kernel
  remains independent of effect-operation

bootstrap-runtime/src
  remains independent of effect-operation

bootstrap-runtime test/integration
  may import effect-operation for process-level qualification
```

The new package may depend on:

```text
@heptalogos/foundation-contracts
@heptalogos/persistence
@heptalogos/execution-lineage
@heptalogos/evidence
@heptalogos/time-service
```

Add only dependencies actually used.

Do not expose raw Kysely, pg, DBOS, Cordis, or XState types through the public surface.

---

# 5. EffectOperation Public Surface

## 5.1 Contracts

Export:

```text
EffectOperation
EffectOperationState
EffectOutcome
EffectPreparationRequest
EffectPreparationResult
EffectDispatchPort
EffectDispatchResult
EffectReconciliationResult
EffectOperationService
```

Do not export repository internals or persistence transaction handles from package root.

## 5.2 Service

Preferred semantic surface:

```ts
interface EffectOperationService {
  get(effectOperationId: EffectOperationId): Promise<EffectOperation | undefined>;

  prepare(request: EffectPreparationRequest): Promise<{
    readonly status: "CREATED" | "EXISTING";
    readonly operation: EffectOperation;
  }>;

  dispatch(
    effectOperationId: EffectOperationId,
    port: EffectDispatchPort,
    options?: { readonly signal?: AbortSignal },
  ): Promise<EffectOperation>;

  reconcile(
    effectOperationId: EffectOperationId,
    port: EffectDispatchPort,
    options?: { readonly signal?: AbortSignal },
  ): Promise<EffectOperation>;
}
```

Equivalent object-argument APIs are permitted if they better match repository style.

A caller never receives a mutable EffectOperation object.

## 5.3 Repository

Repository owns exact SQL/CAS transitions:

```text
get
insertPrepared
beginDispatch
completeDispatch
recoverDispatchAsUncertain
refineUncertain
```

Each mutating operation uses normal Host-fenced Persistence/Foundation repository seams.

No raw `pg.Client`, Kysely root, or DBOS handle escapes.

---

# 6. Dispatch Algorithm

## 6.1 Prepare

```text
caller already owns/generates EffectOperationId
→ validate + canonical-snapshot request
→ current ExecutionContext required
→ run Activity effect.prepare
→ Host-fenced insert PREPARED
→ retain Activity + required Evidence in same mutation
→ same id/same immutable request: EXISTING
→ same id/different immutable request: identity conflict
```

No external call occurs.

## 6.2 Dispatch from PREPARED

```text
load operation
→ verify exact EffectKind matches supplied port
→ if PREPARED:
     run Activity effect.dispatch
     Host-fenced CAS PREPARED → DISPATCHING
     persist current HostOwnershipToken
     retain dispatch-started Evidence
     commit
     if CAS lost:
        reload current state
        DO NOT call external port
     if CAS won:
        check abort/ownership signal immediately before call
        call port.dispatch exactly once
        normalize observation
        Host-fenced commit SUCCEEDED | FAILED | UNCERTAIN
        complete Activity + record outcome Evidence
        return canonical operation
```

Any exception after external-call admission is ambiguous unless positive no-effect evidence exists.

If final canonical commit fails, do not call the external port again in the same execution path.

## 6.3 Dispatch called on non-PREPARED

```text
DISPATCHING:
  do not dispatch
  do not recover
  return current DISPATCHING unchanged

SUCCEEDED | FAILED | UNCERTAIN:
  do not dispatch
  return current canonical operation
```

This makes WorkItem retry safe.

## 6.4 Reconcile

```text
load UNCERTAIN
→ require matching port.reconcile
→ call read-only reconciliation
→ UNKNOWN: leave UNCERTAIN
→ definitive SUCCEEDED/FAILED:
     Host-fenced refinement
     Lineage/Evidence
→ never call dispatch
```

---

# 7. WorkItem Coupling

H3B qualification uses current WorkQueue/DurableExecution mechanics instead of creating a second effect scheduler.

## 7.1 Synthetic Effect WorkHandler

Add a test/qualification-only generation-pinned WorkHandler whose canonical payload contains at least:

```text
schemaVersion: 1
effectOperationId
effectKind
requestVersion
request
mode
```

`mode` belongs only to the test fixture and must not enter permanent EffectOperation contracts.

Handler:

```text
service.prepare(...)
→ service.dispatch(...)
→ return WorkItem outcome:
   {
     effectOperationId,
     effectState
   }
```

It does not throw merely because `effectState` is `FAILED` or `UNCERTAIN`.

## 7.2 Retry/restart

If the WorkItem is re-invoked:

- PREPARED can admit the one external call;
- DISPATCHING becomes UNCERTAIN with no call;
- terminal/UNCERTAIN state returns without external call.

Tests count external writes independently of WorkItem attempts.

## 7.3 No Effect scheduler

Do not add:

```text
EffectQueue
EffectReconciler timer
Effect poller
second DBOS workflow family
second Signal topic
```

A future domain may create WorkItems carrying EffectOperationIds. H3B proves effect semantics inside current durable-work mechanics.

---

# 8. Authorized Failure Model and Complexity Admission

## 8.1 Current maturity

```text
H3 Foundation
Executable Proof Level L3
no real Subject/provider/Driver yet
```

## 8.2 Authorized failure classes

### F0 — HAPPY_PATH

Required:

- prepare;
- dispatch success;
- definitive dispatch failure;
- WorkItem settlement;
- normal stop/restart.

### F1 — COMMON_OPERATIONAL

Required:

- invalid effect kind/request;
- port kind mismatch;
- abort before external call;
- adapter returns definitive failure;
- adapter rejects/throws after dispatch admission → uncertain;
- terminal/idempotent re-entry.

### F2 — EXPECTED_RECOVERY

Required:

- crash after PREPARED exists but before external call;
- crash after DISPATCHING commit before outcome commit;
- crash after external write but before canonical outcome commit;
- WorkItem retry after canonical terminal/uncertain state;
- Host ownership loss prevents stale canonical completion.

### F3 — RARE_TIMING_FAULT

Only this F3 class is authorized because it is the H3B semantic core:

```text
external call may have crossed the process boundary
while canonical outcome did not commit
```

Correct result: `UNCERTAIN`, not heroic recovery.

Do not expand to broad race hardening.

### F4 — CATASTROPHIC_HARDENING

Deferred:

```text
power loss
disk corruption
kernel crash
torn hardware writes
multi-fault recovery
external system corruption
```

## 8.3 Complexity admission

| Proposed complexity                     | Decision  | Reason                                     |
| --------------------------------------- | --------- | ------------------------------------------ |
| New `effect-operation` semantic package | IMPLEMENT | current canonical owner required           |
| EffectOperationId / EffectKindId        | IMPLEMENT | current cross-package semantic identities  |
| Five-state effect model                 | IMPLEMENT | current uncertainty distinction            |
| One dispatch CAS                        | IMPLEMENT | prevents duplicate admitted dispatch       |
| Required Evidence/Lineage               | IMPLEMENT | current Authority/provenance invariant     |
| Injected dispatch/reconcile port        | IMPLEMENT | separates truth from provider mechanics    |
| Effect attempt/revision table           | REJECT    | no current redispatch requirement          |
| Global provider registry/broker         | DEFER     | no current multi-provider consumer         |
| Background effect reconciliation worker | DEFER     | no current provider/reconciliation product |
| Generic retry engine                    | REJECT    | conflicts with uncertainty semantics       |
| Compensation/saga framework             | DEFER     | no current multi-step effect consumer      |
| NetworkAccess implementation            | DEFER     | H4/H6/H7 prerequisite lane                 |
| XState for effect states                | REJECT    | graph is small domain logic                |
| New external library                    | REJECT    | no current mechanics gap                   |
| Compatibility readers/migrations        | REJECT    | PRE_PRODUCTION, no obligation              |

---

# 9. Implementation Tasks

Execute in order. Do not create extra phases because a task feels related.

## Task 0 — Activate Plan and reconcile living Roadmap truth

Files:

```text
project/plans/active/foundation/h3b-consequential-effect-uncertainty-2026-08-30.md
project/plans/INDEX.md
project/roadmap/development-roadmap.md
```

Actions:

1. install this Plan as the single ACTIVE Foundation plan;
2. repair the two known stale post-merge Roadmap phrases;
3. replace stale H3B/H3-S eligibility text with current truth;
4. record H3B as current authorized work;
5. keep all unrun qualification boundaries truthful;
6. do not edit Harness/Skill architecture.

Run:

```bash
pnpm check:knowledge
pnpm check:repository
```

Stop if Roadmap/Plan Authority cannot be made singular without changing project governance.

## Task 1 — Add normative EffectOperation Spec before behavior code

Create:

```text
specs/execution/effect-operation.md
```

Update:

```text
specs/INDEX.md
```

The Spec states:

- owner;
- state graph;
- immutable request;
- EffectOperationId/external request key;
- dispatch admission CAS;
- Host fencing;
- ambiguity classification;
- no automatic redispatch;
- recovered DISPATCHING rule;
- reconciliation rule;
- WorkItem/effect truth separation;
- Lineage/Evidence;
- PRE_PRODUCTION current-shape rule;
- relevant non-goals.

Use stable requirement IDs with suggested prefix:

```text
EFFECT
```

Do not copy implementation history into the Spec.

Run:

```bash
pnpm check:knowledge
```

## Task 2 — Extend Foundation identities

Files:

```text
packages/foundation-contracts/src/runtime-identity.ts
packages/foundation-contracts/src/index.ts
packages/foundation-contracts/test/unit/runtime-identity.test.ts
```

Tests prove:

- valid UUIDv7 EffectOperationId;
- malformed UUID rejection;
- valid namespaced EffectKindId;
- malformed/case/length rejection consistent with existing namespaced-ID semantics.

Do not create a new identity module unless current cohesion actually requires it.

## Task 3 — Materialize current EffectOperation schema

Files:

```text
packages/canonical-schema/src/migrations/0001-foundation-baseline.ts
packages/canonical-schema/**
```

only as required by current schema owner/test structure.

Add `heptalogos.effect_operation` and D-16 constraints.

Grant only existing runtime/mutation principal permissions required by PersistenceService. Do not grant DBOS system roles direct EffectOperation access.

If current schema tests have complete-table/ACL projection, update them.

Do not add a second migration.

## Task 4 — Create `@heptalogos/effect-operation`

Create the package using current workspace/package conventions.

Minimum source:

```text
packages/effect-operation/
  README.md
  package.json
  project.json
  tsconfig*.json as required by current package pattern
  src/
    contracts.ts
    problems.ts
    repository.ts
    service.ts
    index.ts
  test/
    unit/
```

Do not mechanically copy unused files from another package.

README owns purpose, semantic ownership, public surface, dependencies/handoffs, verification, and only the high-risk non-owner boundaries needed for clarity.

Update:

```text
packages/INDEX.md
```

as a manually authored retrieval projection. Do not add a fixed package allow-list validator.

## Task 5 — Implement strict contract normalization

In the new package:

- canonical snapshot request;
- validate effect kind/version/ID;
- parse database rows strictly;
- reject unsupported schema version;
- validate state-specific outcome constraints;
- preserve immutable request values;
- use canonical `Problem` mechanics;
- do not mutate caller objects.

Unit tests cover contract/state parsing and identity conflict.

## Task 6 — Implement canonical repository transitions

Repository methods implement D-08/D-09/D-12/D-14.

Required real-PostgreSQL concurrency tests:

1. two concurrent `beginDispatch` calls:
   - exactly one `ADMITTED`;
   - one canonical `DISPATCHING`;
2. stale Host token cannot complete/refine;
3. immutable request conflict rejected;
4. illegal transitions rejected;
5. repeated identical prepare idempotent;
6. recovered DISPATCHING becomes UNCERTAIN once and remains stable.

Use existing real-PostgreSQL fixture mechanics. Do not create a second database harness.

## Task 7 — Implement service + Lineage/Evidence

Compose:

```text
PersistenceService
ExecutionContextRuntime
ExecutionLineageService
EvidenceService
TimeService
```

Implement:

```text
get
prepare
dispatch
reconcile
```

Tests prove:

- no current ExecutionContext → fail closed;
- Effect Activity/Evidence retained on authoritative transitions;
- no secret/provider payload is invented or logged by the package;
- thrown dispatch defaults to UNCERTAIN;
- definitive adapter failure becomes FAILED;
- terminal re-entry never calls port;
- recovered DISPATCHING never calls port;
- UNKNOWN reconciliation preserves UNCERTAIN;
- positive reconciliation refines uncertainty without dispatch.

## Task 8 — Add synthetic external-effect process proof

Preferred owner:

```text
packages/bootstrap-runtime/test/integration/
packages/bootstrap-runtime/test/support/
```

because that boundary already composes the real Foundation process.

Do not modify `packages/bootstrap-runtime/src/**`.

Use semantic target/file names such as:

```text
effect-uncertainty
```

Do not name permanent tests after H3B, review rounds, or candidate numbers.

The synthetic external sink exists outside canonical PostgreSQL and exposes observable write count keyed by EffectOperationId.

Required scenarios:

### EU-01 — success

```text
fresh Foundation
→ WorkItem
→ prepare Effect
→ DISPATCHING
→ external sink write
→ SUCCEEDED commit
→ WorkItem SUCCEEDED
→ stop
```

Assert external write count = 1.

### EU-02 — definitive failure

```text
adapter positively reports no external success
→ Effect FAILED
→ WorkItem SUCCEEDED with effectState=FAILED
→ external write count = 0
```

### EU-03 — ambiguous crash after external write

Use a real child-process kill boundary:

```text
PREPARED
→ DISPATCHING committed
→ external sink write committed
→ kill process before Effect outcome canonical commit
→ restart same Instance
→ WorkItem recovery/retry
→ sees DISPATCHING
→ Effect UNCERTAIN
→ no second dispatch
→ WorkItem SUCCEEDED with effectState=UNCERTAIN
```

Assert:

```text
external write count = 1
Effect state = UNCERTAIN
WorkItem terminal = SUCCEEDED
```

### EU-04 — crash after DISPATCHING but before external write

```text
DISPATCHING committed
→ process killed before sink call
→ restart
→ UNCERTAIN
→ no sink call
```

Assert external write count = 0.

This deliberately proves conservative uncertainty.

### EU-05 — outcome committed before WorkItem terminal

```text
Effect SUCCEEDED committed
→ kill before WorkItem terminal commit
→ retry
→ no second sink write
→ WorkItem completes from canonical Effect state
```

Assert external write count = 1.

### EU-06 — Host loss after external call

Where current Host test mechanics can authentically trigger ownership loss:

```text
external write may have occurred
→ Host fence prevents stale outcome mutation
→ replacement/restart observes DISPATCHING
→ UNCERTAIN
→ no redispatch
```

Do not invent a new Host fault injector if current fixtures cannot express this. If this case cannot be exercised without broad test infrastructure, mark the scenario `BLOCKED`; do not manufacture test architecture. Closure then requires project-owner review of whether existing Host-fence proof + EU-03 matches the claimed boundary.

## Task 9 — Preserve the existing Foundation executable spine

Run unchanged:

```bash
HEPTALOGOS_TEST_PG_BIN=<qualified PostgreSQL 18 bin> \
pnpm nx run bootstrap-runtime:test:foundation-spine
```

If H3B causes the pre-existing spine to fail, repair the direct regression before continuing.

Do not extend the generic spine to include EffectOperation; H3B has its own semantic process proof.

## Task 10 — Current-tree H3B hygiene

Before Ready:

- no permanent source/test identifier contains `H3B`, candidate, correction, review-round, or branch provenance;
- no legacy reader/bridge migration/alias/shim is added;
- no dead draft Effect API remains;
- no duplicated provider/retry/scheduler mechanic exists;
- no raw DBOS/Cordis/Kysely/pg type leaks through the new package public surface;
- no new behavior-affecting literal is silently promoted to product Configuration without a current Configuration owner;
- no new validator/Skill/meta-framework is introduced merely because this Plan noticed an issue class.

Use existing checks. Manual keyword searches are evidence locators, not automatic deletion rules.

## Task 11 — Qualification and current-truth records

Update current qualification owner using repository format.

Preferred result:

```text
project/qualification/results/Q-EFFECT-01.md
```

Add/update `qualification-status.json` as required.

Required claim boundaries:

```yaml
effect_contract_unit: PASS
effect_real_postgres_transitions: PASS
effect_concurrent_dispatch_admission: PASS
effect_host_fenced_completion: PASS
effect_process_success: PASS
effect_process_definitive_failure: PASS
effect_process_ambiguous_crash: PASS
effect_no_redispatch_after_restart: PASS
effect_reconciliation_semantics: PASS
foundation_executable_spine_regression: PASS

real_network_provider: NOT_RUN
real_messaging_driver: NOT_RUN
real_ai_provider: NOT_RUN
source_less: NOT_RUN
service_headless: NOT_RUN
macos_real_effect_process: NOT_RUN unless actually executed
hardware_power_loss: NOT_RUN
```

Do not overwrite historical H3A qualification facts.

## Task 12 — Final local verification

Final candidate requires:

```bash
pnpm check:agents
pnpm check:knowledge
pnpm check:repository
pnpm check:hygiene
pnpm check:dependencies
pnpm check:boundaries
pnpm check:unused
pnpm check:duplicates
pnpm toolchain:check
pnpm format:check
pnpm verify
```

`pnpm verify` is final repository gate after the last behavior mutation.

Also run current real-PostgreSQL H3B process qualification and existing Foundation spine on the final candidate.

Ordinary GitHub Actions are not required.

---

# 10. Required Qualification Matrix

Every REQUIRED row must be current-candidate PASS before Ready.

| ID  | Property                                                                  | Boundary                   | Required |
| --- | ------------------------------------------------------------------------- | -------------------------- | -------- |
| E01 | EffectOperationId and EffectKindId strict identity                        | unit                       | REQUIRED |
| E02 | request is immutable canonical V1                                         | unit + real PG             | REQUIRED |
| E03 | identical prepare idempotent; conflicting prepare fails                   | real PG                    | REQUIRED |
| E04 | PREPARED→DISPATCHING has one concurrent winner                            | real PG concurrency        | REQUIRED |
| E05 | only admission winner invokes external port                               | service/process            | REQUIRED |
| E06 | known success commits SUCCEEDED                                           | real PG + process          | REQUIRED |
| E07 | positive no-effect failure commits FAILED                                 | real PG + process          | REQUIRED |
| E08 | thrown/ambiguous dispatch commits or recovers UNCERTAIN                   | process                    | REQUIRED |
| E09 | recovered DISPATCHING never redispatches                                  | process restart            | REQUIRED |
| E10 | UNCERTAIN never automatically becomes DISPATCHING                         | unit + real PG             | REQUIRED |
| E11 | reconciliation UNKNOWN preserves UNCERTAIN                                | unit/real PG               | REQUIRED |
| E12 | reconciliation refines to SUCCEEDED/FAILED without dispatch               | unit/real PG               | REQUIRED |
| E13 | stale Host token cannot complete/refine EffectOperation                   | real PG ownership          | REQUIRED |
| E14 | effect FAILED/UNCERTAIN does not force WorkItem retry                     | real WorkItem/DBOS process | REQUIRED |
| E15 | crash after external write before outcome commit produces one write       | child-process kill         | REQUIRED |
| E16 | crash before external write after DISPATCHING is conservatively UNCERTAIN | child-process kill         | REQUIRED |
| E17 | outcome committed before WorkItem terminal does not redispatch            | child-process restart      | REQUIRED |
| E18 | required Effect Lineage/Evidence retained                                 | real PG                    | REQUIRED |
| E19 | DBOS remains projection/work mechanics, not Effect Authority              | boundary + inspection      | REQUIRED |
| E20 | no scheduler/retry/broker/provider registry added                         | architecture review        | REQUIRED |
| E21 | no PRE_PRODUCTION compatibility baggage                                   | hygiene review             | REQUIRED |
| E22 | existing Foundation executable spine remains green                        | real PG + DBOS process     | REQUIRED |
| E23 | full repository `pnpm verify`                                             | repository                 | REQUIRED |
| E24 | real external network/provider behavior                                   | live provider              | NOT_RUN  |
| E25 | source-less/service/headless effect path                                  | product artifact           | NOT_RUN  |
| E26 | hardware power loss                                                       | hardware                   | NOT_RUN  |

If a REQUIRED claim cannot execute on the current environment for a reason that does not invalidate implementation, mark it `BLOCKED`, not PASS. The Plan cannot become Ready until the blocker is resolved or the Plan is explicitly amended by the project owner.

---

# 11. Package/Test Change Ceiling

Expected permanent product changes:

```text
packages/foundation-contracts/**
packages/canonical-schema/**
packages/effect-operation/**
packages/INDEX.md
specs/execution/effect-operation.md
specs/INDEX.md
```

Expected integration/qualification changes:

```text
packages/bootstrap-runtime/test/**
packages/bootstrap-runtime/project.json   # only if adding semantic test target
project/qualification/**
project/roadmap/development-roadmap.md
project/plans/**
```

Conditional changes only if directly required by a proven blocker:

```text
packages/evidence/**
packages/execution-lineage/**
packages/persistence/**
```

Do not change production:

```text
packages/work-queue/**
packages/durable-execution/**
packages/runtime-kernel/**
packages/runtime-substrate/**
packages/bootstrap-runtime/src/**
packages/host-ownership/**
```

unless current evidence proves existing public contract cannot satisfy a locked H3B invariant. That is normally `PLAN_GAP`, not implicit permission.

No H4/H5/H6/H7 package is authorized.

---

# 12. STOP / PLAN_GAP Conditions

Stop the blocking branch and report the smallest concrete evidence if:

1. EffectOperation cannot be canonical without bypassing Host-fenced Persistence.
2. WorkHandler retry semantics force a second external dispatch for `DISPATCHING`/`UNCERTAIN`.
3. Correct implementation requires changing WorkItem Authority or DBOS ownership.
4. Correct implementation requires a second durable queue/scheduler/workflow engine.
5. Correct implementation requires provider registry, CapabilityBroker, or NetworkAccess now.
6. Correct implementation requires a new external dependency.
7. Existing Host ownership cannot fence stale Effect mutation.
8. Existing ExecutionLineage/Evidence APIs cannot retain required effect transition evidence without material owner redesign.
9. The crash matrix can pass only through test-only behavior unavailable to production EffectOperation service.
10. Generic Effect request would need provider secret/raw credential.
11. Development-history compatibility reader/migration/shim appears necessary.
12. H4 Configuration/Secret semantics are required to define H3B truth.
13. Candidate requires broad Bootstrap/runtime/WorkQueue refactor.
14. Current `master` invalidates locked package/Authority assumptions.
15. A REQUIRED final claim remains `BLOCKED`.

Not every unrelated finding is a Plan Gap. Record/defer non-blocking issues under their proper owner.

---

# 13. Explicitly Deferred Findings

Record but do not implement:

```text
provider-specific idempotency policy
provider-specific request/receipt schema
automatic reconciliation scheduling
multi-attempt redispatch
human resolution of uncertain effects
compensation/saga semantics
restore handling for nonterminal effects
ContinuityEpoch reconciliation
NetworkAccess
Configuration/Secret binding
CapabilityBroker
Messaging Driver integration
AI SDK integration
MCP integration
UI/Management projection
source-less packaging
service mode
ResourceGovernor
```

A future Plan may rewrite PRE_PRODUCTION V1 if real consumers expose a better current design. No compatibility obligation arises from H3B development history.

---

# 14. Candidate Self-Review Before Ready

- [x] EffectOperation is canonical PostgreSQL truth.
- [x] WorkItem remains durable work Authority.
- [x] DBOS remains engine-private execution mechanics.
- [x] only PREPARED can admit dispatch.
- [x] concurrent dispatch admission has one winner.
- [x] external request key is stable per EffectOperation.
- [x] no automatic second dispatch exists.
- [x] recovered DISPATCHING becomes UNCERTAIN.
- [x] UNCERTAIN is not treated as failure fiction.
- [x] FAILED requires positive basis for known non-success.
- [x] thrown/ambiguous transport cannot silently become FAILED.
- [x] WorkItem can succeed while Effect is FAILED/UNCERTAIN.
- [x] stale Host cannot commit effect outcome.
- [x] reconciliation is read-only and cannot redispatch.
- [x] request is immutable and versioned.
- [x] required Effect Activity/Evidence exists.
- [x] no raw framework/provider mechanics leak through stable package API.
- [x] no provider registry, queue, retry engine, scheduler, or global broker exists.
- [x] no compatibility/history baggage exists.
- [x] permanent source/tests are phase-neutral.
- [x] real process crash after external write proves no redispatch.
- [x] existing Foundation spine remains green.
- [x] `pnpm verify` passes after last behavior mutation.
- [x] all unrun product/platform/provider claims remain `NOT_RUN`.

If all acceptance criteria are green, STOP. Do not start H3-S cleanup inside this branch.

---

# 15. Review, Candidate Freeze and Merge

Follow `project/engineering/playbooks/repository/milestone-pr-closure.md`.

## 15.1 Draft

Keep PR Draft while behavior/evidence changes.

Before Ready:

- required H3B qualification current-candidate PASS;
- existing Foundation spine PASS;
- `pnpm verify` PASS;
- Plan/Roadmap/qualification internally consistent;
- source/test provenance sweep complete;
- no admitted blocker remains.

## 15.2 Independent Review

Independent Review is external out-of-band Authority.

Do not infer it from GitHub PR review, approval, requested reviewer, comment, status check, or reaction.

On `REQUEST_CHANGES`:

```text
Ready → Draft
→ make only bounded corrections
→ rerun affected qualification
→ pnpm verify after final behavior change
→ request a new external verdict
```

A finding outside H3B scope is `RECORD/DEFER` unless it blocks a locked invariant.

## 15.3 Final verification

After external PASS, ensure the reviewed candidate has not changed.

Ordinary GitHub Actions remain disabled. Use local gates and required real-PostgreSQL/process qualification. A one-off Actions run occurs only if the user explicitly authorizes it.

Any behavior change after review invalidates the verdict.

## 15.4 Merge

Squash merge exact reviewed candidate when:

```text
Ready
+ external Independent Review PASS
+ final local verification current
+ branch/base current and conflict-free
```

Do not merge merely because GitHub reports green status objects.

---

# 16. Post-Merge Current-Truth Reconciliation

Post-merge reconciliation is part of this Plan's bounded lifecycle and must not reopen product behavior.

Required conceptual truth:

```yaml
H3: OPEN
H3A: FUNCTIONALLY_COMPLETE
H3A_1: CLOSED
H3A_2: CLOSED
H3B: CLOSED
H3_FUNCTIONAL: COMPLETE
H3_STABILIZATION: ELIGIBLE
H3_FOUNDATION_EXECUTABLE_SPINE: PASS

activeImplementationPlan: NONE
nextAuthorizedPlan: NONE
```

Do not mark H3 fully closed before H3-S.

Move Plan from:

```text
project/plans/active/foundation/
```

to:

```text
project/plans/completed/foundation/
```

Update `project/plans/INDEX.md`.

Qualification records retain exact observed boundaries. Merge fact does not turn `NOT_RUN` into PASS.

The next implementation authorization is a **new H3-S Plan**, not automatic continuation.

---

# 17. H3-S Handoff Contract

H3-S receives a Foundation where:

```text
Bootstrap/Host/Persistence        closed
Runtime composition              closed
WorkItem/Signal/DBOS             closed
EffectOperation uncertainty      closed
Foundation process spine         green
```

H3-S is one-pass convergence/subtraction:

```text
current-tree development residue
PRE_PRODUCTION compatibility baggage
speculative resilience
generic mechanics ownership
Bootstrap scope containment
current consumer/invariant audit
qualification/current-truth cleanup
Foundation + Effect executable revalidation
```

H3-S must not:

```text
add new product capability
add another Effect state
create provider/network platform
reopen H3B because a theoretical effect case exists
turn stabilization into another resilience cycle
```

After H3-S:

```text
minimum Configuration ownership
+ minimum Secret ownership
+ minimum Network/Capability policy needed by one real model provider
→ H6 Subject Base L4 vertical slice
```

Full H4/H5 is not automatically a prerequisite.

---

# 18. Suggested Semantic Commit Sequence

Guidance, not required commit count/text:

```text
docs: activate H3B effect uncertainty plan
docs: specify canonical EffectOperation semantics
feat: add effect identities and canonical schema
feat: add EffectOperation owner package
feat: fence effect dispatch and uncertainty transitions
test: prove real PostgreSQL effect concurrency and fencing
test: prove process crash uncertainty without redispatch
docs: record H3B qualification and current truth
```

Keep commits behaviorally coherent. Do not manufacture one commit per test or Plan subsection.

---

# 19. Final Executor Rule

The executor may choose only semantics-equivalent local details:

```text
private helper names
small internal file decomposition
SQL expression form
test fixture variable names
equivalent object-argument API syntax
formatting
```

The executor may not decide:

```text
whether H3B comes before H3-S
whether WorkItem or EffectOperation owns external truth
whether DBOS owns effect outcome
whether UNCERTAIN should be retried
whether timeout means FAILED
whether to add another attempt/revision
whether to add provider registry
whether to add NetworkAccess
whether to add new dependency
whether to create another queue
whether to introduce XState
whether to add compatibility migration/readers
whether to expand Bootstrap
whether to implement Subject/Messaging/AI
whether to harden F4 failures
```

If implementation reality invalidates one:

```text
STOP
→ preserve concrete evidence
→ report PLAN_GAP
→ return the decision to the project/Architecture owner
```

When required H3B executable/evidence path is green and the reviewed change is merged:

```text
STOP H3B.
```

Do not begin H3-S in the same change.
