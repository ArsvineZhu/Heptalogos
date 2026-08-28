# 存储拓扑、生命周期根与 DataOwner

Heptalogos 的数据架构遵循一个基本原则：

> **统一治理不等于统一物理存储。**

Foundation 统一身份、生命周期、路径隔离、权限、备份、恢复、迁移、清除、可移植性、资源预算与 Execution Lineage；具体数据模型、文件格式和存储引擎由拥有该数据语义的 owner 决定。

---

## 1. Lifecycle Root 是架构对象

以下生命周期必须分离：

```text
Program / Package Generation
Runtime Instance Metadata
Configuration
Durable Data
Secrets
Blob / Artifact Content
Cache / Derived Index
Operational / Temp / Run
Backup / Export
```

这些是**逻辑 root**，不要求存在共同父目录，也不要求位于同一磁盘。

```text
physical co-location
!= lifecycle ownership
```

例如 portable profile 可以把多个 root 放在同一外层目录；Linux system profile 可以把它们分别映射到 `/usr/lib`、`/etc`、`/var/lib`、`/var/log`、`/run`。Domain/Extension 代码只能依赖逻辑 root contract，不能依赖某个平台的绝对路径或共同父目录。

---

## 2. Program、Instance、Config、Data 严格分离

### Program / Package Generation

```text
immutable
content-addressed/versioned
replaceable
upgradeable
rollbackable
```

删除或切换代码 generation 不得自动删除配置和数据。

### Runtime Instance Metadata

Instance 表达：

```text
InstanceId / ExtensionInstanceId
PackageId
bound generation
DesiredState
capability grants
configuration binding
data-owner bindings
secret bindings
compatibility/readiness metadata
```

Instance metadata 不是代码目录，也不是持久数据大杂烩目录。

### Configuration

配置拥有独立 source/authority、版本、activation 与 migration 生命周期。

### Durable Data

数据由 semantic owner 拥有。它可以使用 Foundation managed store，也可以使用 owner-selected SQLite、文件树、嵌入式 KV、专用索引或外部 backend。

### Secrets

Secret material 有独立安全生命周期，永远不因为 package/config/data purge 自动泄漏或删除。

---

## 3. `PathProfile`：逻辑路径到物理路径

Foundation 定义独立 root，而不是一个 `dataRoot` 派生一切：

```text
ProgramRoot
InstanceRoot
ConfigurationRoot
DataRoot
SecretRoot
BlobRoot
BackupRoot
LogRoot
CacheRoot
TempRoot
RunRoot
PackageStagingRoot
```

`PathProfile` 负责把这些逻辑 root 映射到当前 OS / deployment profile。`StoragePlacementPolicy` 还允许特定 owner/store 在不改变生命周期类别的前提下覆盖默认 placement，例如将大型 Memory canonical store 放到独立 SSD。

每个 root：

```text
可使用平台默认位置
可被 installation-level bootstrap policy 显式覆盖
可位于独立 volume
必须经过平台 path/ACL/symlink/reparse-point 安全验证
```

例如：

```text
ProgramRoot → C:\Program Files\Heptalogos
ConfigurationRoot → D:\Heptalogos\Config
DataRoot → E:\Heptalogos\Data
BlobRoot → F:\Heptalogos-Blobs
BackupRoot → \\NAS\Heptalogos
```

Backup、Update、Extension Manager 只能使用 logical roots / owner descriptors，禁止推测共同父路径。

---

## 4. `StorageWorkspaceService`

Extension/Domain 不应自己实现跨平台目录组织。

Host 按 owner/scope 分配 `StorageWorkspace`：

```text
StorageWorkspace
├─ config
├─ data
├─ cache
├─ temp
├─ blobs
├─ migrations
├─ backup
└─ usage
```

一个 Extension 实例得到的 workspace 逻辑上可能是：

```text
ConfigurationRoot/extensions/<ExtensionInstanceId>/...
DataRoot/extensions/<ExtensionInstanceId>/...
CacheRoot/extensions/<ExtensionInstanceId>/...
```

但 Extension 不依赖这些字符串。

Foundation 负责：

```text
root resolution
scope isolation
path traversal prevention
atomic replace helpers
permissions/ACL integration
lifecycle creation/removal
resource accounting
backup/purge registration
Execution Lineage
```

Extension 负责：

```text
自己的数据模型
文件命名
schema
storage engine
业务 migration 内容
```

---

## 5. Storage Capability SDK

SDK 提供逐级增强的 mechanics，而不是一个万能 ORM。

### A. Scoped Filesystem

```text
read / write / open
atomicWrite / rename
mkdir / enumerate / stat
watch when supported
subtree
```

路径永远相对 scoped root；不得通过 `..`、symlink/junction 或平台 path trick 跳出 owner workspace。

### B. Document / Config File Mechanics

Foundation 提供 atomic document lifecycle 和 codec boundary。

Extension 可以自由使用：

```text
TOML
YAML
JSON
JSONC
owner-specific text/binary format
```

Foundation 不要求所有 Extension 配置改写成 PostgreSQL key/value。

