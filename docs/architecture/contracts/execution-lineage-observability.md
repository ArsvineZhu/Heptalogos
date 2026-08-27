# S16 Execution Lineage、可追溯执行与可观测性

## 1. 目标

Heptalogos 的可观测性不是“各模块各写日志”。Foundation 必须能够从一次有意义的运行行为追溯：

```text
who initiated
→ which Package / Generation / MicroSystem / Contribution
→ which Feature / Service / Capability
→ which Provider was selected
→ which durable work / external effect followed
→ what outcome occurred
→ what Evidence proves the important parts
```

该模型从 Bootstrap 第一条记录开始，一直覆盖正常 Runtime、Extension discovery/registration/activation、Subject/Management execution、Recovery、Maintenance 和 Shutdown。

核心不变量：

```text
EVERY MEANINGFUL OPERATION HAS LINEAGE.
TELEMETRY MAY BE LOST; REQUIRED EVIDENCE MAY NOT.
LOG SEVERITY IS NOT EVIDENCE IMPORTANCE.
```

---

## 2. 四个不同对象

必须区分：

```text
Activity / Execution Lineage
Operational Telemetry
Durable Product Evidence
Security Audit Facts
```

### Activity / Execution Lineage

表示一次有语义边界的执行活动及其因果关系。它负责“谁调用了谁、为什么、从哪里来、后来导致了什么”。

### Operational Telemetry

Pino / OpenTelemetry / OpenInference 等承载 logs、traces、metrics 和性能诊断。允许采样、丢弃、过期。

### Durable Product Evidence

证明产品 Authority、重要状态变化和外部效果的 typed durable record。不能因为 telemetry exporter 故障而缺失。

### Security Audit Facts

对认证、授权、审批、敏感管理动作、trust-root/key lifecycle 等必须保留的安全事实。可实现为 Evidence 的受保护 audit class，但语义上不能退化为普通日志。

---

## 3. Activity 是产品语义，不是 OpenTelemetry Span

`Activity` 是 Heptalogos-owned execution-lineage object：

```text
ActivityId
ActivityKind
ActivityState
startedAt / endedAt
origin
semanticTarget
purpose
parentActivityId?
causationActivityId?
links[]
correlation refs
importance
sensitivity
retentionClass
outcome / outcomeRef
traceId? / spanId?
```

OpenTelemetry span 是该 Activity 的 telemetry projection，不是 Activity Authority。

因此：

```text
ActivityId != TraceId
ActivityId != SpanId
```

Trace 被 sampling/drop 不会改变 durable Activity/Evidence 语义。

---

## 4. ExecutionContext

Foundation 提供统一 `ExecutionContext`，至少包含：

```text
lineage:
  activityId
  parentActivityId?
  causationActivityId?
  links[]

origin:
  InstanceId
  InstallationId
  BootId
  ContinuityEpochId
  HostOwnershipToken?
  ProductGeneration?
  PackageId?
  PackageGenerationId?
  MicroSystemId?
  MicroSystemInstanceId?
  ContributionId?

semantic:
  featureId?
  serviceId?
  capabilityId?
  providerId?
  operationId?
  contractVersion?

principal/authority:
  principalId?
  authorityDomain?

subject scope:
  SubjectId?
  ConversationId?
  resource refs?

telemetry:
  traceId?
  spanId?
  traceFlags?
```

`ContinuityEpochId` is a bootstrap/recovery-visible timeline identity, not a
Boot identity or an Authority credential. Bootstrap Closure establishes the
expected epoch before normal lineage is exposed; canonical PostgreSQL must
materialize and verify the same ID. Ordinary restart changes `BootId` and
`HostOwnershipToken` but preserves the epoch. A destructive restore records a
new epoch and the resulting lineage must make that discontinuity explicit.
An epoch mismatch outside the authorized restore materialization window blocks
normal runtime and cannot be repaired by choosing one side implicitly.

进程内异步传播优先使用 Node `AsyncLocalStorage` 与 OpenTelemetry Context mechanics；业务代码不得自行建立第二套 thread-local/context stack。

