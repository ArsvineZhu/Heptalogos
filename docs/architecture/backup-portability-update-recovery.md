# 备份、Subject 可移植性、更新与恢复

## 1. 三个不同问题

### Installation Backup

恢复一个具体 Heptalogos logical instance 的 operational state；跨机器恢复可创建新的 physical InstallationId。

### Subject Bundle

迁移 Subject-owned portable semantic state。

### Product Update

切换产品 generation/runtime/schema。

三者不能共用一个模糊“导出/导入”语义。

---

## 2. Installation Backup

Backup artifact 必须有 semantic manifest：

```text
backup format/version
source ProductGeneration
DataOwner / BackupParticipant snapshot set
Core PostgreSQL snapshot
Configuration file/projection closure
Blob closure
contract/schema compatibility
Secret/key profile metadata
encrypted secret material when policy permits
installed Extension generation refs + recovery-closure profile
data lifecycle / purge fence metadata
source ContinuityEpochId
hashes
```

不是任意 zip。

---

### Backup Recovery Closure

灾备 backup 默认应能恢复 exact Extension generation closure；使用 `RECOVERY_COMPLETE` 时包含 required immutable Extension artifacts/native metadata，使用 `REFERENTIAL` 时只保留 exact digest/provenance refs，但 destructive restore 前必须重新取得并验证全部 required generations。不能用“当前最新版”代替 snapshot 所依赖的 generation。

## 3. Backup Coordinator / Participants

Installation Backup 以 logical `DataOwner / BackupParticipant` 为单位，而不是假设“一个 PostgreSQL + 一个共同 data directory”就是全量数据。

Foundation 至少协调：

```text
CorePostgresParticipant
ConfigurationParticipant
BlobCASParticipant
SecretParticipant
Extension/Domain DataOwner participants
PackageGeneration recovery closure
```

PostgreSQL participant 优先使用 PostgreSQL 成熟 backup/dump mechanics。复杂 owner 可以使用 native online snapshot、quiesce-and-copy、export stream、immutable closure、rebuildable 或 external-reference strategy。

Foundation 负责 BackupEpoch、barrier、manifest、participant verification、key/secret handling 与 restore safety；owner 负责自己的 snapshot semantics。

---

## 4. Heterogeneous Snapshot Closure

Backup 必须证明 manifest 中所有 required participant 与 cross-owner references 构成可恢复 closure，例如：

```text
Core DB snapshot
↔ Configuration source revisions
↔ Extension/Domain canonical snapshots
↔ referenced Blob set
↔ Secret portability/rebind metadata
↔ required PackageGenerations
```

不同 backend 不共享魔法全局 ACID transaction。BackupCoordinator 创建 `BackupEpoch`，只对需要的 owner 建立最小 admission/quiesce barrier，收集 snapshot token/digest 后再 seal manifest。

活跃系统可以 backup；更强 reproducibility profile 可扩大 quiesce 范围，但不能把“停整个机器”作为唯一正确方案。

---

## 5. Data Lifecycle Fence

Backup 是删除/retention 生命周期的一部分。

必须记录：

```text
backup retention class
contained purge/tombstone ledger revision
backup expiry/purge eligibility
restore-time deletion reconciliation rule
```

历史 backup 中包含旧数据不等于 restore 后可以静默复活已 authoritative-purge 的对象。

---

## 6. Cryptographic Material

Backup encryption key、Secret backend key、TUF root、admin credential 是不同 trust domains。

Backup manifest 只能引用/携带其 policy 允许的 material；必须定义：

```text
key version
rotation compatibility
recovery requirements
missing-key behavior
```

禁止用普通 `SecretRef` 模糊代替 backup key lifecycle。

---

## 7. Restore

Restore 会替换/切换 normal PostgreSQL canonical state，因此不能只依赖正在被替换数据库中的 DBOS `ManagementOperation`。

正常管理面先创建高风险 `SystemChangePlan`、完成授权/审批并准备 staging；进入 destructive restore boundary 后，由 Bootstrap Closure 持有的固定 `RecoveryOperation` / crash-safe `MaintenanceJournal` 记录不可丢失的阶段：

```text
operationId / ActivityId
operation type
source/target refs
precondition + verified backup refs
last completed stage
candidate/LKG refs
terminal outcome
```

该 journal 不是 generic workflow engine，只支持固定 recovery/maintenance verbs。

完整流程：

```text
verify artifact/integrity
→ compatibility check
→ map logical DataOwner/store IDs to target PathProfile
→ stage target DB/config/data/Blob/owner stores
→ verify recovery prerequisites
→ enter maintenance handoff
→ RecoveryOperation journal takes ownership
→ apply/switch Core PostgreSQL restore
→ restore/rebind Configuration and DataOwner participants
→ materialize Blob closure
→ reconcile purge/tombstone ledger
→ rebind required secrets/keys
→ no-effect smoke
→ switch ProductGeneration/data target if required
→ RuntimeReconcile
→ postcondition verification
→ import/reference resulting lineage/evidence into normal store
```

Staged smoke 默认禁止 external effects。

### ContinuityEpoch / Restore Reconciliation

