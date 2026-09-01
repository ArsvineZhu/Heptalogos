# Heptalogos H3-S — Foundation Permanent-Surface Admission, Subtraction & Truth Closure

## Decision-Complete Implementation & Qualification Plan

**Plan date:** 2026-08-31
**Status:** READY FOR INSTALLATION AS THE SINGLE ACTIVE H3-S IMPLEMENTATION PLAN
**Intended repository path:** `project/plans/active/foundation/h3s-foundation-permanent-surface-admission-2026-08-31.md`
**Intended branch:** `dev/h3-stabilization`
**Observed master baseline:** `bbadfbacbd9aaea23639e51d5ce01744bd530da4` (`docs: reconcile H3B post-merge truth`)
**Compatibility epoch:** `PRE_PRODUCTION`
**Current declared compatibility obligations:** none
**Roadmap position:** H3 functional implementation is complete; H3-S is eligible but not yet authorized in the observed baseline.
**Next stage after successful H3-S closure:** minimum real-provider prerequisites, then H6 Subject Base.

> **Executor rule**
>
> This plan is decision-complete. The implementation Agent executes the locked
> decisions below; it is not authorized to reopen package ownership, dependency
> roles, recovery architecture, durable state, stage scope, test architecture,
> provider selection, H4/H5/H6 scope, or compatibility policy.
>
> Local implementation choices are allowed only when they preserve the exact
> semantics, public-surface reductions, file ceiling, and evidence policy in
> this plan.
>
> If current repository evidence directly contradicts a locked decision in a
> way that would require a new durable shape, new provider/dependency role,
> new product state, new scheduler/monitor/recovery layer, or a different
> semantic owner, stop with `PLAN_GAP` and report the smallest concrete facts.
> Do not improvise.

---

# 0. Executive decision

H3-S is **not another H3 hardening cycle**.

Its purpose is to decide which H3-created surfaces are entitled to become
permanent Foundation maintenance surface and to remove the rest while
preserving the already-proven Foundation executable truth.

The stage asks:

> Can H4/H6 treat H3 as a semantically clean, evidence-backed Foundation without
> inheriting H3's development scaffolding, test-driven public seams, duplicate
> mechanics, speculative recovery, or stale candidate truth?

The required end state is:

```text
H3 functional semantics remain correct
AND current qualification truth describes the merged current tree
AND development-stage / compatibility residue in executable surfaces = 0
AND dead or test-authorized public surfaces = 0 for the admitted H3 findings
AND speculative recovery-of-recovery / passive engine-monitor lane = removed
AND WorkQueue has one executable state authority, not an unused parallel FSM
AND Signal transport internals are not public product contracts
AND canonical Problem parsing is owned by the existing Problem semantic owner
AND no new dependency role / package / durable state / migration / scheduler appears
AND the L3 Foundation executable spine remains green
```

H3-S closes when those conditions are proven. It does not continue looking for
more work after closure criteria are green.

---

# 1. Governing Authority

The executor must re-read before editing:

```text
AGENTS.md
project/governance/constitution.md
project/governance/engineering-principles.md
project/governance/pre-production-evolution.md
project/governance/compatibility-obligations.json
project/dependencies/implementation-routing.md
project/engineering/playbooks/mechanics-ownership-and-library-first.md
project/engineering/playbooks/repository/current-tree-hygiene.md
project/engineering/playbooks/repository/milestone-pr-closure.md
project/plans/README.md
project/plans/INDEX.md
project/roadmap/development-roadmap.md
specs/execution/work-item.md
specs/execution/work-handler.md
specs/execution/durable-dispatch.md
specs/execution/signal.md
specs/execution/effect-operation.md
```

The following constraints are binding:

```text
Library-First:
existing semantic owner
→ existing repository primitive
→ adopted dependency route
→ Standard / Node / OS
→ mature library/framework
→ narrow adapter/composition
→ custom only with concrete insufficiency evidence

Anti-overengineering:
current consumer / current invariant / accepted current failure model
must authorize non-trivial permanent complexity.

Recovery:
first-order recovery does not authorize recovery-of-recovery.
Fail-stop is valid.

Testing:
tests do not authorize public API, DI, factories, wrappers, mock seams,
product state, failure branches, or a second implementation.

PRE_PRODUCTION:
no historical compatibility obligation exists unless explicitly declared in
project/governance/compatibility-obligations.json.

STOP:
when the accepted current path is green, stop.
```

---

# 2. Observed baseline and review findings

## 2.1 Repository state

At plan authoring time:

```yaml
master: bbadfbacbd9aaea23639e51d5ce01744bd530da4
masterMessage: "docs: reconcile H3B post-merge truth"
H3B: CLOSED
H3Functional: COMPLETE
H3S: ELIGIBLE_NOT_AUTHORIZED
activeImplementationPlan: NONE
ordinaryGitHubActions: DISABLED
```

The executor must verify the base before branch creation. If `master` has moved,
classify the movement:

```text
docs/evidence-only movement consistent with this plan
  → rebase plan baseline locally and proceed

behavior/architecture/dependency/durable-shape movement
  → PLAN_GAP
```

Do not silently execute this plan on a materially different H3 tree.

## 2.2 Current-tree provenance / compatibility sweep

Repository search and the existing hygiene gate indicate that `H3A` / `H3B`
identifiers are currently concentrated in historical or current-governance
surfaces such as completed/superseded Plans, Roadmap, and qualification records,
not in long-lived production/test identities.

Therefore:

```text
H3-S MUST run the existing hygiene/compatibility sweep.
H3-S MUST NOT invent rename/delete work merely to make the sweep look productive.
A clean result is a valid PASS outcome.
```

No new hygiene scanner, baseline, allowlist, suppression file, or phase-specific
gate is authorized.

## 2.3 Current qualification projection drift

`project/qualification/results/Q-ASYNC-01.md`,
`project/qualification/results/Q-RUNTIME-01.md`, and
`project/qualification/results/qualification-status.json` still contain
"current candidate" projections from the 2026-08-29 H3A-2 correction era,
including identifiers such as:

```text
H3A2-FOUNDATION-CONTAINMENT-2026-08-29
lifecycle: DRAFT
candidate freeze: NOT_RUN
plan path pointing at a superseded Plan
```

Those records contain valuable historical evidence, but the current projection
is stale relative to the merged H3 truth.

This is an H3-S current-truth blocker.

Historical evidence is preserved as historical evidence. It is not rewritten
into fictional PASS values.

## 2.4 Dead parallel WorkItem XState surface

Current `packages/work-queue/src/state-machine.ts` defines:

```text
createWorkItemStateMachine
canTransitionWorkItem
transitionWorkItemState
WorkItemTransitionEvent
```

using XState.

Repository-wide search finds no production consumer of these functions. The
surface is exported from the WorkQueue package root and tested by its own unit
test, while actual WorkItem lifecycle mutation is performed by the canonical
repository / WorkAttemptExecutor paths.

Therefore the current state-machine file is not delegated production mechanics;
it is a tested parallel representation of WorkItem state semantics.

That creates exactly the maintenance risk H3-S exists to remove:

```text
canonical repository transition logic
+
unused XState transition model
=
two state descriptions with only one execution authority
```

