# S17 Storage Workspace、Configuration Backing 与 Data Lifecycle

本规格定义 Heptalogos Foundation 的物理存储治理合同。它不规定 Extension/Domain 必须使用同一种数据库。

## 1. Invariants

```text
LIFECYCLE ROOTS ARE HOST-OWNED; DATA MODELS ARE OWNER-OWNED.
STORAGE OWNERSHIP IS GOVERNED; STORAGE ENGINE IS OWNER-SELECTED.
CONFIGURATION SEMANTICS DO NOT IMPLY CONFIGURATION STORAGE.
PHYSICAL CO-LOCATION MUST NOT IMPLY LIFECYCLE OWNERSHIP.
BACKUP COVERS DATA OWNERS, NOT A DIRECTORY OR A DATABASE.
```

另外：

```text
PackageGeneration retire != Instance delete
Instance disable != Config delete
Uninstall != Data purge
Data purge != Secret delete
Cache purge != Canonical purge
```

## 2. LifecycleRootId / PathProfile

Foundation stable root families：

```text
PROGRAM
INSTANCE
CONFIGURATION
DATA
SECRET
BLOB
BACKUP
LOG
CACHE
TEMP
RUN
PACKAGE_STAGING
```

概念 contract：

```ts
interface PathProfile {
  resolve(root: LifecycleRootId): ResolvedRoot;
  resolveWorkspace(owner: WorkspaceOwner, kind: WorkspaceKind): ResolvedRoot;
  describe(root: LifecycleRootId): RootPolicy;
}
```

`ResolvedRoot` 是 platform adapter 结果；domain/public Extension contract 不暴露 platform-specific layout assumption。

Root policy 至少包含：

```text
owner ACL/trust boundary
persistent / replaceable / ephemeral
backup participation default
cross-volume allowed
path canonicalization rule
symlink/junction/reparse policy
```

任何 backup/update/purge logic 通过 logical root/owner identity 工作，不使用 `commonParent()` 推断。

## 3. Bootstrap Root Resolution

InstallationAnchor 使用 platform profile 的 deterministic defaults，并可读取一个固定、极小、human-readable bootstrap locator 来覆盖独立 root mapping。Locator：

```text
不包含 Secret plaintext
不承载普通业务 configuration/state
由 Bootstrap ownership 保护
可在 PostgreSQL 不可用时读取
```

`ConfigurationRoot` 被定位后，Bootstrap 可以读取 bootstrap configuration；normal ConfigurationService 不反向决定自己的启动位置。

## 4. Workspace Identity

```ts
interface WorkspaceOwner {
  ownerId: DataOwnerId | PackageId | ExtensionInstanceId | DomainServiceId;
  scope: "installation" | "subject" | "resource";
}
```

`StorageWorkspaceService.open(owner)` 返回 scoped handles：

```text
ConfigWorkspace
DataWorkspace
CacheWorkspace
TempWorkspace
BlobClient
MigrationRegistrar
BackupRegistrar
StorageUsageClient
```

Workspace handle 不是 global raw path authority；跨 owner access 需要独立显式 capability/policy。

## 5. Scoped Files

Foundation file API 必须：

```text
resolve relative path under one workspace root
reject traversal and root escape
apply platform case/path normalization rules
support crash-safe/atomic replace helper where available
expose bounded enumeration/stat/watch
attach owner + Activity to operations
```

trusted Extension 若拿到 absolute path bridge，仍只能获得其 scoped root；bridge 使用属于显式 capability，不能通过 `process.cwd()`、package dir 或 global HeptalogosPaths 猜路径。

## 6. Config Backing Contract

`ConfigurationDefinition` 增加 source binding：

```text
sourceKind
sourceRef
sourceVersion
sourceDigest/revision
writeAuthority
codec/schema
activation/reload mode
```

Stable kinds：

```text
BOOTSTRAP_FILE
MANAGED_REVISION
DECLARATIVE_FILE
OWNER_NATIVE
DERIVED_READ_ONLY
```

### MANAGED_REVISION

ConfigurationService owns revision/activation. Backend 可以是 PostgreSQL，但 physical backend 不进入 public config semantics。

Foundation core managed config 必须可 materialize 为 human-readable, lossless, versioned projection：

```text
revisionId
sourceKind = MANAGED_REVISION
active digest
values with SecretRef only
NON_AUTHORITY marker
```

Projection 写入失败使 Configuration observability/readability `DEGRADED` 并可重新生成；不能把 projection 当第二写入 Authority。

### DECLARATIVE_FILE

Typed declarative files are interpreted through a registered `ConfigurationCodec`. Foundation built-ins are TOML (`js-toml`) and JSON; YAML/other formats are owner/contribution choices rather than mandatory Foundation dependencies.

文件是 canonical config source。每次观察到新 digest：

```text
parse
→ schema/semantic validate
→ compute source revision
→ SystemChangePlan/activation policy
→ activate or report INVALID_SOURCE
```

