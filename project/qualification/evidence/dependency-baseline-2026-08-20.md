# Foundation 依赖证据基线（2026-08-20）

本文件记录当前依赖判断所依据的 L0 技术事实与剩余资格边界。正式角色状态以 `project/qualification/dependency-status.json` 为 Authority；编码路由以 `project/dependencies/dependency-routing.json` 为 Authority。

## Runtime / Repository

Current L0 baseline observed on 2026-08-20:

```text
Node.js 24.19.0 LTS
pnpm 11.21.0
Nx 23.1.1
TypeScript 7.0.2
@typescript/typescript6 6.0.2
ESLint 10.8.1
typescript-eslint 8.67.0
@types/node Node-24 line 24.13.3
```

Architecture route:

```text
Node 24 LTS → controlled shipping runtime
pnpm 11 → package/workspace authority
Nx 23.x → workspace/task/project graph
TypeScript 7.0.x → canonical CLI compiler/typecheck/build
@typescript/typescript6 6.0.x → temporary programmatic compiler-API compatibility only
ESLint 10.x + typescript-eslint 8.x → lint/import governance; TS6 API lane while required
ESNext + NodeNext + ESM-first → default source/module baseline
@types/node 24.x → ambient Node API surface aligned to shipping runtime major
```

Microsoft TypeScript and Nx both document the TS7 + TS6 side-by-side model because TS7.0 does not yet expose a stable programmatic compiler API. Nx 23.x supports TypeScript 7 and documents `@typescript/native` + `@typescript/typescript6` aliasing; typescript-eslint 8.x still declares TypeScript `<6.1.0` as its supported compiler-API peer range.

Canonical dependency/type compatibility uses `skipLibCheck=false`. A quick/editor lane may relax this only if it is not used as compatibility evidence.

Node 24 documentation recommends `target=esnext`, `module=nodenext`, `verbatimModuleSyntax=true` for modern TypeScript execution. Foundation compiled packages use the same modern language/module posture; Node-native TypeScript scripts may additionally use `rewriteRelativeImportExtensions` and `erasableSyntaxOnly` when appropriate.

Exact versions are re-read from registry/upstream at Catalog freeze/upgrade and pinned there; this evidence baseline is not permission to guess future patch versions. Prerelease/0.x status is evaluated through maintenance, tests, required capability, churn, blast radius, exact pinning and rollback rather than automatic rejection.

## Cordis

关注角色：trusted in-process service/context/lifecycle mechanics。

Cordis 的 service/context、scope/fork、effect/disposal、dependency reaction 等 generic mechanics 已作为 trusted in-process runtime substrate 采用。当前实现 route 使用活跃的 `cordis` 4.x package line；exact pin 在 Catalog freeze 时重查。Heptalogos 仍拥有 Supervisor/Reconciler/Generation/Desired-Actual/Readiness/Lineage semantics。

## Runtime Graph

`@dagrejs/graphlib` 4.x 承担 directed graph data structure、traversal、topsort 与 cycle mechanics。它不拥有 Service/Capability/Reconcile/Readiness/Generation semantics。当前 registry snapshot 为 4.0.5、零 runtime dependencies；exact pin 仍由 Catalog freeze 决定。

## DBOS

```text
DurableExecution mechanics → ADOPTED
DBOS Queue → WorkQueue mechanics ADOPTED
```

版本轴固定分离：

```text
DBOS applicationVersion != Extension PackageGeneration
```

Dynamic Extension 不注册 raw DBOS workflow。WorkQueue 固定通过 static `dispatchWorkItem(WorkItemId, dispatchRevision)` + Heptalogos generation pin；真实 crash/restart/source-less 行为属于 implementation qualification。

## PostgreSQL / SQL

```text
PostgreSQL 18 → Foundation transactional authority
pg → driver/connection/LISTEN-NOTIFY mechanics
Kysely → typed SQL/transaction/migration mechanics
LISTEN/NOTIFY → best-effort Signal mechanics
```

