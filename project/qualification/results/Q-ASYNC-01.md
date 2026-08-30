# Q-ASYNC-01 资格证据

```yaml
qualificationId: Q-ASYNC-01
role: WorkQueue scheduling mechanics
evidenceStatus: PASS
preImplementationDecisionState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
selectedRoute: "DBOS Queue"
h3a2Candidate:
  candidateId: H3A2-FOUNDATION-CONTAINMENT-2026-08-29
  plan: project/plans/superseded/repository/knowledge-architecture-agent-harness-convergence-2026-08-30.md
  lifecycle: DRAFT
  freeze: NOT_RUN
  independentReview: NOT_RUN
  finalManualVerification: NOT_RUN
  githubActions: NOT_ENABLED_OR_REQUIRED
h3a1Candidate:
  merge: PASS
  governanceRecovery: PASS
previousH3a2ReviewDisposition: REQUEST_CHANGES
```

## Observed properties

```yaml
evidence:
  semantic_dispatcher_fixture: PASS
  generation_pin_revision_fence: PASS
  terminal_replay_fixture: PASS
  dbos_queue_boundary: PASS
  dbos_branch_machine_capture: PASS
  revision_creates_new_attempt: PASS
  postgres_restart_read: PASS
  missing_retained_generation_blocks: PASS
  terminal_retry_single_effect: PASS
  h3a1_crash_after_terminal_commit: NOT_RUN
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
  h3a1_handler_descriptor_canonical_snapshot: PASS
  h3a1_generation_fenced_settlement: PASS
  h3a1_future_not_before_projection: PASS
  h3a1_payload_version_dependency_no_revision_churn: PASS
  h3a1_waiting_state_cancellation: PASS
  h3a1_first_terminal_intent_wins: PASS
  h3a1_forbidden_classifier_terminal_disposition: PASS
  h3a1_transaction_signal_failure_rollback: PASS
  h3a1_canonical_representation_invariants: PASS
  h3a1_real_postgres_18_6_ubuntu: PASS
  h3a1_dbos_real_engine: NOT_RUN
  h3a1_process_crash_after_terminal_commit: NOT_RUN
  h3a1_work_creation_envelope_snapshot: PASS
  h3a1_projection_index_query_shape: PASS
  h3a1_final_cross_platform_ci: NOT_RUN
  h3a1_cross_platform_regression_ci: PASS
```

## NOT_RUN / deferred properties

- `h3a1_crash_after_terminal_commit`: H3A-1 had no DBOS process-level checkpoint boundary; the current H3A2 process scenario is recorded separately below.
- `h3a1_dbos_real_engine`: H3A-1 deliberately implements engine-neutral WorkQueue semantics; DBOS integration is deferred to H3A-2.
- `h3a1_process_crash_after_terminal_commit`: H3A-1 has no process-level crash harness or DBOS engine checkpoint to exercise this boundary; it remains deferred to H3A-2.

## Historical H3A-2 candidate

```yaml
candidateId: H3A2-IMPLEMENTATION-2026-08-29
branch: dev/h3a2-durable-recovery
lifecycle: READY
freeze: PASS
independentReview: REQUEST_CHANGES
currentUse: historical observation only; affected PASS claims are stale for the correction candidate
```

## Historical correction candidate status

`H3A2-CORRECTION-2026-08-29` was a prior mutable candidate. It is retained as a
historical observation with an external `REQUEST_CHANGES` verdict; its affected
PASS claims do not qualify the current Foundation containment candidate. GitHub
Actions are not enabled or required.

H3A-1 evidence remains historical baseline evidence where it is explicitly
identified; this plan does not create a new H3A-1 implementation claim.

## Historical correction properties

```yaml
h3a1_reconciliation_fairness: PASS
h3a1_generation_preinvoke_admission_fence: PASS
h3a1_canonical_snapshot_detachment: PASS
h3a1_work_lineage_completion: PASS
h3a1_repository_authority_surface: PASS
h3a1_terminal_outcome_coherence: PASS
h3a1_supersession_contract: PASS
h3a1_work_creation_envelope_snapshot: PASS
h3a1_projection_index_query_shape: PASS
```

These properties are required for the current candidate and are supported by
fresh focused or real PostgreSQL qualification as stated in the evidence
source below.

## Historical H3A-2 implementation evidence

```yaml
implementationQualification: REQUIRED
qualificationState: OPEN
evidence:
  h3a2_correction_fair_running_recovery: PASS
  h3a2_correction_authentic_reconciliation_composition: PASS
  h3a2_correction_queue_profile_preflight: PASS
  h3a2_correction_maintenance_failure_atomicity: PASS
  h3a2_correction_provider_shutdown_timeout: PASS
  h3a2_correction_terminal_close: PASS
  h3a2_correction_closed_world_product_privilege: PASS
  h3a2_current_windows_targeted_real_dbos: NOT_RUN
  h3a2_current_ubuntu_real_dbos: NOT_RUN
  h3a2_current_full_requalification: NOT_RUN
  h3a2_repository_verify: NOT_RUN
  real_resource_governor_pressure_snapshot: NOT_RUN
  h3a2_candidate_freeze: NOT_RUN
  h3a2_independent_review: NOT_RUN
  h3a2_final_manual_ci: NOT_RUN
```

