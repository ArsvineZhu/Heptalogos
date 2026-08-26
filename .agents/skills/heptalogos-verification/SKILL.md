---
name: heptalogos-verification
description: Use when designing or evaluating Heptalogos verification, qualification, crash/recovery tests, property/state tests, live IM/model checks, cross-platform claims, source-less packaging, backup/restore/update recovery, release evidence, SBOM, vulnerability, or license gates.
---

# Heptalogos Verification

## Authority route

Corpus root: `../../../Architecture_Corpus/`  
Route index: `../../heptalogos/corpus-routes.json`

Read first:

- [Cross-platform product runtime and distribution](../../../Architecture_Corpus/14-跨平台产品运行与分发.md)
- [Verification and qualification](../../../Architecture_Corpus/16-验证与资格认定体系.md)
- [Architecture review checklist](../../../Architecture_Corpus/20-架构审查清单.md)
- [Execution Lineage and observable execution](../../../Architecture_Corpus/22-Execution-Lineage与可观测执行.md)
- [S10 Evidence / replay / observability / content](../../../Architecture_Corpus/specs/S10-Evidence-Replay-Observability-Content.md)
- [S11 Backup / update / distribution / platform](../../../Architecture_Corpus/specs/S11-备份-更新-分发-平台.md)
- [S12 Verification / research / evaluation](../../../Architecture_Corpus/specs/S12-验证-Research-Evaluation.md)
- [Dependency qualification](../../../Architecture_Corpus/qualification/DEPENDENCY-QUALIFICATION.md)
- [Qualification status](../../../Architecture_Corpus/qualification/results/qualification-status.json)

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
7. Hn-S closure requires `pnpm check:hygiene` and a zero-residue current-tree sweep; preserve Current Evidence versus Historical Evidence as separate claims.
8. Review the current live Ready PR. A PR-branch mutation after review makes review and final CI stale. Any base movement after the Ready candidate is frozen makes the candidate stale. Return the PR to Draft, integrate/requalify against the current base, and obtain a new Independent Review before final CI.

Verification status is exactly:

```text
PASS | FAIL | NOT_RUN | BLOCKED
```

Never report `PASS` for a gate that was skipped, mocked below the claim, run on the wrong platform, or blocked by unavailable credentials/runtime/artifact.

For Hn-S closure, `pnpm check:hygiene` is a permanent required gate. A clean
historical record does not prove a clean current executable tree, and historical
qualification evidence must not be promoted to current-candidate evidence.

Load domain skills for the system being tested; this skill defines proof quality, not the subsystem's product semantics.
