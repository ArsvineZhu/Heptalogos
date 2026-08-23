# Q-PRIVATE-POSTGRES-01 Private PostgreSQL bootstrap qualification

```yaml
qualificationId: Q-PRIVATE-POSTGRES-01
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "Exact PostgreSQL 18.6 private bootstrap initialization, portable identity, bounded lifecycle, ownership-held handoff, and fail-closed recovery boundaries"
```

## Current H1-S candidate truth (2026-08-23)

```yaml
M5B: CLOSED
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: REVIEW_CORRECTION_IMPLEMENTATION_COMPLETE
H1: OPEN
H2: NOT_ELIGIBLE
behavior_candidate_sha: 3cc589b667b0cd64342881caf7d382c2d960a928
```

The machine-readable ledger currently contains the H1-S canonical V1 property
set. Historical M3/M4/M5A/M5B implementation records remain below as narrative
evidence and do not assert compatibility with removed development-era formats.

## Current H1-S properties

```yaml
canonical_v1_private_postgres_identity_commit: PASS
canonical_v1_initialization_profile_v1: PASS
exact_toolchain_18_6: PASS
private_postgres_real_integration: PASS
host_ownership_real_integration: PASS
bootstrap_runtime_real_integration: PASS
recovery_process_postgres: PASS
linux_real_pg: NOT_RUN
windows_real_pg: PASS
macos_real_pg: NOT_RUN
source_less_shipping_closure: NOT_RUN
service_account_acl_closure: NOT_RUN
hardware_power_loss: NOT_RUN
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

The corrected candidate executed PostgreSQL 18.6 on Windows x64 from the EDB
archive in the temporary bin root
`C:\Users\Arsvine\AppData\Local\Temp\heptalogos-pg18.6-correction-20260823\extracted\pgsql\bin`.
The five required tools reported 18.6; private-postgres integration passed
20/20, Host ownership integration 8/8, bootstrap-runtime integration 30/30,
and PostgreSQL process recovery 2/2. `pnpm verify` also passed.

## Current H1-S review-correction qualification

```yaml
candidate_sha: 3cc589b667b0cd64342881caf7d382c2d960a928
runtime: "Windows x64 / Node 24.19.0 / pnpm 11.22.0"
postgres_provenance: "EDB PostgreSQL 18.6 Windows x86-64 binary archive extracted to a temporary qualification root; not a source-less shipping artifact"
exact_toolchain_18_6: PASS
maintenance_success_terminal_v1: PASS
post_restart_normal_boot_continuity: PASS
post_stop_normal_boot_continuity: PASS
illegal_host_maintenance_transition_not_durably_committed: PASS
recovery_error_journal_requires_current_bootstrap_state: PASS
recovery_error_journal_requires_current_operation_pointer: PASS
private_postgres_real_integration: PASS (20/20)
host_ownership_real_integration: PASS (8/8)
bootstrap_runtime_real_integration: PASS (30/30)
recovery_process_without_postgres: PASS (4/4)
recovery_process_with_postgres: PASS (2/2)
linux_real_pg: NOT_RUN
macos_real_pg: NOT_RUN
source_less_shipping_closure: NOT_RUN
service_account_acl_closure: NOT_RUN
hardware_power_loss: NOT_RUN
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

This current-host run proves Windows extracted-runtime PostgreSQL behavior for
the corrected candidate. It does not upgrade Linux/macOS, source-less shipping,
service-account ACL, hardware power-loss, independent-review, final-CI, or
merge claims.

## Historical corrected-candidate Windows evidence

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

## Historical Foundation M4 corrective hardening evidence (2026-08-22)

This was the pre-privilege-closure corrective candidate. It remains historical
evidence; the following privilege-closure addendum is the current candidate.

```yaml
candidate_sha: be1d728bdad5327e7e85764270802c97f97023ee
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
windows_host_ownership_real_pg: PASS
windows_bootstrap_host_handoff_real_pg: PASS
linux_host_ownership_real_pg: NOT_RUN
macos_host_ownership_real_pg: NOT_RUN
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
```

