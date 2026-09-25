# 架构审查清单

## 宪法级检查

- 是否仍满足 `Subject != Model`？
- 是否仍满足 `State > Prompt`？
- 是否把 proposal 错当 Authority？
- 是否混淆 Subject Authority / System Authority？
- 是否伪造外部世界的确定性？
- 是否让 Recovery 依赖可能坏掉的正常系统？
- 是否把 Subject-owned portable truth 留在 runtime/private engine state？
- 是否因为实现便利隐式修改项目宪法？

## Foundation Scope

- 这项工作是否真的属于 Foundation？
- 是否把 Persona、Memory、Relationship、Attention、Reflection 等高级 cognition 实现拉入 Foundation？
- 若高级 subsystem 只需要未来接入，是否只定义了 Service/Capability/Context/Activity/config/Evidence/readiness hook？
- 是否错误让可选高级 subsystem 成为 Subject Base readiness dependency？
- 是否把 Web visual/runtime/renderer 选择误当 Foundation gate？

## Library-First / Dependency Selection

- 这个 generic mechanics 是否已有成熟 standard/library/framework/protocol/OS facility？
- 差异是命名不同还是真正语义冲突？
- 是否能通过 thin adapter 复用？
- 是否先检查了 L0 direct evidence？
- 若写 probe，是否只验证一个未知性质？
- probe 是否开始实现真实 Subject/Driver/Extension runtime 等产品系统？若是，应停止并拆分问题。
- 是否把 Architecture Selection 与 L3 Product Qualification 混淆？
- `RoleDecision` 与 `ImplementationQualification` 是否分别正确？
- `dependency-status.json` 与 Markdown 是否一致？
- 若 `RoleDecision = ADOPTED`，实现是否实际使用 `project/dependencies/dependency-routing.json` 指定的 route，而不是自写/换库？
- 若已采用 route 的 adapter 尚不存在，是否实现了 adapter，而不是用“暂不新增依赖”为理由造 temporary custom mechanics？
- 是否存在两个库/两个 custom implementation 同时竞争同一个已经冻结的 generic role？若有，是否正式 reopen qualification？
- 已采用 npm dependency 是否在 `pnpm-workspace.yaml` Catalog 中集中声明，并由 workspace package 使用 `catalog:`？
- `catalogMode: strict` 与 Nx/ESLint/dependency-route gate 是否阻止本地随手选版本和跨 adapter import？
- exact dependency version 是否来自当前 registry/upstream evidence，而不是模型记忆、旧文档或旧 lockfile？
- prerelease/RC/beta/`0.x` 是否按维护、测试、真实使用、API churn、blast radius、pin/rollback 和所需能力评估，而不是按标签自动接受/拒绝？
- canonical compiler 是否为 TypeScript 7，且 `target=ESNext` / `module=NodeNext` / ESM-first？
- TS6 是否仅存在于 compiler-API compatibility lane，而没有成为 Foundation product compile/typecheck Authority？
- `@types/node` major 是否与 shipping Node major 一致？
- dependency compatibility gate 是否使用 `skipLibCheck=false`？

## Configuration

- 新增 behavior-affecting literal 是否已分类？
- 是否因为普通用户看不到就错误 hardcode？
- `existence / visibility / editability` 是否分离？
- schema 是否表达真实类型而非 stringly typed？
- default Authority 是什么？
- platform/deployment applicability 是否明确？
- activation 是 LIVE、restart、maintenance 还是 next boot？
- runtime consumer 是否真实读取 active config？
- 这是 Config、Secret、Derived State 还是 Product Invariant？
- Management/CLI projection 是否完整？
- ConfigurationDefinition 是否被错误等同为 PostgreSQL backing？
- 当前 namespace 的唯一 source kind/写入 Authority 是否明确？
- MANAGED core config 是否有 lossless human-readable projection/export？
- DECLARATIVE_FILE invalid source 是否保留 runtime LKG 而不伪造 Authority？
- OWNER_NATIVE Extension config 是否仍进入 scoped ConfigWorkspace/lifecycle/backup 治理？

## Management / CLI

