# 术语表

**Subject**：持续、单一的认知/社会主体。

**MicroSystem**：受监督的 runtime component。

**Service**：稳定 typed 长生命周期依赖合同。

**Capability**：动态可发现能力，可由多个 provider 提供。

**Contribution**：注册到 typed extension point 的实现/元数据。

**Package**：安装/分发单位。

**Generation**：不可变代码/软件代际。

**Driver**：外部协议/系统 adapter。

**Provider**：Service/Capability 的实现来源。

**Desired State**：用户/系统期望长期保持的状态。

**Actual State**：当前 runtime 实际状态。

**Readiness Profile**：某种有用运行模式所需 Services/Capabilities 的集合。

**OperatingModeController**：拥有系统 OperatingMode canonical transition 与 mode-level eligibility override 的 Kernel contract；模式切换不改写 durable Desired State。

**GenerationFence**：阻止 retired/stale generation 在 rebind/upgrade 后继续取得新调用或提交 current-generation-owned 结果的运行时 fencing contract。

**ContractCompatibilityRegistry**：解释 `ContractVersionRange` 与 Heptalogos Service/Capability semantic contract compatibility 的 registry；不以 npm semver 或 load order 代替产品兼容语义。

**Reaction**：一次持续认知 episode，不等于一次模型调用。

**ReactionWorkspace**：Reaction 的 typed artifact causal graph。

**CognitiveOpportunity**：值得认知处理的机会，不是必须回复。

**ConversationMailbox**：会话级 cognition pending/aggregation state。

**YieldDirective**：Reaction 主动等待某时间/事实/能力的语义指令。

**BehaviorIntent**：行为提议。

**Review**：Authority commit 前的 deterministic/policy-assisted review。

**DecisionCommit**：Subject 行为 Authority 的中心 commit。

**CommunicationCommit**：Subject 承诺向外表达的语义内容/社会行为。

**InteractionPlan**：消息数量、时序、模态等交互实现计划。

**ExpressionArtifact**：表达层生成的具体语言/媒体草稿。

**Semantic Fidelity**：确认表达没有改变 CommunicationCommit 的检查。

**ActionPlan**：durable Subject execution intent。

**EffectOperation**：外部副作用 truth fence，支持 `uncertain`。

**WorkItem**：canonical durable processing obligation。

**Signal**：best-effort wakeup/change hint。

**InvocationSpec**：一次模型调用的 typed semantic spec。

**CapabilityBroker**：capability provider/scope/policy/secret/invocation broker。

**SystemAction**：typed System Authority 操作。

**SystemChangePlan**：SystemAction 的 side-effect-free impact plan。

**ApprovalRequest**：绑定 exact action/input/plan 的 durable human approval。

**ManagementOperation**：durable System Authority operation。

**AuthorityHandoff**：Authority domain 之间转移 intent/context，而不转移 permission。

**Artifact**：带语义、provenance、ownership 的内容对象。

**Blob**：immutable content-addressed bytes。

**Evidence**：typed durable causal product record。

**Subject Bundle**：Subject portable semantic export。

**ProductGeneration**：immutable product software generation。

**ConfigurationDefinition**：配置的 typed schema、scope、默认值 Authority、可见性、可管理性、activation 等正式合同。

**ConfigurationRevision**：不可变的 proposed/saved 配置版本；不等于已经生效。

**ConfigurationActivation**：把某个 revision 变成 runtime Authority 的正式操作/记录。

**Configuration Surface**：系统全部正式可治理配置及其 metadata 的 registry；普通 Settings 只是它的 curated projection。

**Visibility**：配置是否进入某类管理/Presentation projection；与是否可编辑分离。

**Manageability**：配置是否可由管理员编辑、只读、系统管理或产品锁定。

**Management Contract**：Foundation 管理 read models、SystemAction、Operations、Approvals 等的 canonical typed client boundary；ManagementClient、CLI、HTTP、automation、external Presentation 与 authorized Machine Operations tools 都是其 projection。

**System Assistant**：Heptalogos 对机器运维能力的产品标签；正常情况下消费 Management Contract/API/CLI，严重故障时由独立 Machine Operations Plane 支撑。

**Maintenance Assistant**：System Assistant 在高风险或 break-glass 场景中的产品标签，不是另一个 runtime identity。

**Machine Operations Plane**：独立于 Product Host 的高权限机器/deployment 运维 trust/failure domain；其实现路线由外部 OpenClaw runtime 与 Heptalogos integration assets 承担。

**OpenClaw**：Machine Operations Plane 的外部 implementation/dependency route；不是 Heptalogos 普通用户界面的产品身份。

**ManagementClient**：由 canonical Management Contract 机械派生或严格实现的 typed client；不拥有业务 Authority。

