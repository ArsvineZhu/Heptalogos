# 架构原则与反 NIH 约束

> 长期稳定的项目宪法与工程宪法见 `constitution.md`。

## 1. Library-First 是 Foundation 级约束

Heptalogos 的创新预算应优先投入 Subject continuity、IM-native cognition、行为决策、自主性与研究评估，而不是重新发明 generic infrastructure。

默认顺序：

```text
Standard / OS facility
→ Mature library
→ Mature framework + narrow adapter
→ Composition of mature primitives
→ Custom implementation only with evidence
```

典型 library-first 领域：

```text
DI / scope / lifecycle
DAG / state machine
queue / durable workflow / timers
HTTP / protocol clients
schema validation
package acquisition
media codecs
observability
CLI framework
crypto primitives
```

### Mandatory current mechanics preflight

Before adding non-trivial generic mechanics, inspect the semantic owner, the
existing repository primitive or adapter, the adopted provider role, the
Standard/Node/OS facility, a mature library or framework, and narrow
composition or adapter options in that order. Avoiding an adopted dependency
and writing local generic mechanics is not a conservative default; it transfers
upstream maintenance to Heptalogos and requires concrete current evidence.

Trivial language operations and Heptalogos-specific semantic logic remain
local. A custom generic mechanic is admitted only when the prior routes cannot
meet the current requirement and the maintenance, lifecycle, concurrency,
security, and platform burden is explicit.

---

## 2. Semantic Ownership 与 Mechanics Ownership 分离

例如：

```text
Readiness Profile
RuntimeReconcile semantics
WorkItem semantics
EffectOperation semantics
SystemAction semantics
```

属于 Heptalogos。

但：

```text
dependency graph mechanics
resource scope/disposal
queue scheduling
workflow recovery
HTTP transport
policy evaluation
```

应优先交给成熟方案。

`Heptalogos owns semantics` 不是自研 generic mechanics 的理由。

### Mechanics Ownership Before Local Implementation

Every implementation must distinguish four roles:

```text
semantic owner
  owns Heptalogos meaning, Authority, and product invariants

mechanics provider
  owns generic lifecycle, parsing, graph, process, schema, or other mechanics

adapter owner
  keeps the provider behind a Heptalogos contract and applies local policy

consumer
  uses the adapter/owner without instantiating a parallel provider
```

The lookup order is existing Heptalogos owner, adopted dependency route,
Standard/Node/OS facility, mature library behind a narrow adapter, composition
of mature primitives, and custom implementation only with explicit evidence.
An `ADOPTED` route plus an existing owner closes provider selection for ordinary
implementation. Missing owner API is a reason to extend the owner, not to copy
its mechanic into a consumer.

---

## 3. Adapter 是默认隔离层

```text
Heptalogos Contract
        ↓
thin adapter
        ↓
mature implementation
```

Adapter 用于：

```text
保护 Authority 与 domain vocabulary
隔离第三方 API
约束资源和权限
允许替换 implementation
保留上游 generic mechanics
```

只有 adapter 为维持语义而产生大量重复 runtime、双重 lifecycle 或脆弱 glue 时，才构成拒绝候选的证据。

---

## 4. 自研 generic Foundation mechanics 的批准条件

必须回答：

1. 同类成熟方案有哪些？
2. 需求与现有抽象的差异是命名差异还是真正语义冲突？
3. 能否以窄 adapter 隔离？
4. 采用方案可删除多少 custom code/test/ops burden？
5. 方案引入多少 runtime、升级、安全、跨平台和认知负担？
6. 自研后由谁承担并发、泄漏、恢复、升级和安全边界？
7. 这是否属于产品研究差异化？
8. 是否已经获得最小充分证据证明成熟方案不合适？

没有证据不得以“更干净”“依赖少”“自己写很简单”为理由自研。

---

## 5. 依赖决策使用两个正交维度

机器可读 Authority：`project/qualification/dependency-status.json`。

### `ADOPTED` 的实现含义

`ADOPTED` 不是“我们大概喜欢这个库”，而是该角色的**实现路由已经冻结**。

```text
ADOPTED role encountered in implementation
→ consult `project/dependencies/dependency-routing.json`
→ use selected dependency through the declared adapter boundary
```

编码 Agent 不得把“不新增依赖”当作更保守的默认策略。对已经采用的角色，主动回避依赖而手写 mechanics 本身就是架构偏离。

只有两种合法例外：

1. 当前工作根本不需要该 role；
2. 已发现具体 hard blocker，并正式重新打开 RoleDecision/qualification。

不存在“先写个简版 custom fallback，以后再换”的默认例外。

### Version / maturity evidence

Package identity, compatible line and role are Architecture decisions; exact direct versions are repository Catalog decisions backed by **current** registry/upstream evidence.

```text
model memory
old Corpus patch number
stale lockfile
"stable is always safer"
```

都不是 exact version Authority。

Prerelease/RC/beta/`0.x` 是 maturity evidence，而不是自动 reject 条件。若 prerelease 提供真实需要且维护历史、测试、使用面、API churn、blast radius、exact pin/rollback 与 closure 风险可接受，可以采用；stable line 已完整满足角色时也不得只为追新而切 prerelease。

