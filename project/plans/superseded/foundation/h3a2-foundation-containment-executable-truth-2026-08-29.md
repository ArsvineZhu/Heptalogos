# Heptalogos H3A-2 Closure & Foundation Containment

## Executable Truth / Complexity Governance Convergence — Decision-Complete Execution Plan

**Plan date:** 2026-08-29
**Status:** SUPERSEDED — historical H3A-2 plan
**Authority:** historical record; superseded by the repository knowledge architecture and Agent Harness convergence plan
**Scope:** H3A-2 remaining correctness closure + executable Foundation proof + governance convergence + Architecture/Roadmap truth synchronization
**Historical path:**
`docs/plans/active/foundation/h3a2-foundation-containment-executable-truth-2026-08-29.md`

---

# 0. Authority, supersession, and executor contract

This plan is intended to become the **single active implementation-plan Authority** for the remaining H3A-2 closure and the governance convergence described here.

When this plan is activated in the repository:

1. copy this file to the canonical active path above;
2. move the current active plan
   `docs/plans/active/foundation/h3a2-dbos-durable-execution-crash-recovery-2026-08-29.md`
   to
   `docs/plans/superseded/foundation/h3a2-dbos-durable-execution-crash-recovery-2026-08-29.md`;
3. preserve the superseded plan unchanged except for the minimum topology/status header needed by existing plan-navigation rules;
4. update `docs/roadmap/development-roadmap.md` so `activeImplementationPlan` points only to this plan;
5. inspect `docs/plans/active/**` and ensure there is no second H3A/H3A-2 plan claiming implementation Authority.

The superseded H3A-2 plan remains historical evidence for decisions already implemented. This plan **inherits** its still-valid architecture decisions unless explicitly changed below.

The implementation Agent does not choose alternative architecture, dependency providers, package ownership, Host/Bootstrap Authority, DBOS/WorkQueue identity semantics, compatibility policy, or stage ordering.

If implementation evidence requires a non-trivial decision not resolved here or in the current Architecture Corpus, stop with:

```text
PLAN_GAP
```

Do not improvise.

No commit SHA is to be copied into this plan, current qualification records, PR body, or Agent instructions.

GitHub Actions remain disabled/not required for this work. Do not enable, dispatch, or treat Actions as a blocker.

---

# 1. Executive outcome

This work is **not** a Foundation Reset.

The repository has already invested heavily in:

```text
Bootstrap ownership
Private PostgreSQL
Host ownership/fencing
Persistence
Execution Lineage
RuntimeSubstrate / Runtime Kernel
WorkQueue / Signal
DBOS DurableExecution
```

These implementations are not to be deleted or redesigned merely because their total complexity is now visible.

The objective is:

```text
preserve correct investment
+ close real H3A-2 correctness defects
+ prove the implemented Foundation actually composes and runs
+ prevent further premature resilience / speculative completeness
+ restore Library-first mechanics discipline
+ make future development product-driven rather than Foundation-completeness-driven
```

The end state of this plan must satisfy all of the following:

1. H3A-2 has no known blocking correctness defect in its current lifecycle semantics.
2. The current Foundation can execute one real, process-level, real-PostgreSQL + real-DBOS composition path.
3. The repository has permanent governance preventing an Agent from treating every rare failure mode as immediate implementation scope.
4. `Bootstrap` remains usable and its existing implementation remains intact, but future scope growth is explicitly constrained.
5. Architecture documents distinguish product semantics from generic lifecycle mechanics.
6. The Roadmap requires executable truth before further horizontal Foundation expansion.
7. H3B is explicitly narrow.
8. H3-S is explicitly **subtractive/convergent**, not another hardening expansion.
9. The next product objective after minimum prerequisites is the smallest real Subject vertical slice.
10. Previously agreed Presentation/Desktop/Distribution constraints are recorded as future architecture only, with no H3 implementation.

---

# 2. Problem statement being corrected

The repository currently has a dangerous engineering asymmetry:

```text
local semantic correctness evidence
    grows rapidly

while

whole-system executable evidence
    grows slowly
```

This permits the following failure mode:

```text
Bootstrap PASS
Host fencing PASS
Persistence PASS
Runtime PASS
WorkQueue PASS
DBOS PASS

but

fresh state → start → READY → work → stop → restart
UNKNOWN / FAIL
```

A second failure mode is **premature resilience**:

```text
possible edge case
→ implement recovery
→ recovery has failure cases
→ implement recovery-of-recovery
→ add state/journal/rollback
→ test more rare timing windows
```

This recursion has no natural end.

A third failure mode is **semantic-ownership overreach**:

```text
Heptalogos owns semantics
```

silently becoming:

```text
Heptalogos must hand-write lifecycle/disposal/drain/rollback mechanics
```

even where Cordis, XState, DBOS, Node/OS facilities, or another adopted mature primitive should own generic mechanics.

This plan changes the development contract so that these failure modes cannot continue as the default.

---

# 3. Locked decisions

## 3.1 No broad deletion or Foundation reset

Do not:

- remove Runtime Kernel because it is complex;
- remove WorkQueue fields merely because H6 does not yet consume all of them;
- replace DBOS;
- replace Cordis;
- replace XState;
- redesign Host ownership;
- replace private PostgreSQL;
- split/rewrite `bootstrap-runtime`;
- create a new lifecycle framework;
- create a new orchestration framework;
- start a broad “simplify everything” refactor.

Existing correct, tested implementation is preserved by default.

Deletion in this plan is restricted to:

- obsolete code directly replaced by a correctness fix;
- development-stage/provenance residue in touched current source/tests;
- stale active-plan/current-truth material made obsolete by this plan.

## 3.2 Current H3A-2 lifecycle shape remains

The current DurableExecution lifecycle remains:

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

`resume()` remains supported for the already-implemented same-Host maintenance path.

This plan does **not** reopen the earlier decision to implement same-process quiesce/resume. It only makes the existing semantics correct and bounded.

After closure, this lifecycle is frozen unless a real product consumer exposes a defect.