That corrective candidate passed `pnpm verify`, the Host ownership unit suite
(54/54), the bootstrap-runtime unit suite (59 passed, 1 skipped), and the
private-postgres unit suite (49/49). With the explicit PostgreSQL 18.6
toolchain resolved from the Windows qualification bin root, corrected-candidate
real integration passed: private-postgres 20/20, Host ownership 6/6, and
bootstrap-runtime 12/12. Its closed-world evidence covered the then-tested
ACL and role-membership edges; grant-option and column-specific ACL closure
was not yet evidenced at that SHA. Corrected Linux/macOS real PostgreSQL,
independent review, and final cross-platform CI remain `NOT_RUN`.

## Historical Foundation M4 privilege-closure correction evidence (2026-08-22)

This is the current M4 implementation candidate. It supersedes the preceding
corrective candidate for current qualification truth while preserving both
earlier addenda as historical evidence.

```yaml
candidate_sha: 49370ac764675640699a30c589a7f8e2e1903125
reviewed_head_sha: 9f10389563e009fe4908cd8fb2f0abc7cf4f600b
acl_grant_option_closed_world: PASS
column_acl_closed_world: PASS
host_role_privilege_confinement: PASS
production_build_graph_isolated: PASS
focused_host_ownership_unit: PASS
focused_bootstrap_runtime_unit: PASS
focused_private_postgres_unit: PASS
windows_private_postgres_real_pg: PASS
windows_host_ownership_real_pg: PASS
windows_bootstrap_host_handoff_real_pg: PASS
permanent_repository_verify: PASS
linux_host_ownership_real_pg: NOT_RUN
macos_host_ownership_real_pg: NOT_RUN
independent_review: PASS
final_cross_platform_ci: PASS
final_ci_windows: PASS
final_ci_linux: PASS
final_ci_macos: PASS
final_ci_run_id: 32559601995
squash_merge_sha: 83e0b603d039036326eca9983af381387a9bfdb3
```

At this exact candidate SHA, the focused unit suites passed: Host ownership
59/59, bootstrap-runtime 59 passed with 1 skipped, and private-postgres
49/49. With the explicit PostgreSQL 18.6 Windows toolchain, real integration
passed: private-postgres 20/20, Host ownership 7/7 including grant-option and
column-specific ACL adversarial cases, and bootstrap-runtime 12/12. `pnpm
verify` also passed. The exact reviewed HEAD
`9f10389563e009fe4908cd8fb2f0abc7cf4f600b` received independent review PASS.
Manual final CI run `32559601995` checked out and verified that same SHA on
Windows, Linux, and macOS; all three jobs passed. The PR was then squash merged
as `83e0b603d039036326eca9983af381387a9bfdb3`. Corrected Linux/macOS real
PostgreSQL integration remains `NOT_RUN` because the final workflow runs the
repository verification projection rather than the live PostgreSQL integration
suite.

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

## Historical Foundation M5A reverse-handoff evidence (2026-08-22)

This addendum records the M5A implementation candidate separately. It does not
upgrade the historical M4 evidence, close H1, or claim process-death,
abandoned-lock, source-less, service-account, or cross-platform qualification.

```yaml
candidate_sha: 7ca699d16aeaf863dab091253ac42a11b744a0bf
maintenance_journal_v1_codec_digest_atomic_store: PASS
ownership_scoped_operation_pointer: PASS
managed_host_quiescence_boundary: PASS
bootstrap_admin_token_revocation: PASS
revocation_exact_fence_verification: PASS
maintenance_only_existing_cluster_controller: PASS
shared_postgres_process_mechanics: PASS
safe_pre_ponr_abort_proof: PASS
post_ponr_recovery_required_policy: PASS
stop_and_exit_unit_path: PASS
same_cluster_restart_reacquire_unit_path: PASS
fresh_host_token_and_revision_unit_path: PASS
quiesced_keep_postgres_shutdown_unit_path: PASS
deterministic_authority_fault_matrix: PASS
m5a_real_postgres_reverse_handoff: PASS
m5a_linux_real_pg: PASS
m5a_windows_real_pg: NOT_RUN
m5a_macos_real_pg: NOT_RUN
m5a_postgres_provenance: "Ubuntu 26.04 security archive postgresql-18 and postgresql-client-18 18.6-0ubuntu0.26.04.1 packages, extracted into a temporary qualification root; libpq5 18.6 extracted for runtime linkage"
m5a_postgres_bin: "/tmp/heptalogos-pg18-qual-04OOIw/extracted/usr/lib/postgresql/18/bin"
m5a_exact_version_outputs: "postgres/initdb/pg_ctl/pg_controldata/pg_isready all reported PostgreSQL 18.6"
m5a_private_postgres_integration: "20/20 PASS"
m5a_host_ownership_integration: "8/8 PASS"
m5a_bootstrap_runtime_integration: "17/17 PASS"
m5a_independent_review: NOT_RUN
m5a_final_cross_platform_ci: NOT_RUN
m5a_squash_merge: NOT_RUN
m5b: OPEN
h1: OPEN
```

