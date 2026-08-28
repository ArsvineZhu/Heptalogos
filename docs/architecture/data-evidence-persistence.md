# 数据、证据、内容与持久化

## 1. Core Canonical PostgreSQL

一个 Heptalogos instance 使用一个 private PostgreSQL runtime/database 作为 **Foundation transactional durable authority**。这不表示所有 Extension/Domain 数据、配置、Blob、日志和高级认知存储都必须进入 PostgreSQL。

逻辑 schema：

```text
heptalogos
→ Foundation canonical product state

dbos
→ durable engine private state
```

---

## 1.1 PrivatePostgresProfile

PostgreSQL 是产品内私有运行时，不只是一个抽象连接串。Foundation 固定一个跨平台最小 profile：

```text
loopback-only TCP baseline
installation-owned persisted port selected under bootstrap ownership
SCRAM authentication
private data directory with installation-owner permissions
no default external listener
```

角色最小分离：

```text
cluster/bootstrap owner      → init/cluster maintenance only
migration role               → product schema migration
runtime application role     → normal canonical reads/writes
DBOS runtime/schema role     → DBOS private schema mechanics as required
```

正常 Host 不以 cluster superuser 运行。Private PostgreSQL bootstrap credential 属于 Bootstrap crypto hierarchy，不依赖 normal `SecretService`，避免启动环。

`PrivatePostgresController` 是 Bootstrap-owned thin adapter，只调用随产品固定的 PostgreSQL toolchain 完成 init/start/stop/readiness/profile validation。现有 data dir/version/cluster identity/port 不一致时 fail to Recovery；normal start 不静默 re-init、major-upgrade 或连接其他本地 PostgreSQL。

---

## 2. Kysely

Kysely 承担 typed SQL / transaction / migration mechanics。

ORM/query-builder model 不等于 domain Authority。普通 MicroSystem/Extension 不获得 root `Kysely<Database>`。

---

## 2.1 Canonical JSON、Digest 与 Domain Separation

所有跨进程/跨 generation/Approval/manifest/replay 中需要稳定 hash identity 的 JSON-compatible 结构，使用 RFC 8785 JSON Canonicalization Scheme (JCS) 语义，并遵守 I-JSON 可表示范围。

Foundation 定义 versioned digest envelope：

```text
purpose/domain tag
canonicalization = JCS/RFC8785
canonicalizationVersion
hashAlgorithm = SHA-256 by default
canonical bytes
Digest
```

同一 JSON value 在不同安全语义中不能仅靠“内容一样”共享 digest identity；`purpose/domain tag` 必须进入被 hash 的 envelope，避免 Approval plan、manifest、Artifact metadata 等跨域混淆。

非 JSON bytes 通过 Blob/Artifact content digest 表达，不伪装成 JSON canonicalization。

Schema runtime 见 `S04`：canonical Management/Configuration 输入验证禁止 silent coercion/default insertion/additional-field deletion。

---

## 2.2 Stable Identifier Contract

稳定语义名称（`ServiceId / CapabilityId / ContributionId / SystemActionId / PackageId`）、generated instance/event ID、content-generation digest 与 external protocol ID 是不同类型。

Foundation generated identity，例如：

```text
ActivityId
WorkItemId
ManagementOperationId
ApprovalId
EvidenceId
RevisionId
MessageFactId
ReactionId
EffectOperationId
ContinuityEpochId
HostOwnershipToken
```

默认使用 RFC 9562 UUIDv7。UUIDv7 的 time ordering 只服务 locality/diagnostics；领域时间 Authority 始终是显式 `Instant`，不能通过 ID 顺序推导事件发生时间。

`ProductGenerationId / PackageGenerationId / ArtifactDigest` 继续使用 content digest。外部平台 ID 使用带 namespace/account/tenant scope 的 typed opaque `ExternalId`，不得直接充当内部 primary identity。

另外固定：`InstanceId = logical product instance`，`InstallationId = physical installation`，`BootId = one boot attempt`，`ContinuityEpochId = one continuous local canonical timeline`。灾备跨机器 restore 保留 InstanceId、创建新 InstallationId/BootId/ContinuityEpoch；clone 创建新的 InstanceId。