- 是否先定义 canonical Management Contract？
- 每个 administratively meaningful Foundation capability 是否可通过 CLI inspect/operate/diagnose？
- CLI 是否只调用 ManagementClient/Recovery contract，而不是直接改 DB/files/package？
- 是否有 stable structured output、exit code、non-interactive path、operation watch？
- 是否验证 PowerShell/cmd/POSIX shell semantics？
- HTTP/Web/Operator 是否复用同一 action/read schema，而不是复制业务逻辑？
- static Core Management Contract 与 runtime dynamic SystemActionCatalog 是否分离？
- 安装 Extension 是否无需重新生成 CLI/ManagementClient？
- `plan()` 是否只能拿到 read-only `PlanningContext`，而没有 effectful ports？
- normal CLI 是否默认复用 loopback canonical HTTP API，而不是另造第二套 management semantics？

## Subject

- 是否保持 Subject 与 Model/Reactor/Host 分离？
- 新状态属于 Subject 还是 Installation/Feature？
- Desired/Actual 是否分离？
- 是否支持 restart/portability？
- 是否错误把长期状态只放在 Prompt/DBOS/cache？

## Authority

- 谁拥有 canonical truth？
- Model/tool/client 是否仍只是 proposal/request？
- 是否绕过 owning domain/Subject commit 或 SystemAction？
- Subject/System 是否发生隐式越权？
- Handoff 是否在 target Authority 重新 authorize？

## Bootstrap / Recovery

- Does a previous revision remain evidence only, or can it incorrectly regain Authority?
- Does recovery depend only on required lifecycle roots?
- Can normal boot bypass an incomplete durable obligation?
- Is a process-generation reclaim decision based on positive proof or ambiguity?

- stable Bootstrap Closure 是否物理独立于 replaceable ProductGeneration？
- pre-PG bootstrap lock → PostgreSQL Host lease 是否无 ownership gap？
- PostgreSQL 不可用时是否仍有 BootstrapJournal/Early Observability？
- 首管理员是否只通过 local one-shot claim ceremony 创建，且无 default password/remote unauth claim？
- BootstrapKeyProvider 是否与 normal SecretService 分离，避免启动环？
- normal Host 是否使用 least-privilege PostgreSQL role，而不是 cluster superuser？
- 会替换 normal DB/DBOS substrate 的操作是否切换到 bounded RecoveryOperation/MaintenanceJournal？
- Product Update 是否在 mutation 前声明 DB migration class 和 rollback/restore strategy？
- Recovery 是否保持 bounded、fixed、AI-independent，而不是第二个 generic runtime/shell？

### Single-Host / Restore Fencing

- 是否只依赖 advisory lease，却允许其他 pooled connection 绕过 lease loss 继续 canonical mutation？
- 所有 canonical mutating transaction 是否自动验证 `HostOwnershipToken`？
- 新 owner 切换 token 是否与旧在途 mutation 形成数据库级顺序？
- external Effect `prepared→dispatching` 是否在当前 ownership fence 下提交？
- destructive restore 是否创建新 `ContinuityEpochId`？
- destructive restore 是否显式处理 `administratorCredentialRestorePolicy`，避免历史 snapshot 静默复活旧 verifier？
- cross-installation restore 是否在 remote Management 暴露前完成 local administrator reset/rebind？
- restore 是否失效 snapshot session/approval/ordinary ManagementOperation，并阻止 consequential durable work 自动重放？
- 是否把“恢复本地 DB”错误理解为“外部世界也回滚”？

### Background Work

- process-memory background task/timer/listener/process 是否属于 `ActivationResourceScope`？
- 需要跨 crash 生存的义务是否使用 WorkItem/typed durable primitive？
- 是否存在 detached fire-and-forget task 无法被 generation retire/shutdown/Lineage 追踪？
- 跨 owner Service/Capability invocation 是否取得 provider `InvocationLease`，使 retirement 先 stop-admission，再 bounded drain/cancel，最后 dispose？

## Repository / Framework Boundary

- stable architecture/domain/public Extension contracts 是否暴露 concrete Fastify/DBOS/Cordis/Kysely/pg/Pino/OTel/Cedar implementation types？
- CLI 是否越过 ManagementClient 直接依赖 repositories/runtime/DBOS/private PostgreSQL internals？
- dependency direction 是否有 TypeScript/Nx/ESLint 或等价机械约束？
- 是否把逻辑 module boundary 错误等同于 workspace/package boundary？

## Runtime

- 这是 Service、Capability、Contribution、Package、MicroSystem 还是 Feature？
- Desired/Actual/Health/Readiness 是否分离？
- lifecycle mechanics 是否可由成熟 substrate 承担？
- framework state 是否泄漏成产品 Authority？
- generation/resource ownership 是否明确？
- Capability 多 Provider 选择是否 deterministic（binding/policy/scope/compatibility/health/preference/stable tie-break），而不是 registration order？
- retired trusted ESM generation 是否只承诺 logical resource retirement，而未虚假承诺 module-code unload？

