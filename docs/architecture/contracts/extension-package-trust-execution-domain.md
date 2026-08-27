# S06 Extension Package、Trust 与 Execution Domain

## 1. 身份分离

```text
PackageId
PackageGenerationId
MicroSystemId
MicroSystemInstanceId
ContributionId
```

不能互相替代。

---

## 2. Manifest-first

`heptalogos.json` 在不执行 runtime code 时可检查：

```text
identity/version
manifest contractVersion
host API range
MicroSystems
Services/Capabilities
Contributions
configuration/source definitions
persistent DataOwner/store declarations
backup/restore/purge classes
permission requests
execution-domain request
assets/entrypoint digests
migration declarations
license/provenance
Presentation contribution metadata when present
CLI contribution metadata
```

Manifest 是声明，不授予信任或 Authority。

Persistent ownership declaration 必须在 runtime 执行前可读取。DataLifecycleRegistry 将 accepted DataOwner/store metadata 以 Host canonical metadata 持久化，因此 Extension runtime 失效、Package 被 disable/uninstall 后，系统仍知道 retained Config/Data 属于谁、怎样备份/恢复/清除。需要 executable custom BackupParticipant 的 store 必须在 descriptor 中声明对应 contribution/generation requirement；participant 不可用时 backup 明确 `BLOCKED/INCOMPLETE`，不得静默跳过 canonical data。

---

## 2.1 Runtime Dependency Contract

Package artifact dependency、runtime Service dependency、Capability requirement 是不同关系。

Runtime hard Service requirement 至少声明：

```text
ServiceId
ContractVersionRange
required | optional
scope constraints
```

Capability requirement 至少声明：

```text
CapabilityId
ContractVersionRange / feature constraints
required | optional
scope constraints
selection constraints when needed
```

`ContractVersionRange` 描述 Heptalogos contract compatibility，不默认等同 npm package semver。具体语法可以实现化，但 compatibility rule 必须由 `ContractCompatibilityRegistry` 解释并记录版本。

Resolution 必须 deterministic：

```text
no compatible provider
→ WAITING_DEPENDENCY / INCOMPATIBLE with structured Problem

multiple compatible providers
→ CapabilityBroker deterministic selection policy
```

hard Service dependency graph 不允许 unresolved cycle；不得通过 registration/load order 隐式打破循环。Package manager 的 artifact dependency resolution 不授予 runtime Service Authority。

## 3. Origin / Trust

由 Host assign：

```text
origin:
  core-bundled
  first-party
  third-party
  development

trust:
  product-trusted
  reviewed
  sandbox-required
  external
```

Package 自称 trusted 无效。

---

## 4. Acquisition

Production package artifact 必须：

```text
prebuilt
dependency-closed
immutable
source-less eligible
```

npm artifact acquisition 使用 `pacote` 承担 fetch/manifest/tarball/integrity mechanics。

Heptalogos 仍拥有：

```text
source policy
trust/provenance
install plan
permission review
generation identity
activation/retirement
```

Production source policy 默认禁止：

```text
arbitrary git build
source-directory install
runtime lifecycle scripts
runtime npm/pnpm install
```

---

## 4.1 Safe Staging Closure

Artifact acquisition/extraction 只能写入 Host-owned temporary staging root。`pacote`/archive library 的成功返回不等于 package tree 已被产品接受。

在 generation commit 前必须静态验证：

```text
all resolved paths remain under staging root
no path traversal / absolute-path escape
symlink/hardlink policy explicit; default reject links escaping package closure
no device/FIFO/socket/setuid-like special entries
bounded file count / total unpacked bytes / per-file bytes / path depth
Windows reserved-name/path semantics
case-fold/canonical-name collisions across supported filesystems
normalized executable/permission metadata
manifest-declared native/executable/WASM closure matches actual files
unexpected mutable/install-script artifacts do not become runtime authority
```

PackageGeneration identity基于已验证 artifact/tree metadata 的 canonical digest contract。只有完整 tree verification 通过后，才原子发布 immutable generation；失败 staging 可直接删除，不进入 package inventory 的 active generation。

## 5. Integrity != Safety

```text
digest
signature
attestation
```

只能证明来源/完整性，不能证明代码安全。

trusted in-process code 必须真实承认 process/OS-level trust。

---

## 6. Runtime Activation

```text
installed immutable generation
→ desired enabled
→ RuntimeReconciler
→ service/capability/config/secret/permission checks
→ execution-domain eligibility
→ activation
→ health/readiness
→ contribution publication
```

Resolved cross-owner Services/Capabilities are injected as Host-owned scoped Service/Capability facades, not raw provider implementation objects. Facades preserve contract/generation/permission/ExecutionContext/Lineage boundaries.