## 3. Transaction Composition

一个 authoritative commit 可以在同一 PostgreSQL transaction 中：

```text
write canonical state/fact
append required Evidence
materialize durable WorkItems
emit pg_notify hint
COMMIT
```

共享 transaction 不意味着共享 semantic ownership。

---

### 3.1 HostOwnershipFence

Dedicated PostgreSQL advisory Host lease 负责 owner election；canonical `HostOwnershipFence` 负责 pooled transaction fencing。每个 canonical mutating transaction 自动持 shared fence并验证当前 `HostOwnershipToken`；新 owner 取得 advisory lease 后以 exclusive fence 发布新 token，等待旧在途 mutation结束。External Effect 的 `prepared→dispatching` 也必须处于当前 token fence 下。

## 4. Canonical Truth Before Async

如果 `WorkItem` 已经是 durable downstream obligation：

```text
domain fact + WorkItem
```

应尽量同 transaction materialize。

不默认再增加一层 generic Outbox；只有具体外部协议确实需要专用 outbox semantics 时才引入。

---

## 5. Subject Authority Fence

不要持有数据库锁等待 LLM/远程调用。

```text
read snapshot/revisions
→ slow model/tool work outside transaction
→ commit-time validation
→ authority-head lock/fence when required
→ commit
```

允许并行推理，同时保持单 Subject canonical coherence。

---

## 6. DBOS State

DBOS engine state 是 implementation-private mechanics：

```text
workflow checkpoints
queue internals
engine messages/events
transaction completion metadata
```

不得把 DBOS private tables/status 当产品业务 API 或 Subject truth。

---

## 7. WorkItem

`WorkItem` 是产品层 durable processing obligation：

```text
id
handler owner/contribution/generation
schemaVersion
queue profile
payload/ref
partition
priority
notBefore
dedup
causation/correlation
state/outcome
```

queue engine 只提供 mechanics。

---

## 7.1 Storage Ownership / Extension Durable State

Foundation 采用：

```text
Core PostgreSQL             → Foundation transactionally coordinated truth
StorageWorkspace            → lifecycle-separated owner roots
ExtensionStateStore         → optional managed structured state
Owner-native store          → SQLite/files/embedded DB/custom
Blob CAS                    → large immutable content
DataLifecycleRegistry       → backup/restore/purge/usage governance
```

Extension/Domain 可以选择自己的 canonical backend；禁止的是 root PostgreSQL/Kysely escape、越权路径、把 state 藏在 immutable PackageGeneration，或建立不进入 backup/purge/resource governance 的 hidden canonical store。

普通 `ExtensionStateStore` 仍提供：

```text
owner/scope/namespace/key
schemaVersion/revision
JSON-compatible value or ArtifactRef
```

默认可由 private PostgreSQL 实现，但它不是强制 storage model。

Program/Package、Instance、Configuration、Data、Secret、Blob/Cache 的 lifecycle roots 独立。物理 co-location 不构成 ownership。详细见 `storage-lifecycle.md` / `contracts/storage-workspace-data-lifecycle.md`。

---

## 7.2 Data Volume / Retention Class

每个高增长 canonical/derived store 必须声明：

```text
owner/store
canonicality
retention class
resource class
partition/archive/rebuild eligibility
backup class
```

Core PostgreSQL 可以长期保存消息事实、Evidence/Lineage metadata 等结构化 truth，但不能把“数据库能增长”当 retention 策略。ResourceGovernor/DataLifecycleRegistry 必须能够观察 relation/index usage、owner usage 与 volume pressure。

Operational logs/telemetry、large Blob bytes、rebuildable index/cache 默认不进入 Core PostgreSQL hot canonical tables。

---

## 8. Signal

SignalService 使用 PostgreSQL `LISTEN/NOTIFY` 作为 best-effort wakeup mechanics。

```text
may lose
may coalesce
session-bound subscription
receiver re-queries canonical state
```

