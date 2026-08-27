# MicroSystem 与 Extension 架构

## 1. Extension System 的定位

Heptalogos 的 Extension System 不是“主程序周围的一圈插件”。

它更像操作系统的统一模块运行环境：

```text
Kernel
→ System Services
→ Domain Engines
→ Features
→ Drivers / Providers
→ Presentation contributions
```

第三方插件只是“origin”的一种。

---

## 2. Runtime 与 Package Manager 分离

```text
Extension Runtime / MicroSystem Runtime
= 组件如何组合、运行、停止、依赖、提供能力

Extension Package Manager
= 外部 artifact 如何 acquire / verify / install / upgrade / retire
```

Kernel 启动 mandatory built-ins 不应依赖 package marketplace/npm install。

---

## 3. MicroSystem 静态描述

应能在不执行 runtime code 的前提下读取：

```text
id
version
role
requires Services
requires/optional Capabilities
provides Services/Capabilities
Contributions
config/source declarations
persistent DataOwner/store declarations
backup/restore/purge classes
permissions request
health declaration
execution-domain request
payload/entrypoint
```

其中：

```text
origin
trustClass
final executionDomain
permission grants
```

由 Host Authority 决定。

Persistent Config/Data ownership metadata 同样 manifest-first。Host 在接受 package/instance metadata 时把 DataOwner/store declarations 持久化到 DataLifecycleRegistry，因此数据生命周期不依赖该 Extension 当前能否启动。

---

## 3.1 Runtime Dependency Contract

Extension 对 Foundation/runtime 的依赖必须声明为版本化 contract，而不是通过 import package name 或 load order 隐含：

```text
ServiceId + ContractVersionRange + required/optional + scope
CapabilityId + ContractVersionRange/feature constraints + required/optional + scope
```

Package artifact dependency、Service dependency、Capability requirement 三者分离。Hard Service graph 不允许 unresolved cycle；多 Provider Capability 由 CapabilityBroker 的 deterministic selection contract 决定。

## 4. 运行期 activation contract

逻辑上：

```text
activate(ctx)
```

`ctx` 只暴露经过授权的：

```text
scoped Service facades
Capability client
Config client / owner-native config status
StorageWorkspace client
DataLifecycle/Backup registrar
Execution Lineage / scoped logger client
Evidence client
optional ExtensionStateStore scoped client
Resource scope
Permissions
AbortSignal
identity/generation
```

绝不提供 root Host object。

---

## 5. Trusted In-process Runtime Mechanics

Trusted in-process lifecycle route 已冻结：

```text
`cordis` active 4.x package line
→ RuntimeSubstrate
```

Runtime dependency graph algorithms 使用：

```text
@dagrejs/graphlib 4.x
→ directed graph / traversal / topsort / cycle mechanics
```

Effect 不作为 application-wide runtime；XState 不作为 global runtime/supervisor。局部使用可独立论证。

Foundation 拥有上层语义：

```text
Desired/Actual
Readiness
Generation
Service/Capability distinction
Reconcile
provider selection
resource ownership
Execution Lineage
```

Cordis 与 Graphlib 只提供 generic mechanics，不得形成第二套 Supervisor/Reconciler/Authority。真实 exact-package、source-less、platform/runtime behavior 由 implementation qualification 验证。

---

## 6. Package 是分发单位

一个 package 可包含：

```text
runtime MicroSystems
Presentation contribution metadata
CLI contributions
schemas
assets
migrations
documentation
```

Package 不等于 MicroSystem。

---

## 6.1 Background execution

MicroSystem/Extension 的 process-memory background work 必须属于 activation resource scope；需要跨 crash 生存的义务必须使用 WorkItem/typed durable primitive。禁止无 ownership 的 detached Promise、裸长期 timer 或 child process。

## 7. Immutable Generation

安装后的代码按 generation 固化：

```text
package-id/
  generations/
    <content-digest>/
```

generation 一旦 verified：

```text
不得就地修改
```

升级 staging 新 generation。

rollback 选择旧 generation。

---

## 8. Production Package 必须 dependency-closed

生产 Extension artifact：

```text
prebuilt
dependency-closed
metadata-first
no install scripts
no build scripts
no prepare
```

target Host 不运行：

```text
npm install
pnpm install
git checkout + build
```

Package acquisition 可以使用 `pacote` 等成熟 npm artifact mechanics，但 Heptalogos 负责 source/trust policy。

---

## 8.1 Safe Package Staging

Acquisition 成功不等于 generation accepted。Host-owned staging 必须检查 path traversal、symlink/hardlink escape、special files、size/file-count/depth limits、Windows reserved paths、跨文件系统 case collisions 与 native/executable closure；通过后才原子发布 immutable generation。

## 9. Contribution 类型

可能包括：

```text
Service Provider
Capability Provider
MessagingDriver
WorkHandler
ContextFacetProvider
PromptBlockProvider
Reviewer
SystemAction
ConfigurationDefinition
CLI Contribution
Presentation Contribution
Migration Contribution
```

Runtime contribution 与 MicroSystem generation 生命周期绑定。

Metadata contribution 可在 runtime 失败时仍被 Management 检查。

---

## 10. Extension Persistent Data 与 Code 分离

```text
package code generation
runtime instance metadata
configuration
persistent data
secrets
cache / derived data
```

这些生命周期相互独立；physical co-location 不改变 ownership。

Disable 不等于 uninstall。

Uninstall 不等于 purge。

