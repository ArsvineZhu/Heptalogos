# S10 Evidence、Replay、Execution Lineage、Observability 与 Content

## 1. 四类系统

必须区分：

```text
Execution Lineage / Activity
Product Evidence
Security Audit Facts
Operational Telemetry
```

Lineage 回答“谁调用谁、为何、由什么导致、属于哪个 generation、结果去了哪里”；Evidence/Audit 保存必须耐久的产品/安全事实；Telemetry 保存可丢失/采样的 logs/traces/metrics。

详细 Lineage contract 见 `execution-lineage-observability.md`。

## 2. Evidence Envelope

至少包含：

```text
id/type
schemaVersion
occurredAt/recordedAt
producer/generation
subject/instance/resource scope
causation/correlation
related domain refs
sensitivity
data lifecycle class
payload/ArtifactRef
digest
```

Evidence 是产品级 causal/provenance record，不等于 log/span。

---

## 3. Mandatory Evidence

即使使用 privacy-minimal profile，也要保留足以证明关键 Authority 行为的 metadata：

```text
authority object ids
state transitions
DecisionCommit
EffectOperation state
SystemAction / Approval / ManagementOperation
critical configuration/package/update provenance
```

对敏感内容可只保留 digest/ref/tombstone，而不是永久保留原文。

---

## 4. Sensitive Capture

可定义：

```text
MINIMAL
STANDARD
RESEARCH
```

控制是否记录：

```text
full prompt/model output
tool args/result
raw message payload
advanced ContextFacet payload
```

`SECRET` 永远排除；PII/sensitive data 按分类与 retention policy 处理。

---

## 5. Explainability

系统解释必须引用真实：

```text
source facts
ContextFacet refs
review results
capability invocation refs
Decision/Effect/SystemAction refs
```

LLM 可以把 Evidence 组织成自然语言，但不能编造 retrospective rationale。

---

## 6. Operational Telemetry

Pino/OpenTelemetry/OpenInference 是 operational projection，不是产品 Authority。

统一由 Heptalogos scoped observability SDK/automatic invocation boundary 注入：

```text
ActivityId
TraceId/SpanId when sampled
Package/Generation/MicroSystem/Contribution
Service/Capability/Provider
principal/authority/subject refs where allowed
outcome
```

Domain/Extension code不得自行形成互不相关的 root logger/tracer universe。

---

## 7. Observability Governance

分开：

```text
severity
importance
retentionClass
sensitivity
```

禁止 Secret plaintext；PII/sensitive attributes 按 classification/redaction policy；metric cardinality bounded；telemetry exporter failure 不改变 Authority。

Required Evidence/Audit/retained significant Activity 不能依赖 trace sampling 成功。

Lineage query/query graph 只返回 caller 有权看到的 projection，不能因“可观测”绕过 Secret/PII/Subject/System Authority。

## 8. Replay Bundle

包含：

```text
ReplayProfile
contract/schema versions
frozen canonical inputs
Prompt/Context manifests
recorded nondeterministic model outcomes
recorded capability/effect outcomes
expected deterministic digests
generation/protocol metadata
```

不包含 secret plaintext。

高级 cognition subsystem 若未安装，不进入 Foundation replay requirement；若安装并声明 replay support，则通过其 own contribution contract 提供 replay artifacts。

---

## 9. Replay VERIFIED

只有 required deterministic stages 实际重新执行并匹配才能标记 `VERIFIED`。

不能：

```text
missing recomputation
→ fall back to stored expected
→ call it verified
```

不支持/缺失的 advanced subsystem contribution 必须显式标记 replay completeness limitation。

---

## 10. Counterfactual / Research Replay

Counterfactual 属 research/evaluation，不获得 Authority，也禁 external effects。

Foundation 只提供 replay inputs/fakes/fences；不定义 Memory/Persona/Attention 等研究实验。

---

## 11. Content CAS

Blob：

```text
SHA-256 immutable bytes
```

Artifact：

```text
semantic kind
owner
provenance
sensitivity
retention/data-lifecycle class
BlobRefs
contractVersion
```

---

## 12. Media Security

处理 untrusted media：

```text
size limit
pixel/page/frame limit
timeout/decompression budget
quarantine
safe MIME handling
no arbitrary shell
network download budget
```

`sharp` / FFmpeg / `file-type` 只承担 mechanics。

---

## 13. GC / Purge Coordination

Blob GC 只有在：

```text
no live Artifact refs
no backup/export fence
no legal/retention fence
purge/retention grace satisfied
```

时可删除。

Data lifecycle 使用 `PurgePlan` 协调 canonical owner、derived data、Artifact refs、Blob CAS 和 backup fences。

GC 不拥有 semantic deletion Authority。