无效新文件不得覆盖 last-known-good active runtime revision；也不得静默把 DB 旧 revision 回写进文件。

Management 修改 file-backed config 时使用 compare-by-source-digest + atomic replacement，外部编辑导致 digest 变化时返回 conflict。

### OWNER_NATIVE

Owner 自己解释文件/数据库中的 config。Foundation 只强制 owner/path/lifecycle/version/sensitivity/reload/backup metadata。

若 owner 提供 `ConfigurationProjection`：

```text
owner-native source
↔ typed projected fields
↔ Management Contract
```

Projection 必须明确读写能力；不可逆/有损 projection 只能 READ_ONLY。

## 7. Storage SDK Levels

### Level A — `MANAGED` — Managed convenience

Foundation-owned helper：

```text
ExtensionStateStore / KV-like structured state
managed document helper
Blob CAS
```

适合简单 Extension。

### Level B — `SCOPED_NATIVE` — Scoped native storage

Owner 使用 scoped Config/Data workspace 配合自己的 library/format，例如 SQLite/TOML/LMDB/file tree。

Foundation 不理解 schema，但仍治理生命周期。

### Level C — `EXTERNAL_DATA_OWNER` — External/complex DataOwner

Owner 使用专门数据库或 external service。必须实现 DataOwner/Backup/Restore/Purge contract，并声明网络/secret/readiness dependencies。

## 8. DataOwnerDescriptor

```ts
interface DataOwnerDescriptor {
  ownerId: string;
  stores: DataStoreDescriptor[];
  portability: PortabilityPolicy;
  retention: RetentionPolicy;
  purge: PurgePolicy;
  resourceAccounting: ResourceAccountingPolicy;
}
```

```ts
interface DataStoreDescriptor {
  storeId: string;
  canonicality: "CANONICAL" | "DERIVED" | "CACHE" | "OPERATIONAL";
  backendKind: string;
  schemaVersion?: string;
  consistencyClass: string;
  backupClass: BackupClass;
  restoreClass: RestoreClass;
  portabilityClass: string;
  resourceClass: string;
  placementRef?: string;
}
```

`backendKind` 是 diagnostics/lifecycle metadata，不是 Foundation SQL ABI。 Descriptor metadata 对 Extension 应 manifest-first，并在 package/instance acceptance 后由 Host canonical persistence 保存。Runtime contributor 只绑定 executable participant/adapter；Package disable/uninstall 不删除 owner descriptor，直到对应 Config/Data 被明确 purge 或转移 ownership。 `placementRef` 可以把某个大型 owner/store 映射到独立 volume/profile；默认仍使用对应 lifecycle root。Placement change 是受治理 migration，不允许管理员/Extension 通过手工 rename 偷换 Authority。

## 9. ExtensionStateStore Managed Convenience

`ExtensionStateStore` 是简单、typed、scoped durable state convenience：

```text
owner/scope/namespace/key
schemaVersion/revision
JSON-compatible value / ArtifactRef
```

默认 implementation 可以使用 private PostgreSQL。

但：

```text
using ExtensionStateStore is optional
using PostgreSQL is not a requirement for Extension-owned canonical state
private owner-native SQLite/files are allowed inside scoped DataWorkspace
```

禁止的仍然是：

```text
root PostgreSQL/Kysely handle
write outside assigned roots
state hidden in immutable PackageGeneration
unregistered canonical store that bypasses backup/purge/resource governance
```

## 10. Data Migration

Migration 至少分：

```text
Configuration source/schema migration
Owner canonical data migration
Derived-index rebuild
Durable payload/Contribution upcast
```

Foundation 管理 migration ordering、generation fences、backup prerequisites、recovery journal integration；owner 实现 domain transform。

Owner data migration compatibility：

```text
BACKWARD_COMPATIBLE
DRAIN_REQUIRED
SHADOW_COPY
RESTORE_REQUIRED
```

旧 generation durable refs 与 owner state compatibility 一起计算。

## 11. BackupParticipant

Managed resources 可由 Foundation 自动生成 participant；复杂 owner 注册：

```ts
interface BackupParticipant {
  describe(): BackupParticipantDescriptor;
  prepare(epoch): Promise<SnapshotPreparation>;
  snapshot(preparation): Promise<SnapshotResult>;
  verify(snapshot): Promise<VerificationResult>;
  release(epoch): Promise<void>;
}
```

Snapshot strategy：

```text
TRANSACTIONAL_SNAPSHOT
NATIVE_ONLINE_SNAPSHOT
QUIESCE_AND_COPY
EXPORT_STREAM
IMMUTABLE_CLOSURE
REBUILDABLE
EXTERNAL_REFERENCE
```

`REBUILDABLE` store 可以从 backup payload 排除，但 manifest 必须记录 rebuild prerequisite/version。

`EXTERNAL_REFERENCE` 必须记录 target revalidation/rebind requirement。