Keeping or "integrating" the XState machine is not authorized. Integration
would create work solely to justify an existing abstraction.

## 2.5 Passive RUNNING-versus-DBOS diagnostic lane

Current H3 contains:

```text
WorkQueueRecoveryCoordinator
DurableAttemptInspectionPort
DurableAttemptProjection
createDbosAttemptInspectionPort
DBOS getWorkflowStatus classification
WorkQueueReconcilerOptions.recovery
```

The coordinator scans canonical `RUNNING` WorkItems, reads DBOS workflow
projection state, and reports contradictions. It does not:

```text
redispatch
advance canonical WorkItem
repair DBOS state
recover a missing projection
terminalize WorkItem
```

Its current consumers are package tests and H3 process qualification
composition.

The actual first-order H3 process-crash recovery is a different path:

```text
DBOS durable recovery re-enters static dispatchWorkItem
→ same WorkItemId + dispatchRevision
→ WorkAttemptExecutor observes the same RUNNING attempt
→ exact generation-bound restartable handler executes
→ canonical commit remains revision/Host fenced
```

That path must remain.

The passive inspection lane is a recovery/diagnostic side-layer around the
adopted durable engine. It adds permanent contracts, status normalization,
periodic scans, public exports, tests, and DBOS coupling without owning a
current corrective action.

H3-S removes it.

## 2.6 WorkItem Spec overclaims engine-projection-loss recovery

Current `WI-008` groups together:

```text
Signal loss
engine projection loss
process restart
```

under one "recoverable through reconciliation" statement.

These are not the same failure class.

The current executable architecture proves:

```text
lost Signal
  → canonical rescan / anti-entropy

failed/lost projection before RUNNING
  → canonical PENDING remains rediscoverable

ordinary process crash after RUNNING
  → DBOS durable recovery re-enters the same attempt

arbitrary deletion/corruption/absence of DBOS durable projection after RUNNING
  → NOT a current automatic H3 recovery path
```

The last case must not be "fixed" by inventing a second engine monitor,
heuristic redispatch, attempt reconstruction, heartbeat, or recovery scheduler.

The Spec must be narrowed to the truth above.

## 2.7 EffectOperation public repository injection exists for unit tests

`EffectOperationServiceOptions` currently contains:

```ts
readonly repository?: EffectOperationRepository;
```

Normal real-PG/process composition uses the package-owned repository. The
override is consumed by the large service unit-test fixture.

The package root exports `EffectOperationServiceOptions`, making the injection
part of the public service-construction surface even though the repository type
itself is not a normal public contract.

The same service semantics are already exercised by real PostgreSQL and process
qualification.

H3-S removes this public test seam and does not replace it with a test factory,
DI container, fault-injection port, or second constructor.

## 2.8 Canonical Problem knowledge is duplicated inside EffectOperation

`foundation-contracts` owns:

```text
Problem
FieldError
RetryClass
createProblem
createProblemError
ProblemError
```

`effect-operation` currently duplicates the canonical Problem shape in its
private normalization logic, including:

```text
allowed field names
retryClass values
FieldError structure
causeProblemRefs
metadata shape
schemaVersion
canonical JSON checks
```

This is project semantic knowledge, not generic Effect semantics.

H3-S moves unknown→canonical-Problem parsing to the existing semantic owner
rather than adding SchemaRuntime to `foundation-contracts` or creating a new
codec package.

## 2.9 Signal test transport types leak through the package root

Current Signal root exports:

```text
PostgresSignalService class
SignalClient
SignalClientFactory
SignalClientOptions
SignalNotification
signalProblem
```

and public `PostgresSignalRuntimeOptions` includes:

```ts
clientFactory?: SignalClientFactory
```

Repository search shows the client abstractions are used by the Signal unit
test to deterministically drive connect/reconnect/late-event races; they are not
normal product consumers.

The package README itself states that listener client/query mechanics remain
internal.

H3-S internalizes these test-driver mechanics. The public consumer contract
remains the factory + semantic Signal interfaces.

## 2.10 Signal reconnect mechanics remain admitted

The Signal Spec explicitly requires:

```text
initial canonical scan
re-LISTEN after reconnect/loss
rescan after reconnect/loss
bounded close under owner scope
```

The current implementation provides that behavior over the already-adopted
`pg` route and Host credential/authority seam.

A bounded external comparator review performed for H3-S found no compelling
replacement that reduces total current maintenance burden without introducing
a worse route:

```text
pg-listen:
  reconnect-focused, but 1.7.0 is a long-stale TS3-era line.

postgres / Postgres.js:
  has LISTEN auto-reconnect but would introduce a second PostgreSQL client stack
  beside the already-adopted `pg`/Kysely path.

@imqueue/pg-pubsub:
  actively maintained but GPL-3.0-only and includes inter-process locking /
  schema/DDL mechanics well beyond Heptalogos Signal requirements.

pg-notify:
  MIT and reconnect-capable, but a small generic pubsub wrapper with different
  retry/lifecycle semantics; replacing the already-qualified Host-scoped adapter
  is not justified by a current blocker.
```

Therefore H3-S does not reopen the Signal dependency role and does not add a
LISTEN helper dependency.

## 2.11 Existing admitted mechanics not reopened

The review found no new evidence that requires reopening:

```text
RuntimeSubstrate Cordis scope/disposal adapter
RuntimeKernel XState lifecycle where it is actually executed
Runtime reconciliation/generation/readiness semantics
PrivatePostgres adopted process/XState adapters
Host ownership fencing
WorkQueue fair-scan cursor/ceiling policy
WorkAttemptExecutor first-order same-attempt RUNNING recovery
WorkAttemptExecutor cancellation/supersession AbortSignal path
Signal canonical rescan semantics
EffectOperation explicit recoverDispatch
```

H3-S records these as retained and does not refactor them for style or symmetry.

---

# 3. Locked H3-S decisions

The executor must treat these as architecture decisions, not suggestions.

## HS-01 — H3-S is subtraction/truth closure

No H4/H5/H6 product capability is allowed in this Plan.

No "while here" provider, Configuration, Secret, NetworkAccess, Capability,
Management, Subject, Messaging, AI SDK, MCP, media, backup, ResourceGovernor,
or product packaging work.

## HS-02 — No new durable shape

H3-S adds no:

```text
table
column
migration
schemaVersion
revision axis
attempt axis
lease
heartbeat
recovery state
continuity state
durable diagnostic record
```

The current single Foundation baseline migration remains the baseline.

## HS-03 — Remove the unused WorkQueue XState state machine

Delete:

```text
packages/work-queue/src/state-machine.ts
packages/work-queue/test/unit/state-machine.test.ts
```

Remove corresponding root exports.

Remove `xstate` from `packages/work-queue/package.json`.

Update the lockfile only as required by this dependency removal.

Do not replace the file with a handwritten transition table or another state
library. Actual repository/attempt transition enforcement remains the only
execution path.

The global adopted XState role remains unchanged because other current owners
still use it.

## HS-04 — Do not "integrate" the dead WorkQueue FSM

The finding is resolved by subtraction, not by calling the state machine before
every repository CAS merely to give it a consumer.

Tests for an unused secondary transition model are deleted.

