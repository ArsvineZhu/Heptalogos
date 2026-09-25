# Subject 与主动性

## Subject

Subject 是跨模型、会话、平台、运行代次和 Host 重启持续存在的逻辑主体。Heptalogos 与 Nous Wave 使用同一 SubjectId。

Heptalogos 维护行为侧 Subject 状态；Nous Wave 维护长期认知状态。

## ConversationMailbox

ConversationMailbox 组织当前会话中待处理的 canonical MessageFact 引用、消息修订和开放 Reaction。消息内容的事实 Authority 仍由 MessagingService 持有。

## Reaction

Reaction 表示对一个当前情境进行的有界处理。它可以读取上下文、调用模型或能力、等待新的材料、被更新输入取代、保持沉默或产生行为提案。

Reaction 状态与 durable workflow engine 的内部 checkpoint 分开。

## Pursuit

Pursuit 表示 Heptalogos 已经采纳并准备跨时间持续投入行为资源的追求。它引用 Nous Wave 中一个期望条件的精确修订。

Pursuit 是目标设计中的行为对象。当前仓库在形成对应 Plan 和 Spec 前不把它当作已实现能力。

期望条件变化会触发 Pursuit 重新核验；已经发生的行为提交、承诺和外部效果保持历史真实性。

## 行为权威链

当前行为链围绕 BehaviorIntent、Review 和 DecisionCommit 形成明确提交。REPLY 决定随后产生 CommunicationCommit 和表达；外部 consequential action 进入 ActionPlan/EffectOperation。

Pursuit 可以产生新的 CognitiveOpportunity 并影响后续 Reaction，但不能绕过 Review、DecisionCommit 和 EffectOperation。

## Context

ContextProjection 是一次处理所需的有界投影。消息事实、当前产品约束、能力状态和 Nous Wave 提供的认知 facet 经过权限、范围、时效和预算处理后进入模型调用。

Context 不是长期 Subject 状态。

## Silence

沉默具有正式行为语义。已审议后沉默、政策抑制、暂时无法回应和等待进一步输入分别表示。