## 3.3 H3A remains effect-free

No consequential outbound effect is added.

No Messaging send, model-provider side effect, arbitrary network mutation, or H3B `EffectOperation` is pulled into H3A-2.

## 3.4 DBOS remains mechanics, WorkItem remains Authority

Keep:

```text
WorkItem canonical state = product Authority
DBOS workflow/queue       = engine-private execution projection
```

DBOS success/failure never directly terminalizes canonical WorkItem state.

## 3.5 No new external dependency is authorized

This plan does not authorize a new external package.

If lifecycle-mechanics audit discovers that the adopted route cannot satisfy a required current property and a new dependency appears necessary:

```text
stop → PLAN_GAP
```

Do not silently add a package.

## 3.6 Reliability scope is bounded

The following are **not H3A-2 blockers** and must remain `NOT_RUN` unless independently executed for another already-authorized claim:

```text
hardware power loss
disk corruption
torn-write hardware testing
kernel crash
service/headless shipping closure
source-less shipping closure
macOS real PostgreSQL product qualification
zero-downtime replacement
automatic self-healing
multi-fault recovery
rollback-of-recovery
```

Do not add product code solely to make these scenarios pass.

---

# 4. Governance changes — permanent repository rules

This task is mandatory and executes **before** new H3A-2 source mutation so that the remaining implementation is performed under the corrected engineering contract.

## Task G1 — Update `docs/governance/constitution.md`

Append new engineering principles after the current Engineering Constitution, preserving existing numbering style and authority.

Add principles with the following semantics.

### E44 — Executable Truth Is First-Class

Required meaning:

```text
component correctness
+ architecture correctness
!= executable system correctness
```

An implementation claim is provisional until exercised at the strongest currently available executable boundary.

Define two orthogonal truths:

```text
Semantic Truth
Executable Truth
```

Semantic Truth covers Authority, state, durability, ownership, uncertainty.

Executable Truth covers:

```text
boot
compose
become ready
perform meaningful work
stop
restart/recover
```

A horizon may not indefinitely improve Semantic Truth while leaving its corresponding executable path `UNKNOWN`.

Do not claim product runtime merely because package-level tests pass.

### E45 — Reliability Scope Follows Product Maturity

Introduce failure classes:

```text
F0 HAPPY_PATH
   normal boot/work/stop

F1 COMMON_OPERATIONAL
   invalid input/config, port occupied, provider timeout,
   expected dependency unavailable, normal restart

F2 EXPECTED_RECOVERY
   process crash/restart, transient network loss,
   currently required durable recovery semantics

F3 RARE_TIMING_FAULT
   commit/ack ambiguity, narrow race windows,
   partial teardown timing, lease loss at exact transition

F4 CATASTROPHIC_HARDENING
   power loss, disk corruption, torn storage,
   kernel/hardware fault, multi-fault recovery
```

Rules:

- F0 must be proven before spending significant budget on later classes.
- F1 is handled when the current capability exists.
- F2 is implemented only where current Horizon semantics require it.
- F3 requires an explicit current invariant or accepted product requirement.
- F4 is product/shipping hardening and must not drive early architecture by default.

“Could happen” is not sufficient implementation authority.

### E46 — Recovery Is Bounded, Not Recursively Complete

Required semantics:

```text
a recovery mechanism
does not automatically require
recovery for every failure of that recovery mechanism
```

Fail-stop, `FAILED`, `FENCED`, `RECOVERY_REQUIRED`, or operator intervention are legitimate terminal outcomes.

Require an explicit **Point of No Return** for high-impact reversible/irreversible operations.

Before the point:

```text
bounded abort / restoration may be attempted
```

After the point:

```text
do not perform heroic rollback to an old Authority state;
move forward to bounded recovery/restart/reacquisition
```

Prefer fail-stop over multiplying rollback branches when both preserve Authority and truth.

### E47 — Complexity Requires Present Justification

Architecture/catalog existence does not authorize implementation.

A new:

```text
state
durable field
background worker
rollback path
recovery path
generic lifecycle mechanic
security mechanism
```

must be justified by at least one of:

```text
current semantic invariant
current executable consumer
current accepted failure model
current explicit security threat
```

“future completeness”, “safer in theory”, “we may need it later”, or “the architecture contains a Service named X” are insufficient.

Tests do not create product requirements. A test-only failure scenario cannot force new production architecture unless that failure model was already accepted by architecture/plan.

---

## Task G2 — Update `docs/governance/engineering-principles.md`

Add operational sections implementing E44–E47.

Required sections:

### `Executable Truth / Vertical Ratchet`

Define:

```text
Foundation can grow only while the current executable spine remains green.
```

Once an executable spine exists, a red spine has higher priority than adding a new Foundation capability unless an approved plan explicitly says otherwise.

Define proof levels:

```text
L1 package correctness
L2 real component composition
L3 process-level executable composition
L4 product vertical slice
```

Do not conflate these with dependency-selection L0–L3; name them explicitly as `Executable Proof Level` or another unambiguous label.

At H3 the required target is a Foundation L3 composition proof.

At H6 the required target becomes a real Product L4 Subject slice.

### `Complexity Admission`

Before adding high-risk complexity, record in the implementation plan/change rationale:

```text
Current horizon:
Current consumer/invariant:
Failure class:
Failure/threat:
Impact if deferred:
Existing fail-closed behavior:
Mechanics owner/provider:
New state/branch/resource cost:
Why now:
Decision: IMPLEMENT | DEFER | REJECT
```

Do not require a new standalone document for each decision. The current active plan/change rationale is sufficient.

### `New State Rule`

Add:

```text
NEW STATE REQUIRES A NEW SEMANTIC DISTINCTION.
```

Implementation progress does not automatically become a product/durable lifecycle state.

Ask:

> After process restart, does this distinction still matter to product truth or recovery?

If not, prefer an implementation-local variable over a durable/public state.

### `Security Requires a Threat`

Do not allow “for security” as a standalone reason.

Require:

```text
asset
attacker/failure
trust boundary
consequence
current mitigation
```

before adding security complexity.

### `Robustness Requires a Failure Model`

Do not allow “for robustness” as a standalone reason.

A failure model must identify:

```text
what fails
when it can fail
what invariant would be violated
why current fail-stop behavior is insufficient
```

### `No Recursive Hardening`

Explicitly prohibit automatic:

```text
rollback-of-rollback
recovery-of-recovery
fallback-of-fallback
```

unless separately authorized.

---

## Task G3 — Update root `AGENTS.md`

Keep it concise. Do not turn it into another Architecture Corpus.

Add a short mandatory execution section with these rules:

1. **Stage before edge cases.** Before implementing resilience/security/lifecycle expansion, identify the current Horizon and accepted failure class.
2. **Rare failure default = DEFER.** F3/F4 work not explicitly authorized by Corpus + plan is out of scope.
3. **Executable spine priority.** If the current required executable spine is failing, fix it before adding new capability.
4. **No recursive hardening.** Do not implement recovery-of-recovery or fallback chains unless explicitly planned.
5. **No test-created architecture.** Failure-injection tests cannot justify new production states/mechanics on their own.
6. **New state needs semantics.** Do not add lifecycle/durable state for implementation progress alone.
7. **Generic lifecycle mechanics require route review.** Before writing drain/dispose/task-tracking/retry/backoff/cleanup aggregation/process supervision, check existing owner and adopted dependency route.
8. **Fail-stop is valid.** If Authority/truth can be preserved by bounded failure, do not invent a complex automatic restoration path.
9. If satisfying a newly discovered edge case would expand architecture beyond the plan, stop with `PLAN_GAP` rather than “being safe”.

Do not duplicate long explanatory prose from `engineering-principles.md`.

---

## Task G4 — Update

`docs/engineering/playbooks/mechanics-ownership-and-library-first.md`

Add a lifecycle-specific classification table:

```text
SEMANTIC_PROTOCOL
  Heptalogos meaning/order/Authority; custom is expected.

ADAPTER_GLUE
  thin translation around an adopted provider.

GENERIC_MECHANIC_DELEGATED
  lifecycle/disposal/queue/FSM/etc. owned by adopted provider.

GENERIC_MECHANIC_CUSTOM_JUSTIFIED
  mature route checked; explicit hard semantic/technical blocker recorded.

SPECULATIVE_RESILIENCE
  implementation exists only for a deferred rare/catastrophic case.
```

For every lifecycle review, require classification before code change.

Add a “maturity triage” step before the existing mechanics preflight:

```text
current Horizon
→ failure class
→ current invariant/consumer
→ existing fail-stop behavior
→ then mechanics provider search
```

Add:

```text
Do not build a local framework merely to deduplicate lifecycle code.
```

If the same custom mechanic repeats, first determine whether the adopted provider or existing owner should own it.

---

## Task G5 — Update `docs/plans/README.md`

Make these mandatory for future non-trivial active plans:

```text
Current Horizon / maturity
Executable Truth target
Authorized failure classes
Explicit deferred failure classes
Complexity admission for new high-risk mechanics
Non-goals
Stop conditions
```

A plan that says “make robust”, “handle all edge cases”, “production-grade”, or “for safety” without a bounded failure/threat model is not decision-complete.

Do **not** create a new plan-lint framework in this task.

Documentation rules are procedural here; do not add another meta-engine solely to check headings.

---

# 5. Architecture truth synchronization

## Task A1 — Clarify Bootstrap containment in

`docs/architecture/contracts/startup-recovery-runtime-supervision.md`

Do not redesign implementation.

Clarify that `Bootstrap Closure` has one primary purpose:

```text
safely make a normal Host possible;
if that is impossible, safely make bounded Recovery possible.
```

Preserve its existing current responsibilities required before/around normal Host Authority.

Add a future-scope rule:

```text
Bootstrap provides ownership/maintenance transition primitives.
It does not automatically own the domain semantics of every future
Update, Backup, Package, Configuration, or Recovery feature.
```

Future domain coordinators own their own plans/semantics and may request a bounded Bootstrap maintenance window.

Do not move current reverse-handoff implementation during this plan.

### Point of No Return

Document the current maintenance conceptual boundary:

```text
reversible region:
  close admissions
  stop reconciliation
  drain current work
  prepare quiescence

point of no return:
  durable Host Authority revocation / equivalent irreversible ownership transition

after point:
  forward recovery/reacquisition
  not restoration of a falsely ACTIVE old Host
```

This must remain consistent with actual HostOwnershipFence semantics.

---

## Task A2 — Update `docs/architecture/execution-model.md`

Add a compact section:

### `Bounded lifecycle failure`

State that not every partial failure requires automatic in-process restoration.

Required hierarchy:

```text
preserve Authority/truth
→ bounded cleanup
→ fail-stop/fence when cleanup cannot be proven
→ fresh reconciliation/recovery later
```

Do not convert this into a new global lifecycle state machine.

---

## Task A3 — Strengthen `docs/architecture/foundation-services.md`

The current catalog already says contract existence does not imply self-implementation.

Strengthen it with:

```text
SERVICE/CONTRACT EXISTENCE
!= CURRENT IMPLEMENTATION AUTHORIZATION
```

A Foundation service implementation requires:

```text
current consumer
or current invariant
or current accepted failure/security model
```

The service catalog is a semantic ownership map, not a Foundation completion checklist.

This rule applies especially to later-Horizon concepts such as ResourceGovernor, Backup, advanced package lifecycle, and other future services.

---

# 6. H3A-2 current correctness closure

Only the findings below authorize source-level lifecycle correction in this plan.

Do not use this section as permission for a general refactor.

---

## Task C1 — Make pre-entry DurableExecution quiescence truly reversible

### Files

At minimum inspect/update:

```text
packages/durable-execution/src/contracts.ts
packages/durable-execution/src/dbos-runtime.ts
packages/durable-execution/src/dbos-lifecycle-machine.ts
relevant durable-execution tests
authentic bootstrap/WorkQueue quiescence composition
```