## HS-05 — Remove the passive DBOS inspection/recovery-diagnostic lane

Delete the permanent lane comprising:

```text
packages/work-queue/src/recovery-coordinator.ts
packages/work-queue/test/unit/recovery-coordinator.test.ts

DurableAttemptInspectionPort
DurableAttemptInspectionRequest
DurableAttemptProjection

WorkQueueRecoveryCoordinator
WorkQueueRecoveryScanResult
createWorkQueueRecoveryCoordinator

packages/durable-execution/src/dbos-attempt-inspection.ts
packages/durable-execution/test/unit/dbos-attempt-inspection.test.ts
createDbosAttemptInspectionPort
```

Remove:

```text
WorkQueueReconcilerOptions.recovery
recovery.reset()
recovery.scan()
```

from the reconciler.

Remove only problem codes and tests made unreachable solely by this lane.

Update package READMEs and qualification composition accordingly.

## HS-06 — Preserve first-order DBOS crash recovery

Do not remove or redesign:

```text
static dispatchWorkItem workflow
deterministic DispatchAttemptId
DBOS applicationVersion fence
RUNNING same-attempt WorkAttemptExecutor re-entry
canonical terminal replay
stale revision no-op/fence
Host fence
generation-pinned WorkHandler
```

This is the H3 first-order crash-recovery path.

## HS-07 — Narrow the engine-projection-loss claim instead of inventing recovery-of-recovery

Update `specs/execution/work-item.md` and, if necessary for consistency,
`specs/execution/durable-dispatch.md` so the current failure semantics are
explicit:

```text
Signal loss:
  canonical rescan / anti-entropy.

projection/dispatch failure before RUNNING:
  canonical PENDING remains rediscoverable.

ordinary process crash after RUNNING:
  adopted durable engine re-enters the same deterministic attempt.

arbitrary loss/corruption of the durable engine projection after RUNNING:
  not a current automatic H3 recovery claim;
  canonical WorkItem remains authoritative;
  do not infer an outcome;
  do not heuristic-redispatch;
  fail/report at the current owner boundary.
```

Do not add replacement diagnostics or an operator workflow in H3-S.

## HS-08 — Prior review history does not create permanent product obligation

Historical H3A-2 review required authentic composition of the then-planned
RUNNING recovery coordinator.

That remains historical evidence for that candidate.

H3-S is explicitly the later permanent-surface admission stage. Current
Authority is the current Spec/Constitution/Roadmap plus current consumer and
failure-model evidence.

No historical review finding creates a compatibility obligation or requires
permanent retention when H3-S deliberately narrows a speculative failure claim.

## HS-09 — Remove the EffectOperation public repository test seam

Remove `repository?` from `EffectOperationServiceOptions`.

`createEffectOperationService()` always creates/uses its canonical package
repository through the current Persistence owner.

Delete the large repository-fake service unit test if it cannot operate without
the public seam.

Do not replace it with:

```text
createEffectOperationServiceForTests
EffectOperationServiceFactory
EffectRepositoryProvider
DI container
fault injector
public mock port
```

Keep contract/pure parsing tests and real-PG/process qualification.

## HS-10 — Move canonical Problem parsing to `foundation-contracts`

Add exactly one current owner primitive:

```ts
parseProblem(value: unknown): Problem | undefined
```

Requirements:

```text
strict current schemaVersion = 1
strict current allowed top-level fields
validate RetryClass
validate FieldError entries
validate causeProblemRefs
validate canonical metadata values
return a detached/canonicalized current Problem value
return undefined for invalid unknown input
no legacy/upcast/fallback behavior
```

Export it from `@heptalogos/foundation-contracts`.

Replace EffectOperation's duplicated Problem-shape validator with this primitive.

Do not create a new package, schema registry, generic codec framework, or
SchemaRuntime dependency for `foundation-contracts` in H3-S.

## HS-11 — Keep EffectOperation semantics unchanged

The Problem-parser ownership move must not change:

```text
EffectOperation identity
PREPARED / DISPATCHING / SUCCEEDED / FAILED / UNCERTAIN
dispatch admission
explicit recoverDispatch
pre-call abort
externalRequestKey = EffectOperationId
no automatic redispatch of UNCERTAIN
read-only reconciliation
Host fencing
Lineage/Evidence semantics
```

## HS-12 — Internalize Signal client/test mechanics

The Signal root public surface must no longer expose:

```text
PostgresSignalService class
SignalClient
SignalClientFactory
SignalClientOptions
SignalNotification
signalProblem
```

Public `PostgresSignalRuntimeOptions` must no longer include `clientFactory`.

Keep:

```text
createPostgresSignalService
SignalService
SignalSubscription
SignalListener
SignalPublisher
SignalTopic
SignalHostAuthority
PostgresSignalRuntimeOptions (runtime policy fields only)
Signal hint codec/current constants as currently required
```

The deterministic fake-client seam may remain module/package-private for the
existing unit tests. Tests inside the package may import an internal
implementation symbol directly. That does not make it a product contract.

Do not add a second exported "test API" subpath.

## HS-13 — Keep current Signal reconnect implementation

No new dependency/provider role is introduced.

Do not replace current reconnect/rescan with a new library in this stage.

No new reconnect state beyond what already exists.

## HS-14 — Remove unconsumed H3 problem-constructor root exports

If repository search at execution time still confirms no external current
consumer, remove root exports of package-private problem construction helpers:

```text
@heptalogos/signal: signalProblem
@heptalogos/work-queue: workQueueProblem
```

The helpers themselves may remain package-private where current implementation
uses them.

If a real production consumer is found, record it and keep the specific export;
do not redesign error ownership.

This is a bounded execution-time consumer check, not a general public-API purge.

## HS-15 — Keep WorkQueue repository composition seam

Do not confuse the Effect test seam with WorkQueue composition.

Keep the current restricted Foundation repository factory and repository
interface as required by the separate WorkQueue service/reconciler/executor
composition:

```text
@heptalogos/work-queue/foundation-repository
WorkQueueRepository
```

Do not create a mega WorkQueueRuntime factory merely to hide this composition.

## HS-16 — Keep WorkQueue fair-scan mechanics

`fair-scan.ts` is admitted:

```text
current invariant: bounded anti-entropy without starvation under continuous arrivals
surface: package-private
mechanics: small cursor + stable cycle ceiling
authority: WorkQueue scan policy
```

No library replacement or generalized pagination framework.

## HS-17 — Keep WorkAttempt cancellation/supersession delivery

The current AbortSignal path is used by real H3B Effect dispatch composition and
supports current cancellation/supersession semantics.

Keep the bounded process-memory cancellation monitor unless exact code
inspection finds an independent scheduler/state layer beyond the current
attempt lifetime.

Do not replace it with per-attempt LISTEN subscriptions, a cancellation broker,
or another durable state.

## HS-18 — Keep internal DBOS test seams only where package-private and necessary

Examples such as:

```text
createDurableDispatchPortForTests
resetDbosBindingForTests
```

may remain when they:

```text
are not package-root public API
do not introduce product state
do not create a second production implementation
exist only to isolate upstream process-global/provider behavior
```

`createDbosAttemptInspectionPortForTests` is removed because its whole
production lane is removed.

