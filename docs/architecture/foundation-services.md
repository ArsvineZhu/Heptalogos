# Foundation 服务目录

本页给出当前 Heptalogos Foundation 的实现职责索引。精确合同由 `specs/` 拥有。

## Runtime 与 Kernel

`MicroSystemSupervisor`、`RuntimeReconciler`、Service/Capability Registry、Readiness、Operating Mode、Generation Fence 和 contract compatibility 负责运行组合与代次安全。

## Persistence 与数据生命周期

`PersistenceService` 负责 canonical PostgreSQL transaction 和 Host ownership fence。`StorageWorkspaceService`、`DataLifecycleRegistry` 与 BackupCoordinator 协调 owner workspace、backup、restore、purge、retention、portability 和 resource accounting。

领域所有者继续拥有自己的 schema、query 和 storage engine 选择。

## Time、Durable Work 与 Signal

`TimeService` 提供 wall-clock、monotonic duration、timezone 和 replay time。`WorkQueueService` 与 durable execution mechanics 保存跨 crash 的工作义务。`SignalService` 提供 best-effort 唤醒提示。

## Configuration、Secret 与 Network

`ConfigurationService` 维护 typed configuration 语义与 activation。`SecretService` 解析受控 secret material。`NetworkAccessService` 约束 outbound network；consequential external write 仍使用 EffectOperation。

## Artifact、Evidence 与 Lineage

Artifact/Blob、Evidence 和 Execution Lineage 分别维护语义内容、需要持久保留的证明以及执行因果关系。Telemetry 是这些信息的可观察投影。

## Messaging 与 AI Runtime

`MessagingService` 保存 canonical messaging facts 与协议 Driver 结果。`AIRuntimeService` 管理 Model/Provider binding 和 invocation provenance。CapabilityBroker 协调动态能力的 provider、scope、policy、secret 和调用。

## Subject 与行为

`SubjectService` 保存 SubjectId、运行 Desired/Actual state 和 readiness。Reaction/Behavior contracts 保存行为处理与提交。Pursuit、Commitment 等行为域在相应 Plan/Spec 获得实现授权后接入这些基础服务。

## Planned Cognition Integration

当前 Foundation 没有 Nous Wave Provider、认知查询或 Context contribution 合同、typed proposal/receipt 接口、期望条件对象或 Pursuit 实现。形成集成前，需先通过 Plan/Spec 定义产品边界。

目标集成应使用通用 Service/Capability、Context、Evidence、lifecycle 和 SubjectId 机制。Memory、Self、Social Cognition、Motivation、认知查询和检索算法的内部 ontology 与 storage schema 由 Nous Wave 拥有，Foundation 不为它们建立专用领域模型。接口方向见[规划中的认知接入边界](cognition-integration.md)。

## Management 与 Extensions

SystemAction/Management Contract 维护产品管理语义。Extension Package Manager、Runtime 和 registry 负责不可变 package generation、MicroSystems、Services、Capabilities 和 Contributions 的生命周期。
