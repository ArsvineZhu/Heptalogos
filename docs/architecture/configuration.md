# 配置治理与 Configuration Surface

## 1. Foundation 级原则

Heptalogos 对配置采用：

> **Configure First, Expose Intentionally。**

也就是：

```text
先判断一个行为影响值是否应成为正式配置
        ↓
如果是，则进入 typed Configuration Surface
        ↓
再独立决定：
  谁能看到？
  谁能修改？
  在哪里展示？
  何时生效？
```

因此以下三个问题必须完全分离：

```text
Configuration existence
User visibility
User editability
```

它们不是同一个布尔值。

---

## 2. 为什么要“先有大量可配置项”

Heptalogos 是：

```text
跨 Windows / macOS / Linux
支持 development / production 不同部署形态
长期运行
包含多种 Driver / Provider / Feature
高度依赖 AI、网络、媒体、Memory、Durable Work
面向研究与原型演化
```

这意味着许多今天看起来只是“一个合理默认值”的 literal，未来都可能因为：

```text
平台差异
设备性能
Provider 差异
网络质量
用户习惯
Subject 行为偏好
研究实验
Extension
安全策略
```

需要改变。

如果这些值先散落在代码里：

```text
const RETRIES = 3
const TTL = 86400
const MAX_TOOL_CALLS = 16
const MAX_IMAGE_BYTES = 25 * 1024 * 1024
```

以后每暴露一个设置，都需要重新：

```text
定位 literal
设计 schema
迁移默认值
写 API
写 CLI
写 Web
补验证
处理 activation
```

长期会形成大量配置债务。

因此 Foundation 默认要求：

> **Behavior-affecting literal 必须先接受配置分类审查，而不是默认归类为 implementation constant。**

---

## 3. 不是“所有常量都必须配置化”

正确规则不是：

```text
literal → config
```

而是：

```text
behavior-affecting literal
→ configuration classification
→ explicit result
```

允许的分类至少包括：

```text
PRODUCT_INVARIANT
INSTALLATION_CONFIG
SUBJECT_CONFIG
RESOURCE_CONFIG
SECRET
DERIVED_STATE
IMPLEMENTATION_CONSTANT
```

例如：

```text
SHA256 digest length
JSON schema version constant
protocol fixed opcode
```

通常可以是：

```text
IMPLEMENTATION_CONSTANT
```

而：

```text
retry attempts
timeout
queue concurrency
media size limit
memory retrieval count
retention TTL
reconnect backoff
tool-call budget
```

通常都必须先审查是否属于 Configuration Surface。

---

## 4. ConfigurationDefinition 是完整的产品合同

一个正式配置项不是：

```text
key + value
```

而至少包含以下正交元数据。

```text
ConfigurationDefinition
├─ id
├─ owner
├─ classification
├─ scope
├─ type / schema
├─ default authority
├─ constraints
├─ visibility
├─ manageability
├─ activation
├─ sensitivity
├─ platform applicability
├─ deployment applicability
├─ description
├─ group / order
├─ runtime consumers
├─ portability
└─ version
```

---

## 5. 类型系统

Configuration Surface 必须支持真实产品所需类型，而不是只支持 string/number。

至少包括：

```text
boolean
integer
number / float
string
enum
duration
byte-size
timestamp / time-window where appropriate
JSON object
typed object
array / list
set-like list
union / oneOf
nullable / optional
SecretRef
resource reference
```

复杂配置优先使用 JSON Schema 2020-12 建模。

如果某配置本质是复杂资源，例如：

```text
ModelProfile
MessagingAccount
CapabilityPolicy
ApprovalPolicy
```

可以使用 dedicated resource API，而不是强行降级为平铺 key/value。

---

## 6. Scope

配置至少区分：

```text
installation
subject
resource
```

其中 `resource` 可进一步指向：

```text
MicroSystem instance
Driver account
Provider profile
Feature
Extension
Conversation policy
```

`scope` 与 `owner` 不同。

例如：

```text
Milky package 定义一个配置项
但具体值属于某个 MessagingAccount resource
```

---

## 7. Visibility

`visibility` 决定普通管理界面是否展示。

canonical 值：

```text
NORMAL
ADVANCED
EXPERT
INTERNAL
HIDDEN
```

### NORMAL

绝大多数用户可以理解并可能需要调整。

### ADVANCED

高级用户/诊断时使用。

### EXPERT

影响系统行为较深，错误配置可能造成明显问题。

### INTERNAL

正式 ConfigurationDefinition，但普通 UI 默认不展示；主要用于 CLI、诊断、自动调优或内部管理。

### HIDDEN

存在于正式配置系统，但不进入普通管理 projection。通常仅由受控 SystemAction 或 migration 修改。

关键原则：

> `INTERNAL/HIDDEN` 不等于 hardcoded。

---

## 8. Manageability

`manageability` 与 visibility 分离。

canonical 值：

```text
EDITABLE
READ_ONLY
SYSTEM_MANAGED
PRODUCT_LOCKED
```

可能出现：

```text
visibility = EXPERT
manageability = EDITABLE
```

