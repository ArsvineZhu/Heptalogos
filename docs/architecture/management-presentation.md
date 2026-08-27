# 接口、CLI、Web 与 Presentation

## 1. Management Contract 是稳定边界

Foundation 先定义 typed Management Contract，再投影到具体客户端。

```text
Domain / System Service
        ↓
SystemAction / Read Models / Operations
        ↓
Canonical Management Contract
        ├─ ManagementClient
        ├─ CLI
        ├─ HTTP API
        ├─ Operator Assistant tools
        └─ future Web / other Presentation
```

不得让 Fastify route、CLI parser、Web component 或 Operator prompt 成为系统管理语义的定义处。

---

## 2. Host 是 Management Server

正常管理面由 Host 提供，不增加第二个 Control Plane backend Authority。

Management server 暴露：

```text
read models
SystemAction planning/execution
ManagementOperation state
Approval flows
Subject Chat protocol endpoint
Operator service endpoint when enabled
live projection channels
```

Recovery Core 只提供受限、独立的恢复接口。

---

## 3. Fastify 的角色

Fastify 负责：

```text
HTTP routing
request/reply lifecycle
schema hooks
transport plugins
```

不负责：

```text
SystemAction
Policy
Approval
Subject Authority
Data Lifecycle Authority
```

---

## 4. Management Read Models

至少提供：

```text
RuntimeGraph
CapabilityGraph
Readiness Profiles
OperatingMode / Pressure
Subject state
Configuration Surface
Extension/package inventory
SystemAction catalog
ManagementOperations
Approvals
Evidence indexes/refs
Artifacts metadata
Network/endpoint diagnostics
backup/update state
```

read model 可以是 projection，但必须可追溯到 canonical owner。

---

## 5. Management Mutations

所有 mutation：

```text
request
→ normalize/validate
→ SystemChangePlan
→ Authentication / Authorization / Risk
→ Approval when required
→ durable ManagementOperation
→ owning Service
→ verify postconditions
→ Evidence
```

客户端不得直接调用 repository、DBOS、filesystem 或 package directories 作为捷径。

---

## 6. OpenAPI / Typed Client

Network-facing Management Contract 应产生机器可读 schema，优先使用 OpenAPI 表达 HTTP surface。

生成或机械派生的 `ManagementClient` 负责 transport/types mechanics；领域语义仍由 Management Contract 定义。

要求：

```text
one canonical action/read schema
no manually duplicated CLI/Web DTOs
stable error model
operation/approval identifiers
contractVersion
backward-compatibility policy
```

OpenAPI client generator 是 build-time tool，不成为 runtime Authority。

---

## 6.0.1 Management Compatibility Descriptor

Management API 提供固定 read-only compatibility descriptor：

```text
InstanceId
ContinuityEpochId
ProductGeneration
coreContractVersion
supportedClientContractRange
problemSchemaVersion
systemActionCatalogRevision
```

CLI/remote client 在 mutation 前检查 core contract range。客户端不兼容时只允许最小 compatibility/status/recovery guidance reads，并返回 structured `Problem`；不能依赖 HTTP 404/反序列化异常猜测 server 版本。

Dynamic Extension action 的兼容性由每个 `actionVersion + schemaVersion + catalogRevision` 单独决定，不要求重新生成 static ManagementClient。

未认证兼容性探测只暴露建立协议所需的最小版本范围，不暴露 `InstanceId`、完整 ProductGeneration、Extension inventory 等 fingerprint。完整 descriptor 需要正常认证；first-admin local claim flow 使用独立、loopback-only 的 bootstrap contract。

## 6.1 Static Core Contract 与 Dynamic SystemAction Catalog

Foundation 核心资源、固定管理动作和 read models 由 versioned static OpenAPI/Management Contract 描述，并生成强类型 `ManagementClient`。

运行时安装的 Extension 不可能在 CLI build 时已知，因此动态动作使用 `SystemActionCatalog`：

```text
actionId / actionVersion
owner PackageId / PackageGenerationId
input/output JSON Schema
risk/effect/apply mode
help/taxonomy/presentation metadata
availability
```

Static client 提供通用 typed envelope 方法：

```text
listActions()
inspectAction()
planAction(actionId, input)
executeApprovedAction(...)
inspectOperation()
```

