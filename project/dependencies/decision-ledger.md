# 技术与依赖决策账本

本文件是当前依赖决策的人类可读视图。机器可读状态 Authority 为：

```text
project/qualification/dependency-status.json
```

依赖决策使用两个正交维度：

```text
RoleDecision
ImplementationQualification
```

`RoleDecision` 决定架构角色；`ImplementationQualification` 决定具体 package/version/binary 是否已经证明可以进入目标产品。

---

## 1. Foundation 已确定的角色

| 角色                                  | 方案                                                                                                                                                                             | RoleDecision | ImplementationQualification | 边界                                                                                                                                                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----------: | --------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript Runtime                    | Node.js 24 LTS line；exact shipping patch is owned by `package.json` `engines.node`                                                                                              |      ADOPTED |                    REQUIRED | runtime API Authority；具体 release/platform/source-less 由产品资格确认                                                                                                                                     |
| Build/tooling                         | pnpm 11 / Nx 23.x / TypeScript 7.0.x primary + TS6 compiler-API compatibility lane / ESLint 10.x + typescript-eslint 8.x + eslint-plugin-jsdoc + TypeDoc declaration-first route |      ADOPTED |                    REQUIRED | ESNext/NodeNext/ESM-first；source docs lint and generated API reference are repository tooling；exact versions 由 Catalog pin；`C-TOOLCHAIN-01`                                                             |
| Canonical DB                          | PostgreSQL 18 line                                                                                                                                                               |      ADOPTED |                    REQUIRED | private durable authority；按 `PrivatePostgresProfile` 运行                                                                                                                                                 |
| PG Driver                             | `pg`                                                                                                                                                                             |      ADOPTED |                    REQUIRED | connection/transaction/LISTEN-NOTIFY mechanics                                                                                                                                                              |
| Typed SQL                             | Kysely                                                                                                                                                                           |      ADOPTED |                    REQUIRED | typed SQL/transaction/migration mechanics；不拥有 domain model                                                                                                                                              |
| Durable Execution                     | DBOS 4.x line                                                                                                                                                                    |      ADOPTED |                    REQUIRED | workflow/durable wait/recovery mechanics；DBOS code version 与 Extension generation 分离                                                                                                                    |
| SignalService mechanics               | PostgreSQL `LISTEN/NOTIFY`                                                                                                                                                       |      ADOPTED |                    REQUIRED | best-effort wakeup only；Signal 不是 durable fact                                                                                                                                                           |
| WorkQueue mechanics                   | DBOS Queue                                                                                                                                                                       |      ADOPTED |                    REQUIRED | static `dispatchWorkItem(WorkItemId, dispatchRevision)`；WorkItem identity 与 DBOS attempt identity 分离                                                                                                    |
| Trusted in-process lifecycle          | `cordis` active 4.x package line                                                                                                                                                 |      ADOPTED |                    REQUIRED | 只承担 context/service/scope/disposal mechanics；Supervisor/Reconciler/Generation/Readiness 仍由 Heptalogos 拥有                                                                                            |
| Runtime dependency graph              | `@dagrejs/graphlib` 4.x                                                                                                                                                          |      ADOPTED |                NOT_REQUIRED | directed graph/toposort/cycle/traversal mechanics；不拥有 Service/Capability/Reconcile semantics                                                                                                            |
| Local complex state-machine mechanics | XState stable 5.x                                                                                                                                                                |      ADOPTED |                NOT_REQUIRED | implementation-only local FSM adapter；global XState supervisor remains REJECTED_FOR_ROLE                                                                                                                   |
| Canonical JSON identity               | `canonicalize` 4.x + Node `node:crypto` SHA-256；RFC 8785 JCS semantics                                                                                                          |      ADOPTED |                    REQUIRED | `CanonicalJson` adapter；domain-separated digest envelope；`C-SCHEMA-01`                                                                                                                                    |
| Generated Foundation IDs              | RFC 9562 UUIDv7 via maintained `uuid` ESM line                                                                                                                                   |      ADOPTED |                NOT_REQUIRED | Activity/WorkItem/Operation等 generated ID；领域时间仍用显式 Instant                                                                                                                                        |
| HTTP structured errors                | RFC 9457 Problem Details projection                                                                                                                                              |      ADOPTED |                NOT_REQUIRED | Heptalogos `Problem` 是 canonical error；HTTP status/text 不是领域 identity                                                                                                                                 |
| Schema Runtime                        | `typebox` package 1.x + Ajv 8 / JSON Schema 2020-12                                                                                                                              |      ADOPTED |                    REQUIRED | canonical validation non-mutating；Fastify 不拥有 schema semantics                                                                                                                                          |
| HTTP server                           | Fastify 5.x                                                                                                                                                                      |      ADOPTED |                    REQUIRED | Management HTTP mechanics；默认 loopback exposure                                                                                                                                                           |
| HTTP cookies                          | `@fastify/cookie` Fastify-5-compatible line                                                                                                                                      |      ADOPTED |                    REQUIRED | cookie parse/serialize mechanics；Session authority 仍在 PostgreSQL                                                                                                                                         |
| HTTP security headers                 | `@fastify/helmet` Fastify-5-compatible line                                                                                                                                      |      ADOPTED |                    REQUIRED | security-header mechanics；具体 policy 由 Management security profile 决定                                                                                                                                  |
| HTTP admission/rate limit             | `@fastify/rate-limit` Fastify-5-compatible line                                                                                                                                  |      ADOPTED |                    REQUIRED | generic admission mechanics；阈值/风险语义由 Heptalogos 配置和 policy 决定                                                                                                                                  |
| HTTP CSRF                             | `@fastify/csrf-protection` Fastify-5-compatible line                                                                                                                             |      ADOPTED |                    REQUIRED | CSRF mechanics；Origin/Session/Authority semantics 仍归 Heptalogos                                                                                                                                          |
| HTTP SSE                              | `@fastify/sse` Fastify-5-compatible line                                                                                                                                         |      ADOPTED |                    REQUIRED | streaming/heartbeat/Last-Event-ID mechanics；事件语义仍归 Management contract                                                                                                                               |
| Managed outbound HTTP                 | Node/Undici + thin NetworkAccess adapter                                                                                                                                         |      ADOPTED |                    REQUIRED | SDK transport controllability 仍按 provider 资格证明                                                                                                                                                        |
| Static ManagementClient generation    | Hey API                                                                                                                                                                          |      ADOPTED |                    REQUIRED | build-time Core OpenAPI client；dynamic SystemActions 走 catalog                                                                                                                                            |
| CLI framework                         | oclif                                                                                                                                                                            |      ADOPTED |                    REQUIRED | complete reference CLI mechanics；不使用其 plugin authority 管理 Extension                                                                                                                                  |
| HTTP session architecture             | opaque token + PostgreSQL server-side session state                                                                                                                              |      ADOPTED |                    REQUIRED | authEpoch/expiry/revocation/recentAuth；无 client-side auth authority                                                                                                                                       |
| AI SDK                                | AI SDK 7: `ai` 7.0.91 + `@ai-sdk/openai-compatible` 3.0.43 + `@ai-sdk/open-responses` 2.0.38 + `@ai-sdk/provider-utils` 5.0.36                                                   |      ADOPTED |                    REQUIRED | AIRuntime gateway/model/structured-output mechanics for the explicit Chat and Responses protocol boundaries                                                                                                 |
| MCP protocol mechanics                | official MCP TypeScript v2 SDK                                                                                                                                                   |      ADOPTED |                    REQUIRED | transport/protocol revision/discovery mechanics；无产品 Authority                                                                                                                                           |
| Messaging interop                     | direct thin OneBot/Milky anti-corruption adapters                                                                                                                                |      ADOPTED |                    REQUIRED | 复用既定 transport/schema/runtime mechanics；不引入 mandatory Satori runtime                                                                                                                                |
| Authorization model                   | Cedar                                                                                                                                                                            |      ADOPTED |                NOT_REQUIRED | principal/action/resource/context policy model                                                                                                                                                              |
| Cedar runtime binding                 | `@cedar-policy/cedar-wasm`                                                                                                                                                       |      ADOPTED |                    REQUIRED | official thin WASM binding behind `PolicyService`; product qualification covers loading/source-less/fail-closed                                                                                             |
| Password hashing                      | Node `node:crypto` Argon2id (`Node >= 24.7`)                                                                                                                                     |      ADOPTED |                    REQUIRED | 不再引入第三方 Argon2 native binding；exact Node release 资格同时证明该实现                                                                                                                                 |
| npm artifact acquisition              | `pacote`                                                                                                                                                                         |      ADOPTED |                    REQUIRED | fetch/manifest/tarball/integrity mechanics only                                                                                                                                                             |
| Process execution                     | Execa                                                                                                                                                                            |      ADOPTED |                    REQUIRED | bounded subprocess mechanics                                                                                                                                                                                |
| Media type/image/AV                   | `file-type` / `sharp` / FFmpeg                                                                                                                                                   |      ADOPTED |                    REQUIRED | untrusted-media limits 由 Heptalogos 定义                                                                                                                                                                   |
| Update trust                          | TUF model + `tuf-js`                                                                                                                                                             |      ADOPTED |                    REQUIRED | update metadata trust；trust-root lifecycle 由产品定义                                                                                                                                                      |
| Operational telemetry                 | Pino + OpenTelemetry + OpenInference conventions                                                                                                                                 |      ADOPTED |                    REQUIRED | telemetry projection；Execution Lineage/Evidence 由 Heptalogos 拥有                                                                                                                                         |
| Execution context propagation         | Node `AsyncLocalStorage` + OpenTelemetry Context API                                                                                                                             |      ADOPTED |                NOT_REQUIRED | transient in-process propagation；durable lineage 使用显式 `LineageContextRef`                                                                                                                              |
| Scoped filesystem/path primitives     | Node `node:path` + `node:fs/promises`                                                                                                                                            |      ADOPTED |                NOT_REQUIRED | `StorageWorkspaceService`；不向 owner 暴露 platform root composition                                                                                                                                        |
| Atomic file replacement               | `write-file-atomic` 8.x                                                                                                                                                          |      ADOPTED |                    REQUIRED | `AtomicFileStore`/config adapter; bootstrap adds stricter crash-durability mechanics；file adapter conformance 由 `C-STORAGE-FS-01` 覆盖；bootstrap crash/platform behavior 属 implementation qualification |
| Cross-platform file watch             | Chokidar 5.x                                                                                                                                                                     |      ADOPTED |                    REQUIRED | bounded WorkspaceWatch adapter；不用各模块重复规范化 `fs.watch`                                                                                                                                             |
| Bootstrap lock                        | `@bybrave/proper-lockfile2` 5.x package line；exact selection is owned by the pnpm Catalog                                                                                       |      ADOPTED |                    REQUIRED | 仅覆盖 pre-PostgreSQL ownership window；正常 Host Authority 是 PostgreSQL lease + HostOwnershipFence                                                                                                        |
| Bootstrap process liveness            | Node `process.kill(pid, 0)` + `pidusage` 4.x package line；exact selection is owned by the pnpm Catalog                                                                          |      ADOPTED |                    REQUIRED | 仅用于 abandoned bootstrap-owner process-generation 判定；UNKNOWN fail-closed                                                                                                                               |
| Secret backend strategy               | platform-composed OS credential/keyring providers；`@napi-rs/keyring` 为适用 profile 的首选 Node adapter                                                                         |      ADOPTED |                    REQUIRED | `BootstrapKeyProvider != SecretService`；service/headless 可用独立 provider/provisioning；禁止 plaintext fallback                                                                                           |
| Foundation TOML codec                 | `js-toml` 2.x                                                                                                                                                                    |      ADOPTED |                NOT_REQUIRED | first-party `ConfigurationCodec` for bootstrap/declarative TOML；owner-native Extension 可自行选格式                                                                                                        |
| Test mechanics                        | Vitest / fast-check / Playwright / Testcontainers                                                                                                                                |      ADOPTED |                NOT_REQUIRED | claim-specific verification mechanics                                                                                                                                                                       |
| Release evidence                      | Syft / OSV-Scanner                                                                                                                                                               |      ADOPTED |                NOT_REQUIRED | release-time evidence tooling                                                                                                                                                                               |