跨进程、跨 durable wait、跨 WorkItem/DBOS、跨重启传播时，只依赖显式、versioned `LineageContextRef`；不能依赖进程内 AsyncLocalStorage。

---

## 5. 关系不是只有 parent-child

Heptalogos 的因果图至少支持：

```text
parent-child
caused-by
linked-to
supersedes
resumes
fan-out
fan-in
```

普通同步调用优先形成 parent-child。

异步 handoff、WorkItem、durable workflow、Signal wakeup、fan-out、recovery resume 等必须使用 durable causation/link，而不是伪造同步 call stack。

例如：

```text
MessageFact Activity
├─ caused WorkItem A
│  └─ resumes Reaction
└─ caused Evidence projection
```

OpenTelemetry Span Links 可作为 telemetry projection；durable lineage 仍由 Heptalogos IDs 表达。

---

## 5.1 Trust-bound Trace Propagation

OTel/W3C trace context 是 telemetry correlation，不是 Heptalogos origin/Authority。跨 trust boundary 时由 `NetworkAccess`/protocol adapter 应用显式 propagation policy：

```text
trusted internal endpoint
  → may continue/inject W3C trace context

third-party/external endpoint
  → inject only when endpoint/provider policy explicitly allows

untrusted inbound trace context
  → never controls ActivityId/Package/Generation/principal origin
  → create Host-assigned Activity root and optionally preserve validated external trace as a link/ref
```

Internal `ActivityId`、PackageGeneration、principal/Subject identifiers 默认不作为 arbitrary outbound headers 传播。Protocol 自己需要 correlation id 时使用 protocol-specific typed field，并记录 mapping。

---

## 6. ActivityKind

Foundation 至少定义以下稳定 family：

```text
bootstrap.*
recovery.*
runtime.lifecycle.*
runtime.reconcile
package.discovery
package.acquire
package.verify
package.stage
extension.resolve
extension.activate
extension.retire
service.call
capability.invoke
contribution.invoke
work.create
work.dispatch
work.execute
workflow.wait
workflow.resume
config.*
secret.*
network.request
model.invoke
mcp.invoke
messaging.ingress
messaging.delivery
subject.reaction
subject.commit
system.action.plan
system.action.execute
policy.evaluate
approval.*
management.operation
backup.*
restore.*
update.*
effect.*
shutdown.*
```

命名是稳定 semantic convention；实现细节不能任意创造无法查询的同义事件名。

---

## 7. Origin、Ownership 与 Purpose 分离

每次 Activity 至少能区分：

```text
origin/caller
ownership
semantic purpose
```

例如：

```text
Extension Package foo
→ Contribution foo.reply-context
→ Feature contextual-reply
→ MemoryService.query
→ Provider memory.primary
```

其中 Package/Generation/Contribution 是来源和 ownership；`contextual-reply` 是 purpose/Feature；`MemoryService.query` 是实际 Service boundary。

Host 必须自动注入可信的 Package/Generation/MicroSystem/Contribution identity。Extension 只能补充受限 semantic attributes，不能伪造 Host-assigned origin。

`InstanceId` is logical product identity；`InstallationId` 标识当前物理安装，`BootId` 标识一次启动。灾备跨机器 restore 保留 InstanceId、创建新 InstallationId/BootId；这些 provenance 字段都不授予 Authority。

---

## 8. 重要性、严重度、保留和敏感度正交

### Severity

仅描述一次 log/event 的运行严重度：

```text
trace
debug
info
warn
error
fatal
```

### Importance

描述产品层“这条活动有多值得保留/解释”：

```text
diagnostic
routine
significant
critical
```

### RetentionClass

```text
ephemeral
operational
retained
audit
```

### Sensitivity

```text
public
operational
sensitive
pii
secret
```

禁止通过把普通事件提升为 `error` 来获得长期保存。

`secret` plaintext 永远不得进入 Activity payload、Pino、OpenTelemetry、Evidence、Replay 或普通 Artifact。

---

## 9. ActivityRecord 与持久化策略

所有有意义的 semantic boundary 都创建 Activity identity。

是否持久化完整 `ActivityRecord` 由 policy 决定：

