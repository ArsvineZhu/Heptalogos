# Foundation M5B Bounded Bootstrap Recovery & H1 Closure

> Approved execution source: `/home/arsvine/下载/M5B-Bounded-Bootstrap-Recovery-H1-Closure-Implementation-Plan-2026-08-22.md`.
> This repository record tracks execution state; the external plan remains the
> complete task specification.

**Status:** ACTIVE — M5A is closed; M5B behavior, qualification, review, CI,
merge, and post-merge H1 reconciliation remain in scope.

## Baseline and boundary

```text
master baseline = 8acedfd49b0bcc42444389c3f28f206d4e8438b6
M5A reviewed SHA = 538cc6973fcd831cb47a60c5d126006032532591
M5A independent review = PASS
M5A final CI run = 32570208341 (Ubuntu/macOS/Windows PASS)
M5A squash merge = 8acedfd49b0bcc42444389c3f28f206d4e8438b6
M5B = ACTIVE
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
- [ ] Obtain independent review of the exact SHA, then dispatch exact-SHA
      cross-platform final CI and squash-merge the PR.
- [ ] Reconcile the merged plan/roadmap/qualification truth and close H1 only
      after review, final CI, and merge are evidenced.

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

## PR8 corrective qualification candidate (2026-08-23)

```yaml
exactCandidateSha: e7e46e8e1d58f15e254b9644f5b315cd34090360
behaviorCandidateSha: e7e46e8e1d58f15e254b9644f5b315cd34090360
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
independentReview: NOT_RUN
finalCrossPlatformCi: NOT_RUN
squashMerge: NOT_RUN
M5B: ACTIVE
H1: OPEN
```

The prior review at `9e450f836466d32fb1f3d9027618fac236798eb9` returned
`REQUEST_CHANGES`; that historical review outcome is not the verification
status of the current candidate. The current exact candidate awaits independent
review. Windows/macOS real PostgreSQL, source-less recovery, service-account
ACL, hardware power-loss, final CI, and merge remain `NOT_RUN`.
