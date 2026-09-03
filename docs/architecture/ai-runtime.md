# AI Runtime、Capability Broker 与 MCP

## 1. AI 不是 Subject

Canonical configuration/domain state 保存：

```text
ProviderProfile
ModelProfile
ModelBinding
SecretRef
```

运行时才 materialize SDK/provider/model objects。

模型、Provider、SDK generation 的变化不会自动创建新 Subject。

---

## 2. AI SDK 的角色

AI SDK 承担 generic mechanics：

```text
provider/model interface
text/stream
structured output
usage
abort/timeout
middleware
```

AI SDK may expose broader mechanics, but the current Subject Product path consumes
only text generation, structured output, usage when supplied, and
abort/timeout. Tool and autonomous-step mechanics remain future integration
choices and do not create current AIRuntime Authority.

Heptalogos 拥有：

```text
InvocationSpec
ModelBinding
ContextProjection
Capability policy
Behavior Authority
Effect fences
Evidence
```

---

## 3. ModelBinding

逻辑角色可包括：

```text
subject.primary
subject.expression
future.review
future.embedding
```

当前 Heptalogos AIRuntime 只定义 `subject.primary` 和
`subject.expression` 两个 ModelBinding 角色；它们可以绑定同一个
ModelProfile。`future.*` 只表示未来可扩展的命名空间，不表示当前存在
Operator 或 System Assistant 的内部模型绑定。OpenClaw 的模型配置由
OpenClaw 自己拥有，不是 Heptalogos AIRuntime 配置。

---

## 4. InvocationSpec

每次调用都有显式：

```text
invocationId
owner Reaction/Activity
objective/stage
ModelBinding
ContextProjection
available capabilities
output schema
budget
timeout/cancel
protocol/provider provenance
```

高级 cognition subsystem 若存在，可以通过 Context/Activity contract 贡献数据；Foundation 不固定 Persona/Memory 等内部表示。

AI SDK messages/tools 只是 `InvocationSpec` 的编译结果。

---

## 5. Structured Output

模型输出默认都是 proposal，例如：

```text
Situation proposal
BehaviorIntent
ToolIntent
ExpressionPlan
Review proposal
AuthorityHandoff proposal
```

未来高级子系统可以增加自己的 proposal schema，但不能自封 Authority writer。

Ajv/domain validator/review 继续检查。

---

## 6. Capability

`CapabilityDescriptor` 至少表达：

```text
id/version
contractVersion
domain
input/output schema
effect class
risk
scope
Secret requirements
network requirements
idempotency/reconciliation
provider generation
availability
```

Capability 可被 Reactor、deterministic code、Operator support code 或其他 MicroSystem 使用。

`Capability != AI Tool`。

---

## 7. Capability Broker

负责：

```text
availability/provider selection
scope
policy
Secret resolution
NetworkAccess policy integration
invoke
retry/idempotency handling
Evidence
generation fence
```

不负责 Subject behavior decision，也不负责 SystemAction approval。

---

## 8. External-write Capability

会产生 consequential external write 的 capability，例如：

```text
send message
send email
post content
modify remote resource
```

不能隐藏在 SDK 自动 retry 中。

必须进入：

```text
domain plan
→ EffectOperation
→ controlled dispatch
```

Network transport success 不等于 effect outcome known。

---

## 9. MCP 的架构角色

MCP 是 Integration Protocol，不是：

```text
Extension Package Manager
System Policy
Subject Authority
Capability Authority
```

使用 official MCP TypeScript v2 SDK 承担：

```text
protocol encoding/decoding
stdio / Streamable HTTP transport
protocol-revision compatibility mechanics
discovery mechanics when supported
```

Heptalogos 拥有：

```text
configured command/endpoint
SecretRef/env materialization
trust
NetworkAccess policy
process/network lifecycle
capability normalization
policy/effect classification
Evidence
application-level state handles
```

---

## 10. MCP Protocol Revision

MCP 协议修订是显式运行数据，不假设 SDK 默认行为永久稳定。

连接/配置状态至少能够记录：

```text
configured compatibility mode
observed protocol revision
peer identity/capability metadata when available
transport kind
discovery availability
compatibility diagnostics
```

MCP 2026-07-28 era 不依赖协议级 `initialize/initialized` handshake 或 `Mcp-Session-Id` session 语义。需要兼容 legacy-era peer 时，由 official SDK / adapter 明确选择兼容模式。

应用层若需要 conversation/tool-state handle，应定义为 Heptalogos domain object，不能把已不存在的协议 session 当作产品 Authority。

---

## 11. MCP Tool 映射

```text
remote MCP Tool descriptor
→ validate/sanitize
→ namespace
→ effect/risk classification
→ CapabilityDescriptor
→ Policy / CapabilityBroker
→ InvocationSpec projection
```

不把 raw remote tool list 直接塞给模型。

执行时重新验证 availability、scope、policy、Secret、network destination、generation 与 effect constraints。

---

## 12. MCP Resource / Prompt

Resource 可以映射为：

```text
ContextSource
read capability
```

仍受 privacy、budget、provenance、network policy 约束。

MCP Prompt 若支持，只能作为低 Authority contribution，不能覆盖 Product/Subject constraints。

---

## 13. Server-driven / Bidirectional Requests

任何 server-driven request、elicitation、roots 或 future bidirectional feature 都必须先有明确的 Heptalogos Authority mapping。

若没有映射：

```text
explicitly unsupported/rejected
```

而不是 transport callback 直接操作 Web、System 或 Subject canonical state。

---

## 14. Provider / Protocol Conformance

不能因为 SDK 暴露某 API 就声明 capability READY。

Provider conformance 按实际 claim 验证：

```text
text
structured output
tools
streaming
abort/timeout
usage
vision/files
embedding when a feature requires it
reasoning metadata when consumed
```

MCP conformance 至少覆盖：

```text
supported modern protocol revision
legacy compatibility when claimed
version mismatch
transport reconnect
server/discover present/absent
capability change
network-policy enforcement
```

---

## 15. Failover

只有在 Authority commit 前且 policy 允许时才可 fallback。

实际 provider/model/protocol revision/generation 必须进入 Evidence。

不同模型输出不能复用同一 committed artifact identity。

## 12. MCP / External-process Enforcement Boundary

Host-originated HTTP transport 可以通过 `NetworkAccess` 强制 endpoint policy；stdio/spawned MCP process 的内部 network/filesystem/effect 默认是 `OPAQUE_EXTERNAL`，除非另有真正 sandbox/proxy enforcement。Host 仍控制 process acquisition/lifecycle、Secret materialization、tool invocation Policy 与 Evidence，但不能把“允许调用”误写成“已控制 server 内部所有副作用”。
