# Foundation M5B Bounded Bootstrap Recovery & H1 Closure

> Approved execution source: `/home/arsvine/下载/M5B-Bounded-Bootstrap-Recovery-H1-Closure-Implementation-Plan-2026-08-22.md`.
> This repository record tracks execution state; the external plan remains the
> complete task specification.

**Status:** ACTIVE — M5A and the M5B implementation are merged; H1 remains
open for residual product/platform qualification.

## Baseline and boundary

```text
master baseline = 8acedfd49b0bcc42444389c3f28f206d4e8438b6
M5A reviewed SHA = 538cc6973fcd831cb47a60c5d126006032532591
M5A independent review = PASS
M5A final CI run = 32570208341 (Ubuntu/macOS/Windows PASS)
M5A squash merge = 8acedfd49b0bcc42444389c3f28f206d4e8438b6
M5B implementation = MERGED in PR #8 squash commit
f16071cbff3e30cd4f839716130270770e99075a
H1 = OPEN
```

M5B uses the one existing `.heptalogos-bootstrap.lock` protocol. Normal boot
never reclaims stale ownership. Recovery requires an authentic local
`LOCAL_INSTALLATION_OWNER`, proves process-generation abandonment, revalidates
the actual PostgreSQL/Host state after acquiring the same bootstrap lease, and
publishes a fresh Host token. No force-unlock, second lock, remote recovery,
generic recovery engine, H2A, H2B, Management, or product restore/update work
is in scope.

## Execution checklist

- [x] Correct the bootstrap-lock provider route with reproducible delayed and
      N-way stale-reclaimer evidence.
- [x] Add fail-closed process-generation identity classification.
- [x] Add versioned, digested owner/attempt witnesses and bind every normal
      bootstrap lease to an owner witness.
- [x] Prove the instance-bound `LOCAL_INSTALLATION_OWNER` recovery principal.
- [x] Implement read-only recovery inspection and bounded same-lock reclaim.
- [x] Expose a validated previous MaintenanceJournal revision for
      `RECOVERY_REQUIRED`.
- [x] Recover interrupted M5A restart/stop operations without token reuse,
      unnecessary restart, live-Host theft, or journal inference.
- [x] Expose only fixed `INSPECT` and `RECOVER` recovery command semantics.
- [x] Qualify the complete real PostgreSQL 18.6 recovery matrix and real
      M5A/M5B process kill/restart semantics.
- [x] Run H1 regression/boundary verification and record exact behavior SHA.
- [x] Obtain independent review of the exact SHA, dispatch exact-SHA
      cross-platform final CI, and squash-merge the PR.
- [x] Reconcile the merged plan/roadmap/qualification truth; H1 remains OPEN
      only for the residual qualifications explicitly listed below.

## Required truth vocabulary

Verification fields use only `PASS | FAIL | NOT_RUN | BLOCKED`. Residual
Windows/macOS real PostgreSQL, source-less invocation, service-account ACL,
and hardware power-loss claims remain `NOT_RUN` unless actually qualified;
they must not be upgraded by unit tests or generic cross-platform CI.

## PR8 corrective review baseline — rejected candidate (2026-08-23)

```yaml
behaviorCandidateSha: c4c1be43f412c868a84a776461b479d3b677ea18
rejectedReviewHeadSha: 9e450f836466d32fb1f3d9027618fac236798eb9
rejectedReviewOutcome: REQUEST_CHANGES
node: 24.19.0
pnpm: 11.22.0
postgres: 18.6
bootstrapRuntimeUnit: PASS (123 passed, 1 skipped)
bootstrapStateUnit: PASS (98 passed, 2 skipped)
recoveryProcessK1K3: PASS
recoveryProcessK4ActualMaintenance: NOT_RUN
recoveryProcessK5RecoveryRestartability: NOT_RUN
linuxPostgresRestartSuccessSubset: PASS
linuxPostgresLiveHostBlock: PASS
linuxPostgresCorruptJournalBlock: PASS
linuxPostgresFullMatrixPg1Pg9: NOT_RUN
privatePostgresIntegration: PASS (20/20)
hostOwnershipIntegration: PASS (8/8)
bootstrapRuntimeIntegration: PASS (subset only; full PG-1..PG-9 matrix NOT_RUN)
independentReview: FAIL
finalCrossPlatformCi: NOT_RUN
squashMerge: NOT_RUN
M5B: ACTIVE
H1: OPEN
```

