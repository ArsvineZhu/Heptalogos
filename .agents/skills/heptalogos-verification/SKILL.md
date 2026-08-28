---
name: heptalogos-verification
description: Use when designing or evaluating Heptalogos verification, qualification, crash/recovery tests, property/state tests, live IM/model checks, cross-platform claims, source-less packaging, backup/restore/update recovery, release evidence, SBOM, vulnerability, or license gates.
---

# Heptalogos Verification

## Authority route

Documentation root: `../../../docs/`
Route index: `../../heptalogos/corpus-routes.json`

Read first:

- [Cross-platform product runtime and distribution](../../../docs/architecture/platform-distribution.md)
- [Verification and qualification](../../../docs/qualification/verification-system.md)
- [Architecture review checklist](../../../docs/engineering/repository/architecture-review.md)
- [Execution Lineage and observable execution](../../../docs/architecture/execution-lineage.md)
- [S10 Evidence / replay / observability / content](../../../docs/architecture/contracts/evidence-replay-observability-content.md)
- [S11 Backup / update / distribution / platform](../../../docs/architecture/contracts/backup-update-distribution-platform.md)
- [S12 Verification / research / evaluation](../../../docs/architecture/contracts/verification-research-evaluation.md)
- [Dependency qualification](../../../docs/qualification/dependencies.md)
- [Qualification status](../../../docs/qualification/results/qualification-status.json)

## Claim-matched verification

Use the weakest test that actually proves the claim, never a weaker surrogate:

- pure logic → unit/property tests;
- PostgreSQL transaction/LISTEN behavior → real PostgreSQL integration;
- crash recovery → real kill/restart;
- Management/CLI behavior → contract + CLI conformance;
- IM/model/provider protocol support → protected live qualification;
- OS support → native platform qualification;
- packaging/release closure → exact source-less artifact;
- backup/restore/update claims → destructive/recovery scenario evidence.

## Evidence discipline

1. Define the claim before choosing the test.
2. Distinguish product Evidence/Activity from operational telemetry.
3. Preserve lineage through durable resume, restart, fan-out/fan-in, and supersession where required.
4. Record observed result and environment; do not convert missing evidence into narrative confidence.
5. Dependency `RoleDecision` and implementation/product qualification are separate dimensions.
6. Keep required gates locally runnable and reproducible. CI may automate them but is not their sole authority.
7. Pre-production stabilization closure requires `pnpm check:hygiene` and a zero-residue current-tree sweep; preserve Current Evidence versus Historical Evidence as separate claims.
8. Independent Review is an externally supplied governance verdict. GitHub review/approval objects are neither required nor authoritative. The implementation Agent MUST NOT query GitHub reviews, approvals, requested reviewers, or review comments to determine this gate. A PR-branch mutation after external review makes review and final CI stale. Any base movement after the Ready candidate is frozen makes the candidate stale. Return the PR to Draft, integrate/requalify against the current base, and obtain a new external Independent Review before final CI.

Verification status is exactly:

```text
PASS | FAIL | NOT_RUN | BLOCKED
```

Never report `PASS` for a gate that was skipped, mocked below the claim, run on the wrong platform, or blocked by unavailable credentials/runtime/artifact.

For pre-production stabilization closure, `pnpm check:hygiene` is a permanent required gate. A clean
historical record does not prove a clean current executable tree, and historical
qualification evidence must not be promoted to current-candidate evidence.

Load domain skills for the system being tested; this skill defines proof quality, not the subsystem's product semantics.
