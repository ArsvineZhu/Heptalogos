# S15 Foundation 横切合同

本规格定义跨多个 Foundation 子系统都必须遵守、但不应被误建模成某个单一“万能 Service”的横切责任。

这些合同的目的不是增加架构层级，而是明确 ownership、状态、失败语义和验证边界。

---

## 1. Network / Egress / Endpoint Security

### 1.1 原则

```text
NETWORK IS AN EFFECT.
```

任何 outbound network operation 都必须能回答：

```text
谁发起？
为什么允许？
访问什么 destination？
使用什么 proxy/TLS profile？
最大等待多久？
最大读取多少？
是否允许 redirect？
是否可能产生 consequential external effect？
记录什么 Evidence/telemetry？
```

“某 SDK 自己会 fetch”不能成为绕过策略的理由。

---

### 1.2 NetworkRequestContext

canonical contract 至少表达：

```text
requester identity / generation
purpose
network effect class
destination descriptor
NetworkPolicyRef
ProxyProfileRef?
TlsProfileRef?
timeout budget
response byte budget
decompression budget
redirect policy
correlation/causation
sensitivity
```

`NetworkRequestContext` 不等于 HTTP request；它描述产品授权与资源约束。

---

### 1.3 Destination Policy

Destination policy 至少可表达：

```text
allowed scheme
host/domain rules
port rules
resolved-address restrictions
loopback/private/link-local/metadata restrictions where required
redirect revalidation
DNS re-resolution policy
proxy policy
```

对于管理员显式配置的 local endpoint，可通过明确配置授权，而不是全局关闭 SSRF 防护。

---

### 1.4 Managed Transport

Foundation 应提供默认受控 HTTP transport，优先复用 Node/Undici 等成熟 mechanics。

Provider SDK / MCP / Driver 若支持 custom `fetch` / dispatcher / transport injection，应接入统一 policy。

若第三方 SDK 无法接受可控 transport，必须在 capability/provider qualification 中声明：

```text
uncontrolled-network-boundary = true
```

并由产品决定是否允许该 Provider。

---

### 1.5 Consequential External Write

NetworkAccess 成功只表示 transport 层执行；如果调用会改变远端世界：

```text
send message
post content
modify remote resource
```

仍必须由 `EffectOperation` 管理外部效果不确定性。

```text
Network response received
!=
External effect semantically known
```

---

### 1.6 Inbound Endpoint Security

Management / webhook / protocol endpoint 必须显式声明：

```text
bind address
local-only / remote-enabled
TLS termination mode
reverse-proxy trust
Forwarded/X-Forwarded policy
origin/CORS
CSRF where cookie-authenticated
body/media limits
rate/admission policy
webhook authenticity when applicable
```

默认 Management exposure 应是最小可达范围；扩大暴露需要显式配置与安全检查。

---

### 1.8 External-process Egress Transparency

Network policy claims stop at the enforcement boundary. Spawned/stdio external process internal egress is `OPAQUE_EXTERNAL` unless an OS/sandbox/proxy mechanism actually mediates it. Capability/Tool policy can gate invocation but does not by itself sandbox the child process.

---

### 1.9 Trace Propagation Is an Egress Policy

OTel/W3C trace header propagation across external network boundaries follows endpoint trust/policy. Untrusted inbound trace context cannot assign Heptalogos Activity/origin identity; arbitrary outbound calls do not receive internal Activity/Package/principal identifiers by default.

---

## 2. Resource Governance / Pressure / Admission

### 2.1 原则

```text
PRESSURE IS A STATE.
```

资源耗尽必须在崩溃前进入正式 runtime semantics。

---

### 2.2 PressureSnapshot

可聚合：

```text
memory pressure
disk usage/watermark
PostgreSQL pool pressure
WorkQueue backlog
CPU/event-loop pressure
provider rate-limit pressure
network saturation
media/subprocess pressure
Extension-owned background work
```

底层指标可以来自 OS/runtime/library；产品只拥有聚合语义与 admission policy。

---

### 2.3 Pressure State

统一：

```text
NORMAL
THROTTLED
SHEDDING
BLOCKED
```

状态变化进入 Evidence/telemetry，并影响 Readiness/Profile。

---