`REQUIRED` 不表示架构角色未决定，而表示 exact implementation/version/binary closure 在对应产品 claim 前仍需通过 L1/L3 conformance/qualification。

### TypeScript / repository toolchain

Foundation source baseline is:

```text
Node.js 24 LTS
pnpm 11 stable line
Nx 23.x
TypeScript 7.0.x primary compiler
@typescript/typescript6 6.0.x compatibility API lane only
ESLint 10.x + typescript-eslint 8.x
ESM-first
ESNext + NodeNext
@types/node 24.x, aligned with shipping Node major
```

Canonical build/typecheck 使用 TypeScript 7；TS6 只服务于当前仍需要 programmatic compiler API 的工具。`target: ES2022`、TS6-only product typecheck 或全局最新 `@types/node` 不属于当前 Foundation baseline。

Current registry/upstream exact versions are evidence inputs, not eternal architecture facts. Repository Catalog freeze / upgrade MUST refresh registry dist-tags, upstream compatibility, engine/peer constraints and product closure before choosing exact versions. `beta`/`RC`/`0.x` does not by itself disqualify a dependency; choose the latest capable line using maturity and blast-radius evidence, then exact-pin it.

Detailed guidance: `../engineering/repository/toolchain.md`; pre-implementation conformance: `C-TOOLCHAIN-01`.

