# Q-RUNTIME-01 资格证据

```yaml
qualificationId: Q-RUNTIME-01
role: trusted in-process lifecycle mechanics
date: 2026-09-01
evidenceStatus: PASS
roleDecision: ADOPTED
implementationQualification: REQUIRED
selectedRoute: "`cordis` active 4.x package line"
qualificationState: PARTIAL
currentCandidate:
  candidateId: FOUNDATION-REMEDIATION-BUNDLE-2026-09-01
  behaviorCandidateSha: 7e975d8c2d3e720f65a8d80d1c0e7fd531c1802b
  branch: dev/h3-stabilization
  plan: project/plans/active/foundation/foundation-remediation-bundle-2026-09-01.md
  lifecycle: ACTIVE
  freeze: NOT_RUN
  independentReview: NOT_RUN
  merge: NOT_RUN
```

## Current candidate evidence

```yaml
evidence:
  P1_dependency_lifecycle: PASS
  P2_partial_activation_failure: PASS
  P3_disposer_failure: PASS
  P4_scope_generation_isolation: PASS
  L2_adapter_fit: PASS
  runtime_kernel_terminal_lifecycle: PASS (5 files, 130 tests)
  runtime_kernel_build_typecheck_lint: PASS
  runtime_substrate_preserved: PASS
  integration_foundation_runtime_composition: PASS (14 files, 87 tests)
  real_postgres_runtime_qualification: PASS (runtime-kernel managed-host composition included in the real PostgreSQL integration target)
  source_less_runtime: NOT_RUN
  service_headless_runtime: NOT_RUN
  macos_runtime: NOT_RUN
  repository_verify: PASS (pnpm nx run repository:verify --skip-nx-cache)
  independent_review: NOT_RUN
  merge: NOT_RUN
```

The current evidence proves the adopted Cordis adapter and RuntimeKernel
component reconciliation at their package/unit boundaries, plus the current
cross-package managed-host composition on the Windows PostgreSQL 18.6
toolchain. Runtime-level close is terminal; component-level quiescence and
generation retirement remain local reconciliation semantics. Source-less,
service/headless, macOS, review, merge, and final repository-gate claims remain
separately qualified.

## Historical H2B first corrective-cycle addendum (2026-08-25)

```yaml
candidate_status: NOT_FROZEN
exact_cordis_version: 4.0.0-rc.8
exact_graphlib_version: 4.0.5
runtime_substrate_unit: PASS (16/16; C1-C14 plus package-root surface assertion)
runtime_kernel_unit: PASS (64/64 focused tests)
generation_fence: PASS (sync/async return shape, in-flight settlement, retained nested proxies)
service_provider_replacement: PASS (focused supervisor regressions)
capability_rebind: PASS (focused registry/readiness unit evidence)
operating_mode_reconcile: PASS (focused supervisor regressions)
readiness_recompute: PASS (focused evaluator/registry unit evidence)
runtime_lifecycle_lineage_unit: PASS (3/3 runtime-kernel lifecycle + 9/9 execution-lineage focused tests)
canonical_problem_error_unit: PASS (runtime-kernel and runtime-substrate emit native ProblemError)
runtime_substrate_late_disposal: PASS (C11-C14)
runtime_lifecycle_real_postgres: NOT_RUN
canonical_runtime_origin_constraints_real_postgres: NOT_RUN
repository_check_agents: PASS
repository_check_corpus: PASS
repository_check_repository: PASS
repository_check_dependencies: PASS
repository_check_boundaries: PASS
toolchain_check: PASS
ts7_build: PASS
ts6_compatibility_lane: PASS
changed_scope_eslint: PASS
pnpm_verify: PASS (full repository verify; one unrelated flaky lock test retried successfully)
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

The managed-Host PostgreSQL integration file was executed on the current host
and all five cases were skipped because the qualification toolchain was not
configured. This is `NOT_RUN`, not product/runtime qualification. Linux/macOS,
source-less, and service/headless claims remain deferred.

## Historical H2B second corrective-cycle addendum (2026-08-25)

```yaml
candidate_status: NOT_FROZEN
candidate_base_sha: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
candidate_branch: dev/h2b-runtime-composition-kernel-corrected
draft_pr: 22
runtime_kernel_package_unit: PASS (75/75)
runtime_substrate_package_unit: PASS (16/16)
B1_exact_service_binding_graph: PASS
B2_retirement_timeout_and_replacement_block: PASS
B3_real_class_native_receiver_and_mutation_fence: PASS
B4_capability_unbind_before_restart: PASS
I1_failed_blocked_and_SAFE_recovery: PASS
I2_required_capability_dynamic_unavailable: PASS
pnpm_verify: PASS (current full repository verify)
managed_host_h2b_postgres_integration: NOT_RUN (5 skipped; qualification toolchain unavailable)
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