## 12. BackupEpoch / Consistency Barrier

BackupCoordinator：

```text
discover required participants
→ preflight health/space/compatibility
→ create BackupEpoch
→ establish minimum necessary write/admission barriers
→ prepare participants
→ collect snapshot tokens
→ materialize in dependency order
→ verify
→ seal manifest with participant digests
→ release barriers
```

不承诺跨 heterogeneous stores 的全局 ACID snapshot；Backup profile 必须声明 consistency grade 与可能的 bounded skew。

对于同一业务 invariant 跨多个 owner 的场景，应通过 canonical refs/version fence 或短暂 coordinated quiesce 得到可验证 closure，而不是依赖 wall-clock 同时复制文件。

## 13. RestoreParticipant

Restore 先解析 logical owner/store identity，再映射目标 PathProfile。源绝对路径只可作为 diagnostics metadata，不能作为恢复目标 Authority。

复杂 owner 支持：

```text
preflightCompatibility
stage
verifyStaged
apply/rebind
postRestoreReconcile
```

Restore 继续遵守 S11 的 RecoveryOperation、ContinuityEpoch、external-reality reconciliation。

## 14. Purge / Uninstall

每个 store 声明 purge semantics：

```text
TOMBSTONE_ONLY
PURGE_CANONICAL
PURGE_DERIVED
PURGE_CACHE
RELEASE_BLOB_REFS
EXTERNAL_DELETE
RETAIN_BY_POLICY
```

`uninstall package` 只影响 install inventory/generation；`purge data` 是独立高风险 lifecycle action。

## 15. Blob Boundary

大二进制使用 shared Blob/Artifact contract。Owner store 应优先保存 BlobRef，而不是复制 bytes。

BlobRoot 可映射独立 volume；CAS GC 受 refs/retention/backup/export fence 控制。

## 16. Core PostgreSQL Volume Policy

Core PostgreSQL 只承担 Foundation transactionally coordinated canonical state和 DBOS private state。

长期高增长 table 必须能够报告：

```text
logical owner
relation/index size
retention class
partition/archive eligibility
pressure contribution
```

是否分区/归档由具体 owner/table profile 决定，不建立“数据库无限增长也无所谓”的默认。

## 17. Resource Accounting

`StorageUsageClient` / DataLifecycleRegistry 统一聚合：

```text
logical bytes
physical bytes when measurable
file count
DB/index bytes
cache bytes
Blob referenced/unique bytes
backup bytes
volume free/pressure
```

ResourceGovernor 消费聚合状态，不直接扫描任意 Extension 私有内容获取业务语义。

## 18. Lineage / Evidence

Foundation 自动 instrumentation boundary：

```text
workspace.open
file atomic mutation
config source activation
managed-state transaction
migration
backup/restore participant lifecycle
purge
Blob mutation
```

Owner-native内部 SQL/file call不要求逐函数 span；重要 semantic boundary 由 owner SDK/Host facade 标记。

默认不记录内容正文。Secret/PII/large payload capture 受 S16 sensitivity/retention contract 限制。

## 19. Verification

至少验证：

```text
Program generation replacement preserves Config/Data
Package uninstall preserves Config/Data/Secret unless explicit purge
ConfigurationRoot/DataRoot/BlobRoot on unrelated parents/volumes
Windows case/path/junction escape rejection
POSIX symlink escape rejection
DECLARATIVE_FILE invalid edit keeps LKG active + reports invalid source
MANAGED_REVISION human-readable projection round-trip/value completeness
Extension TOML config + SQLite data through scoped workspaces
owner-native store enters backup/restore/purge registry
Backup with PostgreSQL + config file + SQLite + Blob participant
REBUILDABLE index exclusion/rebuild metadata
restore to different physical PathProfile
resource usage grouped by owner/root
no large Blob bytes stored in core PostgreSQL by default path
```

## 20. Foundation-selected File/Config Mechanics

Foundation-owned StorageWorkspace mechanics use the selected dependency route:

```text
path and scoped files
→ node:path + node:fs/promises

atomic file replacement
→ write-file-atomic 8.x

bounded cross-platform file watch
→ Chokidar 5.x

Foundation-owned TOML parsing/serialization
→ js-toml 2.x
```

These libraries are implementation mechanics behind Host-owned adapters. Extension/Domain code does not receive raw platform roots or watcher/atomic-write implementation objects.

Do not reimplement atomic replace, cross-platform watch normalization, or TOML parsing in Foundation because avoiding a dependency appears conservative. `C-STORAGE-FS-01` / `C-CONFIG-TOML-01` cover adapter evidence; bootstrap uses the adopted `@bybrave/proper-lockfile2` route plus the stricter ownership semantics defined by S01, with remaining crash/platform behavior handled by implementation qualification.

`OWNER_NATIVE` remains free to use another format/database/library inside its scoped workspace; this section only fixes mechanics that Foundation itself promises to provide.