`ExtensionPackageManager` 不直接启动代码。

---

## 6.1 WorkHandler Execution Boundary

`WorkHandlerContribution` 由 Foundation static durable dispatcher 调用，是 restartable attempt，不是 Extension-owned workflow runtime。Descriptor 必须声明 accepted payload versions、configuration binding policy、resource/admission class 与 `restore replay class`。Handler 只获得 scoped Foundation clients，并必须以 `WorkItemId + dispatchRevision/owned operation identity` 使 canonical mutation 可安全重入；外部副作用必须走 EffectOperation。`restore replay class` 默认 `RECONCILE_REQUIRED`；只有被 contract/qualification 证明 snapshot rollback 后可安全重复的 handler 才可声明 `RESTORE_SAFE`。

Host 不向 Extension 暴露 raw DBOS。Extension code 即使 trusted in-process，也不能把直接 network/filesystem/process mutation 当作 WorkHandler contract 的合法副作用路径。

## 6.2 Background Execution Ownership

Extension runtime 中的 background task 必须通过 activation-scoped Foundation/runtime API 注册：

```text
scoped timer/listener/socket/child process/background promise
→ owned by PackageGeneration/MicroSystem activation scope
→ receives/derives ExecutionContext
→ disable/retire/shutdown cancels and awaits bounded settlement
```

若业务义务必须跨 crash/restart 生存，则必须转化为 `WorkItem`/Foundation durable primitive，而不是依靠 detached process-memory task。

## 7. Disable / Uninstall / Purge

严格分离：

```text
disable   = desired runtime off
uninstall = retire package generation from install inventory when safe
purge     = explicit data-lifecycle operation for owned persistent data
```

Secret、配置历史、Evidence 和 portable data 不随 uninstall 静默删除。

Purge 使用 `PurgePlan`、retention/backup fences 和 owning-service rules。

---

## 8. Mutable Data、Storage Workspace 与 DataOwner

Package code generation immutable；mutable config/data/cache/temp 不放 generation 目录。

Foundation 通过 `StorageWorkspaceService` 为 Extension instance 分配独立 lifecycle workspace：

```text
ConfigWorkspace
DataWorkspace
CacheWorkspace
TempWorkspace
BlobClient
Backup/Migration/DataOwner registration
StorageUsage
```

Extension 可以自由选择 TOML/YAML/JSON、SQLite、embedded DB、文件树等 owner-native mechanics。Foundation 不要求所有 canonical state 进入 private PostgreSQL。

`ExtensionStateStore` 保留为简单 managed structured-state convenience：

```text
owner/scope/namespace/key
schemaVersion + revision
JSON-compatible value or ArtifactRef
```

默认 implementation 可以是 private PostgreSQL；普通 Extension 仍不获得 root SQL/DDL。

Owner-native canonical store 必须注册 `DataOwnerDescriptor`，声明 backup/restore/purge/retention/portability/resource accounting/schema version；不得越过 scoped roots、把 state 藏在 PackageGeneration，或用未注册 store 绕过生命周期治理。

### Configuration

Extension config backing 可以是：

```text
MANAGED_REVISION
DECLARATIVE_FILE
OWNER_NATIVE
```

OWNER_NATIVE 不强迫把字段复制进 PostgreSQL；要进入统一 CLI/API 字段级管理时贡献 `ConfigurationProjection/ConfigAdapter`。

### Migration

明确区分：

```text
Configuration source/schema migration
Owner canonical data migration
Derived-index rebuild
Durable Work/Contribution payload upcast
```

Host 拥有 ordering、version fence、backup/recovery、purge 与 generation pin；Extension 拥有 domain transform。

### State/Data Migration Compatibility Fence

Owner canonical data migration必须声明旧/new generation 的 reader/writer compatibility 与 migration class：

```text
BACKWARD_COMPATIBLE
DRAIN_REQUIRED
SHADOW_COPY
RESTORE_REQUIRED
```

如果仍存在 pin 到 generation A 的 durable WorkItem/operation，则 generation B 的 destructive data migration 只有在以下之一成立时才可提交：

```text
A can read/write the post-migration state contract
or A is bound to a retained compatible shadow state
or all A-pinned durable refs have drained/migrated/cancelled
```

该规则适用于 ExtensionStateStore、SQLite/files、专用 DB 或 external backend。仅保留 generation A 代码不足以证明可安全执行。

详细见 `storage-workspace-data-lifecycle.md`。

## 9. Execution Domains

Architecture 支持：

```text
trusted-in-process
isolated-node-process
wasm-sandbox
external-mcp
external-process/network
```

统一的是 Heptalogos MicroSystem/Service/Capability/Contribution contract，不要求同一 runtime substrate。

