# Foundation 系统服务目录

本文件规定 Foundation 必须提供的稳定语义合同。**Service/Contract 存在不等于必须自研 mechanics，也不等于每个未来高级子系统在 Foundation 阶段已有实现。**

```text
SERVICE/CONTRACT EXISTENCE
!= CURRENT IMPLEMENTATION AUTHORIZATION
```

Foundation service implementation 只有在存在以下至少一项时才获得当前授权：

```text
current consumer
or current invariant
or current accepted failure/security model
```

Service catalog 是 semantic ownership map，不是 Foundation completion checklist。
这条规则尤其适用于 `ResourceGovernor`、`BackupCoordinator`、advanced package
lifecycle 与其他 later-Horizon services。

---

## 1. Runtime / Kernel Contracts

### `MicroSystemSupervisor`

负责运行实例生命周期、health、resource ownership、generation identity 和 shutdown settling。

### `RuntimeReconciler`

根据：

```text
Desired State
Actual State
Dependencies
Capabilities
Health
OperatingMode
Resource Pressure
```

计算并执行 reconcile plan。

### `ServiceRegistry`

维护 typed Service provider/binding。底层 DI/scope mechanics 可由 qualification 通过的 substrate 承担。

### `CapabilityRegistry`

维护动态能力目录，与 hard Service dependency 分离。

### `ReadinessEvaluator`

从 Services/Capabilities/OperatingMode/Pressure 计算 Readiness Profile。

### `OperatingModeController`

拥有系统 `OperatingMode` 的 canonical transition 与 eligibility override；模式切换必须有 structured reason、Authority、Lineage/Evidence，并触发 Runtime Reconcile。它不通过改写 durable Desired State 来模拟 Safe Mode/Maintenance/Recovery。

### `GenerationFence`

为 active scope、Service/Capability binding、Contribution 与 durable work 提供 generation identity/fencing 语义。旧 generation 在 retire/rebind 后不得继续取得新调用或提交需要 current-generation ownership 的结果。

### `ContractCompatibilityRegistry`

解释 Heptalogos `ContractVersionRange` 与 Service/Capability contract compatibility。它不把 npm semver、workspace version、package load order 当作产品语义兼容性 Authority。

### `ResourceGovernor`

提供 Foundation 统一资源压力与 admission contract：

```text
ResourceBudget
PressureSnapshot
AdmissionDecision
LoadSheddingPolicy
```

不要求自己实现所有底层 metrics；可消费 OS/runtime/DB/provider 指标。

---

## 2. `PersistenceService`

提供：

```text
canonical PostgreSQL access
HostOwnershipFence / HostOwnershipToken validation for mutating transactions
transaction composition
repository boundaries
schema/migration coordination
```

不向普通 Extension 暴露 root database handle。

---

## 2.1 `StorageWorkspaceService`

向 Extension/Domain 提供 lifecycle-separated scoped workspace：

```text
config / data / cache / temp
Blob client
migration/backup registration
resource usage
```

负责 PathProfile 映射、root isolation、path safety、atomic file mechanics 和 owner identity；不规定 owner 必须使用哪种数据库或文件格式。

---

## 2.2 `DataLifecycleRegistry`

登记 `DataOwnerDescriptor / DataStoreDescriptor`，统一提供：

```text
backup/restore participation metadata
purge/retention/portability policy
schema/data version
resource accounting
health/readiness
logical owner/store identity
```

Foundation 通过 Registry 协调 lifecycle；不获得 owner 私有 schema/query Authority。

---

## 2.3 `BackupCoordinator`

以 logical `DataOwner / BackupParticipant` 枚举并协调 Installation Backup/Restore participant closure：

```text
BackupEpoch / consistency barrier
participant prepare/snapshot/verify/release
manifest sealing
restore participant staging/rebind
rebuildable/external-reference classification
```

不会假设所有数据在 PostgreSQL 或一个共同目录。Destructive restore 进入
RecoveryOperation 后仍遵守 [`backup-portability-update-recovery.md`](backup-portability-update-recovery.md)
与 [`storage-lifecycle.md`](storage-lifecycle.md) 的 bounded recovery contract。

---

## 2.4 `ExtensionStateStore`

为简单 Extension/Feature 提供受 owner/scope/version 约束的 managed structured durable state：

```text
Package/MicroSystem ownership
instance / subject / resource scope
schemaVersion + revision
bounded transaction
quota/resource class
backup/export/purge participation
portability metadata
```

