# Q-PERSISTENCE-01 资格证据

## H2A-3 current addendum (2026-08-25)

```yaml
qualificationId: Q-PERSISTENCE-01
testedProperty: "H2A-3 canonical ExecutionContext, retained Activity/Evidence atomicity, and Bootstrap-to-Host lineage handoff"
evidenceStatus: PASS
qualificationState: PARTIAL
implementationQualification: REQUIRED
behavior_candidate_sha: 2482b6e380cbad37407e99b0ce7c7560ccc709c6
reviewed_base_sha: 446d0f6bce449f177c66fb569341020757b44c9b
reviewed_head_sha: 2482b6e380cbad37407e99b0ce7c7560ccc709c6
current_execution_context_required_for_mutation: PASS
stale_execution_origin_unit: PASS
stale_execution_origin_real_postgres: PASS
stale_database_host_fence_real_postgres: PASS
required_lineage_evidence_atomicity: PASS
read_context_cannot_obtain_mutation_repository: PASS
foundation_contracts_unit: PASS (19/19)
schema_runtime_unit: PASS (2/2)
time_service_unit: PASS (4/4)
execution_lineage_unit: PASS (23/23)
persistence_unit: PASS (19/19)
canonical_schema_unit: PASS (3/3)
evidence_unit: PASS (4/4)
bootstrap_state_unit: PASS (113 passed, 3 skipped)
host_ownership_unit: PASS (81 passed)
bootstrap_runtime_unit: PASS (213 passed, 2 skipped)
required_atomicity_real_postgres: PASS (A1-A5, 5/5)
bootstrap_lineage_handoff_real_postgres: PASS (B1-B6, 9/9 test cases)
persistence_regression_integration: PASS (9/9; P9 proves both stale-origin admission and stale database Host fence)
host_ownership_regression_integration: PASS (10/10)
bootstrap_runtime_regression_integration: PASS (47/47)
real_postgres_version: PostgreSQL 18.6
real_postgres_platform: Windows
real_postgres_linux: NOT_RUN
real_postgres_macos: NOT_RUN
source_less_persistence: NOT_RUN
service_headless_persistence: NOT_RUN
check_dependencies: PASS
check_boundaries: PASS
pnpm_verify: PASS
independent_review: PASS
final_cross_platform_ci: NOT_RUN
squash_merge: PASS (PR #19 merge `7b51468c2c41895bde7091868d688d98dfc6c957`)
```

The real PostgreSQL evidence used the extracted EDB PostgreSQL 18.6 toolchain
at `C:\Users\Arsvine\AppData\Local\Temp\heptalogos-pg18.6-correction-20260823\extracted\pgsql\bin`.
The corrected candidate received out-of-band independent review `PASS` and was
squash-merged as PR #19 at `7b51468c2c41895bde7091868d688d98dfc6c957`. Final
cross-platform CI remains `NOT_RUN` by explicit operator direction pending the H2-wide run. Linux/macOS,
source-less, and service/headless product qualification remain `NOT_RUN`.

本记录保留 H2A-1 Host-scoped Persistence 的历史/current ledger 语义，并以独立
addendum 记录 H2A-2 canonical schema continuity 证据。H2A-1 的 exact
review/CI/merge tuple 不被 H2A-2 改写；两组证据的 `PASS` 只表示已执行的
evidence gate，不等同于 qualification closure。

## H2B corrective-cycle persistence addendum (2026-08-25)

