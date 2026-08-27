# S14 Canonical End-to-End Flows

所有 flow 默认携带 `ExecutionContext / ActivityId`。同步 child、durable causation/link、Package/Generation origin 和 required Evidence/Audit 按 `S16` 传播；流程图省略重复的 telemetry projection。

## Flow A：首次启动与首管理员认领

```text
stable Bootstrap Closure
→ create/locate installation and independent PathProfile lifecycle roots
→ acquire pre-PG bootstrap lock
→ start Early Observability / BootstrapJournal
→ initialize/start PrivatePostgresProfile
→ acquire authoritative PostgreSQL Host lease
→ establish/validate HostOwnershipFence under bootstrap+lease ownership
→ publish fresh HostOwnershipToken
→ ensure expected ContinuityEpochId exists in committed BootstrapState
→ run canonical migrations under distinct migration authority
→ materialize and verify the same ContinuityEpochId in canonical PostgreSQL
→ initialize canonical System state
→ FIRST_RUN_SETUP
→ generate one-shot local admin claim secret; persist only digest/state/expiry canonically
→ expose loopback-only claim endpoint
→ CLI reads local claim + password via TTY/stdin
→ transaction: verify unused claim → create Administrator/verifier/authEpoch → mark claim CONSUMED
→ delete local claim plaintext + close unauthenticated claim path
→ crash after commit but before file delete still cannot replay claim
→ Management READY
→ SubjectDesiredState = STOPPED
→ only then release bootstrap ownership
→ return normal managed Host only after canonical initialization succeeds
```

不存在 default password、remote unauthenticated onboarding 或 GUI dependency。

---

## Flow B：正常重启

```text
Bootstrap Closure
→ BootstrapJournal Activity
→ active/LKG ProductGeneration
→ private PG
→ Host lease
→ publish new HostOwnershipToken under HostOwnershipFence
→ load and verify the same committed ContinuityEpochId
→ normal ExecutionLineage handoff
→ runtime reconcile
→ Management
→ SubjectDesiredState
→ Subject recovery when desired
```

---

## Flow C：Subject Chat

```text
authenticated SubjectChatClient
→ Subject Chat protocol
→ canonical MessageFact + WorkItem
→ static WorkQueue dispatcher
→ ConversationMailbox
→ Reaction
→ DecisionCommit
→ CommunicationCommit
→ Effect/subject-chat delivery
→ client projection
```

`SubjectChatClient` 可以是未来 Web Presentation、测试客户端或其他正式客户端；Foundation 不绑定具体 GUI。

---

## Flow D：External IM

```text
external Driver Activity
→ Raw Evidence
→ canonical MessageFact + WorkItem
→ static WorkQueue dispatcher
→ Mailbox / Reaction
→ EffectOperation
→ Driver
→ remote outcome / uncertain
```

---

## Flow E：Static CLI Management

```text
CLI command / structured input
→ resolve/prompt CLI session credential through protected path
→ generated ManagementClient
→ loopback canonical Management HTTP API
→ typed Core Management Contract
→ authentication / Policy
→ owning Service or ManagementOperation
→ canonical result/status
→ structured CLI projection
```

CLI 不直接写 DB/files/config/package/runtime internals。

---

## Flow F：Dynamic Extension SystemAction from CLI

```text
CLI
→ query SystemActionCatalog
→ descriptor + JSON Schema/help metadata
→ collect/validate input
→ generic planAction(actionId, input)
→ SystemChangePlan
→ Policy/Approval
→ executeApprovedAction
→ owning Host/Extension contribution under generation fence
→ ManagementOperation/outcome
```

Extension 不向 CLI process 注入 executable command code；install 不需要重新生成 CLI/client。

---

## Flow G：Operator read

```text
Operator message
→ AI Invocation Activity
→ structured query proposal
→ Policy
→ Runtime/Lineage/Evidence read models
→ explanation
```

---

## Flow H：Operator mutation

```text
natural language
→ SystemAction proposal
→ normalize with canonical schema
→ PlanningContext-only plan()
→ SystemChangePlan + canonical digest
→ Cedar authorize
→ ApprovalRequest bound to exact digest
→ human approve
→ revalidate/re-authorize
→ ManagementOperation
→ owning Service
→ verify
→ Lineage + Evidence/Audit
```

