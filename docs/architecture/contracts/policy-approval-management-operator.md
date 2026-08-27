# S05 Policy、Approval、Management 与 Operator Assistant

## SystemAction Descriptor

```text
id/version
input/output schema
resource
effectClass
risk
reversibility
applyMode
plan
execute
verify
```

Action 有一个 owning Service。

---

## Common Projection

```text
SystemAction
├─ canonical Management Contract
├─ complete CLI projection
├─ HTTP/OpenAPI projection
├─ Operator AI tool projection
└─ future Presentation projection
```

Adapter 不重新定义 risk/auth/mutation。

---

## Planning

`plan()` 必须 side-effect-free，并由 `PlanningContext` 的能力面结构性保证。

可用：

```text
read-only canonical snapshots/query ports
RuntimeGraph/CapabilityGraph/Readiness projections
Configuration and Package metadata inspectors
pure impact/compatibility calculators
ExecutionContext/lineage identity
```

不可用：

```text
mutation transaction
network write
Secret plaintext
runtime lifecycle mutation
filesystem mutation
raw DBOS
root PostgreSQL/Kysely
```

真正执行使用独立 `ActionExecutionContext`。Plan 记录读取的 canonical revision/generation/preconditions、current `ContinuityEpochId`；执行前重新验证，stale 则 re-plan。任何 mutation execute 还必须通过当前 `HostOwnershipToken` transaction fence。

## Authentication / Session

### First administrator

仅 `FIRST_RUN_SETUP` 下存在一次性 local claim：高熵 claim secret plaintext 只保存在 installation-owner protected local run/bootstrap location；canonical DB 只保存 claim digest/state/expiry。CLI 经 loopback claim endpoint + TTY/stdin password 认领。

首管理员 transaction 必须原子完成：

```text
verify unused claim digest/expiry
assert Administrator count/state still allows first claim
create Administrator + Argon2id verifier + authEpoch
mark claim CONSUMED
record required audit/lineage refs
COMMIT
```

成功后 best-effort delete local claim plaintext，并永久关闭未认证 claim path。若 commit 后进程在删除本地 claim file 前 crash，下次启动看到 canonical `CONSUMED`/administrator exists，必须拒绝重复认领并清理 stale plaintext；不能覆盖现有 credential。

### Normal session

使用 opaque high-entropy session token + PostgreSQL server-side canonical session state：

```text
token digest
principalId
authEpoch
issued/expires
recentAuth
revoked/metadata
```

不把 principal/auth state 放在客户端可自行解释的 cookie payload 中。Session/claim/password plaintext 不进入 telemetry/Evidence/lineage。

### Restore invalidation

Destructive restore 创建新的 `ContinuityEpochId` 后：

```text
all normal sessions from restored snapshot → invalid through authEpoch/session reset
pending ApprovalRequest → SUPERSEDED_BY_RESTORE
in-flight/restored ManagementOperation → INTERRUPTED_BY_RESTORE unless fixed RecoveryOperation owns it
first-admin claim state → never re-opened when Administrator already exists
```

跨 installation restore 默认要求 local installation owner 完成 security/Secret rebind 检查后再开放 consequential Management。普通 database snapshot 不能复活旧 bearer session、旧 approval 或已经开始执行的管理动作。

## Cedar Authorization

Cedar 只做：

```text
ALLOW / DENY
```

Heptalogos 定义：

```text
principals
actions
resources
context
policy hierarchy
```

Product invariant policy 不可由 installation policy 放宽。

---

## Principals

至少：

```text
Administrator
Subject
MicroSystem
SystemService
```

Operator 使用：

```text
principal = Administrator
viaAgent = OperatorAssistant
```

---

## Approval

Approval 不是 authorization。

可能规则：

```text
L0 read-only → no approval
L1 direct explicit CLI/authorized client action → may not need second confirmation
Operator mutation → approval
L3/L4 → approval + recent auth
```

最终每 action 仍可更严格。

---

## Plan Binding

Approval 必须绑定：

```text
action id/version
resource
normalized args
plan digest
policy generation/preconditions
expiry
```

material impact 变化则 approval stale。

---

## ManagementOperation

durable execution instance。

System mutation 不由：

```text
HTTP request lifetime
AI generation lifetime
client process/session
```

拥有。

---

## Operator Assistant

输入结构化：

```text
RuntimeGraph
CapabilityGraph
BootReport
config surface
SystemAction
Evidence
operations
docs
presentation context
```

输出：

```text
explanation
SystemAction proposal
PresentationIntent
Approval projection
operation reference
```

---

## Forbidden

```text
arbitrary shell
arbitrary SQL
root filesystem write
raw Secret
raw DBOS
direct RuntimeGraph mutation
```

---

## Self-change

修改 Operator 自己仍走 action：

```text
operator model binding change
restart operator feature
update provider
```

operation 可在 Assistant 消失时继续。

---

## Execution Lineage

每个 `SystemAction.plan`、authorization、ApprovalRequest、execute、verify 与 terminal outcome 都属于同一 durable causation chain。Plan/Approval digest 使用 canonical JSON digest contract。

`ManagementOperation` 可以跨 CLI/browser/Operator session 继续，但必须保留 origin principal、viaAgent/channel、ActivityId、plan/approval refs。Operator 通过 `LineageQueryService` 获取结构化 causal chain，而不是把全文日志当 Authority。

---

## Failure

PolicyService unavailable：

```text
protected mutations fail closed
```

ApprovalService unavailable：

```text
approval-required actions blocked
```

Operator AI unavailable：

```text
CLI/normal Management API remain available
```

Recovery 不依赖以上全部正常。
