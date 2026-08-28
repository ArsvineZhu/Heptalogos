# S07 Messaging、Subject Chat 与 Drivers

## Canonical Messaging

MessagingService 负责：

```text
platform/account identity
conversation/message facts
segments
protocol capability
Driver registration
outbound dispatch
delivery projection
```

不负责 cognition。

---

## Raw Evidence → Canonical

Inbound：

```text
wire event
→ RawProtocolEvidence
→ protocol DTO validation
→ MessageFact / mutation fact
→ WorkItem
```

raw 与 canonical 都保留 causation reference。

---

## Conversation

至少：

```text
direct
group
```

未来 thread/channel 可以 metadata/capability 表达，不必强塞。

---

## Message Mutations

```text
MessageEdited
MessageRetracted
ReactionAdded
ReactionRemoved
DeliveryReceipt
```

append-oriented。

---

## Media

Message segment 持有 ArtifactRef。

media acquisition：

```text
remote/protocol locator
→ WorkItem
→ ArtifactService
→ Artifact available
→ Signal/fact
→ cognition resume
```

---

## Conversation Ordering

Canonical ordering 是 Messaging domain semantics。

WorkQueue 可用 partition mechanics 保护同 conversation 的执行顺序，但不能成为 message truth。

---

## Subject Chat Protocol

内建 direct-only transport。

认证依赖 Control Plane administrator auth，但消息进入后属于 Subject Authority。

```text
POST/send
→ durable MessageFact
→ WorkItem
→ async Subject cognition
```

API 不等待 Subject 回复。

---

## Subject Chat stopped policy

Foundation 默认：

```text
Subject stopped/blocked
→ reject new Subject Chat ingress
```

未来 offline subject inbox 如果需要，应作为显式 Feature，而不是默认隐藏 backlog。

---

## External IM while Subject stopped

外部 Driver 可继续接收并 durable persist canonical facts，前提是 Messaging policy 允许。

Cognition 保持停止。

---

## Driver Selection

回复的 transport identity 是目标语义的一部分。

Milky 挂了不能自动把 QQ reply 发送到 Subject Chat。

---

## Driver Reconnect

Driver 自己负责协议特有：

```text
heartbeat
session
reconnect
authentication
remote sync
```

但 restart/backoff 可复用 runtime substrate / mature utility。

---

## Protocol Adapter Route

OneBot/Milky 使用 direct thin anti-corruption adapters，Canonical Messaging 仍由 Heptalogos 拥有。Driver 必须复用 Foundation 已采用的 transport、schema validation、runtime lifecycle、media 与 evidence mechanics，而不是引入第二套 Messaging runtime/Authority。

```text
OneBot/Milky protocol
→ thin Driver adapter
→ Canonical MessageFact / MessagingService
```

Satori 不作为 mandatory Foundation runtime dependency。未来如果产品需要支持 Satori protocol 本身，可以新增独立 Satori Driver；Satori element/session/runtime types 不得泄漏到 canonical contracts。

---

## Outbound Effect

Driver 不直接接受“请重试直到成功”。

EffectService 根据：

```text
remote idempotency
remote message id
reconciliation
```

决定是否可安全 retry/query。

默认 timeout after dispatch → uncertain。