Purge 也不应自动删除 Secrets，除非显式高风险 action。

---

## 10.1 Storage Workspace 与 Owner-selected State

Extension 不得把 mutable state 放在 immutable PackageGeneration 中，也不得自己根据 `cwd`/package path 猜跨平台持久目录。

Host 通过 `StorageWorkspaceService` 为 Extension instance 提供独立 lifecycle workspace：

```text
config
data
cache
temp
blobs
backup/migration registration
usage
```

Program/Package、Instance metadata、Configuration、Data、Secret 的生命周期严格分离；disable/uninstall/code generation retire 不自动删除 config/data/Secret。

Extension 可以选择：

```text
Foundation ExtensionStateStore / managed KV-like state
TOML/YAML/JSON/owner-native config files
SQLite / embedded DB / file tree in scoped DataWorkspace
Blob CAS
explicit external/complex DataOwner backend
```

`ExtensionStateStore` 仅是简单 structured durable state 的便利接口：

```text
owner/scope/namespace/key
schemaVersion/revision
JSON-compatible value or ArtifactRef
```

默认 implementation 可以位于 private PostgreSQL，但**使用它不是 Extension canonical state 的强制要求**。

Owner-native canonical store 必须注册 `DataOwnerDescriptor` / lifecycle metadata，使 Host 能协调 backup、restore、purge、retention、portability、resource accounting、migration fence 与 Lineage；禁止的是未注册、越出 scoped roots、绕过系统生命周期治理的 hidden store，而不是 SQLite/TOML/文件本身。

Configuration Surface 与 storage backing 正交。Extension 可以使用 `OWNER_NATIVE` 配置；若需要 CLI/API 字段级管理，再贡献 typed `ConfigurationProjection/ConfigAdapter`。

Migration 必须区分：

```text
Configuration source/schema migration
Owner canonical data migration
Derived index rebuild
Durable payload / Contribution contract upcast
```

Host 管理 ordering、backup/recovery/generation fence；Extension 拥有自己的 domain transform。

详细合同见 `storage-lifecycle.md` 与 `contracts/storage-workspace-data-lifecycle.md`。

## 10.2 WorkHandler Restartability

WorkHandler 是 static durable dispatcher 中的 generation-pinned、restartable attempt。`WorkItemId` 标识 obligation；`dispatchRevision` 生成 deterministic `DispatchAttemptId`。同一 revision 重复调度幂等，需要真正 retry/wakeup 时 canonical WorkItem 递增 revision。DBOS step 中途失败可能重试，因此 handler 所有 canonical mutation 必须由 `WorkItemId + dispatchRevision/owned operation id` fence，外部 effect 走 EffectFence；terminal/stale WorkItem 重入必须返回 stored outcome/no-op。Extension 不获得 raw DBOS workflow registration。Running handler 同时接收 cooperative AbortSignal；cancel/supersede request 只有在证明 consequential work 不再继续后才成为 terminal outcome。

## 11. Durable Work Generation Pin

WorkItem 等 durable semantic work 必须记录 `ContributionId + PackageGenerationId + payloadVersion`。DBOS `applicationVersion` 与 Extension PackageGeneration 是不同版本轴；Extension install/upgrade 不通过动态注册 DBOS workflow 来表达 generation。

旧 generation 只有在：

```text
所有 durable refs terminal / migrated / cancelled
```

后才可物理 purge。

---

## 11.1 State Migration Compatibility Fence

Extension/Domain canonical data migration 必须声明：

```text
BACKWARD_COMPATIBLE | DRAIN_REQUIRED | SHADOW_COPY | RESTORE_REQUIRED
```

仍有 durable work pin 旧 generation 时，只有旧 handler 可读取新 state、保留 compatible shadow state，或旧 durable refs 已 drain/migrate/cancel，才允许 destructive migration。保留旧代码本身不是 compatibility 证明；owner-native SQLite/files/external backend 同样受此 fence。

## 12. Trust 与 Sandbox

```text
signature/provenance != safety
```

如果 code 运行在 Host Node process 中，就必须承认它在 OS/process 层基本可信。

真正 untrusted Extension 需要：

```text
WASM
isolated process
OS sandbox
external protocol boundary
```

而不是仅靠“permission metadata”。

---

## 12.1 Native Product Closure

Manifest 必须静态声明 native addon/shared library/executable/WASM 的 target OS/arch/ABI、Node/N-API compatibility、digest、license/provenance。优先 N-API；非 N-API binary 需要 exact runtime-generation qualification。不得执行 runtime code 才发现 native closure。

## 12.2 Generation physical cleanup

Generation logical retirement 不保证当前 Node process 已卸载 ESM/native code。若 Windows/native handle 或 code-memory lifecycle 阻止删除，状态进入 `PENDING_PHYSICAL_PURGE`，在 maintenance restart/next bootstrap 清理；不得把 filesystem 删除失败反向解释为 generation 仍 active。

## 13. Extension SDK

`@heptalogos/extension-api` 应是 structural contract SDK，而不是第二个 runtime framework。

它可以包含：

```text
manifest types
Service/Capability descriptors and scoped invocation facades
activation contract
Contribution types
config/schema contracts
SystemAction contribution
WorkHandler contribution
StorageWorkspace / DataOwner / optional ExtensionStateStore contracts
ExecutionContext / Activity / scoped logger contract
Presentation/CLI metadata
```

不应暴露：

```text
raw DBOS
raw Fastify
raw Cedar
raw PostgreSQL/Kysely root
private Host classes
```
