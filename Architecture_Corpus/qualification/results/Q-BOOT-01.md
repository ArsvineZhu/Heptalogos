# Q-BOOT-01 资格证据

```yaml
qualificationId: Q-BOOT-01
role: pre-PostgreSQL ownership lock and abandoned-owner process identity
evidenceStatus: PASS
preImplementationDecisionState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
selectedRoute: "`@bybrave/proper-lockfile2` 5.0.0"
```

## Observed properties

```yaml
evidence:
  historical_proper_lockfile_4_1_2_delayed_reclaimer: NOT_RUN
  proper_lockfile2_single_winner: PASS
  normal_atomic_write_parseability: PASS
  proper_lockfile2_delayed_reclaimer: PASS
  proper_lockfile2_n_way_reclaim: PASS
  active_heartbeat_not_reclaimed: PASS
  killed_owner_reclaimed: PASS
  recovery_reclaim_notification: PASS
  compromised_lease_fenced: PASS
  unicode_space_path: PASS
  node24_esm_ts7_boundary: PASS
  process_identity_self: PASS
  process_identity_live_child: PASS
  process_identity_dead_child: PASS
  process_identity_pid_reused: PASS
  process_identity_unknown_kill_probe: PASS
  process_identity_unknown_pidusage: PASS
  previous_revision_after_corrupt_current: PASS
  kill_during_state_write: PASS
  kill_during_atomic_replace: PASS
  power_loss_cross_platform: NOT_RUN
```

## NOT_RUN / deferred properties

- `power_loss_cross_platform`: Power-loss hardware and macOS/Linux crash qualification are outside the current host.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Power-loss, macOS/Linux and source-less bootstrap behavior remain implementation qualification.

The historical `proper-lockfile@4.1.2` route is retained as role-reopening
context from upstream issue/source analysis plus a previously observed
experiment. No immutable committed run log or artifact is available for that
experiment, so the repository-executable current qualification is limited to
the selected `@bybrave/proper-lockfile2` provider.

Process-generation evidence uses a real child fixture and `pidusage@4.0.1`:
`SAME_PROCESS` is returned for self/live child, `PROCESS_DEAD` only for a
definitely missing PID, a start-time mismatch beyond 5 seconds is
`PID_REUSED`, and both an ambiguous `kill(pid, 0)` error and a pidusage failure
are `UNKNOWN`.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。

## Foundation M5B bounded recovery qualification (2026-08-22)

```yaml
m5b_behavior_candidate_sha: c4c1be43f412c868a84a776461b479d3b677ea18
m5b_read_only_recovery_inspection: PASS
m5b_same_lock_reclaim: PASS
m5b_local_installation_owner_binding: PASS
m5b_live_owner_no_steal: PASS
m5b_unknown_process_blocks: PASS
m5b_pid_reuse_fail_closed: PASS
m5b_double_reclaimer_exclusion: PASS
m5b_real_process_k1_k3: PASS
m5b_real_process_k4_actual_maintenance_recovery: NOT_RUN
m5b_real_process_k5_recovery_restartability: NOT_RUN
m5b_linux_real_pg_restart_success_subset: PASS
m5b_linux_real_pg_live_host_block: PASS
m5b_linux_real_pg_corrupt_journal_block: PASS
m5b_linux_real_postgres_full_matrix: NOT_RUN
m5b_windows_real_postgres_recovery: NOT_RUN
m5b_macos_real_postgres_recovery: NOT_RUN
m5b_source_less_recovery: NOT_RUN
m5b_service_account_acl: NOT_RUN
m5b_hardware_power_loss: NOT_RUN
m5b_independent_review: FAIL
m5b_final_cross_platform_ci: NOT_RUN
m5b_squash_merge: NOT_RUN
m5b: ACTIVE
h1: OPEN
```

The rejected review was against exact HEAD
`9e450f836466d32fb1f3d9027618fac236798eb9` and returned `REQUEST_CHANGES`.
The surviving evidence was produced with Node 24.19.0, pnpm 11.22.0, the
`@bybrave/proper-lockfile2` route, `pidusage@4.0.1`, and an extracted Ubuntu
26.04 PostgreSQL 18.6 toolchain. K1-K3 used real child termination and IPC;
the required real maintenance/recovery K4-K5 and complete PG-1..PG-9 matrix
were not yet executed at this rejected candidate.

