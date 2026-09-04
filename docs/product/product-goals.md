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

Subject 是面向世界的认知/社会主体；即时通信只是一个 Observation source
和 communication channel，不等于整个世界、Conversation 或 Messaging。

```text
Observation source != Conversation != Messaging
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
ConversationReactionProposal
Review
NO_COMMUNICATION / COMMUNICATE
CommunicationCommit
Expression
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
CommunicationCommit
System mutation
External effect truth
```

Authority 集中在显式的 commit/fence 上。

---

## 6. Communication 是可选结果

持续 Subject 不等于持续输出。每个 Observation 都可能产生 cognition
opportunity，但 Subject 不欠下每个 opportunity 一条消息。一个被考虑的
communication opportunity 可以合法地以 `NO_COMMUNICATION` 完成，不产生
CommunicationCommit 或 outbound message。

系统仍可在分析上区分：

```text
NotObserved
ObservedButDeferred
DeliberatedAndSilent
SuppressedByPolicy
UnableToRespond
ReplyPlanned
```

这些不是当前必须全部持久化的全局 Subject behavior entities；no-communication
也不是空字符串、timeout、provider error 或要求模型生成的自由文本 reason。

---

## 7. 行为与表达分离

当前 conversation-triggered L4 只证明一个 bounded cognition/communication
slice：

```text
MessageFact
→ ConversationMailbox
→ Reaction
→ ConversationReactionProposal
   ├─ NO_COMMUNICATION → complete
   └─ COMMUNICATE(semantic content)
        → deterministic Review
        → CommunicationCommit
        → Expression
        → local outbound MessageFact
        → Effect only when a later external channel requires it
```

Communication decision owns whether to communicate, recipient, purpose and
semantic content. `CommunicationCommit → Expression` remains the valuable
seam: Expression may realize wording and social presentation, but cannot
change recipient, material facts/commitments, Authority, or consequential action.

The current implementation still contains the pre-P1 `BehaviorIntent`,
conversation-specific `DecisionCommit`, and `REPLY/SILENCE` shape. That is a
bounded implementation lag, not the total Subject behavior ontology; P1 will
remove it without inventing a generic ActionPlan/Decision framework.

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

## 9. Subject Authority、System Authority 与 Machine Operations 分离

产品提供相互独立的 Authority 路径：

```text
Subject Chat
→ 管理员 ↔ 同一个 Subject
→ Subject Authority

Direct Management
→ 确定性的 Product Management
→ Heptalogos System Authority

System Assistant / Maintenance Assistant
→ Machine Operations Plane
→ 优先使用 Heptalogos Management API / CLI
→ 在系统修复时使用机器级维护能力
```

Subject interaction、normal Product Management 与 machine/deployment
maintenance 可以共享产品语境，但不能共享隐式 Authority。Machine
Operations Plane 是独立的高权限运行域，不属于 Product Host 的内部
System Service，也不改变 Heptalogos canonical product truth 的拥有者。

---

## 10. System Assistant 是机器运维体验

System Assistant 是 Heptalogos 产品中的高能力机器运维体验，由独立的
operations runtime 支撑。Product Host 健康时，它优先使用结构化的
Management Contract、ManagementClient 和 reference CLI，获得稳定的
状态、Problem、Operation、Lineage 与 Evidence 语义。

当 Product Host、Management API 或 CLI 不可用时，Machine Operations
Plane 可以在其独立的 OS/deployment 权限范围内执行诊断、服务修复、仓库
修复、依赖修复和其他 break-glass maintenance。普通低权限 Product
Management surface 不接收该运行域的凭据。

System Assistant 的产品身份是 Heptalogos；其外部实现与分发归属由
Architecture、Dependencies 和后续集成资格记录维护。

Subject cognition 若采用 OpenClaw，使用的是另一个低权限、由 Product Host
监督的 Subject runtime。它与高权限 Machine Operations runtime 必须保持
不同 process、Gateway、profile/state/config/workspace、credentials、ports
和 tool policy：

```text
same OpenClaw software != same runtime != same trust domain
```

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
