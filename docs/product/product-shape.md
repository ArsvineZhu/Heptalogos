# Product Shape

本页定义 Heptalogos 的产品构成、管理入口和 Authority 边界。精确请求
格式、状态字段与协议合同由 Specs 持有；外部 Presentation 的视觉实现
由独立的 Presentation repository 持有。

## 1. 产品中心

Heptalogos 是由 Product Host 长期承载的 persistent Subject 产品：

```
一个逻辑 Installation
        ↓
一个 current Product Host Authority
        ↓
一个 active logical Subject identity
```

当前产品模型面向一个 Installation、一个 Product Host 和一个 active
logical Subject。它不是 generic multi-tenant 或 generic multi-Subject
管理平台。Subject 的连续性跨越模型、Provider、会话、Presentation、
组件 generation 和 Host 重启；Subject 不等于 Model、Prompt、Reactor、
Conversation、Host、Installation 或 System Assistant。

## 2. 持久产品构成

产品由以下持久角色组成：

```
Installation
├─ Product Host
├─ persistent Subject
├─ headless Management API / CLI
├─ external Presentation clients
├─ Machine Operations integration
└─ Bootstrap / Recovery entry
```

| 角色                           | 产品含义                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Installation                   | 可识别、可管理、拥有生命周期根和产品数据的逻辑安装。                                                              |
| Product Host                   | 长期运行的 headless 产品宿主，承载 canonical services、Subject 生命周期和正常 Management Server。                 |
| persistent Subject             | 具有单一连续身份的认知与社会主体；canonical state 由 Subject 及各领域 owner 持有。                                |
| Control Plane                  | 管理员观察产品、理解影响并请求正常 Product Management 的产品面；它消费 Host 的 canonical Management Contract。    |
| Management API / reference CLI | 本仓库拥有的机器可消费管理产品面；CLI 是完整的 reference client。                                                 |
| external Presentation clients  | Browser、Desktop 以及其他 Presentation consumers；它们消费正式 Host/Subject contracts，不拥有 Product Authority。 |
| Machine Operations integration | 独立 Machine Operations Plane 的集成入口，用于系统级诊断、修复和部署维护。                                        |
| Bootstrap / Recovery entry     | 在正常 Management path 不可用时提供 bounded、local、AI-independent 的启动与恢复入口。                             |

Product Host 是持久产品运行时。关闭 Browser 或 Desktop Presentation
不会停止 Host，也不会删除 Subject identity、canonical state、durable work
或产品数据。Presentation 的进程生命周期与 Host、Subject 和 durable
state 分离。

本仓库不实现 Browser application、Desktop application、Electron shell、
dashboard pages、Home renderer 或其他 GUI。整体 Heptalogos 产品仍可以
包含由外部 Presentation repository 实现的 Home、Subject presence、
Direct Management 和 System Assistant 体验。

## 3. 四条管理员交互路径

四条路径拥有不同的语义 Authority；它们可以共享产品身份语境和视觉
语言，但不共享隐式权限。

### A. Subject Chat

```
Administrator ↔ persistent Subject
                    ↓
              Subject Authority
```

Subject Chat 是内建的真实直接通道，逻辑平台为
`heptalogos-subject-chat`：

```
SubjectChatClient
→ Subject Chat protocol endpoint / Driver
→ MessagingService
→ canonical MessageFact
→ WorkItem
→ ConversationMailbox
→ Subject cognition and commit path
```

管理员身份不会把 Subject 消息自动提升为 SystemAction。

### B. Direct Management

```
Administrator
→ deterministic Product Management resources/actions
→ Heptalogos System Authority
```

Direct Management 是不依赖智能助手的确定性管理入口，覆盖当前进入产品
的 administratively meaningful resources、Read Models、readiness、Subject
生命周期、Configuration、Provider、Operations、Evidence 以及受治理的
actions。它不能直接写 repository、DBOS、filesystem、package directory
或 Secret backend。

### C. System Assistant / Maintenance Assistant