### C. Managed Structured State

对于不希望自行维护存储 engine 的 Extension，Foundation 可以提供简单 managed state/embedded-store helper，例如 scoped KV/structured state。

`ExtensionStateStore` 是**便利选项**，不是强制 ABI；默认可由 private PostgreSQL 提供，但不得成为所有 Extension/domain 数据的唯一物理模型。

### D. Blob CAS

大对象优先使用共享 `Blob/Artifact` capability：

```text
stream/bytes
→ BlobId + digest + size + mediaType
```

Extension/Domain 自己的 store 保存 `BlobRef`，不重复把大 Blob 塞进 PostgreSQL/SQLite JSON 字段。

### E. Owner-selected / External Backend

复杂 trusted Domain/Extension 可以使用：

```text
SQLite
embedded KV/database
specialized index
private relational schema/database
external service/database
```

但必须注册 `DataOwnerDescriptor` 并接受 lifecycle governance。

---

## 6. Configuration Surface 与配置存储正交

`ConfigurationDefinition` 描述配置语义，不规定物理存储。

Foundation 支持至少以下 source/backing：

```text
BOOTSTRAP_FILE
MANAGED_REVISION
DECLARATIVE_FILE
OWNER_NATIVE
DERIVED_READ_ONLY
```

### `BOOTSTRAP_FILE`

在 normal PostgreSQL/ConfigurationService 之前必须可读的人类可读配置。只包含 bootstrap 所需内容，不承载普通业务 state。

### `MANAGED_REVISION`

ConfigurationService 持有 revision/activation Authority；可以使用 PostgreSQL 存储 canonical revision。

对 Foundation core managed namespaces，系统必须提供**稳定、可再生成的人类可读 active projection/export**，至少有一种 lossless baseline 格式。Projection 携带 revision/digest，并明确 `NON_AUTHORITY`，因此不会产生第二真相。

### `DECLARATIVE_FILE`

文件本身是 Authority。Typed declarative management 通过注册的 `ConfigurationCodec` 解释；Foundation built-in 为 TOML/JSON，其他格式可以由 owner/contribution 提供。例如 provisioning 文件：

```text
file edit
→ parse/validate
→ revision/digest
→ activation plan
→ active runtime
```

如果文件无效，运行时保留 last-known-good active revision并显式报告 `INVALID_SOURCE`；不得静默改写文件或把数据库旧值伪装成文件 Authority。

### `OWNER_NATIVE`

Extension/Domain 自己定义配置文件结构和 parser。它必须声明：

```text
owner
config version
source files/workspace
sensitivity
reload/activation semantics
backup/portability class
```

若希望进入统一 CLI/API 字段级管理，可以额外提供 `ConfigurationProjection/ConfigAdapter`；不提供时，Foundation 只管理文件生命周期、状态与 reload contract，不假装理解其字段。

---

## 7. `DataOwner` 与 `DataLifecycleRegistry`

每个复杂 durable owner 注册：

```text
DataOwnerDescriptor
├─ ownerId
├─ stores[]
├─ lifecycle roots/backends
├─ canonical / derived / cache classification
├─ schema/data version
├─ retention
├─ portability
├─ backup/restore policy
├─ purge policy
├─ consistency requirements
├─ resource accounting
└─ health/readiness
```

每个 `DataStoreDescriptor` 至少说明：

```text
storeId
scope
backendKind
canonicality
version
consistencyClass
backupClass
restoreClass
purgeClass
portabilityClass
resourceClass
placementRef / volume class
```

Foundation 不需要能 query Memory/Extension 私有 schema，仍能知道这些数据属于谁、能否备份、怎样恢复、是否可删除、占用多少空间。

Extension DataOwner/store declarations 必须尽可能 manifest-first，并由 Host 持久化 owner metadata。Package disable/uninstall 或 runtime failure 不删除这些 descriptor；只要 Config/Data 仍存在，DataLifecycleRegistry 就必须能在不执行 Extension runtime 的情况下识别其 owner、backend class、backup requirements 与 purge policy。

---

## 8. Core PostgreSQL 的边界

Private PostgreSQL 是 **Foundation transactional authority**，不是“全系统宇宙数据库”。

适合放入：

```text
Instance / administrator / session metadata
Subject lifecycle/authority
SystemAction / Approval / ManagementOperation
Extension inventory / grants / bindings
canonical messaging facts/metadata
WorkItem / EffectOperation
required Evidence / retained Lineage metadata
Artifact metadata
MANAGED_REVISION configuration
purge/retention ledgers
DBOS engine-private state in separate schema
```

默认不放入：

```text
large Blob bytes
full operational log streams
large telemetry streams
Extension owner-native files/databases
advanced cognition private stores
rebuildable indexes/caches
arbitrary media/model payload copies
```

PostgreSQL cluster 可以长期增长，因此 Foundation 必须提供 owner/table/resource usage、retention/partition/archive hooks 与 pressure reporting；“PostgreSQL 能存”不是长期 retention 设计。

---

## 9. Advanced Domain Storage

