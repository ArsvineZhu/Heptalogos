# Q-SUBJECT-OPENCLAW-LOCAL-01 — Subject OpenClaw Runtime

```yaml
qualificationId: Q-SUBJECT-OPENCLAW-LOCAL-01
plan: project/plans/completed/product/p3-subject-openclaw-runtime-integration-2026-09-04.md
date: 2026-09-05
evidenceStatus: PASS
testedProperty: isolated public OpenClaw Subject cognition proposal transport, Heptalogos Review/CommunicationCommit Authority, independent Expression, and bounded runtime lifecycle
```

## Boundary and environment

```yaml
platform: Windows x64
shell: PowerShell
runtime: Node 24.20.0
packageManager: pnpm 11.24.0
postgres: PostgreSQL 18.6
database: real private PostgreSQL with the current canonical schema
durableExecution: real DBOS adapter
subjectProvider: local loopback OpenAI-compatible fixture
openclawRootPackage: 2026.9.1
openclawGatewayClientPackage: 2026.9.1
openclawGatewayProtocolPackage: 2026.9.1
openclawWireProtocol: 4
```

## Acceptance claims

```yaml
exactVersionAndWirePreflight: PASS
publicGatewayHandshakeAndReadiness: PASS
typedProposalToolCatalog: PASS
separateSubjectProfileAndStateRoots: PASS
subjectToolAllowlistAndDeniedAmbientTools: PASS
boundedReactionContextProjection: PASS
noCommunicationTerminalReactionWithoutCommitOrOutbound: PASS
communicationReviewCommitExpressionSingleOutbound: PASS
staleAuthorityOrMailboxProposalRejected: PASS
configurationChangeRuntimeReconciliation: PASS
readinessMatchesCurrentProjection: PASS
crashAfterCommunicationCommitExpressionReentry: PASS
crashAfterOutboundBeforeWorkItemCompletion: PASS
restartPreservesSubjectAndCanonicalTruth: PASS
stopSerializesInFlightStartAndChildCleanup: PASS
openclawPrivateStateNotReadAsCanonicalTruth: PASS
```

The communication and no-communication claims are based on terminal Reaction
state and canonical PostgreSQL rows, not on HTTP admission alone. The
post-commit crash path proves that Expression can complete without another
primary cognition run. The outbound-before-WorkItem-completion path proves
restart reconciliation finds the existing MessageFact rather than creating a
duplicate.

## Explicitly unexecuted boundaries

```yaml
liveExternalProvider: NOT_RUN
otherOperatingSystems: NOT_RUN
sourceLessArtifact: NOT_RUN_IN_P3_CLOSED_BY_P4
installedServiceOrDaemon: NOT_RUN
serviceAccountAcl: NOT_RUN
codeSigningOrNotarization: NOT_RUN
machineOperationsOpenClawDistribution: NOT_RUN
hardwarePowerLoss: NOT_RUN
```
