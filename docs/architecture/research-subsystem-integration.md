# 高级研究子系统接入地图

本文只定义高级研究子系统与 Foundation 的接入边界，不定义其内部 ontology、algorithm、storage、retrieval、learning 或 evaluation 方法，也不构成当前 Foundation 的实现义务。

Foundation 必须为这些子系统保留稳定的 Service / Capability / Contribution、配置命名空间、生命周期/readiness、Evidence/provenance 与 Authority ceiling 接入点，使其未来可以作为正式 MicroSystem / Domain Engine / Feature 独立研究和演化。

---

## Global Attention

消费：

```text
CognitiveOpportunity
Conversation summaries
Persona
Relationship
Living State
Commitments
Time
Capabilities
Governance
```

提供：

```text
select
defer
suppress
priority explanation
```

不拥有 WorkQueue 或 Subject/communication commit Authority。

---

## Advanced Observation Window

消费：

```text
ConversationMailbox
message/retraction/edit/media
typing hints
Time
context
```

提供：

```text
ObservationBatch
Ready
Deferred
Superseded
```

不自建 timer/scheduler。

---

## Relationship

拥有 evidence-backed relationship domain state。

提供：

```text
RelationshipView
ContextFacet
Persona/Attention modulation
```

不能按昵称猜 Person identity。

---

## Living State

研究持续 Subject 的内部可变状态，例如：

```text
engagement
energy
load
social openness
focus
```

具体 ontology 不冻结。

---

## Appraisal

对 situation 的主观解释：

```text
relevance
novelty
uncertainty
social significance
```

保持 proposal/interpretation，不是 factual truth。

---

## Epistemic State

跟踪：

```text
believes / knows / suspects
confidence
support
contradictions
open questions
corrections
```

不能把 LLM confidence 当 truth。

---

## Commitments / Subject Schedule

拥有语义承诺：

```text
what
for whom
deadline/window
fulfillment
cancel/supersede
```

通过 Time/WorkQueue/Durable mechanics 唤醒，而不是自己做 scheduler。

---

## Proactive Behavior

生成未来 CognitiveOpportunity 或其他 domain-scoped proposal。其最终行动或
沟通语义必须经过届时由 Subject/domain owner 定义的 Authority 与 Effect
fence；本页不预先冻结通用的 proposal-to-action pipeline。

仍然必须经过相应 owner 定义的：

```text
Review
owning domain commit
InteractionPlan when defined
EffectOperation when an external effect is involved
```

---

## Reflection

消费 Episodes/Evidence，产生：

```text
Memory proposal
Persona proposal
Relationship proposal
Epistemic proposal
```

不能直接写这些 domain。

---

## Diary

是 narrative interpretation，有 Evidence refs。

不是 canonical fact store。

---

## Dream / Simulation

产物强制标记：

```text
simulation / non-factual
```

不能直接进入 Memory truth、Relationship truth、Epistemic truth。

---

## Advanced Persona Learning

产生 PersonaChangeProposal / BehavioralExemplarProposal。

要求：

```text
provenance
revision
identity continuity
resistance to manipulation
```

---

## Advanced Memory Consolidation

产生：

```text
merge
semantic abstraction
retention
correction
```

proposal。

不自建 Foundation-level scheduler、path/lifecycle、backup/restore 或 Authority 基础设施。Memory 可以按自己的研究需要选择 SQLite、关系库、向量/图索引或其他 backend，但必须作为 DataOwner 接入 Storage Workspace、Backup/Purge/Portability、resource accounting 与 Lineage；Foundation 不冻结其内部 storage。

---

## Person Identity Resolution

跨平台 identity link 必须 evidence-based。

禁止：

```text
same display name → same person
LLM guess → canonical link
```

---

## Long-term Goals / Projects

Goal 是 Subject domain state。

执行仍通过：

```text
Opportunity → Reaction → ActionPlan → Capability / Effect
```

不获得 System Authority。

---

## Voice / Multimodal

必须保持同一 Subject、Memory、Persona，并复用相同的 communication/action
semantic owners；不能因为输入模态不同而创建另一套行为 Authority。

不能创建独立“Voice Agent”。

---

## 高级系统统一约束

每个高级 subsystem 必须：

```text
明确 state ownership
明确 availability
消费 Foundation Services
输出 typed proposal/context
记录 Evidence
支持 Replay/Evaluation
不直接外部 effect
不直接改其他 domain
不引入第二套 generic runtime/queue/workflow 除非证明必要
```