## Version / Durable Code

- What real retained state/external consumer creates a compatibility obligation?
- `CompatibilityEpoch = PRE_PRODUCTION` 时，是否把历史开发格式误当成必须兼容的生产 contract？
- 在 `PRE_PRODUCTION` 下，当前 shape 变化是否直接重写 canonical V1，并明确声明 clean-state/reset 处理？
- 是否错误地为 repository/development history 新增 V2/V3、legacy reader、upcaster、bridge migration、alias、shim 或 dual digest/format？

- ProductGeneration、DBOS application/durable-code version、Extension PackageGeneration、contract/schema version 是否被明确区分？
- Dynamic Extension 是否错误地注册 raw DBOS workflow 或改变 DBOS applicationVersion？
- WorkItem 是否 pin `ContributionId + PackageGenerationId + payloadVersion`？
- 不兼容 durable workflow code 的 update 是否 drain/block/显式 legacy-worker，而不是偷偷让新代码恢复旧 workflow？

## Async / Time

- 需求是 WorkItem、Signal、Mailbox 还是 Durable Wait？
- 是否无意中建立第二个 scheduler/event bus？
- Signal 是否只作 best-effort wakeup？
- durable payload 是否有 schemaVersion/compatible reader？
- elapsed time 是否使用 monotonic semantics？
- human-local time 是否保留 IANA timezone/origin semantics？

## Network / External Effect

- outbound network requester/purpose/destination/policy 是否明确？
- proxy/TLS/redirect/timeout/response-size/decompression policy 是否存在？
- SDK 是否能接入受控 transport？
- inbound bind/proxy trust/TLS/origin/CSRF/body-limit 是否明确？
- consequential external effect 是否经过 EffectOperation？
- 外部结果是否可能 ambiguous？是否保留 `uncertain`？
- retry 是否有真实 idempotency/reconciliation 依据？

## Resource Pressure

- 是否定义 PressureSnapshot/AdmissionDecision？
- `NORMAL / THROTTLED / SHEDDING / BLOCKED` 是否可表达？
- Recovery/Management/canonical ingress/committed obligations 是否优先于 optional/background work？
- 是否把产品重要性错误编码为单个 queue priority？

## Canonical Serialization / Schema

- 需要稳定 digest 的 JSON 是否使用 versioned RFC 8785/JCS semantics？
- digest 是否包含 purpose/domain separation，而不是跨安全语义复用裸 hash？
- canonical input validation 是否 non-mutating（无 silent coercion/default insertion/removeAdditional）？
- Fastify/transport serializer 是否被错误提升为 schema Authority？
- unsupported/future schema/contract version 是否 explicit reject？

## Data / Lifecycle / Compatibility

- canonical owner 在哪里？
- derived index/cache 是否被误当 truth？
- transaction 是否跨模型/网络/人类等待？
- persisted/cross-generation contract 是否 versioned？
- 若存在真实 retained state/external consumer obligation，reader compatibility/upcast/reject behavior 是否明确；否则 obsolete development shape 是否显式 reject/reset？
- 删除是否区分 tombstone、canonical purge、derived purge、blob purge、Evidence retention、backup fence？
- restore 是否会复活 authoritative-purged data？
- Program/Instance/Config/Data/Secret/Blob/Cache lifecycle roots 是否被错误绑成同一目录/删除动作？
- 是否假设所有 roots 共享共同父目录或同一 volume？
- Extension/Domain owner-native store 是否注册 DataOwner/backup/purge/resource contract？
- Core PostgreSQL 是否被错误当作全系统唯一 storage backend？
- large Blob/operational telemetry/rebuildable indexes 是否被错误塞入 core canonical PostgreSQL？
- Backup 是否枚举 DataOwner/BackupParticipant，而不是只 dump DB/copy DataRoot？

## Crypto / Secrets

- Config 是否只存 `SecretRef`？
- Secret plaintext 是否可能进入 log/trace/Evidence/prompt？
- admin credential、session material、Secret backend key、backup key、TUF root、package trust root 是否分离？
- bootstrap/rotation/revocation/lost-key/headless semantics 是否明确？
- 是否错误使用 plaintext fallback？

## Extension

