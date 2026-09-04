# Subject 与认知系统

## 1. Subject 定义

Subject 是：

> 一个持久、单一的认知与社会身份，其连续性跨越模型调用、会话、平台、组件 generation 与 Host 重启。

Subject 是面向世界的认知/社会主体，不是一个只响应聊天请求的 Chatbot。它
可以在被授权的边界内观察或行动于多个 world interface；Messaging 只是其中
一个观察与沟通渠道。

```text
Observation source != Conversation != Messaging
```

可能的 interface 包括 Messaging、web/network information services、外部应用与
capability、被授权的文件/资源、适当的 Machine Operations handoff、未来
sensor/provider，以及 Subject-owned state。这里保留语义方向，不提前创建
`World` mega-object、universal event bus 或 generic Observation store。

```text
one logical instance
→ one active Subject identity
```

---

## 2. Subject 不等于

```text
Model
AI SDK Agent
Reactor
Persona
Memory
Conversation
MessagingAccount
Host
Administrator
System Assistant
Subject OpenClaw Runtime
```

---

## 3. Subject Lifecycle

Desired：

```text
STOPPED
RUNNING
```

Actual：

```text
STOPPED
STARTING
READY
ACTIVE
DEGRADED
BLOCKED
STOPPING
FAILED
```

管理员登录不会自动启动 Subject；Host 停止不会静默改写 `RUNNING` intent。

---

## 4. Subject Authority Head

Subject 使用小型 authority head / revision 作为并发 fence。

Subject-owned 各领域状态由对应 Service 拥有，不聚合为单个 mega JSON，也不交给模型或 workflow engine 作为 canonical truth。

---

## 5. CURRENT L4: ConversationMailbox

当前 L4 的 `ConversationMailbox` 是 Subject-owned cognition boundary，只有
必要的 durable cursor 和 open-Reaction fence：

```text
conversationId
mailboxRevision
consumedThroughSequence
openReactionId?
```

待处理输入从 Messaging 的 canonical `MessageFact` sequence 派生，不保存会
无限增长的 `pendingMessageRefs`，也不复制 Messaging canonical truth。

以下仍是未来语义，不属于当前 L4：

```text
retraction/edit/media changes
pending outbound plan refs
advanced selection/observation windows
```

---

## 6. CognitiveOpportunity

表示：

> 某个 situation 现在可能值得进入认知处理。

不表示：

```text
Subject 必须立即回复
Subject 必须调用模型
Subject 必须产生外部 effect
```

Foundation Basic Reaction 使用简单、可验证的 admission policy。未来 Attention / Observation subsystem 可通过正式 contribution point 提供更高级 selection，而不替换 WorkQueue、Messaging 或 Authority。

---

## 7. CURRENT L4: Reaction

当前 L4 的 `Reaction` 是一个有明确 mailbox/Subject revision 观测值的
bounded conversation cognition episode。它证明的是“消息触发认知并可选择
沟通”，不是 Subject 的完整行为空间：

```text
canonical MessageFact range
→ bounded conversation cognition proposal
   ├─ NO_COMMUNICATION → deterministic acceptance → Reaction completes
   └─ COMMUNICATE(semantic content)
        → deterministic Review
        → CommunicationCommit
        → subject.expression
        → local outbound MessageFact
```

`CommunicationCommit` 是已经接受的 communication obligation；`Expression`
只实现已提交语义的语言/社交表达。它不能改变是否沟通、recipient、material
facts、purpose、SystemAction、consequential external action 或 permission。

当前切片没有位于 cognition proposal 与 accepted communication 之间的通用
Subject decision state，也不创建 OpenClaw、ActionPlan 或通用 Decision
machinery。accepted communication 的 provenance 由 CommunicationCommit 持有。

`Reaction` 状态不是 DBOS workflow state；WorkQueue/DBOS 只承载可恢复的
obligation。

以下仍是未来语义，不在当前 L4 实现：

```text
多 facet/媒体等待、Yield/resume、多 proposal、advanced observation/debounce
```

---

## 8. ReactionWorkspace

使用 append-oriented Artifact graph。

每个 Artifact 至少记录：

```text
type/schemaVersion
producer/generation
source refs
authority class
sensitivity
digest
causation
supersedes/refines
```

Authority classes 至少区分：

```text
EVIDENCE
DETERMINISTIC_DERIVATION
MODEL_PROPOSAL
REVIEWED_PROPOSAL
COMMITTED_FACT
PRESENTATION_DRAFT
```

---

## 9. Activity

`Activity` 是 bounded cognitive/domain operation，例如：

```text
build situation
query context facet
invoke model
invoke capability
review proposal
compile expression
```

它不是 autonomous agent authority。

Extension 可以贡献 Activity，但必须声明 input/output artifact types、required Services/Capabilities、authority ceiling、budget、replay requirements 与 generation identity。

---

## 10. Yield

正式支持：

```text
wait_until
wait_for_fact
wait_for_media
wait_for_capability
wait_for_user_continuation
```

Domain 使用 `YieldDirective` 表达语义；DBOS sleep、WorkItem delay 等只是 mechanics。

