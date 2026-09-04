# Heptalogos 项目宪法与工程宪法

本文件定义 Heptalogos 中**不应被普通实现便利、短期重构、框架偏好或仓库现状轻易改变**的长期原则。

它不是代码规范，也不是 Implementation Plan。

如果具体实现与本文件冲突，应优先重新审查实现；只有确认产品目标本身需要变化时，才修改本文件。

---

## 第一部分：项目宪法

### C1. Subject ≠ Model

Subject 是持续存在的认知与社会主体。

以下对象都不能与 Subject 等同：

```text
Model
Provider
Prompt
Reactor
Agent Loop
Conversation
Messaging Account
Host Process
Installation
System Assistant
Machine Operations Plane
```

更换模型、Provider、Prompt、Driver、Host generation，不应自动产生“新的 Subject”。

---

### C2. State > Prompt

长期状态必须由正式领域模型拥有，而不是依赖每次模型调用临时重建。

包括但不限于：

```text
Persona
Memory
Governance
Relationship
Living State
Epistemic State
Commitments
long-term goals
future learned traits
```

Prompt 只是某次 `InvocationSpec` 对当前状态的投影。

---

### C3. Proposal ≠ Authority

在 Heptalogos Product Authority 内，以下默认都只是 proposal：

```text
LLM output
Retriever result
Tool call
Extension inference
AI review
Counterfactual simulation
System Assistant proposal
```

在该 Product Authority 内，只有显式 commit / authoritative operation 才能
改变 canonical state。External machine/deployment operators act outside this
boundary at the OS/deployment layer.

---

### C4. Subject Authority、System Authority 与 Machine/Deployment Authority 分离

```text
Subject Chat
→ Subject Authority

Direct Management
→ Heptalogos System Authority

System Assistant / Maintenance Assistant
→ Machine Operations Plane
```

`AuthorityHandoff` 只能转移：

```text
intent
bounded context
reason
initiating principal
```

不能自动转移权限。

共享实现技术不会合并这些 Authority domain。Subject cognition runtime 与
System Assistant / Machine Operations runtime 必须保持独立的 Authority、信任、
凭据、生命周期、故障和机器权限边界；实现技术或软件版本相同不改变这些不变量。
具体的 process、Gateway、profile/state/config/workspace 与 tool allowlist 隔离
由当前 Architecture 和各自的集成合同决定，而不是由 Constitution 冻结某一种
实现方式。

---

### C5. Single Subject, Distributed Inference, Centralized Commit

允许：

```text
并行消息摄入
并行检索
并行模型调用
并行 tentative reasoning
多个 Activity
多个 Provider
```

但最终 Subject canonical state、行为决策和对外承诺必须有显式集中式 Authority fence。

---

### C6. Communication 是可选结果

Subject 不需要为每个 Observation 产生消息。一个被考虑的 communication
opportunity 可以在不产生 `CommunicationCommit` 或 outbound message 的情况下
合法完成。

No-communication 是局部 cognition episode 的成功结果，不是全局 Subject 行为
实体，也不是空字符串、超时或失败。`NotObserved`、`ObservedButDeferred`、
`DeliberatedAndSilent`、`SuppressedByPolicy`、`UnableToRespond` 和
`ReplyPlanned` 等区分可以用于分析和 Evidence，但不要求当前实现把它们全部
建模为 canonical durable state，也不要求模型生成自由文本的 silence reason。

---

### C7. External Reality 可以是不确定的

外部请求发出，不等于外部效果已知。

```text
prepared
→ dispatching
→ succeeded | failed | uncertain
```

`uncertain` 是合法真实状态。

系统不得为了简化 retry/state machine 而伪造确定性。

---

### C8. Product Truth 必须可追溯

重要状态变化、Decision、SystemAction、Effect、Memory、Persona influence 等必须尽可能有 Evidence / provenance。

解释必须基于真实 Evidence，而不是模型事后编造“为什么”。

---

### C9. Recovery 不得依赖坏掉的正常系统

恢复路径不能要求以下系统先正常：

```text
Subject
System Assistant / Machine Operations Plane
third-party Extension
normal Policy path
normal Web
normal Extension Runtime
```

Recovery Core 必须保持：

```text
small
bounded
local
AI-independent
```

---

### C10. Portability 跟随 Semantic Ownership

如果某状态被定义为 Subject 的一部分，而且要求可迁移，它必须存在于 Subject-owned semantic state。

