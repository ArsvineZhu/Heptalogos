# Q-EFFECT-01 EffectOperation 资格证据

```yaml
qualificationId: Q-EFFECT-01
role: canonical consequential external-effect truth
date: 2026-09-01
evidenceLevel: L3
evidenceStatus: PASS
testedProperty: "EffectOperation V1 identity, immutable request, Host-fenced dispatch admission, outcome uncertainty, WorkItem separation, reconciliation, and process restart behavior"
qualificationState: PARTIAL
currentCandidate:
  candidateId: FOUNDATION-REMEDIATION-BUNDLE-2026-09-01
  branch: dev/h3-stabilization
  plan: project/plans/active/foundation/foundation-remediation-bundle-2026-09-01.md
  lifecycle: ACTIVE
  freeze: NOT_RUN
  independentReview: NOT_RUN
  merge: NOT_RUN
```

## Current boundary

`effect-operation` is the sole semantic owner of `EffectOperation`. The
canonical PostgreSQL row owns effect truth; `persistence` owns the Host-fenced
transaction boundary; `execution-lineage` and `evidence` retain causal facts;
`work-queue` owns WorkItem truth; DBOS remains execution mechanics.

The request is V1, immutable after preparation, and identified externally by
the caller-supplied `EffectOperationId`. Only a committed
`PREPARED → DISPATCHING` compare-and-set winner may invoke the injected port.
An ambiguous dispatch or an explicitly recovered `DISPATCHING` operation
becomes `UNCERTAIN`; a live concurrent observer leaves `DISPATCHING` unchanged.
Reconciliation is read-only and cannot dispatch again. The synthetic
WorkHandler composes its existing invocation signal with the managed Host
signal using Node's `AbortSignal.any()` before dispatch.

## Current candidate evidence

```yaml
effectOperationUnit: PASS (1 file, 4 tests)
realPostgresServiceQualification: PASS (6/6 tests)
processQualification: PASS (6/6 tests; EU-01, EU-02, EU-03, EU-04, EU-05, EU-06)
effectUncertaintyTarget: PASS (12/12 combined tests)
effect_contract_unit: PASS (effect-operation 1 file, 4 tests)
effect_identity_unit: PASS (foundation-contracts 6 files, 36 tests)
effect_schema_unit: PASS (canonical-schema 1 file, 4 tests)
effect_real_postgres_transitions: PASS (6/6 service tests)
effect_concurrent_dispatch_admission: PASS
effect_live_dispatch_observer: PASS
effect_explicit_recovery: PASS
effect_pre_call_abort: PASS
effect_work_handler_signal_propagation: PASS
effect_host_fenced_completion: PASS
effect_host_fenced_refinement: PASS
effect_reconciliation_semantics: PASS (UNKNOWN preserves UNCERTAIN; SUCCEEDED refines to SUCCEEDED; FAILED refines to FAILED; reconciliation does not dispatch)
effect_lineage_evidence: PASS (real PostgreSQL assertions cover effect.prepare/effect.prepared, effect.dispatch/effect.dispatch-started/effect.outcome, effect.reconcile/effect.reconciled, and process recovery effect.recover-uncertain/effect.outcome)
effect_process_success: PASS
effect_process_definitive_failure: PASS
effect_process_ambiguous_crash: PASS
effect_no_redispatch_after_restart: PASS
effect_conservative_prewrite_crash: PASS
effect_outcome_replay: PASS
effect_host_loss_after_external_call: PASS
workitem_effect_truth_separation: PASS
dbos_effect_authority_boundary: PASS
no_effect_scheduler_or_retry_engine: PASS
no_preproduction_compatibility_baggage: PASS
foundation_executable_spine_regression: PASS
repository_verify: PASS (pnpm nx run repository:verify --skip-nx-cache)
source_less: NOT_RUN
service_headless: NOT_RUN
macos_real_effect_process: NOT_RUN
hardware_power_loss: NOT_RUN
independent_review: NOT_RUN
merge: NOT_RUN
```

Actual runs on the current Windows host:

- `effect-operation` unit: 1 file, 4 tests, `PASS`.
- `foundation-contracts` unit: 6 files, 36 tests, `PASS`.
- `canonical-schema` unit: 4 tests, `PASS`.
- `integration-foundation:test:effect-uncertainty` real PostgreSQL service
  qualification: 6 tests, `PASS`.