```
Administrator
→ Heptalogos-branded Assistant experience
→ independent Machine Operations Plane
```

System Assistant 是机器运维能力的产品体验；Maintenance Assistant 是
高风险或 break-glass 场景的产品标签，不是另一个 runtime identity。Product
Host 健康时，Assistant 优先消费 Management API、ManagementClient 和 CLI。
Host 或正常管理面不可用时，独立 Machine Operations Plane 可以依照其
OS/deployment 权限执行机器级诊断与修复。普通 Product Management UI 不
接收该高权限运行域的凭据。

### D. Bootstrap / Recovery

```
Installation owner
→ bounded Bootstrap / Recovery entry
→ Recovery Authority
```

Recovery Authority 是受限的本地修复能力，动作集合小于正常 System
Authority。它与 Machine Operations Plane 都可以处理严重故障，但两者
不是同一个 canonical product state owner。

## 4. Authority 映射与交接

| 入口或动作来源                           | 语义 Authority                                                    |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Subject Chat                             | Subject Authority                                                 |
| Direct Management                        | Heptalogos System Authority                                       |
| System Assistant / Maintenance Assistant | Machine Operations Plane；正常产品动作仍回到对应 Heptalogos owner |
| Bootstrap / Recovery                     | bounded Recovery Authority                                        |

Subject Authority、System Authority 和 Machine/Deployment Authority 是三个
清晰的域。`AuthorityHandoff` 可以转移 `intent`、bounded context、reason
和 initiating principal，但不转移 permission。跨域请求必须在目标 Authority
重新计划、认证、授权、评估风险，并在需要时取得 Approval。

## 5. Headless Product Host 与 Management 形状

本仓库的永久产品责任包括：

```
Product Host
  └─ Canonical Management Server
       ├─ Read Models
       ├─ SystemAction / ManagementOperation
       ├─ complete Management Contract
       ├─ Subject Chat protocol endpoint
       ├─ query / projection / diagnostic surfaces
       └─ live projections

Management clients
  ├─ complete reference CLI
  ├─ external Presentation clients
  ├─ automation / future integrations
  └─ authorized Machine Operations adapters
```

Every administratively meaningful product capability receives a complete
machine-consumable normal-management surface when it enters the product.
“Complete” follows the implemented capability set; it does not predict every
future Presentation query. Presentation requirements may cause Host-owned
Read Models or projections to evolve, but a Presentation client never becomes
domain Authority.

Management mutations follow one semantic path：

```
request
→ normalize / validate
→ SystemChangePlan
→ Authentication / Authorization / Risk
→ Approval when required
→ durable / owned operation semantics
→ owning Service
→ verify
→ Evidence
```

Exact resource sets, action schemas, authentication details and approval
classification are held by current Specs and implementation Plans.

## 6. Authentication 与 Subject 生命周期正交

```
authentication/session state ⟂ Subject Desired/Actual state
```

因此：

- Administrator 登录不会自动启动 Subject；
- 解锁 Control Plane 不等于 Subject RUNNING、READY 或 ACTIVE；
- Subject STOPPED 或 BLOCKED 不等于管理员 logout 或 Control Plane lock；
- Host 的运行状态不改变 Subject identity；
- 关闭 Presentation 不删除 Subject identity、canonical state、durable
  work 或产品数据。

Normal Product Management、外部 Presentation 和 Machine Operations surface
使用各自的 authentication、session、credential 和 exposure policy。普通
低权限 Product Host 不持有 Machine Operations 的 privileged control token。

## 7. 产品级可移植性语义

产品区分三个语义不同的可移植性对象：

```
Installation Backup
→ 恢复一个 Installation 的产品运行基础与各 DataOwner 参与者

Subject Bundle
→ 迁移一个 Subject 的可移植语义状态

Product Update
→ 更换 ProductGeneration / 软件闭包
```

这三个对象分别服从 Installation、Subject 和 ProductGeneration 的
Authority；它们不是同一种通用压缩包。本页不冻结 ZIP 结构、迁移算法、
协议格式或恢复实现。
