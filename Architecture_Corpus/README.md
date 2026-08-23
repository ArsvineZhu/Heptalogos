# Heptalogos 架构语料库

**设计版本：** 2026-08-20  
**文档语言：** 简体中文；代码标识符、协议名、库名、类型名保留英文。  
**性质：** 当前态系统设计，不是实现计划，不是历史讨论摘要。  
**目标：** 读者不依赖其他对话、旧计划或仓库历史，即可理解 Heptalogos 的产品目标、系统边界、Authority、Foundation 责任、扩展接入方式、技术决策和验证要求。

---

## 一、Heptalogos 是什么

Heptalogos 是一个面向真实即时通信环境的、**单一持续 Subject（主体）** AI 交互系统。

它不把每条消息理解为一次独立的：

```text
用户请求
→ 拼 Prompt
→ 调模型
→ 返回文本
```

而是把 AI 视为一个可以跨越下列边界持续存在的 Subject：

```text
多条消息
多个会话
多个 IM 平台
多次模型调用
模型/Provider 切换
Host 重启
Extension 升级
长时间等待
```

项目的研究差异化集中在 Subject 连续性、真实 IM 事件流、认知与行为决策、长期适应、自主性、证据与评估。Foundation 的职责是提供这些研究系统可以长期依赖的稳定地基，而不是提前实现所有高级认知算法。

---

## 二、Foundation 的目标

Foundation 采用：

```text
foundation-complete
feature-minimal
```

必须完整提供：

```text
Bootstrap / Recovery
Runtime supervision / reconciliation
Persistence / transactions
Durable execution / WorkQueue / Signal / Time
Configuration / Secrets
Policy / Approval / Management Actions
Extension package / runtime contracts
Messaging / Subject Chat
Subject Core
AI Runtime / Capability / MCP integration
Basic Reaction / Context / Prompt contracts
Execution Lineage / Observability / Evidence / Replay / Content
Network / resource / compatibility / lifecycle contracts
Backup / update / distribution
Typed Management Contract
complete reference CLI
HTTP / protocol APIs
verification / dependency qualification
```

Foundation **不研究或实现**高级认知子系统，例如：

```text
Persona system
Memory system / retrieval
Relationship
Global Attention
advanced Observation Window
Living State
Appraisal
Epistemic State
Commitments / Subject Schedule
Proactive Behavior
Reflection / Diary
Dream / Simulation
Person identity fusion
long-term goals/projects
advanced voice/multimodal behavior
```

但必须为这些系统保留正式、typed、受 Authority 约束的：

```text
Service contracts
Capability contracts
Context/Activity contributions
configuration hooks
Evidence/provenance hooks
availability/readiness semantics
```

高级子系统不得为了自身需求重新建立平行的 scheduler、workflow、Messaging、Authority、Secret、Path/Workspace、Backup/Restore/Purge 等 Foundation 基础设施。它们可以按领域需要选择自己的数据库/文件/索引 backend，但必须作为 DataOwner 接入统一生命周期治理。

---

## 三、系统整体形态

```text
Bootstrap / Recovery Core
        ↓
Runtime Kernel
        ↓
Foundation System Services
        ↓
Drivers / Providers / Domain Engines
        ↓
Optional Research Subsystems / Features
        ↓
Applications / Presentation Clients
```

除不可继续拆分的 Bootstrap / Recovery / Kernel 闭包外，大部分运行能力通过统一的：

```text
MicroSystem
Service
Capability
Contribution
Package
Generation
Readiness
```

模型组合。

“统一模型”不等于“所有代码必须使用同一 framework”，也不等于“内建系统服务等于第三方插件”。

---

## 四、最高工程原则

### Library-First

> **Heptalogos 定义产品语义、Authority 与 contracts；成熟标准、库、协议和平台设施优先承担 generic mechanics。**

```text
standard / OS facility
→ mature library
→ mature framework behind a narrow adapter
→ composition of mature primitives
→ custom implementation only with evidence
```

### Configure First, Expose Intentionally

```text
configuration existence
!= visibility
!= editability
```

行为影响值必须先分类，再决定是否向普通用户暴露。`INTERNAL/HIDDEN` 不等于 hardcoded。

### Management Contract First

系统管理能力先形成 typed Management Contract，再投影为客户端：

```text
Domain / Service
→ Management Contract / SystemAction
→ complete CLI
→ HTTP / protocol API
→ independent Presentation design
```