The candidate's focused unit evidence was collected with Node 24.19.0: bootstrap-runtime
83 passed and 1 skipped, private-postgres 58 passed, and host-ownership 70 passed.
Real PostgreSQL 18.6 integration passed on Linux: private-postgres 20/20,
host-ownership 8/8, and bootstrap-runtime 17/17. Typecheck, package builds, lint,
repository/dependency/corpus/boundary checks, format checks, and `pnpm verify` were
also run locally. Windows/macOS real-PG qualification, independent review, and final
cross-platform CI remain `NOT_RUN`.

## Historical Foundation M5A corrective qualification evidence (2026-08-22)

This addendum records the corrected M5A behavior candidate after the independent
review at `65a56c7a8906e49658d8a304d0903668d8f64228` returned `REQUEST_CHANGES`.
The rejected review candidate and the earlier implementation candidate remain
historical records above; this addendum is the current M5A qualification truth.

```yaml
rejected_review_sha: 65a56c7a8906e49658d8a304d0903668d8f64228
historical_pre_correction_m5a_candidate_sha: 7ca699d16aeaf863dab091253ac42a11b744a0bf
corrected_behavior_candidate_sha: 9fd68d4656921c344a0ef637d31e91f127d53eaf
rc_1_complete_target_ownership_pair: PASS
rc_2_operation_local_old_host_retirement: PASS
rc_3_live_scenario_f_host_lease_backend_termination: PASS
rc_3_platform: Linux x86_64
rc_3_postgres_version: PostgreSQL 18.6
m5a_linux_real_pg: PASS
m5a_windows_real_pg: NOT_RUN
m5a_macos_real_pg: NOT_RUN
m5a_maintenance_journal_partial_target_ownership: PASS
m5a_old_managed_host_terminalization_after_ponr_or_recovery: PASS
m5a_old_raw_host_close_idempotence: PASS
m5a_pre_ponr_known_not_committed_safe_abort_preserves_old_host: PASS
m5a_scenario_f_live_pg_terminate_backend: PASS
m5a_scenario_f_postmaster_pid_unchanged: PASS
m5a_scenario_f_postmaster_start_time_unchanged: PASS
m5a_scenario_f_old_token_and_revision_unchanged: PASS
m5a_scenario_f_recovery_required_failed_journal: PASS
m5a_scenario_f_competing_bootstrap_rejected: PASS
m5a_scenario_f_no_unsafe_resume_or_host_b: PASS
m5a_bootstrap_state_unit: "82 passed, 2 skipped"
m5a_private_postgres_unit: "58 passed"
m5a_host_ownership_unit: "70 passed"
m5a_bootstrap_runtime_unit: "85 passed, 1 skipped"
m5a_private_postgres_integration: "20/20 PASS"
m5a_host_ownership_integration: "8/8 PASS"
m5a_bootstrap_runtime_integration: "17/17 PASS"
m5a_direct_pg_test_client_and_types: PASS
m5a_test_only_pg_boundary_exception: PASS
m5a_pnpm_verify: PASS
m5a_independent_review: NOT_RUN
m5a_final_cross_platform_ci: NOT_RUN
m5a_squash_merge: NOT_RUN
m5b: OPEN
h1: OPEN
```