## 2. Foundation 角色冻结与剩余实现资格

当前 Foundation baseline **没有** `PRIMARY_CANDIDATE` 或 `UNRESOLVED` 依赖角色。Implementation Plan 可以直接依照已冻结 route 开始；缺失的三平台、source-less、service/headless、native/WASM closure、真实协议和 crash/update/restore 证据由 `ImplementationQualification` 表达，不能重新解释成“角色尚未决定”。

### Runtime composition / graph

```text
trusted in-process lifecycle mechanics → `cordis` active 4.x package line
runtime DAG/toposort/cycle mechanics     → `@dagrejs/graphlib` 4.x
```

Cordis 只承担 generic context/service/scope/disposal mechanics；Graphlib 只承担 graph data structure/algorithm mechanics。`MicroSystemSupervisor`、`RuntimeReconciler`、Generation、Desired/Actual、Readiness、provider selection、Execution Lineage 与 resource ownership 仍为 Heptalogos Authority。

### WorkQueue

```text
WorkQueue scheduling → DBOS Queue
boundary             → static dispatchWorkItem(WorkItemId, dispatchRevision)
```

`DBOS applicationVersion != Extension PackageGeneration`；Dynamic Extension 不注册 raw DBOS workflow。真实 crash-after-terminal-commit、restart/source-less 等进入 implementation/product qualification，不再阻塞 provider selection。