默认 mechanics 可以建立在 private PostgreSQL 上；它是便利选项，不是所有 Extension/Domain canonical state 的唯一 backend。复杂 owner 可以在 `StorageWorkspace` 中使用 SQLite/文件/嵌入式 store，或注册 external/complex `DataOwner`。

---

## 3. `TimeService`

提供：

```text
semantic wall-clock Instant
monotonic elapsed duration abstraction
IANA TimeZoneId semantics
replay/fake time
clock-jump aware scheduling inputs
```

持久化机器时间使用 `Instant`；需要人类时间语义的对象同时保留 timezone/origin semantics。

---

## 4. `DurableExecutionService` when a current consumer requires it

Heptalogos-owned durable operation facade when a current product consumer
requires durable operation state. Current target Desired/Actual reconciliation
and bounded synchronous results remain with their owning target.

角色包括：

```text
ManagementOperation
ActionPlan execution
durable waits
approval waits
maintenance/update/backup workflows
```

Durable execution mechanics 由成熟 engine 承担；engine private state 不成为产品 Authority。

---

## 5. `WorkQueueService`

拥有产品级 durable work obligation：

```text
WorkItem
handler/contribution/generation
schemaVersion
priority
notBefore
partition
dedup
cancel/supersede
outcome
```

queue mechanics 与 `WorkItem` 语义分离。

---

## 6. `SignalService`

提供 best-effort change/wakeup hints：

```text
work-ready
config-changed
capability-changed
activity-ready
```

Foundation mechanics 使用 PostgreSQL `LISTEN/NOTIFY`。

Signal 永远不承载唯一 durable truth；listener 重连后重新订阅并重新查询 canonical state。

---

## 7. `ConfigurationService`

拥有：

```text
ConfigurationDefinition
ConfigurationRevision
ConfigurationActivation
Configuration Surface Registry
Management Projection metadata
```

核心原则：

```text
Config existence != visibility != editability
source/proposal changed != active
```

JSON Schema 2020-12 + Heptalogos annotations 是稳定 contract。

ConfigurationDefinition 与物理 backing 正交。支持 `BOOTSTRAP_FILE / MANAGED_REVISION / DECLARATIVE_FILE / OWNER_NATIVE / DERIVED_READ_ONLY`；同一 namespace 同时只有一个 write Authority。Managed core config 提供 human-readable versioned projection/export，file-backed config 不被数据库静默覆盖。

---

## 8. `SecretService`

配置只保存 `SecretRef`。

`SecretService` 负责 secret material 的受控解析、存储后端抽象与
caller/purpose scope；密码学 key/trust-root 生命周期受治理与
[`data-evidence-persistence.md`](data-evidence-persistence.md) 的独立
trust-domain 规则约束。

禁止 plaintext fallback。

---

## 9. `NetworkAccessService`

提供 Foundation 默认 outbound network access contract：

```text
NetworkRequestContext
DestinationPolicy
ProxyProfile
TlsProfile
RequestBudget
redirect policy
response/decompression limits
network Evidence/telemetry metadata
```

Foundation/Extension 若使用内部自行发网的 SDK，必须证明其 transport 可被同等 policy 约束，或显式声明无法强制的边界。

`NetworkAccessService` 不拥有业务 effect semantics；真正 consequential external write 仍进入 `EffectOperation`。

---

## 10. `ArtifactService`

拥有：

```text
Artifact
Blob CAS
provenance
ownership
sensitivity
retention
media processing coordination
```

Blob bytes 与 semantic Artifact 分离。

---

## 11. `EvidenceService`

持久、typed、versioned、causal Evidence。

与 Pino/OpenTelemetry/OpenInference 分离，并遵守 observability/redaction governance。

---

## 11.1 `ExecutionLineageService`

统一创建、传播和结束 Heptalogos semantic `Activity`，维护：

```text
ActivityId
parent / causation / links
Package / Generation / MicroSystem / Contribution origin
Feature / Service / Capability / Provider target
principal / authority / Subject scope
importance / retention / sensitivity
outcome
telemetry correlation
```

OpenTelemetry Span/Pino log 是其 telemetry projection；required Evidence/Audit 不依赖 telemetry sampling。

### `LineageQueryService`

提供 Activity tree、causal chain、runtime call graph、Extension lifecycle、Service consumer/provider、failure propagation 等 read-only projection，供 CLI、Management API、external Presentation 和 authorized Machine Operations agents 使用。

