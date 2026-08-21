# S02 异步协调、WorkQueue、Durable Execution 与 Time

## 1. 核心分离

Foundation 区分：

```text
WorkQueueService
SignalService
DurableExecutionService
Domain Mailbox
TimeService
```

禁止用一个模糊 `MessageQueue/EventBus` 覆盖所有异步语义。

---

## 2. WorkItem

`WorkItem` 是产品语义：

```text
id
handler MicroSystem/Contribution/Generation
schemaVersion
payload/ref
queue profile
partition
priority
notBefore
dedup
causation/correlation
created ContinuityEpochId
execution binding policy / configRevisionRef when pinned
dispatchRevision
state
outcome
```

它表达：

> 系统已经承诺完成某项 processing work。

WorkItem payload cannot persist Secret plaintext/session token/temporary credential；需要 credential 时只持 versioned `SecretRef`/purpose，执行 attempt 时再经 scoped SecretService materialize。

---

## 2.1 Durable Execution Binding Policy

Durable work 不能隐式依赖“执行那一刻碰巧 active 的所有配置”。`WorkHandlerContribution` 声明 binding policy，WorkItem materialization 记录实际选择：

```text
CONFIG_PINNED
  → pin immutable ConfigurationRevision/required config refs at creation

LATEST_COMPATIBLE_AT_ATTEMPT
  → allowed only when handler contract explicitly declares semantics can follow current config
```

默认：由 DecisionCommit/SystemChangePlan/外部 consequential obligation 派生的 WorkItem 使用 `CONFIG_PINNED`；纯维护、cache/derived recompute 等可由 contract 明确选择 latest-compatible。

无论哪种模式，每次 attempt 的 Activity 都记录实际 effective config revision、selected ProviderId/Generation 和 relevant SecretRef identity（不记录 plaintext）。Secret material 可以轮换，但 durable work不能静默把 credential reference/account identity 改成另一个 resource。

Pinned revision 在 durable ref terminal/migrated 前不得 purge。若 Extension/Product upgrade 使 pinned revision 不再可读，upgrade 必须 retain compatible reader、显式 migrate binding，或 BLOCK/cancel through owning Authority。

## 3. Durable Execution Mechanics

`DurableExecutionService` 的 mechanics 使用 DBOS。

DBOS 可承担：

```text
durable workflow
durable sleep/wait
workflow communication
recovery
queue mechanics where qualified
```

不得重新实现 generic durable workflow engine。

---

## 4. DBOS 不拥有产品语义

```text
WorkItem semantics
ActionPlan semantics
ManagementOperation
EffectOperation
Subject state
Generation pin
Extension lifecycle
```

这些对象的状态和 Authority 仍由 Heptalogos canonical contracts 拥有。

必须维护三个正交版本轴：

```text
ProductGeneration
DBOS applicationVersion / durable-code version
Extension PackageGeneration
```

`DBOS applicationVersion != Extension PackageGeneration`。

---

## 5. Static Durable Dispatcher

Foundation 在 DBOS 启动前注册一组稳定、数量受控的 durable workflows。Dynamic Extension 不获得 raw DBOS workflow registration，也不因 install/upgrade 重新 `DBOS.launch()`。

WorkQueue 的标准入口概念上是：

```text
dispatchWorkItem(WorkItemId, dispatchRevision)
→ load canonical WorkItem
→ resolve ContributionId + PackageGenerationId + payloadVersion
→ obtain retained compatible WorkHandlerContribution
→ execute through Host invocation boundary
→ commit outcome / retry classification
```

DBOS Queue 是该 dispatcher 的已采用 scheduling mechanics，承担 concurrency/rate limit/priority/partition 等通用能力。

不得并行引入第二套 queue/scheduler。若真实 implementation 暴露 DBOS Queue hard blocker，必须以具体 failure evidence 重新打开 role，而不是在产品代码中保留自研 fallback。

---

### Dispatch Identity

`WorkItemId` 使用 Foundation Identifier Contract 的 globally unique UUIDv7，只标识**产品 durable obligation**，不与某一个 engine workflow 的完整生命周期永久绑定。

WorkItem 维护 monotonic `dispatchRevision`（或等价 attempt generation）。每个可执行 attempt 的 engine identity 由 domain-separated deterministic mapping 生成：

```text
DispatchAttemptId = f(WorkItemId, dispatchRevision)
DBOS workflow id = stable encoding of DispatchAttemptId
```

因此：

```text
same WorkItem + same dispatchRevision
→ same durable attempt identity
→ duplicate reconciliation/enqueue is idempotent

WorkItem needs a later retry/wakeup
→ canonical transition increments dispatchRevision
→ new durable attempt identity
```