### Messaging interop

Foundation 使用 direct thin OneBot/Milky anti-corruption adapters。Canonical Messaging 由 Heptalogos 拥有；transport、schema、lifecycle/reconnect、media 等 generic mechanics 复用既定 Foundation routes。Satori 不作为 mandatory runtime/substrate；未来若需要 Satori protocol Driver，可作为独立 Integration 角色进入，而不能改变 Canonical Messaging Authority。

### Secret backend composition

```text
SecretBackend → platform OS credential/keyring facility composition
preferred Node adapter where applicable → @napi-rs/keyring
service/headless → profile-specific provider or provisioning path
plaintext fallback → forbidden
```

Architecture 冻结的是跨平台 provider contract 与 fail-closed 策略，不声称一个 user-session keyring package 能覆盖所有 deployment profile。真实 Windows/macOS/Linux、desktop/service/headless、native/source-less、lost-key/rotation/recovery 在实现期资格中关闭。

### Policy binding

```text
Cedar model   → ADOPTED
JS/WASM route → @cedar-policy/cedar-wasm
```

`PolicyService` 自己拥有 principal/action/resource/context mapping、fail-closed behavior、diagnostics 与 product semantics；Cedar WASM 只承担 policy evaluation mechanics。

### Bootstrap ownership lock