**Reference CLI**：Foundation 的完整 reference management client，用于证明所有当前 administratively meaningful 管理能力在无 GUI 条件下可操作、可检查、可诊断；它不要求为每个 Presentation-only projection 建立一条独立命令。

**NetworkRequestContext**：描述 outbound network requester、purpose、destination policy、proxy/TLS、budget、sensitivity、causation 等的产品级网络访问上下文。

**NetworkAccessService**：提供受控 outbound network mechanics 与 policy enforcement 的 Foundation Service；不替代 EffectOperation。

**PressureSnapshot**：对 memory/disk/DB pool/queue/provider/network 等资源压力的结构化运行时观察。

**AdmissionDecision**：ResourceGovernor 对新工作给出的 `ALLOW / DELAY / THROTTLE / REJECT_*` 决策。

**ResourceGovernor**：把底层资源指标转化为 Pressure State、admission 与 load-shedding semantics 的 Foundation contract。

**ContractVersion / SchemaVersion**：持久化、跨 generation、跨进程、跨协议 contract 的显式兼容版本。

**CompatibilityEpoch**：project-level declaration of whether historical/external compatibility is currently an obligation。当前值 `PRE_PRODUCTION` 表示 Heptalogos-owned development formats 没有 backward-compatibility obligation：当前最佳 durable shape 保持 canonical V1，obsolete development shape 由 reset/reject 处理而不是 migration。进入 production compatibility epoch 必须经过显式 architecture decision。

**Stage Stabilization (Hn-S)**：功能 milestone 完成后、产品 milestone closure 之前的短期受控稳定化阶段；用于清除具体 Authority、恢复、canonical-state 和证据真值缺陷，不是第二个功能开发阶段。

**Current Evidence**：证明当前 canonical implementation 或当前 candidate 属性的、带 claim-matched scope 和环境/候选身份的证据；进入 current property ledger 前必须与当前行为一致。

**Historical Evidence**：描述过去 candidate、旧实现、旧 qualification 或事件的保留记录；可用于解释 chronology，不能单独作为当前行为、兼容义务或 Authority 的依据。

**Protocol Revision**：外部协议当前/期望/观察到的修订标识；属于运行数据与 Evidence，而不是 SDK 默认值的隐式假设。

**PurgePlan**：协调 logical tombstone、canonical purge、derived purge、Blob purge、Evidence retention、backup/export fence 的 durable data-lifecycle operation plan。

**RetentionFence**：阻止某数据在 backup/export/审计/生命周期条件解除前被物理删除的正式约束。

**Trust Domain**：具有独立 bootstrap、rotation、revocation、recovery 和 portability 规则的一类密码学/信任材料，例如 session key、Secret backend key、backup key、TUF root。

**Activity**：Heptalogos-owned semantic execution unit；有稳定 `ActivityId`、origin、causation、semantic target 与 outcome。OpenTelemetry Span 只是 telemetry projection。

**ExecutionContext**：当前执行活动的 lineage、Package/Generation/MicroSystem/Contribution origin、authority/principal、Subject scope 与 telemetry correlation 上下文。

**LineageContextRef**：跨 process/durable/restart 传播 Execution Lineage 的显式 versioned reference。

**ExecutionLineageService**：创建、传播、结束 Activity，并把产品 semantic lineage 映射到 telemetry/Evidence/Audit 的 Foundation Service。

**LineageQueryService**：查询 Activity tree、causal chain、observed runtime call graph、Extension lifecycle、Service consumer/provider 与 failure propagation 的只读服务。

**Bootstrap Closure**：位于 replaceable ProductGeneration 之外、负责 generation selection、bootstrap ownership、private PostgreSQL bring-up、RecoveryOperation 与 Host launch 的最小稳定运行闭包。

**BootstrapJournal**：PostgreSQL 尚不可用时记录早期 boot/recovery 阶段的 bounded crash-safe rescue projection；不是第二个 canonical database。

**RecoveryOperation**：当 restore/critical generation/data switch/private DB repair 会替换 normal durable substrate 时，由 Bootstrap Closure 持有的固定、crash-safe recovery operation。

**MaintenanceJournal**：RecoveryOperation 的最小阶段/引用/终态记录；不能扩成 generic workflow engine。

**BootstrapKeyProvider**：normal PostgreSQL/Configuration/SecretService 之前即可解锁 installation bootstrap material 的最小密码学 provider；与正常 SecretService 分离。

**PrivatePostgresProfile**：产品内私有 PostgreSQL 的固定运行约束，包括 loopback exposure、persisted port、SCRAM、private data dir 与 least-privilege role split。

**ExtensionStateStore**：Foundation 为简单 Extension 提供的可选 managed structured-state convenience；默认可由 private PostgreSQL 实现，但不是 Extension/Domain canonical storage 的强制 backend。

**PathProfile**：把 Program/Instance/Configuration/Data/Secret/Blob/Backup/Operational 等逻辑 lifecycle roots 映射到具体 OS/deployment physical paths 的平台合同；不允许上层假设共同父目录。