```yaml
qualificationId: Q-PERSISTENCE-01
testedProperty: "H2B canonical runtime-origin constraints and narrow Activity completion function validation"
evidenceStatus: NOT_RUN
qualificationState: PARTIAL
implementationQualification: REQUIRED
h2b_persistence_relevant_behavior_sha: NOT_FROZEN
canonical_runtime_origin_constraints: NOT_RUN
completion_function_fail_closed_input_validation: NOT_RUN
real_postgres_platform: NOT_RUN
repository_schema_compile: PASS
pnpm_verify: PASS (full repository verify; one unrelated flaky lock test retried successfully)
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

This addendum deliberately uses `h2b_persistence_relevant_behavior_sha`, not
`behavior_candidate_sha`: the corrective working tree has not been frozen into
an H2B candidate. The current PRE_PRODUCTION baseline was edited in place as
required; no compatibility migration was added. Real PostgreSQL constraint and
SECURITY DEFINER execution evidence remains `NOT_RUN` because the local
qualification toolchain was unavailable.

## H2B second corrective-cycle persistence status (2026-08-25)

The B1-B4/I1/I2 runtime-kernel corrections did not alter the canonical schema
or completion function in this cycle. The persistence-relevant behavior still
has no frozen candidate SHA, and real PostgreSQL execution of the runtime-origin
constraints and completion validation remains `NOT_RUN`. The current full
repository `pnpm verify` is `PASS`; this does not upgrade the real PostgreSQL
claim, independent review, final cross-platform CI, or squash merge.

## H2B third corrective-cycle persistence status (2026-08-25)

The current RC-1 to RC-7 runtime ownership corrections do not change the
canonical schema or completion function. The prior local verification result
is historical for `4cad58d...`; the current full `pnpm verify` is `PASS`.
Runtime-origin constraint, completion-function,
Independent Review, final CI, and merge evidence remain `NOT_RUN`.

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
service/headless runtime 仍为 `NOT_RUN`。Current property navigation is kept
in the results README; this historical section is not rewritten to change its
recorded fields.

## H2B fourth corrective-cycle persistence status (2026-08-25)

The current Host-facade, Supervisor mutation-domain, generation-bound failure,
and authoritative Readiness corrections do not change the canonical schema or
completion function. The persistence-relevant candidate boundary is frozen on
the live PR #22 head authority with review base
`19ebef1c62a737ad077414a6817ffdf8ac3ad2a4`; no self-referential head SHA is
stored in this record.

```yaml
h2b_persistence_relevant_behavior_sha: FROZEN_ON_PR_HEAD
canonical_runtime_origin_constraints: NOT_RUN
completion_function_fail_closed_input_validation: NOT_RUN
real_postgres_platform: NOT_RUN
pnpm_verify: PASS (current full repository verify)
independent_review: NOT_RUN (new exact pair)
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

## H2B fifth corrective-cycle persistence status (2026-08-25)

The current corrective tree was reviewed as
`19ebef1c62a737ad077414a6817ffdf8ac3ad2a4` → `674f5b241ba564ed6ee7b279b10908ffd5adc168`
with `REQUEST_CHANGES`. The subsequent tree keeps the candidate boundary on
live PR #22 metadata and records the real PostgreSQL evidence separately from
the still-pending external gates.

```yaml
h2b_persistence_relevant_behavior_sha: FROZEN_ON_PR_HEAD
h2b_review_base: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
h2b_review_head_authority: live PR #22 head
canonical_runtime_origin_constraints: PASS (H2B integration 5/5)
direct_runtime_activity_update_denial: PASS (H2B integration 5/5)
completion_function_fail_closed_input_validation: PASS (H2B integration 5/5)
real_postgres_version: PostgreSQL 18.6
real_postgres_platform: Windows
real_postgres_bin_directory: C:\dev\Heptalogos\tmp\heptalogos-pg18.6-correction-20260825\extracted\pgsql\bin
private_postgres_regression: PASS (20/20)
host_ownership_regression: PASS (10/10)
persistence_regression: PASS (9/9)
bootstrap_runtime_regression: PASS (7 files, 52 tests)
recovery_process_regression: PASS (2/2)
pnpm_verify: PASS (current fifth-cycle full repository verify)
independent_review: NOT_RUN (new exact pair)
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

The PostgreSQL tools are retained only under the ignored repository-root
`tmp/` directory. Linux/macOS, source-less, service/headless, independent
review, final cross-platform CI, and squash merge remain `NOT_RUN`.

## H2B sixth corrective-cycle persistence status (2026-08-25)

The current corrective tree follows the `REQUEST_CHANGES` result for
`19ebef1...` → `ee256dd...`. It changes only runtime-kernel contract shape,
boundary projection, provider failure normalization, and governance text; no
persistence, execution-lineage, schema, migration, or database path changed.

```yaml
h2b_persistence_relevant_behavior_sha: CARRIED_FORWARD_FROM_EE256
h2b_review_base: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
h2b_review_head_authority: live PR #22 head
canonical_runtime_origin_constraints: CARRIED_FORWARD
direct_runtime_activity_update_denial: CARRIED_FORWARD
completion_function_fail_closed_input_validation: CARRIED_FORWARD
real_postgres_platform: CARRIED_FORWARD (Windows PostgreSQL 18.6)
current_head_real_postgres_rerun: NOT_RUN (no persistence/lineage/DB path changed)
pnpm_verify: PASS (current sixth-cycle full repository verify)
independent_review: NOT_RUN (new exact pair)
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

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
were addressed by the prior behavior candidate; the resulting pair
was not the current candidate after the next independent review.