The previous `3ce96cf7...` H2B-on-master snapshot was preserved at
`backup/h2b-master-3ce96cf` and `origin/master` was restored to
`19ebef1c...` before this branch continued. This topology repair is not
independent review or final-CI evidence. The exact candidate pair remains
unfrozen until the final documentation/qualification mutation is complete.

## Historical H2B third corrective-cycle addendum (2026-08-25)

```yaml
candidate_status: NOT_FROZEN
candidate_base_sha: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
candidate_branch: dev/h2b-runtime-composition-kernel-corrected
draft_pr: 22
reviewed_pair_invalidated_by_new_changes: 19ebef1 -> 4cad58d
runtime_kernel_package_unit: PASS (88/88)
runtime_substrate_package_unit: PASS (16/16)
RC1_host_owned_reflection_facade: PASS
RC2_explicit_unavailable_capability_dynamic: PASS
RC3_generation_owner_registry_retirement: PASS
RC4_transitive_background_blocked_closure: PASS
RC5_background_failure_lifecycle_lineage: PASS
RC6_close_failure_visible: PASS
RC7_repeated_blocked_reconcile_noop: PASS
RC8_DL15_admitted_call_drain_wording: PASS (plan wording recorded)
managed_host_h2b_postgres_integration: NOT_RUN (5 skipped; qualification toolchain unavailable)
h2a3_execution_foundation_integration: NOT_RUN (9 skipped; qualification toolchain unavailable)
canonical_initialization_postgres_integration: NOT_RUN (1 non-PG case passed, 7 PostgreSQL cases skipped)
other_h2a_postgres_integrations: BLOCKED (HEPTALOGOS_TEST_PG_BIN unavailable)
pnpm_verify: PASS (current full repository verify)
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

The previous `pnpm verify: PASS` and focused counts remain historical evidence
for the prior corrective cycle. They are not reused as verification for this
new working tree until the current code and documentation are rerun together.

## Historical H2B fourth corrective-cycle addendum (2026-08-25)

```yaml
candidate_status: FROZEN_ON_PR_HEAD
review_base: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
review_head_authority: live PR #22 head
previous_independent_review: REQUEST_CHANGES (19ebef1... -> ffe6949...)
host_facade_structural_read_only: PASS
facade_function_assignment_blocked: PASS
facade_accessor_projection_is_read_only: PASS
supervisor_mutation_chain: PASS
generation_bound_background_failure_event: PASS
stale_generation_failure_is_noop: PASS
immediate_failure_admission_revocation: PASS
authoritative_supervisor_readiness: PASS
h2b_postgres_expectation_alignment: PASS (source expectations updated; real PostgreSQL NOT_RUN)
runtime_kernel_package_unit: PASS (94/94)
runtime_substrate_package_unit: PASS (16/16)
managed_host_h2b_postgres_integration: NOT_RUN (5 skipped; qualification toolchain unavailable)
h2a3_execution_foundation_integration: NOT_RUN (9 skipped; qualification toolchain unavailable)
canonical_initialization_postgres_integration: NOT_RUN (1 non-PG case passed, 7 PostgreSQL cases skipped)
other_h2a_postgres_integrations: BLOCKED (HEPTALOGOS_TEST_PG_BIN unavailable)
pnpm_verify: PASS (current full repository verify)
independent_review: NOT_RUN (new exact pair)
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

This addendum records candidate-boundary authority without embedding the live
head SHA in the candidate itself: PR #22 metadata is the exact head authority.
The previous `ffe6949...` review result remains historical `REQUEST_CHANGES`.

## Historical H2B fifth corrective-cycle addendum (2026-08-25)

The independent review of `19ebef1...` → `674f5b2...` returned
`REQUEST_CHANGES`. The current tree addresses the remaining Object.prototype
facade escape path, the reconcile-time dependency race, and the lost explicit
Service Readiness authority. It also separates synchronous admission revocation
from bounded retirement settlement.