The corrected Linux run was executed after the corrective behavior changes; its
Linux PASS is not inherited from the rejected candidate. Scenario F acquired a
fresh bootstrap ownership lease, located the actual dedicated Host lease backend,
and used PostgreSQL `pg_terminate_backend()` during `quiesce()`. It then proved
that the old managed Host was terminal/closed, no replacement Host was created,
the old token and revision were unchanged, the same PostgreSQL postmaster
continued running, the journal ended at `RECOVERY_REQUIRED` with `FAILED`, and a
competing bootstrap acquisition was rejected. The direct `pg` client and its
types are test-only bootstrap-runtime development dependencies, with an explicit
boundary exception limited to the live integration test.

## Historical Foundation M5A PONR close-rejection correction evidence (2026-08-22)

This addendum records the second independent review result and the subsequent
behavior correction. The review target remained exact at
`001ef97f070ecf3a6993c6e129a26de1925862e7`; the review returned `REQUEST_CHANGES`
for one new PONR failure-path blocker. The corrected candidate below is a new
behavior SHA and supersedes `9fd68d4656921c344a0ef637d31e91f127d53eaf` for
current M5A evidence.

```yaml
reviewed_head_sha: 001ef97f070ecf3a6993c6e129a26de1925862e7
review_outcome: REQUEST_CHANGES
new_blocker: "PONR old-Host close Promise rejection was not observed immediately"
previous_corrected_behavior_candidate_sha: 9fd68d4656921c344a0ef637d31e91f127d53eaf
corrected_behavior_candidate_sha: f9f105c47a8559d386fabd761d026441a8dd2764
ponr_close_rejection_observer: PASS
recovery_required_persisted_before_close_completion: PASS
close_failure_normal_maintenance_error_path: PASS
old_managed_host_terminal_on_close_failure: PASS
no_unhandled_rejection: PASS
close_failure_regression_delayed_host_token_journal: PASS
m5a_linux_real_pg: PASS
m5a_windows_real_pg: NOT_RUN
m5a_macos_real_pg: NOT_RUN
m5a_bootstrap_state_unit: "82 passed, 2 skipped"
m5a_private_postgres_unit: "58 passed"
m5a_host_ownership_unit: "70 passed"
m5a_bootstrap_runtime_unit: "86 passed, 1 skipped"
m5a_private_postgres_integration: "20/20 PASS"
m5a_host_ownership_integration: "8/8 PASS"
m5a_bootstrap_runtime_integration: "17/17 PASS"
m5a_pnpm_verify: PASS
m5a_prior_review: "REQUEST_CHANGES @ 001ef97f070ecf3a6993c6e129a26de1925862e7"
m5a_re_review: NOT_RUN
m5a_final_cross_platform_ci: NOT_RUN
m5a_squash_merge: NOT_RUN
m5b: OPEN
h1: OPEN
```

The regression starts retirement with an immediately rejected `host.close()`
Promise while deliberately delaying `HOST_TOKEN_REVOKED` journal advancement.
The candidate observes the rejection synchronously, keeps the managed Host
terminal, persists `RECOVERY_REQUIRED` while bootstrap ownership remains held,
and returns the close failure through the normal maintenance error path without
an `unhandledRejection` event. No PONR, Scenario F, PostgreSQL lifecycle, or
M5B scope was changed.

## Qualification remaining

This is implementation/product evidence, not a new dependency-selection
authority. Corrected-candidate M4 Linux/macOS evidence, M5A Windows/macOS real
PostgreSQL, source-less shipping and ReleaseManifest/SBOM closure, and
installer/service-account ACL behavior remain `NOT_RUN`. The latest M5A review
returned `REQUEST_CHANGES`; re-review of the corrected candidate and final
cross-platform CI remain `NOT_RUN`. The historical extracted Ubuntu package
runtime does not qualify the corrected M4 Linux claim; the M5A Linux PASS above
is limited to the recorded corrected candidate and scenarios.

## Historical Foundation M5A post-merge closure and M5B boundary (2026-08-22)

The corrected M5A candidate was independently reviewed and merged. This closes
the M5A reverse-handoff implementation milestone but does not claim M5B or H1
closure.