```text
pre-PostgreSQL lock → @bybrave/proper-lockfile2 5.x package line (exact selection: pnpm Catalog)
normal Host authority → dedicated PostgreSQL advisory lease + HostOwnershipFence + HostOwnershipToken
```

`@bybrave/proper-lockfile2` 不得扩展成第二套长期 ownership system。power-loss、跨平台和 source-less bootstrap 属 implementation qualification。

### Windows service wrapper

Windows SCM wrapper 当前为 `DEFERRED`，不进入 Foundation mandatory Catalog。Windows service packaging 进入 L3 时首先评估 WinSW，并以真实 install/update/service-account/shutdown/recovery/source-less artifact 证据决定 shipping route；不得因为该角色延期而在 Foundation 阶段自研 service wrapper。

## 3. 明确不属于 Foundation 依赖选型的领域

以下技术不属于 Foundation dependency-selection scope：

```text
Memory search/index/vector/reranker
Persona engine/learning
Relationship/Attention/Reflection/Diary/Dream algorithms
Web visual framework
Web schema-form renderer
microfrontend runtime
advanced Presentation runtime
```

Foundation 只保留高级 cognition contracts 与 Web/Presentation semantic interfaces。

---

## 4. Deferred Roles

```text
WASM sandbox runtime
isolated Node extension host
remote/distributed broker
multi-host queue
advanced voice realtime runtime
advanced cognition implementations
advanced Presentation runtime
```

`DEFERRED` 表示 contract 可以存在，但当前 Foundation 不应因为未来可能使用而提前引入依赖。

---

## 5. External product-operation roles

### Recommended external integrations

```text
candidate: NewAPI
ownership: external independent model gateway
```

NewAPI 是当前推荐的 external model gateway/provider aggregation route，不是
Host package、Product Host child process 或 Heptalogos System Service。它的
upstream credentials、channels、routing、database、process 和 update lifecycle
由 operator/外部 service 拥有；Heptalogos 只保存 GatewayProfile 与需要调用该
gateway 的 scoped bearer token。它不是机器可读的 `RoleDecision` 或仓库运行时
依赖；当前资格目标是一条真实 gateway route，且不固定 NewAPI 版本。

### Machine Operations agent runtime

```text
candidate: OpenClaw
RoleDecision: ADOPTED
ImplementationQualification: REQUIRED
ownership: external independent operational runtime
```

OpenClaw 是 Machine Operations Plane 的外部实现路线，不是 Host package、
Product Host child process 或 Heptalogos System Service。它可以按自身及
OS/deployment policy 使用机器级 host execution；Product Host 不因此获得
OpenClaw privileged control credential。当前不随 Heptalogos 下载、打包、
启动或更新。Exact release/commit、独立进程/service 集成、信任与凭据
隔离、许可证和分发闭包必须在首个集成/分发 Plan 中重新验证。

## 6. Rejected for Current Role

### Arbitrary shell in normal Product Management

```text
REJECTED_FOR_ROLE
```

