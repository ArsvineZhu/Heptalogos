# S13 Foundation Service / Capability / Readiness Catalog

## Kernel / Internal Contracts

```text
MicroSystemSupervisor
RuntimeReconciler
ServiceRegistry
CapabilityRegistry
ReadinessEvaluator
OperatingModeController
ResourceGovernor
GenerationFence
ContractCompatibilityRegistry/metadata
```

具体 class/package 布局不属于架构 Authority。

---

## Contract Versioning 与 Provider Resolution

Service/Capability descriptor 必须携带稳定 semantic ID 与 contract version。Consumer requirement 使用 `ContractVersionRange`，由 `ContractCompatibilityRegistry` 解释，不借 npm package semver、workspace version 或 load order 隐含 compatibility。

Capability 多 Provider 选择顺序：

```text
explicit binding
→ policy/trust/scope/contract eligibility
→ health/readiness
→ configured preference/priority
→ stable ProviderId tie-break
```

selection/rebind 产生结构化 ReconcilePlan/Activity。Hard Service graph cycle 是 configuration/contract error，而不是靠启动顺序碰运气。

## Foundation Services

```text
heptalogos.persistence
heptalogos.storage-workspace
heptalogos.data-lifecycle
heptalogos.backup
heptalogos.extension-state
heptalogos.time
heptalogos.durable-execution
heptalogos.work-queue
heptalogos.signal
heptalogos.configuration
heptalogos.secrets
heptalogos.network-access
heptalogos.artifacts
heptalogos.execution-lineage
heptalogos.lineage-query
heptalogos.evidence
heptalogos.policy
heptalogos.approval
heptalogos.management-actions
heptalogos.extension-packages
heptalogos.messaging
heptalogos.ai-runtime
heptalogos.capability-broker
heptalogos.subject
```

逻辑 ID 可以在实现规范中精化，但语义不能随 workspace/package 名变化。

---

## Advanced Cognition Optional Service Families

Foundation 只预留 contracts：

```text
subject.persona
subject.memory
subject.relationship
subject.attention
subject.living-state
subject.appraisal
subject.epistemic
subject.commitments
subject.reflection
```

其默认状态可以是：

```text
UNAVAILABLE
```

不影响 Subject Base，除非具体 Feature Readiness Profile 显式要求。

---

## Capability Families

### Messaging

```text
subject.messaging
subject.messaging.direct
subject.messaging.external
messaging.group
messaging.send.text
messaging.send.image
messaging.reply
messaging.retract
messaging.react
```

### AI

```text
ai.text-generation
ai.streaming
ai.structured-output
ai.tool-use
ai.vision
ai.embedding
```

Capability 是否 READY 取决于具体 `ModelProfile` conformance；Foundation 不因存在 `ai.embedding` contract 就实现 Memory。

### Content / Media

```text
content.read
content.create
content.derive
media.image.transform
media.probe
media.transcode
```

### Network / External Tools

```text
network.request
web.search
weather.read
future calendar.*
future mail.*
```

外部 capability 必须带 domain/scope/effect/risk/network metadata。

---

## Readiness Profile: Recovery

尽量只要求：

```text
bootstrap payload
filesystem
local installation-owner OS recovery principal/ACL boundary
private PostgreSQL inspect/start ability when needed
bounded product-generation controls
```

不要求 AI、Subject、third-party Extensions、normal Web/GUI 或高级 cognition。

---

## Readiness Profile: Management

Management 必须避免“观测/审计坏了所以无法进入系统修观测/审计”的自锁。基础可管理核心要求：

```text
Persistence sufficient for management state
Configuration
Authentication/session core
Policy fail-closed path
ManagementAction read/diagnostic/recovery-safe path
runtime basic introspection
complete CLI management path
HTTP Management API when normal Host server is used
Secret status/rebind ability
```

正常情况下同时要求：

```text
ExecutionLineage / LineageQuery
Evidence
Approval
full mutation operation support
```

若 Lineage/Evidence/Audit persistence 不可用：

```text
Management = DEGRADED
read/diagnostic and explicitly recovery-safe actions remain available
mutation classes requiring durable lineage/evidence/audit fail closed
no silent untracked mutation
```

若 Policy/Authentication 等安全核心不可证明，normal mutations fail closed；bounded Recovery Plane 仍独立存在。

Operator Assistant、Subject、高级 cognition 均不是 Management READY 的前提。

---

## Readiness Profile: Subject Base

至少：

```text
SubjectService
Persistence
Time
WorkQueue
DurableExecution
Evidence
ExecutionLineage
MessagingService
>=1 subject.messaging
AI capabilities required by Basic Reaction
Basic Reaction/Context/Prompt contracts
```

Persona、Memory、Relationship、Attention 等高级 subsystem **不是 Subject Base dependency**。

如果某个高级 Feature 需要它们，由该 Feature 自己声明 readiness requirements。

---

## External Messaging Profile

```text
>=1 subject.messaging.external
```

Subject Chat 可以满足 `subject.messaging` / direct messaging，但不满足 external profile。

---

## Operator Assistant Profile

```text
Management READY
operator ModelBinding READY
SystemAction Catalog
Runtime/Evidence query capabilities
```

不依赖 Subject READY。

---

## Pressure-aware Readiness

ReadinessEvaluator 同时考虑：

```text
OperatingMode
PressureSnapshot
Admission state
```

例如：

```text
Management = READY
Subject Base = DEGRADED / BLOCKED
```

在 disk/resource pressure 下完全合法。

---

## Feature Profiles

高级 Feature 自己声明：

```text
required optional Services
required Capabilities
minimum contract versions
resource budgets
availability fallback
```

一个高级 Feature `UNAVAILABLE/FAILED` 不应把整个 Host 或 Subject Base 拖成失败状态。