CLI 是 Foundation 的**完整 reference management client**。Web UI 的视觉、布局、renderer、microfrontend 技术和页面实现不属于 Foundation 建设范围；Foundation 只冻结 Web/客户端可消费的协议、数据、动作和扩展接口。

### Evidence-First Dependency Selection

依赖选择优先使用直接证据；只有无法从规范、源码、类型、测试、包元数据和维护状态确定的问题，才写最小 probe。

```text
L0 direct evidence
→ L1 micro probe
→ L2 boundary probe
→ architecture selection
→ implementation
→ L3 product qualification
```

**不得为了选择一个依赖先实现一个“小 Heptalogos”。**

已经 `ADOPTED` 的依赖角色是实现指令，不是可选建议。编码 Agent 必须按 `24-依赖使用与实现路由.md` / `references/dependency-routing.json` 使用既定 standard/library/framework behind narrow adapters；不得因为默认“少加依赖更保守”而重写 generic mechanics。

实现仓库必须把这项决策物化为可机械检查的依赖治理：

```text
pnpm-workspace.yaml Catalogs = 已采用 npm 依赖的版本入口
catalogMode: strict          = 禁止 workspace 随手声明另一条版本/依赖路线
Nx / ESLint / route gate     = 限制第三方库只从声明的 adapter/infrastructure boundary 进入
```

缺少 adapter 时应围绕既定依赖实现 adapter，而不是用“暂时少加依赖”的 custom fallback 代替。新增依赖必须先分类其 architecture role；不得静默为已有 `ADOPTED` role 引入第二 provider。


Repository language/tooling baseline is also an adopted route, not a compatibility floor:

```text
TypeScript 7 primary compiler
TS6 compiler-API compatibility lane only
ESNext / NodeNext / ESM-first
Node 24 runtime types aligned to Node 24
```

Exact versions are refreshed from current registry/upstream evidence and pinned in pnpm Catalog/lockfile; Agent memory or an old patch number is not version authority. Prerelease/0.x labels are evaluated by maturity/capability/risk evidence rather than automatically rejected. See `25-TypeScript与仓库工具链.md`.
---

## 五、横切 Foundation 不变量

以下规则适用于多个子系统：

```text
NETWORK IS AN EFFECT.
PRESSURE IS A STATE.
DURABLE PAYLOADS ARE VERSIONED.
DELETION IS A WORKFLOW.
CRYPTO HAS A LIFECYCLE.
NATIVE TRANSITIVES ARE PRODUCT DEPENDENCIES.
PROTOCOL REVISION IS DATA.
EVERY MEANINGFUL OPERATION HAS LINEAGE.
TELEMETRY MAY BE LOST; REQUIRED EVIDENCE MAY NOT.
LOG SEVERITY IS NOT EVIDENCE IMPORTANCE.
LIFECYCLE ROOTS ARE INDEPENDENT.
STORAGE OWNERSHIP IS GOVERNED; STORAGE ENGINE IS OWNER-SELECTED.
CONFIGURATION SEMANTICS DO NOT IMPLY CONFIGURATION STORAGE.
BACKUP COVERS DATA OWNERS, NOT ONE DATABASE OR DIRECTORY.
LEASE OWNERSHIP MUST FENCE MUTATION.
BACKGROUND WORK IS OWNED OR DURABLE.
RESTORE DOES NOT ROLLBACK EXTERNAL REALITY.
```

基础横切合同见 `specs/S15-Foundation横切合同.md`；Execution Lineage 的完整运行合同见 `specs/S16-Execution-Lineage-Observability.md`；Storage Workspace、Configuration Backing、DataOwner 与 heterogeneous Backup 合同见 `specs/S17-Storage-Workspace-DataLifecycle.md`。

---

## 五点一、实现闭环的固定前提

Implementation Plan 必须以以下当前态合同为前提：

