# 核心概念与 Authority

## 核心对象

### Subject

持续存在的认知/社会主体。不是模型、Agent Loop、会话或 Host。

### MicroSystem

受 Runtime Supervisor 管理的运行组件。

### Service

稳定、typed、长生命周期的依赖合同，通常选择一个 provider。

### Capability

当前系统可提供的能力，可有 0..N provider，动态可用。

### Contribution

注册到某个 typed extension point 的贡献。

### Package

安装/分发单位，可包含多个 MicroSystem、Contribution、Schema、CLI/Presentation 资源。

### Driver

将外部协议/系统映射到 Heptalogos 边界。

### Provider

某 Service/Capability 的实现来源。

### Domain Engine

承载 Heptalogos 领域语义的处理系统。

### Feature

将多个能力组合成用户可观察功能。

---

## Authority 映射

| 对象/事实                               | Authority                                                            |
| --------------------------------------- | -------------------------------------------------------------------- |
| Active ProductGeneration                | Bootstrap / Recovery                                                 |
| Current ContinuityEpochId               | Bootstrap / Recovery handoff + canonical instance state              |
| Current HostOwnershipToken              | PostgreSQL HostOwnershipFence under active Host lease                |
| 组件 Desired State                      | PostgreSQL System Authority                                          |
| 组件 Actual State                       | Runtime Supervisor / Reconciler                                      |
| Service provider binding                | Runtime Reconciler                                                   |
| Capability availability                 | Capability Registry                                                  |
| Config Revision/Activation              | ConfigurationService                                                 |
| Secret plaintext                        | SecretService backend                                                |
| Package generation inventory            | Extension Package Manager                                            |
| SubjectId / Subject revision            | Subject Core                                                         |
| Canonical MessageFact                   | MessagingService                                                     |
| WorkItem                                | WorkQueueService                                                     |
| Durable workflow checkpoint             | DBOS                                                                 |
| 高级认知领域状态                        | 对应已安装高级子系统的声明 Authority；未安装时不存在该状态 Authority |
| Model invocation                        | AI Runtime artifact                                                  |
| Current conversation cognition proposal | Reaction-scoped proposal; it has no Authority by itself              |
| Accepted communication semantics        | CommunicationCommit                                                  |
| Future Subject execution intent         | ActionPlan, when a future semantic owner and consumer justify it     |
| External effect truth                   | EffectOperation                                                      |
| System authorization when required      | PolicyService with Cedar mechanics                                   |
| Human confirmation when required        | System Authority and the owning product control                      |
| Execution Activity / causal lineage     | ExecutionLineageService；领域对象自身仍由各 owner 持有 Authority     |
| Durable causal evidence                 | Domain facts + EvidenceService                                       |
| Operational telemetry                   | Pino / OpenTelemetry / OpenInference                                 |
| Portable Subject boundary               | Subject Bundle                                                       |
| Installation recovery                   | Backup / Restore                                                     |

## Current L4 conversation slice

当前 L4 是一个由消息触发的 bounded cognition proof，不是 Subject 的完整行为
本体：

```text
MessageFact
→ ConversationMailbox
→ Reaction
→ bounded conversation cognition proposal
   ├─ NO_COMMUNICATION → local episode completes
   └─ COMMUNICATE(semantic content)
        → deterministic Review
        → CommunicationCommit
        → Expression
        → local outbound MessageFact
```

一个 communication opportunity 可以合法地以 `NO_COMMUNICATION` 完成，不产生
`CommunicationCommit` 或 outbound message。Reaction 固定 conversation 及其
派生 recipient；deterministic Review 接受是否沟通和要传达的 semantic content，
purpose 固定为 `reply`。`CommunicationCommit` 是已经接受的 communication
obligation；`Expression` 只负责其人类可读的语言/社交实现，不能改变 recipient、
material facts、Authority 或 consequential action。

当前切片没有位于 cognition proposal 与 accepted communication 之间的通用
Subject decision state。accepted communication 的 provenance 直接保留在
`CommunicationCommit`；当前切片也不创建通用 ActionPlan/Decision framework。

`CognitiveOpportunity`、`ReactionWorkspace`、`Yield`、`PromptProgram`、
`ActionPlan` 与高级 Observation Window 目前只是保留的未来研究/语义接缝，
不构成当前 L4 的持久状态或运行框架。

---

## Execution Lineage 核心对象

```text
Activity
ExecutionContext
LineageContextRef
ActivityLink
ActivityRecord
```

`Activity` 是一次有意义的 semantic execution boundary；`TraceId/SpanId` 是 telemetry identity，不能替代 `ActivityId`。

```text
ActivityId != TraceId != SpanId
```

同步调用可使用 parent-child；durable/asynchronous flow 必须能表达 causation/link/resume/fan-out/fan-in。

## OpenClaw runtime non-equivalence

Heptalogos 使用 OpenClaw 时必须区分两个不可互换的角色：

```text
Subject OpenClaw Runtime
→ Product-supervised, low-privilege cognition mechanics
→ proposals remain behind Subject/Product Authority

System Assistant / Machine Operations OpenClaw
→ independently operated, higher-privilege machine/deployment maintenance
→ remains usable while Product Host is unhealthy
```

相同软件版本不表示共享 Gateway、agent fleet、state root、credentials、workspace
或 trust domain。角色表、启动/分发和凭据边界由
[Machine Operations Plane](machine-operations.md) 作为当前 canonical owner 维护；
Subject 页面记录其 Product-side runtime boundary。Machine Operations 仍是独立的
高权限运行域，Subject cognition runtime 则是低权限、由 Product Host 管理的另一
个运行域。

## 不可混淆关系

```text
Package != MicroSystem
Package != Contribution
Service != Capability
Capability != AI Tool
Driver != Domain Engine

Subject != Model
Subject != Reactor
Subject != Installation
Subject != System Assistant
Subject != Subject OpenClaw Runtime

System Authority != Machine/Deployment Authority

Workflow State != Subject State
WorkQueue Priority != Attention
Signal != Durable Fact
Telemetry != Evidence
Activity/Lineage != Authority
Tool Call != Permission
Manifest != Trust
Signature != Sandbox
Search Index != Memory Truth
Web State != Product Authority
```

---

## Authority 基本规则

1. 模型输出只能是 proposal。
2. 检索相似度不能直接成为事实 Authority。
3. Extension 可提供 inference，但不能自封 commit authority。
4. System Authority 和 Subject Authority 不可隐式跨越。
5. `AuthorityHandoff` 传递 intent/context，不自动传 Authority。
6. 外部请求发出不等于外部效果已知。
7. Recovery Authority 是独立、缩小、AI-independent 的本地修复能力。
8. Machine/Deployment Authority 位于 normal Heptalogos Product Authority
   之外；Machine Operations Plane 的 OS/deployment action 不自动成为
   Heptalogos canonical fact 或 SystemAction。
