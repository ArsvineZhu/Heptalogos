# P3 — Subject OpenClaw Runtime Integration — Completion Record

## Authorization and result

```yaml
plan: tmp/heptalogos-next-spec-pack-2026-09-04/P3-subject-openclaw-runtime-integration.md
baseline: 43821da4caaa8b0f77c2712494bd636c7306d0c2
executionDate: 2026-09-05
state: COMPLETED
result: PASS
nextStage: P4_PORTABLE_PRODUCT_ROOT_SOURCE_LESS
```

This record closes the P3 implementation boundary under the continuous
Product Reality Convergence authorization. The old stage-local `STOP` wording
was not treated as an approval gate; current truth was updated and execution
continued directly to P4.

## Implemented current shape

Product Host now composes one narrow `SubjectCognitionRuntime` port with an
isolated Product-supervised OpenClaw Gateway adapter. The adapter projects the
current Heptalogos Subject cognition ConfigurationRevision, gateway transport
revision, Subject primary ModelBinding/Profile, and authorized SecretRef into
generated provider configuration. Subject, Review, CommunicationCommit,
Expression, Messaging, and canonical identity remain Heptalogos-owned.

The runtime uses the public OpenClaw Gateway/client and Plugin contracts only:

```text
OpenClaw profile = subject
OpenClaw version = 2026.9.1
Gateway client package = 2026.9.1
Gateway protocol package = 2026.9.1
wire protocol = 4
proposal tools = heptalogos_propose_communication,
                 heptalogos_complete_without_communication
```

The two tools are proposal transport. Their handlers return acknowledgements
and do not write canonical state or external effects. The adapter accepts the
first valid terminal proposal, settles the public run lifecycle, records
provider provenance, and leaves deterministic Review to Subject. Expression
continues on the existing AIRuntime path.

Runtime start, replacement, recovery, and stop are serialized inside the
existing Product Host adapter. A current projection fingerprint is compared
with the live runtime before reporting Subject cognition `READY`; a changed
projection cannot be reported as current. Terminal shutdown closes admission,
cancels recovery, waits for in-flight startup, removes the runtime descriptor,
and recovers child/client cleanup errors instead of discarding them.

## Executed evidence

```text
exact OpenClaw root/client/protocol and wire-version preflight             PASS
public Gateway/client handshake and readiness probe                        PASS
typed Plugin tool catalog and invocation probe                             PASS
separate named profile/state-root collision probe                          PASS
Product Host integration: 2 files, 12 tests                                PASS
configuration owner/activation/consumer plan assertions                     PASS
Subject OpenClaw readiness and configuration replacement                     PASS
stale Subject authority/mailbox proposal rejection                         PASS
post-CommunicationCommit Expression completion after runtime disruption    PASS
Subject OpenClaw crash/restart with canonical identity continuity           PASS
P1 prepared-inbound stale-authority follow-up debt                          PASS
P1 outbound-committed/pre-WorkItem-completion follow-up debt                PASS
```

The Product Host integration used Windows x64, real private PostgreSQL,
DBOS/WorkQueue/Signal, the built Host and CLI, and one shared internal
loopback OpenAI-compatible fixture for model mechanics. The fixture is not
live-provider evidence. The integration reads Heptalogos canonical data and
does not inspect OpenClaw private SQLite/state formats.

The two P1 follow-up boundaries were exercised in this continuous P3 run. E
prepared inbound work under the old Subject authority while a concurrent stop
held the authority fence and received `subject.stale_authority_revision`. H3
held the WorkItem after one outbound MessageFact had committed, crashed the
Host, and after restart reconciled that existing fact to `SUCCEEDED` without a
duplicate outbound.

## Qualification boundary

```yaml
platform: Windows x64
runtime: Node 24.20.0
postgres: PostgreSQL 18.6
openclaw: 2026.9.1
wireProtocol: 4
modelBoundary: local loopback fixture
externalLiveProvider: NOT_RUN
sourceLessPortableArtifact: NOT_RUN_IN_P3_CLOSED_BY_P4
otherOperatingSystems: NOT_RUN
installedService: NOT_RUN
serviceAccountAcl: NOT_RUN
machineOperationsOpenClaw: NOT_RUN
```

P3 does not claim the separate Machine Operations OpenClaw role, live external
provider behavior, source-less packaging, another operating system, service
installation, ACLs, signing, or hardware behavior.
