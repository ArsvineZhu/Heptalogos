# Execution Lineage 与可观测执行

## 1. 定位

Heptalogos 的运行记录不是互不相关的“日志文本集合”，而是一张可查询、可追溯的执行血缘图。

系统必须能够从一次重要结果反查：

```text
origin
→ Package / Generation / MicroSystem / Contribution
→ Feature / Service / Capability / Provider
→ durable work / model / network / effect
→ outcome
→ Evidence / audit proof
```

因此 Foundation 把 `Execution Lineage` 作为一级系统合同，而不是 Pino/OpenTelemetry 的附属功能。

---

## 2. 核心对象

```text
Activity
ExecutionContext
LineageContextRef
ActivityLink
ActivityRecord
ExecutionLineageService
LineageQueryService
```

`Activity` 是 Heptalogos 的 semantic execution unit；OTel Span 是它的 telemetry projection。

```text
ActivityId != TraceId != SpanId
```

`ContinuityEpochId` 标识 destructive restore 之间的一段连续 canonical timeline；`HostOwnershipToken` 可用于说明 Activity 属于哪个 Host write-ownership period。二者均不是 telemetry identity，也不授予 Authority。

---

## 3. 四层职责

```text
Execution Lineage
→ 调用链、因果链、来源、ownership、purpose

Operational Telemetry
→ logs / traces / metrics / latency / debug

Evidence
→ durable product causal/provenance truth

Audit
→ security/authority-sensitive durable facts
```

Telemetry 可采样/丢弃；required Evidence/Audit 不得因 exporter 或 trace sampling 丢失。

---

## 4. 从 Bootstrap 到 Shutdown

可追溯范围包括：

```text
bootstrap start
ProductGeneration selection
private PostgreSQL start
Host lease
runtime reconciliation
package discovery/verification
extension resolve/activation
service/capability/contribution invocation
WorkItem/DBOS durable resume
Management/SystemAction/Approval
Subject/AI/MCP/Messaging
Network/Effect
Backup/Restore/Update
quiesce/shutdown
```

数据库尚不可用时由 BootstrapJournal 承担 Early Observability；normal lineage ready 后继续同一因果链。

---

## 5. Extension 调用示例

```text
Extension foo @ generation-42
└─ Contribution foo.reply-context
   └─ Feature contextual-reply
      └─ ServiceCall subject.memory.query
         └─ Capability memory.query
            └─ Provider memory.primary
               └─ outcome
```

系统不仅知道“MemoryService 打了一条日志”，还知道此次调用属于哪个 Extension/Generation/Contribution、由什么 Activity 导致、结果后来被谁使用。

高级 Memory 本身仍不属于 Foundation；Foundation 只提供使任意未来 Service 都能进入这条血缘链的统一机制。

---

## 6. 重要性不是 Log Level

Foundation 分开：

```text
severity     = trace/debug/info/warn/error/fatal
importance   = diagnostic/routine/significant/critical
retention    = ephemeral/operational/retained/audit
sensitivity  = public/operational/sensitive/pii/secret
```

例如一次成功的管理员配置变更可以：

```text
severity = info
importance = significant
retention = audit
```

而普通第三方 timeout 可以是 `warn`，但未必永久持久化。

---

## 7. 自动计装边界

Foundation 自动计装：

```text
MicroSystem lifecycle
RuntimeReconcile
Service call
CapabilityBroker invocation
Contribution invocation
WorkItem/Workflow
SystemAction/Policy/Approval
Network/Model/MCP
Messaging/Effect
Extension lifecycle
Backup/Restore/Update
```

普通内部 helper/function 不自动创建 Activity。

原则：

```text
trace semantic boundaries, not function calls
```

---

## 8. API / SDK / CLI

Extension 和 Foundation 模块使用 Heptalogos-owned scoped SDK，而不是直接持有 root Pino/OTel/Evidence repository。

Management Contract 提供 lineage query read models。CLI 至少可以：

```text
activity show/tree/causes/list
trace show
logs --activity/--trace
extension inspect --activity
component inspect --calls
```

Operator Assistant 首先查询结构化 lineage，再解释原因；正常诊断不依赖 LLM grep 大量文本日志。

---

## 9. 与架构验证结合

Observed runtime call graph 可以验证架构不变量，例如：

```text
Subject Authority 不应观察到 protected SystemAction mutation path
Extension 不应观察到 raw PostgreSQL/root Secret backend path
Effect dispatch 必须存在 causal Decision/Action/Evidence refs
```

因此 Execution Lineage 同时是运行诊断、产品可解释性、Extension 可追溯性和架构 conformance 的公共地基。

当前规范见 [`Execution lineage Spec`](../specs/execution/execution-lineage.md)。