The next reviewed pair
`446d0f6bce449f177c66fb569341020757b44c9b` →
`c889eae74093fdf86ef713f024587e75f3b098c7` returned
`Independent Review REQUEST_CHANGES` for RC-1 append-order lineage,
RC-2 real PostgreSQL stale-origin proof, and RC-3 Roadmap current truth.
Those corrections are implemented in behavior candidate
`76589ade468ccb7a4a9ecf830f6200fdd729917c`; its new exact-pair review,
final CI, and squash merge remain `NOT_RUN`.

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

## H2B post-merge truth reconciliation (2026-08-26)

```yaml
h2b_review_candidate_base_sha: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
h2b_review_candidate_head_sha: 86c01ee90d6d1f6c953be39375ccddb0458a189a
h2b_independent_review: PASS (operator-supplied exact pair)
h2b_final_cross_platform_ci: PASS (run 32862042074; Ubuntu/macOS/Windows)
h2b_squash_merge: PASS (PR #22 merge d7f32427398d2309c1732cdbce98f590e14a8249)
h2b_final_head_real_postgres_rerun: NOT_RUN
```

The H2B persistence/lineage property evidence is carried forward from the
qualified Windows PostgreSQL 18.6 run because the final corrective cycle did
not change persistence, lineage, schema, migration, or database behavior.
The H2A-3 historical final cross-platform CI remains `NOT_RUN`; H2B evidence
does not rewrite it. Linux/macOS PostgreSQL, source-less persistence, and
service/headless product claims remain `NOT_RUN`.

## H2-S pre-merge candidate qualification (2026-08-26)

```yaml
candidate:
  pullRequest: 24
  state: READY_FOR_REVIEW
  branch: dev/h2-stabilization
localQualification:
  status: PASS
  environment: Windows / Node 24.19.0 / pnpm 11.22.0
freshPostgreSQL18_6: PASS
persistenceUnit: PASS (19/19)
executionLineageUnit: PASS (29/29)
canonicalSchemaUnit: PASS (3/3)
bootstrapRuntimeIntegration: PASS (8 suites, 58 tests)
hostOwnershipIntegration: PASS (10/10)
persistenceIntegration: PASS (9/9)
recoveryProcess: PASS (4/4)
recoveryProcessPostgres: PASS (2/2)
independentReview: NOT_RUN
finalCrossPlatformCI: NOT_RUN
merge: NOT_RUN
```

This section preserves the Ready review candidate as historical pre-merge
evidence. Historical H2A/H2B review, CI, and merge records above remain
historical; the H2-S external closure gates were subsequently completed and
are recorded below.

## H2-S post-merge closure (2026-08-26)

```yaml
h2s_post_merge_closure:
  freshWindowsPostgreSQL18_6: PASS
  independentReview: PASS
  finalCrossPlatformCI: PASS
  squashMerge: PASS
  H2Stabilization: CLOSED
  H2: CLOSED
  qualificationState: PARTIAL
```

The final generic Ubuntu/macOS/Windows repository CI did not prove real
PostgreSQL persistence on Linux or macOS, source-less persistence, installed
service/headless persistence, service-account ACLs, or hardware power-loss
behavior. Those residual product properties remain at their recorded states.

## Current-master Ubuntu residual qualification (2026-08-26)

```yaml
ubuntu_current_master_real_postgres:
  platform: Ubuntu/Linux
  architecture: x86_64
  postgresVersion: PostgreSQL 18.6
  postgresBinMode: explicit HEPTALOGOS_TEST_PG_BIN
  postgresBinDirectory: /home/arsvine/Dev/Heptalogos/tmp/pg/postgresql-18.6/usr/lib/postgresql/18/bin
  privatePostgresIntegration: PASS (20/20)
  hostOwnershipIntegration: PASS (10/10)
  persistenceIntegration: PASS (9/9)
  bootstrapRuntimeIntegration: PASS (8 suites, 58 tests)
  recoveryProcess: PASS (4/4)
  recoveryProcessPostgres: PASS (2/2)
  realPostgresLinux: PASS
  qualificationState: PARTIAL
```

The explicit PostgreSQL 18.6 matrix supports the current Ubuntu/Linux
real-PostgreSQL persistence property. It does not prove macOS, source-less,
installed service/headless, service-account ACL, or hardware power-loss
behavior; those residuals remain at their recorded states.
