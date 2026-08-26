# Q-ASYNC-01 资格证据

```yaml
qualificationId: Q-ASYNC-01
role: WorkQueue scheduling mechanics
evidenceStatus: PASS
preImplementationDecisionState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
selectedRoute: "DBOS Queue"
candidateFreeze: PASS
independentReview: NOT_RUN
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

The corrected candidate is now qualified and frozen on a clean branch. It has
no Independent Review verdict yet. The fresh run qualified Signal connection
ownership, admitted-handler settlement, payload dependency, future-`notBefore`
projection, dispatch admission, failure disposition, terminal-intent CAS,
transaction-time Signal rollback, and canonical representation invariants.

## H3A-1 observed implementation evidence

The pre-correction focused unit suites passed on 2026-08-26: foundation-contracts (26/26), execution-lineage (30/30), canonical-schema (4/4), runtime-kernel (131/131), signal (6/6), and work-queue (33/33). The pre-correction real Ubuntu PostgreSQL 18.6/Host qualification also passed: 9 integration files and 67/67 tests, using the explicit `HEPTALOGOS_TEST_PG_BIN` toolchain path. These remain historical observations only. The fresh corrected focused suites passed on 2026-08-27: foundation-contracts (26/26), execution-lineage (30/30), canonical-schema (4/4), runtime-kernel (135/135), signal (10/10), and work-queue (44/44). The complete bootstrap-runtime PostgreSQL 18.6/Host integration passed 9 files and 73/73 tests with the explicit toolchain path. `pnpm verify` passed all repository gates; DBOS and process-crash boundaries remain deferred as recorded above.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Crash-after-terminal-commit, restart/source-less and full WorkItem/Effect integration remain implementation qualification.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。