## HS-19 — Bootstrap production containment remains unchanged

`bootstrap-runtime` must not gain production dependencies on:

```text
work-queue
durable-execution
effect-operation
runtime-kernel
runtime-substrate
signal
```

Current dev/test composition is valid executable-qualification composition.

Do not move H3 runtime composition into Bootstrap production source.

## HS-20 — No new H3-S gate/tool

Use existing:

```text
check:hygiene
check:boundaries
check:dependencies
check:duplicates
check:unused
check:knowledge
package lint/typecheck/build/test
pnpm verify
```

as applicable.

Do not add `check:h3s`, a permanent audit registry, a suppression file, a
baseline file, or an H3-specific scanner.

## HS-21 — Qualification claims may shrink when speculative surface is deleted

If an existing current qualification property exists only to prove the passive
DBOS inspection lane or dead WorkQueue FSM, remove it from the **current**
claim set rather than creating replacement code/tests to preserve the number of
PASS properties.

Historical evidence remains historical.

## HS-22 — Current qualification truth must be reset

Current projections must stop presenting old H3A-2 Draft/superseded candidates
as the current candidate.

Preserve:

```text
actual historical PASS/FAIL/NOT_RUN/BLOCKED observations
historical PR/review/candidate provenance
platform limits
source-less/service/headless residuals
```

Correct:

```text
current candidate identity
current Plan identity
current lifecycle
current H3 stage status
current merged baseline
which evidence is historical vs current
```

Do not fabricate missing Independent Review/CI evidence from earlier H3A
candidates.

## HS-23 — H3-S does not close product qualification residuals

Do not run or claim unrelated:

```text
real AI provider
macOS product PostgreSQL
installed service/headless product
source-less artifact
hardware power loss
full proxy/custom CA
H8 backup/update/restore
```

unless already required by a directly affected current H3 claim.

Record them `NOT_RUN` where applicable.

## HS-24 — No compatibility baggage

Current compatibility register must remain:

```json
{
  "schemaVersion": 1,
  "compatibilityEpoch": "PRE_PRODUCTION",
  "obligations": []
}
```

Do not retain aliases or wrappers for any deleted H3-S public surface.

This includes:

```text
no deprecated re-export
no transitionWorkItemState compatibility alias
no recovery-coordinator compatibility facade
no old Signal client type re-export
no Effect repository option compatibility overload
```

## HS-25 — Green means STOP

After all acceptance criteria and exact-candidate evidence are green:

```text
do not perform a second "cleanup pass"
do not implement deferred provider prerequisites in the same branch
do not continue API simplification outside the listed findings
```

Merge, reconcile current truth, close H3, and stop.

---

# 4. Permanent-surface disposition matrix

| Owner / surface                                   | Classification                                  | H3-S disposition                  | Reason                                                    |
| ------------------------------------------------- | ----------------------------------------------- | --------------------------------- | --------------------------------------------------------- |
| WorkQueue canonical WorkItem/repository/CAS       | `SEMANTIC_PROTOCOL`                             | KEEP                              | Product durable-work Authority                            |
| WorkQueue `state-machine.ts` XState model         | `GENERIC_MECHANIC_DELEGATED_BUT_UNUSED`         | DELETE                            | No production consumer; parallel semantic model           |
| WorkQueue fair scan                               | `SEMANTIC_POLICY + TRIVIAL_LOCAL_MECHANIC`      | KEEP                              | Current anti-starvation invariant                         |
| WorkQueue reconciler PENDING/WAITING/RETRY scan   | `SEMANTIC_PROTOCOL`                             | KEEP                              | Canonical anti-entropy                                    |
| WorkQueue RUNNING passive recovery coordinator    | `SPECULATIVE_RESILIENCE / DIAGNOSTIC_SIDE_LANE` | DELETE                            | Reports but does not recover; no current product consumer |
| DurableAttemptInspectionPort                      | `DIAGNOSTIC_ADAPTER_SURFACE`                    | DELETE                            | Exists for deleted passive lane                           |
| DBOS status inspection adapter                    | `GENERIC_PROVIDER_DIAGNOSTIC_ADAPTER`           | DELETE                            | Exists for deleted passive lane                           |
| DBOS static workflow/queue/applicationVersion     | `GENERIC_MECHANIC_DELEGATED`                    | KEEP                              | Adopted durable mechanics                                 |
| WorkAttempt RUNNING same-attempt re-entry         | `SEMANTIC_PROTOCOL`                             | KEEP                              | First-order process-crash recovery                        |
| WorkAttempt cancellation AbortSignal              | `SEMANTIC_PROTOCOL + LOCAL_ATTEMPT_GLUE`        | KEEP                              | Current cancellation/effect consumer                      |
| WorkQueue root `workQueueProblem` export          | `UNCONSUMED_PUBLIC_SURFACE`                     | REMOVE EXPORT if still unconsumed | No consumer authorization                                 |
| Signal hint codec                                 | `SEMANTIC_ADAPTER` using SchemaRuntime          | KEEP                              | Current bounded wakeup contract                           |
| Signal reconnect/rescan lifecycle                 | `GENERIC_MECHANIC_CUSTOM_JUSTIFIED`             | KEEP                              | Current SIG-003/SIG-005; no better current route proven   |
| Signal client/factory/notification public types   | `TEST_DRIVEN_PUBLIC_SURFACE`                    | INTERNALIZE                       | Only unit-test transport seam                             |
| Signal root service class                         | `UNNEEDED_IMPLEMENTATION_EXPORT`                | REMOVE EXPORT                     | Factory + interface is sufficient                         |
| Signal root `signalProblem` export                | `UNCONSUMED_PUBLIC_SURFACE`                     | REMOVE EXPORT if still unconsumed | Package implementation detail                             |
| EffectOperation state/dispatch/recovery/reconcile | `SEMANTIC_PROTOCOL`                             | KEEP                              | H3B core external-uncertainty Authority                   |
| Effect service `repository?` option               | `TEST_DRIVEN_PUBLIC_SEAM`                       | DELETE                            | Unit-test-only injection                                  |
| Effect duplicated Problem validator               | `DUPLICATED_OWNER_SEMANTICS`                    | MOVE TO OWNER                     | Problem belongs to foundation-contracts                   |
| Foundation `parseProblem`                         | `SEMANTIC_OWNER_PRIMITIVE`                      | ADD                               | One current consumer; eliminates schema duplication       |
| RuntimeSubstrate Cordis adapter                   | `GENERIC_MECHANIC_DELEGATED + OWNER_POLICY`     | KEEP / NO REOPEN                  | No new current evidence                                   |
| RuntimeKernel lifecycle/reconcile                 | `SEMANTIC_PROTOCOL + DELEGATED FSM`             | KEEP / NO REOPEN                  | Actually executed                                         |
| PrivatePostgres lifecycle                         | `ADAPTER_GLUE / DELEGATED`                      | KEEP / NO REOPEN                  | Outside admitted finding set                              |
| Host ownership fence                              | `SEMANTIC_PROTOCOL`                             | KEEP / NO REOPEN                  | Foundation Authority                                      |
| Bootstrap H3 test composition                     | `QUALIFICATION_COMPOSITION`                     | KEEP, adjust deleted imports only | Production boundary remains clean                         |

