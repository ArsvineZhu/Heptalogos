# S04 配置、Secret 与 Management Surface

## 1. 核心原则：Configure First, Expose Intentionally

Heptalogos 必须优先建立丰富、typed 的 Configuration Surface。

```text
Configuration exists
```

与：

```text
ordinary user can see it
ordinary user can edit it
```

完全正交。

因此：

> 不能因为当前 UI 不想显示某个参数，就把它留成 hardcoded literal。

---

## 2. 所有行为影响值必须分类

每个行为影响值必须明确归类为：

```text
PRODUCT_INVARIANT
INSTALLATION_CONFIG
SUBJECT_CONFIG
RESOURCE_CONFIG
SECRET
DERIVED_STATE
IMPLEMENTATION_CONSTANT
```

禁止未分类的：

```text
timeout
retry count
TTL
concurrency
limit
backoff
threshold
sampling rate
retention
endpoint
feature toggle
platform-specific behavior value
```

---

## 3. 类型

Configuration Surface 至少支持：

```text
boolean
integer
number / float
string
enum
duration
byte-size
JSON object
typed object
array/list
oneOf/union
nullable/optional
SecretRef
resource ref
```

复杂资源不必强制变成平铺 key/value。

例如：

```text
ModelProfile
MessagingAccount
CapabilityPolicy
```

可以使用 dedicated resource model，同时仍注册 Management Surface metadata。

---

## 4. ConfigurationDefinition

完整 metadata：

```text
id
owner
classification
scope
type/schema
default authority
constraints
visibility
manageability
activation
sensitivity
platform applicability
deployment applicability
description
group/order
runtime consumers
portability
version
```

---

## 4.1 Configuration Source Binding

每个 config namespace/resource 绑定一个 current write Authority：

```text
BOOTSTRAP_FILE
MANAGED_REVISION
DECLARATIVE_FILE
OWNER_NATIVE
DERIVED_READ_ONLY
```

`ConfigurationDefinition` 与 storage backing 正交。

`MANAGED_REVISION` 可以使用 PostgreSQL canonical revision；Foundation core managed namespaces 必须提供 versioned human-readable non-authority projection/export。

`DECLARATIVE_FILE` 由 scoped ConfigWorkspace 中的文件拥有 Authority，并通过注册的 `ConfigurationCodec` 解析/序列化；invalid source 不覆盖 runtime LKG。Management 修改按 source digest CAS + atomic replace。Foundation built-in codec 至少包括 TOML 与 JSON。YAML 等格式只有在 owner-native 使用或显式贡献对应 codec 时才进入 typed declarative management。

`OWNER_NATIVE` 允许 Extension/Domain 保留自己的格式/parser。字段级 CLI/API 管理通过可选 `ConfigurationProjection/ConfigAdapter` 加入；没有 projection 时只提供 lifecycle/reload/status/backup 管理。

Foundation 自己提供的 TOML-backed bootstrap/declarative codec 使用 `js-toml` 2.x behind `ConfigurationCodec`；JSON codec 使用 Node JSON primitives + `SchemaRuntime` validation。不得手写 TOML parser。YAML/其他 owner-native 格式不因此变成 Foundation mandatory dependency。

Secret plaintext 在所有 source kind 中仍禁止进入普通 config。

---

## 5. Visibility

canonical 值：

```text
NORMAL
ADVANCED
EXPERT
INTERNAL
HIDDEN
```

`INTERNAL/HIDDEN` 仍然是正式 ConfigurationDefinition。

它们只是默认不进入普通用户 projection。

---

## 6. Manageability

canonical 值：

```text
EDITABLE
READ_ONLY
SYSTEM_MANAGED
PRODUCT_LOCKED
```

visibility 与 manageability 不绑定。

例如：

```text
NORMAL + READ_ONLY
EXPERT + EDITABLE
HIDDEN + SYSTEM_MANAGED
```

都合法。

---

## 7. Scope

至少：

```text
installation
subject
resource
```

resource 可指：

```text
MicroSystem instance
Driver account
Provider profile
Feature
Extension resource
```

owner 与 scope 分离。

---

## 8. Default Authority

default 必须说明来源：

```text
PRODUCT_DEFAULT
PLATFORM_DEFAULT
PROVIDER_DEFAULT
EXTENSION_DEFAULT
AUTO_DETECTED
SUBJECT_BASELINE
NO_DEFAULT
```

如果继承第三方库默认值，要显式记录。

否则 dependency upgrade 可能悄悄改变行为。

Behavior-affecting default 不能在每次读取时简单“取当前代码/库默认值”。Active ConfigurationRevision 必须记录 effective value 的来源与 `definition/default revision`；首次 materialization 后，同一 active revision 的 effective value 在 Product/Extension upgrade 后保持稳定。

当新 generation 改变 default：

```text
explicit user value
  → unchanged

materialized default from older definition
  → remain pinned until config migration/explicit rebase

new configuration key with no previous value
  → may materialize the new declared default through a new revision
```

若产品希望采用新 default，必须通过 Configuration migration/SystemChangePlan 生成新的 canonical revision，而不是让 dependency update 暗中改变运行行为。