### Current defect

Current `quiesce()` enters `QUIESCING`, calls upstream `prepare()`, and its catch path may transition to `FAILED` **before** a successful upstream restoration can transition it back through `QUIESCE_ABORTED`.

This can produce:

```text
upstream restored / Host still usable
+
DurableExecution = FAILED
```

That is an invalid split state.

### Required semantics

Make `DurableExecutionQuiescenceCoordinator.prepare` explicitly:

```text
bounded
failure-atomic from the caller's perspective
```

Use the existing `shutdownDrainTimeoutMs` as the single H3A-2 maintenance drain budget. Do not introduce a second independent quiescence timeout configuration.

Preferred contract shape:

```ts
prepare(signal: AbortSignal): Promise<DurableExecutionQuiescenceLease>
```

or an equivalent object argument if repository style requires it.

The runtime creates the bound with the Node standard cancellation facility, preferably:

```text
AbortSignal.timeout(shutdownDrainTimeoutMs)
```

unless an existing repository-owned equivalent already exists.

Contract rule:

```text
prepare resolves:
  upstream admission/reconciliation is quiesced and lease is returned.

prepare rejects:
  upstream has restored its pre-call state before rejection.
```

If an authentic coordinator cannot satisfy that rule with current mechanics, stop with `PLAN_GAP`; do not hide a partially quiesced upstream behind a normal rejection.

### Runtime transition ordering

Required outcomes:

```text
OPEN
→ BEGIN_QUIESCE
→ prepare fails atomically
→ QUIESCE_ABORTED
→ OPEN
→ caller receives failure
```

and:

```text
OPEN
→ BEGIN_QUIESCE
→ prepare succeeds
→ active invocation drain times out
→ resumeAfterAbort succeeds
→ QUIESCE_ABORTED
→ OPEN
→ caller receives drain-timeout failure
```

If restoration itself fails:

```text
→ FAILED
→ onTerminalFailure
→ Host-level fence/terminal handling
```

After provider teardown has started, do not attempt to pretend the original OPEN state is restored:

```text
provider teardown started + failure
→ FAILED
→ onTerminalFailure
```

### Required tests

Add semantic tests, not stage-labelled tests:

- prepare rejection leaves runtime OPEN and upstream reopened;
- drain timeout + successful lease restoration leaves runtime OPEN;
- restoration failure leaves runtime FAILED and invokes terminal failure exactly once;
- provider teardown failure cannot return runtime to OPEN;
- repeated quiesce after reversible abort can succeed normally.

---

## Task C2 — Make `close()` truthful and retryable

### Files

```text
packages/durable-execution/src/dbos-runtime.ts
packages/durable-execution/src/dbos-lifecycle-machine.ts
durable-execution lifecycle tests
```

### Current defect

Current close path stores a cleanup error, then unconditionally sends `CLOSED`, detaches the Authority listener, stops the lifecycle actor, and only afterwards throws the cleanup error.

This means:

```text
state = CLOSED
while cleanup is not proven complete
```

and prevents a meaningful retry.

### Required semantics

`CLOSED` has a strict meaning:

```text
DBOS shutdown confirmed
active WorkAttempt invocation count == 0
caller-owned system pool ended successfully
process-global WorkAttempt binding released
Authority abort listener detached
```

If any required cleanup step cannot be proven:

```text
do not publish CLOSED
```

Change the package-private XState machine so `CLOSING` can fail to `FAILED`.

A subsequent `close()` from `FAILED` may re-enter `CLOSING` and retry cleanup.

Do not implement rollback to OPEN.

### Pool handle correctness

Current pool-close bookkeeping must not discard the pool handle before `pool.end()` succeeds.

Required rule:

```text
await end successfully
→ then clear the owned handle / mark closed
```

If `end()` rejects, preserve enough ownership state for a subsequent close attempt.

Do not add a compatibility wrapper or second resource tracker.

### DBOS shutdown failure

If DBOS shutdown itself is not proven:

- keep lifecycle non-CLOSED;
- do not release the WorkAttempt binding as though the provider is terminal;
- do not admit new dispatch because lifecycle is not OPEN;
- surface the failure;
- allow bounded retry through `close()`;
- Host-level caller may ultimately fence/terminate rather than recursively recovering the provider.

### Required tests

- cleanup error never reports CLOSED;
- failed close is retryable;
- pool `end()` failure retains retry ownership;
- successful retry reaches CLOSED exactly once;
- CLOSED is idempotent;
- no binding release occurs while DBOS shutdown is unproven;
- Authority abort during a failed/closing state does not resurrect the runtime.

---

## Task C3 — Bound WorkQueue/upstream quiescence preparation

The authentic WorkQueue/Runtime quiescence coordinator must never wait indefinitely for in-process admission settlement.

Use the signal/budget introduced in C1.

Required behavior:

```text
stop new admission
→ wait current bounded in-process work
→ success returns lease
→ timeout restores admission/reconciliation
→ reject
```

No infinite wait.

Do not create:

```text
new scheduler
new timer service
new retry engine
new durable WorkItem for quiescence
```

Use existing owners and Node/adopted lifecycle primitives.

Tests must prove:

- no new admission after prepare begins;
- a settling admitted operation allows prepare to finish;
- a non-settling operation hits the existing shutdown budget;
- timeout restores the upstream state;
- subsequent normal work is possible after restoration.

---

## Task C4 — Fix DBOS preflight credential lifetime

### Files

```text
packages/durable-execution/src/dbos-client.ts
packages/durable-execution/src/dbos-runtime.ts
tests
```

### Current defect

`createDbosQueueClient()` creates a DBOS client inside
`withDurableExecutionDatabasePassword(...)` but returns a wrapper whose client remains alive outside that credential callback.

The client was constructed using a password-bearing PostgreSQL URL.

### Required design

Replace the escaping-client API with callback-scoped use.

Preferred semantic API:

```ts
withDbosQueueClient(authority, pool, options, use);
```

