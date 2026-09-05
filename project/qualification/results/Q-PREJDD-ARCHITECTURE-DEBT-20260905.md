# Q-PREJDD-ARCHITECTURE-DEBT-20260905 Pre-JDD Architecture Debt Refactoring evidence

```yaml
qualificationId: Q-PREJDD-ARCHITECTURE-DEBT-20260905
plan: project/plans/completed/repository/pre-jdd-architecture-debt-refactoring-2026-09-05.md
date: 2026-09-05
evidenceStatus: PASS
testedProperty: current architecture-debt refactoring, split semantic owners, modern portable assembly, and Windows x64 portable Product interaction/restart
testedRevision: HEAD aee3c1059942e3b701c89513a5ef1df8eb1e2009 plus the current uncommitted working tree
platform: Windows x64
runtime: Node 24.20.0
packageManager: pnpm 11.24.0
postgres: PostgreSQL 18.6
providerBoundary: deterministic local loopback OpenAI-compatible gateway fixture
```

## Boundary and environment

This record proves the current implementation and the executed Windows x64
portable-candidate property. The candidate was assembled through the modern
pnpm deployment route in a disposable OS temporary staging workspace and then
moved outside the repository. The source workspace remained unchanged during
qualification. The portable scenario used the bundled Node/PostgreSQL
toolchains, real private PostgreSQL, DBOS, WorkQueue/Signal, Management, the
Subject Chat route, and the deterministic loopback gateway fixture.

The provider fixture is local test evidence. It does not upgrade the result to
live external-provider evidence. The bounded stop path verified that owned
Product runtime processes were gone before the same candidate was restarted;
the automated Windows harness used process termination plus the bundled
PostgreSQL control command where required by Windows child-process signal
behavior, not a claim of console Ctrl+C automation.

## Executed evidence

```text
pnpm exec tsc --noEmit -p integration/product-host/tsconfig.json                         PASS
pnpm exec vitest run --root integration/product-host \
  test/management-ai-actions.integration.test.ts \
  test/management-auth.integration.test.ts \
  test/management-runtime.integration.test.ts \
  test/subject-reentry.integration.test.ts \
  test/subject-chat.integration.test.ts                                                   PASS (5 files, 8 tests)
pnpm check:knowledge                                                                    PASS
pnpm docs:api:check                                                                      PASS
pnpm check:repo                                                                          PASS
pnpm exec prettier --check .                                                              PASS
pnpm verify                                                                               PASS
pnpm qualify:portable                                                                     PASS
static obsolete-production search                                                         PASS
```

The focused scenario run used real private PostgreSQL and the deterministic
loopback gateway fixture. It passed the finite Management action routes,
Subject authority fencing, optional `NO_COMMUNICATION`, CommunicationCommit →
Expression → outbound MessageFact, re-entry, and restart-continuity scenarios.

## Proven current changes

```yaml
modern_pnpm_portable_assembly: PASS
source_workspace_unchanged_by_assembly: PASS
subject_openclaw_projection_gateway_execa_facade_split: PASS
subject_openclaw_unexpected_exit_is_explicitly_recoverable: PASS
subject_openclaw_autonomous_retry_backoff_absent: PASS
finite_management_system_action_catalog: PASS
subject_repository_authority_reaction_communication_split: PASS
messaging_repository_cursor_service_split: PASS
ai_runtime_repository_routing_invocation_service_split: PASS
product_host_integration_scenario_split: PASS
portable_windows_x64_candidate_outside_source_tree: PASS
portable_management_subject_chat_restart_continuity: PASS
owned_process_cleanup_before_restart: PASS
```

## Qualification boundary

```yaml
deterministic_local_gateway_fixture: PASS
live_external_provider: NOT_RUN
other_operating_systems: NOT_RUN
other_architectures: NOT_RUN
service_or_daemon_installation: NOT_RUN
installer_or_uninstaller: NOT_RUN
code_signing_or_notarization: NOT_RUN
machine_operations_openclaw: NOT_RUN
hardware_power_loss: NOT_RUN
```

This is a current implementation and Windows x64 portable-candidate evidence
record. It is not a release ledger, installer/service qualification, or live
provider certification.