不能仅存在：

```text
process memory
cache
DBOS private checkpoint
provider private state
Extension runtime object
```

---

## 第二部分：工程宪法

### E1. Semantic Ownership First

Heptalogos 必须拥有自己的领域语义与 Authority。

但：

```text
Heptalogos owns semantics
≠
Heptalogos implements all mechanics
```

---

### E2. Library-First / Anti-NIH

对非项目差异化的 generic mechanics，优先顺序：

```text
Standard / OS Facility
→ Mature Library
→ Mature Framework + Thin Adapter
→ Composition of Mature Primitives
→ Custom Implementation
```

自研不是默认选项。具体的 mechanics preflight、adapter 路由和实现决策程序由
[Engineering Principles](engineering-principles.md) 维护；本条保留其长期不可
绕过的 Library-First / Anti-NIH 原则。

---

### E2A. Adopted Dependency Is an Implementation Directive

当依赖角色已经：

```text
RoleDecision = ADOPTED
```

它就成为该 generic mechanics 的默认实现路线，而不是可忽略的建议。

```text
需要该 mechanics
→ 使用已采用 standard/library/framework
→ 置于 Heptalogos-owned adapter/facade 后
→ 完成对应 conformance / product qualification
```

不得因为“少依赖更保守”“自己写更简单”而另造平行实现。RoleDecision、实现路由、
资格证据和仓库机械约束的具体维护位置见
[Engineering Principles](engineering-principles.md) 与依赖 Authority。

---

### E3. Minimum Total Maintenance Burden

目标不是：

```text
最少 dependency
最少 framework
最少代码
```

而是：

```text
长期总维护负担最低
```

必须综合：

```text
custom LOC
adapter LOC
tests
debug complexity
cross-platform cost
security burden
upgrade burden
knowledge burden
failure handling
```

---

### E4. Configure First, Expose Intentionally

```text
Configuration existence
!= visibility
!= editability
```

行为影响值必须先分类，再决定是否进入普通 UI。

系统应优先拥有丰富、typed、可治理的 Configuration Surface。

---

### E5. Explicit Authority Before Convenience

在 Heptalogos Product Authority 内，任何重要 mutation 都必须先回答：

```text
谁有 Authority？
```

再考虑：

```text
怎样调用最方便？
```

不能因为 CLI、shell、SQL、tool call 更省事，就绕过正式 Product Authority
path。Machine/deployment operators act under their separate OS/deployment
Authority outside this product boundary.

---

### E6. Canonical Truth Before Async Processing

推荐：

```text
external input
→ canonical fact
→ durable work obligation
→ async processing
```

而不是：

```text
callback
→ queue
→ maybe persist later
```

---

### E7. Desired State ≠ Actual State

失败不能静默改写用户长期 intent。

例如：

```text
desired = enabled
actual = FAILED(authentication)
```

必须同时存在。

---

### E8. Reconciliation Over Imperative Orchestration

长期运行优先表达：

```text
Desired State
+ Current State
+ Dependencies
+ Capabilities
→ Reconcile
```

而不是维护大量特殊：

```text
startA()
thenStartB()
ifChangeCThenRestartD()
```

---

### E9. Failure Isolation and Graceful Degradation

非关键组件失败，应尽量只降低相关 Capability / Readiness Profile。

不能默认：

```text
one component failed
→ whole Host failed
```

---

### E10. Explicit Uncertainty Over Convenient Fiction

“不知道”必须可以被系统正式表达。

适用于：

```text
external effects
identity resolution
Memory confidence
Epistemic State
Replay completeness
provider capability
system qualification
```

---

### E11. Evidence Before Explanation

系统先记录真实输入、因果和决定，再生成自然语言解释。

---

### E12. Evidence Before Dependency Freeze

关键技术依赖、平台结论和协议支持必须有与结论强度匹配的证据。依赖选择遵循最小充分证据原则：

```text
L0 direct evidence
→ L1 micro probe when needed
→ L2 boundary probe when needed
→ architecture selection
→ implementation
→ L3 product qualification
```

不得为了判断一个 generic dependency 是否适用，先实现一个接近真实产品规模的子系统。Product qualification 用于证明最终实现与 shipping artifact，不用于替代架构选型。

---

### E13. One Canonical Authority, Many Derived Views

允许：

```text
index
cache
telemetry
Web projection
materialized views
```