These observations belong to the historical correction candidate. They do not
qualify the current candidate after the lifecycle and credential-scope source
mutation in this plan. macOS, source-less, service/headless, and ResourceGovernor
claims remain `NOT_RUN` and are outside this correction.

## Current Foundation containment candidate

```yaml
candidateId: H3A2-FOUNDATION-CONTAINMENT-2026-08-29
plan: project/plans/superseded/repository/knowledge-architecture-agent-harness-convergence-2026-08-30.md
lifecycle: DRAFT
freeze: NOT_RUN
independentReview: NOT_RUN
finalManualVerification: NOT_RUN
foundation_executable_spine_boot_work_stop: PASS
foundation_executable_spine_restart: PASS
h3a2_crash_after_terminal_commit: PASS
h3a2_c1_reversible_quiescence: PASS
h3a2_c2_truthful_retryable_close: PASS
h3a2_c3_bounded_workqueue_quiescence: PASS
h3a2_c4_credential_scoped_preflight: PASS
h3a2_current_windows_real_dbos: PASS
h3a2_current_ubuntu_real_dbos: PASS
h3a2_current_full_requalification: NOT_RUN
h3a2_repository_verify: PASS
hardware_power_loss: NOT_RUN
source_less: NOT_RUN
service_headless: NOT_RUN
githubActions: NOT_ENABLED_OR_REQUIRED
```

The current candidate has fresh focused, full bootstrap-runtime,
Foundation-spine, and existing crash/recovery evidence, including the
terminal-commit restart scenario, and fresh Ubuntu/Linux
real PostgreSQL 18.6 + DBOS qualification on the current host: private-postgres
integration 20/20, persistence 9/9, host-ownership 11/11, bootstrap-runtime
integration 9 files/108 tests, and the durable-work-recovery / Foundation-spine
/ bootstrap-recovery-process real-PostgreSQL files 16/16, using the explicit
`HEPTALOGOS_TEST_PG_BIN` toolchain path. `pnpm verify` is PASS. The candidate
remains mutable and is not frozen.

## H3A-1 observed implementation evidence

The pre-correction focused unit suites passed on 2026-08-26: foundation-contracts (26/26), execution-lineage (30/30), canonical-schema (4/4), runtime-kernel (131/131), signal (6/6), and work-queue (33/33). The pre-correction real Ubuntu PostgreSQL 18.6/Host qualification also passed: 9 integration files and 67/67 tests, using the explicit `HEPTALOGOS_TEST_PG_BIN` toolchain path. These remain historical observations only. The previous corrected candidate focused suites passed on 2026-08-27: foundation-contracts (29/29), execution-lineage (30/30), canonical-schema (4/4), runtime-kernel (142/142), signal (10/10), and work-queue (59/59); its explicit bootstrap-runtime PostgreSQL 18.6/Host integration passed 9 files and 82/82 tests. Those remain historical observations after the current mutation. Fresh final focused suites on the previous candidate passed on 2026-08-27: foundation-contracts (29/29), execution-lineage (30/30), canonical-schema (4/4), runtime-kernel (142/142), signal (10/10), and work-queue (60/60). The previous candidate's explicit bootstrap-runtime PostgreSQL 18.6/Host integration passed 9 files and 83/83 tests, including the real query-shape assertion for both fair-scan states, and its local `pnpm verify` passed. Those observations are historical after the current timeout-budget mutation. The first final-pre-merge CI run passed on Ubuntu and macOS but failed on Windows at `bootstrap-runtime:test` because `does not reclaim a heartbeat-refreshed active owner` exceeded 5 seconds and `blocks no-lock inspection when an OWNER witness proves this process` exceeded 15 seconds. After the timeout-budget adjustment, the corrected test head passed local `pnpm verify` and Draft cross-platform regression CI on Ubuntu, macOS, and Windows; those observations predate this documentation-only synchronization. Final manual CI remains pending for the current Ready head. DBOS and process-crash boundaries remain deferred as recorded above.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Restart/source-less and full WorkItem/Effect integration remain implementation qualification. The current H3A2 terminal-commit restart scenario is `PASS`; the H3A1-scoped property above remains `NOT_RUN` because H3A-1 did not own a DBOS process checkpoint.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。

## Current governance projection

```yaml
h3a1_implementation: PASS
h3a1_merge: PASS
h3a1_governance_recovery: PASS
h3a1_independent_review: NOT_RUN
h3a1_final_manual_ci: NOT_RUN
qualificationState: OPEN
```

This projection records the completed implementation baseline and the
documentation-only recovery decision. It does not promote `NOT_RUN` evidence
to `PASS` and does not create a second milestone Authority.