---

# 5. Failure-model boundary

## 5.1 Current H3 failure classes that remain in scope

```text
FM-H3-01 Host ownership loss / stale mutation
FM-H3-02 lost or coalesced Signal
FM-H3-03 canonical WorkItem commit followed by lost/failed dispatch projection
FM-H3-04 ordinary process crash before or during a restartable WorkAttempt
FM-H3-05 duplicate/stale WorkItem revision
FM-H3-06 generation unavailable/stale
FM-H3-07 Effect pre-call abort
FM-H3-08 consequential external dispatch returns no canonical outcome
FM-H3-09 recovered abandoned Effect DISPATCHING -> UNCERTAIN
FM-H3-10 read-only Effect reconciliation
```

The existing first-order paths remain responsible.

## 5.2 Explicitly deferred / not H3 automatic recovery claims

```text
DF-01 arbitrary DBOS durable metadata deletion after canonical RUNNING
DF-02 DBOS database corruption
DF-03 recovery of a failed recovery coordinator
DF-04 retrying diagnostic/reporting failure
DF-05 second engine reconstruction from canonical state
DF-06 provider/network fleet failover
DF-07 disaster recovery / backup / restore
DF-08 hardware power-loss guarantees beyond existing evidence
DF-09 source-less/service/headless product closure
```

For DF-01/DF-02, the current canonical WorkItem remains truth. H3-S does not
invent a new automatic action.

---

# 6. TDD and test-surface restraint

Execution order is mandatory:

```text
1. lock Plan + current Spec semantics;
2. make the smallest production subtraction/owner correction;
3. delete or update tests that prove removed/retained semantics;
4. run claim-matched qualification;
5. full verification;
6. green -> STOP.
```

Forbidden:

```text
write a new failing test to justify a new public abstraction
add a production seam because a unit test became inconvenient
preserve a dead component because its tests are good
replace deleted tests with a new mock framework
add fault-injection production hooks
create H3-S-specific product IDs/test APIs
increase scenario count merely to preserve test totals
```

A lower test count caused by deleting a dead feature is not a regression.

Evidence quality is determined by claims, not test count.

---

# 7. Detailed execution tasks

## Task 0 — Activate the Plan and establish exact baseline

- [ ] Fetch current `origin/master`.
- [ ] Require baseline `bbadfbacbd9aaea23639e51d5ce01744bd530da4`
      unless only already-approved docs/evidence reconciliation has moved it.
- [ ] Verify `project/plans/active/**` contains no implementation Plan.
- [ ] Install this file as the single ACTIVE implementation Plan.
- [ ] Update `project/plans/INDEX.md` to point to it.
- [ ] Create `dev/h3-stabilization` from the exact accepted base.
- [ ] Open one Draft PR for H3-S when repository workflow calls for the PR.
- [ ] Keep ordinary GitHub Actions disabled.

STOP as `PLAN_GAP` if another implementation Plan is active or master contains
unreviewed behavior after the observed baseline.

## Task 1 — Correct current qualification/governance projection before relying on it

Inspect:

```text
project/qualification/results/Q-ASYNC-01.md
project/qualification/results/Q-RUNTIME-01.md
project/qualification/results/qualification-status.json
project/roadmap/development-roadmap.md
project/plans/INDEX.md
```

Required result:

```text
historical H3A-2 candidates remain explicitly historical
no superseded Plan is presented as current execution Authority
no old DRAFT candidate is presented as current merged truth
H3A/H3B merged functional truth agrees with Roadmap
H3-S is the active current candidate after Plan activation
product/platform/source-less residuals remain truthful
```

Do not convert historical `NOT_RUN` to PASS.

Do not close a qualification role merely because the development Horizon is
functionally closed.

Run current knowledge/qualification consistency gates.

## Task 2 — Remove the dead WorkQueue XState semantic duplicate

Delete:

```text
packages/work-queue/src/state-machine.ts
packages/work-queue/test/unit/state-machine.test.ts
```

Edit:

```text
packages/work-queue/src/index.ts
packages/work-queue/package.json
packages/work-queue/README.md
pnpm-lock.yaml
```

Remove all state-machine exports and the WorkQueue-local XState dependency.

Do not edit repository mutation logic merely to mimic the deleted state
machine.

Verification:

```text
consumer search for deleted exports -> zero
pnpm nx run work-queue:test
work-queue typecheck/lint/build as configured
pnpm check:unused
pnpm check:dependencies
```

The global catalog entry for XState stays because other owners use it.

## Task 3 — Narrow WorkItem recovery semantics and remove the passive DBOS diagnostic lane

First update semantics in:

```text
specs/execution/work-item.md
specs/execution/durable-dispatch.md (only where necessary)
```

Use the failure-class split in HS-07 exactly.

Then delete:

```text
packages/work-queue/src/recovery-coordinator.ts
packages/work-queue/test/unit/recovery-coordinator.test.ts
packages/durable-execution/src/dbos-attempt-inspection.ts
packages/durable-execution/test/unit/dbos-attempt-inspection.test.ts
```

Edit:

```text
packages/work-queue/src/contracts.ts
packages/work-queue/src/reconciler.ts
packages/work-queue/src/index.ts
packages/work-queue/src/problems.ts
packages/work-queue/README.md
packages/durable-execution/src/index.ts
packages/durable-execution/README.md
packages/bootstrap-runtime/test/support/durable-work-child.ts
affected bootstrap-runtime integration tests
Q-ASYNC-01 current projection / property set
qualification-status.json current property set
```

Remove only tests/assertions that exist solely to prove the deleted passive
inspection lane.

Preserve tests that prove:

```text
PENDING rediscovery
same revision deterministic identity
RUNNING same-attempt re-entry
terminal replay/no duplicate logical work
version mismatch fail-closed at the adopted engine boundary
Host/generation/revision fences
```

Do not replace the deleted lane.

## Task 4 — Shrink the Signal package contract without changing runtime semantics

Edit:

```text
packages/signal/src/contracts.ts
packages/signal/src/postgres-signal.ts
packages/signal/src/index.ts
packages/signal/test/unit/postgres-signal.test.ts
packages/signal/README.md
```

Required public result:

```text
public runtime options have no clientFactory
transport client/factory/notification types are package-private
concrete PostgresSignalService class is not root-exported
signalProblem is not root-exported if still unconsumed
factory/interface/semantic codec surface remains
```

The existing deterministic fake client may remain internal to the package/test.

Do not change:

```text
fixed channel
bounded hint
initial rescan
re-LISTEN
reconnect rescan
Host owner abort
credential source
transaction-scoped publication
```

Verification:

```text
signal unit tests
real PostgreSQL Signal integration already used by current H3 qualification
package API/typecheck/lint/build
```

If a real production root consumer of an internalized type is discovered, keep
only that specifically consumed semantic type and report the consumer in the
Plan execution record.

## Task 5 — Return canonical Problem parsing to its owner

Edit:

```text
packages/foundation-contracts/src/problem.ts
packages/foundation-contracts/src/index.ts
existing foundation-contracts Problem tests
packages/foundation-contracts/README.md (public surface sentence if needed)
packages/effect-operation/src/contracts.ts
```

