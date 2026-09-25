# 整机执行模型

## 1. Boot 不是一次性 import 顺序

Heptalogos 的正常运行本质是持续 reconciliation：

```text
Desired State
+ installed generations
+ configuration
+ operating mode
+ current health
+ current capabilities
+ resource pressure/admission state
        ↓
resolve runtime graph
        ↓
Actual Runtime Graph
        ↓
Capability Graph
        ↓
Readiness Profiles
        ↓
on change → reconcile again
```

Cold Boot 只是第一次 reconciliation。

---

## 2. 冷启动

```text
stable Bootstrap Closure
→ start Early Observability / BootstrapJournal
→ resolve compatible BootstrapRuntime + ProductGeneration
→ acquire bootstrap/recovery lock
→ validate bootstrap/release metadata
→ start private PostgreSQL under PrivatePostgresProfile
→ acquire authoritative Host lease
→ publish new HostOwnershipToken under database HostOwnershipFence
→ only then allow canonical mutation/effect dispatch
→ handoff bootstrap lineage into normal ExecutionLineage
→ initialize Kernel/runtime substrate
→ start Management-critical System Services
→ load Desired State
→ resolve Services / dependencies
→ activate eligible MicroSystems
→ compute CapabilityGraph
→ evaluate Readiness
→ expose Management
→ reconcile SubjectDesiredState
→ READY / DEGRADED / BLOCKED
```

---

## 2.1 Bootstrap Lock → Host Lease Handoff

pre-PostgreSQL lock 与 PostgreSQL Host lease 是连续 ownership chain：

```text
acquire bootstrap lock
→ start/check PostgreSQL
→ acquire Host lease
→ ensure minimal HostOwnershipFence schema exists
→ establish/publish HostOwnershipToken
→ only then run product/DBOS migrations, first-admin bootstrap or normal canonical writes
→ release bootstrap lock
```

任何时刻都不能存在“两个机制都未持有但初始化仍继续”的独占空窗。

## 2.2 Lease 与写入 Fence

Session advisory lease 只证明当前 lease holder，不能单独阻止旧 Host 的其他 pooled connection。PersistenceService 的所有 canonical mutating transaction 必须验证当前 `HostOwnershipToken`；ownership token 切换与旧在途 mutation 在数据库层串行化。Lease loss 立即进入 `FENCED` 并终止 normal runtime，不允许原地 reconnect/reacquire。

## 3. 启动不是 all-or-nothing

例如：

```text
Host = RUNNING
Management = READY
SubjectDesiredState = RUNNING
SubjectActualState = BLOCKED
reason = no usable AI model
```

仍然是合法系统状态。

又例如：

```text
Management = READY
Subject Base = READY
External Messaging = BLOCKED
Subject Chat = READY
```

此时内建 Subject Chat 仍可用，只是外部 IM 不可用；Management 也保持独立可操作。

---

## 4. Subject 启动

```text
SystemAction: subject.start
→ persist DesiredState=RUNNING
→ RuntimeReconciler checks SubjectBaseProfile
→ Subject identity/state valid
→ required config / secrets valid
→ WorkQueue / Durable / Evidence ready
→ AI binding ready
→ >= 1 subject.messaging capability ready
→ recover pending semantic state
→ SubjectActualState = READY / ACTIVE
```

如果 prerequisites 缺失：

```text
DesiredState remains RUNNING
ActualState = BLOCKED
```

以便条件恢复后自动 reconcile。

---

## 5. Driver 断开

例如 Milky 断开：

```text
Milky READY → DEGRADED/FAILED
→ withdraw affected capabilities
→ CapabilityGraph recompute
→ External Messaging profile changes
→ Subject may continue via Subject Chat/other transport
```

不能把整个 Host 当作失败。

---

## 6. Service Provider 替换

若一个 hard Service provider 要替换：

```text
compute dependent subgraph through RuntimeGraph (`@dagrejs/graphlib` mechanics)
→ quiesce dependents reverse-topological
→ stop/dispose old provider
→ activate new provider
→ health/readiness
→ re-activate dependents
```

这里的具体 lifecycle mechanics 应优先委托给通过 qualification 的 runtime substrate。

---

## 7. Capability Provider 变化

Capability 与 Service 不同。

Provider 选择必须确定性。默认顺序：

```text
explicit resource/config binding
→ policy / trust / scope / contract compatibility eligibility
→ readiness/health
→ configured preference / provider priority
→ stable ProviderId tie-break
```

不得使用 registration/load order 作为隐式选择规则。

Provider rebind 若可能改变可观察行为，必须形成 ReconcilePlan/Activity，并按配置或 SystemAction 风险规则产生 Evidence。

若：

```text
ai.text-generation provider A disappears
```

而 B 仍 available：