也可能：

```text
visibility = NORMAL
manageability = READ_ONLY
```

甚至：

```text
visibility = HIDDEN
manageability = SYSTEM_MANAGED
```

---

## 9. 默认值必须有 Authority

禁止：

```text
开发者随手觉得 3 合适
→ default = 3
```

所有 default 应说明来源，例如：

```text
PRODUCT_DEFAULT
PLATFORM_DEFAULT
PROVIDER_DEFAULT
AUTO_DETECTED
SUBJECT_BASELINE
EXTENSION_DEFAULT
NO_DEFAULT_REQUIRED
```

重要 distinction：

```text
schema default
!= current active value
!= provider remote default
```

如果采用第三方 library 的默认值，也应明确：

```text
inherit library default
```

还是：

```text
Heptalogos pins explicit default
```

否则 library upgrade 可能静默改变行为。

---

### 9.1 Effective default pinning

Behavior-affecting default 是 canonical behavior input，不应在依赖/ProductGeneration 升级后按“当前代码默认值”静默漂移。ConfigurationRevision 记录 value source 与 definition/default revision；已经 materialize 的默认值保持 pinned。采用新默认值必须产生新的 revision/config migration/SystemChangePlan。

## 10. Constraints 与 Safety Envelope

可编辑不代表无限制。

例如：

```text
retry.maxAttempts:
  user editable: 0..10
  product hard maximum: 100

media.maxBytes:
  user editable within platform/product envelope

worker.concurrency:
  can be auto or user value
  bounded by system constraints
```

应区分：

```text
recommended range
editable range
hard invariant
```

这样既保留丰富配置，又不把内部安全边界暴露成“用户想填什么都行”。

---

## 11. Activation

每个配置项必须说明变更怎样生效：

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

不能让 UI/CLI 猜。

多个配置一起变更时，`SystemChangePlan` 应计算最大影响闭包。

---

## 12. Platform / Deployment Applicability

跨平台配置必须明确：

```text
all
windows
macos
linux
```

以及部署环境：

```text
portable
native-user
system-service
development
production
```

不可使用：

```text
if (process.platform === ...)
  const timeout = ...
```

散落在业务代码中，而没有 ConfigurationDefinition / Platform invariant 分类。

---

## 13. Runtime Consumer 必须真实存在

每个动态配置必须能追踪到：

```text
Definition
→ Source / SourceRevision
→ ConfigurationRevision
→ Activation
→ Consumer
```

禁止“假配置”：

```text
Web 显示可以改
配置 source/revision 被接受
但 runtime 仍使用 hardcoded literal
```

Configuration conformance test 必须检查 consumer binding。

---

## 14. Configuration Source / Revision / Activation

`ConfigurationSourceKind` 的 canonical 集合为：

```text
BOOTSTRAP_FILE
MANAGED_REVISION
DECLARATIVE_FILE
OWNER_NATIVE
DERIVED_READ_ONLY
```

- `BOOTSTRAP_FILE`：normal PostgreSQL/ConfigurationService 之前必须可读的最小 bootstrap configuration；不承载普通业务 state。
- `MANAGED_REVISION`：managed value/revision 是写入 Authority。
- `DECLARATIVE_FILE`：当前文件是写入 Authority；validated digest/materialization 形成 immutable revision/ref。
- `OWNER_NATIVE`：owner-native source 保持写入 Authority，可选投影 typed fields 到 Management。
- `DERIVED_READ_ONLY`：由其他 Authority 派生，只读，不接受独立写入。

采用来源无关的语义 revision：

```text
ConfigurationDefinition
ConfigurationSource / SourceRevision
ConfigurationRevision
ConfigurationActivation
```

`ConfigurationRevision` 不等价于“PostgreSQL 里的 value”。

- `MANAGED_REVISION`：revision 可以直接持有 managed value。
- `DECLARATIVE_FILE`：文件是当前写入 Authority；验证成功后系统为其 digest/materialization 生成 immutable historical revision/snapshot，用于 Lineage/Replay/rollback，但历史 snapshot 不是第二个 editable source。 Typed management 通过注册的 `ConfigurationCodec` 解释；Foundation built-in codec 为 TOML/JSON，其他格式由 owner/contribution 提供。
- `OWNER_NATIVE`：revision 记录 owner 报告的 source version/digest 与可选 projected values；原生 backing 仍由 owner 拥有。

关键：

```text
source/proposal changed != active
```

流程：

```text
source/proposal observed
→ structural validation
→ semantic validation
→ SecretRef validation
→ impact plan
→ Policy / Approval if required
→ activate
→ RuntimeReconcile
→ postcondition verification
```

失败时旧 active revision 保持 Authority。

---

### Historical revision retention

Committed `ConfigurationRevision` immutable。只要 WorkItem、Plan、Replay、Evidence 或 retained generation 仍持 revision ref，就必须保留可读；不再 active 不等于可删除。运行时与 Lineage 记录实际 effective revision。

## 15. Presentation 是 Configuration Surface 的投影

普通用户不应该看到“所有配置”。