---

## 9. Constraint Envelope

区分：

```text
recommended range
editable range
hard product invariant
```

例如 user 可以调整 worker concurrency，但不能越过会破坏稳定性的 hard maximum。

---

## 10. Activation

配置项声明：

```text
LIVE
RELOAD_COMPONENT
RESTART_COMPONENT
RESTART_SUBJECT
RESTART_HOST
MAINTENANCE
NEXT_BOOT
IMMUTABLE_AFTER_INIT
```

SystemChangePlan 计算多个变更的综合影响。

---

## 11. Platform / Deployment Applicability

明确：

```text
windows / macos / linux / all
portable / native-user / system-service / development / production
```

禁止业务代码中出现没有分类的 platform-specific magic values。

---

## 12. Runtime Consumer

每个可变 ConfigurationDefinition 必须有真实 consumer。

可追踪：

```text
Definition
→ Source / SourceRevision
→ ConfigurationRevision
→ Activation
→ Runtime Consumer
```

Definition 存在但代码仍读 hardcoded literal 属于配置一致性错误。

---

## 13. Revision 与 Activation

核心对象：

```text
ConfigurationDefinition
ConfigurationSource / SourceRevision
ConfigurationRevision
ConfigurationActivation
```

`ConfigurationRevision` 是来源无关的 semantic version reference，不要求 physical value 存在 PostgreSQL。DECLARATIVE_FILE 的当前文件仍是 write Authority，但每个已验证/激活 source digest 必须有 immutable historical materialization/ref；OWNER_NATIVE 记录 owner source version/digest 与可选 typed projection。

关键：

```text
source/proposal changed != active
```

流程：

```text
observe/propose source revision
→ schema validation
→ semantic validation
→ SecretRef validation
→ impact plan
→ Policy / Approval
→ activate
→ RuntimeReconcile
→ verify postconditions
```

失败则旧 active value 保持 Authority。

`ConfigurationRevision` 一旦 committed 必须 immutable。Historical revision 不能仅因“不再 active”立即删除：WorkItem、SystemChangePlan、Replay、Evidence 或 retained old Generation 仍引用它时必须可读取；只有无 durable refs 且 retention/data-lifecycle policy 允许时才可 purge。

Runtime read 必须能返回 `effectiveRevisionId + value-source/default-definition revision`，使 Lineage/Replay 能说明一次执行实际使用了哪版配置。

---

## 14. JSON Schema

外部 contract：

```text
JSON Schema 2020-12
```

first-party authoring 可用 TypeBox。

Ajv 做 schema validation mechanics。

Extension schema 被视为 untrusted declarative input：

```text
dialect validated
namespace bounded
no arbitrary remote $ref
bounded compile
bounded validation input/depth/regex-pattern complexity
no Extension-defined executable/custom Ajv keyword/format code
no plaintext Secret default
```

---

## 14.1 Canonical SchemaRuntime

Canonical external/config/Management schema 使用 JSON Schema 2020-12。Runtime validation 使用独立 `SchemaRuntime` adapter（TypeBox authoring + Ajv 2020 mechanics），其 canonical validation profile 必须：

```text
strict schema checks
coerceTypes = false
useDefaults = false
removeAdditional = false
no implicit mutation of caller input
registered x-heptalogos-* annotations
bounded/controlled $ref resolution
```

默认值由 `ConfigurationDefinition`/Default Authority 显式 materialize；未知字段要明确 reject/diagnose，不能由 HTTP validator 静默删除。

Fastify route validator/serializer 只是 transport adapter，不能改变 canonical schema semantics。若某 transport serializer 对 canonical dialect 支持不足，应采用兼容 projection/普通 JSON serialization，而不是降低 Authority schema dialect。

需要稳定 digest 的 JSON 先通过 `CanonicalJson`（RFC 8785 JCS semantics）再 hash。

---

## 15. Presentation Annotations

可使用：

```text
x-heptalogos-scope
x-heptalogos-visibility
x-heptalogos-manageability
x-heptalogos-activation
x-heptalogos-sensitivity
x-heptalogos-unit
x-heptalogos-group
x-heptalogos-order
x-heptalogos-platform
```

annotation 只是 metadata，不授予 Authority。

---

## 16. Management Projection

Registry 可投影：

```text
Normal Settings
Advanced Settings
Expert/Diagnostics
CLI
Operator readable context
Internal SystemAction
```

普通用户只看到 curated projection。

因此大量正式配置与极简 UI 完全兼容。

---

## 17. Generic Management / CLI

普通 `ConfigurationDefinition` 应自动获得：

```text
describe
list
get
validate
propose
show diff/impact
activate
reset-to-default when allowed
```

CLI 是 Foundation 的 complete reference client。

```text
Registry
→ authorized Management Projection
→ CLI
```

未来 Web/GUI 只消费相同的 projection；Foundation 不冻结或实现具体 Web renderer。

---

## 18. SecretRef、BootstrapKeyProvider 与 Secret Backend

正常配置只保存：

```text
SecretRef
```