```yaml
candidate_status: FROZEN_ON_PR_HEAD
review_base: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
review_head_authority: live PR #22 head
previous_independent_review: REQUEST_CHANGES (19ebef1... -> 674f5b2...)
host_facade_object_prototype_legacy_members_blocked: PASS
host_facade_projected_data_read_only: PASS
generation_begin_retirement_is_synchronous: PASS
reconcile_start_dependency_race_blocks_dependent: PASS
authoritative_desired_service_readiness: PASS
runtime_kernel_unit: PASS (98/98)
runtime_substrate_unit: PASS (16/16)
runtime_lifecycle_real_postgres: PASS (H2B integration 5/5)
canonical_runtime_origin_constraints_real_postgres: PASS
direct_runtime_activity_update_denial_real_postgres: PASS
completion_function_fail_closed_validation_real_postgres: PASS
bootstrap_runtime_postgres_regression: PASS (7 files, 52 tests)
recovery_process_postgres_regression: PASS (2/2)
private_postgres_regression: PASS (20/20)
host_ownership_regression: PASS (10/10)
persistence_regression: PASS (9/9)
postgres_version: PostgreSQL 18.6
postgres_platform: Windows
postgres_bin_directory: C:\dev\Heptalogos\tmp\heptalogos-pg18.6-correction-20260825\extracted\pgsql\bin
pnpm_verify: PASS (current fifth-cycle full repository verify)
independent_review: NOT_RUN (new exact pair)
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

The extracted PostgreSQL qualification toolchain is retained under the ignored
repository-root `tmp/` directory. Linux/macOS, source-less, service/headless,
final cross-platform CI, independent review, and squash merge remain
`NOT_RUN`. The candidate head is authoritative only through live PR #22
metadata; this record does not embed a self-referential SHA.

## Historical H2B sixth corrective-cycle addendum (2026-08-25)

The independent review of `19ebef1...` → `ee256dd...` returned
`REQUEST_CHANGES`. The current tree narrows the H2B boundary to a supported
trusted semantic contract rather than extending the Host facade into a general
JavaScript membrane.

```yaml
candidate_status: FROZEN_ON_PR_HEAD
review_base: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
review_head_authority: live PR #22 head
previous_independent_review: REQUEST_CHANGES (19ebef1... -> ee256dd...)
h2b_supported_contract_shape: PASS
registration_accessor_validation: PASS
readonly_data_contract_validation: PASS
function_argument_boundary_rejection: PASS
function_result_boundary_rejection: PASS
provider_failure_normalization: PASS
runtime_kernel_unit: PASS (107/107)
runtime_substrate_unit: PASS (16/16)
pnpm_verify: PASS (current sixth-cycle full repository verify)
postgres_qualification: CARRIED_FORWARD_FROM_EE256 (no persistence, lineage, or DB path changed)
independent_review: NOT_RUN (new exact pair)
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

The current change does not alter persistence, execution-lineage, schema,
migration, or database behavior. The Windows PostgreSQL 18.6 H2B evidence
therefore remains carried-forward property evidence rather than a newly run
qualification claim for this exact head. Linux/macOS, source-less,
service/headless, independent review, final cross-platform CI, and squash merge
remain `NOT_RUN`.

## Historical NOT_RUN / deferred properties

- `product_runtime_start_stop`: Pilot remains synthetic L1/L2; no complete managed-Host product runtime was executed.

## Historical architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Exact-package RuntimeSubstrate integration, product start/stop, source-less and platform diagnostics remain implementation qualification.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。

## Historical H2B post-merge truth reconciliation (2026-08-26)

```yaml
h2b_review_candidate_base_sha: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
h2b_review_candidate_head_sha: 86c01ee90d6d1f6c953be39375ccddb0458a189a
h2b_independent_review: PASS (operator-supplied exact pair)
h2b_final_cross_platform_ci: PASS (run 32862042074; Ubuntu/macOS/Windows)
h2b_squash_merge: PASS (PR #22 merge d7f32427398d2309c1732cdbce98f590e14a8249)
h2b_final_head_real_postgres_rerun: NOT_RUN
```