详细视图见 [`execution-lineage.md`](execution-lineage.md) 与
[`Execution lineage Spec`](../../specs/execution/execution-lineage.md)。

---

## 12. `PolicyService` when a current policy consumer exists

拥有 authorization contract：

```text
principal
action
resource
context
→ permit / forbid
```

Cedar policy model 承担 evaluation mechanics。

不负责 Authentication、Risk、Approval 或 Execution。

---

## 13. `ApprovalService` when a current durable approval consumer exists

根据：

```text
SystemAction
SystemChangePlan
risk
origin
auth freshness
```

生成和管理 durable `ApprovalRequest`。当前 one-Administrator slice 的 exact
SystemChangePlan confirmation 不创建这个通用服务。

---

## 14. `ManagementActionService`

统一 `SystemAction` registry / plan / execute / verify。

CLI、HTTP、external Presentation 和 authorized Machine Operations tools 都投影同一 semantics。

---

## 15. `ExtensionPackageManager`

负责：

```text
acquire
verify
stage
install immutable generation
retire
purge eligibility
```

Package Manager 不直接运行 MicroSystem，也不拥有 Runtime Authority。

---

## 16. `MessagingService`

负责：

```text
canonical messaging domain
accounts/conversations/messages/segments
protocol capability
Driver boundary
delivery outcomes
```

不拥有 Observation/Attention/Memory/Relationship。

---

## 17. `AIRuntimeService`

拥有：

```text
ProviderProfile
ModelProfile
ModelBinding
AI SDK runtime materialization
provider conformance
```

不拥有 Subject。

---

## 18. `CapabilityBroker`

统一：

```text
capability availability/provider selection
scope
policy
Secret resolution
network/effect constraints
invocation
retry/idempotency policy
Evidence
generation fence
```

`Capability != Tool`。

---

## 19. `SubjectService`

拥有：

```text
SubjectId
SubjectDesiredState
SubjectActualState
Subject authority head/revision
Subject readiness
```

Subject continuity 不依赖 Persona/Memory 等高级子系统存在。

---

## 20. Advanced Cognition Extension Contracts

Foundation 只冻结高级认知子系统的接入面，不提供其具体实现。

保留逻辑 Service/Contribution families，例如：

```text
subject.persona
subject.memory
subject.relationship
subject.attention
subject.appraisal
subject.epistemic
subject.commitments
subject.reflection
```

统一要求：

```text
optional / unavailable is valid
Context/Proposal authority ceiling
provenance/Evidence
configuration namespace
lifecycle/readiness
no parallel infrastructure
```

Foundation 不规定 MemoryRecord schema、retrieval algorithm、embedding/index backend、Persona ontology 或 Relationship model。 高级 Domain 可以拥有自己的 SQLite/关系库/索引/external backend，但必须注册 DataOwner 并复用 Foundation Path/Workspace、Backup/Restore/Purge、resource accounting 与 Lineage mechanics。

---

## 21. Data Lifecycle Coordination Contract

跨 owner lifecycle 由 `DataLifecycleRegistry` 协调。删除/保留使用：

```text
PurgePlan
RetentionFence
DataOwner
logical tombstone
physical purge
backup/export fence
```

各 canonical owner 仍负责自己的数据模型、存储引擎和 migration；跨 owner purge/backup/restore 由 Foundation coordinator 按 owner contract 协调。

---

## 22. Contract Compatibility Contract

所有 durable/cross-generation/cross-process contract 必须声明：

```text
contractVersion / schemaVersion
reader compatibility
migration/upcast rule
minimum supported generation
replay behavior
protocol revision
```

具体横切规则由相关 Specs 和
[`knowledge-system.md`](../../project/engineering/repository/knowledge-system.md)
分别拥有；本页只保留 Foundation 的概念边界。

---

## 23. Availability / Readiness Vocabulary

不同状态维度不得混用：

Service / Capability availability：

```text
AVAILABLE
DEGRADED
UNAVAILABLE
NOT_CONFIGURED
FAILED
```

Readiness Profile：

```text
READY
DEGRADED
BLOCKED
```

`WAITING_DEPENDENCY`、`BLOCKED_POLICY` 等属于具体 MicroSystem Actual State / structured reason，不是 Service/Capability availability 的同义词。

可选高级 Service 为 `UNAVAILABLE` 不得让 Foundation 或 Subject Base 自动判定失败，除非某个 Feature Readiness Profile 显式要求它。
