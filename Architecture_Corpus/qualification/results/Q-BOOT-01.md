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
  historical_proper_lockfile_4_1_2_delayed_reclaimer: FAIL
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

The historical `proper-lockfile@4.1.2` route was intentionally exercised before
selection. The real two-process interleaving parked reclaimer A after stale
`stat`, let reclaimer B remove/recreate the lock, then resumed A; both processes
reported acquisition. This is the reproducible #121 hard blocker. The selected
candidate's atomic rename claim returned `ELOCKED` for A and preserved B's lock
under the same interleaving.

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
m5b_real_process_k1_k5: PASS
m5b_linux_real_postgres_recovery: PASS
m5b_windows_real_postgres_recovery: NOT_RUN
m5b_macos_real_postgres_recovery: NOT_RUN
m5b_source_less_recovery: NOT_RUN
m5b_service_account_acl: NOT_RUN
m5b_hardware_power_loss: NOT_RUN
m5b_independent_review: NOT_RUN
m5b_final_cross_platform_ci: NOT_RUN
m5b_squash_merge: NOT_RUN
m5b: ACTIVE
h1: OPEN
```

Evidence was produced with Node 24.19.0, pnpm 11.22.0, the
`@bybrave/proper-lockfile2` route, `pidusage@4.0.1`, and an extracted Ubuntu
26.04 PostgreSQL 18.6 toolchain. The recovery process qualification used real
child termination and IPC; it did not use a mock process death.