Required lifetime:

```text
enter credential callback
→ decode password
→ construct temporary DBOSClient
→ execute queue-profile preflight
→ destroy DBOSClient
→ leave credential callback
```

The DBOS client or any password-bearing URL must not escape.

Do not add string-overwrite tricks, secret redaction objects, or a second credential cache.

The caller-owned pool still remains caller-owned and must not be closed by DBOS client destruction.

### Tests

Prove:

- `use` executes while the credential callback is active;
- client destroy occurs before credential callback exits;
- client is destroyed on success and registration failure;
- caller-owned pool is not destroyed;
- raw password/URL is not exposed in the public adapter surface or Problem text.

---

## Task C5 — Current-truth documentation/evidence repair

Update:

```text
packages/durable-execution/README.md
packages/bootstrap-runtime/README.md
docs/qualification/results/Q-ASYNC-01.md
docs/qualification/results/Q-RUNTIME-01.md
docs/roadmap/development-roadmap.md
```

Rules:

1. remove contradictory current-candidate claims;
2. do not promote stale prior-candidate PASS to the mutated candidate;
3. keep historical evidence explicitly historical;
4. do not copy commit SHAs into newly written current sections;
5. no milestone/correction-cycle names in permanent source/test identities;
6. do not claim `product_runtime_start_stop` from the Foundation spine defined below;
7. power-loss remains `NOT_RUN`.

`Q-ASYNC-01` must not simultaneously say `repositoryVerify: PASS` and prose `NOT_RUN` for the same candidate state.

After this plan mutates source, affected H3A-2 evidence is stale until rerun.

---

## Task C6 — Touched-scope provenance hygiene

Scan permanent source/tests touched by this plan for names/comments/fixtures containing development provenance such as:

```text
H3A2
correction
round2
review-fix
candidate
IR-H3A2
```

Historical plans/qualification prose may retain historical identifiers.

Permanent executable source/test identity must use semantic behavior names.

Do not perform a repository-wide renaming campaign in this task; H3-S owns the full-tree stabilization audit.

---

# 7. Foundation Executable Spine — mandatory H3 gate

This is the central corrective measure against “every component is correct but the system does not run”.

It is a **Foundation qualification executable**, not yet the shipping Heptalogos product.

Do not falsely claim H6/Product Runtime.

## Task X1 — Add a permanent process-level Foundation composition verification

Ownership location:

- compose it through the existing `bootstrap-runtime` integration/test boundary, because that package already owns Bootstrap/Host integration and explicitly permits Runtime packages as integration dependencies;
- reuse existing bootstrap-runtime process-test/process-execution infrastructure;
- do not create a new workspace package;
- do not put product integration orchestration into `tools/repo-kit`;
- do not add production imports from `bootstrap-runtime` to Cordis/Runtime Kernel/DBOS.

Use semantic file/target names such as:

```text
foundation-executable-spine
foundation-runtime-process
```

Do not name them after H3/H3A/correction rounds.

The harness may be test/qualification-only, but it must spawn a real child process and use real production package constructors/adapters.

No fake Bootstrap, fake Host, fake Persistence, fake DBOS, or fake PostgreSQL.

A single trivial **semantic no-effect WorkHandler** is permitted as the current workload because H3 has no Subject yet.

## Task X2 — Scenario FS-BOOT-WORK-STOP

From fresh temporary lifecycle roots:

```text
empty test installation/instance roots
→ Bootstrap ownership
→ initialize/start real private PostgreSQL
→ acquire real Host lease/fence/token
→ construct real Persistence
→ construct real RuntimeSubstrate/Runtime Kernel composition needed by H3
→ register one generation-bound no-effect WorkHandler
→ start real WorkQueue/Signal
→ start real DBOS DurableExecution
→ create one canonical WorkItem
→ DBOS executes it
→ canonical WorkItem becomes SUCCEEDED
→ graceful product-owned shutdown/quiescence
→ release Host authority
→ child exits cleanly
```

Assertions must prove actual product-owned identities/authority boundaries, not only “process exited 0”.

At minimum assert:

- same installation/instance identities are coherent;
- real HostOwnershipToken exists and gates mutation;
- WorkItem exists in canonical product schema;
- DBOS projection exists only as engine-private state;
- exact handler executes once for the logical successful attempt;
- shutdown leaves no admitted WorkAttempt invocation;
- Host ownership is released in the authorized order;
- PostgreSQL final state matches the scenario policy.

## Task X3 — Scenario FS-RESTART

Using the same durable roots:

```text
first process completes FS-BOOT-WORK-STOP
→ second process starts same Instance
→ new BootId
→ new HostOwnershipToken
→ same ContinuityEpoch for ordinary restart
→ real PostgreSQL reused
→ Runtime/WorkQueue/DBOS returns usable
→ prior terminal WorkItem is not logically re-executed
→ create another WorkItem
→ second WorkItem succeeds
→ clean stop
```

This is the required “Can it come back?” proof.

Do not add destructive restore, power loss, LKG switching, or update semantics to this scenario.

## Task X4 — Preserve only already-required H3 crash proof

H3A-2 already requires process-crash durability properties around real DBOS.

Keep those required crash scenarios.

Do **not** expand them into a fault-injection matrix beyond the existing H3 contract.

Order qualification execution as:

```text
1. FS-BOOT-WORK-STOP
2. FS-RESTART
3. only then existing required H3A-2 crash/recovery scenarios
```

Happy path must be green before rare timing tests are considered.

## Task X5 — Permanent verification surface

Add one clearly named repository/Nx command for the spine using existing task ownership.

Example semantic target:

```text
bootstrap-runtime:test:foundation-spine
```

The exact Nx wiring may follow existing bootstrap-runtime target conventions.

Do not add another custom task scheduler.

`pnpm verify` does not need to run the real PostgreSQL spine on every static invocation if that would make the ordinary developer gate impractical. Instead:

- `pnpm verify` must verify source/static/unit integrity;
- Foundation spine is an explicit real-integration qualification command;
- the Roadmap/qualification record must treat it as a mandatory H3 closure gate.