但 derived view 不能替代 canonical truth。

---

### E14. Capability Before Concrete Provider

业务尽量依赖：

```text
Service
Capability
```

而不是依赖某个具体 Provider class / package implementation。

---

### E15. Extension by Contract, Not Framework Leakage

Extension SDK 应暴露 Heptalogos contract，而不是直接泄漏：

```text
raw DBOS
raw Fastify
raw Kysely root
raw Cordis Context
raw Presentation runtime internals
raw Cedar engine
```

---

### E16. Presentation Is Projection, Not Authority

External Product Presentation clients project Product Authority without owning
it. CLI is the headless ManagementClient/reference projection; Browser/Desktop
GUI belongs to an external Presentation repository. The Machine Operations
Plane is an external machine/deployment authority, not a second Product
Authority projection.

更换 Presentation 不应改变核心语义。

Foundation 管理能力的 reference projection 是 CLI：

```text
Domain / Service
→ typed Management Contract
→ complete CLI
→ HTTP / protocol clients
→ independently designed Presentation
```

Web UI 的视觉、页面组织和 renderer/runtime 技术不得成为 Foundation 完成条件。

---

### E17. Advanced Cognition Enters Through Contracts

Persona、Memory、Relationship、Attention、Living State、Appraisal、Epistemic State、Commitments、Reflection、Diary、Dream、长期目标等高级认知子系统不属于 Foundation 实现范围。

Foundation 只提供：

```text
Service / Capability contracts
Context / Activity contribution points
configuration / Evidence hooks
availability / readiness semantics
```

不得为了“给未来高级认知留空间”提前冻结其数据模型、检索算法、索引后端或学习机制。

---

### E18. Network Is an Effect

任何 outbound network access 都必须有显式 requester、destination policy、budget、timeout、size limit、proxy/TLS profile 与 Evidence/telemetry policy。第三方 SDK 内部网络调用也不能天然绕过产品网络策略。

Inbound Management / Webhook 暴露必须显式定义 bind、reverse-proxy trust、TLS、origin/CSRF、body size 与 authenticity 规则。

---

### E19. Pressure Is a State

资源压力必须成为可观察、可推理、可降级的运行状态，而不是到 OOM、disk-full、429 或 connection exhaustion 时才失败。

```text
NORMAL
THROTTLED
SHEDDING
BLOCKED
```

Admission、load shedding 和优先级必须服从 Authority 与 readiness，不得由 queue/library 私有指标暗中决定产品行为。

---

### E20. Durable Payloads Are Versioned

任何跨进程、跨 generation、跨升级、可持久化或可回放的 payload/contract 都必须有显式版本与兼容规则。

```text
VERSIONED != HISTORICALLY COMPATIBLE.
COMPATIBILITY REQUIRES A DECLARED OBLIGATION.
```

当前 `PRE_PRODUCTION` 的兼容性、baseline 重写和历史残留清理规则由
[Pre-Production Evolution](pre-production-evolution.md) 维护；唯一的机器可读
compatibility Authority 是
[compatibility-obligations.json](compatibility-obligations.json)。没有匹配声明，
就没有 compatibility obligation。

至少覆盖：

```text
Canonical Fact
Evidence
WorkItem
workflow input
Management API
Extension Manifest / SDK / Contribution
Subject Bundle
external protocol revision
```

---

### E21. Deletion Is a Workflow

删除语义不得简化为单表 `DELETE`。

必须区分：

```text
logical tombstone
physical purge
derived-data purge
blob purge
backup/export retention fence
restore compatibility
```

由 canonical owner 决定删除 Authority，跨 owner 清理通过可审计的 durable operation 协调。

---

### E22. Crypto Has a Lifecycle

Credential、Secret backend key、backup key、session key、TUF trust root、package signing trust root 是不同 trust domains。

必须定义 bootstrap、rotation、revocation、loss/recovery、version 与 headless/service startup 语义，不得把“SecretService 存东西”当作完整密码学生命周期。

---

### E23. Native Transitives Are Product Dependencies

任何 direct 或 transitive native/WASM binary dependency 都属于 shipping product closure。

开发机安装成功不证明：

```text
source-less packaging
Windows/macOS/Linux loadability
service-mode behavior
upgrade compatibility
```

---

### E24. Protocol Revision Is Data

外部协议版本、能力声明与 compatibility era 必须显式进入配置、连接状态或 Evidence。不得把“当前 SDK 默认行为”当永久协议语义。

