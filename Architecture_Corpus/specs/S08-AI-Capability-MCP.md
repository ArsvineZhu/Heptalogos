# S08 AI Runtime、Capability 与 MCP

## Profile Model

```text
ProviderProfile
ModelProfile
ModelBinding
```

都是 canonical config/domain resources；SDK runtime objects 不持久化。

---

## Provider Factories

优先使用成熟 AI SDK native provider package。

OpenAI-compatible adapter 是 escape hatch，不强迫所有 Provider 伪装成同一协议。

---

## Conformance

每个 `ModelProfile` 只声明真实验证过的 capability：

```text
plain text
structured output
tools
stream
abort
timeout
usage
warnings
vision/files
embedding when required
```

---

## Invocation

`InvocationSpec` 收集：

```text
ContextProjection
Capability set
output schema
ModelBinding
budget
timeout/cancel
protocol/provider provenance
```

高级 cognition subsystem 若存在，只通过正式 Context/Activity contributions 进入，不要求 Foundation 知道其内部模型。

---

## Tool Projection

```text
Capability
→ filter
→ AI SDK tool projection
```

Tool name/description 只是 model interface。

执行时重新检查：

```text
availability
provider generation
scope
policy
SecretRef
NetworkAccess policy
risk/effect class
idempotency
```

---

## Capability Domains

```text
subject
operator
system-internal
```

`SystemAction` 不降级为普通 capability。

---

## Model Retry

Authority commit 前可 retry/failover；实际 provider/model identity 必须进入 Evidence。

---

## MCP Connection / Transport / Protocol Revision

Official MCP TypeScript v2 SDK 负责协议 mechanics 与 transport。

支持的 transport 由产品配置与 SDK capability 决定，例如：

```text
stdio
Streamable HTTP
```

Heptalogos 负责：

```text
configured command/endpoint
SecretRef materialization through scoped delivery mode (including per-child env only when required)
trust
lifecycle
NetworkAccess policy
capability mapping
policy
Evidence
```

协议修订显式记录：

```text
configured compatibility mode
observed protocol revision
peer metadata/capabilities when available
discovery support
transport diagnostics
```

现代协议语义不依赖协议级 session 或 initialize handshake；legacy compatibility 由 SDK/adapter 显式处理。

---

## MCP Transport Enforcement Boundary

`NetworkAccess` 的 enforcement claim 必须按 transport/execution boundary 分开：

```text
Streamable HTTP initiated by Host
→ endpoint/DNS/proxy/TLS/redirect/response policy can be enforced by Host NetworkAccess adapter

stdio / spawned MCP server process
→ Host controls executable, args, env/SecretRef materialization, lifecycle and whether a tool call is allowed
→ server process internal filesystem/network/subprocess behavior is NOT automatically controlled by Host NetworkAccess
```

因此 MCP/external-process descriptor 必须声明：

```text
execution trust
transport
host-visible destination when applicable
egressVisibility = ENFORCED | HOST_VISIBLE | OPAQUE_EXTERNAL
sandbox/proxy profile when any
```

`OPAQUE_EXTERNAL` 不能被 UI/Operator/Evidence 描述为“network policy enforced”。如果产品要求限制该进程内部 egress，必须选择真实 isolated process/OS sandbox/proxy execution boundary；Node permission metadata 或 MCP schema 本身不能提供这种保证。

Remote tool descriptor 对 effect/risk 的自述也不可信。未被 Host policy/curation 识别的 effect class 默认按更严格风险处理或拒绝，不能因为 server 标注 `readOnly` 就获得 Authority。

## MCP Tool

Remote descriptor 永远不是 trusted tool。

需要：

```text
schema sanitize
namespacing
effect/risk classification
NetworkAccess destination classification
Policy
CapabilityDescriptor
```

---

## MCP Resource

可作为 Context source/read capability；受 privacy、budget、source provenance 和 network policy 约束。

---

## MCP Prompt

如果支持，只能提供低 Authority prompt/context contribution。

不能覆盖 product constraints 或 Subject Governance Authority。

---

## Bidirectional Requests

server-driven request / elicitation / roots 等能力只有在存在明确 Heptalogos Authority mapping 时启用。

不支持时显式 reject，不能由 transport callback 直接 mutation UI/System/Subject。

---

## Protocol Conformance

按声明支持范围至少验证：

```text
modern protocol revision
legacy compatibility if claimed
version mismatch
server/discover available/unavailable
transport reconnect
capability refresh
network-policy enforcement
```