Implement `parseProblem(value: unknown): Problem | undefined`.

Move the current strict V1 shape knowledge out of EffectOperation.

The owner parser must not accept old/unknown schemas and must not create
compatibility behavior.

Do not add dependencies.

Verification:

```text
foundation-contracts tests
effect-operation contract tests
typecheck/lint/build
```

## Task 6 — Remove EffectOperation repository injection and test-built architecture

Edit:

```text
packages/effect-operation/src/service.ts
packages/effect-operation/src/index.ts only if declaration changes require it
packages/effect-operation/test/unit/service.test.ts
packages/effect-operation/README.md if construction surface is described
```

Required implementation:

```text
EffectOperationServiceOptions has no repository override
service uses its canonical package repository
```

Preferred test disposition:

```text
delete service.test.ts if its service-state tests require the fake repository;
do not create a replacement injection seam.
```

Retain `contracts.test.ts` and owner-parser tests.

The real PostgreSQL service qualification and EU process qualification remain
the stateful Effect evidence.

## Task 7 — Remove only confirmed unconsumed H3 root exports

Re-run exact consumer searches after Tasks 2–6.

Remove, when still unconsumed:

```text
@heptalogos/work-queue root export: workQueueProblem
@heptalogos/signal root export: signalProblem
```

Do not conduct a repository-wide API redesign.

Do not remove semantic root exports that current separate package composition
actually requires.

Run generated API/doc and unused-export checks.

## Task 8 — PRE_PRODUCTION provenance / compatibility / archaeology sweep

Run the existing current-tree hygiene gate.

Also inspect the changed H3 packages behaviorally for:

```text
legacy reader
old/new dual shape
deprecated alias
fallback parser
upcaster/downcaster
bridge migration
old phase name in executable identity
compatibility wrapper for a deleted H3-S export
```

Expected disposition may legitimately be:

```text
PASS — no additional residue found
```

Do not create a change simply to make the task non-empty.

Require:

```text
CompatibilityEpoch = PRE_PRODUCTION
obligations = []
one current canonical Foundation migration baseline
```

## Task 9 — Mechanics ownership closure record

Record a concise H3-S audit table in this Plan execution record or an existing
current qualification/architecture owner; do not create a new registry.

Required final classifications:

```text
WorkQueue dead XState FSM                    DELETE
WorkQueue canonical repository/CAS          KEEP
WorkQueue fair scan                         KEEP
WorkQueue passive DBOS recovery diagnostics DELETE
DBOS static durable recovery                KEEP
Signal reconnect/rescan                     KEEP / CUSTOM_JUSTIFIED
Signal client test seam                     INTERNALIZED
Effect repository test injection            DELETE
Problem parser                              MOVE_TO_EXISTING_OWNER
RuntimeSubstrate lifecycle                  KEEP / NO_REOPEN
RuntimeKernel lifecycle                     KEEP / NO_REOPEN
Bootstrap production containment            PASS / NO_CHANGE
```

If an implementation observation contradicts one of these in a way that needs a
new architecture choice, `PLAN_GAP`.

## Task 10 — Focused regression verification

Run at minimum, using repository-current command names:

```text
foundation-contracts package tests
signal package tests
work-queue package tests
durable-execution package tests
effect-operation package tests
affected lint/typecheck/build targets
check:boundaries
check:dependencies
check:unused
check:duplicates
check:hygiene
check:knowledge
```

Do not create new targets solely for H3-S.

## Task 11 — Claim-matched real PostgreSQL / process qualification

Because H3-S changes WorkQueue/DBOS composition and Effect construction,
revalidate the actual H3 executable claims affected by subtraction.

At minimum require current-candidate PASS for the available Windows/Linux
environment used by the project for:

```text
Foundation L3 boot -> work -> stop path
ordinary process restart / same-attempt RUNNING recovery
lost Signal / canonical rescan behavior
duplicate/stale revision fences
Effect real-PG service semantics
Effect EU-01..EU-06 process qualification
live DISPATCHING observer semantics
explicit abandoned-dispatch recovery
pre-call abort
read-only reconciliation
```

Use existing qualification fixtures/targets.

Do not add EU-07/EU-08 merely because H3-S exists.

If a required target is environment-blocked, record `BLOCKED` or `NOT_RUN`
truthfully; do not replace real evidence with mocks.

Cross-platform/source-less/service claims remain limited to what actually ran.

## Task 12 — Full repository verification

Run:

```text
pnpm verify
```

It must be PASS on the exact candidate that will be sent for Independent Review.

Resolve only failures caused by the H3-S diff or directly exposed current
blockers.

Unrelated improvements are out of scope.

## Task 13 — Candidate freeze and Independent Review

Follow `milestone-pr-closure.md` exactly:

```text
Draft
→ all plan work/evidence green
→ Ready
→ out-of-band Independent Review
→ PASS or REQUEST_CHANGES
```

On `REQUEST_CHANGES`:

```text
return Draft
apply only bounded corrections
rerun affected evidence
new exact-candidate verdict
```

Any candidate/base movement after PASS invalidates the verdict.

GitHub PR review objects/comments/status checks are not the Independent Review.

Ordinary GitHub Actions remain disabled.

## Task 14 — Merge and post-merge truth reconciliation

After exact-candidate external PASS and required current local evidence:

- [ ] squash/merge according to current repository practice;
- [ ] perform docs/evidence-only post-merge truth reconciliation;
- [ ] move this Plan from ACTIVE to COMPLETED;
- [ ] update `project/plans/INDEX.md`;
- [ ] update Roadmap truth to:

```yaml
H3A: CLOSED
H3B: CLOSED
H3S: CLOSED
H3: CLOSED
minimumProviderPrerequisites: ELIGIBLE
H6: NOT_YET_ACTIVE
```

- [ ] update qualification current projections to the merged candidate without
      rewriting historical evidence;
- [ ] verify no ACTIVE implementation Plan remains after reconciliation.

Then STOP.

Do not begin provider prerequisite code in the reconciliation branch.

---

# 8. Authorized file ceiling

The following paths are authorized because current review evidence directly
requires them.

## 8.1 Plan / current truth / qualification

```text
project/plans/active/foundation/h3s-foundation-permanent-surface-admission-2026-08-31.md
project/plans/INDEX.md
project/roadmap/development-roadmap.md
project/qualification/results/Q-ASYNC-01.md
project/qualification/results/Q-RUNTIME-01.md
project/qualification/results/Q-EFFECT-01.md
project/qualification/results/qualification-status.json
```

`Q-EFFECT-01.md` is edited only if fresh current-candidate evidence/provenance
must be recorded. Do not rewrite its semantics gratuitously.

## 8.2 WorkQueue

```text
packages/work-queue/src/state-machine.ts                     DELETE
packages/work-queue/test/unit/state-machine.test.ts          DELETE
packages/work-queue/src/recovery-coordinator.ts              DELETE
packages/work-queue/test/unit/recovery-coordinator.test.ts   DELETE
packages/work-queue/src/contracts.ts
packages/work-queue/src/reconciler.ts
packages/work-queue/src/index.ts
packages/work-queue/src/problems.ts
packages/work-queue/package.json
packages/work-queue/README.md
packages/work-queue/test/unit/reconciler.test.ts             if affected
packages/work-queue/test/unit/attempt-executor.test.ts       only if retained semantics need expectation update
```