### E25. Every Meaningful Operation Has Lineage

从 Bootstrap、Runtime、Extension discovery/activation、Service/Capability/Contribution invocation、WorkItem、SystemAction、AI/Network/Effect，到 Recovery/Shutdown，所有有意义的 semantic boundary 必须可以进入统一执行血缘。

```text
origin
→ ownership / generation
→ semantic operation
→ causation / links
→ outcome
→ Evidence/Audit refs when required
```

Activity/Lineage 用于回答“谁调用了谁、为什么、后来导致了什么”，但不替代领域 Authority。

---

### E26. Telemetry May Be Lost; Required Evidence May Not

Pino/OpenTelemetry/OpenInference 等 telemetry 可以采样、过期或因 exporter 故障而丢失。

规定为 durable 的 Activity、Evidence、Audit 或 Authority mutation proof 不能因为 telemetry failure 被静默省略。

```text
telemetry availability
!= product truth availability
```

---

### E27. Log Severity Is Not Evidence Importance

必须正交区分：

```text
severity
importance
retention class
sensitivity
```

不能通过把普通事件提升为 `error` 来获得长期保存，也不能因为一次操作成功就省略其 required audit/evidence。

### E28. Stable Identity Requires Canonical, Versioned Encoding

任何用于 Approval、manifest、replay、cross-process/generation identity 的 digest 都必须基于显式 versioned canonical encoding，并使用 domain/purpose separation。不能依赖语言对象枚举顺序、framework serializer 默认行为或未声明的 JSON mutation。

---

### E29. Recovery Cannot Depend on the Substrate Being Replaced

Restore、critical generation/data switch、private database repair 等会替换 normal durable substrate 的操作，进入 destructive boundary 后不能只依赖该 substrate 中的 normal workflow/management state。

必须有 bounded、crash-safe、AI-independent recovery ownership/journal，并且不能膨胀成第二个通用运行时。

---

### E30. Version Axes Must Not Be Conflated

至少明确区分：

```text
ProductGeneration
Durable-engine code/application version
Extension PackageGeneration
contract/schema/protocol version
```

只有存在显式 compatibility mapping 时才能关联，禁止为了方便把不同版本轴当作同一版本号。

### E31. Identities Are Typed

必须区分：

```text
stable semantic name
runtime/entity/event identity
content generation digest
external protocol identity
```

不同类别不能因为底层都能表示为 string/UUID/database key 就互相替代。Generated ID 的时间排序不构成领域时间 Authority，identifier 不构成 secret/permission boundary。

---

### E32. Problems Are Contracts

跨进程、API、CLI、Extension SDK 与 Management boundary 的失败必须有 stable machine-readable `Problem` identity/retry semantics，并能关联 Execution Lineage。

```text
human message != machine error identity
HTTP status != domain problem identity
CLI exit code != domain problem identity
```

---

### E33. Bootstrap State Is Crash-safe State

active/LKG generation、recovery journal 和 bootstrap trust refs 是产品启动 Authority 的一部分，必须 versioned、digested、在 bootstrap ownership 下 crash-safe commit。

禁止用未校验的裸文本/软链接/“最后一次 write 看起来成功”作为唯一启动真相。

---

### E34. Lease Ownership Must Fence Mutation

“持有 Host lease”不能只是一条进程内事实。任何 canonical mutation 与 consequential effect prepare/dispatch 都必须受数据库可验证的 Host ownership fence 保护。

```text
lease lost
→ old Host immediately stops admitting new mutation/effect work
→ new owner cannot become active until database ownership fencing linearizes prior in-flight mutation
→ after new HostOwnershipToken is published, stale Host mutation must fail
```

新 owner 建立 ownership token 时必须与旧 owner 的在途 mutating transaction 形成数据库级顺序，而不是依赖日志、心跳或进程内 boolean。已经在线性化点之前进入的 mutation 可以完成，但必须先于新 owner token；其 external effect 状态仍受 EffectFence 约束。

---

### E35. Background Work Is Owned or Durable

任何后台执行只能属于两类之一：

```text
ephemeral runtime work
→ activation/resource scope owned
→ stop/disable/shutdown cancels and awaits it

durable obligation
→ WorkItem / Foundation durable primitive
→ survives crash/restart by canonical state
```

禁止 unowned fire-and-forget Promise、裸长期 timer、无 generation/resource ownership 的 child process 或把“后台跑着”当作 durable semantics。

