# Product Shape

本页定义 Heptalogos 当前的产品构成、用户可见的管理入口以及 Authority
边界。它说明产品由哪些持久角色组成、这些角色如何连接；精确的请求格式、
状态字段和协议合同由后续 Specs 持有。

## 1. 产品中心

Heptalogos 是一个由 Product Host 长期承载的 Subject 产品：

```
一个逻辑 Installation
        ↓
一个当前 Product Host Authority
        ↓
一个 active logical Subject identity
```

当前产品形态面向一个 Installation、一个 Product Host 和一个 active
logical Subject。它不是 generic multi-tenant 或 generic multi-Subject
管理平台。Subject 的连续性跨越模型、Provider、会话、Presentation、
组件 generation 和 Host 重启；Subject 不等于 Model、Prompt、Reactor、
Conversation、Host、Installation 或 Operator Assistant。

## 2. 持久产品构成

产品至少由以下持久角色组成：

```
Installation
├─ Product Host
├─ persistent Subject
├─ Control Plane
├─ Presentation clients / carriers
└─ Bootstrap / Recovery entry
```

| 角色                            | 当前产品含义                                                                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installation                    | 一个可识别、可管理、拥有生命周期根和产品数据的逻辑安装。                                                                                           |
| Product Host                    | 长期运行的产品宿主，承载 canonical state 的服务、Subject 生命周期和正常 Management Server。它不是一次请求的进程容器。                              |
| persistent Subject              | 具有单一连续身份的认知与社会主体；其 canonical state 由 Subject 及各领域 owner 持有。                                                              |
| Control Plane                   | 管理员观察系统、理解影响并请求受治理 SystemAction 的产品管理面。它消费 Host 的 canonical Management Contract。                                     |
| Presentation clients / carriers | Browser、Desktop、CLI 以及其他受权客户端。它们是同一产品的 projection/carrier，不拥有 System、Subject、Host 或数据库 Authority。                   |
| Bootstrap / Recovery entry      | 在正常 Management path 不可用时提供 bounded、local、AI-independent 的启动与恢复入口。Recovery Authority 的动作集合小于正常 System Authority 全集。 |

Product Host 是持久产品运行时。关闭 Browser 或 Desktop Presentation
不会停止 Host，也不会删除 Subject identity、canonical state、durable work
或产品数据。Presentation 的进程生命周期与 Host、Subject 和 durable
state 的生命周期分离。

Browser 与 Desktop 是同一产品前端的不同 carrier。Desktop 可以采用
Electron 作为未来 shell 方向，但产品身份不是 Electron；前端框架也不是
Product Authority。Platform-owned 的 window、accessibility、DPI、
fullscreen 和 native snapping 语义仍由平台拥有。

## 3. 三个管理员入口

管理员面对三个语义不同的产品入口。它们可以共享身份认证和 Presentation
外观，但不能共享隐式 Authority。

### A. Subject Chat

```
Administrator ↔ persistent Subject
                    ↓
              Subject Authority
```

Subject Chat 是内建的真实直接通道，逻辑平台为
heptalogos-subject-chat。其产品路径是：

```
SubjectChatClient
→ Subject Chat protocol endpoint / Driver
→ MessagingService
→ canonical MessageFact
→ WorkItem
→ ConversationMailbox
→ Subject cognition and commit path
```

Subject Chat 不是 UI 到 Reactor 的 shortcut。管理员在其中可以进入
Subject Governance path；管理员身份不会把一条 Subject 消息自动提升为
SystemAction。

### B. Direct Management

```
Administrator
→ deterministic Control Plane resources and actions
→ System Authority
```

Direct Management 是非 AI 的确定性管理入口。它用于读取资源、Read Models、
readiness、Subject 生命周期、Configuration、Provider、Operations、
Approvals 和 Evidence，并请求受治理的 SystemAction。Assistant 不参与也
不是必需条件；没有 Assistant 时，管理员仍应能使用正常 Management path。

### C. Operator Assistant

```
Administrator ↔ internal system assistant
                       ↓
             System Authority proposal/delegation path
```

Operator Assistant 是类似 Siri 的系统管理助手。它可以解释状态、导航到
资源、提出 SystemAction，并在明确的 delegation、Policy、Risk 和 Approval
路径下协助操作。它不是 Subject，不是第二个 administrator identity，不是
root shell，也不是唯一的管理方式。模型输出、工具调用和助手建议默认是
proposal；它们不能直接写入 canonical System 或 Subject state。

## 4. Authority 映射与交接

| 入口或动作来源       | 语义 Authority                               |
| -------------------- | -------------------------------------------- |
| Subject Chat         | Subject Authority                            |
| Direct Management    | System Authority                             |
| Operator Assistant   | System Authority 的 proposal/delegation path |
| Bootstrap / Recovery | bounded Recovery Authority                   |

Subject Authority 与 System Authority 是两个明确的域。Assistant 不能借助
对话语气跨越边界；Subject 也不能因为管理员提出了系统请求而直接执行
SystemAction。

AuthorityHandoff 可以转移：

```
intent
bounded context
reason
initiating principal
```

它不转移 permission 或 Authority。跨域请求必须在目标 Authority 重新
计划、认证、授权、评估风险，并在需要时取得 Approval。

## 5. Product Host 与 Control Plane 形状

当前产品管理面只有一个正常的 Host Management Server：

```
Product Host
  └─ Canonical Management Server
       ├─ Read Models
       ├─ SystemAction / ManagementOperation
       ├─ Management Contract
       ├─ Subject Chat endpoint
       ├─ Operator Service endpoint
       └─ live projections

Management clients
  ├─ CLI
  ├─ Browser Control Plane
  ├─ Desktop Control Plane
  └─ Operator Assistant tooling
```

Read Models 是 canonical owners 的可追溯 projection。SystemAction、
ManagementOperation 和 Management Contract 的语义由 Host/System Authority
统一拥有；CLI、Browser、Desktop 和 Assistant tooling 只是客户端。
Fastify、OpenAPI、Electron、frontend runtime 或任何单一 UI 都不能成为
第二个 Control Plane backend Authority。客户端不得绕过 Management Contract
直接写 repository、DBOS、filesystem、package directory 或 Secret backend。

任何管理 mutation 都遵循同一个语义顺序：

```
request
→ normalize / validate
→ SystemChangePlan
→ Authentication / Authorization / Risk
→ Approval when required
→ durable ManagementOperation
→ owning Service
→ verify
→ Evidence
```

具体资源集合、动作 schema、认证细节和 Approval 分类留给后续 normative
Specs 与对应的实现计划。

## 6. Authentication 与 Subject 生命周期正交

登录、session、Control Plane lock/unlock 与 Subject Desired/Actual state
是不同维度：

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

Product Shape 不在此处冻结具体 credential 形式、登录文案或 UI ceremony。

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
Authority。它们不是同一种通用压缩包；本页不冻结 ZIP 结构、迁移算法、
协议格式或恢复实现。
