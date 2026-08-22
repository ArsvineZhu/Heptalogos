# Q-PRIVATE-POSTGRES-01 Private PostgreSQL bootstrap qualification

```yaml
qualificationId: Q-PRIVATE-POSTGRES-01
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "Exact PostgreSQL 18.6 private bootstrap initialization, portable identity, bounded lifecycle, ownership-held handoff, and fail-closed recovery boundaries"
```

## Corrected-candidate Windows evidence

```yaml
platform: Windows x64
os_version: "Microsoft Windows NT 10.0.26200.0"
runtime: "Node 24.19.0 / pnpm 11.22.0"
postgres_provenance: "EDB PostgreSQL 18.6 Windows x86-64 binary archive, completely extracted into a temporary qualification root; not a source-less shipping artifact"
candidate_sha: b94c61e6fe275aba5e4947c4bd90b38cb5d8658f
exact_version_outputs:
  postgres: "postgres (PostgreSQL) 18.6"
  initdb: "initdb (PostgreSQL) 18.6"
  pg_ctl: "pg_ctl (PostgreSQL) 18.6"
  pg_controldata: "pg_controldata (PostgreSQL) 18.6"
  pg_isready: "pg_isready (PostgreSQL) 18.6"
```

All five required tools reported PostgreSQL 18.6 from the explicit EDB
Windows bin root: `postgres`, `initdb`, `pg_ctl`, `pg_controldata`, and
`pg_isready`.

Observed properties:

```yaml
exact_toolchain_18_6: PASS
first_init_empty_directory: PASS
nonempty_unknown_directory_rejected: PASS
cluster_system_identifier_persisted: PASS
restart_same_cluster_identity: PASS
persisted_port_stable: PASS
port_occupied_fails_closed: PASS
secret_not_in_argv_state_journal_logs: PASS
v1_to_v2_under_bootstrap_ownership: PASS
crash_after_init_before_state_commit_recovery_required: PASS
crash_after_state_commit_before_start_recovers: PASS
crash_after_start_before_ready_recovers: PASS
ready_while_bootstrap_ownership_held: PASS
bootstrap_release_blocked_while_pg_ready: PASS
stale_ready_handle_rejected_after_release: PASS
compromised_ownership_blocks_lifecycle: PASS
start_failure_cleanup_proven_or_uncertain: PASS
effective_runtime_profile_verified_by_postgres: PASS
duplicate_runtime_setting_rejected: PASS
hba_tamper_rejected: PASS
initialized_by_version_is_provenance: PASS
windows_unicode_space_path_audit: PASS
local_state_machine_mechanics_xstate: PASS
xstate_types_not_exposed_in_stable_contracts: PASS
lifecycle_property_invariants_fast_check: PASS
ownership_release_capability_not_exposed: PASS
ownership_release_start_fenced: PASS
ambiguous_start_cleanup_policy_proven: PASS
ambiguous_start_stopped_observation_not_quiescent: PASS
ambiguous_start_running_then_stop_proven: PASS
restart_uncertain_stop_proven: PASS
bootstrap_release_blocked_for_ambiguous_start: PASS
windows_real_pg: PASS
linux_real_pg: NOT_RUN
macos_real_pg: NOT_RUN
source_less_shipping_closure: NOT_RUN
service_account_acl_closure: NOT_RUN
```

The corrected-candidate Windows evidence was produced by:

- `pnpm nx run private-postgres:test` — 41/41 unit/property tests PASS.
- `pnpm nx run private-postgres:test:integration` — 20/20 PASS.
- `pnpm exec vitest run --root packages/bootstrap-runtime src/private-postgres-bootstrap.integration.test.ts --testTimeout=120000` — 9/9 PASS.
- `pnpm exec vitest run --root packages/private-postgres src/lifecycle-machine.test.ts` — 8/8 deterministic and fast-check tests PASS.
- `pnpm exec vitest run --root packages/private-postgres src/controller.lifecycle.test.ts` — 4/4 PASS, including immediate-STOPPED non-quiescence and both restart cleanup branches.
- `pnpm exec vitest run --root packages/bootstrap-runtime src/private-postgres-bootstrap.test.ts` — 11/11 PASS, including ownership release blocking for ambiguous cleanup.
- `pnpm test` — aggregate unit tests PASS: private-postgres 41, bootstrap-runtime 45 with one pre-existing skip, bootstrap-state 46 with three skips, foundation-contracts 13, and repo-kit 14.
- The same two suites with Node `TEMP`/`TMP` rooted under a normal Windows
  drive path containing spaces and non-ASCII characters — PASS.
- `postgres -D <data> -C <setting>` effective-setting inspection, including
  absolute `data_directory` and `hba_file` output on this Windows runtime —
  PASS.
- Permanent repository gates and `pnpm verify` — PASS.

The test fixtures assert that the sentinel password is absent from generated
BootstrapState, BootstrapJournal, and PostgreSQL log evidence; the
  credential-file helper removes the ephemeral password file after the bounded
callback. Windows temporary-file mode tests do not qualify service-account or
installer ACL behavior. The real lifecycle suite also covers a restart
readiness failure followed by a bounded stop that proves the process is no
longer running; it does not treat stale in-memory STOPPED state as proof.

## Final hardening evidence (2026-08-22)