---

## 11. Supersession

新 Evidence 可以使尚未 commit 的 Reaction 失效，例如：

```text
message retraction
“算了”
new clarification
another participant resolves the issue
```

commit 前可 cancel/supersede；commit 后只能对后续 plan/effect 做合法取消或补偿，不能抹除历史 commit。

---

## 12. Context Projection

Context 是 typed query/projection system：

```text
ContextQuery
→ ContextFacet providers
→ authority/scope/privacy filter
→ freshness/relevance
→ budget/dedup/redaction
→ ContextProjection
```

Foundation 必须提供的基础 facets 包括：

```text
conversation / messaging facts
Subject identity/state
governance/product constraints
available capabilities
current operation/environment facts when allowed
```

高级子系统可以贡献额外 facets，例如：

```text
persona
memory
relationship
living state
epistemic state
commitments
```

Foundation 不规定这些高级 facets 的内部数据模型或算法。

---

## 13. Prompt

Prompt 是一次 `InvocationSpec` 的编译产物：

```text
PromptProgram
→ typed Blocks/Slots
→ ModelMessages
→ PromptManifest
```

Extension 不获得“任意后处理最终 system prompt”的权限，而通过 typed Context/Prompt contribution point 参与。

Prompt slot taxonomy 必须 versioned；Prompt 不是长期状态容器。

---

## 14. Advanced Cognition Integration Boundary

Persona、Memory、Relationship、Attention、Living State、Appraisal、Epistemic State、Commitments、Reflection、Diary、Dream 等均属于高级认知子系统。

Foundation 对这些系统只保证：

```text
reserved Service/Capability identities
Context/Activity contribution contracts
configuration namespace
lifecycle/readiness integration
Evidence/provenance hooks
authority ceiling
```

统一限制：

```text
Context / Selection / Proposal may be contributed
CommunicationCommit may not be self-granted
System Authority may not be self-granted
External Effect may not bypass plan/effect fence
canonical state of another owner may not be mutated directly
```

Foundation 不研究：

```text
MemoryRecord schema
retrieval/reranking/index
embedding backend
Persona ontology/learning
Relationship representation
Attention algorithm
Reflection/Diary/Dream algorithms
```

---

## 15. Subject OpenClaw Runtime role

Subject OpenClaw Runtime 是 Product-side cognition mechanics，
不是 Subject、Subject Authority 或 canonical state owner：

```text
Product Host
→ supervises one replaceable, low-privilege Subject Gateway child
→ communicates through the documented public Gateway protocol/client
→ never reads OpenClaw private SQLite/state formats
```

Heptalogos 继续拥有 SubjectId、Subject-owned state、MessageFact、
CommunicationCommit 和 Review/Authority。OpenClaw session/workspace state 只能
帮助 runtime continuity；丢失或重建 provider-private state 不会产生新的
SubjectId。Subject role 必须与高权限 Machine Operations OpenClaw 使用不同的
process、profile、state/config/workspace、credentials、ports 和 tool policy。

当前内建 Subject Chat 使用 AIRuntime 的 bounded cognition 路径；Subject
OpenClaw Runtime 若被接入，必须使用公开协议和受控 proposal 边界，把运行时
输出交回 Heptalogos 的 deterministic Review，而不会把 OpenClaw agent-loop
升级为 Authority。

---

## 16. CURRENT L4 communication Authority slice

Foundation 保留的是 communication decision 与 Expression 的语义接缝：

```text
ContextProjection
→ bounded conversation cognition proposal
   ├─ NO_COMMUNICATION → local episode completes
   └─ COMMUNICATE(semantic content)
        → deterministic Review
        → CommunicationCommit
        → Expression
        → local outbound MessageFact
```

`NO_COMMUNICATION` 是一次被考虑的 communication opportunity 的合法局部
结果，不是全局 Subject behavior entity，也不需要 free-text reason。
`CommunicationCommit → Expression` 必须保持清晰：前者决定已接受的语义
沟通义务，后者只改变措辞、register、语气、简洁度、组织、标点和平台表达，
不能改变 recipient、material facts/commitments、permission、Authority 或
consequential action。

当前 L4 只定义 bounded conversation proposal、optional communication、
CommunicationCommit 与 Expression；它不定义总 Subject 行为空间，也不创建
泛化的 ActionPlan/Decision framework。

`CognitiveOpportunity`、`ReactionWorkspace`、`Yield`、`PromptProgram`、
`ActionPlan` 与高级 Observation Window 是保留的未来研究/语义接缝，不是
当前 L4 的新增 machinery。

---

## 17. Optional communication and no-communication

Subject 不需要对每个 Observation 产生消息。分析上仍可区分：

```text
NotObserved
ObservedButDeferred
DeliberatedAndSilent
SuppressedByPolicy
UnableToRespond
ReplyPlanned
```

这些标签有助于解释 cognition episode，但当前实现不要求把它们全部变成
durable state。No-communication 不是空字符串、timeout、provider error 或
系统故障；也不要求模型生成解释文字。