---

## Flow I：Extension install

```text
artifact source
→ package.discovery Activity
→ acquire via controlled source
→ integrity/provenance/trust checks
→ manifest/schema/compatibility inspect without executing runtime code
→ permission delta + plan/approval when required
→ stage immutable PackageGeneration
→ register metadata/SystemAction descriptors/config/contributions
→ desired enable
→ RuntimeReconciler
→ activation in selected ExecutionDomain
→ scoped Services/Capability/StorageWorkspace/DataOwner/optional ExtensionState/Lineage clients
→ health
→ capability/readiness
```

每阶段都保留 PackageId/PackageGenerationId causation，失败可由 LineageQuery 解释。

---

## Flow J：Extension upgrade with pending work/state

```text
generation A active
→ WorkItems pinned ContributionId + PackageGenerationId=A + payloadVersion
→ stage/verify B
→ classify config-source/data-state/index/payload migrations
→ owner data migration compatibility class + old-generation durable-ref fence
→ plan/approval
→ quiesce impacted graph when required
→ if destructive state migration: prove A-compatible state, shadow state, or drain/migrate/cancel A refs
→ migrate owner config/data through workspace/DataOwner fences
→ activate B
→ new WorkItems pin B
→ old WorkItems continue resolving retained A handler
→ A logical retirement after no active runtime users
→ physical code purge only after durable refs/data/migration fences clear; config/data remain until explicit lifecycle purge
```

`DBOS applicationVersion` 不因 A→B 改变。DBOS 运行静态 `dispatchWorkItem(WorkItemId, dispatchRevision)`；`WorkItemId` 标识产品 durable obligation，`dispatchRevision` 标识当前可执行 attempt。相同 revision 的重复调度映射为同一 deterministic `DispatchAttemptId`；真正 retry/wakeup 先在 canonical WorkItem 上递增 revision，再产生新的 attempt。Extension generation 解析由 Heptalogos handler registry完成。

---

## Flow J1：Declarative / Owner-native Config Activation

```text
ConfigWorkspace source changes / owner reports new source revision
→ compute source digest/version
→ parse/validate or owner ConfigAdapter validation
→ immutable ConfigurationRevision materialization/ref
→ impact SystemChangePlan
→ Policy/Approval when required
→ activate
→ RuntimeReconcile
→ Lineage records exact source/revision
```

如果新 source invalid：

```text
source status = INVALID_SOURCE
active runtime revision = last-known-good
no silent DB overwrite of file Authority
```

---

## Flow J2：Extension Disable / Uninstall / Data Purge

```text
disable
→ DesiredState off
→ quiesce runtime resources
→ retain ExtensionInstance metadata/config/data/Secret

uninstall
→ retire package generation/inventory when generation/durable refs allow
→ retain config/data/Secret by lifecycle policy

explicit purge
→ DataLifecycle/SystemChangePlan
→ enumerate owner stores + Blob refs + backup/retention fences
→ approve high-risk deletion as required
→ owning DataOwner purge contributions
→ physical delete only after fences clear
```

代码更新/卸载、实例删除、配置删除、数据 purge、Secret revoke 是不同动作。

---

## Flow K：External Effect crash

```text
Effect prepared
→ dispatching committed
→ process crash
→ reboot/recovery
→ Effect still dispatching without proof
→ classify uncertain
→ no automatic resend
```

---

## Flow L：Backup

```text
BackupOperation
→ discover required DataOwner/BackupParticipant set
→ preflight health/space/compatibility
→ create BackupEpoch + minimum required barriers
→ prepare participants
→ Core PostgreSQL native snapshot/dump
→ Configuration source/projection snapshots
→ Extension/Domain owner snapshots or declared rebuild/external refs
→ exact Blob closure
→ secret portability classes + allowed encrypted backup material
→ required PackageGeneration recovery closure
→ participant verify + manifest/digests
→ seal BackupEpoch
→ release barriers
→ COMPLETE
```

---

## Flow M：Restore across durable substrate

