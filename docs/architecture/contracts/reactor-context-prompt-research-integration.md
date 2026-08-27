# S09 Reactor、Context、Prompt 与高级认知接入

## ReactorCoordinator

负责 Foundation Basic Reaction 的：

```text
Reaction lifecycle
Activity eligibility
artifact dependency
budget
cancel/supersede
yield/resume
commit boundary
```

不负责高级认知算法，也不拥有 Persona、Memory、Relationship、Attention 等 subsystem 的 canonical state。

---

## 不固定单一 Pipeline

禁止把 Foundation 定义成：

```text
fixed context stages
→ one model call
→ one reply
```

Reaction 可以有多个 bounded Activity；固定的是 Authority checkpoint，而不是一条固定模型 pipeline。

---

## Activity Contribution

Extension / subsystem 可以贡献 Activity，但 descriptor 必须声明：

```text
input artifact types
output artifact types
required Services/Capabilities
authority ceiling
deterministic/nondeterministic
budget
replay requirements
contractVersion
generation
```

Host 不允许 contribution 自封 `DecisionCommit` writer。

---

## Context Facets

Foundation 基础 facets：

```text
conversation/message facts
Subject identity/state
Governance/product constraints
available capabilities
runtime/environment facts when explicitly allowed
```

高级 cognition subsystem 可以贡献：

```text
persona
memory
relationship
living state
epistemic state
commitments
attention selection metadata
```

这些名称只定义 integration slots，不定义其内部数据模型。

---

## Context Projection

统一执行：

```text
authority/scope/privacy
freshness
relevance
budget
dedup
redaction
→ ContextProjection
```

某些 system-only context 永远不进入模型。

Context provider 的输出必须带 provenance/source refs 和 sensitivity classification。

---

## Prompt Program

Product-owned typed representation：

```text
PromptProgram
→ versioned Blocks/Slots
→ ModelMessages
→ PromptManifest
```

成熟 prompt/template library 可以承担渲染 mechanics，但不得获得最终 Authority。

Extension 通过 slot/provider contribution 参与，而不是字符串 post-process 最终 system prompt。

---

## Prompt Slots

Foundation 可定义：

```text
product constraints
activity objective
situation/conversation
Subject identity/governance
capability instructions
examples
output contract
```

高级 subsystem 只在存在时追加对应 typed contribution。

slot taxonomy 必须 versioned。

---

## Advanced Cognition Contracts

Foundation 对 Persona、Memory、Relationship、Attention、Reflection 等只保证以下 common envelope：

```text
provider/service identity
contractVersion
availability/readiness
input query/projection contract
output Context/Proposal artifact
source/provenance refs
sensitivity/scope
authority ceiling
generation
```

Foundation 不定义：

```text
Persona ontology
Behavioral exemplar algorithm
MemoryRecord schema
Memory write policy
retrieval/reranking/index
embedding model
Relationship representation
Attention scoring
Reflection/Diary/Dream algorithm
```

这些由对应高级 subsystem 的研究与设计决定。

---

## Review

Foundation Basic Reaction 的 Review 只验证与当前 committed action 相关的通用约束：

```text
source/evidence support
governance
scope/privacy
capability feasibility
unsupported claims
current revisions/generation
```

高级 subsystem 可以贡献 review proposal，但不能绕过 final commit boundary。

---

## Decision Commit

transactionally：

```text
validate Subject authority revision
commit accepted behavior/state owned by Foundation domain
DecisionCommit
initial ActionPlan/WorkItems where required
Evidence
```

高级 subsystem 自有 canonical mutation 由其 Service/Authority contract 决定，不能借 Reactor workspace 直接 root-write。

---

## Expression Fidelity

Expression 输入限定为：

```text
CommunicationCommit
approved/source-backed facts
target transport capability
conversation evidence
optional advanced ContextFacet refs when available
```

检查：

```text
no new unsupported fact
no increased certainty
no missing mandatory caveat
no contradiction
no privacy leak
```
