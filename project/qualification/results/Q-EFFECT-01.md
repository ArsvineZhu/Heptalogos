# Q-EFFECT-01 EffectOperation 资格证据

```yaml
qualificationId: Q-EFFECT-01
role: canonical consequential external-effect truth
date: 2026-08-31
evidenceLevel: L3
evidenceStatus: PASS
testedProperty: "EffectOperation V1 identity, immutable request, Host-fenced dispatch admission, outcome uncertainty, WorkItem separation, reconciliation, and process restart behavior"
qualificationState: PARTIAL
```

## Current boundary

`effect-operation` is the sole semantic owner of `EffectOperation`. The
canonical PostgreSQL row owns effect truth; `persistence` owns the Host-fenced
transaction boundary; `execution-lineage` and `evidence` retain causal facts;
`work-queue` owns WorkItem truth; DBOS remains execution mechanics.

The request is V1, immutable after preparation, and identified externally by
the caller-supplied `EffectOperationId`. Only a committed
`PREPARED → DISPATCHING` compare-and-set winner may invoke the injected port.
An ambiguous dispatch or recovered `DISPATCHING` operation becomes
`UNCERTAIN`; reconciliation is read-only and cannot dispatch again.

## Evidence

```yaml
effect_contract_unit: PASS
effect_identity_unit: PASS
effect_schema_unit: PASS
effect_real_postgres_transitions: PASS
effect_concurrent_dispatch_admission: PASS
effect_host_fenced_completion: PASS
effect_host_fenced_refinement: PASS
effect_reconciliation_semantics: PASS
effect_process_success: PASS
effect_process_definitive_failure: PASS
effect_process_ambiguous_crash: PASS
effect_no_redispatch_after_restart: PASS
effect_conservative_prewrite_crash: PASS
effect_outcome_replay: PASS
effect_host_loss_after_external_call: PASS
effect_lineage_evidence: PASS
workitem_effect_truth_separation: PASS
dbos_effect_authority_boundary: PASS
no_effect_scheduler_or_retry_engine: PASS
no_preproduction_compatibility_baggage: PASS
foundation_executable_spine_regression: PASS
```

Actual runs on the current Windows host:

- `effect-operation` unit: 2 files, 9 tests, `PASS`.
- `foundation-contracts` unit: 6 files, 34 tests, `PASS`.
- `canonical-schema` unit: 4 tests, `PASS`.
- `bootstrap-runtime:test:effect-uncertainty` real PostgreSQL service
  qualification: 6 tests, `PASS`.
- The same target's process qualification: 12 tests, `PASS`, covering EU-01
  through EU-06 with a file-backed sink outside canonical PostgreSQL.
- `bootstrap-runtime:test:foundation-spine`: 2 tests, `PASS`.

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
```

No live provider, Messaging Driver, AI provider, source-less artifact,
service/headless installation, macOS process, or hardware power-loss path was
claimed by this record.

## Decision

```yaml
effect_implementation: PASS
qualificationState: PARTIAL
reason: "All current EffectOperation semantic and Windows real PostgreSQL/process proof claims passed; deferred provider, artifact, platform, service, and hardware boundaries remain NOT_RUN."
reopenConditions: "Only new current evidence, an accepted current-Horizon failure, a current consumer/invariant, or an explicit active Plan requirement."
```