```text
normal ManagementAction
→ verify backup + compatibility
→ SystemChangePlan / high-risk approval
→ map logical owner/store IDs to target PathProfile
→ stage target DB/config/data/Blob/owner stores
→ preserve logical InstanceId; create target InstallationId/BootId as applicable
→ acquire bootstrap ownership while Host lease is still held
→ prepare RecoveryOperation journal
→ quiesce normal runtime and hand off Host lease under bootstrap ownership
→ normal DBOS may become unavailable
→ create new ContinuityEpochId in BootstrapState/MaintenanceJournal
→ RecoveryOperation restores Core DB and owner participant set
→ enter bootstrap-owned offline recovery-mutation window; normal Runtime/DBOS/Management remain closed
→ blobs + purge/tombstone reconciliation
→ reset authEpoch/sessions; supersede restored approvals; interrupt ordinary restored ManagementOperations
→ classify non-terminal consequential WorkItems/EffectOperations into restore reconciliation
→ do all restored-state invalidation before normal DBOS launch/queue recovery/Management exposure
→ create target-installation bootstrap roots; do not clone source BootstrapKeyProvider root
→ restore portable secrets / retain external refs / mark required rebinds
→ revalidate trust/package-generation/external-integration closure
→ readiness may expose BLOCKED_SECRET_REBIND / RESTORE_RECONCILIATION
→ no-effect smoke
→ ProductGeneration/data target switch when required
→ acquire target PostgreSQL Host lease
→ publish a new HostOwnershipToken under HostOwnershipFence
→ release bootstrap ownership
→ RuntimeReconcile
→ normal Lineage imports/references recovery chain
```

---

## Flow N：Product Update

```text
TUF refresh
→ target + ReleaseManifest
→ verify Bootstrap/runtime/ProductGeneration requirements
→ preflight three version axes:
   ProductGeneration
   DBOS durable-code/applicationVersion
   Extension generations
→ classify DB migration:
   BACKWARD_COMPATIBLE | RESTORE_REQUIRED | NO_ROLLBACK
→ prepare required backup/recovery strategy
→ approval
→ acquire bootstrap ownership while current Host lease is still held when bootstrap/DB switch may occur
→ maintenance / quiesce
→ hand off Host lease under bootstrap ownership when target transition requires it
→ drain incompatible durable workflows when required
→ migrate under declared fence
→ candidate no-effect acceptance under bootstrap ownership; no normal Host/System/Subject Authority
→ switch active generation through BootstrapStateStore
→ acquire/verify target Host lease and publish a new HostOwnershipToken before normal runtime resume when lease was handed off
→ postcondition verification
→ LKG metadata update only after acceptance
→ release bootstrap ownership
```

Candidate failure严格执行预声明 rollback/restore strategy；不能在 DB 已不可逆改变后盲目“切回目录”。

---

## Flow O：Safe Mode

```text
bootstrap safe override
→ optional/third-party not eligible
→ Subject stopped/blocked
→ Management/diagnostics/LineageQuery
→ repair desired config/package/system state
→ reboot/reconcile normal
→ original Desired State re-evaluated
```

---

## Flow P：Private PostgreSQL boot failure

```text
Bootstrap Activity
→ bootstrap lock held
→ PG start fails
→ write BootstrapJournal stage/outcome
→ do not claim normal Host READY
→ enter bounded Recovery
→ Recovery CLI inspects journal/generation/PG state
→ repair/restore/select LKG as fixed recovery verb
```

即使 PostgreSQL 不可读，管理员仍有最小可追溯 failure chain；BootstrapJournal 不是第二个 canonical database。

---

## Flow Q：Graceful Shutdown

```text
shutdown Activity
→ stop admission of new consequential work
→ quiesce Subject / Extensions
→ preserve Effect uncertainty
→ settle WorkQueue/Durable state
→ terminate MicroSystems reverse-safe order
→ terminal Lineage/Evidence where required
→ if private PostgreSQL will stop: acquire bootstrap ownership while Host lease remains held
→ under exclusive HostOwnershipFence revoke current token after in-flight mutations settle
→ release Host lease under bootstrap ownership
→ stop private PostgreSQL when product mode owns its lifetime
→ finalize BootstrapJournal
→ release bootstrap ownership
```