原因：arbitrary shell 不是 normal Product Management capability；将其放入
Host 管理面会绕过 Heptalogos-owned SystemAction / Policy / Approval /
Evidence 语义。机器级 shell 属于独立 Machine Operations Plane，不通过
这个 Product Management role 决定。

### Runtime npm/pnpm install as production Extension install

```text
REJECTED_FOR_ROLE
```

原因：lifecycle scripts、dependency mutation、source-less、recovery 和安全边界不成立。

### Node SEA as whole Host packaging model

```text
REJECTED_FOR_ROLE
```

Heptalogos shipping payload 包含 PostgreSQL、Extension generations、assets 和 native helpers；FFmpeg 是按能力需要由 operator 配置的外部 executable；SEA 不构成完整产品 closure。

### Mandatory Redis/RabbitMQ/NATS/Kafka Foundation broker

```text
REJECTED_FOR_ROLE
```

当前单 Host 产品没有足够需求证明增加独立 broker 的部署/恢复成本。

### LangChain/LangGraph as Subject/Reactor Authority

```text
REJECTED_FOR_ROLE
```

局部研究 Extension 可自行论证使用，但不能替代 Heptalogos Reaction/Decision/Authority contracts。

### Effect as application-wide runtime

```text
REJECTED_FOR_ROLE
```

局部使用允许独立论证。

### XState as global MicroSystem runtime/supervisor

```text
REJECTED_FOR_ROLE
```

稳定版本可用于真正复杂的局部状态机。

### Node Permission Model / `node:vm` as untrusted sandbox

```text
REJECTED_FOR_ROLE
```

它们不构成恶意代码安全边界。

---

## 6. 已采用依赖的实现指导

对于本账本中 `ADOPTED` 的角色，代码实现必须遵守 `implementation-routing.md` 与 `dependency-routing.json`。

```text
ADOPTED
≠ “可以考虑”
= “需要该 role 时默认使用该 route”
```

如果一个 Agent 在已经采用的角色上创建 custom mechanics、引入竞争库或直接使用低层 standard primitive 绕开成熟库，必须同时提供重新 qualification 的证据与依赖 Authority 更新；否则视为架构偏离。

依赖应通过窄 adapter 隔离，因此“必须用库”与“不得让库类型污染领域合同”同时成立。

---

## 7. 依赖选择规则

依赖选择遵循：

```text
prove from direct evidence if possible
→ probe only unresolved property
→ compare thin boundary mapping if needed
→ decide role
→ implement
→ product-qualify exact artifact
```

禁止：

```text
为了判断 Cordis 是否合适先写完整 Driver runtime
为了判断 DBOS Queue 是否合适先写完整 Extension system
为了判断 CLI framework 是否合适先写完整 Management backend
```

Exact package/version selection must be refreshed from current registry/upstream evidence rather than inferred from model memory or stale historical patch numbers. Stable/prerelease labels are inputs to maturity analysis, not automatic accept/reject rules. Detailed toolchain/version policy: `../engineering/repository/toolchain.md`.

资格计划见 `qualification/DEPENDENCY-QUALIFICATION.md`。

## 8. Storage / Configuration Backing Policy

Foundation 不冻结一个 universal Extension/Domain storage engine。Private PostgreSQL 只承担 Foundation transactional authority / DBOS mechanics；`ExtensionStateStore` 是可选 managed convenience。Extension/高级 Domain 可以在 scoped StorageWorkspace 中使用 owner-selected TOML/SQLite/files/embedded/external backend，并通过 DataOwner/Backup/Purge/Resource contracts 接入治理。

因此本账本不会为了 Foundation 预先选择“Memory database”或“Extension SQLite library”作为全局 mandatory dependency。Foundation 自己承诺提供的 TOML codec 已固定使用 `js-toml`；这不限制 Extension/Domain `OWNER_NATIVE` 选择其他配置格式或 parser。

---