Signal 可丢失；canonical state/work 必须可 rescan。

## Canonical JSON / Schema

RFC 8785 JCS 的 Node implementation route 使用 `canonicalize` 4.x，并用 Node `node:crypto` 产生 domain-separated SHA-256 digest。该角色不允许自行编写 recursive sort/stringifier；`C-SCHEMA-01` 只跑 JCS vectors 与 Heptalogos envelope conformance。

Canonical schema dialect 为 JSON Schema 2020-12；`typebox` package 1.x + Ajv adapter 必须 non-mutating：不 silent coerce、insert defaults、remove additional fields。Fastify transport 不拥有 canonical schema semantics。

## Fastify / Network

Fastify 5.x 承担 Management HTTP mechanics。Fastify 5 compatible `@fastify/cookie`、`@fastify/helmet`、`@fastify/rate-limit`、`@fastify/csrf-protection`、`@fastify/sse` 分别承担 cookie、安全头、admission、CSRF 与 SSE generic mechanics。Normal Management 默认 loopback-only；这些插件不拥有 Session/Policy/SystemAction/Event semantics。

Outbound HTTP mechanics 使用 Node/Undici + thin `NetworkAccess` adapter；Provider/MCP SDK 仍需通过 `C-NET-01` 证明 transport controllability 或明确 limitation。

## ManagementClient / CLI

```text
Core OpenAPI → Hey API build-time TypeScript client
complete reference CLI → oclif
runtime Extension actions → dynamic SystemActionCatalog
```

这些角色已经采用；L1 只验证 schema/client/CLI projection fidelity，不重开选型。

## Password / Session

Node `node:crypto` 自 Node 24.7 起提供 `argon2/argon2Sync` 并支持 `argon2id`，因此管理员 password hashing 直接使用 Node runtime implementation，不再增加第三方 native Argon2 binding。

HTTP session 使用 opaque high-entropy bearer token + PostgreSQL server-side canonical session state：token digest、principal、authEpoch、expiry、revocation、recentAuth。

## MCP

Official MCP TypeScript v2 SDK 承担 protocol/transport/revision compatibility mechanics。协议 revision 显式建模；产品不把历史 protocol-level session/initialize handshake 当长期 Authority。

## Package / Process / Media / Update

```text
pacote → npm artifact fetch/manifest/tarball/integrity
Execa → bounded subprocess mechanics
file-type → media type detection
sharp → image mechanics
vendored FFmpeg → audio/video mechanics
tuf-js → TUF update-trust mechanics
```

这些依赖只拥有 generic mechanics，不拥有 Extension/Effect/Update 产品 Authority。

## Execution Lineage / Telemetry

```text
Pino → operational logging
OpenTelemetry → traces/metrics/context projection
OpenInference → AI telemetry conventions
Node AsyncLocalStorage + OTel Context → transient in-process ExecutionContext propagation
```

Node 官方把 AsyncLocalStorage 作为 stable、preferred async context mechanism；durable lineage 仍显式携带 `LineageContextRef`，不依赖 transient trace context。

## Storage Workspace / File Mechanics

Foundation 的默认实现路由：

```text
node:path + node:fs/promises → scoped path/file primitives
write-file-atomic 8.x (Node 24.15+ compatible line) → atomic replacement mechanics
Chokidar 5.x → normalized cross-platform bounded watch
js-toml 2.x → Foundation-owned TOML `ConfigurationCodec`
```

`write-file-atomic`/Chokidar 只位于 Foundation adapters 后；Extension `OWNER_NATIVE` 仍可选择自己的 SQLite/YAML/TOML/embedded/external backend。`C-STORAGE-FS-01` 保存 path/atomic/watch adapter evidence；bootstrap 的跨平台 crash/durability 属 implementation qualification。

## Cedar

Cedar policy model与 JavaScript/WASM route 均已采用：`@cedar-policy/cedar-wasm` behind thin `PolicyService` adapter。其 WASM loading、source-less closure 与 exact package compatibility 属 implementation qualification。

