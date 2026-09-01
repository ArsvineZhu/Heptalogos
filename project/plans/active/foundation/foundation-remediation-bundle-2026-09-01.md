# Heptalogos Foundation Remediation Bundle — Closure Correction — 2026-09-01

**State:** `ACTIVE`
**Mode:** `PRE_PRODUCTION`
**Branch:** `dev/h3-stabilization`
**Baseline:** `da7e2f013d92066b09da187ce03875207b085962`

This file is the repository's self-contained active authorization for the bounded
closure correction. It records the binding result, scope, ceilings, and closure
conditions; no temporary or missing execution bundle is required to authorize
the current work.

The correction preserves the existing Foundation remediation candidate's
PRE_PRODUCTION scope and makes the following current truths executable: durable
maintenance entry precedes runtime retirement, PREPARED recovery never executes
intent, normal/recovery/restart Host reacquisition has one package-private owner,
Signal/reconciler wakeup has no WorkQueue scheduler option, recovery reads
current/previous journal integrity without a recovery-head projection, and
`parseProblem` accepts only the strict nested `FieldError` keys.

## Required result

Preserve the H3 semantic spine:

```text
Bootstrap → private PostgreSQL → Host lease/token/fence → canonical persistence
→ RuntimeKernel Service/Capability/Generation → Signal hint/rescan
→ canonical WorkItem → DBOS durable dispatch → WorkAttempt fencing
→ EffectOperation uncertainty → Lineage/Evidence
```

The permanent system must be a net simplification: clearer package ownership, a smaller reversible lifecycle/recovery surface, fewer test-created production seams, lower affected production and test TypeScript, and less duplicated current governance knowledge. No H3 functionality may be weakened.

## Locked architecture decisions

### Maintenance and recovery

- Replace Host/runtime reversible quiescence leases and `resumeAfterAbort()` with terminal product-runtime retirement. A successful retirement never resumes the old runtime; failure never authorizes reconstructing it.
- Keep explicit `abortBeforeExecute()` while an operation is `PREPARED`.
- Rewrite MaintenanceJournal V1 in place as a compact operation witness with operation/activity/installation/instance/source Host and PostgreSQL identity, target, phase, timestamp, and optional Problem. Phases are `PREPARED`, `EXECUTING`, `RECOVERY_REQUIRED`, `SUCCEEDED`, and `ABORTED`; no historical substep replay.
- `execute()` is one-way at orchestration entry. Persist `EXECUTING` before
  runtime retirement or consequential authority mutation; revoke/fence old Host
  authority at the point of no return; never restore the old
  Host/Runtime/DBOS/WorkQueue as rollback. A PREPARED operation whose process
  disappears is aborted only after authorized recovery proves that no live
  normal Host owns the instance; a live Host blocks recovery without mutation.
- STOP converges the same PostgreSQL cluster to `STOPPED`. RESTART converges the same cluster to `READY` and reuses ordinary Bootstrap→Host handoff for fresh lease/token publication.
- Recovery is current-truth inspection/convergence. It must not contain a second Host construction/publication algorithm or recovery-of-recovery protocol. Fail-stop/`RECOVERY_REQUIRED` is valid.
- Normal Bootstrap, recovery-forward, and maintenance-restart reacquisition
  share one package-private full Host handoff owner; callers retain only their
  Bootstrap-specific final journal/release authority.
- Preserve real external uncertainty in PrivatePostgres and EffectOperation.

### Runtime and durable execution

- Remove only the global reversible RuntimeKernel supervisor lifecycle whose purpose is maintenance rollback; retain Desired/Actual reconciliation, registries, readiness, generation fencing, component replacement, and RuntimeSubstrate/Cordis ownership.
- Remove DurableExecution quiesce/resume contracts and lifecycle-machine machinery. DBOS remains the adopted provider for workflow, queue, drain, and first-order restart recovery; the Heptalogos adapter owns Host fencing and WorkAttempt semantics.
- WorkQueue retains canonical WorkItem/CAS, fair scan, Signal anti-entropy,
  cancellation, supersession, and local reconciler lifecycle. Signal and the
  reconciler own wakeup; there is no production maintenance coordinator or
  second scheduler.
- Remove cross-package/test-only `clientFactory`, `ForTests`, repository overrides, or equivalent seams only where exact consumer evidence shows they create test architecture; do not add a DI framework or replacement provider.

### Topology and composition

All product packages move to exactly `packages/<group>/<package>/`; group directories contain a README and no `package.json`, while npm names/import specifiers remain unchanged. Use these groups:

```text
foundation: foundation-contracts, schema-runtime, time-service
bootstrap: bootstrap-state, bootstrap-runtime, private-postgres, host-ownership
data: canonical-schema, persistence
runtime: runtime-substrate, runtime-kernel
execution: execution-lineage, evidence, signal, work-queue, durable-execution, effect-operation
```

Create the repository-level `integration/foundation` Nx project for cross-package H3 composition. BootstrapRuntime remains a Bootstrap owner and must not acquire unrelated production dependencies merely to host integration fixtures.

