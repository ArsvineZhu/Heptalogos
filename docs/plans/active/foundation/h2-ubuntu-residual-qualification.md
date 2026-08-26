# H2 Ubuntu Residual Qualification

**Status:** `ACTIVE`

## Purpose and locked milestone state

This is a qualification-only pass against the reconciled current `master`.

```yaml
purpose: residual qualification only
milestoneMutation: NONE
behaviorChangeAuthorized: false
H2: CLOSED
H3: ELIGIBLE
H3_implementation: NOT_STARTED
```

No production code, tests, schemas, dependencies, workflows, or milestone
semantics may change. A reproducible behavior or test-harness failure stops
this plan and requires a separate corrective decision.

## Ubuntu execution facts

```yaml
platform: Ubuntu 26.04 LTS
kernel: Linux PRTS 7.0.0-30-generic #30-Ubuntu SMP PREEMPT_DYNAMIC Fri Jul 31 18:22:54 UTC 2026 x86_64 GNU/Linux
architecture: x86_64
node: 24.19.0
pnpm: 11.22.0
baseline: clean reconciled master
```

## Qualification route

Use an explicit PostgreSQL 18.6 binary directory through
`HEPTALOGOS_TEST_PG_BIN`; do not discover or use a system service/default
PostgreSQL. Run sequentially:

```text
private-postgres:test:integration
host-ownership:test:integration
persistence:test:integration
bootstrap-runtime:test:integration
bootstrap-runtime:test:recovery-process
bootstrap-runtime:test:recovery-process:postgres
```

Only properties directly exercised by the matrix may be upgraded. Linux
real-PostgreSQL recovery does not imply macOS, source-less, installed
service/headless, service-account ACL, or hardware power-loss qualification.

## Execution record

```yaml
planState: ACTIVE
postgresToolchain18_6: NOT_RUN
repositoryVerifyUbuntu: NOT_RUN
privatePostgresIntegration: NOT_RUN
hostOwnershipIntegration: NOT_RUN
persistenceIntegration: NOT_RUN
bootstrapRuntimeIntegration: NOT_RUN
recoveryProcessLinux: NOT_RUN
recoveryProcessPostgresLinux: NOT_RUN
qualificationEvidenceReconciled: NOT_RUN
changedPathBoundary: NOT_RUN
```