```text
stable Bootstrap Closure outside ProductGeneration
bootstrap lock → PostgreSQL Host lease without ownership gap
local one-shot first administrator claim
BootstrapKeyProvider separate from normal SecretService
PrivatePostgresProfile with least-privilege roles
RecoveryOperation for operations that replace normal durable substrate
static Core Management Contract + dynamic SystemActionCatalog
independent PathProfile lifecycle roots; Program/Instance/Config/Data/Secret are not one deletion unit
StorageWorkspace/DataOwner lifecycle contract; ExtensionStateStore is an optional managed-state convenience
Configuration source/backing is explicit; managed core config has human-readable projection/export
Backup enumerates DataOwner/BackupParticipant closure, not one DB/directory
DBOS applicationVersion != Extension PackageGeneration
canonical JCS/domain-separated digest
non-mutating JSON Schema 2020-12 validation
Execution Lineage from bootstrap to shutdown
HostOwnershipFence for every canonical mutation/effect dispatch
ContinuityEpoch for destructive restore reconciliation
owned-or-durable background execution
```

这些是 Foundation 语义，不应在 Implementation Plan 中重新发明另一套模型。其他固定横切前提包括：

```text
stable semantic ID / UUIDv7 generated ID / content-digest generation / scoped ExternalId are distinct
versioned Problem across Management/API/CLI; RFC 9457 is the HTTP projection
BootstrapStateStore commits canonical/digest/revision bootstrap metadata crash-safely
Secret backup/restore uses explicit portability classes
BootstrapKeyProvider root never migrates across installations
```

---

## 六、文档结构

建议阅读顺序：

0. `00-项目宪法与工程宪法.md`
1. `01-产品目标与差异化.md`
2. `02-架构原则与反NIH约束.md`
3. `03-核心概念与Authority.md`
4. `04-总体系统架构.md`
5. `05-整机执行模型.md`
6. `06-MicroSystem与Extension架构.md`
7. `07-Foundation系统服务目录.md`
8. `08-Subject与认知系统.md`
9. `09-Messaging与Subject-Chat.md`
10. `10-AI-Runtime-Capability-MCP.md`
11. `11-System-Authority与Operator-Assistant.md`
12. `12-数据-证据-内容与持久化.md`
13. `13-备份-Subject可移植性-更新与恢复.md`
14. `14-跨平台产品运行与分发.md`
15. `15-技术与依赖决策账本.md`
16. `16-验证与资格认定体系.md`
17. `17-高级研究子系统接入地图.md`
18. `18-接口-CLI-Web与Presentation.md`
19. `19-术语表.md`
20. `20-架构审查清单.md`
21. `21-配置治理与Configuration-Surface.md`
22. `22-Execution-Lineage与可观测执行.md`
23. `23-存储拓扑-生命周期根与DataOwner.md`
24. `24-依赖使用与实现路由.md`
25. `25-TypeScript与仓库工具链.md`
26. `26-开发阶段闭包-稳定化与兼容性治理.md`

`specs/` 提供 Foundation 子系统与横切合同的详细设计。

`qualification/` 只记录**Foundation 当前真正需要决定的依赖角色**、最小证据计划和结果；不承担 Web UI 技术选型或高级认知算法选型。

`qualification/dependency-status.json` 是依赖状态的机器可读 Authority。 当前 Foundation provider selection 已收敛：Implementation Plan baseline 不含 `PRIMARY_CANDIDATE` / `UNRESOLVED`；剩余平台/native/source-less 风险通过 `ImplementationQualification` 管理。

---

## 七、明确的非 Authority

以下机制不拥有产品 Authority：

```text
LLM output
AI SDK tool call
DBOS workflow status
WorkQueue priority
Signal / LISTEN-NOTIFY payload
SSE
OpenTelemetry span
OpenInference trace
Activity/Execution Lineage record
CLI parser
HTTP route
Web/Presentation state
Extension manifest
search index / embedding index
```

Authority 必须由领域和系统 contracts 显式定义。

---

## 八、实现计划与 Corpus 的关系

Implementation Plan 必须由本 Corpus 推导。

实现计划可以改变：

```text
task order
package split
file layout
adapter implementation
test organization
```

但不能静默改变：

```text
Subject definition
Authority
canonical truth
external-effect uncertainty
Extension lifecycle boundary
System / Subject separation
Management Contract / CLI completeness requirement
advanced-subsystem scope boundary
```

如果工程现实发现设计冲突，应显式回到 Architecture Corpus 修订，而不是在代码里绕开。

---

## Agent 实现入口

仓库根目录应保留 `AGENTS.md`。

```text
00-项目宪法与工程宪法.md
→ 长期项目/工程宪法

AGENTS.md
→ Agent 高频执行约束

specs/
→ 子系统与横切合同

qualification/
→ 未冻结 Foundation 依赖的最小证据验证
```