```text
Capability may remain READY
```

是否需要重启 consumer 取决于 contract，不应强制映射成 Service DAG restart。

---

## 8. Safe Mode

```text
third-party/optional extensions disabled by eligibility override
Subject actual state kept stopped/blocked
external effects suppressed
Management starts if possible
diagnostics/evidence enabled
```

Safe Mode 不改写 durable Desired State。

退出 Safe Mode 后重新按原 Desired State reconcile。

---

## 9. Resource Pressure / Admission

资源压力进入正式 runtime state：

```text
NORMAL
THROTTLED
SHEDDING
BLOCKED
```

`ResourceGovernor` 根据 memory/disk/DB pool/queue/provider/network 等 `PressureSnapshot` 产生 admission decision。

优先保护：

```text
Recovery / essential Management
→ canonical ingress/truth preservation
→ already-committed obligations/effect reconciliation
→ Subject Base work
→ optional/background work
```

Pressure 变化触发 Readiness/Reconcile，但不能静默改写 Desired State。

---

## 10. Maintenance

用于：

```text
foundational System Service upgrade
schema migration
product update
restore
high-impact storage/security changes
```

流程：

```text
approve MaintenanceOperation
→ close consequential admission for impacted owners
→ retire impacted runtime and graph resources
→ apply change
→ verify current truth
→ reconcile from current truth
→ record terminal lineage
```

---

## 11. Emergency Read-Only

例如：

```text
disk full
database write unsafe
integrity problem
```

则：

```text
Subject canonical commits blocked
new external effects blocked
mutating SystemActions blocked except bounded recovery
read-only diagnostics preserved
```

不能伪装为正常 READY。

---

## 12. Graceful Shutdown

```text
stop accepting new consequential work
→ retire Subject and owned components
→ preserve EffectOperation uncertainty
→ stop Feature/Domain components
→ stop Drivers/Providers
→ drain/stop WorkQueue/Durable execution
→ stop System Services
→ record shutdown lineage terminal state
→ release Host lease
→ stop private PostgreSQL
→ finalize BootstrapJournal
```

机器关机不会自动把：

```text
SubjectDesiredState = RUNNING
```

改成 STOPPED。

---

## 13. Crash Recovery

Crash 后：

```text
Bootstrap
→ private PG
→ Host lease
→ reconstruct Actual from canonical Desired State
→ DBOS recovery
→ pending WorkItem reconciliation
→ EffectOperation fence check
→ Subject semantic state recovery
```

任何 engine-private checkpoint 都不能覆盖产品 Authority。

---

## 14. 一个基本聊天完整路径

```text
IM/Subject Chat Driver
→ Raw Evidence
→ Canonical MessageFact
→ WorkItem
→ ConversationMailbox
→ CognitiveOpportunity
→ Reaction
→ Foundation ContextProjection
→ optional advanced ContextFacet contributions when available
→ bounded conversation cognition proposal
   ├─ NO_COMMUNICATION → local Reaction completes
   └─ COMMUNICATE(semantic content)
        → deterministic Review
        → CommunicationCommit
        → Expression
        → local outbound MessageFact
        → external EffectOperation / Messaging Driver when an external channel is used
        → DeliveryOutcome
```

高级 Persona/Memory/Relationship/Attention 等只通过正式 Context/Activity/Service hooks 插入；Foundation Basic Chat 不依赖其实现，也不改变 Authority spine。

当前聊天执行路径是 bounded conversation cognition slice：proposal 经过
deterministic Review 后，只有已接受的 communication 才进入
`CommunicationCommit → Expression`；no-communication 是局部成功结果。该
路径不定义 Subject 的总行为空间，也不创建通用 ActionPlan/Decision framework。

## 12. Ownership Handoff Is Bidirectional

Startup 使用 `bootstrap ownership → PostgreSQL Host lease`。任何 stop/replace private PostgreSQL、bootstrap metadata switch、Restore/Recovery destructive window 使用反向 `Host lease → acquire bootstrap ownership → release lease`。两个 Authority 之间不得出现无 owner 空窗。

## 13. Lease Loss Means Fence, Not Reconnect

`HostLeaseConnection` 丢失后：`Host = FENCED`，停止新 consequential work/effect/mutation，normal runtime 不原地 reacquire。重新运行只能由 Bootstrap Closure 重新证明 bootstrap/PG/Host ownership。

## 14. Bounded lifecycle failure

不是每个 partial failure 都需要 automatic in-process restoration。生命周期失败按
以下顺序处理：

```text
preserve Authority/truth
→ bounded cleanup
→ fail-stop/fence when cleanup cannot be proven
→ fresh reconciliation/recovery later
```

这是一条 failure-handling hierarchy，不是新增的 global lifecycle state machine。