### 2.4 Admission

`AdmissionDecision` 至少表达：

```text
ALLOW
DELAY
THROTTLE
REJECT_OPTIONAL
REJECT_NEW_WORK
```

优先级原则：

```text
Recovery / essential Management
> canonical ingress and truth preservation
> completion/reconciliation of already-committed effects
> Subject Base work
> optional derived work
> advanced/background cognition
```

不能仅依赖某个 queue 的 priority 数字隐式表达产品重要性。

---

### 2.5 Resource Budget

Budget 应可配置/派生，至少覆盖：

```text
concurrency
time
bytes
queue depth
provider requests/tokens where applicable
subprocess/media limits
```

配置仍服从 `Configure First, Expose Intentionally`。

---

## 3. Contract Compatibility / Version Lifecycle

### 3.1 原则

```text
DURABLE PAYLOADS ARE VERSIONED.
PROTOCOL REVISION IS DATA.
```

版本化表达 contract identity；它不自动承诺读取所有历史开发格式。历史兼容只有在存在明确的 retained state 或 external consumer 时才成立：

```text
VERSIONED != HISTORICALLY COMPATIBLE.
COMPATIBILITY REQUIRES A DECLARED OBLIGATION.
CompatibilityEpoch = PRE_PRODUCTION.
```

`ContractVersion` / `SchemaVersion` express durable contract identity; they do
not count internal development iterations. While `PRE_PRODUCTION`, the current
best durable shape remains canonical V1 and project-owned development history
does not create a backward-compatibility obligation. Obsolete development
shapes are rejected/reset unless a later explicit compatibility-epoch decision
declares a retained-state or external-consumer obligation.

任何满足以下任一条件的 contract 都必须显式版本化：

```text
persisted
queued
durable workflow input
cross-process
cross-generation
exported/imported
network API
third-party extension API
replayed
```

---

### 3.2 Version Envelope

所有 durable/cross-boundary payload 必须能够表达：

```text
contractId
contractVersion / schemaVersion
producerGeneration
producerProtocolRevision?
```

reader 必须声明：

```text
supported versions, when a declared compatibility obligation exists
upcast/migration/reject rule for that obligation
unsupported future-version behavior
minimum compatible generation
replay behavior
```

在 `PRE_PRODUCTION` 且没有 declared compatibility obligation 时，reader 只需要支持当前 canonical contract；当前最佳 shape 可成为 V1，obsolete development reader/migration/shim 必须删除，obsolete shape 必须显式 reject。未来 production compatibility obligation 仍必须声明 supported historical versions、migration/upcast 或 reject 规则，不能以本规则降低生产兼容要求。

---

### 3.3 Required Versioned Contracts

至少：

```text
Canonical Facts
Evidence
WorkItem payload
DurableExecution input/output refs
ExtensionManifest
Extension SDK / Contribution descriptor
Management API / OpenAPI contract
Subject Bundle
Backup/Release manifest
Presentation contribution descriptor
MCP protocol revision metadata
IM protocol revision metadata
```

---

### 3.4 Generation Coexistence

存在 declared compatibility obligation 时，升级期间：

```text
A and B may coexist
```

旧 durable work 必须能明确知道由哪个 compatible generation 读取。

如果新 generation 不能理解旧 payload：

```text
migrate/upcast before handoff
or retain compatible reader
or explicitly BLOCK upgrade
```

禁止 silently deserialize with current schema。

没有 declared compatibility obligation 的 `PRE_PRODUCTION` 开发格式不进入 generation coexistence contract；它们应被 canonical V1 reader 拒绝，而不是为了历史存在本身保留兼容路径。

---

### 3.5 Management Contract Compatibility

Normal Management client/server 必须显式交换/暴露：

```text
server ProductGeneration
core Management contract version / supported range
Problem schema version
SystemActionCatalog revision
InstanceId / ContinuityEpochId safe metadata
```

CLI/remote client 在发送 mutation 前验证 core contract compatibility；不兼容时 fail with structured `Problem`，不能“试着调用看看”。Dynamic SystemAction schema 仍由 runtime catalog version/revision 管理。Unauthenticated compatibility probe 只允许返回建立协议所需的最小 version-range metadata；InstanceId/ProductGeneration/catalog inventory 等完整 descriptor 需要正常 authentication。

