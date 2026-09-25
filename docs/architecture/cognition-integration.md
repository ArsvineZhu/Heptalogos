# 规划中的 Nous Wave 认知接入

本页描述目标认知接入边界，不代表当前代码已具备相应 Provider、查询或提案能力。

## 当前实现状态

当前 Subject 实现由现有 Reaction/Behavior 合同限定。仓库没有 Nous Wave 客户端、认知查询或 Context contribution 合同、期望条件类型、认知提案/回执合同，也没有 Pursuit Spec 或实现。当前 OpenAI AIRuntime 路由是模型调用能力，不是 Nous Wave 集成。

## 职责

Nous Wave 维护长期认知：Memory、Self、Social Cognition、Motivation 和 Cognitive Runtime。Heptalogos 维护产品运行和主动行为。

两侧共享 SubjectId，并分别维护自己的领域对象、修订和提交序列。

## 读取

Heptalogos 通过稳定认知查询和 Context contribution 获取与当前情境相关的认知。返回结果携带对象身份、修订和必要来源信息，使行为判断能够引用明确的认知状态。

Heptalogos 不复制 Nous Wave 内部对象为自己的 canonical state。

## 提案

Reaction、行为结果或外部观察可以向 Nous Wave 产生类型化认知提案。Nous Wave 对自己的 Memory、Self、Social 和 Motivation 分别核验并提交。

认知系统向 Heptalogos 提供的 Desired Condition 描述主体希望满足的状态。Heptalogos 通过 Pursuit 表示是否已经采纳该期望并持续投入主动行为。

## 结果回传

Decision、Commitment、Action 和 Effect 的结果通过带来源的回执进入认知系统。Nous Wave 根据证据评价期望条件、形成记忆或更新其他认知。

一次行为完成与一个期望条件满足分别判断。

## 可用性

认知系统是独立产品能力。目标设计要求 Heptalogos 根据 Feature Readiness 决定认知系统缺失或降级时哪些行为仍然可用；具体可降级与必须阻塞的行为尚未确定。管理、恢复和机器运维不依赖 Nous Wave 正常运行。

## 设计来源

长期语义见 Architecture-Vault 的 [Heptalogos / Nous Wave 目标设计](https://github.com/Heptalogos-Devs/Architecture-Vault)和[认知与主动性合同](https://github.com/Heptalogos-Devs/Architecture-Vault/blob/main/docs/integration/cognition-agency.md)。实现前需要完成合同、规格和授权 Plan。当前降级问题由 Vault 的 Heptalogos [未决问题](https://github.com/Heptalogos-Devs/Architecture-Vault/blob/main/docs/Heptalogos/OPEN_QUESTIONS.md)记录。
