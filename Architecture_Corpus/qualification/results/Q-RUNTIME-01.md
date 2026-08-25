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

## NOT_RUN / deferred properties

- `product_runtime_start_stop`: Pilot remains synthetic L1/L2; no complete RuntimeSubstrate or product runtime is implemented.

## Architecture disposition

此 role 的当前 RoleDecision 由 `../dependency-status.json` 冻结为 `ADOPTED`；本记录只报告已证明的 property 与剩余 implementation/product qualification，不构成第二套 Authority。

Exact-package RuntimeSubstrate integration, product start/stop, source-less and platform diagnostics remain implementation qualification.

若未来真实 implementation 暴露 reproducible hard blocker，才允许按 `../DEPENDENCY-QUALIFICATION.md` 的 reopening rule 重开 RoleDecision。

## H2B Task 1 current addendum (2026-08-25)

```yaml
qualificationId: Q-RUNTIME-01
testedProperty: "H2B thin Cordis RuntimeSubstrate public-package lifecycle/resource conformance"
evidenceStatus: PASS
qualificationState: PARTIAL
implementationQualification: REQUIRED
behavior_candidate_sha: ec349a5
exact_cordis_version: PASS (4.0.0-rc.8)
exact_graphlib_version: PASS (Catalog pin 4.0.5; runtime-kernel consumer is Task 2)
cordis_ts7_public_declaration_resolution: PASS (package-local Bundler resolution; skipLibCheck remains false)
cordis_plugin_fiber_conformance: PASS (C1-C10, 11/11 tests)
partial_activation_cleanup: PASS
sibling_parent_isolation: PASS
reentrant_dispose: PASS
background_failure_observation: PASS
disposer_failure_observation: PASS
settlement_timeout: PASS
abort_before_disposal: PASS
reverse_close_order: PASS
runtime_substrate_unit: PASS (11/11)
runtime_substrate_typecheck: PASS
runtime_substrate_lint: PASS
runtime_substrate_build: PASS
dependency_boundary_gate: PASS
repository_verification: PASS
product_runtime_start_stop: NOT_RUN
real_postgres_runtime_composition: NOT_RUN
source_less_shipping: NOT_RUN
service_headless: NOT_RUN
cross_platform_ci: NOT_RUN
independent_review: NOT_RUN
squash_merge: NOT_RUN
```

The exact `cordis@4.0.0-rc.8` package-root `Context`, `Context.plugin`,
Fiber lifecycle/await/dispose, and Fiber effect APIs are used. The adapter
does not import Cordis private paths or product Service/Capability semantics.
The package-local TypeScript resolution override is required because this
Cordis release publishes extensionless internal declaration imports under the
repository's TS7 NodeNext baseline; `skipLibCheck: false` remains enabled.
## H2B Tasks 2-5 current addendum (2026-08-25)

```yaml
qualificationId: Q-RUNTIME-01
testedProperty: "H2B Heptalogos-owned RuntimeKernel composition, generation-fenced Service/Capability semantics, runtime lineage, and managed-Host integration"
evidenceStatus: PASS
qualificationState: PARTIAL
implementationQualification: REQUIRED
behavior_candidate_sha: 5d162618a078bb1df3d8009c857c6d718155e28f
runtime_identity_unit: PASS (22/22)
bootstrap_state_unit: PASS (113 passed, 3 skipped)
runtime_substrate_unit: PASS (11/11)
runtime_kernel_unit: PASS (42/42)
execution_lineage_unit: PASS (29/29)
canonical_schema_unit: PASS (3/3)
persistence_unit: PASS (19/19)
bootstrap_runtime_unit: PASS
runtime_origin_shared_als: PASS (L2-L8 unit coverage)
activity_completion_unit: PASS (current Activity/origin admission)
runtime_lifecycle_recorder_unit: PASS (retain/work/complete success and failure)
runtime_lifecycle_real_postgres: PASS (I1-I10 plus L9-L16)
bootstrap_runtime_real_postgres_regression: PASS (7 integration files, 51 tests)
repository_verification: PASS (pnpm verify)
dependency_boundary_gate: PASS
real_postgres_version: PostgreSQL 18.6
real_postgres_platform: Windows
real_postgres_provenance: "EDB PostgreSQL 18.6 Windows x86-64 extracted toolchain; not source-less shipping"
source_less_shipping: NOT_RUN
service_headless: NOT_RUN
linux_real_postgres: NOT_RUN
macos_real_postgres: NOT_RUN
cross_platform_ci: NOT_RUN
independent_review: NOT_RUN
squash_merge: NOT_RUN
```

The real PostgreSQL qualification used the existing managed-Host fixture and
Host-fenced `PersistenceService`; no second PostgreSQL harness was introduced.
`runtime-kernel` does not import raw `pg`, Kysely, BootstrapState, or
Host-ownership internals, and its package root does not expose Cordis or
Graphlib objects. The candidate remains Draft pending the operator-directed
H2-wide CI/review phase.