Independent review returned `REQUEST_CHANGES` at the rejected exact HEAD
`9e450f836466d32fb1f3d9027618fac236798eb9`. K4/K5 actual maintenance/recovery
and the complete Linux PG-1..PG-9 matrix were not proven by that candidate.
Windows/macOS real PostgreSQL, source-less recovery, service-account ACL, and
hardware power-loss evidence remain `NOT_RUN`.

## PR8 first corrective qualification candidate — superseded (2026-08-23)

```yaml
behaviorCandidateSha: e7e46e8e1d58f15e254b9644f5b315cd34090360
rejectedReviewHeadSha: 5e8f1aa475730aef982622d05cd488767ac0c08a
rejectedReviewOutcome: REQUEST_CHANGES
node: 24.19.0
pnpm: 11.22.0
postgres: 18.6
bootstrapRuntimeUnit: PASS (144 passed, 1 skipped)
bootstrapStateUnit: PASS (107 passed, 2 skipped)
recoveryProcessK1K3: PASS (3/3)
recoveryProcessK4ActualMaintenance: PASS (1/1)
recoveryProcessK5RecoveryRestartability: PASS (1/1)
linuxPostgresRestartSuccessSubset: PASS
linuxPostgresLiveHostBlock: PASS
linuxPostgresCorruptJournalBlock: PASS
linuxPostgresFullMatrixPg1Pg9: PASS (11/11 including 5B/6A/6B split cases)
privatePostgresIntegration: PASS (20/20)
hostOwnershipIntegration: PASS (8/8)
bootstrapRuntimeIntegration: PASS (28/28)
repositoryVerify: PASS
independentReview: FAIL
finalCrossPlatformCi: NOT_RUN
squashMerge: NOT_RUN
M5B: ACTIVE
H1: OPEN
```

The prior review at `9e450f836466d32fb1f3d9027618fac236798eb9` also returned
`REQUEST_CHANGES`. This block records the first corrective candidate only; the
second review found RC-6 through RC-9 and invalidated its K4/K5 and full-matrix
qualification claims.

## PR8 second corrective review blockers (2026-08-23)

```yaml
behaviorCandidateSha: e7e46e8e1d58f15e254b9644f5b315cd34090360
rejectedReviewHeadSha: 5e8f1aa475730aef982622d05cd488767ac0c08a
rejectedReviewOutcome: REQUEST_CHANGES
legacyM5aJournalV1Compatibility: NOT_RUN
sameLeasePrehostBootstrapContinuation: NOT_RUN
pg1PrePostgresBootstrapRecovery: NOT_RUN
pg2ReadyBeforeHandoffRecovery: NOT_RUN
recoveryProcessK1K3: PASS
recoveryProcessK4ActualMaintenance: NOT_RUN
recoveryProcessK5RecoveryRestartability: NOT_RUN
linuxPostgresFullMatrixPg1Pg9: NOT_RUN
windowsRealPostgres: NOT_RUN
macosRealPostgres: NOT_RUN
sourceLessRecovery: NOT_RUN
serviceAccountAcl: NOT_RUN
hardwarePowerLoss: NOT_RUN
independentReview: FAIL
finalCrossPlatformCi: NOT_RUN
squashMerge: NOT_RUN
M5B: ACTIVE
H1: OPEN
```

The repository retains the behavior SHA separately from both rejected review
HEADs. The next behavior-bearing commits must close RC-6 through RC-9 before a
new exact review target is created; no final CI or merge is authorized.

## PR8 second corrective qualification candidate (2026-08-23)