```text
diagnostic/routine
→ telemetry + bounded Activity index according retention

significant/critical
→ retained ActivityRecord

Authority/security/external-effect required facts
→ ActivityRecord + required Evidence/Audit
```

Foundation 默认必须 durable 保留至少：

```text
bootstrap/recovery stage transitions
ProductGeneration selection
Host lease acquisition/loss
MicroSystem significant lifecycle transitions
Extension discovery/verify/resolve/activation/retirement failures
SystemAction plan/execute/verify
Policy/Approval outcomes
ManagementOperation lifecycle
configuration/package/update/backup/restore mutations
EffectOperation lifecycle
critical resource-pressure/readiness changes
shutdown outcome
```

高频 Service/Capability calls 可按 bounded retention 保留 ActivityRecord，并由 trace sampling 控制详细 telemetry；不能默认永久保存所有调用参数/结果。

---

## 9.1 Lineage Data Lifecycle

Lineage 是可追溯性索引，不应通过复制 payload 变成绕过 Data Lifecycle 的永久数据仓。

默认：

```text
ActivityRecord stores typed refs + bounded safe metadata
large/message/model/provider payload stays in owning Evidence/Artifact/domain record
```

当 owning data 被 purge/redact：

```text
lineage relation may remain as tombstoned ref when policy allows
sensitive attributes are redacted according DataLifecycle plan
required security/audit facts retain only the minimum independently justified fields
```

不能因为“方便排障”让 Activity/log 永久保留已被 authoritative purge 的正文、Secret、PII 或模型上下文副本。Lineage retention 与 DataLifecycle/Backup fence 必须一起验证。

---

## 10. Automatic Instrumentation Boundaries

以下边界必须由 Foundation adapter 自动创建/继承 Activity，而不是依赖开发者手工记日志：

```text
MicroSystem lifecycle
RuntimeReconcile
ServiceRegistry invocation wrapper
CapabilityBroker.invoke
Contribution invocation
WorkQueue create/dispatch/execute
DurableExecution wait/resume
ManagementAction plan/execute/verify
Policy/Approval
NetworkAccessService
AIRuntime/model invocation
MCP invocation
Messaging ingress/delivery
EffectOperation
Extension package lifecycle
Backup/Restore/Update
```

普通 helper/function call 不自动 trace。

原则：

```text
trace semantic boundaries, not function calls
```

---

## 10.1 Service / Capability Invocation Facade

跨 ownership 的 Service/Capability 调用通过 Host-owned facade/client 自动绑定：

```text
caller Package/Generation/MicroSystem/Contribution
ServiceId / CapabilityId / operation
selected ProviderId/Generation
contract version
parent Activity / ExecutionContext
```

Consumer 不直接持有跨 Package 的 raw provider object。这样 declared dependency graph 与 observed runtime call graph 都能由真实 invocation boundary 重建，而不是靠 logger 文本猜测。

Facade 可以在 activation 时静态预绑定，Instrumentation 不要求 runtime reflective lookup 或 JS `Proxy`；具体实现以低开销、可测试为准。

---

## 10.2 Scoped Background Activity

Process-memory background task 必须由 `ActivationResourceScope` 创建/拥有，继承或显式 fork 当前 ExecutionContext，并在 scope stop 时取消/await。需要跨 crash 生存的 obligation 必须转为 WorkItem/typed durable primitive。

因此 LineageQuery 能区分：

```text
owned ephemeral activity
durable handoff
unowned task  # contract violation
```

## 11. Extension SDK

Extension SDK 提供 scoped observability API，例如：

```text
activity.with(...)
activity.link(...)
logger.debug/info/warn/error(...)
recordSemanticEvent(...)
```

Extension 不直接获得：

```text
root Pino logger
root OpenTelemetry provider
Evidence repository
Activity tables
```

Host SDK 自动绑定：

```text
PackageId
PackageGenerationId
MicroSystemId
ContributionId
current ActivityId
current trace context
```

Extension 自己产生的 semantic sub-activity 必须被当前 scope 约束。