Memory、Relationship、Diary 等高级 cognition 不属于 Foundation 实现范围。

未来某个 Memory subsystem 可以选择：

```text
SQLite canonical store
private PostgreSQL schema/database
vector/index files
graph store
Blob CAS refs
external backend
```

Foundation 只要求它：

```text
注册 DataOwner
使用/遵守 Path/Workspace lifecycle contract
参加 Backup/Restore/Purge/Portability
报告 resource usage/health
进入 Execution Lineage
不重造 Foundation scheduler/authority/backup coordinator/path policy
```

Foundation 不冻结 Memory schema、retrieval 或 backend。

---

## 10. Backup 以 Participant/DataOwner 为单位

Installation Backup 不是“备份一个数据库或一个目录”。

`BackupCoordinator` 枚举 required `BackupParticipant`：

```text
CorePostgresParticipant
ConfigFileParticipant
BlobCASParticipant
SecretParticipant
Extension/Domain DataOwner participants
PackageGeneration closure
```

可声明 snapshot strategy：

```text
TRANSACTIONAL_SNAPSHOT
NATIVE_ONLINE_SNAPSHOT
QUIESCE_AND_COPY
EXPORT_STREAM
IMMUTABLE_CLOSURE
REBUILDABLE
EXTERNAL_REFERENCE
```

Managed workspace 中可识别的资源由 Foundation 自动注册；owner-native/external backend 必须注册 participant 或显式声明其数据不进入某种 backup profile。

Backup 使用 `BackupEpoch` / consistency barrier：

```text
preflight participants
→ establish epoch/barrier
→ prepare/quiesce only required owners
→ obtain snapshot tokens
→ materialize snapshots/closures
→ verify each participant
→ seal semantic manifest
→ release barrier
```

不存在跨 PostgreSQL、SQLite、文件、keyring、external store 的魔法全局 ACID transaction。

---

## 11. Restore / Purge / Portability

Restore 以 manifest 中的 logical owner/store IDs 定位目标，不依赖源绝对路径。

每个 owner 负责自己的：

```text
compatibility validation
staging
restore/rebind
post-restore reconciliation
```

跨 owner 操作由 Foundation durable/recovery coordinator 控制。

Purge 同样通过 owner contract：

```text
logical tombstone
canonical purge
derived/cache purge
Blob ref release
backup/export fence
physical deletion
```

Package uninstall、generation retire、instance disable 与 Data purge 均为独立操作。

---

## 12. Resource Accounting 与多 Volume

Foundation 必须能按：

```text
owner
store
lifecycle root
volume
resource class
```

观察：

```text
bytes
file count
DB/table/index usage when measurable
cache size
Blob refs/unique bytes
backup footprint
pressure state
```

例如：

```text
Extension foo
  Config             18 KiB
  Canonical data     312 MiB
  Derived index      1.4 GiB
  Cache              726 MiB
  Blob references    8.7 GiB
```

ResourceGovernor 使用这些结构化数据做 pressure/admission，不靠猜整个安装目录大小。

`DataStoreDescriptor.placementRef` 可以选择默认 lifecycle root、named volume/profile 或 external backend；迁移 placement 是显式 DataLifecycle/SystemAction，不通过手工移动目录完成。

---

## 13. Security 与 Lineage

Storage Workspace 不等于 sandbox。trusted in-process Extension 仍处于 Host process trust boundary；真正不可信代码需要独立 execution isolation。

所有 meaningful storage/lifecycle 操作进入 Execution Lineage，例如：

```text
workspace.open
config.read / config.activate
storage.atomic-write
data.migrate
backup.prepare / snapshot / verify
restore.apply
data.purge
blob.put / blob.release
```

默认只记录 owner/store/activity/size/digest/status 等 metadata；不因可观测性自动复制 Secret、PII、大 payload 或 owner-private database content。

---

## 14. Foundation API / CLI

至少提供管理投影：

```text
heptalogos paths inspect
heptalogos storage owners
heptalogos storage inspect <owner>
heptalogos storage usage [owner]
heptalogos storage verify <owner>
heptalogos storage purge-cache <owner>

heptalogos config sources
heptalogos config export
heptalogos config validate --file ...
heptalogos config reload <namespace>

heptalogos backup plan/create/verify
heptalogos restore plan/apply
```

CLI 仍通过 canonical Management Contract / bounded Recovery contract，不直接绕过 owner/lifecycle Authority 操作文件或数据库。

## 15. Foundation 自身的文件 mechanics 路由

Foundation 对外提供 StorageWorkspace/Config file mechanics 时，不要求每个实现者重新处理 generic filesystem 细节：

```text
Path / scoped file operations → Node node:path + node:fs/promises
atomic replacement            → write-file-atomic
bounded file watch            → Chokidar
first-party TOML codec        → js-toml
```

它们全部位于 Heptalogos-owned adapter 后。Extension/高级 Domain 的 `OWNER_NATIVE` storage freedom 不等于 Foundation 自己也重复造 parser、atomic writer 或跨平台 watcher。

完整强制路由见 `../dependencies/implementation-routing.md`。