```yaml
m5a_reviewed_head_sha: 538cc6973fcd831cb47a60c5d126006032532591
m5a_independent_review: PASS
m5a_final_ci_run: 32570208341
m5a_final_ci_ubuntu: PASS
m5a_final_ci_macos: PASS
m5a_final_ci_windows: PASS
m5a_squash_merge_sha: 8acedfd49b0bcc42444389c3f28f206d4e8438b6
m5a_windows_real_pg: NOT_RUN
m5a_macos_real_pg: NOT_RUN
m5b: ACTIVE
h1: OPEN
```

The final CI projection verified the exact reviewed source SHA on all three
operating systems; it is not real PostgreSQL qualification. M5B remains
responsible for bounded abandoned-owner recovery, real process kill/restart,
and the remaining H1 semantic closure evidence.

## Historical Foundation M5B recovery qualification (2026-08-22)

M5B behavior candidate `c4c1be43f412c868a84a776461b479d3b677ea18` passed
specific Linux real-PostgreSQL and K1-K3 process subsets without changing the
M5A boundary. The exact review HEAD
`9e450f836466d32fb1f3d9027618fac236798eb9` received `REQUEST_CHANGES`.

```yaml
m5b_read_only_recovery_inspection: PASS
m5b_recovery_head_previous_validation: PASS
m5b_restart_stop_recovery_unit: PASS
m5b_live_advisory_owner_block: PASS
m5b_unknown_fence_token_block: PASS
m5b_corrupt_journal_block: PASS
m5b_linux_real_pg_restart_success_subset: PASS
m5b_linux_real_pg_live_host_block: PASS
m5b_linux_real_pg_corrupt_journal_block: PASS
m5b_linux_real_postgres_full_matrix: NOT_RUN
m5b_real_process_k1_k3: PASS
m5b_real_process_k4_actual_maintenance_recovery: NOT_RUN
m5b_real_process_k5_recovery_restartability: NOT_RUN
m5b_private_postgres_integration: PASS (20/20)
m5b_host_ownership_integration: PASS (8/8)
m5b_bootstrap_runtime_integration: PASS (20/20)
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

The Linux PostgreSQL subset provenance was the Ubuntu 26.04 security archive
`postgresql-18`/`postgresql-client-18` 18.6 package set, extracted to a
temporary qualification root with `libpq5` extracted for runtime linkage.
All five required binaries reported PostgreSQL 18.6. K1-K3 used real Node
child termination and stale-lock adjudication; the required real maintenance
K4/K5 paths and complete PG-1..PG-9 matrix remain `NOT_RUN` until rerun.

## Historical Foundation M5B first corrective real-PostgreSQL evidence — superseded (2026-08-23)

Behavior candidate `e7e46e8e1d58f15e254b9644f5b315cd34090360` had the following
Linux PostgreSQL 18.6 evidence before the second corrective review. The exact
review HEAD was `5e8f1aa475730aef982622d05cd488767ac0c08a`, and that review
returned `REQUEST_CHANGES`; this block is historical, not current truth.
The `private-postgres` and Host ownership real integration targets passed
20/20 and 8/8; the combined bootstrap-runtime integration target passed 28/28.
These are implementation evidence for the current M5B candidate, not a claim
of Windows/macOS, source-less, service-account ACL, or hardware qualification.

```yaml
behavior_candidate_sha: e7e46e8e1d58f15e254b9644f5b315cd34090360
rejected_review_head_sha: 5e8f1aa475730aef982622d05cd488767ac0c08a
review_outcome: REQUEST_CHANGES
runtime: "Node 24.19.0 / pnpm 11.22.0"
postgres_version: PostgreSQL 18.6
linux_real_pg_recovery: PASS
real_process_k1_k3: PASS
real_process_k4_actual_maintenance_recovery: PASS
real_process_k5_recovery_restartability: PASS
full_pg_1_to_pg_9_matrix: PASS
windows_real_pg_recovery: NOT_RUN
macos_real_pg_recovery: NOT_RUN
independent_review: FAIL
final_cross_platform_ci: NOT_RUN
```

The prior exact review at `9e450f836466d32fb1f3d9027618fac236798eb9` also
returned `REQUEST_CHANGES`. The second corrective cycle must replace the
mislabeled PG-1/PG-2 evidence and rerun deterministic K4/K5 before a new
candidate is submitted.

## Historical Foundation M5B second corrective review blockers (2026-08-23)

```yaml
behavior_candidate_sha: e7e46e8e1d58f15e254b9644f5b315cd34090360
rejected_review_head_sha: 5e8f1aa475730aef982622d05cd488767ac0c08a
review_outcome: REQUEST_CHANGES
legacy_m5a_journal_v1_compatibility: NOT_RUN
same_lease_prehost_bootstrap_continuation: NOT_RUN
pg1_pre_postgres_bootstrap_recovery: NOT_RUN
pg2_ready_before_handoff_recovery: NOT_RUN
real_process_k1_k3: PASS
real_process_k4_actual_maintenance_recovery: NOT_RUN
real_process_k5_recovery_restartability: NOT_RUN
linux_real_postgres_full_matrix: NOT_RUN
windows_real_pg_recovery: NOT_RUN
macos_real_pg_recovery: NOT_RUN
source_less_recovery: NOT_RUN
service_account_acl: NOT_RUN
hardware_power_loss: NOT_RUN
independent_review: FAIL
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