The H2B Windows PostgreSQL property evidence remains explicitly carried
forward because the final corrective cycle changed Runtime Kernel
contract validation/projection and documentation, not persistence, lineage, or
database behavior. H2A-3's historical final cross-platform CI remains
`NOT_RUN`; it is not rewritten by H2B evidence. Linux/macOS product
PostgreSQL, source-less, service/headless, and complete product runtime
start/stop claims remain `NOT_RUN` or `PARTIAL` as previously recorded.

## Historical H2-S pre-merge candidate qualification (2026-08-26)

```yaml
candidate:
  pullRequest: 24
  state: READY_FOR_REVIEW
  branch: dev/h2-stabilization
localQualification:
  status: PASS
  environment: Windows / Node 24.19.0 / pnpm 11.22.0
freshPostgreSQL18_6: PASS
runtimeKernelScenarios:
  status: PASS (125/125)
  namedScenarios:
    - Q1 closes Service admission synchronously while an admitted call drains
    - Q2 quiesces hard dependents before providers with deterministic independent ordering
    - Q3 restores captured Desired with fresh MicroSystemInstanceIds and fences
    - Q5 makes the resume lease one-shot
    - Q6 leaves the accepted Desired snapshot unchanged through quiescence
    - Q7 can resume an empty supervisor before any Desired snapshot is accepted
    - Q8 terminalizes the supervisor when its owner signal aborts
    - Q9 does not double-retire or resurrect during an owner/background-failure race
    - Q10 closes the substrate after quiescence without resuming
    - Q11 keeps admission closed when quiescence settlement times out
    - Q12 prevents a queued later start after quiescence is requested
    - Q-start-quiesce-cancel aborts STARTING activation without manual release
    - Q-start-owner-abort-cancel aborts STARTING activation and cannot reopen
    - rejects a delayed activation after quiescence closes admission
    - rejects a delayed activation after owner abort closes admission
    - Q13 admits no work when the owner signal is already aborted
    - Q14 returns the same idempotent terminal close outcome
    - Q15 fails closed when resume encounters a structural activation failure
  note: Q4 is intentionally absent; the ledger does not claim a contiguous Q1-Q15 range.
runtimeSubstrateUnit: PASS (16/16)
bootstrapProductionBoundary: PASS
currentTreeHygiene: PASS
pg1_identity_coherence: PASS
pg2_host_terminality_propagation: PASS
pg3_planned_stop_real_quiescence: PASS
pg4_restart_continuity_rotation: PASS
pg5_structural_safe_abort_fit: PASS
pg6_shutdown_keep_postgres_and_bootstrap_cleanup: PASS
bootstrapRuntimeIntegration: PASS (8 suites, 58 tests)
privatePostgresIntegration: PASS (20/20)
hostOwnershipIntegration: PASS (10/10)
persistenceIntegration: PASS (9/9)
recoveryProcess: PASS (4/4)
recoveryProcessPostgres: PASS (2/2)
independentReview: NOT_RUN
finalCrossPlatformCI: NOT_RUN
merge: NOT_RUN
```

This section preserves the pre-merge Ready review candidate as historical
evidence. The fresh Windows PostgreSQL 18.6 suite and all required local gates
completed after the implementation mutation; the external closure gates were
subsequently completed and are recorded below.

## Historical H2-S post-merge closure (2026-08-26)

```yaml
h2s_post_merge_closure:
  independentReview: PASS
  finalCrossPlatformCI: PASS
  finalCrossPlatformCIPlatforms:
    ubuntu: PASS
    macos: PASS
    windows: PASS
  finalCandidateRevalidation: PASS
  squashMerge: PASS
  H2Stabilization: CLOSED
  H2: CLOSED
```

The final generic Ubuntu/macOS/Windows repository CI established repository
verification for the candidate; it did not establish real PostgreSQL product
qualification on Linux or macOS. Source-less, installed service/headless,
service-account ACL, and hardware power-loss properties remain residuals at
their recorded `NOT_RUN` states.

## Historical current-master Ubuntu residual qualification (2026-08-26)

