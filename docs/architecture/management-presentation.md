# Management Contract、CLI 与 Presentation

## 1. Management Contract 是 living product boundary

Heptalogos 先定义 typed Management Contract，再投影到具体机器客户端和
外部 Presentation。Management Contract 随真实消费者出现而演进：

```
Domain / System Service
        ↓
canonical Management Contract
        ├─ ManagementClient
        ├─ complete reference CLI
        ├─ HTTP API
        ├─ automation
        ├─ OpenClaw typed tools
        └─ external Presentation repository
```

Fastify route、CLI parser、Web component、OpenClaw prompt 或 Presentation
state 都不能成为管理语义的定义处。语义仍由 Heptalogos canonical
services、System Authority 和相关 Domain owner 持有。

永久目标是：每个已经进入产品的、administratively meaningful capability
都具有相对于当前 capability set 的完整 machine-consumable
normal-management surface。这个目标不要求预先预测所有未来 UI 查询。

## 2. Host 是正常 Management Server

正常 Product Host 提供唯一的 canonical Management Server：

```
Product Host
  └─ Canonical Management Server
       ├─ Read Models
       ├─ SystemAction plan/execute and target-owned progress where needed
       ├─ Management Contract
       ├─ Subject Chat protocol endpoint
       ├─ query / projection / diagnostic surfaces
       └─ live projection channels
```

它覆盖正常产品管理语义，不创建第二个 Control Plane backend Authority。
Bootstrap/Recovery Core 只提供受限、独立的恢复接口。Machine Operations
Plane 是外部独立运行域，不作为 Product Host child process、System
Service 或 Host normal dependency。

## 3. Management Read Models

当前能力进入产品时，Management Contract 需要提供与其对应的可追溯
Read Models，例如：

```
status / health / readiness
RuntimeGraph / CapabilityGraph
OperatingMode / Pressure
Subject state and lifecycle
Configuration Surface
Secret metadata and governed operations
provider/model binding
Extension/package inventory
operation/approval projections when a current capability requires them
Evidence / Execution Lineage
Network / endpoint diagnostics
backup / restore / update state
contract and schema introspection
```

Read Model 是 canonical owner 的 projection。它可以为聚合查询、分页、
filter、live view、诊断或外部 Presentation 提供便利，但不取得被投影
领域的 mutation Authority。

## 4. Management mutations

所有 normal Product Management mutation 遵循同一语义顺序：

```
request
→ normalize / validate
→ SystemChangePlan
→ Authentication / Authorization / Risk
→ Approval when required
→ target-owned or explicitly required durable operation semantics
→ owning Service
→ verify postconditions
→ Evidence
```

客户端不得直接调用 repository、DBOS、filesystem、package directory 或
Secret backend 作为捷径。normal Product Management arbitrary shell 不是
该接口的 capability；机器级 shell 与部署修复属于独立 Machine Operations
Plane。

## 5. OpenAPI、ManagementClient 与 contract evolution

Network-facing Management Contract 应以机器可读 schema 表达，HTTP surface
优先使用 OpenAPI。ManagementClient 负责 transport 和 types mechanics；
领域语义仍归 canonical contract。

要求包括：

```
one canonical action/read schema
stable machine-readable Problem model
resource / operation / activity identity
contractVersion and schema identity
client/server negotiation where useful
```

这是一项 living interface。真实 external Presentation、CLI、automation、
OpenClaw integration 或 operations tooling 可以提出新的 Host-owned
projection、aggregate query、resource summary、diagnostic capability、
pagination/filter、Subject Chat capability 或 action metadata。

Presentation 可以推动 Host contract requirement，但不能获取或重新定义
domain Authority。不得为了避免 contract 演进而让 Presentation 在客户端
重建 Host-owned semantics，也不得用 UI-only hidden mutation endpoint、
direct database mutation、unversioned private DTO 或 duplicated business
rules 代替正式 contract。

在 PRE_PRODUCTION 下，current consumers 可以协调地改变 endpoint、schema
或 contract version。开发历史本身不产生 legacy endpoint、deprecated alias、
dual reader、upcaster、compatibility shim 或旧 generated client 的义务；
兼容责任只来自当前 machine-readable compatibility Authority。

### 5.1 Compatibility descriptor

Management API 可提供固定的 read-only compatibility descriptor：

```
InstanceId
ContinuityEpochId
ProductGeneration
coreContractVersion
supportedClientContractRange
problemSchemaVersion
systemActionCatalogRevision
```

CLI 或 remote client 在 mutation 前检查 core contract range。未认证探测
只暴露建立协议所需的最小版本范围；完整 descriptor 需要正常认证。
客户端不兼容时只允许最小的 compatibility/status/recovery guidance reads，
并返回 structured Problem，不能依赖 HTTP 404 或反序列化异常猜测版本。

### 5.2 Static contract 与 dynamic action catalog

核心资源、固定动作和 read models 使用 versioned static
Management Contract。运行时安装的 Extension action 使用
SystemActionCatalog：

```
actionId / actionVersion
owner PackageId / PackageGenerationId
input/output JSON Schema
risk / effect / apply mode
help / taxonomy / presentation metadata
availability
```