**StorageWorkspaceService**：按 owner/scope 提供 lifecycle-separated Config/Data/Cache/Temp workspace、Blob client、migration/backup/usage capabilities 的 Foundation Service；拥有 mechanics，不拥有 owner data model。

**DataOwner**：拥有一组 canonical/derived/cache stores 的 semantic owner；通过 DataOwnerDescriptor 声明 backend class、version、backup/restore/purge/retention/portability/resource accounting，而无需向 Foundation 暴露内部 schema。

**BackupParticipant**：某 DataOwner/store/package/secret closure 对 Installation Backup 提供 prepare/snapshot/verify/release semantics 的参与者。

**Configuration Source Kind**：`BOOTSTRAP_FILE | MANAGED_REVISION | DECLARATIVE_FILE | OWNER_NATIVE | DERIVED_READ_ONLY`，定义某配置 namespace 当前的物理/语义写入 Authority。

**SystemActionCatalog**：运行时可发现的 dynamic SystemAction descriptor registry，用于 Extension action 的 schema/help/risk/owner projection；不要求重新生成静态 ManagementClient。

**PlanningContext**：`SystemAction.plan()` 唯一允许读取的 read-only planning capability surface；不含 mutation/network/Secret plaintext/runtime/filesystem/raw DBOS/root DB effect ports。

**CanonicalJson**：基于 RFC 8785 JCS semantics 的稳定 JSON canonical representation，用于跨进程/generation 的可重复 digest identity。

**DB Migration Class**：Product Update 的 DB 变更类别：`BACKWARD_COMPATIBLE / RESTORE_REQUIRED / NO_ROLLBACK`。

**RoleDecision**：依赖在某个架构角色上的决策状态：`ADOPTED / PRIMARY_CANDIDATE / UNRESOLVED / DEFERRED / REJECTED_FOR_ROLE`。当前 Foundation baseline 中不存在 `PRIMARY_CANDIDATE / UNRESOLVED`；二者只允许作为未来新角色的临时治理状态。

**ImplementationQualification**：具体 package/version/binary 的产品资格状态：`NOT_REQUIRED / REQUIRED / RUNNING / PASSED / FAILED / DEFERRED`。

**L0/L1/L2/L3 Evidence**：依赖/产品验证层级：direct evidence、micro probe、boundary probe、product qualification。

**Problem**：跨 API/CLI/runtime boundary 的稳定机器失败合同；包含 `problemCode/category/retryClass` 等安全字段，并可用 `ActivityId` 关联执行血缘。HTTP 通过 RFC 9457 Problem Details 投影。

**BootstrapStateStore**：Bootstrap Closure 使用的固定、极小、crash-safe versioned metadata store；只持 active/LKG generation refs 与 recovery journal state，不是第二个业务数据库。

**ContractVersionRange**：Service/Capability consumer 对 Heptalogos semantic contract version 的兼容要求；由 `ContractCompatibilityRegistry` 解释，不等同 npm package semver。

**Identifier Contract**：区分 namespaced stable IDs、UUIDv7 instance/event IDs、content-digest generation IDs 与 scoped ExternalIds 的统一身份规则。

**Secret Portability Class**：`PORTABLE_ENCRYPTED | EXTERNAL_REFERENCE | REBIND_REQUIRED | NON_EXPORTABLE`，定义 SecretRef 在 backup/restore/import 时的合法行为。

**InstanceId**：逻辑 Heptalogos product instance 身份；灾备 restore 延续该身份，显式 clone 创建新身份。

**InstallationId**：某个 instance 在具体 OS/机器 installation root 上的物理安装身份；跨机器 restore 创建新值。

**BootId**：一次 Host boot/run attempt 的 identity；每次启动新建并进入 Execution Lineage origin。

**InstallationAnchor**：OS/service/foreground 固定入口；不依赖当前 ProductGeneration，选择 verified BootstrapRuntime generation 后进入 Bootstrap Closure。

**HostOwnershipToken / HostOwnershipFence**：与 dedicated PostgreSQL advisory Host lease 配套的数据库级写入 fencing；所有 canonical mutating transaction 验证当前 token，新 owner 以 exclusive fence 切换 token，防止旧 Host pooled connection 在 lease loss 后继续提交。

**ContinuityEpochId**：同一逻辑 Instance 的连续 canonical execution timeline 身份；destructive restore/rollback 创建新 epoch，用于阻止旧 snapshot 的 session/approval/外部副作用 work 被无条件继承。

**ActivationResourceScope**：MicroSystem/PackageGeneration activation 所有 process-memory sockets/timers/listeners/tasks/child processes 的 ownership/cancellation/finalizer scope；需要跨 crash 生存的义务不属于该 scope，而应进入 durable work。