```yaml
ubuntu_current_master_residual_qualification:
  platform: Ubuntu/Linux
  architecture: x86_64
  postgresVersion: PostgreSQL 18.6
  postgresBinMode: explicit HEPTALOGOS_TEST_PG_BIN
  postgresBinDirectory: /home/arsvine/Dev/Heptalogos/tmp/pg/postgresql-18.6/usr/lib/postgresql/18/bin
  repositoryVerify: PASS
  privatePostgresIntegration: PASS (20/20)
  hostOwnershipIntegration: PASS (10/10)
  bootstrapRuntimeIntegration: PASS (8 suites, 58 tests)
  recoveryProcess: PASS (4/4)
  recoveryProcessPostgres: PASS (2/2)
  linuxRealPostgresRuntimeQualification: PASS
  sourceLessRuntime: NOT_RUN
  installedServiceHeadlessRuntime: NOT_RUN
```

This is current Ubuntu/Linux real-PostgreSQL runtime evidence from the
explicit matrix. It does not imply macOS, source-less, installed
service/headless, service-account ACL, or hardware power-loss qualification.

## Historical H3A-2 Foundation containment candidate

The historical H3A-2 containment plan changed DurableExecution lifecycle and
credential-scoped preflight behavior. Earlier H3A-2 runtime observations are
not carried forward to the historical candidate until the claim-matched reruns
completed.

```yaml
candidateId: H3A2-FOUNDATION-CONTAINMENT-2026-08-29
plan: project/plans/superseded/repository/knowledge-architecture-agent-harness-convergence-2026-08-30.md
lifecycle: DRAFT
foundation_executable_spine_boot_work_stop: PASS
foundation_executable_spine_restart: PASS
durable_execution_reversible_quiescence: PASS
durable_execution_truthful_retryable_close: PASS
workqueue_bounded_quiescence: PASS
dbos_credential_scoped_preflight: PASS
repository_verify: PASS
hardware_power_loss: NOT_RUN
source_less: NOT_RUN
service_headless: NOT_RUN
independentReview: NOT_RUN
finalManualVerification: NOT_RUN
```

Ubuntu/Linux real PostgreSQL/DBOS was freshly qualified on the current host:
private-postgres integration 20/20, persistence 9/9, host-ownership 11/11,
bootstrap-runtime integration 9 files/108 tests, and the
durable-work-recovery / Foundation-spine / bootstrap-recovery-process
real-PostgreSQL files 16/16, using the explicit `HEPTALOGOS_TEST_PG_BIN`
toolchain path (PostgreSQL 18.6). macOS real PostgreSQL, source-less, and
service/headless remain `NOT_RUN`.

## Historical H3-S candidate projection

```yaml
candidateId: H3S-FOUNDATION-PERMANENT-SURFACE-ADMISSION-2026-08-31
baseSha: bbadfbacbd9aaea23639e51d5ce01744bd530da4
branch: dev/h3-stabilization
plan: project/plans/active/foundation/h3s-foundation-permanent-surface-admission-2026-08-31.md
lifecycle: READY
freeze: PASS
runtimeSubstrateDisposition: KEEP / NO_REOPEN
runtimeKernelDisposition: KEEP / NO_REOPEN
currentCandidateQualification: PASS
repositoryVerify: PASS
independentReview: NOT_RUN
```

The H3-S plan explicitly retains RuntimeSubstrate and RuntimeKernel semantics;
the historical H2B observations above are not relabeled as current H3-S
execution evidence.

## Current Foundation remediation projection (2026-09-01)

```yaml
candidateId: FOUNDATION-REMEDIATION-BUNDLE-2026-09-01
behaviorCandidateSha: 7e975d8c2d3e720f65a8d80d1c0e7fd531c1802b
branch: dev/h3-stabilization
plan: project/plans/active/foundation/foundation-remediation-bundle-2026-09-01.md
runtimeKernelTerminalLifecycle: PASS
runtimeKernelUnit: PASS (5 files, 130 tests)
runtimeKernelBuildTypecheckLint: PASS
runtimeSubstrateBoundary: PASS
integrationFoundationRuntimeComposition: PASS (14 files, 87 tests)
realPostgresQualification: PASS (runtime-kernel managed-host composition included in the real PostgreSQL integration target)
sourceLess: NOT_RUN
serviceHeadless: NOT_RUN
macos: NOT_RUN
repositoryVerify: PASS
independentReview: NOT_RUN
merge: NOT_RUN
qualificationState: PARTIAL
```

This projection belongs to the current unmerged remediation candidate. It does
not inherit the historical H2/H3-S candidate's provider, process, platform, or
external-governance evidence.
