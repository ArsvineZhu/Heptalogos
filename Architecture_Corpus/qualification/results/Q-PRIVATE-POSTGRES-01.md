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
candidate_sha: b0f01aaa00acd505754acaaed31cf4e05e6892bd
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
ownership_release_capability_not_exposed: PASS
ownership_release_start_fenced: PASS
start_timeout_background_outcome_proven: PASS
restart_uncertain_stop_proven: PASS
windows_real_pg: PASS
linux_real_pg: NOT_RUN
macos_real_pg: NOT_RUN
source_less_shipping_closure: NOT_RUN
service_account_acl_closure: NOT_RUN
```

The Windows evidence was produced by:

- `pnpm nx run private-postgres:test:integration` — 20/20 PASS.
- `pnpm exec vitest run --root packages/bootstrap-runtime src/private-postgres-bootstrap.integration.test.ts --testTimeout=120000` — 9/9 PASS.
- `pnpm exec vitest run --root packages/private-postgres src/controller.lifecycle.test.ts` — PASS; the timed-out `pg_ctl` start path performs status/stop/status proof before returning the original error.
- `pnpm test` — 30 private-postgres unit tests and 44 bootstrap-runtime unit tests passed, with one pre-existing skipped test.
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
