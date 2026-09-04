# Subject 与认知系统

## 1. Subject 定义

Subject 是：

> 一个持久、单一的认知与社会身份，其连续性跨越模型调用、会话、平台、组件 generation 与 Host 重启。

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
bounded cognition episode。它最多走：

```text
canonical MessageFact range
→ subject.primary BehaviorIntent
→ deterministic Review
→ DecisionCommit
→ optional CommunicationCommit
→ subject.expression
→ local MessageFact
```

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
DecisionCommit may not be self-granted
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

## 15. CURRENT L4: Behavior Authority Spine

Foundation 保留行为 commit spine：

```text
ContextProjection
→ BehaviorIntent
→ deterministic Review
→ DecisionCommit
→ CommunicationCommit
→ Expression
→ local MessageFact
```

模型文本不能直接成为 canonical decision 或外部 effect。

`CognitiveOpportunity`、`ReactionWorkspace`、`Yield`、`PromptProgram`、
`ActionPlan` 与高级 Observation Window 是保留的未来研究/语义接缝，不是
当前 L4 的新增 machinery。

---

## 16. Silence

正式语义包括：

```text
NotObserved
ObservedButDeferred
DeliberatedAndSilent
SuppressedByPolicy
UnableToRespond
ReplyPlanned
```

沉默不是空字符串，也不是系统故障。