`SecretService` 负责正常 provider/Extension/business secret material，不保存 plaintext 到 Configuration。

必须另行存在最小 `BootstrapKeyProvider`，仅用于 normal services 启动前必须可解锁的 installation bootstrap material，例如 private PostgreSQL bootstrap credential、受保护 bootstrap metadata、必要 installation root key wrapping material。

```text
BootstrapKeyProvider
!= SecretService
```

前者不得依赖 PostgreSQL/normal Configuration/Extension runtime，避免启动环；后者可以在 canonical runtime ready 后使用 OS keyring/vault/composed backend。

统一要求：

```text
no plaintext fallback
no secret in argv/env/log/Evidence/Activity
caller + purpose scoped resolution
rotation/rebind metadata
lost-key state explicit
headless/service behavior explicit
```

Secret backend strategy 已冻结为 platform-composed OS credential/keyring providers：适用 deployment profile 首选 `@napi-rs/keyring` Node adapter；service/headless profile 可使用独立 platform provider/provisioning path。Architecture 冻结的是两层 trust-material hierarchy 与 no-plaintext-fallback，不假设一个 user-session keyring package 覆盖所有 profile。

### Secret Delivery Modes

`SecretRef` resolution 需要显式 caller + purpose + delivery mode。优先级：

```text
IN_MEMORY_SCOPED_API
PIPE_OR_FD
RESTRICTED_EPHEMERAL_FILE
CHILD_ENV_REQUIRED
```

`CHILD_ENV_REQUIRED` 只用于外部工具/SDK 明确没有更安全输入通道的情况：

```text
construct a clean per-child environment allowlist
inject only required secret keys
never mutate/inherit from Host global environment as a secret store
prevent propagation to unrelated descendant processes where controllable
never log/dump environment
lifetime bounded to the target child process
record delivery mode/purpose, never plaintext, in lineage/audit when significant
```

禁止把 password/session token/Secret plaintext 放进 CLI argv、shell history、普通 parent environment、配置文件或长期临时文件。

### Secret Portability Metadata

Secret metadata 必须包含 restore/export portability class：

```text
PORTABLE_ENCRYPTED | EXTERNAL_REFERENCE | REBIND_REQUIRED | NON_EXPORTABLE
```

分类是 Secret-owning service 的 contract，不由 BackupService 根据 backend 猜测。BootstrapKeyProvider root material 默认 `NON_EXPORTABLE`。

## 19. Derived State

不能把以下内容误做 config：

```text
current health
last probe
detected memory pressure
current queue backlog
selected provider actual state
```

但控制自动策略的参数可以是 config。

---

## 20. Auto Tuning

自动调参不能绕过 Authority。

可以：

```text
AutoTuner
→ Revision proposal
→ activation
```

或：

```text
SYSTEM_MANAGED field
```

并记录 Evidence。

不能只改 runtime memory。

---

## 21. Extension Config

Extension 可以自由选择配置格式/backing：

```text
MANAGED_REVISION
DECLARATIVE_FILE (registered codec; built-in TOML/JSON)
OWNER_NATIVE
```

进入统一字段级 Configuration Surface 的 projected config 必须声明 typed schema、owner/scope、visibility/manageability、activation、permission、consumer 与 source binding。

纯 OWNER_NATIVE config 不要求把内容复制到 PostgreSQL，但必须使用 scoped ConfigWorkspace并声明 config version、sensitivity、reload/activation、backup/portability；可选 ConfigAdapter 提供 typed projection。

Package disable/uninstall 不自动删除配置或配置历史。

---

## 22. Static Configuration Audit

仓库需要检查：

```text
numeric literals in behavior paths
timeouts
retry/backoff
TTLs
limits
concurrency
sampling
retention
endpoint strings
feature toggles
platform condition values
```

检查器只要求：

```text
classification exists
```

不是机械把所有 literal externalize。

显式 `IMPLEMENTATION_CONSTANT` / `PRODUCT_INVARIANT` 可以消除警告。

---

## 23. Conformance Tests

至少验证：

```text
Definition schema valid
default valid
active value valid
consumer exists
activation implemented
visibility/manageability valid
SecretRef not plaintext
platform applicability
removed/renamed config migration
Extension namespace collision
Management/CLI projection
```

---

## 24. Documentation

ConfigurationDefinition 是文档真相源之一。

自动生成：

```text
Management/CLI help
Operator context
reference documentation
schema docs
```

避免 hand-written docs 与 runtime 漂移。

---

## 25. 不变量

1. `Config existence != visibility != editability`。
2. Behavior-affecting literal 必须先分类。
3. INTERNAL/HIDDEN 仍然是正式 typed config。
4. 普通 UI 只展示 curated subset。
5. default 必须有 Authority。
6. 类型不限于 scalar。
7. `source/proposal changed != active`。
8. 可变配置必须有 runtime consumer。
9. platform/deployment differences 必须显式。
10. Config / Secret / Derived State / Product Invariant 必须分离。
11. Generic Management/CLI projection 优先；Presentation implementation 独立。
12. Configuration Surface 是系统治理基础设施，不是 UI 附件。
