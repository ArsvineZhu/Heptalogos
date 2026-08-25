# Q-RUNTIME-01 资格证据

```yaml
qualificationId: Q-RUNTIME-01
role: trusted in-process lifecycle mechanics
evidenceStatus: PASS
preImplementationDecisionState: CLOSED
roleDecision: ADOPTED
implementationQualification: REQUIRED
selectedRoute: "`cordis` active 4.x package line"
```

## Observed properties

```yaml
evidence:
  P1_dependency_lifecycle: PASS
  P2_partial_activation_failure: PASS
  P3_disposer_failure: PASS
  P4_scope_generation_isolation: PASS
  L2_adapter_fit: PASS
```

## H2B first corrective-cycle addendum (2026-08-25)

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

## H2B second corrective-cycle addendum (2026-08-25)

```yaml
candidate_status: NOT_FROZEN
candidate_base_sha: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
candidate_branch: dev/h2b-runtime-composition-kernel-corrected
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

## NOT_RUN / deferred properties

- `product_runtime_start_stop`: Pilot remains synthetic L1/L2; no complete managed-Host product runtime was executed.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Exact-package RuntimeSubstrate integration, product start/stop, source-less and platform diagnostics remain implementation qualification.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。