---

## 4. Data Lifecycle / Erasure

### 4.1 原则

```text
DELETION IS A WORKFLOW.
```

删除跨越 canonical state、derived data、CAS、Evidence、backup/export 时，不可能由一次 SQL `DELETE` 完整表达。

---

### 4.2 Data Ownership

每种数据必须能回答：

```text
canonical owner
subject/instance/resource ownership
sensitivity
retention class
portable?
derived?
purge authority
```

---

### 4.3 Lifecycle Stages

区分：

```text
logical tombstone
access suppression
physical canonical purge
derived/index purge
artifact/blob purge
backup/export retention expiry
final purge completion
```

这些阶段可以不同步。

---

### 4.4 PurgePlan

跨 owner 删除使用 durable `PurgePlan / ManagementOperation`：

```text
target semantic owner
requested scope
canonical owners involved
derived stores involved
BlobRefs
Evidence retention policy
backup/export fences
irreversibility/risk
verification plan
```

各 owner 自己执行自己的 canonical purge；不存在“DataLifecycleService 直接 root-delete 全库”。

---

### 4.5 Evidence 与删除

Evidence 不是天然“永远不可删”。必须区分：

```text
minimum audit truth
sensitive payload
referenced Artifact
operational trace
```

保留策略由产品/数据生命周期 policy 决定。

任何 retained Evidence 若指向已 purge payload，应允许只保留：

```text
object id / digest / tombstone / causal metadata
```

而不保留被要求删除的敏感内容。

---

Lineage retention 不能形成 purge bypass：Activity 默认保留 refs/causality，不复制大段 domain payload；当 owning record 被 purge 时，按 policy 将 lineage ref tombstone/redact，只保留 independently-required audit minimum。

### 4.6 Backup / Restore Fence

物理删除完成不自动意味着历史 backup 中不存在旧数据。

必须定义：

```text
backup retention window
backup purge eligibility
restore-time tombstone/purge ledger
restored historical data reconciliation
```

恢复旧 backup 后不能静默复活已经有 authoritative purge record 的数据。

---

### 4.7 Storage Topology / Data Ownership

Foundation 对 storage 的横切规则：

```text
LIFECYCLE ROOTS ARE INDEPENDENT.
STORAGE OWNERSHIP IS GOVERNED; STORAGE ENGINE IS OWNER-SELECTED.
CONFIGURATION SEMANTICS DO NOT IMPLY CONFIGURATION STORAGE.
BACKUP COVERS DATA OWNERS, NOT ONE DATABASE OR DIRECTORY.
```

`PathProfile` 至少独立解析 Program / Instance / Configuration / Data / Secret / Blob / Backup / Log / Cache / Temp / Run roots；不得假设共同父目录。

Extension/Domain 使用 `StorageWorkspaceService` 获取 scoped Config/Data/Cache/Temp roots；可以选择 owner-native SQLite/files/embedded/external backend，但必须注册 DataOwner lifecycle metadata。

Core PostgreSQL 只承担 Foundation transactionally coordinated canonical state 与 DBOS private state；大 Blob、operational telemetry、owner-native stores 和 rebuildable indexes不因“方便”被集中塞入 Core PostgreSQL。

Backup/Restore/Purge 以 logical DataOwner/store identity 协调。详细见 `../storage-lifecycle.md` / `storage-workspace-data-lifecycle.md`。

## 5. Cryptographic Material / Trust Root Lifecycle

### 5.1 原则

```text
CRYPTO HAS A LIFECYCLE.
```

不能把所有密钥都等价成 `SecretRef`。

---

### 5.2 Trust Domains

至少区分：

```text
administrator credential
session material
Secret backend master/encryption key
backup encryption key
TUF trusted root
Extension/package signing trust root
transport/client certificate keys when used
```

它们具有不同 Authority、rotation、recovery 和 portability 规则。

---

### 5.3 Lifecycle Contract

每个 trust domain 都必须定义：

```text
bootstrap source
storage backend
key/material version
rotation
revocation
loss behavior
recovery path
backup/export rule
headless/service unlock semantics
auditable metadata
```

`SecretRef` 指向业务 secret，不应被滥用为 trust-root/version model。