静态 client 提供通用的 list/inspect/plan/execute/operation envelope；安装
Extension 不触发 CLI/client 重新生成。Extension 不向 CLI 进程注入
executable command code，执行仍发生在 Host Authority 或其正式 owner 中。

## 6. CLI 是完整 reference client

CLI 是本仓库的 headless first-class product，不是某个 GUI 的附属工具：

```
CLI
→ ManagementClient
→ canonical Management HTTP API on loopback by default
→ Heptalogos System Authority
```

每个 administratively meaningful resource/action 都应能够通过 CLI：

```
inspect
list / query
configure when applicable
plan mutation
execute / approve / deny / cancel when applicable
observe long-running operation
diagnose failure
export structured result
```

CLI coverage 是 Management Contract 完整性的 reference check，但 CLI command
coverage 不等于每个 Presentation-only aggregate/read projection 都需要一个
独立的 ergonomic command。Presentation 可以消费 dense aggregate read model、
multi-resource projection、live UI summary 和 presentation metadata；CLI
可以使用 generic raw/read/query form。

CLI 同时支持 human-readable 与 machine-stable mode：

```
versioned structured output
stable exit semantics
stdout = requested result
stderr = diagnostics / progress
non-interactive operation
stdin-compatible protected input flow
no ANSI requirement for automation
```

复杂 object/list/union schema 使用 input JSON 或等价的 structured stream；
Secret plaintext 不通过 argv、普通 environment 或明文 JSON 文件传递。

## 7. Subject Chat 与 Product Management 分离

Subject Chat 是内建的 Subject Authority 协议，不是 UI 到 Reactor 的
shortcut：

```
SubjectChatClient
→ Subject Chat protocol endpoint / Driver
→ MessagingService
→ canonical MessageFact
→ WorkItem
→ ConversationMailbox
→ Subject Authority
```

管理员在 Subject Chat 中表达系统管理意图时，必须显式进入
AuthorityHandoff；一条 chat endpoint 的 mode flag 不能静默切换
Subject Authority 与 System Authority。

System Assistant 的机器运维 surface 由外部 Machine Operations Plane
承载；它可以在 Host 健康时消费 Management API/CLI，但本仓库不需要
第二个内部 assistant backend。

## 8. Normal transport 与 Recovery transport

正常 CLI 使用与其他 Management client 相同的 canonical HTTP contract：

```
normal CLI
→ loopback-only Management HTTP by default

remote client
→ same API
→ explicit exposure + TLS/auth/policy

recovery CLI
→ bounded Bootstrap / Recovery interface
→ fixed recovery verbs only
```

不因为本机执行就跳过认证、Policy、session、audit 或 lineage。若未来有
明确证据要求 Unix socket 或 named pipe，它只能作为 transport projection
增加，不产生第二套 Management semantics。

## 9. Live projection

SSE 或等价机制可以承载：

```
runtime / readiness changes
operation progress
approval updates
Subject Chat messages
activity notifications
```

Live channel 只是 projection/hint：

```
reconnect
→ re-query canonical Read Model and message/operation state
```

客户端不能把“收到或错过 live event”当作产品真相。

## 10. External Presentation boundary

Browser、Desktop、Electron 和其他 GUI 应用属于外部 Presentation
repository。本仓库不实现它们的 renderer、页面、frontend runtime、GUI
E2E 或 visual assets。

外部 Presentation 是 first-class product consumer，消费：

```
ManagementClient / HTTP contract
Subject Chat protocol
canonical Read Models
SystemAction metadata
operation / approval / activity projections when the current capability owns them
PresentationIntent where the Presentation contract defines it
```

它可以基于真实产品要求推动新的 Host-owned contract 或 projection，但
Presentation state、视觉布局、renderer 和前端框架永远不拥有 Heptalogos
System、Subject、Host、数据库或 Machine Operations Authority。

## 11. System Assistant integration boundary

System Assistant / Maintenance Assistant 是 Heptalogos 的产品标签；
Machine Operations Plane 是其独立高权限运行边界。产品 surface 与
Machine Operations surface 可以共享视觉语言，但应保持 separate
authentication context、session/cookie scope、privileged credentials
和实际可行的 origin/security context。

Heptalogos Host 不默认保存 OpenClaw Gateway/admin token、privileged UI
credential、operator session 或 host-execution credential。OpenClaw typed
tools 是 future integration adapters；它们从 canonical Management
Contract、ManagementClient 或 CLI 派生，而不是创建第二个 domain contract。

## 12. Security and ownership summary

本页的 ownership summary 是：

```
canonical domain/service
→ Management Contract
→ ManagementClient / CLI / HTTP / automation / external Presentation
→ authorized Machine Operations integration
```

所有正常 Product Management mutation 仍由 Heptalogos owner 计划、授权、
执行、验证并记录 Evidence。Machine Operations Plane 可以在 OS/deployment
层执行 break-glass maintenance，但不把这些动作伪装成 normal
SystemAction，也不使 Heptalogos 获得对整个机器的虚构控制权。
