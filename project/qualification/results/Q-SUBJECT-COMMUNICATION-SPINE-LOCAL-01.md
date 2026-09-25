# Q-SUBJECT-COMMUNICATION-SPINE-LOCAL-01 Subject communication-spine local qualification

```yaml
qualificationId: Q-SUBJECT-COMMUNICATION-SPINE-LOCAL-01
plan: project/plans/completed/product/p1-subject-communication-spine-correction-2026-09-04.md
date: 2026-09-04
evidenceStatus: PASS
testedProperty: accepted MessageFact through bounded conversation proposal, optional CommunicationCommit, independent Expression, and exactly-once local outbound MessageFact with Subject authority fencing and process re-entry
testedRevision: ddb42f09c83149c024b8165a122c59d1724a5066 baseline plus the current P1 working tree at qualification time
continuousFollowUp:
  plan: tmp/heptalogos-next-spec-pack-2026-09-04/P3-subject-openclaw-runtime-integration.md
  date: 2026-09-05
  evidenceStatus: PASS
```

## Boundary and environment

This record proves the executed Windows process-level Product L4 property for
the current bounded communication slice. `evidenceStatus: PASS` applies to
that executed local property; individual boundaries not executed below remain
`NOT_RUN`. It does not prove a source-less artifact, another operating system,
an installed service, or a live external provider.

```yaml
platform: Windows x64
shell: PowerShell
runtime: Node 24.20.0
packageManager: pnpm 11.24.0
postgres: PostgreSQL 18.6
postgresToolchain: tmp/pg/extracted/pgsql/bin
database: real private PostgreSQL with the current canonical schema
keyring: Windows OS credential store
durableExecution: real DBOS adapter and durable dispatch
workQueue: real WorkQueue and Signal services
http: built Product Host process with Management and Subject Chat on one listener
aiBoundary: real AIRuntime, NetworkAccess, Secret, and AI SDK adapters
gatewayFixture: loopback OpenAI-compatible HTTP fixture only at the gateway boundary
externalLiveProvider: NOT_RUN
```

## Executed evidence

```text
pnpm nx run product-host-integration:test --skip-nx-cache        PASS
pnpm nx run foundation-contracts:build --skip-nx-cache          PASS
pnpm nx run subject:build --skip-nx-cache                       PASS
pnpm nx run canonical-schema:test --skip-nx-cache               PASS
pnpm nx run foundation-contracts:test --skip-nx-cache            PASS
pnpm nx run subject:lint --skip-nx-cache                        PASS
pnpm nx run foundation-contracts:lint --skip-nx-cache            PASS
pnpm nx run messaging:lint --skip-nx-cache                      PASS
pnpm nx run canonical-schema:lint --skip-nx-cache                PASS
pnpm format:check                                                PASS
pnpm check:static                                                 PASS
pnpm verify                                                       PASS
pnpm check:repo                                                    PASS
git diff --check                                                  PASS
```

The real Product Host integration executed two test files and eleven tests.
It used the built Host, real private PostgreSQL, DBOS, WorkQueue/Signal,
Management session, Subject Chat HTTP route, canonical MessageFact tables,
and the real AIRuntime/NetworkAccess/AI SDK path. The loopback fixture returned
controlled structured proposals and expression text; it was not treated as a
live NewAPI, DeepSeek, or other upstream-provider result.

## Acceptance boundaries

```yaml
A_no_communication_without_commit_or_outbound: PASS
B_communication_commit_independent_expression_one_outbound: PASS
C_stop_before_communication_commit_supersedes_stale_reaction: PASS
D_stop_after_communication_commit_allows_outbound_completion: PASS
E_prepared_inbound_old_authority_revision_rejected: PASS
F_second_inbound_supersedes_only_precommit_reaction: PASS
G_context_projection_excludes_consumed_earlier_facts: PASS
H1_crash_before_proposal_acceptance_retries_primary: PASS
H2_crash_after_communication_commit_before_outbound_reenters_expression: PASS
H3_crash_after_outbound_before_work_item_completion: PASS
current_runtime_obsolete_machinery_absent: PASS
cross_platform_qualification: NOT_RUN
source_less_qualification: NOT_RUN
installed_service_qualification: NOT_RUN
live_external_provider_qualification: NOT_RUN
```

H1 killed the built Host while the slow primary invocation was in flight before
proposal acceptance. After restart, the same durable work re-entered primary,
then Expression and produced the expected outbound fact. H2 killed the Host
after a durable CommunicationCommit while slow Expression was in flight. After
restart, re-entry resumed Expression without another primary invocation and
materialized exactly one outbound MessageFact. The integration also proved
post-commit stop does not erase the committed communication.

The original P1 execution recorded E and H3 as `NOT_RUN` because those two
internal timing boundaries were not exercised in that run. During the
continuing, explicitly authorized P3 execution, the same current Product Host
and real private PostgreSQL fixture exercised both boundaries: E prepared an
inbound message under the old Subject authority while a concurrent stop held
the Subject authority fence and received `subject.stale_authority_revision`;
H3 held the WorkItem after one outbound MessageFact had committed, crashed the
Host, and after restart reconciled the existing fact to `SUCCEEDED` without a
duplicate outbound. The current statuses above are therefore `PASS` for this
follow-up evidence, while the historical P1 execution state remains
`NOT_RUN`.