### Semantic ownership corrections

- `foundation-contracts` owns strict current V1 `parseProblem(value: unknown): Problem | undefined`; no SchemaRuntime dependency or compatibility parser.
- Signal keeps LISTEN/NOTIFY, initial/reconnect rescan, bounded close, and Host credential semantics, but client/factory/notification test transport types, the concrete service class, and unconsumed problem constructor are not root public contracts.
- EffectOperation loses the public repository override and uses its canonical repository; its uncertainty state machine and real-PG/process semantics remain.
- Package layout and current dependency routing are checked structurally without fixed package/group allowlists or one-symbol permanent validators.

### Closure-correction acceptance

- `PREPARED → EXECUTING` is durably observable before retirement, and the real
  process regression proves a killed pre-execute child cannot restart its
  maintenance intent.
- Host lease/token/fence publication and canonical admission have one current
  handoff owner shared by ordinary, recovery, and maintenance-restart paths.
- Exact residual searches for `scheduleReconciliation`,
  `MaintenanceJournalRecoveryHead`, `loadRecoveryHead`, and the old abort name
  have no current production or active-plan consumer.
- The `integration/foundation` project is a Knip entry surface, its mixed-owner
  durable tests are split at semantic boundaries, and the changed bootstrap
  integration scenarios are similarly split without a test-support product
  package.
- Current package READMEs, maintenance specs, qualification projections, and
  Roadmap entries describe the same ownership and evidence boundary. Local
  evidence may be `PASS`; Independent Review and merge remain `NOT_RUN` until
  those external gates actually run.

## Explicit non-goals and ceilings

No new product capability, H4/H5/H6 implementation, durable table/column/migration/state, compatibility alias/shim/bridge, provider role, generic DI/lifecycle framework, scheduler, heartbeat, recovery layer, test-support product package, or broad API redesign is authorized. Package moves, direct consumers/configuration updates, affected tests/fixtures, current Specs/docs/governance, and the repository checks required by this target are within scope.

The implementation may edit only paths required by the Bundle and direct compile/import cleanup. It must not reopen unrelated RuntimeSubstrate, Persistence, HostOwnership, PrivatePostgres, CanonicalSchema, or product-runtime semantics.

## Ordered execution

1. Verify exact remote/base/working-tree state; record compatibility (`PRE_PRODUCTION`, empty obligations), package/TypeScript/test/governance metrics; supersede the former H3-S active Plan; install this Plan and the project Charter.
2. Move packages mechanically with `git mv`, add group documentation, update workspace/Nx/TypeScript/Knip/jscpd/TypeDoc/verification/index paths, and add `pnpm check:package-layout` using existing utilities.
3. Create and qualify `integration/foundation`; move cross-package composition tests/support out of BootstrapRuntime and remove only now-unneeded dev composition edges.
4. Simplify RuntimeKernel terminal supervision and DurableExecution provider lifecycle according to the locked one-way model, preserving H3 semantic owners and DBOS first-order recovery.
5. Rewrite MaintenanceJournal/Host maintenance and current-truth recovery; remove obsolete reversible lifecycle/stage replay and test-only cross-boundary seams. Do not reconstruct the old runtime after execution entry.
6. Delete obsolete tests and split changed mixed-owner tests by contract/scenario; retain real PostgreSQL/DBOS/process qualification.
7. Reconcile current Specs, package/group/integration docs, Charter/governance, Roadmap, Plan Index, dependency/qualification projections, and record the mechanics ownership audit.
8. Run focused package tests, real provider/process qualification, repository layout/boundary/dependency/unused/duplicate/hygiene/knowledge checks, `pnpm verify`, and final diff/line metrics.

## Evidence and closure

Use only `PASS`, `FAIL`, `NOT_RUN`, or `BLOCKED` for executed evidence. Mock/unit evidence does not prove real PostgreSQL/DBOS/provider/process behavior; one platform does not prove another. The affected production and test TypeScript diff must each have more deletions than additions, obsolete tests and reversible lifecycle/recovery source must be removed, and no new production test-only seam may appear.

Acceptance requires: preserved Host/Persistence/Runtime/Signal/WorkItem/DBOS/Effect/Lineage/Evidence semantics; zero deleted lifecycle/recovery surfaces or equivalent renamed rollback; exact two-level package topology and integration ownership; truthful current Specs/qualification; empty PRE_PRODUCTION obligations; focused and repository gates green; and real H3 PostgreSQL+DBOS executable-spine qualification at the strongest available boundary.

External Independent Review and merge are separate closure gates. If they are not actually executed, record them as `NOT_RUN`; do not infer them from local tests, GitHub metadata, or prior candidate records. Once every required current evidence and external gate is green, move this Plan to `project/plans/completed/`, update Roadmap/qualification truth, verify no active implementation Plan remains, and STOP. A concrete unresolved owner/provider/state/failure/evidence contradiction is `PLAN_GAP`; do not improvise around it.