- metadata 是否执行前可检查？
- package 是否 immutable/dependency-closed？
- trust 是否 Host-assigned？
- PackageGeneration / Instance / Config / Data / Secret / Cache lifecycle 是否分离？
- Extension mutable state 是否通过 scoped StorageWorkspace/DataOwner governance；若使用 ExtensionStateStore，是否只把它当 optional managed convenience，而不是强制 backend？
- owner-native SQLite/TOML/files 是否位于 scoped roots，并注册 backup/purge/retention/usage，而不是 hidden canonical store？
- Configuration migration、ExtensionState migration、durable payload upcast 是否分开？
- durable work 是否 pin ContributionId + PackageGenerationId + payloadVersion？
- CLI contribution 是否只投影 SystemAction metadata/descriptor，执行仍在 Host Authority？
- 是否错误向 CLI process 注入 Extension executable command code？
- Presentation contribution 是否只定义 semantic contract，不强迫 Foundation 选择 Web runtime？

## Execution Lineage / Evidence / Observability

- 每个 meaningful lifecycle、Service/Capability/Contribution、WorkItem、SystemAction、Network/Effect、Package/Recovery boundary 是否有 Activity/ExecutionContext？
- `ActivityId` 是否与 `TraceId/SpanId` 分离？
- caller Package/Generation/MicroSystem/Contribution origin 是否由 Host 注入、不可被 Extension 伪造？
- durable/resume/fan-out/fan-in/supersession 是否使用 causation/link，而不是强行伪装同步 parent-child？
- declared dependency graph 与 observed runtime call graph 是否区分？
- 是否可从 Extension → Contribution/Feature → Service → Capability → Provider → outcome 重建调用链？
- severity / importance / retentionClass / sensitivity 是否正交？
- Telemetry 是否被误当 Evidence/Authority？
- trace sampling/exporter failure 是否不会丢 required Evidence/Audit/retained Activity？
- Secret/password/session/claim plaintext 是否从 log/trace/Activity/Evidence 全面排除？
- PII/sensitivity redaction、metric cardinality、LineageQuery authorization 是否明确？
- Bootstrap/PostgreSQL failure 与 shutdown 是否也可追溯？

## Packaging / Platform

- 这个 dependency 是否有 transitive native/WASM/executable payload？
- 是否进入 ReleaseManifest/SBOM？
- source-less artifact 是否 dependency-closed？
- 一个 OS 的 PASS 是否被错误外推到其他 OS？
- service/headless/private runtime 行为是否真实验证？

## Verification

- 这是 dependency selection、code correctness、semantic correctness、product qualification 还是 research evaluation？
- 当前 claim 需要 L0/L1/L2、unit、real PG、crash、CLI contract、live integration、native platform 还是 exact source-less artifact？
- 当前是否真的有 matching Evidence？
- `NOT_RUN/BLOCKED` 是否被错误写成 PASS？

## Identity / Problem / Bootstrap Metadata

- stable semantic ID、generated UUIDv7 ID、content generation digest、ExternalId 是否分型？
- 是否仍把 UUID timestamp 当作领域时间 Authority？
- API/CLI/runtime 是否使用 stable `Problem` 而非解析异常文本？
- HTTP Problem 是否按 RFC 9457 投影，并能关联 ActivityId？
- active/LKG/bootstrap metadata 是否通过 versioned/digested/crash-safe BootstrapStateStore 提交？
- Secret backup/restore 是否有 portability class，且 BootstrapKeyProvider root 不被跨 installation 复制？
- Extension native closure 是否在 manifest 阶段可静态检查，不执行 runtime code？
- Extension staging 是否拒绝 path traversal/symlink escape/special-file/case-collision，并有 file/byte/depth limits？
- ExtensionState destructive migration 是否考虑仍 pin 旧 generation 的 durable refs？

## Current-tree evolution / PRE_PRODUCTION

- Does any current executable identity encode milestone/PR/session history instead of semantic role?
- Does any reader/writer/parser/alias/fallback preserve a previous project-development shape?
- Is revision identity being mistaken for semantic Authority?
- For every compatibility-like behavior, which declared obligation requires it?
- If no obligation exists, was obsolete behavior removed rather than adapted?
- Is PRE_PRODUCTION migration history a current baseline rather than a chronology of dev corrections?
- Are historical-shape tests phrased as current contract validation rather than archaeology?
- Does every one-time evidence/script/artifact in the current tree still have a current owner and consumer?
- Is the implementation plan decision-complete, or is the executor being asked to choose architecture/scope?