```yaml
behaviorCandidateSha: 55c58ed83d5e7b7ce964b659e6250b6f6580634d
node: 24.19.0
pnpm: 11.22.0
postgres: 18.6
legacyM5aJournalV1Compatibility: PASS
sameLeasePrehostBootstrapContinuation: PASS
bootstrapRuntimeUnit: PASS (155 passed, 1 skipped)
bootstrapStateUnit: PASS (113 passed, 2 skipped)
recoveryProcessK1K3: PASS (3/3)
recoveryProcessK4ActualMaintenance: PASS (1/1)
recoveryProcessK5RecoveryRestartability: PASS (1/1)
pg1PrePostgresBootstrapRecovery: PASS (1/1)
pg2ReadyBeforeHandoffRecovery: PASS (1/1)
linuxPostgresFullMatrixPg1Pg9: PASS (11/11 including 5B/6A/6B split cases)
privatePostgresIntegration: PASS (20/20)
hostOwnershipIntegration: PASS (8/8)
bootstrapRuntimeIntegration: PASS (29/29)
repositoryVerify: PASS
independentReview: NOT_RUN
finalCrossPlatformCi: NOT_RUN
squashMerge: NOT_RUN
M5B: ACTIVE
H1: OPEN
```

The current candidate's review status is `NOT_RUN`; the prior
`REQUEST_CHANGES` outcomes at `5e8f1aa475730aef982622d05cd488767ac0c08a` and
`9e450f836466d32fb1f3d9027618fac236798eb9` remain historical. Windows/macOS
real PostgreSQL, source-less recovery, service-account ACL, hardware power-loss,
final CI, squash merge, and H1 closure remain open.

## PR8 third corrective qualification candidate (2026-08-23)

```yaml
behaviorCandidateSha: ce8ecbd2f54b6da39542845b1c23fbb959672c0a
qualificationCandidateSha: a41dad0226310889f61515ba16ce910c1dbb0e53
reviewedRejectedHead: 445a77db3041644faccd85c00c826e8d26af3ea8
reviewedRejectedOutcome: REQUEST_CHANGES
node: 24.19.0
pnpm: 11.22.0
postgres: 18.6
readOnlyRecoveryInspection: PASS (13/13 snapshot regression)
legacyM5aJournalV1LivePg6a: PASS (1/1; no target.hostBootId)
recoveryInspectionUnit: PASS (13/13)
recoveryExecutorUnit: PASS (23/23)
recoveryCommandUnit: PASS (7/7)
bootstrapRuntimeUnit: PASS (155 passed, 1 skipped)
bootstrapStateUnit: PASS (113 passed, 2 skipped)
recoveryProcessK1K3: PASS (3/3)
recoveryProcessK4ActualMaintenance: PASS (1/1)
recoveryProcessK5RecoveryRestartability: PASS (1/1)
pg1PrePostgresBootstrapRecovery: PASS (1/1)
pg2ReadyBeforeHandoffRecovery: PASS (1/1)
linuxPostgresFullMatrixPg1Pg9: PASS (11/11 including 5B/6A/6B split cases)
privatePostgresIntegration: PASS (20/20)
hostOwnershipIntegration: PASS (8/8)
bootstrapRuntimeIntegration: PASS (29/29)
repositoryVerify: PASS
independentReview: NOT_RUN
finalCrossPlatformCi: NOT_RUN
squashMerge: NOT_RUN
M5B: ACTIVE
H1: OPEN
```

The new behavior candidate removes recovery-inspection journal checkpoints;
RECOVER remains the mutation path. The live PG-6A qualification now exercises
the merged-M5A V1 late-stage shape and verifies canonical explicit BootId on the
new revision. The exact final review target and merge evidence are recorded in
the post-merge reconciliation below.

## Foundation M5B post-merge reconciliation (2026-08-23)

```yaml
behavior_candidate_sha: ce8ecbd2f54b6da39542845b1c23fbb959672c0a
qualification_candidate_sha: a41dad0226310889f61515ba16ce910c1dbb0e53
exact_reviewed_head_sha: 9ca373084252e61c31c3df7c02ad355c31e75c49
independent_review: PASS (user-confirmed merge authorization)
final_ci_run: 32592990382
final_ci_ubuntu: PASS
final_ci_macos: PASS
final_ci_windows: PASS
squash_merge_sha: f16071cbff3e30cd4f839716130270770e99075a
m5b: MERGED
h1: OPEN
```

The final manual workflow checked out and verified the exact reviewed source
SHA on Ubuntu, macOS, and Windows. The earlier macOS EPIPE failure was in the
test helper's asynchronous child-IPC cleanup and was corrected before this
successful run. Windows/macOS real PostgreSQL, source-less recovery,
service-account ACL, and hardware power-loss remain `NOT_RUN`; these residual
claims are not upgraded by the cross-platform repository verification run.
