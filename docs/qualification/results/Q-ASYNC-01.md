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
  lifecycle: DRAFT
  branch: dev/h3a2-durable-recovery
  freeze: NOT_RUN
  independentReview: NOT_RUN
  finalManualVerification: NOT_RUN
h3a1Candidate:
  merge: PASS
  governanceRecovery: PASS
h3a2ReviewDisposition: REQUEST_CHANGES
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
  crash_after_terminal_commit: NOT_RUN
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

- `crash_after_terminal_commit`: No process-level crash was injected after the canonical terminal commit; only a real DBOS retry attempt was exercised.
- `h3a1_dbos_real_engine`: H3A-1 deliberately implements engine-neutral WorkQueue semantics; DBOS integration is deferred to H3A-2.
- `h3a1_process_crash_after_terminal_commit`: H3A-1 has no process-level crash harness or DBOS engine checkpoint to exercise this boundary; it remains deferred to H3A-2.

## Current candidate correction status

The prior H3A-1 run genuinely observed the listed properties as `PASS`,
including 9 integration files and 67/67 real PostgreSQL/Host tests. That
historical observation is retained, but it is not current-candidate evidence:
the correction amendment invalidates all pre-correction H3A-1 property PASS
claims until the affected and expanded qualification cases are rerun.

The previous corrected candidate was qualified and frozen on a clean branch;
that observation remains historical. Its final cross-platform CI then failed
on Windows because two bootstrap-runtime tests exceeded their test timeouts;
Ubuntu and macOS passed. The current implementation baseline includes the
bounded cross-platform test-budget adjustment and was merged into `master`.
The separate H3A-1 governance recovery record accepts that existing baseline as
current without changing the qualification record's evidence boundaries.
Independent Review and final manual CI remain `NOT_RUN`; neither is inferred
from the merge fact. Q-ASYNC-01 remains `OPEN` for its deferred implementation
and product qualification properties.

## Current correction properties

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

These two properties are required for the current candidate and are supported
by fresh focused and real PostgreSQL qualification.

## H3A-2 current implementation evidence

```yaml
implementationQualification: REQUIRED
qualificationState: OPEN
evidence:
  h3a2_exact_dbos_4_27_6: PASS
  h3a2_workitem_product_authority: PASS
  h3a2_dedicated_engine_principal: PASS
  h3a2_engine_zero_product_table_privilege: PASS
  h3a2_dbos_schema_migration_authority: PASS
  h3a2_normal_runtime_no_ddl: PASS
  h3a2_static_dispatcher_real_dbos: PASS
  h3a2_same_revision_engine_idempotency: PASS
  h3a2_delayed_not_before: PASS
  h3a2_retry_new_revision: PASS
  h3a2_queue_profile_projection: PASS
  h3a2_partition_profile_projection: PASS
  h3a2_stable_instance_executor_identity: PASS
  h3a2_application_version_isolation: PASS
  h3a2_lost_predispatch_process_recovery: PASS
  h3a2_running_same_attempt_recovery: PASS
  h3a2_crash_after_terminal_commit_no_duplicate_handler: PASS
  h3a2_host_loss_fence: PASS
  h3a2_host_shutdown_settlement: PASS
  h3a2_same_process_quiesce_resume: PASS
  h3a2_recovery_budget_fail_closed: PASS
  h3a2_admission_and_queue_mechanics: PASS
  h3_windows_real_dbos: PASS
  h3a2_ubuntu_postgres_18_6_real_dbos: PASS
  real_resource_governor_pressure_snapshot: NOT_RUN
  h3a2_candidate_freeze: NOT_RUN
  h3a2_independent_review: NOT_RUN
  h3a2_final_manual_ci: NOT_RUN
```

The current implementation evidence was produced on Windows and Ubuntu/Linux
with explicit PostgreSQL 18.6 toolchains. On Windows, the real DBOS
qualification passed the Bootstrap integration target (9 files, 106/106 tests),
the process recovery target (8/8 tests), the Host lifecycle Q1-Q5 target (5/5
tests), and the Task 12 admission/queue target (6/6 tests). On Ubuntu 26.04 LTS
x86_64 with Node 24.20.0, pnpm 11.24.0, PostgreSQL 18.6, and DBOS 4.27.6, the
Bootstrap integration target passed (9 files, 106/106 tests), the process
recovery target passed (8/8 tests), and Host ownership integration passed
(11/11 tests). The Bootstrap target includes the Host lifecycle and Task 12
cases. These results prove only the executed Windows and Ubuntu environments;
they do not promote macOS, source-less, or service/headless properties.
`real_resource_governor_pressure_snapshot` is intentionally `NOT_RUN` because
ResourceGovernor is H8-owned and is not part of H3A-2. The repository-wide
`pnpm verify` gate also passed locally after the qualification and
documentation updates.

Candidate freeze, Independent Review, and final manual CI remain required
before H3A-2 closure.

## H3A-1 observed implementation evidence

The pre-correction focused unit suites passed on 2026-08-26: foundation-contracts (26/26), execution-lineage (30/30), canonical-schema (4/4), runtime-kernel (131/131), signal (6/6), and work-queue (33/33). The pre-correction real Ubuntu PostgreSQL 18.6/Host qualification also passed: 9 integration files and 67/67 tests, using the explicit `HEPTALOGOS_TEST_PG_BIN` toolchain path. These remain historical observations only. The previous corrected candidate focused suites passed on 2026-08-27: foundation-contracts (29/29), execution-lineage (30/30), canonical-schema (4/4), runtime-kernel (142/142), signal (10/10), and work-queue (59/59); its explicit bootstrap-runtime PostgreSQL 18.6/Host integration passed 9 files and 82/82 tests. Those remain historical observations after the current mutation. Fresh final focused suites on the previous candidate passed on 2026-08-27: foundation-contracts (29/29), execution-lineage (30/30), canonical-schema (4/4), runtime-kernel (142/142), signal (10/10), and work-queue (60/60). The previous candidate's explicit bootstrap-runtime PostgreSQL 18.6/Host integration passed 9 files and 83/83 tests, including the real query-shape assertion for both fair-scan states, and its local `pnpm verify` passed. Those observations are historical after the current timeout-budget mutation. The first final-pre-merge CI run passed on Ubuntu and macOS but failed on Windows at `bootstrap-runtime:test` because `does not reclaim a heartbeat-refreshed active owner` exceeded 5 seconds and `blocks no-lock inspection when an OWNER witness proves this process` exceeded 15 seconds. After the timeout-budget adjustment, the corrected test head passed local `pnpm verify` and Draft cross-platform regression CI on Ubuntu, macOS, and Windows; those observations predate this documentation-only synchronization. Final manual CI remains pending for the current Ready head. DBOS and process-crash boundaries remain deferred as recorded above.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Crash-after-terminal-commit, restart/source-less and full WorkItem/Effect integration remain implementation qualification.

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