安装 Extension 不触发 CLI/client 重新生成。Extension 默认不能向 CLI 进程注入 executable JavaScript command code；CLI 只把 descriptor 投影为帮助、参数/JSON 输入和别名，执行始终发生在 Host Authority 中。

---

## 6.2 Structured Problem Contract

Management Contract 的失败使用 Foundation `Problem`：stable `problemCode/category/retryClass` + optional `activityId/resourceRef/fieldErrors`。HTTP 投影使用 RFC 9457 `application/problem+json`；CLI machine mode投影同一语义。

Human error message、HTTP status、CLI exit code 都不是领域错误 identity。客户端需要深层原因时通过 `activityId` 查询 Execution Lineage/Evidence，而不是解析日志文本。

## 7. CLI 是完整 Reference Management Client

Foundation 的管理能力必须先在 CLI 上完整可用。

正常路径：

```text
CLI
→ ManagementClient
→ canonical Management HTTP API on loopback by default
→ System Authority
```

恢复路径：

```text
CLI recovery commands
→ bounded Recovery Core
```

CLI 不直接修改 DB/files/config package 作为隐藏后门。

### 7.1 Coverage Principle

每个 administratively meaningful Foundation resource/action 必须可以从 CLI：

```text
inspect
list/query
configure when applicable
plan mutation
execute/approve/deny/cancel when applicable
observe long-running operation
diagnose failure
export structured result
```

CLI coverage 是 Management Contract 完整性的 reference check。

### 7.2 Command Families

具体命名可以在实现阶段规范化，但 Foundation 至少需要覆盖这些语义族：

```text
status / doctor
system / runtime / readiness / mode
subject lifecycle
component / service / capability inspection
extension package / generation lifecycle
configuration definitions/sources/revisions/activation/export/reload
path profile / lifecycle roots
storage owners / usage / verification / cache purge
secret metadata/set/rotate/revoke flows
management operations
approvals
backup / restore
product update
network / endpoint diagnostics
evidence / diagnostics
contract/schema introspection
completion / help
```

Extension 可以贡献 CLI commands/actions，但 contribution 仍由 Heptalogos Package/Runtime Authority 管理，不使用 CLI framework 自己的插件系统作为第二套 package authority。

### 7.3 Machine Interface

CLI 必须同时支持 human-readable 与 machine-stable mode。

要求：

```text
stable JSON/structured output
stable exit codes
stdout = requested result
stderr = diagnostics/progress unless structured contract says otherwise
non-interactive operation
stdin-compatible secret/input flow where safe
no ANSI requirement for automation
```

交互式提示不能是唯一操作方式。

### 7.3.1 Complex Input Contract

任何 Management/SystemAction/Configuration schema 都必须有不依赖 shell quoting 的 canonical CLI 输入路径：

```text
--input-json <file>
stdin JSON document
or equivalent structured stream
```

简单 scalar/enum 可以额外投影为 ergonomic flags；object/list/union/recursive structure 不要求全部扁平化为 flags。Secret plaintext 不通过 JSON file/argv；使用 SecretRef 或受保护 prompt/stdin delivery path。

### 7.3.2 Machine Output Envelope

一次性 machine mode 输出一个 versioned `CliResultEnvelope`：

```text
schemaVersion
command/contractVersion
ok
result? | problem?
activityId?
operationId?
```

持续 watch/stream 使用 versioned NDJSON `CliStreamEvent`，每行独立可解析并带 sequence/type/activity/operation refs；不能在 stdout 混入 human progress 文本。Human mode progress/diagnostics 使用 stderr。

### 7.4 Cross-platform Shell Semantics

必须验证：

```text
PowerShell
cmd.exe
bash/zsh/sh-family invocation
quoting
Unicode
paths
stdin/stdout encoding
signals/cancellation
```

---

## 7.5 CLI Authentication

Normal CLI 也是普通 Management principal client，不因本机执行而自动获得 System Authority。

交互式登录：

```text
heptalogos auth login
→ username + password from secure TTY/stdin prompt
→ canonical Management auth endpoint
→ opaque server-side session token
```

禁止 password/session token 出现在 argv、shell history、普通 environment、log、Activity/Evidence。

跨命令 session persistence 只有在 qualified OS-protected client credential store 可用时才允许；无安全 backend 时 fail closed，要求重新认证或显式受保护的 stdin/file-descriptor credential path，不落明文 token cache。