Extension cannot self-promote an Activity to `audit`/unbounded retention or emit arbitrary-size/high-cardinality attributes. SDK 提供的是 bounded request；Host 根据 Contribution policy、importance ceiling、sensitivity schema、rate/byte budget 与 ResourceGovernor clamp/reject。Security Audit class 只能由 owning Foundation authority 创建。

---

## 11.1 Storage / DataOwner Lineage

Storage lifecycle 进入 semantic lineage：

```text
workspace.open
config.source.observe / config.activate
storage.atomic-write
storage.migrate
data.owner.register
backup.participant.prepare/snapshot/verify
restore.participant.apply
data.purge
blob.put/release
```

Lineage 默认记录 owner/store/backend class、size/digest/version、result 与 causation，不自动记录 TOML/SQL/文件正文。Owner-native DB 内部每条 SQL 不要求生成 span；跨 owner/lifecycle/backup/migration 等 meaningful boundary 必须可追溯。

绝对物理路径默认属于 sensitive diagnostics，不进入普通 Extension-visible Activity attributes；管理查询按 Policy 决定是否显示。

---

## 12. ExecutionLineageService

Foundation 提供 `ExecutionLineageService`：

```text
create/start/end Activity
propagate ExecutionContext
persist retained ActivityRecord
link activities
attach Evidence refs
project OTel span/log correlation
query causal graph
apply lineage retention/redaction policy
```

它不拥有：

```text
Subject state
SystemAction Authority
Effect truth
Package lifecycle Authority
```

它记录这些系统的执行血缘，但不替代其 canonical owner。

---

## 12.1 Instrumentation Recursion Fence

Execution Lineage/telemetry plumbing 不能通过普通 instrumentation boundary 再 instrument 自己，否则会产生递归 Activity/log/export。

Foundation 提供 internal suppression scope：

```text
persist ActivityRecord
write operational log sink
export OTel span/log/metric
read LineageQuery storage internals
bootstrap fallback logging
```

这些 plumbing operation 可以有专用 internal metrics/health counters，但默认不再创建普通 `service.call / network.request / persistence.*` Activity。

Suppression 只能由 Foundation observability adapter 使用，不能作为业务代码逃避 tracing/Evidence 的通用开关。Observability plumbing 失败使用 bounded fallback/stderr/health state 报告，避免错误报告本身再次递归。

---

## 13. LineageQueryService / Management Read Model

查询至少支持：

```text
get Activity
ancestors
children/descendants
causal chain
linked activities
activities by Package/Generation/MicroSystem/Contribution
service consumers
capability invocations/provider choices
extension lifecycle history
failed/critical activities
Evidence refs
trace/log refs when retained
```

必须区分：

```text
declared dependency graph
observed runtime call graph
```

两者都可用于诊断，但不能互相冒充。

---

## 13.1 Query Authorization

Lineage 可追溯不等于全局可读。`LineageQueryService` 每次查询都服从 principal/authority/scope/sensitivity policy：

```text
Administrator Management query
  → authorized diagnostic projection

Operator Assistant
  → same filtered Management read model; no raw-secret/hidden-payload bypass

Extension
  → only explicitly granted scoped lineage about its own resources/activities or declared capability

Subject Authority
  → cannot use lineage query to cross into protected System Authority/audit data
```

Query projection必须按 sensitivity/data-lifecycle policy redaction。Global operational call graph、security audit、PII-bearing diagnostics 默认不是 Extension SDK 的通用能力。

---

## 14. CLI / API

Canonical Management Contract 暴露 lineage read models。

CLI 至少支持语义族：

```text
activity show <id>
activity tree <id>
activity causes <id>
activity list --component/--extension/--service/--capability
trace show <trace-id>
logs --activity/--trace/--component
extension inspect <id> --activity
component inspect <id> --calls
```

CLI/Operator Assistant 不直接 grep 私有日志文件作为正常诊断路径。

Operator Assistant 优先读取结构化 lineage/query result，再负责解释。

---

## 15. Early Observability / Bootstrap Handoff

正常 `ExecutionLineageService` 依赖 PostgreSQL，因此 Bootstrap Closure 必须提供极小 Early Observability：