---

### 5.4 Lost-Key Semantics

必须显式决定：

```text
recoverable from protected backup
requires administrator rebind
irrecoverable by design
blocks Subject only
blocks Management
requires Recovery Core
```

禁止发生 silent plaintext fallback。

---

### 5.5 Durable Secret References

Durable/cross-boundary payloads carry `SecretRef`/credential handle + purpose, not plaintext Secret/session/temporary credential material. This includes WorkItem, DBOS input/output, ManagementOperation, Evidence, Activity, ExtensionState, Backup metadata and protocol retry records. Encrypted backup payload is governed separately by Backup secret portability/encryption contract.

---

### 5.6 Secret Delivery Boundary

Secret plaintext 不进入 argv、global/parent process environment、logs、Evidence、Activity attributes。Normal resolution uses scoped in-memory API/FD/pipe/restricted ephemeral file；只有目标 external process 明确要求时允许 `CHILD_ENV_REQUIRED`，并使用 clean per-child allowlist environment、最小继承/生命周期与审计 metadata。

---

## 6. Time Semantics

### 6.1 Persistent Time

持久化绝对时间：

```text
Instant
```

不要持久化机器 local time 作为唯一 Authority。

---

### 6.2 Human-local Time

当语义是：

```text
“每天晚上 8 点”
“明早提醒”
“这个会话的本地日期”
```

必须保留：

```text
Instant when resolved
IANA TimeZoneId
originating local-time semantics
resolution policy
```

未来 Commitment/Schedule 可以消费该 contract，而不要求 Foundation 现在实现高级日程系统。

---

### 6.3 Elapsed Time

超时、backoff、latency 使用 monotonic duration，不使用 wall-clock difference。

---

### 6.4 Clock Change

必须定义 NTP/manual clock jump、DST、timezone change 对：

```text
durable wait
notBefore
session expiry
approval expiry
human-local schedule
replay
```

的处理规则。

---

## 7. Management Authentication / Endpoint Security

### 7.1 Authentication != Authorization

Authentication 证明 principal 和 freshness；Cedar/PolicyService 只做 authorization。

---

### 7.2 Admin Bootstrap

first-run 必须有明确流程：

```text
no default password
create administrator credential
store Argon2id verifier
establish authEpoch
record bootstrap Evidence
```

---

### 7.3 Session Contract

Normal Management 使用 opaque high-entropy bearer token；canonical session state 保存在 PostgreSQL：

```text
token digest
administrator principal
authEpoch
issuedAt
expiresAt
last/recent authentication marker
revocation state
client/channel metadata
```

Browser 可通过安全 cookie 投影 token；CLI 通过 protected client credential path/Authorization transport 使用同一 server-side session contract。客户端 token 不包含可自行解释的 principal/authorization Authority。

Session implementation仍需 `C-SESSION-01` 做 security/conformance，但架构角色不再开放为 client-side signed session 候选。

---

### 7.4 High-risk Freshness

高风险 `SystemAction` 可以要求：

```text
recentAuth <= configured threshold
```

审批本身不能替代 freshness requirement。

---

### 7.5 Recovery Authentication

Recovery Plane 不依赖 PostgreSQL session。默认 principal 为 `LOCAL_INSTALLATION_OWNER`，由 OS-level protected InstallationAnchor/Instance/Configuration/Data bootstrap-relevant roots 的 ownership/ACL boundary 建立；Recovery interface 不经普通远程 HTTP 暴露，只提供 fixed bounded verbs。

平台额外认证可以加强该边界，但不得把恢复能力依赖于正在修复的 normal DB/session/SecretService。

---

### 7.6 Host Ownership Fence

Normal canonical mutation 与 external-effect dispatch 必须同时依赖：

```text
valid dedicated PostgreSQL advisory Host lease
+ current HostOwnershipToken in canonical HostOwnershipFence
```

