# 核心概念与 Authority

## 核心身份

`SubjectId` 表示跨模型、进程、会话和 Nous Wave / Heptalogos 的逻辑主体身份。

Heptalogos 的行为状态与 Nous Wave 的认知状态分别由各自领域拥有。共享 SubjectId 不产生共享可变对象。

## 主要对象

- `Reaction`：一次当前情境的有界处理状态。
- `Pursuit`：目标行为对象，表示行为侧对某个 Nous Wave 期望条件形成的持续主动追求；当前没有 Spec 或实现。
- `BehaviorIntent`：一次行为决策中的提案。
- `DecisionCommit`：Subject 正式接受的行为决定。
- `CommunicationCommit`：已经决定对外表达的语义承诺。
- `Commitment` / `Obligation`：Subject 已经承担的社会或行为约束。
- `EffectOperation`：外部副作用的权威记录和不确定性栅栏。
- `SystemAction`：System Authority 下的管理操作。
- `Activity`：执行血缘中的语义执行单元。

Nous Wave 的 `Desired Condition` 是认知输入。它的存在不创建 Pursuit，也不直接取得行为权限。

## Authority

| 事实                         | Owner                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Subject 逻辑身份和运行状态   | SubjectService / Subject Core                                                                         |
| 长期认知                     | Nous Wave 相应认知领域                                                                                |
| 当前 Reaction/行为决定       | Heptalogos Subject behavior contracts                                                                 |
| 目标 Pursuit、行动计划和承诺 | Heptalogos owns these target behavior domains; Pursuit/Commitment have no current Spec/implementation |
| Canonical MessageFact        | MessagingService                                                                                      |
| WorkItem                     | WorkQueueService                                                                                      |
| 外部效果结果                 | EffectOperation owner                                                                                 |
| 产品管理操作                 | Heptalogos System Authority                                                                           |
| 机器与部署修复               | Machine Operations Plane                                                                              |
| 执行血缘                     | ExecutionLineageService                                                                               |

模型输出、检索结果、认知查询和扩展推断默认提供信息或提案。拥有者通过正式提交形成产品权威状态。

## 不可混淆的概念

Subject 与 Model、Prompt、Conversation、Host 分离；Pursuit 与 Desired Condition、BehaviorIntent、ActionPlan、Commitment 分离；WorkQueue Priority 与 Attention 分离；Telemetry 与 Evidence 分离；Service 与 Capability 分离；Package 与 MicroSystem 分离；Machine Operations Authority 与 Product System Authority 分离。
