# Q-SUBJECT-L4-LOCAL-01 Persistent Subject L4 local qualification

```yaml
qualificationId: Q-SUBJECT-L4-LOCAL-01
plan: project/plans/completed/product/persistent-subject-l4-vertical-slice-2026-09-04.md
date: 2026-09-04
evidenceStatus: PASS
testedProperty: persistent Subject identity, built-in Subject Chat, durable Reaction, deterministic REPLY/SILENCE, fenced commits, and exactly-once local outbound MessageFact
```

## Boundary and environment

This record proves the current Windows process-level Product L4 route in the
working tree. It does not prove a source-less artifact, another operating
system, an installed service, or a live external provider.

```yaml
platform: Windows x64
shell: PowerShell
runtime: Node 24.20.0
packageManager: pnpm 11.24.0
postgres: PostgreSQL 18.6
postgresToolchain: tmp/pg/extracted/pgsql/bin
database: real private PostgreSQL with canonical schema
keyring: Windows OS credential store
durableExecution: real DBOS adapter and durable dispatch
workQueue: real WorkQueue and Signal services
http: built ProductHost process with Management and Subject Chat on one listener
aiBoundary: real AIRuntime, NetworkAccess, Secret, and AI SDK adapters
gatewayFixture: loopback OpenAI-compatible HTTP fixture only at the gateway boundary
externalLiveProvider: NOT_RUN
```

## Executed evidence

```text
pnpm check:repo --skip-nx-cache                              PASS
pnpm verify --skip-nx-cache                                 PASS
pnpm nx run product-host-integration:test --skip-nx-cache   PASS
pnpm nx run subject-chat-client:generate:check --skip-nx-cache PASS
```

The Product Host integration executed two test files and eleven tests. The
Subject L4 scenario used the real built Host, real private PostgreSQL, DBOS,
WorkQueue/Signal, Management session, Subject Chat HTTP route, canonical
MessageFact tables, and real AIRuntime/NetworkAccess/AI SDK code. The loopback
fixture returned controlled primary REPLY/SILENCE proposals and expression
text; it was not treated as a live NewAPI or upstream-provider result.

## Acceptance boundaries

```yaml
persistent_identity_start_restart: PASS
reply_decision_communication_and_outbound: PASS
silence_without_communication_or_outbound: PASS
inbound_idempotent_replay: PASS
inbound_idempotency_conflict: PASS
supersession_and_newer_work_processability: PASS
stop_fence_and_admission_rejection: PASS
dependency_unavailable_blocked_status: PASS
crash_after_communication_before_expression_completion: PASS
decision_commit_immutable_across_reentry: PASS
crash_before_decision_commit: NOT_RUN
crash_between_decision_and_communication_commit: NOT_RUN
crash_after_outbound_message_commit: NOT_RUN
cross_platform_qualification: NOT_RUN
source_less_qualification: NOT_RUN
live_gateway_qualification: NOT_RUN
```

The crash test killed the built Host while a slow `subject.expression` request
was in flight after the Reaction had a REPLY DecisionCommit and
CommunicationCommit. After restart, DBOS/WorkQueue re-entry produced exactly
one outbound MessageFact and restored the Subject status to READY. No protected
external credential or remote gateway was used.
