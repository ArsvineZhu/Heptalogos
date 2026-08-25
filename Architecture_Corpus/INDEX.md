# 文档索引

本索引描述当前 Architecture Corpus 的规范性结构。阅读时应以项目宪法、工程宪法和 repository root `AGENTS.md` 为最高持续约束；详细规格不得扩大 Foundation 范围，也不得覆盖上层 Authority 与不变量。

## 核心阅读

| 文件 | 内容 |
|---|---|
| [`00-项目宪法与工程宪法.md`](00-项目宪法与工程宪法.md) | 项目宪法、工程宪法、原则优先级与架构约束 |
| repository root `AGENTS.md` | 给代码 Agent 的持续实现约束；Corpus-local duplicate projection is intentionally absent |
| `README.md` | Corpus 定位、阅读顺序、Foundation 边界与证据化依赖决策方法 |
| [`01-产品目标与差异化.md`](01-产品目标与差异化.md) | 项目研究目标与区别于 chatbot/agent 的核心特征 |
| [`02-架构原则与反NIH约束.md`](02-架构原则与反NIH约束.md) | Library-first、adapter-first、依赖决策和自研批准条件 |
| [`03-核心概念与Authority.md`](03-核心概念与Authority.md) | Subject、MicroSystem、Service、Capability、Authority |
| [`04-总体系统架构.md`](04-总体系统架构.md) | Role/Layer 与 Plane 两套系统视图 |
| [`05-整机执行模型.md`](05-整机执行模型.md) | boot、reconcile、failure、pressure、maintenance、shutdown |
| [`06-MicroSystem与Extension架构.md`](06-MicroSystem与Extension架构.md) | Extension Runtime、Package、Generation、Execution Domain |
| [`07-Foundation系统服务目录.md`](07-Foundation系统服务目录.md) | Foundation 服务合同、横切责任与高级子系统保留接入点 |
| [`08-Subject与认知系统.md`](08-Subject与认知系统.md) | Subject、Reaction、Context、Prompt、行为提交链与高级认知接入边界 |
| [`09-Messaging与Subject-Chat.md`](09-Messaging与Subject-Chat.md) | IM domain、Subject Chat、Driver、协议复用与 Effect |
| [`10-AI-Runtime-Capability-MCP.md`](10-AI-Runtime-Capability-MCP.md) | AI Runtime、ModelProfile、Capability、现代 MCP 协议边界 |
| [`11-System-Authority与Operator-Assistant.md`](11-System-Authority与Operator-Assistant.md) | Management Action、Policy、Approval、Operator、认证边界 |
| [`12-数据-证据-内容与持久化.md`](12-数据-证据-内容与持久化.md) | PostgreSQL、durable state、Evidence、CAS、数据生命周期与可观测性治理 |
| [`13-备份-Subject可移植性-更新与恢复.md`](13-备份-Subject可移植性-更新与恢复.md) | Backup、Subject Bundle、数据清除、信任根、产品更新与恢复 |
| [`14-跨平台产品运行与分发.md`](14-跨平台产品运行与分发.md) | private runtime、source-less、native dependency closure、OS service |
| [`15-技术与依赖决策账本.md`](15-技术与依赖决策账本.md) | 依赖角色决策、实现资格状态与当前技术责任边界 |
| [`16-验证与资格认定体系.md`](16-验证与资格认定体系.md) | correctness、依赖选型证据、product qualification 与 release evidence |
| [`17-高级研究子系统接入地图.md`](17-高级研究子系统接入地图.md) | 高级认知子系统未来接入合同；不构成 Foundation 实现义务 |
| [`18-接口-CLI-Web与Presentation.md`](18-接口-CLI-Web与Presentation.md) | Canonical Management Contract、完整 CLI、HTTP/API 与 Presentation 边界 |
| [`19-术语表.md`](19-术语表.md) | 核心术语与状态词汇 |
| [`20-架构审查清单.md`](20-架构审查清单.md) | 后续架构与依赖决策审查规则 |
| [`21-配置治理与Configuration-Surface.md`](21-配置治理与Configuration-Surface.md) | Configure First、类型、visibility/manageability、activation、consumer 与配置审计 |
| [`22-Execution-Lineage与可观测执行.md`](22-Execution-Lineage与可观测执行.md) | Activity、ExecutionContext、因果血缘、自动 instrumentation、查询与 telemetry/Evidence 映射 |
| [`23-存储拓扑-生命周期根与DataOwner.md`](23-存储拓扑-生命周期根与DataOwner.md) | 生命周期根、PathProfile、Storage Workspace、配置载体、DataOwner、多存储后端与 Backup Participant |
| [`24-依赖使用与实现路由.md`](24-依赖使用与实现路由.md) | 已采用依赖的强制实现路由、adapter/import 边界与 Agent 使用规则 |
| [`25-TypeScript与仓库工具链.md`](25-TypeScript与仓库工具链.md) | TypeScript 7 主编译器、TS6 API compatibility lane、ESNext/NodeNext、Node types、版本与 prerelease 采用规则 |
| [`26-开发阶段闭包-稳定化与兼容性治理.md`](26-开发阶段闭包-稳定化与兼容性治理.md) | H-stage stabilization、PRE_PRODUCTION canonical-only / no historical development compatibility boundary、候选闭环与 H1/H2 阶段治理 |

## 详细规格

`specs/`：