## Foundation M5B first corrective candidate — superseded (2026-08-23)

Behavior candidate `e7e46e8e1d58f15e254b9644f5b315cd34090360` had the following
Linux evidence before the second corrective review. The exact review HEAD was
`5e8f1aa475730aef982622d05cd488767ac0c08a`; its review returned
`REQUEST_CHANGES`. This block is historical evidence and is not the current
qualification truth.

```yaml
behavior_candidate_sha: e7e46e8e1d58f15e254b9644f5b315cd34090360
rejected_review_head_sha: 5e8f1aa475730aef982622d05cd488767ac0c08a
review_outcome: REQUEST_CHANGES
runtime: "Node 24.19.0 / pnpm 11.22.0"
postgres_version: PostgreSQL 18.6
m5b_read_only_recovery_inspection: PASS
m5b_same_lock_reclaim: PASS
m5b_local_installation_owner_binding: PASS
m5b_live_owner_no_steal: PASS
m5b_unknown_process_blocks: PASS
m5b_pid_reuse_fail_closed: PASS
m5b_double_reclaimer_exclusion: PASS
m5b_real_process_k1_k3: PASS (3/3)
m5b_real_process_k4_actual_maintenance_recovery: PASS (1/1)
m5b_real_process_k5_recovery_restartability: PASS (1/1)
m5b_linux_real_pg_restart_success_subset: PASS
m5b_linux_real_pg_live_host_block: PASS
m5b_linux_real_pg_corrupt_journal_block: PASS
m5b_linux_real_postgres_full_matrix: PASS (PG-1..PG-9 matrix plus 5B/6A/6B, 11/11)
m5b_private_postgres_integration: PASS (20/20)
m5b_host_ownership_integration: PASS (8/8)
m5b_bootstrap_runtime_integration: PASS (28/28)
m5b_windows_real_postgres: NOT_RUN
m5b_macos_real_postgres: NOT_RUN
m5b_source_less_recovery: NOT_RUN
m5b_service_account_acl: NOT_RUN
m5b_hardware_power_loss: NOT_RUN
m5b_independent_review: FAIL
m5b_final_cross_platform_ci: NOT_RUN
m5b_squash_merge: NOT_RUN
m5b: ACTIVE
h1: OPEN
```

The evidence used an extracted Ubuntu 26.04 PostgreSQL 18.6 toolchain with all
five required binaries reporting 18.6. On the exact candidate, the K1-K3
child-process target passed 3/3, the real K4/K5 child-process target passed
2/2, and `bootstrap-runtime:test:integration` passed 28/28; the dedicated
PG-1..PG-9 matrix contributed 11/11 live PostgreSQL tests. The private-postgres
and Host ownership real integration targets passed 20/20 and 8/8 respectively.
`pnpm verify` also passed on this exact candidate.

The earlier review at `9e450f836466d32fb1f3d9027618fac236798eb9` also returned
`REQUEST_CHANGES`. The current second corrective cycle must rerun the invalidated
K4/K5 and PG-1/PG-2/full-matrix evidence before a new candidate can be submitted.

## Foundation M5B second corrective review blockers (2026-08-23)

```yaml
m5b_behavior_candidate_sha: e7e46e8e1d58f15e254b9644f5b315cd34090360
m5b_rejected_review_head_sha: 5e8f1aa475730aef982622d05cd488767ac0c08a
m5b_review_outcome: REQUEST_CHANGES
m5b_read_only_recovery_inspection: PASS
m5b_same_lock_reclaim: PASS
m5b_local_installation_owner_binding: PASS
m5b_live_owner_no_steal: PASS
m5b_unknown_process_blocks: PASS
m5b_pid_reuse_fail_closed: PASS
m5b_double_reclaimer_exclusion: PASS
m5b_real_process_k1_k3: PASS
m5b_real_process_k4_actual_maintenance_recovery: NOT_RUN
m5b_real_process_k5_recovery_restartability: NOT_RUN
m5b_linux_real_pg_restart_success_subset: PASS
m5b_linux_real_pg_live_host_block: PASS
m5b_linux_real_pg_corrupt_journal_block: PASS
m5b_pg1_pre_postgres_bootstrap_recovery: NOT_RUN
m5b_pg2_ready_before_handoff_recovery: NOT_RUN
m5b_linux_real_postgres_full_matrix: NOT_RUN
m5b_windows_real_postgres: NOT_RUN
m5b_macos_real_postgres: NOT_RUN
m5b_source_less_recovery: NOT_RUN
m5b_service_account_acl: NOT_RUN
m5b_hardware_power_loss: NOT_RUN
m5b_independent_review: FAIL
m5b_final_cross_platform_ci: NOT_RUN
m5b_squash_merge: NOT_RUN
m5b: ACTIVE
h1: OPEN
```

