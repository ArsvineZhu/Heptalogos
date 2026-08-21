# Q-BOOT-01 资格证据

```yaml
qualificationId: Q-BOOT-01
role: pre-PostgreSQL ownership lock
evidenceStatus: PASS
preImplementationDecisionState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
selectedRoute: "`proper-lockfile` 4.x"
```

## Observed properties

```yaml
evidence:
  native_single_winner: PASS
  proper_lockfile_single_winner: PASS
  normal_atomic_write_parseability: PASS
  kill_owner_stale_reclaim: PASS
  previous_revision_after_corrupt_current: PASS
  unicode_path: PASS
  kill_during_state_write: PASS
  kill_during_atomic_replace: PASS
  power_loss_cross_platform: NOT_RUN
```

## NOT_RUN / deferred properties

- `power_loss_cross_platform`: Power-loss hardware and macOS/Linux crash qualification are outside the current host.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Power-loss, macOS/Linux and source-less bootstrap behavior remain implementation qualification.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。