### Trusted in-process

service/context/lifecycle mechanics 由已采用的 `cordis` RuntimeSubstrate 承担。

### WASM sandbox

Contract 存在，但 Foundation 当前不实现/选择具体 WASM runtime。

```text
RoleDecision = DEFERRED
```

Node Permission Model / `node:vm` 不得被描述为 malicious-code sandbox。

### External MCP

使用 official MCP SDK 处理 transport/protocol mechanics；Heptalogos 仍控制 trust、SecretRef、NetworkAccess、capability mapping、policy/effect、Evidence 和 lifecycle。

---

## 9.1 Native / Executable Closure Descriptor

含 native addon/shared library/executable/WASM 的 package 必须在 manifest/ReleaseManifest 可静态检查，不执行第三方 runtime code即可得到：

```text
OS / architecture
libc/ABI constraints when applicable
Node runtime range
N-API version when applicable
exact Node ABI/runtime constraint when not N-API
native addon/shared-library inventory
external executable/WASM inventory
content digests
license/provenance refs
```

优先使用稳定 N-API ABI。非 N-API native addon 不能假定跨 Node runtime generation 兼容，必须 exact-validate 对应 runtime closure。

Host 在 activation 前做 target/ABI/preload compatibility preflight；最终可加载性由真实 Windows/macOS/Linux source-less L3 product qualification 证明。

## 10. CLI Contributions

Extension 可贡献 typed CLI/Management actions，但必须通过：

```text
Package inventory
→ Runtime eligibility
→ Contribution registry
→ canonical Management Contract
→ CLI projection
```

禁止使用 CLI framework 自己的 plugin manager 形成第二套 package/activation Authority。

---

## 11. Presentation Contributions

Package 可以声明 semantic Presentation contribution metadata。

Foundation 只保证：

```text
contribution schema
owner/generation
permissions
ManagementClient boundary
assets integrity metadata
```

具体 Web/GUI loader、microfrontend runtime、renderer 和视觉实现不属于 Foundation dependency selection。

---

## 11.1 Dynamic Management / CLI Contribution

Extension 可贡献 `SystemActionDescriptor` 与 CLI/Presentation metadata，但不能向 CLI 客户端进程注入可执行 command code 作为默认模型。

```text
Extension generation
→ SystemAction Catalog descriptor
→ canonical Host plan/execute
→ CLI dynamic projection
```

安装新 Extension 不要求重新生成静态 ManagementClient/CLI binary。

---

## 12. Upgrade

```text
stage generation B
→ verify contract/integrity
→ permission delta
→ config/data/contract compatibility plan
→ SystemChangePlan
→ approval when required
→ quiesce impacted dependents
→ migrate/upcast if required
→ activate B
→ health/readiness
→ retain A while durable refs require A
→ retire/purge eligibility
```

Durable `WorkItem`、workflow input、Contribution descriptor 必须 versioned，并能 pin compatible generation。

---

## 12.1 Execution Lineage 与 Generation Retirement

Package discovery、acquisition、integrity、manifest validation、trust、dependency resolve、registration、activation、quiesce、retire、purge 都必须产生结构化 Activity；Host 注入可信 Package/Generation/MicroSystem/Contribution origin，Extension 不能伪造该 identity。

Trusted in-process generation 的 logical retirement 只保证资源/registrations/effects 已释放：

```text
retired generation
!= guaranteed Node ESM module code memory unload
```

高频 generation churn、native addon/security-sensitive upgrade 或 ResourceGovernor 观察到 code/memory pressure 时，可要求 maintenance Host restart。该阈值是可配置/可观测的 product policy，不是硬编码常数。

### Physical generation cleanup

Logical retirement 与 physical deletion 分离。尤其 Windows/native addon/shared library 可能因当前 process 持有 module/file handle 而暂时无法删除。

```text
RETIRABLE
→ logical inactive + no new refs
→ PENDING_PHYSICAL_PURGE when filesystem/native handle blocks deletion
→ cleanup at maintenance Host restart / next bootstrap
→ PURGED after verified closure removal
```

不能为了“uninstall 看起来立刻完成”强杀 Host 或把删除失败当作 generation 又恢复可用。Pending purge 进入 package state/Lineage，并计入 disk pressure。

## 13. Library-first Boundaries

Generic mechanics 优先：

```text
npm artifact acquisition → pacote
trusted in-process service/lifecycle → qualified runtime substrate
protocol integration → official/maintained protocol SDK where suitable
process execution → Execa / OS primitives
sandbox runtime → researched only when implementation enters scope
```

Extension 模型统一不能成为把 package download、DI、queue、sandbox、CLI、Presentation 等全部自研的理由。