---

### E36. Restore Does Not Roll Back External Reality

恢复旧 snapshot 只能回滚 Heptalogos 的本地 canonical state，不能证明备份时间点之后的外部世界没有发生变化。

```text
local restore
!= external-world rollback
```

Destructive restore 必须建立新的 continuity epoch，失效可重放的认证/审批/管理执行状态，并对可能已产生 external effect 的旧 durable work 进入显式 reconciliation；禁止按旧 snapshot 自动重发 consequential effect。

---

### E37. Lifecycle Roots Are Independent

Program/Package generation、Runtime Instance metadata、Configuration、Durable Data、Secrets、Blob、Cache/Operational data 具有独立生命周期。

```text
physical co-location
!= lifecycle ownership
```

升级、卸载、禁用、删除代码 generation 不得隐式删除配置、数据或 Secret。PathProfile 可以把多个 root 映射到同一目录树，也可以映射到完全不同的 volume/OS path；任何 subsystem 都不得依赖共同父目录作为语义。

---

### E38. Storage Ownership Is Governed; Storage Engine Is Owner-selected

Foundation 统一：

```text
owner identity
scoped workspace/path
lifecycle
backup/restore
purge/retention
portability
resource accounting
Lineage
```

但不要求 Extension/Domain 把 canonical state 全部存入 core PostgreSQL。

Owner 可以选择适合自己的文件格式、SQLite/embedded store、专用索引或 external backend，只要注册 DataOwner/lifecycle contract并不绕过权限和产品治理。

---

### E39. Configuration Semantics Do Not Imply Configuration Storage

`ConfigurationDefinition` 描述 typed 语义、Authority、visibility/manageability 与 activation；它不等价于“value 必须存在 PostgreSQL”。

允许：

```text
BOOTSTRAP_FILE
MANAGED_REVISION
DECLARATIVE_FILE
OWNER_NATIVE
DERIVED_READ_ONLY
```

任何 namespace 在同一时刻只能有一个写入 Authority。Managed configuration 必须有稳定的人类可读 projection/export；file-backed configuration 不能再由数据库暗中成为第二 Authority。

---

### E40. Backup Covers Data Owners, Not One Database or Directory

Installation Backup 必须枚举 semantic DataOwner/BackupParticipant，并记录 logical owner/store identity、snapshot strategy、compatibility 与 digest。

```text
PostgreSQL dump
+ Blob closure
```

只是其中一组 participant，不是整个 Backup 定义。复杂 Extension/Domain store、Configuration files、Secrets、package closure 都必须通过自己的 participant/closure policy进入备份语义。

---

### E41. Foundation Provides Storage Mechanics, Not a Universal Data Model

Extension/Domain 不应自行重复实现：

```text
cross-platform path layout
config/data/cache/temp lifecycle roots
path isolation
atomic file mechanics
backup registration
restore/purge orchestration
resource accounting
```

Foundation 通过 StorageWorkspace / DataLifecycle API 提供这些 mechanics；owner 仍拥有自己的 schema、格式、数据库与领域 migration。

### E42. Modern Toolchain Is Evidence-pinned, Not Legacy-by-default

Heptalogos 控制自己的 shipping runtime，因此 Foundation 不为未声明的旧 JavaScript 环境主动降级语言基线。

```text
Node 24 LTS
+ TypeScript 7 primary compiler
+ ESNext / NodeNext / ESM-first
```

是当前仓库默认语言路线。仍依赖 TypeScript programmatic compiler API 的工具可以使用受隔离的 TS6 compatibility lane，但不得反向定义产品源码的编译/typecheck Authority。

Exact dependency version 必须来自当前 registry/upstream evidence，并由 Catalog/lockfile pin；模型记忆、旧文档和“保守地使用旧版”都不是版本依据。Prerelease/0.x/Beta/RC 也不能只因标签被拒绝：应按维护历史、真实使用、API churn、测试、所需能力、blast radius、pin/rollback 与产品 closure 资格判断。

```text
latest capable line
!= oldest stable by default
!= newest release at any cost
```

任何 toolchain upgrade 都必须显式验证 shipping Node、TypeScript、ambient types、Nx/lint/compiler-API compatibility 与 representative adopted dependency consumer compile。

### E43. Current Canonical Tree Is Not a Development Archive

