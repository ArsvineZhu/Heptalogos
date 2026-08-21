# Q-PRIVATE-POSTGRES-01 Private PostgreSQL bootstrap qualification

```yaml
qualificationId: Q-PRIVATE-POSTGRES-01
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "Exact PostgreSQL 18.6 private bootstrap initialization, portable identity, bounded lifecycle, ownership-held handoff, and fail-closed recovery boundaries"
```

## Current-host evidence

```yaml
platform: Linux x86_64
runtime: "Node 24.19.0 / pnpm 11.22.0"
postgres_provenance: "Ubuntu 18.6-0ubuntu0.26.04.1 package artifacts extracted into a temporary qualification root"
candidate_sha: 46e66c776f17b43ae06c0cef8229c4cd4666919c
```

All five required tools reported PostgreSQL 18.6 with the Ubuntu package
suffix: `postgres`, `initdb`, `pg_ctl`, `pg_controldata`, and `pg_isready`.

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
linux_real_pg: PASS
windows_real_pg: NOT_RUN
macos_real_pg: NOT_RUN
source_less_shipping_closure: NOT_RUN
service_account_acl_closure: NOT_RUN
```

The current-host evidence was produced by the private-postgres lifecycle
integration suite, the bootstrap-runtime orchestration/failure-matrix suite,
and the repository dependency, boundary, typecheck, TS6, lint, test, and build
gates. The test fixtures assert that the sentinel password is absent from
generated BootstrapState, BootstrapJournal, and PostgreSQL log evidence; the
credential-file helper removes the ephemeral password file after the bounded
callback.

## Qualification remaining

This is implementation/product evidence, not a new dependency-selection
authority. Windows/macOS real PostgreSQL, source-less shipping and
ReleaseManifest/SBOM closure, and installer/service-account ACL behavior remain
`NOT_RUN`. The extracted Ubuntu package runtime does not qualify those claims.