所有 normal-runtime product mutating transaction 通过 PersistenceService wrapper 持有 shared fence并验证 token。Fixed RecoveryOperation 在 bootstrap ownership + normal runtime offline 的受限 restore-reconciliation window 是唯一例外，并且必须在 normal DBOS/Management 暴露前结束。新 owner 在取得 advisory lease后以 exclusive fence 发布新 token；该 fence 与旧在途 mutation 串行化。Graceful reverse handoff 在释放 lease 前也以 exclusive fence revoke 当前 token。Lease loss 触发 FENCED/termination；已经进入 fence 的旧 transaction 可以在线性化点之前完成，但新 owner token 必须等待它们，token 切换之后 stale mutation 必须失败。

---

## 8. Observability Governance

### 8.1 三种对象

```text
Evidence = durable product causal/provenance truth
Telemetry = operational observation
Research capture = experiment-specific data
```

不得混用 retention/authority。

---

### 8.2 Data Classification

日志/trace/metric field 必须可分类：

```text
PUBLIC
OPERATIONAL
SENSITIVE
PII
SECRET
```

`SECRET` 永远不得进入普通 telemetry/evidence payload。

---

### 8.3 Prompt / Context Capture

允许配置 capture level，但 model input/output 不能默认全量永久记录。

需要保留 provenance 时优先：

```text
digest
manifest
source refs
classified/redacted Artifact
```

---

### 8.4 Metric Cardinality

以下身份不得直接成为无界 metric label：

```text
SubjectId
ConversationId
MessageId
Extension instance id
arbitrary endpoint/model name
```

高基数字段进入 logs/traces/Evidence refs，而不是 metrics labels。

---

### 8.5 Collector Independence

OTel collector/exporter 不可用时：

```text
product Authority unchanged
Foundation remains operable
telemetry may degrade/drop according policy
```

---

## 9. Native / WASM Product Closure

### 9.1 原则

```text
NATIVE TRANSITIVES ARE PRODUCT DEPENDENCIES.
```

任何 direct/transitive：

```text
.node addon
shared library
WASM binary
external executable
platform helper
```

都必须进入 ReleaseManifest/SBOM/platform qualification。

---

### 9.2 Dependency Selection vs Product Qualification

架构角色可以在实现前由 L0-L2 证据决定。

最终 exact binary closure 只在 L3 产品资格确认：

```text
Windows
macOS
Linux
source-less
service/headless
upgrade/rollback
```

开发工作区 `pnpm install` 成功不构成产品证据。

---

## 10. Canonical Serialization / Digest Contract

### 10.1 Stable JSON Identity

Approval plan、manifest、replay、versioned metadata 和任何需要跨进程稳定 hash 的 JSON-compatible object 使用 RFC 8785 JCS semantics，输入必须落在 I-JSON 可确定表示范围。

### 10.2 Domain-separated Digest

Digest envelope 必须包含：

```text
purpose/domain
canonicalization id/version
hash algorithm
payload
```

默认 hash 为 SHA-256。禁止把“同样一段 JSON 的裸 hash”跨 Approval、manifest、Artifact 等安全域复用为同一种 identity。

### 10.3 Schema Validation Is Non-mutating

Canonical Management/Configuration input validation 不得 silent coerce、insert default 或 remove unknown fields。Transport/framework validator 不能成为 schema Authority。

## 11. Identifier Contract

### 11.1 Stable Names 与 Instance IDs 分离

Foundation 区分三类身份：

```text
Stable semantic names
  ServiceId / CapabilityId / ContributionId / SystemActionId / PackageId

Generated instance/event identities
  ActivityId / WorkItemId / ManagementOperationId / ApprovalId /
  EvidenceId / RevisionId / MessageFactId / ReactionId / EffectOperationId /
  ContinuityEpochId / HostOwnershipToken

Content generations
  ProductGenerationId / PackageGenerationId / ArtifactDigest
```

稳定语义名称使用显式 namespaced identifier；不得因为一次启动、一次安装或数据库 surrogate key 而改变。

Generated instance/event identity 默认使用 RFC 9562 UUIDv7。UUIDv7 只提供 globally unique、roughly time-ordered identifier mechanics；**显式 `Instant` 字段仍是时间 Authority**，不得通过 UUID 排序替代领域时间语义。

Content generation 使用 canonical content digest，不改成 UUID。

外部平台/协议 ID 必须封装为 scope-aware opaque external identifier：

```text
ExternalId {
  namespace / protocol
  account/tenant scope when applicable
  raw value
}
```