DBOS queue-level deduplication ID 可作为 scheduling optimization，但不拥有 WorkItem identity/Authority。Canonical `WorkItem` row/state/outcome、dispatchRevision 与 current attempt fence 才是产品真相。

## 6. WorkHandlerContribution

Descriptor 至少有：

```text
ContributionId
contractVersion
accepted payload versions
PackageGenerationId
queue profile
resource/admission class
configuration binding policy
restore replay class
```

Invocation 必须带 `ExecutionContext`；Host 自动产生 `work.dispatch` / `contribution.invoke` lineage。`restore replay class` 默认为 `RECONCILE_REQUIRED`；只有 contract/qualification 能证明 snapshot rollback 后可安全重复的 handler 才可声明 `RESTORE_SAFE`。

---

## 6.1 WorkHandler Attempt Semantics

Dynamic `WorkHandlerContribution` 不是 raw DBOS workflow。Static `dispatchWorkItem(WorkItemId, dispatchRevision)` workflow 在一个稳定 step/attempt boundary 中调用 Host 的 generation-pinned handler：

```text
dispatchWorkItem(workItemId, dispatchRevision)   # deterministic attempt workflow shell
→ durable step: executeWorkAttempt(workItemId, dispatchRevision)
   → load canonical WorkItem
   → verify this revision is still the current executable attempt
   → if terminal: return stored outcome
   → if revision is stale/superseded: return no-op attempt outcome
   → resolve pinned WorkHandler generation
   → execute scoped handler
   → commit canonical outcome/idempotent mutations under attempt fence
```

DBOS step 在中途失败/崩溃时可以再次尝试，因此 WorkHandler contract 必须是 **restartable attempt**：

```text
all canonical writes keyed/fenced by WorkItemId or owned operation id
terminal WorkItem re-entry returns stored outcome/no-op
external effects go through EffectOperation/EffectFence
no hidden filesystem/network/process side effect outside scoped Foundation services
no raw DBOS workflow/step registration
```

如果 crash 发生在 canonical outcome 已提交、但 durable step completion 尚未记录之后，同一 `DispatchAttemptId` 的 DBOS retry 必须读取 terminal/stale WorkItem 并返回原 outcome/no-op，不能重复 logical work/effect。

WorkHandler 内部需要长期等待/定时/多阶段 durable orchestration 时，不得通过 Extension 自注册 DBOS workflow；优先表达为 follow-up WorkItem/notBefore 或调用 Foundation-owned typed durable primitive。新的 generic durable extension orchestration contract 只有真实需求出现后再扩展。

这是一种 product-level idempotency contract，不声称 arbitrary third-party code 自动获得 exactly-once semantics。

## 7. Generation Pin

WorkItem durable identity 必须 pin：

```text
MicroSystemId
ContributionId
PackageGenerationId
payload schemaVersion
```

默认禁止 pending work 静默改绑到“当前最新” generation。

旧 generation 仍被 durable work 引用时不能 purge。若新 generation 不能读取旧 payload：

```text
retain compatible handler
or explicit migrate/upcast
or cancel/supersede through owning Authority
or block retirement/upgrade
```

### DBOS durable-code upgrade

Foundation durable workflow code应保持薄且稳定。兼容演化使用 engine 支持的 version/patch mechanics。真正不兼容 durable-code generation 的 Product Update 默认等待相关旧 workflow drain 后再切换。

只有未来出现不能合理 drain 的真实长期 workflow，才允许设计 bounded legacy durable worker；该 worker不得持有 normal Host/System Authority lease，也不得成为第二个完整 Host。

## 7.1 Canonical WorkItem State

Foundation WorkItem 至少使用以下产品状态：

```text
PENDING
RUNNING
WAITING_DEPENDENCY
RETRY_WAIT
WAITING_RESTORE_RECONCILIATION
SUCCEEDED
FAILED
CANCELLED
SUPERSEDED
```

`PENDING` 表示 durable obligation 已存在，不要求额外复制 engine queue state。`RUNNING` 是当前 handler attempt 已开始；`RETRY_WAIT/WAITING_DEPENDENCY/WAITING_RESTORE_RECONCILIATION` 都是非 terminal。重新满足执行条件时，canonical transition 增加 `dispatchRevision` 并调度新的 attempt；不会尝试“复活”一个已经完成的旧 DBOS workflow。

Terminal：

```text
SUCCEEDED | FAILED | CANCELLED | SUPERSEDED
```

