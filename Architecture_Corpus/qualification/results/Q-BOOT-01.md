# Q-BOOT-01 资格证据

```yaml
qualificationId: Q-BOOT-01
role: pre-PostgreSQL ownership lock
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

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。