```text
BootstrapActivityId
structured stderr/local log
BootstrapJournal
stage transitions
ProductGeneration attempt
private PostgreSQL start result
Host launch result
```

该路径不依赖正常 PostgreSQL/OTel collector。

PostgreSQL 和 normal Evidence/Lineage ready 后：

```text
BootstrapJournal
→ import/reference as bootstrap lineage
→ continue same causation chain
```

Recovery 在数据库不可用时至少可以读取 bounded BootstrapJournal，而不是要求先恢复坏掉的数据库才能知道上次启动死在哪里。

---

## 16. Shutdown

Graceful shutdown 是一条正式 lineage：

```text
shutdown.requested
→ ingress quiesced
→ Subject quiesced
→ durable/effect reconciliation
→ MicroSystems disposed
→ acquire bootstrap ownership if private PostgreSQL will stop
→ Host lease released under bootstrap ownership
→ private PostgreSQL stopped when owned by this product mode
→ bootstrap ownership released
→ shutdown.completed
```

若中途 timeout/crash，BootstrapJournal/下一次 Recovery 能识别最后完成阶段。

---

## 17. OpenTelemetry / Pino / OpenInference Mapping

优先复用成熟标准：

```text
Activity → OpenTelemetry Span/Event projection
ExecutionContext → OTel Context / W3C trace context where crossing supported protocol boundaries
Pino log → ActivityId + TraceId/SpanId + origin metadata
AI/model/tool semantic fields → OpenInference conventions behind adapter
```

Heptalogos-specific semantic attributes 使用稳定命名空间，例如：

```text
heptalogos.activity.id
heptalogos.package.id
heptalogos.generation.id
heptalogos.microsystem.id
heptalogos.contribution.id
heptalogos.feature.id
heptalogos.service.id
heptalogos.capability.id
heptalogos.provider.id
heptalogos.contract.version
```

若 OpenTelemetry/OpenInference conventions 已有等价稳定字段，优先映射标准字段；不得因上游 convention 演化改变 Heptalogos canonical Activity model。

---

## 17.1 Selected Execution-context Mechanics

```text
transient in-process ExecutionContext
→ Node AsyncLocalStorage
→ OpenTelemetry Context API for telemetry projection
```

This route is adopted. Foundation must not build a second async-context propagation framework on top of raw `async_hooks`. Durable/cross-process/cross-restart lineage still uses explicit Heptalogos `LineageContextRef`; AsyncLocalStorage/OTel Context is not durable Authority.

---

## 18. Failure Semantics

```text
OTel exporter failed
→ telemetry DEGRADED
→ no Authority change

local operational log sink failed
→ observability DEGRADED / Pressure signal
→ critical failure may affect Readiness if no diagnostic sink remains

ActivityRecord persistence failed for required durable lineage
→ owning significant operation MUST NOT silently proceed when the contract requires durable lineage/evidence

required Evidence write failed
→ associated Authority commit/effect transition must follow its existing atomic/fail-safe rule
```

不能为了“系统还能跑”而静默丢失规定必须持久化的 audit/evidence。

---

## 19. Verification

至少验证：

```text
AsyncLocalStorage/OTel context survives normal async chains
WorkItem/DBOS resume restores durable causation but not stale process context
fan-out/fan-in uses links correctly
Extension origin cannot be forged
Service/Capability invocation automatically produces expected lineage
trace sampling does not remove required Activity/Evidence
secret/PII redaction
bootstrap before PG produces usable lineage
PG failure still leaves Boot/Recovery diagnostic trail
shutdown records terminal or interrupted stage
lineage query reconstructs Extension → Contribution → Service → Provider chain
runtime observed call graph matches synthetic expected graph
policy-controlled external trace propagation cannot forge internal origin
LineageQuery authorization/redaction
observability-internal suppression prevents recursive Activity creation
```

Property tests应检查重要架构不变量，例如：

```text
no observed SubjectAuthority path → protected SystemAction.execute
no Extension path → raw PostgreSQL/root Secret backend
all consequential EffectOperation dispatches have causal Activity/Decision refs
```