---

# 8. Lifecycle Mechanics Ownership Audit — bounded, non-destructive

This audit is required to prevent further NIH-like lifecycle growth.

It is **not** permission to refactor all existing lifecycle code.

## Task L1 — Inspect these owners

```text
packages/runtime-substrate
packages/runtime-kernel
packages/private-postgres
packages/host-ownership
packages/bootstrap-runtime
packages/work-queue
packages/durable-execution
```

For each non-trivial lifecycle/disposal/drain/recovery mechanism, classify it as:

```text
SEMANTIC_PROTOCOL
ADAPTER_GLUE
GENERIC_MECHANIC_DELEGATED
GENERIC_MECHANIC_CUSTOM_JUSTIFIED
GENERIC_MECHANIC_CUSTOM_UNJUSTIFIED
SPECULATIVE_RESILIENCE
```

Check current adopted routes:

```text
Cordis
XState
DBOS
Node/OS facilities
existing Heptalogos mechanics owner
```

## Task L2 — Current-plan action rule

Only make source changes from this audit when:

1. the mechanic directly causes C1–C4 correctness defects; or
2. a duplicate generic implementation can be removed locally with no semantic/API expansion and no new dependency.

Otherwise:

```text
record the category in H3-S Roadmap scope
→ freeze current correct implementation
```

Do not start a broad refactor.

## Task L3 — Cordis utilization review

Specifically inspect `runtime-substrate` custom:

```text
task tracking
late disposer handling
settlement timeout
background failure projection
```

Determine whether each is:

- Heptalogos policy above Cordis;
- a limitation the adopted Cordis route cannot supply;
- or duplicated generic lifecycle mechanics.

No provider replacement is authorized here.

If evidence is insufficient, record it as an H3-S bounded investigation, not a new current implementation project.

---

# 9. Roadmap convergence

## Task R1 — Update H3 current status

In `docs/roadmap/development-roadmap.md`, current H3 truth should become conceptually:

```yaml
H3: OPEN
H3A_1: CLOSED
H3A_2: CORRECTION_AND_EXECUTABLE_PROOF_IN_PROGRESS
H3_FOUNDATION_EXECUTABLE_SPINE: REQUIRED
H3B: BLOCKED_UNTIL_H3A2_AND_SPINE
H3_STABILIZATION: NOT_ELIGIBLE
```

Use repository-preferred status vocabulary if an exact enum already exists; do not invent a competing status system.

`activeImplementationPlan` points to this plan.

## Task R2 — Add executable gate policy to Roadmap

Every Horizon must identify the strongest executable proof it owns.

For H3:

```text
real Foundation process composition
real PostgreSQL
real DBOS
one meaningful canonical WorkItem
boot/work/stop/restart
```

For H6:

```text
real Product vertical slice
message → Subject → model → decision → Effect → response
```

Do not allow package/interface/test counts to substitute for these outcomes.

## Task R3 — Define H3B as deliberately narrow

H3B scope:

```text
canonical EffectOperation
prepared
dispatching
succeeded
failed
uncertain
Host/Effect fence
no automatic redispatch of uncertain effects
minimal reconciliation/idempotency seam where the external system supports it
```

Explicit H3B non-goals:

```text
full NetworkAccess platform
general retry engine
provider fleet
full messaging Driver stack
ResourceGovernor
Backup/Restore framework
global effect broker
automatic multi-step compensation
```

## Task R4 — Redefine H3-S as Foundation Containment / Stabilization

H3-S is not “more hardening”.

Its purpose is:

```text
current-tree residue cleanup
PRE_PRODUCTION legacy/compatibility cleanup
speculative-resilience audit
lifecycle mechanics ownership audit
Bootstrap scope containment check
current consumer/invariant check for implemented Foundation surfaces
qualification/current-truth cleanup
Executable Spine revalidation
```

H3-S may delete obsolete/speculative implementation only when evidence is clear.

H3-S must not add new product capability.

## Task R5 — Pull product validation forward after H3-S

Roadmap ordering must remain a dependency DAG, not a rigid waterfall.

After H3-S:

1. implement only the **minimum H4 prerequisites** required by one real model provider and Subject Base:
   - minimal Configuration ownership;
   - minimal Secret ownership;
   - minimal Network/Capability policy boundary;
2. do not require the entire H4 Management/Cedar/Approval/HTTP/CLI universe before the first Subject slice unless a hard architecture edge actually requires it;
3. do not require full H5 third-party Extension package lifecycle before first-party Subject functionality;
4. make the smallest H6 Subject Base vertical slice the next primary product proof.

The Roadmap must preserve the hard edge:

```text
real provider use requires Configuration/Secret/Network/Capability boundaries
```

but not interpret that as:

```text
all of H4 and H5 must be complete before Subject code may run.
```

---

# 10. Presentation / Desktop / Distribution architecture synchronization

## Documentation only — no implementation in this plan

Update the following existing Architecture documents:

```text
docs/architecture/management-presentation.md
docs/architecture/platform-distribution.md
docs/architecture/extensions.md
docs/roadmap/development-roadmap.md
```

No package/dependency/source implementation is authorized.

## Task P1 — `management-presentation.md`

Record:

1. Browser UI and Desktop UI are carriers of the **same front-end application**, not separate product architectures.
2. Presentation remains a projection/client; it owns no System/Subject/Host Authority.
3. Multiple Presentation clients converge on the same Management/System Authority.
4. Desktop shell main/preload code cannot bypass Management/System Authority.
5. Closing/uninstalling a Desktop Presentation shell does not stop/delete the Host, Subject, or durable product data.
6. Application-owned visual chrome may coexist with platform-owned window semantics; native snapping, accessibility, fullscreen, DPI/window behavior remain platform responsibilities.
7. Electron is a preferred future Desktop shell direction because Chromium/render determinism is valuable, but Electron is replaceable implementation technology, not product identity.

## Task P2 — `platform-distribution.md`

Record:

1. Core capability is complete without a Desktop Presentation package.
2. Desktop Presentation is an optional product component, fetched/carried only where a local window is wanted.
3. Windows/macOS/Linux/Linux Server are distribution entry/preset targets, not domain product lines.
4. Do not create `serverMode`, `desktopMode`, `serverEdition`, or equivalent domain semantics merely from packaging.
5. Linux Host/Subject/Web/service/headless capability is first-class.
6. Linux local desktop visuals may accept reasonable degradation; Windows/macOS are high-fidelity visual targets.
7. Linux Server is the same capability model and simply does not carry/fetch Desktop Presentation by default.
8. Future generation-coupled Core/Web/Desktop manifest, signing/notarization/update mechanics, remote Web TLS/auth, Electron cold-start/RSS/GPU, and detailed installer behavior remain provisional/qualification work.

## Task P3 — `extensions.md`

State explicitly:

```text
Desktop Presentation Package is a product component.
It is not an Extension/Plugin.
```

The Extension lifecycle must not become the mandatory lifecycle of the Desktop shell.

## Task P4 — Roadmap

Record Electron/Desktop work as deferred research/qualification.

No Electron implementation is permitted in H3.

---

# 11. Qualification and evidence

After any source mutation, previous affected current-candidate evidence is stale.

Do not carry it forward by prose.

## Task Q1 — Focused unit tests

Run affected unit suites at minimum:

```text
durable-execution
work-queue
bootstrap-runtime
runtime-kernel/runtime-substrate if their authentic quiescence composition changed
host-ownership if Host terminal behavior changed
```

Record actual counts only after execution.

## Task Q2 — Real PostgreSQL + real DBOS

Run the current H3A-2 real integration matrix required by the active architecture/plan.

At minimum the current candidate must freshly prove on the platforms available/required for H3A-2 closure:

```text
Windows real PostgreSQL + DBOS
Ubuntu/Linux real PostgreSQL + DBOS
```

If one required platform cannot be run:

```text
NOT_RUN or BLOCKED
```

Do not substitute mocks or historical candidate evidence.

macOS real PostgreSQL remains `NOT_RUN` unless actually run and is not newly made an H3A-2 functional blocker by this plan.

## Task Q3 — Foundation Executable Spine

Run:

```text
FS-BOOT-WORK-STOP
FS-RESTART
```

with real PostgreSQL and real DBOS.

Record a distinct property such as:

```yaml
foundation_executable_spine_boot_work_stop: PASS
foundation_executable_spine_restart: PASS
```

in the relevant existing qualification records.

Do not rewrite:

```yaml
product_runtime_start_stop: PASS
```

because H6 Product Runtime does not yet exist.

`Q-RUNTIME-01` may record the Foundation composition property while retaining product runtime as `NOT_RUN`.

`Q-ASYNC-01` records the real WorkItem/DBOS portion.

Do not create a new qualification-document family solely for these two properties unless the existing qualification schema mechanically requires a separate record.

## Task Q4 — Existing H3A-2 crash properties

Run only the already-required crash/recovery cases after happy-path spine is green.

Do not add power-loss or arbitrary fault-matrix cases.

## Task Q5 — Repository gates

Run:

```text
pnpm verify
```

plus the repository's current documentation/architecture/plan/current-tree gates affected by these changes.

Do not weaken lint, boundary, dependency-route, documentation, or current-tree hygiene gates to get a PASS.

## Task Q6 — Evidence reconciliation

Update current sections in:

```text
docs/qualification/results/Q-ASYNC-01.md
docs/qualification/results/Q-RUNTIME-01.md
docs/roadmap/development-roadmap.md
```

Use only:

```text
PASS
FAIL
NOT_RUN
BLOCKED
```

for verification state.

Historical evidence remains labelled historical.

Explicitly preserve:

```yaml
hardware_power_loss: NOT_RUN
source_less: NOT_RUN
service_headless: NOT_RUN
```

where those claims are still unrun.

---

# 12. Candidate and review lifecycle

All repository mutation under this plan occurs while the current candidate is mutable/Draft.

Sequence:

```text
governance mutation
→ architecture/roadmap mutation
→ H3A-2 correctness mutation
→ executable spine
→ focused tests
→ real PG/DBOS qualification
→ pnpm verify
→ current-truth/evidence final synchronization
→ no further mutation
→ candidate freeze / Ready
→ external Independent Review
```

Independent Review is the existing out-of-band Heptalogos governance verdict, not GitHub PR Review.

If Independent Review returns `REQUEST_CHANGES`:

- only accepted findings become new work;
- do not recursively invent additional hardening beyond findings;
- return candidate to mutable/Draft before repository mutation.

After external Independent Review `PASS`:

- perform the required final manual exact-candidate verification according to repository closure policy;
- no GitHub Actions are required or to be enabled;
- any mutation after review/final verification makes that evidence stale.

Do not merge merely because local tests pass.

---

# 13. Explicit non-goals

This plan does not implement:

```text
H3B EffectOperation
H4 full Configuration
H4 full SecretService
Cedar/Approval/SystemAction implementation
Management HTTP/CLI
H5 PackageManager/Extension lifecycle
H6 Subject
AI provider integration
Messaging Driver
Memory/Persona/Relationship
ResourceGovernor/PressureSnapshot
Backup/Restore
Update/TUF
Electron/Desktop shell
remote Web exposure
source-less packaging
service installation
hardware power-loss handling
```

It may update future-facing Architecture/Roadmap prose for already-decided constraints, but must not create implementation scaffolding for them.

---

# 14. Stop conditions

Stop with `PLAN_GAP` instead of expanding scope if any of the following occurs:

1. Correctness fix requires changing HostOwnershipFence or Bootstrap Authority semantics.
2. Correctness fix appears to require replacing DBOS/Cordis/XState.
3. A new external dependency or workspace package appears necessary.
4. Foundation Executable Spine cannot be composed without pulling H4/H6 product semantics forward.
5. A rare/catastrophic F3/F4 case not explicitly authorized appears during implementation.
6. A test would require new production state solely to make the test injectable/observable.
7. An adopted mechanics provider appears insufficient but no explicit evidence-based provider reopening has been approved.
8. A required real-platform qualification cannot actually run.
9. Current Architecture documents contradict the locked semantics in this plan.
10. A proposed “safety” fix cannot name its current threat/failure model and present invariant.

For newly discovered non-blocking edge cases:

```text
record concise deferred risk
→ continue
```

Do not automatically implement them.

---

# 15. Required execution order

The Agent must execute in this order.

```text
S0  Inspect baseline and activate single plan Authority

G1–G5
    Governance convergence

A1–A3
    Bootstrap/Foundation architecture truth synchronization

C1
    DurableExecution reversible pre-entry quiescence

C2
    Truthful/retryable close

C3
    Bounded upstream WorkQueue quiescence

C4
    DBOS credential-scoped preflight

C5–C6
    Current truth + touched-scope hygiene

X1–X5
    Foundation Executable Spine

L1–L3
    Bounded lifecycle mechanics ownership audit
    (no broad refactor)

R1–R5
    Roadmap convergence

P1–P4
    Presentation/Desktop/Distribution documentation-only sync

Q1–Q6
    Full current-candidate requalification and evidence synchronization

Freeze
→ Independent Review
→ final manual verification
```

If an earlier stage fails, do not continue into later feature/document expansion merely to “make progress”.

In particular:

```text
Foundation Executable Spine FAIL
→ fix the spine
→ do not continue to new Foundation capability
```

---

# 16. File-level expected change map

Expected/authorized current files include:

```text
AGENTS.md

docs/governance/constitution.md
docs/governance/engineering-principles.md

docs/engineering/playbooks/mechanics-ownership-and-library-first.md
docs/plans/README.md

docs/architecture/contracts/startup-recovery-runtime-supervision.md
docs/architecture/execution-model.md
docs/architecture/foundation-services.md
docs/architecture/management-presentation.md
docs/architecture/platform-distribution.md
docs/architecture/extensions.md

docs/roadmap/development-roadmap.md

docs/qualification/results/Q-ASYNC-01.md
docs/qualification/results/Q-RUNTIME-01.md

packages/durable-execution/src/contracts.ts
packages/durable-execution/src/dbos-runtime.ts
packages/durable-execution/src/dbos-lifecycle-machine.ts
packages/durable-execution/src/dbos-client.ts
packages/durable-execution/README.md

packages/work-queue/** only where authentic bounded quiescence requires it
packages/bootstrap-runtime/** integration/process verification and README
packages/runtime-kernel/** only if authentic quiescence composition requires it
packages/runtime-substrate/** only if authentic quiescence composition requires it
packages/host-ownership/** only if a current terminality contract must be aligned

existing test/process-support owner files required for the semantic
`foundation-executable-spine` verification target
```

This is an authorization ceiling, not a requirement to touch every listed source file.

Do not create catch-all `utils`, `lifecycle`, `common`, or `shared` packages.

---

# 17. Closure criteria

This plan is implementation-complete only when all of the following are true.

## Governance

- Constitution contains Executable Truth, maturity-proportional reliability, bounded recovery, and present-justification principles.
- Engineering principles contain operational failure classes and complexity admission.
- Root `AGENTS.md` directly constrains Agent rare-case/recursive-hardening behavior.
- Library-first playbook classifies lifecycle mechanics and speculative resilience.
- Plan governance requires executable target and authorized/deferred failure classes.

## H3A-2 correctness

- reversible pre-entry quiescence cannot leave restored upstream + FAILED DurableExecution;
- close failure cannot report CLOSED;
- failed close can be retried without pretending resources were released;
- upstream quiescence cannot wait unbounded;
- DBOS preflight client/URL cannot escape credential callback scope;
- touched production/test identities contain no development-stage provenance.

## Executable Truth

A fresh real process proves:

```text
boot → Host → Runtime → WorkQueue → DBOS → WorkItem success → stop
```

and a second process proves:

```text
restart same Instance → usable runtime → new work success → stop
```

with real PostgreSQL and real DBOS.

## Architecture/Roadmap

- Bootstrap future scope is contained without rewriting current implementation.
- H3B is minimal.
- H3-S is convergence/subtraction, not hardening expansion.
- Minimum Subject vertical slice is the next major product validation after its minimum prerequisites.
- Presentation/Desktop/Distribution future constraints are recorded without implementation.

## Evidence

- focused tests PASS;
- required real PostgreSQL/DBOS qualification PASS on actually required/run platforms;
- Foundation Executable Spine PASS;
- existing required H3A-2 crash proofs PASS;
- `pnpm verify` PASS;
- all unrun claims remain `NOT_RUN`;
- hardware power-loss remains explicitly non-blocking and `NOT_RUN`;
- current qualification/roadmap prose is internally consistent.

## Governance closure

- candidate becomes Ready only after all repository mutation and evidence synchronization;
- external Independent Review is performed on the exact candidate;
- final manual verification occurs only after Independent Review PASS;
- no GitHub Actions are enabled/used;
- H3A-2 closes only after required closure gates are truthfully complete.

---

# 18. Post-closure development direction

After this plan closes, do not reopen Foundation merely because more theoretically desirable hardening can be imagined.

Next direction:

```text
H3B minimal Effect uncertainty
→ H3-S Foundation Containment/Stabilization
→ minimum H4 prerequisites for one real provider
→ smallest H6 Subject Base vertical slice
```

From that point onward development uses a vertical ratchet:

```text
working Product Spine
→ real consumer exposes missing capability
→ implement smallest necessary Foundation support
→ Product Spine must remain green
→ continue
```

The project must stop using:

```text
“finish every theoretically complete Foundation service first”
```

as its implicit progress model.

The relevant success criterion is no longer:

```text
How many abstractions have been made complete?
```

It is:

```text
Does the current system run,
does it preserve its real invariants,
and is each new unit of complexity justified by a present need?
```