K4/K5 were not deterministic at the rejected exact HEAD because the fixture
did not unambiguously arm the requested child boundary. The old PG-1/PG-2
scenarios were post-handoff maintenance cases rather than pre-Host bootstrap
recovery, so the full matrix PASS and those two claims are withdrawn pending
the second corrective runs. Windows/macOS real PostgreSQL, source-less
recovery, service-account ACL, hardware power-loss, final CI, and merge remain
`NOT_RUN` or unauthorized.

## Foundation M5B second corrective qualification (2026-08-23)

The second corrective behavior candidate is
`55c58ed83d5e7b7ce964b659e6250b6f6580634d`. Production behavior was completed
before this candidate was frozen; the final qualification tests and the
dedicated process fixture are included in the candidate. The current candidate
has not yet received independent review.

```yaml
behavior_candidate_sha: 55c58ed83d5e7b7ce964b659e6250b6f6580634d
runtime: "Node 24.19.0 / pnpm 11.22.0"
postgres_version: PostgreSQL 18.6
m5b_legacy_m5a_journal_v1_compatibility: PASS
m5b_same_lease_prehost_bootstrap_continuation: PASS
m5b_read_only_recovery_inspection: PASS
m5b_same_lock_reclaim: PASS
m5b_local_installation_owner_binding: PASS
m5b_live_owner_no_steal: PASS
m5b_unknown_process_blocks: PASS
m5b_pid_reuse_fail_closed: PASS
m5b_double_reclaimer_exclusion: PASS
m5b_real_process_k1_k3: PASS (3/3)
m5b_real_process_k4_actual_maintenance_recovery: PASS (1/1)
m5b_real_process_k5_recovery_restartability: PASS (1/1)
m5b_pg1_pre_postgres_bootstrap_recovery: PASS (1/1)
m5b_pg2_ready_before_handoff_recovery: PASS (1/1)
m5b_linux_real_postgres_full_matrix: PASS (11/11; PG-1..PG-9 plus PG-5B/PG-6A/PG-6B)
m5b_private_postgres_integration: PASS (20/20)
m5b_host_ownership_integration: PASS (8/8)
m5b_bootstrap_runtime_integration: PASS (29/29)
m5b_pnpm_verify: PASS
m5b_windows_real_postgres: NOT_RUN
m5b_macos_real_postgres: NOT_RUN
m5b_source_less_recovery: NOT_RUN
m5b_service_account_acl: NOT_RUN
m5b_hardware_power_loss: NOT_RUN
m5b_independent_review: NOT_RUN
m5b_final_cross_platform_ci: NOT_RUN
m5b_squash_merge: NOT_RUN
m5b: ACTIVE
h1: OPEN
```

The exact real-process and real-PostgreSQL runs used the extracted Ubuntu 26.04
PostgreSQL 18.6 toolchain; `postgres`, `initdb`, `pg_ctl`, `pg_controldata`, and
`pg_isready` each reported 18.6. K4/K5 used child durable-stage IPC followed by
an independent on-disk journal read before SIGKILL. PG-1 used a dedicated child
that died before private PostgreSQL preparation; PG-2 used a dedicated child
that died after PostgreSQL READY and before Host handoff. PG-2 preserved the
cluster identifier, postmaster PID, and `pg_postmaster_start_time`; both
scenarios executed through bounded `RECOVER` bootstrap-continuation routing.

The rejected review outcomes remain historical metadata:
`REQUEST_CHANGES @ 5e8f1aa475730aef982622d05cd488767ac0c08a` and the earlier
`REQUEST_CHANGES @ 9e450f836466d32fb1f3d9027618fac236798eb9`. They do not change
the current candidate's machine-readable independent-review status of
`NOT_RUN`. Windows/macOS real PostgreSQL, source-less recovery, service-account
ACL, hardware power-loss, final CI, merge, and H1 closure remain outstanding.