Destructive restore 创建新的 `ContinuityEpochId`。它表示同一逻辑 `InstanceId` 的本地 canonical timeline 发生不连续，不表示外部世界被回滚。

进入新 epoch 后必须固定执行：session/authEpoch reset、pending Approval 失效、普通 ManagementOperation interruption、非 terminal consequential WorkItem/EffectOperation reconciliation、Secret/trust/package/purge-ledger revalidation。Snapshot 中可能已经在备份之后派发的 external effect 默认视为 unknown/uncertain，不自动重发。

InstallationAnchor/BootstrapKeyProvider/TUF installation trust state 不由普通 database restore 回滚。

`RestorePlan` 必须显式携带 `administratorCredentialRestorePolicy`，因为恢复历史 snapshot 可能把管理员 password verifier 回滚到旧值。允许的 Foundation 策略是：

```text
PRESERVE_SNAPSHOT_VERIFIERS
LOCAL_RESET_REQUIRED
```

所有 restore 都会使 normal sessions/approvals 失效并要求 fresh authentication。跨 installation restore 默认 `LOCAL_RESET_REQUIRED`：在开放 remote Management 前，由 local installation owner 通过 bounded recovery path 设置新的 administrator verifier。Same-installation restore 若显式选择保留 snapshot verifier，必须把 verifier rollback 作为 RestorePlan/Audit/Lineage 中可见的安全影响。

## 8. Subject Bundle

Subject Bundle 只包含 Subject-owned、portable、semantic state。

不自动包含：

```text
installation admin credential
machine service config
private PostgreSQL binaries
host-specific Extension runtime cache
provider runtime objects
DBOS private checkpoints
```

高级 Persona/Memory/Relationship subsystem 若未来声明 portable ownership，必须通过自己的 versioned export contribution 加入 Bundle；Foundation 不定义它们的内部格式。

---

## 9. Portable Durable Semantics

可移植对象必须存在于正式 semantic storage/contracts 中，不能只存在：

```text
process memory
cache
derived index
DBOS private state
provider object
extension runtime object
```

Subject Bundle 中每个 section 必须有：

```text
owner
contractVersion
compatibility requirement
sensitivity
required capabilities/extensions
```

---

## 10. Product Update

Update 使用：

```text
TUF trust metadata
ReleaseManifest
immutable ProductGeneration
compatibility preflight
backup/rollback policy
maintenance transaction
candidate acceptance
LKG
```

`ReleaseManifest` 至少包含：

```text
platform/arch
bootstrap/runtime requirements
runtime versions
native/WASM/executable closure
canonical contract/schema compatibility range
DB migration class
DBOS durable-code compatibility
bundled generations
licenses/SBOM refs
```

### 三个独立版本轴

必须明确：

```text
ProductGeneration
DBOS applicationVersion / durable-code version
Extension PackageGeneration
```

三者不能互相冒充。Extension generation 不映射为 DBOS `applicationVersion`。

DBOS durable workflow code应尽量薄且稳定；兼容演化优先使用 engine 支持的 compatibility/patch semantics。若新 ProductGeneration 引入真正不兼容的 durable workflow code，默认阻止切换直到旧不兼容 workflow drain；只有真实长期 workflow 证明有必要时，才允许设计 bounded legacy durable worker，而且它不得持有正常 Host/System Authority lease。

### DB Migration Class

每次产品 DB migration 必须在执行前声明：

```text
BACKWARD_COMPATIBLE
RESTORE_REQUIRED
NO_ROLLBACK
```

`BACKWARD_COMPATIBLE`：旧 LKG 在声明的 schema compatibility range 内可读取/运行。

`RESTORE_REQUIRED`：切换前必须存在已验证、可恢复的 backup/snapshot；candidate 失败时通过 RecoveryOperation 恢复 DB/data 后再选择 LKG。

`NO_ROLLBACK`：必须以显式高风险计划告知无法自动回退，并要求强审批/维护条件；不能制造虚假的 down-migration 承诺。

默认不依赖 hand-written down migration 作为安全机制。

---

## 11. Rollback

Rollback 是一项预先计算的 recovery strategy，不是简单切回旧目录。

切换前必须证明：

```text
old ProductGeneration schema compatibility
DB migration class
DBOS durable-code compatibility
Extension generation refs
Secret/key version compatibility
Blob/content format
purge/data lifecycle state
```

Candidate failure：

```text
stop/quiesce candidate
→ execute declared rollback strategy
→ if RESTORE_REQUIRED: restore compatible DB/data
→ select LKG ProductGeneration
→ no-effect verification
→ reacquire normal ownership
→ RuntimeReconcile
```

若预检不能证明安全 rollback，则 update 必须走 protected backup/restore 或 `NO_ROLLBACK` 高风险路径。

## 12. Recovery Core

Recovery Core 必须在正常 Subject、Operator AI、third-party Extension、normal Web/GUI、甚至部分正常 Policy path 不可用时仍能：

```text
inspect last failure
select safe ProductGeneration
start/inspect private PostgreSQL
enter Safe Mode
rollback/stage restore
repair bounded bootstrap/config references
surface key/secret recovery requirements
```

Recovery Authority 是小型、固定、本地、强认证 action set，不是 root shell。
