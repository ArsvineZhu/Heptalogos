# 核心术语

长期产品术语以 Architecture-Vault 目标设计为准。本页提供当前代码仓库常用实现术语。

**Subject / SubjectId**：跨模型、会话、平台和进程保持逻辑身份的持续主体及其标识。

**Product Host**：承载正常 Heptalogos 产品运行的 headless Host。

**Reaction**：处理一个当前情境的有界 Subject 行为运行状态。

**Desired Condition**：Nous Wave Motivation 目标设计中的期望条件；它本身不表示已决定行动，当前 Heptalogos 代码尚无对应接口或类型。

**Pursuit**：Heptalogos 对某个 Desired Condition 精确修订形成的持续主动追求。当前属于目标设计，待对应 Plan/Spec 实现。

**BehaviorIntent**：一次行为判断中的候选行为提议。

**DecisionCommit**：不可变的 Subject 行为决定提交。

**CommunicationCommit**：已经决定对外表达的语义承诺。

**ActionPlan / InteractionPlan**：目标设计中的外部动作或交互实现计划；当前没有对应的行为 Spec/实现。

**Commitment / Obligation**：目标设计中的 Subject 约束性行为或社会状态；当前没有对应的行为 Spec/实现。

**EffectOperation**：consequential external effect 的权威记录和不确定性栅栏。

**ConversationMailbox**：组织 canonical MessageFact 引用和当前 Reaction 的会话状态。

**CognitiveOpportunity**：目标设计中值得进入 Subject 处理的当前机会；当前没有对应的 Spec/实现。

**ContextProjection**：一次 Reaction 使用的有界上下文投影。

**Service**：稳定、typed、长生命周期的依赖合同。

**Capability**：当前可用的动态能力，可以有多个 Provider。

**MicroSystem**：受 Runtime Supervisor 管理的运行组件。

**PackageGeneration**：不可变软件包代次。

**Driver**：外部协议到 Heptalogos 产品语义的适配实现。

**Provider**：Service 或 Capability 的实现来源。

**WorkItem**：canonical durable processing obligation。

**Activity**：Execution Lineage 中一次有意义的语义执行单元。

**Evidence**：需要持久保留的 typed causal/product record。

**SystemAction**：Heptalogos System Authority 下的管理操作。

**Management Contract**：CLI、HTTP、外部 Presentation 和授权自动化共同投影的管理接口。

**Machine Operations Plane**：位于 Product Host 外部的机器/deployment 运维权限与故障域。

**Desired State / Actual State**：长期运行意图和当前运行事实。

**Readiness**：某种产品能力是否具备可用运行条件。

**Generation Fence**：阻止退休软件代次获得新当前工作或提交当前结果的运行机制。

**DataOwner**：拥有一组 canonical/derived/cache stores 及其 lifecycle contract 的领域所有者。

**Subject Bundle**：迁移 Subject 语义状态的产品级导出；与安装备份分开。
