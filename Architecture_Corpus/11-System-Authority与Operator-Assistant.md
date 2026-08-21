# System Authority 与 Operator Assistant

## 1. 统一 SystemAction 模型

所有正式系统变更都建模为 typed `SystemAction`。

至少包含：

```text
id/version
input/output schema
target resource
effect/risk class
reversibility
apply mode
plan()
execute()
verify()
```

同一 SystemAction 可机械投影到：

```text
CLI
HTTP/OpenAPI
Operator Assistant tool schema
future Web/Presentation
Evidence vocabulary
```

业务逻辑不能复制到各客户端 adapter。

---

## 2. SystemChangePlan

所有 mutating action 先做 side-effect-free planning。该不变量必须由类型/能力边界约束，而不只靠代码审查：`plan()` 只接收 `PlanningContext`；真正执行接收独立 `ActionExecutionContext`。

`PlanningContext` 只允许 read-only snapshot/query ports、Runtime/Capability/Configuration projection、Package metadata inspector、纯 impact calculator 与当前 `ExecutionContext`。它不得暴露 mutation transaction、network write、Secret plaintext、runtime mutation、filesystem mutation、raw DBOS 或 root database handle。

Plan 至少包含：

```text
normalized input
target
canonical revision assumptions
affected MicroSystems/Services
capability gain/loss
Readiness impact
Subject impact
resource/pressure impact
data lifecycle impact
secret/key impact
network/external effect impact
restart/maintenance requirement
rollback strategy
preconditions
risk
approval requirement
```

Plan 与当前 canonical revisions/graph binding。

世界变化后：

```text
plan stale
→ re-plan
→ old approval invalid
```

---

## 3. Authentication / Authorization / Risk / Approval / Execution 分离

### Authentication

证明 administrator principal 与 authentication freshness。

### Authorization

PolicyService 判断：

```text
principal P
是否可对 resource R
执行 action A
在 context C 下
```

### Risk

产品定义影响等级。

### Approval

允许的动作是否仍要求人现在明确确认。

### Execution

owning System Service 实际执行。

---

## 4. Administrator Authentication

Foundation 只有一个管理员身份模型，并采用明确的首次认领与 server-side session 生命周期。

### First Administrator Claim

初次安装不存在默认账号或默认密码。`FIRST_RUN_SETUP` 下由 Bootstrap/Host 生成一次性高熵 claim secret，并仅写入 installation-owner 可读的本地 bootstrap/run location。

```text
local CLI
→ 读取一次性 claim secret
→ 密码通过 TTY/stdin 输入
→ loopback-only claim endpoint
→ validate canonical claim digest/state/expiry
→ atomic create Administrator + Argon2id verifier + authEpoch + mark claim CONSUMED
→ durable audit/lineage record（不含 secret/password）
→ delete local claim plaintext; canonical CONSUMED prevents replay
→ permanent close of unauthenticated claim path
```

约束：

```text
no password argv/env
no remote unauthenticated first-admin claim
one winner under Host/bootstrap ownership
crash-safe retry: commit-before-file-delete cannot reopen claim or overwrite credential
claim secret never enters logs/Evidence/telemetry
SubjectDesiredState initial default = STOPPED
```

### Normal Session

Foundation 使用高熵 opaque bearer session token；canonical session state保存在 PostgreSQL：

```text
session token digest
principalId
authEpoch
issuedAt / expiresAt
last/recentAuth metadata
revocation state
client/security metadata where needed
```

HTTP cookie 只携带 opaque token，并使用 `HttpOnly`、`Secure`（TLS exposure 时）、适当 `SameSite` 等属性。密码修改、管理员安全状态变化或显式 revoke 通过 `authEpoch/session state` 失效现有 session。

Session plaintext token 不进入日志、Evidence、Activity attributes。Authentication 不依赖 Operator Assistant、Subject 或 Web UI。

## 5. Cedar Policy Model

Cedar 承担 authorization evaluation mechanics：

```text
principal
action
resource
context
```

ProductGeneration 可以包含 installation policy 不得弱化的 invariant forbid，例如：

```text
Subject cannot perform normal System Authority mutations
Operator Assistant cannot reveal secret plaintext
untrusted Extension cannot change trust root
```

具体 Cedar JS/WASM binding 仍需 product qualification。

---

## 6. Operator Delegation

Operator Assistant 不成为“超级用户 principal”。

推荐：

```text
principal = Administrator
context.viaAgent = OperatorAssistant
```

因此 policy 可表达：

```text
administrator-direct = allowed
via AI agent = denied / approval-required
```

---

## 7. Approval

Foundation 默认保守：

```text
read-only authorized action
→ may auto execute

mutating action via Operator Assistant
→ explicit human approval

high-risk action
→ recent authentication + approval
```

未来 standing delegation 需要独立设计。

---

## 8. ApprovalRequest

Durable record 包含：

```text
principal
viaAgent/channel
SystemAction/resource
normalized input digest
SystemChangePlan digest
policy generation
risk
auth freshness requirement
created/expires
state
```

审批只授权精确 plan；input/plan digest 变化即失效。

---

## 9. ManagementOperation

批准后，长操作由 System Authority durable-owned：

```text
planned
awaiting-approval
approved
running
succeeded
failed
cancelled
uncertain
recovery-required
```

它独立于浏览器、CLI 进程和 AI session。

---

## 10. Operator Assistant 的本质

```text
AI
+
structured machine introspection
+
SystemAction proposal interface
```

它读取：

```text
BootReport
RuntimeGraph
CapabilityGraph
Readiness/Pressure
Configuration Surface
SystemAction Catalog
ManagementOperation
Evidence/Activity
documentation
```

而不是优先 grep logs 后猜系统状态。

---

## 11. 不提供 Arbitrary Shell

正常 Operator Assistant 禁止：

```text
arbitrary shell
arbitrary SQL
arbitrary filesystem mutation
raw package directory edit
raw DBOS control
raw secret reveal
raw trust-root manipulation
```

若未来确需 diagnostic shell，应作为独立高风险 sandbox capability 设计。

---

## 12. System Self-modification

Operator Assistant 修改自己所在系统仍通过普通 SystemAction：

```text
change operator model binding
install/upgrade extension
restart component
apply product update
rotate eligible credential/key
```

没有自修改特权。

---

## 13. PresentationIntent

例如：

```text
“打开 Milky 诊断”
“带我查看这个 Operation”
```

可以产生非 Authority `PresentationIntent`。

CLI 可将其表达为建议命令/resource ref；未来 Web/GUI 可表达为 navigation intent。

---

## 14. AuthorityHandoff

Subject 与 System 之间不共享 implicit permission。

```text
Subject Chat:
“升级 Milky”
→ AuthorityHandoff
→ System Authority
→ re-plan / authenticate / authorize / approve
```

反向：

```text
Operator:
“今晚别主动找某人”
→ Subject Authority handoff
→ Subject Governance path
```

Handoff 传 intent/context refs，不传 Authority。

---

## 15. Recovery Authority

如果 normal Policy/Management path 自己故障，Recovery Plane 仍需一个：

```text
small
fixed
local
strongly authenticated
AI-independent
```

的 bounded action set。

Recovery action 不等于正常 SystemAction 全集，也不等于 root shell。