## 8.3 Durable execution

```text
packages/durable-execution/src/dbos-attempt-inspection.ts             DELETE
packages/durable-execution/test/unit/dbos-attempt-inspection.test.ts  DELETE
packages/durable-execution/src/index.ts
packages/durable-execution/README.md
```

Other durable-execution files are not authorized unless deletion causes a
direct compile/import cleanup.

## 8.4 Signal

```text
packages/signal/src/contracts.ts
packages/signal/src/postgres-signal.ts
packages/signal/src/index.ts
packages/signal/test/unit/postgres-signal.test.ts
packages/signal/README.md
```

## 8.5 Foundation Problem owner / EffectOperation

```text
packages/foundation-contracts/src/problem.ts
packages/foundation-contracts/src/index.ts
packages/foundation-contracts/README.md                       if needed
existing foundation-contracts Problem test file(s)

packages/effect-operation/src/contracts.ts
packages/effect-operation/src/service.ts
packages/effect-operation/src/index.ts                        if needed
packages/effect-operation/test/unit/contracts.test.ts         if parser expectation changes
packages/effect-operation/test/unit/service.test.ts           DELETE preferred
packages/effect-operation/README.md                           if needed
```

## 8.6 Specs and executable qualification composition

```text
specs/execution/work-item.md
specs/execution/durable-dispatch.md
specs/execution/signal.md                                    only if public-surface wording needs semantic correction
specs/execution/effect-operation.md                          only if current semantics actually require wording sync

packages/bootstrap-runtime/test/support/durable-work-child.ts
packages/bootstrap-runtime/test/integration/durable-work-host.integration.test.ts
packages/bootstrap-runtime/test/integration/runtime-host-lifecycle.integration.test.ts
packages/bootstrap-runtime/test/integration/effect-uncertainty.integration.test.ts
packages/bootstrap-runtime/test/integration/effect-uncertainty-process.integration.test.ts
```

Only affected composition/assertions may change. No new H3-S test harness.

## 8.7 Lockfile

```text
pnpm-lock.yaml
```

Authorized only for the removal of WorkQueue's direct `xstate` dependency or
other dependency entries made unreachable by an explicitly authorized deletion.

---

# 9. Normally forbidden paths / changes

Unless current execution produces a concrete `PLAN_GAP`, do not modify:

```text
packages/runtime-kernel/**
packages/runtime-substrate/**
packages/persistence/**
packages/host-ownership/**
packages/private-postgres/**
packages/bootstrap-runtime/src/**
packages/canonical-schema/**
packages/schema-runtime/**
project/dependencies/dependency-routing.json
project/qualification/dependency-status.json
project/engineering/repository/toolchain.md
pnpm-workspace.yaml
package-manager/toolchain version policy
```

Also forbidden:

```text
new package
new runtime dependency
new database migration
new durable table/state
new recovery coordinator
new scheduler
new heartbeat/lease
new provider registry
new diagnostics subsystem
new compatibility alias
new test API package/subpath
full H4/H5/H6 work
```

The Foundation `parseProblem` owner change is explicitly authorized despite the
general rule not to reopen lower owners; it is a bounded current-consumer
ownership correction.

---

# 10. Acceptance criteria

The candidate is not Ready until all applicable criteria below are true.

## AC-01 Current truth

- [ ] no superseded H3A-2 Plan is presented as current implementation Authority;
- [ ] no old DRAFT candidate is presented as the current merged candidate;
- [ ] H3A/H3B/H3-S state agrees across Roadmap, Plan Index, and current qualification projection;
- [ ] historical evidence remains historical and truthful.

## AC-02 WorkQueue single executable lifecycle authority

- [ ] `state-machine.ts` is gone;
- [ ] its unit test is gone;
- [ ] WorkQueue no longer directly depends on XState;
- [ ] no replacement secondary transition model was added;
- [ ] canonical repository/attempt behavior is still PASS.

## AC-03 No passive recovery-of-recovery lane

- [ ] WorkQueueRecoveryCoordinator is gone;
- [ ] DurableAttemptInspection public contracts are gone;
- [ ] DBOS attempt-inspection adapter is gone;
- [ ] WorkQueue reconciler has no recovery-inspection lane;
- [ ] no replacement monitor/heartbeat/recovery scheduler exists;
- [ ] same-attempt first-order DBOS crash recovery still PASS.

## AC-04 Truthful recovery Spec

- [ ] ordinary process crash and pre-RUNNING projection failure are distinguished;
- [ ] arbitrary post-RUNNING DBOS durable projection loss is not claimed as automatic H3 recovery;
- [ ] engine status never terminalizes canonical WorkItem.

## AC-05 Effect test seam removed

- [ ] public EffectOperation service options have no repository injection;
- [ ] no replacement public test factory/DI seam;
- [ ] redundant fake-repository service tests are removed rather than preserved by architecture;
- [ ] real-PG and process Effect claims remain PASS.

## AC-06 Problem semantic ownership

- [ ] `foundation-contracts` owns `parseProblem`;
- [ ] Effect no longer duplicates the canonical Problem field/retry-class schema;
- [ ] no new validation package/framework/dependency.

## AC-07 Signal public contract narrowed

- [ ] Signal client/factory/notification test transport types are not root public;
- [ ] public runtime options contain no client factory;
- [ ] concrete Signal implementation class is not root public;
- [ ] no Signal reconnect semantic regression;
- [ ] no new Signal dependency.

## AC-08 PRE_PRODUCTION purity

- [ ] compatibility register remains empty PRE_PRODUCTION;
- [ ] `pnpm check:hygiene` PASS;
- [ ] no alias/shim/deprecated wrapper for any removed surface;
- [ ] current migration baseline remains singular.

## AC-09 No scope expansion

- [ ] no H4/H5/H6 product code;
- [ ] no new package;
- [ ] no new runtime dependency;
- [ ] no new durable state;
- [ ] no new recovery layer;
- [ ] Bootstrap production dependency boundary remains unchanged.

## AC-10 Evidence

- [ ] focused affected package tests PASS;
- [ ] affected real-PG/process H3 qualification PASS where required/runnable;
- [ ] `pnpm verify` PASS on exact candidate;
- [ ] external Independent Review PASS on exact candidate;
- [ ] reviewed candidate has not moved before merge.

---

# 11. STOP / PLAN_GAP rules

## STOP immediately after successful closure

When all acceptance criteria are satisfied:

```text
H3-S is complete.
Do not search for additional cleanup.
Do not begin Provider Prerequisites.
Do not perform a second stabilization pass.
```

## PLAN_GAP only for concrete current evidence

Examples:

```text
a deleted inspection surface has a real current production consumer not found by review;
a current Spec requires a distinct non-speculative failure class that cannot be
satisfied by the retained first-order path;
removing the WorkQueue XState dependency reveals it was actually used by an
executable path outside repository search;
Problem parsing cannot be moved to its owner without a dependency cycle or
contract change larger than this plan;
Signal transport internals are used by a real production package;
master contains post-baseline architecture changes;
correctness requires a new durable shape/dependency/provider.
```

