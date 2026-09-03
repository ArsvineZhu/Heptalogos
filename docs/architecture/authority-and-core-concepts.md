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

| 对象/事实                           | Authority                                                            |
| ----------------------------------- | -------------------------------------------------------------------- |
| Active ProductGeneration            | Bootstrap / Recovery                                                 |
| Current ContinuityEpochId           | Bootstrap / Recovery handoff + canonical instance state              |
| Current HostOwnershipToken          | PostgreSQL HostOwnershipFence under active Host lease                |
| 组件 Desired State                  | PostgreSQL System Authority                                          |
| 组件 Actual State                   | Runtime Supervisor / Reconciler                                      |
| Service provider binding            | Runtime Reconciler                                                   |
| Capability availability             | Capability Registry                                                  |
| Config Revision/Activation          | ConfigurationService                                                 |
| Secret plaintext                    | SecretService backend                                                |
| Package generation inventory        | Extension Package Manager                                            |
| SubjectId / Subject revision        | Subject Core                                                         |
| Canonical MessageFact               | MessagingService                                                     |
| WorkItem                            | WorkQueueService                                                     |
| Durable workflow checkpoint         | DBOS                                                                 |
| 高级认知领域状态                    | 对应已安装高级子系统的声明 Authority；未安装时不存在该状态 Authority |
| Model invocation                    | AI Runtime artifact                                                  |
| Subject accepted behavior           | DecisionCommit                                                       |
| Communication semantics             | CommunicationCommit                                                  |
| Subject execution intent            | ActionPlan                                                           |
| External effect truth               | EffectOperation                                                      |
| System authorization when required  | PolicyService with Cedar mechanics                                   |
| Human confirmation when required    | System Authority and the owning product control                      |
| Execution Activity / causal lineage | ExecutionLineageService；领域对象自身仍由各 owner 持有 Authority     |
| Durable causal evidence             | Domain facts + EvidenceService                                       |
| Operational telemetry               | Pino / OpenTelemetry / OpenInference                                 |
| Portable Subject boundary           | Subject Bundle                                                       |
| Installation recovery               | Backup / Restore                                                     |

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