不得把外部 ID 直接当内部 primary identity。

### 11.2 Instance / Installation / Boot Identity

Foundation 明确区分：

```text
InstanceId
  = 一个逻辑 Heptalogos product instance 的身份

InstallationId
  = 该 instance 在某个物理/OS installation root 上的身份

BootId
  = 一次 Host boot/run attempt 的身份

ContinuityEpochId
  = 一段连续 local canonical timeline 的身份

HostOwnershipToken
  = 当前 normal Host write-ownership period 的 fencing identity
```

语义：

```text
same-machine restart without destructive restore
  InstanceId same
  InstallationId same
  BootId new
  ContinuityEpochId same
  HostOwnershipToken new on ownership acquisition

cross-machine disaster-recovery restore
  InstanceId preserved
  InstallationId new
  BootId new
  ContinuityEpochId new
  HostOwnershipToken new
  BootstrapKeyProvider root new

explicit clone
  new InstanceId
  new InstallationId
  identity-sensitive refs are cloned/rebound only through explicit ClonePlan
```

普通 Backup Restore 的语义是继续原逻辑 instance，不得静默创建第二个同时活跃、共享 `InstanceId` 的 clone。若源 instance 仍可能运行，恢复计划必须要求 fencing/administrative acknowledgement，避免 split-brain operational identity。

`InstallationId/BootId` 用于 provenance/diagnostics，不授予 Authority。

### 11.3 Identifier Safety

```text
IDs are identifiers, not secrets.
```

任何 ID 都不能承担 authentication/authorization secret 的角色。URL、log、Evidence 中是否暴露某类 ID 由 sensitivity/privacy policy 决定，但“不可猜”不构成权限边界。

---

## 12. Structured Problem / Error Contract

### 12.1 Machine Contract

跨 CLI/API/Management/Runtime boundary 的失败必须投影为稳定、versioned `Problem`，而不是依赖异常 message 文本：

```text
Problem {
  schemaVersion
  problemCode          # stable machine identifier
  category             # validation/auth/policy/conflict/unavailable/...
  retryClass           # never/immediate/backoff/after-change/manual
  title                # safe human summary
  detail?              # safe bounded detail
  activityId?
  resourceRef?
  fieldErrors[]?
  causeProblemRefs[]?
  metadata?            # schema-governed, sensitivity-filtered
}
```

`problemCode` 是 machine contract；human text 可以改写/本地化。Stack trace、secret、raw credential、unbounded provider response 不进入 client-visible Problem。

### 12.2 HTTP Projection

HTTP Management API 使用 RFC 9457 Problem Details (`application/problem+json`) 作为 transport projection，并保留 Heptalogos stable fields，例如：

```text
type / title / status / detail / instance
problemCode
retryClass
activityId
fieldErrors
```

HTTP status 只是 protocol-level coarse classification；不得作为唯一领域错误 identity。

### 12.3 CLI Projection

CLI machine mode 返回同一 canonical Problem 语义。Exit code 只做少量、稳定的 coarse class，不与 HTTP status 一一绑定，也不把每个 `problemCode` 变成独立 exit code。

Human-readable CLI 可根据 Problem 给出 remediation hints，但不能改变 machine fields。

### 12.4 Causal Diagnostics

失败链应通过 `activityId` / lineage refs 连接到 Execution Lineage。Problem 本身不是全文日志容器；深层原因通过 `LineageQueryService`、Evidence refs 与受权 diagnostics 查询。

---

## 13. Bootstrap State Atomicity Contract

Bootstrap Closure 在 PostgreSQL 之外只允许维护**固定、极小、versioned** 的 bootstrap state/journal。它必须满足：

```text
schemaVersion
monotonic revision
active bootstrap/runtime/ProductGeneration refs
previous/LKG refs
state digest
last committed operation/stage refs
```

写入必须通过 platform adapter 实现 crash-safe replace protocol：

```text
encode canonical state
→ write new temp file
→ flush file contents
→ atomic replace/rename where platform guarantees allow
→ flush containing directory where supported
→ retain at least one last-valid previous state
```

Recovery 只接受 schema/digest/refs 全部有效的 committed state；遇到 torn/corrupt newest state 时选择最近的有效 previous revision，并产生 explicit Recovery Activity/Problem。

