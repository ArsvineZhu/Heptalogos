# Messaging 与 Subject Chat

## 1. 领域边界

```text
Driver
= protocol mechanics

MessagingService
= canonical messaging semantics

ConversationMailbox
= cognition aggregation

Reactor
= cognition

EffectOperation
= external-write truth fence
```

---

## 2. Inbound path

```text
protocol event
→ RawProtocolEvidence
→ validated protocol DTO
→ canonical Messaging Fact
→ WorkItem
→ ConversationMailbox
```

外部 callback 不是唯一真相副本。

---

## 3. MessageFact

MessageFact immutable。

后续：

```text
edit
retract
reaction
receipt
```

通过新的 append fact 表达，不重写历史。

---

## 4. Identity

至少区分：

```text
MessagingPlatformId
MessagingAccountId
RemoteConversationId
RemoteParticipantId
CanonicalConversationId
CanonicalMessageId
```

跨平台 Person fusion 延后，不按 nickname 猜测。

---

## 5. Segment

Foundation 支持：

```text
text
image
audio
video
file
mention
reply/quote
emoji/reaction-like
opaque-protocol-segment
```

媒体通过 ArtifactRef。

---

## 6. Ingress durability

一个 canonical transaction 可写：

```text
raw evidence metadata/ref
MessageFact
segments
dedup identity
conversation metadata
WorkItem
Evidence
Signal hint
```

commit 后才表示 Heptalogos 接受了这条消息。

---

## 7. Dedup

优先使用协议提供的 stable event/message identity。

如果协议没有稳定 ID：

```text
Driver 提供最强可用证据
并显式记录 certainty 弱化
```

不把 payload hash 假装成 universal identity。

---

## 8. Subject Chat 是真实 IM 协议

内建：

```text
administrator ↔ Subject
direct only
```

逻辑平台：

```text
heptalogos-subject-chat
```

它不是：

```text
Web → Reactor shortcut
```

而是：

```text
SubjectChatClient (CLI/test/future Web)
→ Subject Chat protocol endpoint/Driver
→ MessagingService
→ MessageFact
→ WorkItem
→ ConversationMailbox
```

---

## 9. Subject Chat Authority

管理员在 Subject Chat 中拥有特殊 Subject Governance 身份，但仍属于 Subject Authority。

例如：

```text
“今晚别主动找 Bob”
→ Governance proposal/path

“升级 Milky”
→ AuthorityHandoff to System Authority
```

不能因为参与者是管理员就自动执行 SystemAction。

---

## 10. Subject stopped 时

Foundation 默认：

```text
Subject Chat 新消息拒绝接收
```

因为用户明确是在“与当前运行的 Subject 对话”。

外部 IM Driver 可按 Messaging policy 继续 durable ingest，而不启动 cognition。

这两种行为不同是有意设计。

---

## 11. Subject Chat outbound

Subject 对管理员的本地 outbound：

```text
CommunicationCommit
→ canonical outbound MessageFact
→ client query / catch-up / live projection
```

本地 Presentation client 断线、错过 live event 或关闭窗口不产生
EffectOperation `uncertain`。MessageFact 保持 canonical truth，客户端恢复
后通过 query/catch-up 读取。

客户端恢复后 query/catch-up canonical message。

---

## 12. External Driver

当前需要支持：

```text
Milky
OneBot v11
```

Canonical Messaging model 固定；当前 Foundation 的 OneBot/Milky 协议 route 固定为 direct thin anti-corruption adapters，并复用既定 NetworkAccess、SchemaRuntime、runtime lifecycle、media 与 Evidence mechanics。Satori 不属于当前 Foundation route；只有未来出现独立的 Satori protocol 角色并按依赖治理显式进入范围时，才可作为新的 Integration Driver 评估，不能在当前实现中作为隐式替代 provider。

`Q-MSG-01` 保存 direct-adapter mapping/anti-corruption evidence；当前 route 已冻结为 thin OneBot/Milky Drivers。真实 live protocol 行为在 Driver implementation 的 Product Qualification 中验证。

---

## 13. Outbound external effect

```text
Action/InteractionPlan
→ EffectOperation prepared
→ persist dispatching
→ Driver call
→ succeeded / failed / uncertain
→ DeliveryOutcome
```

外部网络调用同时受 `NetworkAccess` policy 约束。网络超时后不安全自动重发。

---

## 14. Driver Capability

例如：

```text
subject.messaging
subject.messaging.external
messaging.direct
messaging.group
messaging.send.text
messaging.send.image
messaging.retract
messaging.react
```

不同 Driver/Account 可动态提供不同 subset。

---

## 15. Protocol qualification

每个正式支持 Driver 需要：

```text
recorded fixtures
normalization tests
protocol revision metadata/compatibility
duplicate/reconnect
media
edit/retract
network-policy enforcement
effect uncertainty
real live target qualification
```

Mock 不能替代真实协议资格认定。