正确结构：

```text
Configuration Registry
       │
       ├─ Normal Settings projection
       ├─ Advanced Settings projection
       ├─ Expert / Diagnostics projection
       ├─ CLI projection
       ├─ Operator Assistant readable projection
       └─ Internal SystemAction projection
```

因此：

> **配置项数量可以很多，但普通设置页仍然可以极简。**

这是产品 UX 与内部可治理性的关键分离。

---

## 16. Management / CLI Projection

普通 `ConfigurationDefinition` 必须自动获得 typed Management capabilities：

```text
describe
list
get
validate
propose revision
show diff/impact
activate
reset-to-default when allowed
```

CLI 是 Foundation 的完整 reference projection，必须能够在不依赖 Web UI 的情况下管理所有受权配置。

```text
Configuration Registry
→ Policy / visibility / manageability / platform filter
→ Management Projection
→ CLI
```

未来 Web/GUI renderer 只消费同一 projection。Foundation 不选择或实现具体 Web form renderer。复杂 Presentation 也不能反向修改 canonical Configuration schema。

---

## 17. Operator Assistant

Operator Assistant 可以：

```text
查询 Definition
解释配置含义
比较 active/proposed
生成修改 proposal
展示 impact
```

但 mutation 仍走：

```text
SystemAction
→ SystemChangePlan
→ Policy
→ Approval
→ ConfigurationActivation
```

对于：

```text
EXPERT
INTERNAL
HIDDEN
```

配置，Operator 是否可看到/修改由 Policy + Presentation projection 决定。

---

## 18. Extension Configuration

Extension 配置的**格式和物理 backing 属于 Extension 开发自由**。允许 TOML/YAML/JSON、owner-specific 文本/二进制配置，或选择 Foundation `MANAGED_REVISION`。

若 Extension 把某配置投影进统一 Configuration Surface，则 projected field 必须：

```text
namespace
typed schema
owner/scope
visibility/manageability
activation
permission
runtime consumer
source binding
```

若 Extension 使用纯 `OWNER_NATIVE` 配置而不提供字段投影，仍必须声明 config version、scoped ConfigWorkspace、sensitivity、reload/activation、backup/portability semantics；Foundation 不伪装理解其内部字段。

Package install 不等于配置 active。Extension disable/uninstall 不自动删除 ConfigurationRoot 中的配置；配置 migration 与 data migration 独立。

---

## 19. Config 与 Secret 分离

配置只保存：

```text
SecretRef
```

不能因为某字段在 schema 中显示为 password 就把 plaintext 当 ordinary config。

Secret input / rotation / reveal 是独立高安全流程。

---

## 20. Config 与 Derived State 分离

例如：

```text
detected CPU count
last successful health probe
computed queue pressure
auto-selected capability provider
current cache size
```

通常是 derived/runtime state，不应该伪装成 user config。

但“是否使用 auto”和“auto policy 参数”可能是配置。

---

## 21. Auto-tuning

未来系统可以支持：

```text
manual
auto
adaptive
```

但 auto-tuner 不能绕过 Configuration Authority。

正确：

```text
AutoTuner
→ ConfigurationRevision proposal
→ policy/activation path
```

或使用明确的 `SYSTEM_MANAGED` active field。

不能在 runtime memory 中静默漂移行为参数而没有 Evidence。

---

## 22. 配置审查器

仓库需要静态/半静态检查，寻找：

```text
behavior-affecting numeric literals
timeouts
retry counts
TTLs
limits
concurrency
backoff
sampling rates
retention
thresholds
URLs/endpoints
feature flags
platform-specific values
```

检查结果不是“全部自动转 config”，而是：

```text
必须有 classification
```

允许通过显式注解/旁注证明：

```text
IMPLEMENTATION_CONSTANT
PRODUCT_INVARIANT
```

---

## 23. 配置完整性测试

至少验证：

```text
all Definitions have valid schema
default validates
active value validates
consumer exists
activation semantics implemented
visibility/manageability valid
SecretRef never stored plaintext
platform applicability respected
removed Definition migration handled
Extension namespace collision rejected
```

---

## 24. 配置漂移与文档

ConfigurationDefinition 本身应成为机器可读文档源。

生成：

```text
CLI help
Web help
Operator context
reference docs
schema docs
```

避免手写“配置文档”和 runtime 实现长期漂移。

---

## 25. 核心不变量

1. `Config existence != visibility != editability`。
2. Behavior-affecting literal 必须先分类。
3. INTERNAL/HIDDEN config 仍应正式 typed。
4. 普通用户 UI 可以只暴露少量 curated settings。
5. default 必须有明确 Authority。
6. 配置类型不限于 scalar。
7. `source/proposal changed != active`。
8. 每项可变配置必须有真实 runtime consumer。
9. platform/deployment difference 必须显式分类。
10. Config / Secret / Derived State / Product Invariant 必须分离。
11. Generic Management/CLI projection 必须完整，Presentation renderer 独立选择。
12. Configuration Surface 是系统可治理性的基础，不是单纯“设置页”。