The M5A reverse-handoff and underlying private-PostgreSQL/Host ownership
evidence that is independent of the rejected K4/K5/PG-1/PG-2 claims remains
historical PASS evidence. The second corrective candidate must establish new
claim-matched runs before those withdrawn M5B rows can return to `PASS`.

## Historical Foundation M5B second corrective qualification (2026-08-23)

The second corrective behavior candidate
`55c58ed83d5e7b7ce964b659e6250b6f6580634d` now has claim-matched Linux
PostgreSQL 18.6 evidence. K1-K3 passed 3/3, deterministic K4/K5 passed 1/1
each, the dedicated pre-Host PG-1/PG-2 scenarios passed 1/1 each, and the
complete PG-1..PG-9 plus PG-5B/PG-6A/PG-6B matrix passed 11/11. The full
bootstrap-runtime integration target passed 29/29; private-postgres and
host-ownership real integration passed 20/20 and 8/8. `pnpm verify` passed.

PG-1 used a child killed before private PostgreSQL preparation and recovered
through bounded bootstrap-continuation `RECOVER`; PG-2 used a child killed
after PostgreSQL READY and before Host handoff and preserved cluster identity,
postmaster PID, and `pg_postmaster_start_time`. The current candidate's
independent review is `NOT_RUN`; Windows/macOS real PostgreSQL, source-less
recovery, service-account ACL, hardware power-loss, final CI, and merge remain
open, and H1 remains OPEN.

## Historical Foundation M5B third corrective qualification (2026-08-23)

The review at exact HEAD `445a77db3041644faccd85c00c826e8d26af3ea8` returned
`REQUEST_CHANGES`. The new behavior candidate is
`ce8ecbd2f54b6da39542845b1c23fbb959672c0a`; qualification-only PG-6A coverage
is in `a41dad0226310889f61515ba16ce910c1dbb0e53`.

The corrected candidate makes `INSPECT` genuinely read-only, with a 13/13
snapshot regression, and the real PostgreSQL 18.6 PG-6A scenario now uses the
literal legacy M5A late-stage target without `target.hostBootId`. It verifies
legacy B, fresh C, unchanged PostgreSQL identity, and explicit `hostBootId` in
the next durable revision. Unit counts are current: bootstrap-recovery 13/13,
host-maintenance-recovery 23/23, and recovery-command 7/7; full
bootstrap-runtime unit output is 155 passed/1 skipped.

All previously recorded Linux K1-K5, PG-1/PG-2, PG matrix, private-postgres,
Host ownership, bootstrap-runtime integration, and `pnpm verify` evidence was
rerun for this candidate. Independent review is `NOT_RUN`; final CI and merge
remain unauthorized, and H1 remains OPEN.

## Historical Foundation M5B post-merge reconciliation (2026-08-23)

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

The final manual workflow verified the exact reviewed SHA on all three
platforms. This is repository verification, not real PostgreSQL qualification
on Windows or macOS. Source-less recovery, service-account ACL, and hardware
power-loss remain `NOT_RUN`.
