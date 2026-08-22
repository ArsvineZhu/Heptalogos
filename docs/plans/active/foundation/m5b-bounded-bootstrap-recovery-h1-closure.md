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
- [x] Qualify real PostgreSQL 18.6 recovery and real process kill/restart.
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

## Current implementation evidence (2026-08-22)

```yaml
behaviorCandidateSha: c4c1be43f412c868a84a776461b479d3b677ea18
node: 24.19.0
pnpm: 11.22.0
postgres: 18.6
bootstrapRuntimeUnit: PASS (123 passed, 1 skipped)
bootstrapStateUnit: PASS (98 passed, 2 skipped)
recoveryProcessQualification: PASS (K1-K5, 5/5)
postgresRecoveryQualification: PASS (Linux, M5B scenarios plus existing H1 suites)
privatePostgresIntegration: PASS (20/20)
hostOwnershipIntegration: PASS (8/8)
bootstrapRuntimeIntegration: PASS (20/20)
independentReview: NOT_RUN
finalCrossPlatformCi: NOT_RUN
squashMerge: NOT_RUN
M5B: ACTIVE
H1: OPEN
```

The current candidate has not yet received independent exact-SHA review.
Windows/macOS real PostgreSQL, source-less recovery, service-account ACL, and
hardware power-loss evidence remain `NOT_RUN`.