## Secret Backend

Architecture 固定：

```text
BootstrapKeyProvider != normal SecretService
no plaintext fallback
platform-specific backend composition allowed
```

SecretBackend 采用 platform-composed OS credential/keyring strategy；适用 profile 首选 `@napi-rs/keyring` Node adapter，service/headless 可使用 platform-specific provider/provisioning path，禁止 plaintext fallback。真实 desktop/headless/service、Windows/macOS/Linux、source-less、rotation/lost-key 属 implementation qualification。

## Bootstrap Lock

Pre-PostgreSQL ownership window 使用 `@bybrave/proper-lockfile2` 5.0.0；它只承担 atomic lock/stale heartbeat mechanics。`proper-lockfile@4.1.2` 的 deterministic delayed-reclaimer race 失败证据保留在 Q-BOOT-01。正常 Host Authority 仍是 PostgreSQL advisory lease + HostOwnershipFence + HostOwnershipToken。真实 power-loss/cross-platform/source-less behavior 属 implementation qualification。

Abandoned bootstrap-owner process generation 使用 Node `process.kill(pid, 0)` +
`pidusage` 4.0.1；Heptalogos owns the four-state result and UNKNOWN fail-closed
policy.

## Sandbox

Node Permission Model 与 `node:vm` 不承担 malicious-code sandbox。WASM sandbox runtime 在该 ExecutionDomain 真正进入实现范围前保持 DEFERRED。

## Identifier / Problem Standards

- Foundation generated identities use RFC 9562 UUIDv7 semantics，通过 maintained `uuid` ESM line 生成/验证；显式 `Instant` 仍是时间 Authority。
- HTTP error projection 使用 RFC 9457 Problem Details；canonical `Problem` 自有 stable `problemCode/retryClass/activityId`，不需要专门 runtime error framework。

## L0 Source Anchors

Primary references for the current implementation routes:

- Node.js 24 runtime / TypeScript execution / built-in crypto / AsyncLocalStorage: `https://nodejs.org/download/release/latest-v24.x/docs/`
- TypeScript 7 release and TS6 compatibility lane: `https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/`
- Nx TS7 + TS6 side-by-side guide: `https://nx.dev/docs/kb/typescript-7`
- typescript-eslint dependency-version policy: `https://typescript-eslint.io/users/dependency-versions/`
- pnpm Catalogs / catalogMode: `https://pnpm.io/catalogs`
- RFC 8785: `https://www.rfc-editor.org/info/rfc8785/`
- `canonicalize`: `https://github.com/erdtman/canonicalize`
- `write-file-atomic`: `https://github.com/npm/write-file-atomic`
- Chokidar: `https://github.com/paulmillr/chokidar`
- `js-toml`: `https://github.com/sunnyadn/js-toml`
- Cordis active package: `https://www.npmjs.com/package/cordis`
- Graphlib: `https://www.npmjs.com/package/@dagrejs/graphlib`
- Cedar WASM: `https://www.npmjs.com/package/@cedar-policy/cedar-wasm`
- proper-lockfile: `https://www.npmjs.com/package/proper-lockfile`
- napi-rs keyring: `https://www.npmjs.com/package/@napi-rs/keyring`
- Fastify official plugins: `https://github.com/fastify/fastify-cookie`, `https://github.com/fastify/fastify-helmet`, `https://github.com/fastify/fastify-rate-limit`, `https://github.com/fastify/csrf-protection`, `https://github.com/fastify/sse`

Version lines in Architecture are responsibility lines, not eternal patch pins. The release/build baseline must pin exact versions and record product qualification evidence.

## Scope Exclusions

当前 Foundation dependency selection 不包含：

```text
Memory/index/retrieval backend
Persona/Relationship/Attention algorithms
Extension owner-native database/codec choices
Web visual framework/schema-form renderer/microfrontend runtime
```