Repository language baseline 见 `../engineering/repository/toolchain.md`：TypeScript 7 primary + ESNext/NodeNext/ESM-first，TS6 仅为受隔离的 compiler-API compatibility lane。

### `RoleDecision`

```text
ADOPTED
PRIMARY_CANDIDATE
UNRESOLVED
DEFERRED
REJECTED_FOR_ROLE
```

回答：

> 这个架构角色由谁承担？

### `ImplementationQualification`

```text
NOT_REQUIRED
REQUIRED
RUNNING
PASSED
FAILED
DEFERRED
```

回答：

> 具体 package/version/binary 是否已经证明可以进入目标产品？

因此完全合法：

```text
HTTP server mechanics
RoleDecision = ADOPTED
route = Fastify
ImplementationQualification = REQUIRED
```

也合法：

```text
Cedar policy model
RoleDecision = ADOPTED

Cedar JavaScript/WASM binding
RoleDecision = ADOPTED
route = @cedar-policy/cedar-wasm
ImplementationQualification = REQUIRED
```

不得用一个 `ADOPTED` 同时表达“架构角色已决定”和“最终三平台 artifact 已验收”。当前 Foundation baseline 的 provider selection 已收敛，因此 `PRIMARY_CANDIDATE/UNRESOLVED` 只作为未来新角色的临时治理状态，不属于当前 Implementation Plan 输入。

---

## 6. REJECTED 必须针对角色

例如：

```text
Effect as application-wide runtime
→ REJECTED_FOR_ROLE
```

并不禁止某个局部 subsystem 在有明确收益时使用 Effect。

```text
XState as global MicroSystem supervisor
→ REJECTED_FOR_ROLE
```

并不禁止复杂局部状态机使用稳定 XState。

---

## 7. 避免 Framework Capture

如果框架要求：

```text
Subject state = framework actor state
Authority = framework workflow completion
Extension package = framework plugin registry
WorkItem = framework queue object identity
```

则框架正在反向定义产品语义。

正确边界始终是：

```text
Framework provides mechanics
Heptalogos contract remains authoritative
```

---

## 8. 不同 Execution Domain 可以使用不同 substrate

统一的是：

```text
MicroSystem contract
Service / Capability / Contribution
Generation
Health / Readiness
Resource ownership
Authority ceiling
```

不是统一 runtime implementation。

例如：

```text
trusted in-process → qualified composition substrate
isolated process   → process/runtime boundary
WASM sandbox       → deferred sandbox runtime
external tool      → MCP / external protocol
Presentation       → client-side implementation outside Foundation runtime
```

---

## 9. Dependency Selection 必须 Evidence-First

依赖资格验证的目标是**消除具体不确定性**，不是提前实现产品。

### L0 — Direct Evidence

优先检查：

```text
official specification/docs
public API/types
source code
upstream tests
release/changelog
package metadata/dependency tree
license
supported platforms
known maintenance policy
```

如果这些证据已经足以判断一个角色，直接做架构决策。

### L1 — Micro Probe

只有一个关键性质无法从 L0 证明时，写最小、synthetic probe。

例如：

```text
3 fake services
1 dependency disappear/reappear
1 disposer failure
```

而不是 Milky + Config + Secret + Messaging + WorkQueue 的产品切片。

### L2 — Boundary Probe

只有候选基本机制可行，但与 Heptalogos contract 的映射成本仍未知时，写一个最薄 adapter，与 explicit/native baseline 比较。

### L3 — Product Qualification

在实现存在以后，用真实：

```text
shipping artifact
native OS
real PostgreSQL
real provider/protocol
crash/restart
service mode
upgrade/restore
```

证明产品实现。

**L3 不应成为选择库之前的前置条件。**

---

## 10. Framework Leakage Guard

Architecture contracts、domain semantics、public Extension API 与跨模块稳定接口不得暴露具体 mechanics/framework 类型。

默认禁止稳定合同依赖或返回：

```text
Fastify request/reply internals
DBOS workflow/queue runtime objects
Cordis Context / Effect internals
Kysely Database / raw pg Client/Pool
Pino logger implementation objects
OpenTelemetry Span/Context implementation objects
Cedar evaluator internals
package filesystem implementation handles
```

这些实现类型只存在于 adapter/mechanics 边界。Foundation 自有 `Problem`、`ExecutionContext`、Service/Capability contracts、repository ports、SystemAction、Activity descriptors 等稳定语义类型。

仓库必须通过 TypeScript project references / Nx dependency tags / ESLint 或等价静态检查机械约束依赖方向；`module boundary != workspace boundary`，不要求每个逻辑模块都成为独立 workspace package。

只有在一个 implementation-only package 内部、且该类型不会越过稳定边界时，才允许直接依赖具体框架类型。

---

## 11. Scope Guard

Foundation dependency selection 只研究 Foundation 当前必须承担的 generic mechanics。

不属于 Foundation dependency-selection scope：