## Foundation M5B third corrective qualification (2026-08-23)

The `445a77db3041644faccd85c00c826e8d26af3ea8` review returned
`REQUEST_CHANGES`; its findings are historical. The new behavior candidate is
`ce8ecbd2f54b6da39542845b1c23fbb959672c0a`, followed only by the
qualification-only commit `a41dad0226310889f61515ba16ce910c1dbb0e53`.

```yaml
behavior_candidate_sha: ce8ecbd2f54b6da39542845b1c23fbb959672c0a
qualification_candidate_sha: a41dad0226310889f61515ba16ce910c1dbb0e53
runtime: "Node 24.19.0 / pnpm 11.22.0"
postgres_version: PostgreSQL 18.6
m5b_read_only_recovery_inspection: PASS (13/13; instance-root snapshot unchanged)
m5b_legacy_m5a_journal_v1_compatibility: PASS (live PG-6A legacy target)
m5b_same_lease_prehost_bootstrap_continuation: PASS
m5b_real_process_k1_k3: PASS (3/3)
m5b_real_process_k4_actual_maintenance_recovery: PASS (1/1)
m5b_real_process_k5_recovery_restartability: PASS (1/1)
m5b_pg1_pre_postgres_bootstrap_recovery: PASS (1/1)
m5b_pg2_ready_before_handoff_recovery: PASS (1/1)
m5b_pg6a_legacy_m5a_live_shape: PASS (1/1; no target.hostBootId)
m5b_linux_real_postgres_full_matrix: PASS (11/11; PG-1..PG-9 plus PG-5B/PG-6A/PG-6B)
m5b_private_postgres_integration: PASS (20/20)
m5b_host_ownership_integration: PASS (8/8)
m5b_bootstrap_runtime_integration: PASS (29/29)
m5b_bootstrap_runtime_unit: PASS (155 passed, 1 skipped)
m5b_bootstrap_state_unit: PASS (113 passed, 2 skipped)
m5b_pnpm_verify: PASS
m5b_windows_real_postgres: NOT_RUN
m5b_macos_real_postgres: NOT_RUN
m5b_source_less_recovery: NOT_RUN
m5b_service_account_acl: NOT_RUN
m5b_hardware_power_loss: NOT_RUN
m5b_independent_review: NOT_RUN
m5b_final_cross_platform_ci: NOT_RUN
m5b_squash_merge: NOT_RUN
m5b: ACTIVE
h1: OPEN
```

`INSPECT` now only reads locator, lock metadata, witnesses, process identity,
BootstrapState, and MaintenanceJournal; the before/after snapshot proves it
does not create or alter instance-root files. PG-6A uses the literal merged-M5A
late-stage target with token and revision but no `target.hostBootId`, while the
live fence uses the operation `body.bootId`; recovery produces fresh C and the
next durable revision contains an explicit `hostBootId`.

The new candidate awaits independent exact-HEAD review. Final CI, merge, the
remaining cross-platform/source-less/ACL/power-loss qualifications, and H1
closure remain open.

## Foundation M5B post-merge reconciliation (2026-08-23)

```yaml
m5b_behavior_candidate_sha: ce8ecbd2f54b6da39542845b1c23fbb959672c0a
m5b_qualification_candidate_sha: a41dad0226310889f61515ba16ce910c1dbb0e53
m5b_exact_reviewed_head_sha: 9ca373084252e61c31c3df7c02ad355c31e75c49
m5b_independent_review: PASS
m5b_final_ci_run: 32592990382
m5b_final_ci_ubuntu: PASS
m5b_final_ci_macos: PASS
m5b_final_ci_windows: PASS
m5b_squash_merge_sha: f16071cbff3e30cd4f839716130270770e99075a
m5b: CLOSED
h1: CLOSED
```

The final manual workflow checked out and verified the exact reviewed source
SHA on Ubuntu, macOS, and Windows. The earlier macOS EPIPE was an asynchronous
child-IPC cleanup race in the test helper and was corrected before this
successful run. Windows/macOS real PostgreSQL, source-less recovery,
service-account ACL, and hardware power-loss remain `NOT_RUN`; repository CI
does not upgrade those product/platform claims.