当前 checkout 描述 canonical present，而不是产生它的 chronology。
Development provenance 属于 Git、completed plans 与 historical evidence。
Long-lived executable identities 必须使用当前 domain/operational semantics，
不得使用 milestone、PR、session 或 temporary migration identity。具体的
PRE_PRODUCTION current-tree archaeology、compatibility residue 和删除流程由
[Pre-Production Evolution](pre-production-evolution.md) 维护。

### E44. Executable Truth Is First-Class

```text
component correctness
+ architecture correctness
!= executable system correctness
```

实现声明在当前可用的最强 executable boundary 被实际运行之前，只能视为
provisional。系统必须区分两个正交维度：

```text
Semantic Truth
Executable Truth
```

Semantic Truth 覆盖 Authority、state、durability、ownership 与 uncertainty。
Executable Truth 覆盖 boot、compose、become ready、perform meaningful work、stop
以及 restart/recover。

一个 Horizon 不得在对应 executable path 仍为 `UNKNOWN` 时无限扩展其 Semantic
Truth。package-level tests PASS 也不能单独证明 product runtime。

### E45. Reliability Scope Follows Product Maturity

失败按当前产品成熟度分为：

```text
F0 HAPPY_PATH
   normal boot/work/stop

F1 COMMON_OPERATIONAL
   invalid input/config, port occupied, provider timeout,
   expected dependency unavailable, normal restart

F2 EXPECTED_RECOVERY
   process crash/restart, transient network loss,
   currently required durable recovery semantics

F3 RARE_TIMING_FAULT
   commit/ack ambiguity, narrow race windows,
   partial teardown timing, lease loss at exact transition

F4 CATASTROPHIC_HARDENING
   power loss, disk corruption, torn storage,
   kernel/hardware fault, multi-fault recovery
```

F0 必须先于在后续类别上投入 significant budget。F1 在当前 capability 存在时
处理；F2 只在当前 Horizon 语义要求时实现；F3 需要明确的当前 invariant 或已
接受的 product requirement；F4 属于 product/shipping hardening，默认不能驱动
早期架构。“可能发生”本身不是 implementation Authority。

### E46. Recovery Is Bounded, Not Recursively Complete

一种 recovery mechanism 不会自动要求为该 recovery 的每一种失败再实现一套
recovery。`FAILED`、`FENCED`、`RECOVERY_REQUIRED`、fail-stop 或 operator
intervention 都可以是合法的 terminal outcome。

高影响的可逆/不可逆操作必须显式定义 **Point of No Return**。在该点之前可以
尝试 bounded abort/restoration；越过该点后不得 heroic rollback 到旧的 Authority
状态，而应进入 bounded recovery/restart/reacquisition。当两者都能保留
Authority 与 truth 时，优先 fail-stop，不要不断增加 rollback branches。

### E47. Complexity Requires Present Justification

Architecture/catalog 中存在一个合同，不等于当前授权实现它。新增 state、durable
field、background worker、rollback path、recovery path、generic lifecycle
mechanic 或 security mechanism，必须至少由以下之一证明必要：

```text
current semantic invariant
current executable consumer
current accepted failure model
current explicit security threat
```

“future completeness”、“safer in theory”、“we may need it later”或 catalog 中
存在一个 Service 名称都不足以授权。具体 admission worksheet、failure model、
provider 路由和 STOP/reopen procedure 由
[Engineering Principles](engineering-principles.md) 维护；Tests 不会自行创造
product requirement。

## 第三部分：原则优先级

发生冲突时，优先级大致为：

```text
Project Constitution
    ↓
Authority / Truth / Safety invariants
    ↓
Engineering Constitution
    ↓
Subsystem Architecture
    ↓
Technology choice
    ↓
Repository / package / file layout
    ↓
implementation convenience
```

例如：

```text
某框架很方便
但要求模型输出直接成为状态
```

应拒绝框架用法，而不是修改 `Proposal ≠ Authority`。

又例如：

```text
某成熟 library 能显著减少 lifecycle 维护
```

应优先通过 adapter 复用，而不是为了“架构纯洁”坚持自研。

---

## 第四部分：变更规则

修改项目宪法必须：

```text
明确提出被修改的 principle
给出具体无法满足的真实场景
说明影响的 subsystem
说明兼容/迁移影响
说明是否改变产品定位
重新审查相关 canonical owner
```

普通 feature/bugfix/refactor 不得隐式修改这些原则。
