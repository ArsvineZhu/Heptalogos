# 产品目标与差异化

## 1. 产品命题

Heptalogos 研究的是：

> AI 如何在真实即时通信环境中作为一个持续存在、具有状态、历史、个性、记忆、行为一致性与可控自主性的 Subject 工作。

因此核心问题不是：

```text
如何让模型回答更聪明？
```

而是：

```text
如何让一个 Subject 在时间中持续存在？
如何在多会话、多平台、异步世界中保持一致？
何时应该观察、等待、沉默、回应？
如何让 Memory 有来源、范围和纠错？
如何让 Persona 影响行为但不只是 Prompt？
如何让工具使用不破坏 Authority？
如何让外部副作用面对网络不确定性？
如何让系统自身可管理、可解释、可修复？
```

---

## 2. 与普通 Chatbot 的区别

普通 request/response chatbot 常暗含：

```text
一次请求 = 一次完整上下文
一次调用 = 一次决策
模型输出 = 最终答案
```

Heptalogos 不接受这些假设。

真实 IM 可能发生：

```text
用户连续发三条消息
图片稍后才下载完成
消息被撤回
群里别人先回答了
Subject 正在处理另一个会话
模型调用中途失败
外部发送已经发生但响应丢失
管理员从 Web 私聊同一 Subject
```

所以系统必须以事件、状态和 Authority 为中心。

---

## 3. 与 Generic Agent Framework 的区别

Heptalogos 可以使用 Agent/Workflow/Actor 类库，但不把 Generic Agent Loop 当成产品核心。

项目核心语义包括：

```text
ConversationMailbox
CognitiveOpportunity
Reaction
Yield
Supersession
DeliberatedAndSilent
BehaviorIntent
Review
DecisionCommit
CommunicationCommit
InteractionPlan
EffectOperation
AuthorityHandoff
```

这些对象表达的是持续 Subject 的认知与行为，而不是“工具循环跑到 stop”。

---

## 4. State > Prompt

重要原则：

```text
Persona
Memory
Governance
Relationship
Living State
Epistemic State
Commitments
```

都是显式持久状态或正式领域合同。

Prompt 只是：

```text
某次 Invocation
对当前状态的暂时投影
```

因此更换模型、Prompt 模板甚至 Prompt 编译器，不应等于更换 Subject。

---

## 5. 分布式推理、集中式 Authority

多个 Activity、模型、Retriever、Reviewer、未来 Attention / Relationship Engine 都可以：

```text
查询
推断
排序
提议
审查
```

但：

```text
模型输出
Retriever 结果
Extension proposal
```

不能直接成为：

```text
Subject canonical state
DecisionCommit
System mutation
External effect truth
```

Authority 集中在显式的 commit/fence 上。

---

## 6. Silence 是合法行为

持续 Subject 不等于持续输出。

系统需要区分：

```text
NotObserved
ObservedButDeferred
DeliberatedAndSilent
SuppressedByPolicy
UnableToRespond
ReplyPlanned
```

沉默不是空字符串，也不是失败。

---

## 7. 行为与表达分离

认知链至少保留：

```text
BehaviorIntent
→ Review
→ DecisionCommit
→ CommunicationCommit
→ InteractionPlan
→ Expression
→ Semantic Fidelity
→ Effect
```

这样“怎样说”不能偷偷修改“决定说什么”。

---

## 8. 外部现实具有不确定性

任何外部写操作都不能假设：

```text
timeout = failed
```

Foundation 必须保留：

```text
prepared
dispatching
succeeded
failed
uncertain
```

`uncertain` 是真实世界状态，而不是异常处理不完善。

---

## 9. Subject Authority 与 System Authority 分离

Web 中可能同时有两类聊天：

```text
Subject Chat
→ 管理员 ↔ 同一个 Subject
→ Subject Authority

Operator Chat
→ 管理员 ↔ 系统智能助手
→ System Authority
```

两者可以视觉上相似，但不能共享隐式 Authority。

---

## 10. 系统智能助手不是 LLM + Shell

Operator Assistant 应依赖：

```text
RuntimeGraph
CapabilityGraph
BootReport
Configuration Surface
SystemAction Catalog
Evidence
```

然后通过：

```text
SystemAction proposal
→ SystemChangePlan
→ Policy
→ Approval
→ ManagementOperation
```

修改系统。

正常模式下不提供任意 shell / SQL / filesystem root。

---

## 11. 产品级可移植性

系统区分：

```text
Installation Backup
Subject Bundle
Product Update
```

安装备份恢复机器。

Subject Bundle 迁移认知主体。

Product Update 更换软件。

三者不可混为同一种压缩包。