Not PLAN_GAP:

```text
"this abstraction might be useful later"
"tests become less isolated"
"test count goes down"
"a previous review once asked for it"
"symmetry suggests keeping it"
"future diagnostics may need it"
"we could make recovery more robust"
"it would be nice to generalize"
```

---

# 12. Post-H3-S boundary

After H3-S is merged and reconciled, the next implementation Plan is **not**
"finish Foundation".

The next route remains:

```text
minimum real-provider prerequisites
  ├─ minimal Configuration ownership
  ├─ minimal Secret ownership
  └─ minimal Network / Capability policy boundary
        ↓
H6 Subject Base L4 vertical slice
```

Full H4 Management/Cedar/Approval/HTTP/CLI and full H5 third-party package/data
lifecycle remain deferred unless a real hard dependency edge is proven.

H3-S must leave the repository ready to stop H3 and move forward.

---

# 13. Compact Agent decision table

| Situation                                                       | Required action                                                |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| Old H3 candidate appears as current qualification truth         | Correct current projection; preserve historical evidence       |
| H3A/H3B token appears only in completed/superseded/history docs | Keep; history is allowed                                       |
| H3 token/PR/session appears in executable/test identity         | Remove/reframe; no alias                                       |
| WorkQueue XState state machine has no production consumer       | Delete it + test + WorkQueue xstate dep                        |
| Tempted to call XState model from repository just to justify it | Do not; delete instead                                         |
| RUNNING WorkItem resumes through DBOS same workflow/revision    | Keep; first-order recovery                                     |
| DBOS status scanner only reports contradictions                 | Delete passive diagnostic lane                                 |
| Asked how to recover arbitrary missing DBOS state after RUNNING | Deferred; do not invent automatic recovery                     |
| Effect service unit test needs repository injection             | Delete/reduce test; do not keep public seam                    |
| Effect needs to parse canonical Problem                         | Use `foundation-contracts.parseProblem`                        |
| Tempted to add SchemaRuntime to foundation-contracts            | Do not in H3-S                                                 |
| Signal unit test needs fake pg client                           | Keep seam package-private, not public API                      |
| Tempted to adopt a new LISTEN helper library                    | Do not without a reopened dependency decision and hard blocker |
| Current hygiene sweep finds nothing                             | Record PASS and move on                                        |
| Deleted surface had only historical review/test evidence        | History does not authorize retention                           |
| Full current H3 path is green                                   | STOP                                                           |

---

# 14. Final completion record template

Fill this section only with observed results.

```yaml
h3s:
  baseline:
  branch:
  pullRequest:
  candidateHead:
  compatibilityEpoch: PRE_PRODUCTION
  compatibilityObligations: 0

subtraction:
  workQueueDeadXStateFsm:
  workQueueXStateDependencyRemoved:
  passiveRunningRecoveryCoordinator:
  durableAttemptInspectionLane:
  effectRepositoryTestInjection:
  signalPublicTestTransportTypes:
  duplicatedEffectProblemParser:

retained:
  dbosSameAttemptRecovery:
  workQueueFairScan:
  workAttemptCancellationSignal:
  signalReconnectRescan:
  runtimeSubstrate:
  runtimeKernel:
  bootstrapProductionContainment:

qualification:
  foundationContracts:
  signal:
  workQueue:
  durableExecution:
  effectOperation:
  foundationSpine:
  effectRealPostgres:
  effectProcess:
  hygiene:
  boundaries:
  dependencies:
  unused:
  duplicates:
  knowledge:
  pnpmVerify:

closure:
  independentReview:
  reviewedBase:
  reviewedHead:
  candidateUnchangedAfterReview:
  merge:
  postMergeReconciliation:
  H3S: CLOSED
  H3: CLOSED
  next: MINIMUM_PROVIDER_PREREQUISITES_ELIGIBLE
```

Use only `PASS`, `FAIL`, `NOT_RUN`, or `BLOCKED` for evidence fields that
represent actual executed observations.

---

## H3-S execution record

### Mechanics ownership audit

| Surface                                     | Final classification      | Observed disposition |
| ------------------------------------------- | ------------------------- | -------------------- |
| WorkQueue dead XState FSM                   | `DELETE`                  | `PASS`               |
| WorkQueue canonical repository/CAS          | `KEEP`                    | `PASS`               |
| WorkQueue fair scan                         | `KEEP`                    | `PASS`               |
| WorkQueue passive DBOS recovery diagnostics | `DELETE`                  | `PASS`               |
| DBOS static durable recovery                | `KEEP`                    | `PASS`               |
| Signal reconnect/rescan                     | `KEEP / CUSTOM_JUSTIFIED` | `PASS`               |
| Signal client test seam                     | `INTERNALIZED`            | `PASS`               |
| Effect repository test injection            | `DELETE`                  | `PASS`               |
| Problem parser                              | `MOVE_TO_EXISTING_OWNER`  | `PASS`               |
| RuntimeSubstrate lifecycle                  | `KEEP / NO_REOPEN`        | `PASS`               |
| RuntimeKernel lifecycle                     | `KEEP / NO_REOPEN`        | `PASS`               |
| Bootstrap production containment            | `PASS / NO_CHANGE`        | `PASS`               |

The execution was limited to the authorized H3-S subtraction and ownership
correction surfaces. No H4/H5/H6 product code, new package/dependency, durable
state, migration, scheduler, heartbeat, or replacement recovery layer was
introduced.

### Current local candidate evidence

```yaml
candidateId: H3S-FOUNDATION-PERMANENT-SURFACE-ADMISSION-2026-08-31
baseSha: bbadfbacbd9aaea23639e51d5ce01744bd530da4
branch: dev/h3-stabilization
planActivation: PASS
focusedPackageTests: PASS
focusedPackageLint: PASS
typecheck: PASS
build: PASS
foundationSpine: PASS
durableRecoveryProcess: PASS
effectUncertaintyProcessAndPostgres: PASS
bootstrapRuntimeIntegration: PASS
checkAgents: PASS
checkRepository: PASS
checkDependencies: PASS
checkBoundaries: PASS
checkUnused: PASS
checkDuplicates: PASS
checkHygiene: PASS
checkKnowledge: PASS
repositoryVerify: PASS
candidateLifecycle: READY
candidateFreeze: PASS
independentReview: NOT_RUN
merge: NOT_RUN
```

The real-provider observations above were executed on Windows with the
explicit PostgreSQL 18.6 toolchain at `tmp/pg/extracted/pgsql/bin`; no Linux,
macOS, source-less, service/headless, live external provider, or hardware
power-loss claim is inferred.

---

# 15. Final instruction

This Plan deliberately removes more code/contracts than it adds.

The only new production semantic primitive expected is the correctly owned
`foundation-contracts.parseProblem`.

If execution begins producing a larger architecture, broader failure model,
new generic framework, new recovery path, or a larger test harness, the work
has departed from H3-S.

The success condition is not "H3 is more sophisticated."

The success condition is:

> H3 contains only the permanent semantics and mechanics that the current
> system can justify, and the next Product-driven Horizon can build on it
> without inheriting development-era scaffolding.
