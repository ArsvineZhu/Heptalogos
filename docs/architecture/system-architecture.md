# 总体系统架构

## 产品宿主

Heptalogos 以无图形界面的 Product Host 承载 Subject 的行为和产品运行。主要运行角色包括 Bootstrap/Recovery、Kernel、System Services、行为领域、Drivers/Providers 和外部 Presentation。

Kernel 维护运行组合、代次、Service/Capability 注册、Readiness、运行模式和资源所有权等产品运行语义。PostgreSQL、durable engine、HTTP、AI SDK 等通用机制通过受控适配器接入。

## 行为领域

Heptalogos 自己维护的 Subject 领域包括 ConversationMailbox、Reaction、Pursuit、BehaviorIntent、Review、DecisionCommit、CommunicationCommit、Interaction/Action、Commitment/Obligation 和 EffectOperation。

其中 Pursuit 表示跨多次 Reaction 延续的主动追求；当前代码在对应 Plan/Spec 落地前仍以已有 Reaction/Behavior slice 为实现事实。

## 认知系统

Nous Wave 维护长期 Memory、Self、Social Cognition、Motivation 和 Cognitive Runtime。Heptalogos 通过认知集成合同获取上下文、认知查询结果和提案，不复制这些领域的数据模型。

SubjectId 在两个系统之间保持一致。行为状态和认知状态拥有独立的修订与提交路径。

## System Services

Foundation 提供持久化、时间、工作义务、信号、配置、密钥、网络访问、Artifact/Evidence、执行血缘、消息、AI Runtime、能力代理和管理等服务。

这些服务提供产品运行机制和治理，不取得业务领域自身的 Authority。

## Presentation 与机器运维

CLI、HTTP 和外部图形界面投影同一 Management Contract。Presentation 不拥有产品真值。

Machine Operations Plane 位于 Product Host 之外，拥有独立机器/deployment 权限和故障域。Host 健康时通过正式 Management Contract 工作；严重故障时执行有限机器级修复。