```text
Persona implementation
Memory implementation / retrieval / index
Relationship / Attention / Reflection / Diary / Dream
Web visual stack
Web form renderer
microfrontend runtime
advanced Presentation technology
```

这些领域只保留 contracts/hooks；在对应阶段单独研究。

---

## 12. Management Contract 与 CLI 是 Foundation 验证面

管理能力先通过 typed contract 暴露，然后由 CLI 完整投影：

```text
Service / Domain
→ Management Contract / SystemAction
→ complete reference CLI
→ HTTP / protocol client
→ Web or other Presentation
```

如果一个 Foundation 管理能力无法通过 CLI inspect/configure/operate/diagnose，优先怀疑 Management Contract 不完整，而不是只补一个界面按钮。

---

## 13. Configuration-First

每个 behavior-affecting literal 必须先分类：

```text
PRODUCT_INVARIANT
INSTALLATION_CONFIG
SUBJECT_CONFIG
RESOURCE_CONFIG
SECRET
DERIVED_STATE
IMPLEMENTATION_CONSTANT
```

正式配置进入 typed `ConfigurationDefinition`，再独立决定：

```text
visibility
manageability
activation
presentation
```

普通 Presentation 只消费 curated projection。是否存在 Web UI 不影响 Configuration Surface 的完整性。

---

## 14. Executable Truth / Vertical Ratchet

```text
Foundation can grow only while the current executable spine remains green.
```

一旦 executable spine 存在，红色 spine 的修复优先于新增 Foundation capability，
除非已批准的 implementation plan 明确另有规定。

本项目的 `Executable Proof Level` 与 dependency-selection 的 L0–L3 不同：

```text
L1 package correctness
L2 real component composition
L3 process-level executable composition
L4 product vertical slice
```

H3 的目标是 Foundation L3 composition proof；H6 的目标是 real Product L4 Subject
slice。package/interface/test 数量不能替代相应 proof level。

## 15. Complexity Admission

在增加 high-risk complexity 前，当前 active plan 或 change rationale 必须记录：

```text
Current horizon:
Current consumer/invariant:
Failure class:
Failure/threat:
Impact if deferred:
Existing fail-closed behavior:
Mechanics owner/provider:
New state/branch/resource cost:
Why now:
Decision: IMPLEMENT | DEFER | REJECT
```

不要求为每个决定另建 standalone document。

该记录还必须说明当前 variability 或第二个 consumer、为什么 direct route
不足、以及 operational/test/documentation burden。REUSE_EXISTING、DIRECT_LOCAL、
ADD_MINIMUM_COMPLEXITY、DEFER、PLAN_GAP 是有效的工程决定；不存在 current
consumer、invariant、accepted failure model 或 explicit threat 时，不得以未来
复用或理论完整性为理由永久增加复杂度。

## 15.1 Testing Strategy

Verification strategy follows the claim and current uncertainty or risk. A
deterministic pure contract may start with a unit or property test; a
reproduced regression may start with a faithful failing regression; unclear
behavior may need characterization; unknown provider behavior needs upstream
evidence and, only if necessary, a narrow probe; cross-owner, process, live
provider, platform, and source-less claims require their corresponding proof
boundary.

TDD is one implementation technique, not a universal repository workflow or
Architecture Authority. Testability alone does not authorize a new interface,
factory, DI layer, wrapper, mock seam, product state, branch, or permanent
matrix. Exploratory failure injection can be removed after uncertainty is
resolved unless a current invariant requires the scenario.

## 16. New State Rule

```text
NEW STATE REQUIRES A NEW SEMANTIC DISTINCTION.
```

实现进度不会自动成为 product/durable lifecycle state。每次新增 state 都必须问：

> After process restart, does this distinction still matter to product truth or recovery?

如果不重要，优先使用 implementation-local variable，而不是 durable/public state。

## 17. Security Requires a Threat

“for security” 不是独立理由。新增 security complexity 前必须说明：

```text
asset
attacker/failure
trust boundary
consequence
current mitigation
```

## 18. Robustness Requires a Failure Model

“for robustness” 不是独立理由。Failure model 必须指出：

```text
what fails
when it can fail
what invariant would be violated
why current fail-stop behavior is insufficient
```

## 19. No Recursive Hardening

除非另有明确授权，禁止自动扩展为：

```text
rollback-of-rollback
recovery-of-recovery
fallback-of-fallback
```

## 20. Review Completion / Reopen Rule

For an authorized change, the default decision is `STOP` when all of the
following are true:

```text
the authorized change is complete;
its acceptance criteria are satisfied;
the required executable path is green; and
no observed/current authorized blocker remains.
```

Implementation may reopen only from new current evidence:

```text
an observed defect;
a failing current executable path;
an accepted current-Horizon failure case;
a current consumer or invariant; or
an explicit active-plan requirement.
```

The following do not reopen implementation by default:

```text
a newly imagined edge case;
theoretical non-perfect atomicity;
generic future-proofing, robustness, or security;
a failure only inside the newly-added recovery mechanism;
recovery-of-recovery;
a failure-injection test without an accepted failure model; or
a future consumer.
```

```text
A completed fix does not authorize another hardening pass.
```