Signal payload 不能承载唯一 durable truth。

---

## 9. EffectOperation Fence

外部副作用遵循：

```text
prepared
→ dispatching
→ succeeded | failed | uncertain
```

若系统无法证明远端是否执行，保留 `uncertain`。只有协议提供 strong idempotency/reconciliation 时才采用更强自动恢复。

Network transport outcome 不能替代 effect semantic outcome。

---

## 10. Versioned Durable Contracts

任何 persisted/queued/replayed/cross-generation payload 必须显式 versioned。

至少包括：

```text
Canonical Fact
Evidence
WorkItem
DurableExecution input/output refs
Artifact metadata
Backup/SubjectBundle manifests
```

Reader 必须声明 compatibility/upcast/reject behavior。

---

## 11. Evidence

Product Evidence 与 telemetry 分离。

Evidence 可记录：

```text
raw integration refs
canonical derivation
Context/Reaction provenance
model/capability invocation provenance
Review / DecisionCommit
Effect attempt/outcome
SystemAction plan/auth/approval/outcome
runtime/readiness/pressure changes
```

高级 cognition subsystem 若存在，只通过正式 Evidence refs/contributions 记录 influence；Foundation 不定义其内部 schema。

关键 Authority mutation 与 required Evidence 应尽可能同 transaction。

---

## 12. Execution Lineage 与 Telemetry

`ExecutionLineageService` 为 meaningful operation 创建产品级 `ActivityId` 与 causation/ownership graph；Pino/OpenTelemetry/OpenInference 是其 operational projection。

```text
ActivityId != TraceId != SpanId
```

每个 Service/Capability/Contribution/WorkItem/ManagementAction/Effect/Package lifecycle boundary 都应继承或创建 `ExecutionContext`，记录 caller origin、Package/Generation、semantic target 与 outcome。

Telemetry：

```text
Pino
OpenTelemetry
OpenInference conventions
```

允许采样/过期；required Evidence/Audit 与 retained Activity 不能因 exporter/sampling 丢失。

治理维度必须独立：

```text
severity
importance
retentionClass
sensitivity
```

Secret plaintext 永不发出；PII/sensitive attributes 按 classification/redaction policy 处理；metric cardinality 有界。详细见 `S16`。

## 13. Replay

Replay 对 deterministic Heptalogos stages 做真实重执行。

对：

```text
LLM
remote capability
external effect
```

使用 recorded boundary outcome。

`VERIFIED` 不能用历史 expected digest 冒充重新计算。

协议版本、contractVersion 和 generation metadata 必须进入 replay manifest。

---

## 14. Artifact 与 Blob

```text
Blob
= immutable content-addressed bytes

Artifact
= semantic object
= ownership + provenance + sensitivity + lifecycle + BlobRefs
```

同一 Blob 可以服务多个 semantic Artifact。

---

## 15. CAS

默认 local CAS：

```text
staging
→ resource limits
→ hash
→ type evidence
→ immutable finalize
→ Artifact creation
```

final path 不允许 partial bytes。

---

## 16. Media

Generic mechanics：

```text
file-type
sharp
FFmpeg / ffprobe
Execa
```

必须叠加：

```text
size/pixel/page/frame limits
time/decompression budgets
quarantine
safe MIME handling
controlled subprocess args
NetworkAccess policy for remote media
```

不向 AI/Extension 暴露任意 FFmpeg shell。

---

## 17. Derived State

以下属于 derived/rebuildable：

```text
search/index structures
embeddings when a future subsystem uses them
thumbnails
compiled prompt projection
caches
telemetry
materialized views
```

Foundation 不选择高级 Memory retrieval backend。

---

## 18. Data Lifecycle

所有 canonical/derived/content 数据必须有 owner、sensitivity、retention 和 purge semantics。

删除区分：

```text
logical tombstone
physical canonical purge
derived/index purge
Artifact/Blob purge
Evidence retention
backup/export fences
```

跨 owner 删除通过 durable `PurgePlan / ManagementOperation` 协调；各 owner 只删除自己拥有的 canonical state。
