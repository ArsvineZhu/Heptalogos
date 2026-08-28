# S03 持久化、事务 Authority 与 Effect Fence

## Canonical Database

一个 private PostgreSQL 18 instance/database，作为 Foundation transactionally coordinated canonical state 的核心 durable substrate。Extension/Domain owner-native SQLite/files/external stores 不因此被禁止；它们通过 S17 DataOwner/lifecycle contract治理。

Heptalogos product tables 与 DBOS engine tables 语义分离。

---

## Schema Ownership

```text
heptalogos.*
→ product canonical state

dbos.*
→ engine-private state
```

Extension relational access 不作为默认 ABI。

---

## Typed SQL

Kysely 承担：

```text
typed query
transactions
migration mechanics
```

Heptalogos 承担：

```text
domain repository
schema semantics
authority
isolation/locking decision
```

---

## Transaction Context

内部 Service 可以显式参与同一个 transaction：

```text
DomainRepository
ExecutionLineageService (when retained/required)
EvidenceService
WorkQueueService
SignalService
```

但 transaction handle 不应成为普通 Extension 的“万能 DB API”。

Required lineage/evidence atomicity：当某次 Authority transition 明确要求 retained Activity/Evidence 时，其最小 causal identity/ref 应与 canonical mutation 在同一 transaction 建立；详细 telemetry 可以异步投影。不能先提交 Authority 再“尽力补一条必须存在的审计日志”。

---

## Host Ownership Fence

`HostLeaseConnection` 解决 session-level owner election；`HostOwnershipFence` 解决 pooled transaction 的数据库级写入 fencing。两者缺一不可。

PersistenceService 的 canonical mutating transaction wrapper 必须自动：

```text
acquire shared HostOwnershipFence row lock
verify HostOwnershipToken
attach current Activity/Boot/ContinuityEpoch metadata when required
run domain transaction
commit
```

普通 normal-runtime repository/Extension 不能选择跳过该检查。新 Host 在取得 advisory lease 后以 exclusive fence 发布新 token；该操作与旧在途 mutation 串行化。

唯一架构级例外是 fixed `RecoveryOperation` 的 offline recovery mutation window：Bootstrap ownership 已取得、normal Host token 已 revoke/normal runtime offline、目标 DB 尚未向 DBOS/Management/Subject 开放时，Recovery contract 可以执行白名单式 restore reconciliation mutation（authEpoch/session invalidation、approval/operation interruption、WorkItem/Effect reconciliation、purge ledger/epoch materialization）。该路径由 RecoveryOperationId/BootstrapJournal/Activity 追踪，不能暴露给普通 Service/Extension，也不能承载日常业务写入。

Read-only query 不要求持 shared write fence，但任何由读取导向 consequential external effect 的路径必须在 EffectOperation `prepared→dispatching` commit 前重新验证当前 token。

---

## Transaction Duration

禁止 transaction 跨：

```text
LLM
network
human approval
long media processing
durable sleep
```

使用：

```text
snapshot/revision
→ slow work
→ validate and commit
```

---

## Subject Commit Fence

Subject 单一性不等于全局 mutex。

只对 canonical Subject conflict 使用：

```text
authority head row lock
revision CAS
constraint
```

其他：

```text
message ingest
media
search
tentative inference
```

可并发。

---

## Config/System Authority

SystemAction 并发也需要 revision/precondition。

不能靠 last-write-wins 偶然覆盖。

---

## DBOS Datasource

在 durable workflow 内，若需要“DB mutation + workflow checkpoint”原子完成，使用 DBOS 的 Kysely datasource integration。

普通 transaction 不应为了统一 API 强行走 DBOS。

---

## Migration Authority

normal Host runtime 不应让 third-party engine 随意 surprise DDL。

迁移是：

```text
first install
Product update
approved Extension upgrade
restore compatibility
```

中的 System Authority operation。

---

## Vendor Migration

DBOS 等第三方 schema migration 应被 ProductGeneration/version policy 管理。

不能把第三方 CLI 直接变成 Operator Authority。

---

## EffectOperation

外部 write：

```text
prepared
dispatching
succeeded
failed
uncertain
cancelled-before-dispatch
```

---

## Conservative Algorithm

```text
Tx A:
verify HostOwnershipToken
prepared → dispatching
record attempt
COMMIT

external request

Tx B:
dispatching → succeeded/failed
record evidence
COMMIT
```

若 A 后没有 terminal proof：

```text
uncertain
NO automatic redispatch
```

---

## Strong Idempotency

若 protocol/provider 有：

```text
client idempotency key
remote operation id
query/reconciliation
```

Driver 可提供专用策略。

这不能改变 Foundation generic default。

---

## Restore Discontinuity Fence

Destructive restore 建立新的 `ContinuityEpochId`。Snapshot 中所有非 terminal consequential `EffectOperation` 都不能被解释为“尚未发生”：

```text
prepared/dispatching from restored snapshot
→ RESTORE_RECONCILIATION / uncertain-by-default
→ no automatic redispatch
```

若 provider 有稳定 remote idempotency/query proof，可由对应 Driver 在显式 reconciliation 中证明 terminal outcome；没有 proof 时保持 unknown/uncertain。

同理，snapshot 中可能导致 external effect 的非 terminal WorkItem 不自动重放，先由 restore reconciliation 分类。Local state rollback 不能制造“外部世界也回到了 snapshot 时间”的假设。

---

## Model Calls

Model inference 与 social external write 不同。

commit 前模型调用可按 inference policy retry/failover，因为结果只是 proposal。

commit 后不能用不同输出覆盖同 artifact identity。

---

## Constraint-first

优先数据库 constraints：

```text
unique
FK
CHECK
not null
generation ref
dedup identity
```

application validation 不替代 persistence invariant。