- The same target's process qualification: 6 tests, `PASS`, covering EU-01
  through EU-06; the combined target ran 12 tests, `PASS`, with a file-backed
  sink outside canonical PostgreSQL.
- The existing reconciliation scenario directly proves `FAILED` refinement
  without an additional dispatch call, `PASS`.
- Real PostgreSQL assertions directly prove the required Effect Activity and
  Evidence distinctions for preparation, dispatch/outcome, reconciliation,
  and explicit process recovery, `PASS`.
- `integration-foundation:test:foundation-spine`: 2 tests, `PASS`.

The process proof establishes one sink write for successful dispatch, zero for
definitive failure, one write plus `UNCERTAIN` after a crash following the
write, zero writes plus conservative `UNCERTAIN` after a crash before the
write, no duplicate after an already committed effect outcome, and no
redispatch after authentic Host lease loss.

## Unrun boundaries

```yaml
real_network_provider: NOT_RUN
real_messaging_driver: NOT_RUN
real_ai_provider: NOT_RUN
source_less: NOT_RUN
service_headless: NOT_RUN
macos_real_effect_process: NOT_RUN
hardware_power_loss: NOT_RUN
independent_review: NOT_RUN
merge: NOT_RUN
```

No live provider, Messaging Driver, AI provider, source-less artifact,
service/headless installation, macOS process, hardware power-loss path,
independent review, or merge was claimed for the current unmerged candidate.

## Decision

```yaml
effect_implementation: PASS
qualificationState: PARTIAL
reason: "All current EffectOperation semantic and Windows real PostgreSQL/process proof claims passed, including direct FAILED reconciliation and required Activity/Evidence distinctions; the current candidate remains unmerged and external review/merge are NOT_RUN; deferred provider, artifact, platform, service, and hardware boundaries remain NOT_RUN."
reopenConditions: "Only new current evidence, an accepted current-Horizon failure, a current consumer/invariant, or an explicit active Plan requirement."
```

## Historical H3B post-merge closure reconciliation

```yaml
pullRequest: 31
independentReview: PASS
squashMerge: PASS
postMergeReconciliation: PASS
```

The exact review candidate pair and squash-merge commit are recorded in
`qualification-status.json`. `qualificationState` remains `PARTIAL` because
the provider, source-less, platform, service/headless, and hardware boundaries
remain explicitly `NOT_RUN`.

## Historical H3-S candidate qualification

```yaml
candidateId: H3S-FOUNDATION-PERMANENT-SURFACE-ADMISSION-2026-08-31
baseSha: bbadfbacbd9aaea23639e51d5ce01744bd530da4
branch: dev/h3-stabilization
plan: project/plans/superseded/foundation/h3s-foundation-permanent-surface-admission-2026-08-31.md
lifecycle: READY
freeze: PASS
effectOperationUnit: PASS (1 file, 4 tests)
realPostgresServiceQualification: PASS (6/6 tests)
processQualification: PASS (6/6 tests; EU-01 through EU-06)
foundationExecutableSpineRegression: PASS (2/2 tests)
bootstrapRuntimeFullIntegration: PASS (10 files, 113 tests)
repositoryVerify: PASS
independentReview: NOT_RUN
```

That historical candidate evidence revalidated the EffectOperation construction
and Problem-parser ownership changes on the Windows PostgreSQL 18.6 toolchain.
The prior H3B post-merge record above remains historical evidence for its own
candidate and is not rewritten.

## Current Foundation remediation projection

```yaml
candidateId: FOUNDATION-REMEDIATION-BUNDLE-2026-09-01
branch: dev/h3-stabilization
plan: project/plans/active/foundation/foundation-remediation-bundle-2026-09-01.md
effectOperationUnit: PASS (1 file, 4 tests)
realPostgresService: PASS (6/6 service tests)
processQualification: PASS (6/6 tests; EU-01 through EU-06)
foundationExecutableSpine: PASS (2/2 tests)
repositoryVerify: PASS
independentReview: NOT_RUN
merge: NOT_RUN
qualificationState: PARTIAL
```

The current projection does not inherit H3B or H3-S candidate evidence after
the remediation source and integration-boundary changes.