Headless automation 使用专门的 non-interactive credential mechanism，并服从相同 Policy/session/revocation/audit；不能以“localhost”作为认证替代品。

`recentAuth` 要求的高风险动作必须触发显式 re-authentication。Recovery CLI 使用 `LOCAL_INSTALLATION_OWNER` 的本地 OS/ACL boundary 作为默认 RecoveryPrincipal，不复用 normal Host session 作为唯一恢复凭据；额外 recovery credential 可以加强但不能制造 DB-dependent recovery loop。

## 8. Subject Chat 与 Operator API 分离

```text
SubjectChatClient
→ Subject Chat Protocol
→ Subject Authority

OperatorClient
→ Operator Service
→ System Authority
```

不能用一个 chat endpoint 的 `mode` flag 切换 Authority。

AuthorityHandoff 是显式领域对象。

---

## 8.1 Normal CLI Transport 与 Recovery CLI

Foundation 第一阶段不创建第二套 local IPC protocol。

```text
normal CLI
→ same canonical HTTP Management API
→ loopback-only listener by default

remote CLI
→ same API
→ explicit remote exposure + TLS/auth/policy

recovery CLI
→ bounded Bootstrap/Recovery interface
→ only fixed recovery verbs
```

若以后有明确产品证据要求 Unix socket/named pipe，可作为 transport projection 增加，但不能产生新的 Management semantics。

---

## 9. Live Projection

SSE 或等价机制可以承担：

```text
runtime/readiness changes
operation progress
approval updates
Subject Chat messages
activity notifications
```

但 live channel 只作 projection/hint。

```text
reconnect
→ re-query canonical read model
```

客户端不能把“是否收到 live event”当产品真相。

---

## 10. Authentication / Session / Endpoint Security

Normal Management HTTP 使用 server-side opaque session：

```text
high-entropy bearer token in secure cookie/client store
→ server hashes token
→ PostgreSQL session row
→ principal/authEpoch/expiry/recentAuth/revocation
```

首个管理员通过 local one-shot claim ceremony 建立，不存在默认密码或远程未认证 onboarding endpoint。

Endpoint 默认只绑定 loopback。Remote exposure 必须显式配置，并进入 Network/Management Endpoint Security policy：TLS、Host/origin/CSRF、rate/admission、body limits、auth freshness、redaction 与 audit/lineage。

Session token、password、claim secret 永不进入日志、Activity attribute、Evidence 或 Operator context。

## 11. Web / GUI 的 Foundation 边界

Web UI 的视觉、页面结构、交互细节、renderer 和 frontend runtime **不属于 Foundation 实现范围**。

Foundation 只冻结未来 Presentation 所需的 semantic contracts：

```text
ManagementClient
Subject Chat Protocol
Operator API
read models
SystemAction metadata
Configuration projections
operation/approval streams
PresentationIntent
Web/Presentation contribution descriptors
CSP/security requirements
```

Web 设计与实现应在独立 Presentation 工作流中进行，不能阻塞 Foundation 完成，也不能反向改变 Authority。

---

## 12. Configuration Projection

Configuration Foundation 冻结：

```text
JSON Schema 2020-12
Heptalogos annotations
current/pending revision
validation diagnostics
visibility/manageability
activation impact
platform/deployment applicability
```

CLI 必须能够完整消费受权 projection。

未来 Web/GUI 可以选择任意 renderer/custom design，只要不改变 canonical Configuration contract。

Foundation 不选择或实现具体 Web form renderer。

---

## 13. Presentation Contributions

Extension 可以声明 semantic Presentation contributions，例如：

```text
navigation intent descriptor
resource detail panel descriptor
action affordance descriptor
custom Presentation bundle metadata
```

Foundation 只定义 contribution schema、ownership、generation、permissions 和 ManagementClient boundary。

具体 Web bundle loader/microfrontend framework 不在 Foundation dependency selection 中。

自定义 Presentation code 也只能通过受权客户端：

```text
query Management Contract
request SystemAction
use Subject Chat Protocol
emit PresentationIntent
```

不能直接：

```text
read local filesystem
connect canonical DB
read Secret plaintext
bypass Policy/Approval
mutate runtime graph
```