不得把普通业务 state、Extension state、Configuration 镜像进 bootstrap files。 `BootstrapStateStore` 是全局 bootstrap metadata Authority；per-BootId BootstrapJournal 只记录该 attempt 的 bounded stage/outcome，不通过共享“last.log”文件竞争 Authority。

`Q-BOOT-01` 保存 bootstrap crash/process 选型证据；真实 Windows/macOS/Linux power-loss/durability 在 implementation qualification 中验证。Architecture 不引入第二个 generic embedded database。

---

## 13.1 Installation Path / Bootstrap Root Safety

Program/Instance/Configuration/Data/Blob/Backup 等独立 PathProfile roots、bootstrap state、private PostgreSQL data subspace 与 immutable generation store 必须建立在各自 policy 要求的、解析后受信路径上。Platform adapter 必须处理 symlink/junction/reparse-point/path-normalization 风险，避免 Recovery/Update 因路径替换跳出受管 root。

Bootstrap/Recovery 对 global state 的 mutation 使用 open/rename/replace 时，应尽可能在已打开/已验证的受管 directory handle/root 下进行；若平台 API 无法完全消除 TOCTOU，必须在 platform qualification 中记录边界并使用 owner ACL + no-untrusted-writer 作为前提。

---

## 13.2 Continuity Epoch

`ContinuityEpochId` 标识同一逻辑 Instance 的一段连续 canonical execution timeline。
对于新 logical Instance，Bootstrap Closure 在 bootstrap ownership 下 exactly
once 创建初始 epoch，并先将其提交为 BootstrapState 的 recovery anchor；canonical
PostgreSQL 随后 materialize/verify 同一 ID，正常 Runtime 暴露不得早于这一步。
当前 canonical `BootstrapStateBodyV1` 本身要求 `ContinuityEpochId`。新
logical Instance 在 bootstrap ownership 下 exactly once 创建并提交该 V1
epoch；obsolete PRE_PRODUCTION BootstrapState bytes that lack the required
field are unsupported and require clean-state reset，不是 upgrade input。未知
或其他旧 shape 不获得兼容承诺。

正常 restart、Host crash recovery、ProductGeneration code-only update 不改变
epoch；destructive local-state restore/rollback 在恢复状态进入正常 Runtime 之前
创建并 materialize 新 epoch。

```text
ordinary restart
  InstanceId same / InstallationId same / BootId new
  ContinuityEpochId same / HostOwnershipToken new

destructive restore or rollback
  new ContinuityEpochId committed by Bootstrap/Recovery
  restored canonical store materialized before normal DBOS/Runtime/Management
```

在显式 restore materialization window 之外，Bootstrap expected epoch 与 canonical
store 不一致时 normal runtime admission = `BLOCKED`，结果是结构化
integrity/recovery `Problem`；禁止自动 pick-one、覆盖或重新随机生成。若 epoch
已在 BootstrapState durable commit 而 canonical materialization 尚未完成，后续
授权 bootstrap attempt 必须复用该 epoch。

旧 epoch 中的 session、Approval、in-flight ManagementOperation 与可能导致 external effect 的非 terminal durable work不能被新 epoch无条件继承。Restore reconciliation 规则见 `S11`/`S03`。Execution Lineage 必须记录 epoch，查询时明确展示 discontinuity。

---

## 14. Secret Portability Classification

Secret metadata 必须声明 restore/export 行为，而不是让 BackupService 猜测：

```text
PORTABLE_ENCRYPTED
EXTERNAL_REFERENCE
REBIND_REQUIRED
NON_EXPORTABLE
```

`BootstrapKeyProvider` 的 machine/installation root material 默认 `NON_EXPORTABLE`；跨机器 restore 生成新的 bootstrap root 与 private PostgreSQL bootstrap credentials，再对允许恢复的 secret material 重新 wrap/rebind。

Backup encryption trust domain 与 normal Secret backend、administrator password verifier、TUF root 分离。Restore 可以达到 `Management READY`，但若某个 Subject/Feature 依赖尚未 rebind 的 required SecretRef，其 readiness 必须显式为 `BLOCKED_SECRET_REBIND`，不得用 plaintext fallback 或静默跳过。
