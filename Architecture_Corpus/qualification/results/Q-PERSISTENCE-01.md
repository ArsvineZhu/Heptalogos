# Q-PERSISTENCE-01 资格证据

本记录保留 H2A-1 Host-scoped Persistence 的历史/current ledger 语义，并以独立
addendum 记录 H2A-2 canonical schema continuity 证据。H2A-1 的 exact
review/CI/merge tuple 不被 H2A-2 改写；两组证据的 `PASS` 只表示已执行的
evidence gate，不等同于 qualification closure。

## H2A-1 historical/current ledger

H2A-1 已在历史候选上完成外部独立 review、exact-pair final CI 和 squash merge：

```yaml
reviewed_pair:
  base: 54688d2bb0da2b8516a84634459495956bd96b8c
  head: e09f94d2a268480fea27b779c2b160fb3c5c68b5
independent_review: PASS
final_ci_run: 32697218296
squash_merge: 900a7b876ed4be7506beacead9f3285d1f4a5577
qualification_state: PARTIAL
```

H2A-1 的 Windows PostgreSQL 18.6、Host ownership、bootstrap-runtime、
least-privilege runtime role、事务生命周期和 leakage gates 保持既有
`PASS`；Linux/macOS PostgreSQL、source-less persistence、installed
service/headless runtime 仍为 `NOT_RUN`。机器可读的完整历史 ledger 位于
`qualification-status.json`，本节不改写其历史字段。

## H2A-2 current addendum (2026-08-24)

```yaml
qualificationId: Q-PERSISTENCE-01
testedProperty: "H2A-2 canonical BootstrapState V1 continuity, migration authority, Kysely baseline, and fail-closed materialization"
evidenceStatus: PASS
qualificationState: PARTIAL
implementationQualification: REQUIRED
behavior_candidate_sha: 00c03f7e635724636dc9fca56c6fc856e6b04603
reviewed_base_sha: b306975bba3592a0d8c2e2e6d1649f2523af27bc
reviewed_head_sha: 2b492ef69131cc9792babb094ec2be33b13a9c69
local_implementation_closure: PASS
repository_verification: PASS
canonical_schema_unit: PASS (3 passed)
bootstrap_state_unit: PASS (113 passed, 3 skipped)
bootstrap_runtime_unit: PASS (213 passed, 2 skipped)
host_ownership_unit: PASS (81 passed)
persistence_unit: PASS (13 passed)
ts7_typecheck: PASS
ts6_compatibility_lane: PASS
static_dependency_boundary: PASS
real_postgres_version: PostgreSQL 18.6
real_postgres_platform: Windows
real_postgres_c1_to_c9: PASS (9 scenarios; 8 Vitest cases because C4/C5 are parameterized)
real_postgres_c1_clean_materialization: PASS
real_postgres_c2_restart_continuity: PASS
real_postgres_c3_interrupted_materialization_retry: PASS
real_postgres_c4_epoch_mismatch: PASS
real_postgres_c5_instance_mismatch: PASS
real_postgres_c6_role_separation: PASS
real_postgres_c7_runtime_read_only_acl: PASS
real_postgres_c8_migration_history_corruption: PASS
obsolete_v1_without_epoch_c9: PASS
persistence_regression_integration: PASS (8/8)
host_ownership_regression_integration: PASS (10/10)
bootstrap_runtime_regression_integration: PASS (38/38)
real_postgres_linux: NOT_RUN
real_postgres_macos: NOT_RUN
source_less: NOT_RUN
service_headless: NOT_RUN
independent_review: PASS
final_ci_run: 32731811379
final_cross_platform_ci: PASS (Ubuntu/macOS/Windows)
squash_merge_sha: 2c8a68c7e76884d75fb3314ff18b1806a0625b3d
squash_merge: PASS
```

The previous reviewed pair
`b306975bba3592a0d8c2e2e6d1649f2523af27bc` →
`adc22feaf91a9307838ebbfa5a89840b04bc86f1` returned
`Independent Review = REQUEST_CHANGES`. At that stage, this corrected behavior candidate
closes the reported Host reacquisition, credential provenance, Corpus status,
canonical snapshot, and joint-authority signal findings. A new independent
review for the corrected exact pair was still `NOT_RUN`; final CI and merge
were not yet authorized.

The subsequent reviewed pair
`b306975bba3592a0d8c2e2e6d1649f2523af27bc` →
`20082b28f31408beb7ed7aa573417bffb4bd2912` also returned
`Independent Review = REQUEST_CHANGES`, identifying the post-bootstrap-release
Host liveness proof and recovery admission-epoch projection. Those findings
were addressed by the current behavior candidate above; the resulting pair
was then independently reviewed and closed by the final tuple below.

The real-PG qualification used the extracted EDB PostgreSQL 18.6 Windows
toolchain at:

```text
C:\Users\Arsvine\AppData\Local\Temp\heptalogos-pg18.6-correction-20260823\extracted\pgsql\bin
```

The implementation keeps the current BootstrapState as canonical V1 with a
required `ContinuityEpochId`, uses one static
`0001_foundation_continuity` Kysely migration, keeps `pg`/Kysely mechanics
inside `@heptalogos/canonical-schema`, and rejects normal continuity identity
mismatches without update/repair. C1-C8 were executed against real PostgreSQL;
C9 rejects obsolete V1 bytes with `bootstrap.state.invalid_schema`.

Linux/macOS, source-less, and service/headless claims remain `NOT_RUN` and are
not upgraded by repository CI. The final exact closure tuple is recorded above:
independent review `PASS`, final CI run `32731811379` `PASS` on all three
platforms, and squash merge `2c8a68c7e76884d75fb3314ff18b1806a0625b3d` `PASS`.