The following evidence is an addendum for the final hardening candidate; the
earlier PASS entries above remain historical evidence at their recorded SHA.

```yaml
candidate_sha: 7c93a3fa3fd9d50d75546d1b45ea28615fea2ae5
bootstrap_role_identity: PASS
password_line_contract: PASS
restart_log_continuity: PASS
stale_ready_handle_isolation: PASS
private_postgres_targeted_tests: PASS
windows_real_pg_revalidation: PASS
bootstrap_runtime_stale_handle_regression: PASS
pnpm_verify: PASS
```

The addendum was produced by the fixed-role `initdb` argv/identity roundtrip
tests, credential-file contract tests for empty/LF/CR/NUL and normal UTF-8
passwords, restart argv tests, `private-postgres` real PostgreSQL 18.6
integration (20/20), and `bootstrap-runtime` real PostgreSQL 18.6 integration
(10/10), including the stale Ready handle regression; the private-postgres
real integration was revalidated at 20/20. The qualification remains `PARTIAL`: corrected Linux/macOS real
PostgreSQL, source-less shipping, and service-account ACL closure remain
`NOT_RUN`.

## Historical pre-correction Foundation M4 host ownership evidence (2026-08-22)

This addendum records the M4 implementation candidate separately from the
historical M3 hardening candidates. It does not close H1, M5 reverse handoff,
or cross-platform/source-less/service-account qualification.

```yaml
candidate_sha: 6b4d8e9460560c0298d7edf6550562a4750195d4
host_ownership_identity: PASS
least_privilege_host_role: PASS
canonical_fence_schema: PASS
dedicated_advisory_lease: PASS
fresh_token_for_update: PASS
lease_loss_fenced_no_reconnect: PASS
old_transaction_serialization: PASS
stale_token_rejected: PASS
credential_mismatch_fail_closed: PASS
partial_provisioning_retry: PASS
bootstrap_to_host_forward_handoff: PASS
bootstrap_release_after_token_commit: PASS
host_role_privilege_confinement: PASS
credential_plaintext_absent: PASS
host_ownership_boundaries: PASS
windows_host_ownership_real_pg: PASS
windows_bootstrap_host_handoff_real_pg: PASS
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
linux_host_ownership_real_pg: NOT_RUN
macos_host_ownership_real_pg: NOT_RUN
source_less_shipping_closure: NOT_RUN
service_account_acl_closure: NOT_RUN
```

The historical M4 evidence was produced by the focused unit suites, PostgreSQL 18.6
Windows integration suites (`private-postgres` 20/20, `host-ownership` 5/5,
and `bootstrap-runtime` 12/12), the partial-provisioning and late-handoff
fault matrix, and the permanent repository gates including `pnpm verify`.
The historical real database fixture used the explicit extracted Windows PostgreSQL 18.6
bin root recorded above. Final cross-platform CI for that historical candidate remained intentionally
`NOT_RUN` pending independent review of this exact candidate SHA.

## Foundation M4 corrective hardening evidence (2026-08-22)

This is the current corrective candidate. It supersedes the historical M4
addendum above for current qualification truth while preserving that addendum
as historical evidence.

```yaml
candidate_sha: c7f82e379ff28d836fe54d7cfbd266adfc15cacd
bootstrap_authority_continuity: PASS
existing_host_reservation_before_mutation: PASS
closed_world_postgres_authority_unit: PASS
protected_role_membership_confinement_unit: PASS
portable_postgres_toolchain_resolution: PASS
host_lease_tcp_keepalive_timing: PASS
bootstrap_release_failure_fenced: PASS
focused_host_ownership_unit: PASS
focused_bootstrap_runtime_unit: PASS
permanent_repository_verify: PASS
windows_host_ownership_real_pg: NOT_RUN
windows_bootstrap_host_handoff_real_pg: NOT_RUN
linux_host_ownership_real_pg: NOT_RUN
macos_host_ownership_real_pg: NOT_RUN
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
```

The corrective candidate passed `pnpm verify`, the Host ownership unit suite
(54/54), the bootstrap-runtime unit suite (59 passed, 1 skipped), and the
private-postgres unit suite (49/49). The current shell has no qualified
PostgreSQL 18.6 toolchain (`HEPTALOGOS_TEST_PG_BIN` is unset); therefore all
corrected-candidate real PostgreSQL gates remain `NOT_RUN`. The prior Windows
and Linux PostgreSQL results must not be read as evidence for this corrected
candidate SHA.

## Historical pre-correction Linux evidence

The prior Linux real-PostgreSQL run remains historical evidence only:

```yaml
platform: Linux x86_64
postgres_provenance: "Ubuntu 18.6-0ubuntu0.26.04.1 package artifacts extracted into a temporary qualification root"
candidate_sha: 46e66c776f17b43ae06c0cef8229c4cd4666919c
linux_real_pg: PASS
```

It was produced before the corrective behavior changes and must not be read as
qualification of the corrected candidate SHA.

## Qualification remaining

This is implementation/product evidence, not a new dependency-selection
authority. Corrected-candidate Linux and macOS real PostgreSQL, source-less
shipping and ReleaseManifest/SBOM closure, and installer/service-account ACL
behavior remain `NOT_RUN`. The historical extracted Ubuntu package runtime does
not qualify the corrected Linux claim.
