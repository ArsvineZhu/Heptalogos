---
name: heptalogos-runtime-durability
description: Use when changing Heptalogos boot, recovery, Host ownership, runtime reconciliation, MicroSystem lifecycle, readiness, WorkQueue/Signal, durable execution, persistence transactions, EffectFence, generation fencing, shutdown, drain, or crash/restart behavior.
---

# Heptalogos Runtime and Durability

## Authority route

Corpus root: `../../../Architecture_Corpus/`  
Route index: `../../heptalogos/corpus-routes.json`

Read the route's core files, especially:

- [Execution model](../../../Architecture_Corpus/05-整机执行模型.md)
- [S01 Boot / recovery / runtime supervision](../../../Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md)
- [S02 Async / WorkQueue / durable / time](../../../Architecture_Corpus/specs/S02-异步-WorkQueue-Durable-Time.md)
- [S03 Persistence / transaction / EffectFence](../../../Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md)
- [S13 Service / Capability / readiness catalog](../../../Architecture_Corpus/specs/S13-Foundation-Service-Capability-Readiness-Catalog.md)
- [S15 Cross-cutting contracts](../../../Architecture_Corpus/specs/S15-Foundation横切合同.md)

## Procedure

1. Identify Desired State, Actual State, owner, generation, and applicable Readiness Profile.
2. Separate durable product state from workflow-engine/private runtime state.
3. Classify async behavior: durable obligation, best-effort signal, domain mailbox, or durable wait. Do not collapse these into one queue abstraction.
4. For every canonical mutation, determine transaction boundary and Host ownership fence.
5. For every external effect, preserve `planned/sent/known/uncertain` semantics and require the canonical EffectOperation transition before dispatch.
6. For process-memory work, assign an activation owner and drain/cancel behavior. Restart-surviving obligations must use a Foundation durable primitive.
7. For cross-generation invocation, verify generation identity, InvocationLease/retirement behavior, contract version, and stale-attempt fencing.
8. Model failure, pressure, shutdown, recovery, and lease-loss paths before optimizing the happy path.

Load S14 for full-flow changes, S16 for lineage, S17 for storage lifecycle, and S11/platform docs for update/recovery packaging.

## Never infer

- DBOS workflow state is not product state.
- Queue priority is not Subject attention.
- LISTEN/NOTIFY/Signal is not a durable fact.
- Advisory lease alone does not authorize mutation.
- Lease loss is not an invitation to reacquire in-place.
- Restore does not roll external reality backward.
- While `CompatibilityEpoch=PRE_PRODUCTION`, development history is not a
  compatibility obligation: keep one canonical V1, reset/reject obsolete
  state, and never infer a V2/upcaster/bridge migration/legacy reader path from
  old development bytes.

## Verification

Use real PostgreSQL for transaction/LISTEN claims and real kill/restart for crash/recovery claims. Invoke `heptalogos-verification` for consequential recovery/release claims.