DBOS 内部 workflow/queue status 是 execution projection，不直接替换 canonical WorkItem state。每次 transition 必须带 reason/outcome/ref 与 Activity；非法 transition fail closed。

## 8. Transactional Creation

推荐：

```text
BEGIN
canonical fact/state
WorkItem
required Evidence
pg_notify wakeup hint
COMMIT
```

若 commit 后 engine dispatch 前 crash：

```text
WorkItem remains pending
→ reconciliation discovers pending obligation
→ dispatch/recover
```

避免为了 engine API 强行建立跨系统 distributed transaction。

---

## 9. SignalService

Signal 是：

```text
best-effort wakeup/change hint
```

Foundation mechanics：

```text
PostgreSQL LISTEN/NOTIFY
```

正确模型：

```text
establish listener
→ canonical initial scan
→ notification wakes re-query
→ reconnect re-LISTEN + rescan
```

lost/coalesced notification 只影响 wakeup latency，不能丢 work/state。

Signal payload 不承载唯一 durable data。

---

## 10. Domain Mailbox

例如 `ConversationMailbox` 负责：

```text
ordered pending domain facts
aggregation
retraction/edit
supersession
observation semantics
```

这些是 cognition/messaging domain semantics，不能塞进 generic WorkQueue API。

---

## 11. TimeService

### Machine-authoritative time

持久化绝对时间使用：

```text
Instant
```

### Elapsed duration

超时、latency、backoff 使用 monotonic duration。

### Human-local semantics

涉及“每天晚上 8 点”“明早”等未来语义时，contract 保留：

```text
IANA TimeZoneId
originating local date/time semantics
resolution policy
resolved Instant when applicable
```

Foundation 不因此实现 Commitment/Schedule 高级 subsystem。

### Clock change

必须定义 wall-clock/NTP/manual clock jump、DST、timezone change 对：

```text
notBefore
durable wait
session/approval expiry
future human-local schedule contributions
replay
```

的影响。

---

## 12. Cancellation / Supersession

Cancellation/supersession request 与 terminal outcome 分离：

```text
cancelRequestedAt / cancellationReason
supersededBy?
```

表示 owning Authority 已不再期望继续工作，但**不能立即证明执行已经停止**。

规则：

```text
PENDING + cancel request
→ dispatcher/reconciler may commit terminal CANCELLED without invoking handler

RUNNING + cancel/supersede request
→ signal cooperative AbortSignal
→ handler/reconciler re-check request before authoritative commit/effect prepare
→ terminal CANCELLED/SUPERSEDED only after no further consequential work is possible
```

若外部 Effect 已进入 `dispatching/succeeded/failed/uncertain`，WorkItem cancellation 不会撤销现实动作，也不能把 effect truth 改写成“已取消”。最终 WorkItem outcome必须引用实际 EffectOperation 状态。

Handler 的 terminal commit 使用 revision/attempt precondition；收到 cancel/supersede 后的 stale attempt 不能无条件覆盖 owning Authority 的新状态。

---

### Dispatch Revision Fence

任一 attempt commit 必须带：

```text
WorkItemId
expected dispatchRevision
expected current state/attempt owner
HostOwnershipToken
```

CAS/precondition 不满足时，该 attempt 已 stale/superseded，禁止提交 handler outcome 或准备新的 Effect。`RETRY_WAIT/WAITING_DEPENDENCY` 被重新唤醒时由 owning WorkQueue transition 增加 revision，再 schedule 新 `DispatchAttemptId`。

## 13. Retry Class

至少：

```text
transient
rate-limited
dependency-unavailable
not-configured
policy-blocked
invalid
permanent
external-effect-uncertain
```

`external-effect-uncertain` 严禁普通自动 retry。

---

## 14. Queue Profile 与 Resource Governance

Host-defined profiles 例如：

```text
conversation-ingress
cognitive
media
background
maintenance
extension-background
```

Profile 只表达 scheduling/resource class，不等于 Attention/Authority。

Extension 不直接任意调 DBOS 内部 queue knobs；ResourceGovernor 可基于 PressureSnapshot 对 profile 做 admission/throttling。

---

## 15. 验证

Architecture route 已冻结：`DBOS Queue → static dispatchWorkItem(WorkItemId, dispatchRevision)`。Q evidence 记录当前 route 已证明的 dispatcher/revision properties；剩余风险直接进入 Product qualification：

```text
real PostgreSQL + DBOS
crash/restart
exact DBOS version
source-less artifact
A/B Extension generation with real implementation
queue pressure / recovery
```

两者不能混为一个前置大实验。