- [`specs/S01-启动-恢复-运行时监督.md`](specs/S01-启动-恢复-运行时监督.md)
- [`specs/S02-异步-WorkQueue-Durable-Time.md`](specs/S02-异步-WorkQueue-Durable-Time.md)
- [`specs/S03-持久化-事务-EffectFence.md`](specs/S03-持久化-事务-EffectFence.md)
- [`specs/S04-配置-Secret-管理Surface.md`](specs/S04-配置-Secret-管理Surface.md)
- [`specs/S05-Policy-Approval-Management-Operator.md`](specs/S05-Policy-Approval-Management-Operator.md)
- [`specs/S06-Extension-Package-Trust-ExecutionDomain.md`](specs/S06-Extension-Package-Trust-ExecutionDomain.md)
- [`specs/S07-Messaging-SubjectChat-Drivers.md`](specs/S07-Messaging-SubjectChat-Drivers.md)
- [`specs/S08-AI-Capability-MCP.md`](specs/S08-AI-Capability-MCP.md)
- [`specs/S09-Reactor-Context-Prompt与高级认知接入.md`](specs/S09-Reactor-Context-Prompt与高级认知接入.md)
- [`specs/S10-Evidence-Replay-Observability-Content.md`](specs/S10-Evidence-Replay-Observability-Content.md)
- [`specs/S11-备份-更新-分发-平台.md`](specs/S11-备份-更新-分发-平台.md)
- [`specs/S12-验证-Research-Evaluation.md`](specs/S12-验证-Research-Evaluation.md)
- [`specs/S13-Foundation-Service-Capability-Readiness-Catalog.md`](specs/S13-Foundation-Service-Capability-Readiness-Catalog.md)
- [`specs/S14-Canonical-End-to-End-Flows.md`](specs/S14-Canonical-End-to-End-Flows.md)
- [`specs/S15-Foundation横切合同.md`](specs/S15-Foundation横切合同.md)
- [`specs/S16-Execution-Lineage-Observability.md`](specs/S16-Execution-Lineage-Observability.md)
- [`specs/S17-Storage-Workspace-DataLifecycle.md`](specs/S17-Storage-Workspace-DataLifecycle.md)

详细规格描述具体合同和执行语义，但必须服从顶层 Scope Guard：高级认知只保留接入点；Web/GUI 实现不属于 Foundation；管理能力必须首先由 Canonical Management Contract 与完整 CLI 表达。

## 依赖资格认定

`qualification/`：

- `qualification/DEPENDENCY-QUALIFICATION.md`：当前已冻结 dependency roles、证据层级、实现期资格与 reopening/停止规则。
- `qualification/依赖资格矩阵.md`：已冻结 Foundation routes、剩余 implementation qualification 与 deferred roles。
- `qualification/验证结果模板.md`：L0/L1/L2 依赖选型证据与后续 L3 产品资格结果的统一记录格式。
- `qualification/dependency-status.json`：依赖状态的机器可读 Authority。
- `qualification/results/README.md`：当前 Q/C 证据结果入口。
- `qualification/results/qualification-status.json`：逐项 Q/C property ledger、pre-implementation decision closure 与 implementation/product deferred properties。

依赖治理的一般证据流程遵循（当前 Foundation provider selection 已关闭）：

```text
L0 direct evidence
→ L1 minimal property probe only if needed
→ L2 minimal boundary probe only if needed
→ Architecture Selection
→ implementation
→ L3 exact product qualification
```

不得通过实现接近真实产品规模的子系统来决定 generic dependency 是否适用。

## 参考与实现资格边界

`references/`：

- `references/Foundation依赖证据基线-2026-08-20.md`：当前 Foundation 依赖角色的外部证据基线。
- `references/延期与实现期资格.md`：明确 DEFERRED 的角色与 ADOPTED route 尚需完成的 implementation/L3 qualification。
- `references/constitution.json`：项目与工程宪法的机器可读投影。
- `references/configuration-governance.json`：配置治理不变量、source/backing 分类和管理投影规则。
- `references/storage-governance.json`：生命周期 root、存储治理、配置 source 和 Backup strategy 的机器可读投影。
- `references/dependency-routing.json`：Foundation 已采用 mechanics 的机器可读实现路由；`ADOPTED` 角色必须按此使用。

## Scope Guard

当前 Foundation 不研究或实现高级 Persona、Memory、Relationship、Attention、Living State、Appraisal、Epistemic State、Commitments、Proactive Behavior、Reflection、Diary、Dream 等认知子系统内部机制。Foundation 只保留它们未来所需的稳定 Service / Capability / Contribution、配置、生命周期、readiness、Evidence/provenance 与 Authority ceiling 接入合同。 高级子系统可以选择自己的 storage backend，但必须通过 StorageWorkspace/DataOwner/Backup/Purge/Portability/Lineage 合同接入 Foundation lifecycle governance；Foundation 不冻结其内部数据库或索引实现。

Foundation 不以 Web/GUI 的视觉、页面组织、表单 renderer、microfrontend 或具体前端 runtime 为完成条件。Web-facing HTTP/API 和 Presentation semantic contracts 可以在 Foundation 中冻结；界面实现独立设计。

CLI 是 Canonical Management Contract 的完整 reference client。任何 administratively meaningful Foundation capability 都必须能够通过 Management Contract 被检查和操作，并由 CLI 提供完整覆盖。
