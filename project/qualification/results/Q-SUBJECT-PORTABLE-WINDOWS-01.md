# Q-SUBJECT-PORTABLE-WINDOWS-01 — Portable Product Reality

```yaml
qualificationId: Q-SUBJECT-PORTABLE-WINDOWS-01
plan: project/plans/completed/product/p4-portable-product-root-source-less-2026-09-04.md
date: 2026-09-05
evidenceStatus: PASS
artifact: C:\Users\Arsvine\AppData\Local\Temp\heptalogos-portable-product-20260905-final-acceptance-5
platform: Windows x64
```

## Candidate inventory

```yaml
productGeneration: aa2266e721df50cdc427d8e38e1630a1b659f25cc99c8766f5bb61b343893a4b
bootstrapGeneration: 8709e0d74b8e230517fede8596e92a555232949cb10a4ba79a3bac3153e6cb18
node: 24.20.0
postgresql: 18.6
openclaw: 2026.9.1
gatewayClient: 2026.9.1
gatewayProtocol: 2026.9.1
wireProtocol: 4
dependencyClosure: pnpm deploy --legacy --config.node-linker=hoisted --prod --ignore-scripts
persistedPostgresPort: 41792
installationId: 01a07071-3697-7754-b369-fd4e7fb98849
instanceId: 01a07071-3697-72f6-a5ae-536bf5aee71d
subjectId: 01a07071-6c33-7340-acd5-26df990c89f3
initialBootId: 01a07071-3fa4-73a1-b679-304ac48dbd77
restartBootId: 01a07073-f9b8-7184-ae55-aa6ea22ddcb1
initialQuietReactionId: 01a07072-f8c2-7591-a26a-f03809a6ea08
initialCommunicationReactionId: 01a07072-fd6f-7059-ae21-36fb00cfddba
communicationCommitId: 01a07072-fea3-74c7-8674-d91f1d79fef1
outboundMessageId: 01a07072-fedd-740e-a011-e650f82d6ee9
restartReactionId: 01a07074-b9a4-712c-b3df-739b3ef53788
```

## Qualification claims

```yaml
artifactCopiedOutsideRepository: PASS
firstStartWithoutLocator: PASS
firstStartDerivesLocatorFromCurrentPath: PASS
privateNodeWithDeveloperNodeAbsentFromPATH: PASS
privatePostgresWithDeveloperPostgresAbsentFromPATH: PASS
noRuntimeRegistryInstall: PASS
noWorkspaceReparseOrSourceLink: PASS
exactOpenClawAxesResolvedFromArtifact: PASS
manifestAndLicenseInventoryPresent: PASS
protectedClaimAndLogin: PASS
configurationAndSecretRefSetup: PASS
subjectOpenClawReady: PASS
noCommunicationTerminalProof: PASS
communicationExpressionOutboundTerminalProof: PASS
normalConsoleCtrlCProductShutdown: PASS
samePositionRestartIdentityContinuity: PASS
postRestartInteractionTerminalProof: PASS
```

Initial scenario output was `P4_INITIAL_SCENARIO_PASS`: the quiet Reaction was
`NO_COMMUNICATION` with null CommunicationCommit and a successful WorkItem;
the communication Reaction was `REPLIED` with one CommunicationCommit, one
successful Expression WorkItem, and one outbound MessageFact linked by
`caused_by_communication_commit_id`. Restart output was
`P4_RESTART_SCENARIO_PASS` and again reached `NO_COMMUNICATION` with a
successful WorkItem.

Normal shutdown was driven by a real console Ctrl+C in a persistent terminal,
not `process.kill(pid, "SIGINT")`. Before answering the wrapper's batch
confirmation, endpoint and postmaster state were absent and the candidate's
Node/OpenClaw/PostgreSQL processes were gone. This qualifies Product shutdown
and resource ownership; it does not turn the batch wrapper into a service
manager.

An earlier development-only probe against a predecessor copy was interrupted
when its temporary loopback provider had already been stopped; it is not part
of this qualification result. The final copied artifact was rerun with the
provider alive and produced PASS for both initial and restart scenarios.

## Not run

```yaml
otherOperatingSystems: NOT_RUN
otherArchitectures: NOT_RUN
serviceOrDaemonInstallation: NOT_RUN
serviceAccountAcl: NOT_RUN
installerUninstaller: NOT_RUN
codeSigningNotarization: NOT_RUN
tufUpdateRemoteRelease: NOT_RUN
hardwarePowerLoss: NOT_RUN
machineOperationsOpenClaw: NOT_RUN
liveExternalProvider: NOT_RUN
```
