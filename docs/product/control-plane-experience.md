# Control Plane Experience

本页定义 Control Plane 的稳定体验语义，而不是 pixel specification、
页面树、视觉 token 或 frontend 技术选型。它描述同一个 living product
surface 如何承载 Subject presence、正常 Product Management 和
System Assistant。

## 1. 一个 living product surface

Control Plane 是有 Subject presence 的 living product surface。它提供：

```
Home / Subject presence
Subject Chat
Direct Management
System Assistant
attention / Presentation intents
```

Home 是主要的 Subject-facing surface。Home 的 resting state 强调 Subject
的存在、状态和可接近性，不把统计卡片或管理指标作为第一视觉中心。Home
与展开后的 conversation 是同一连续 surface；从静止状态进入对话仍留在
同一产品 surface。

## 2. Home resting state

在没有需要呈现的 attention 时：

- Dynamic Island 隐藏；
- 中央显示一个 living、Siri-like orb，作为 Subject presence；
- 输入是窄、精致、居中的 control，视觉上接近 login/password field；
- 输入不是宽大的 ChatGPT-style composer；
- floating Dock 提供进入主要入口的轻量 affordance。

这些是稳定的体验关系。具体图形、动画曲线、颜色数值、字体、尺寸和
responsive breakpoint 留给外部 Presentation 设计。

## 3. 连续的对话展开

用户激活 Home 输入后，仍停留在同一 Home surface：

```
activate input
→ orb shrinks and moves upward
→ conversation history becomes visible
→ composer settles lower on the same surface
→ Dock recedes
```

对话展开不创建第二个产品后端或另一套 Subject Chat Authority。历史、
canonical message state 和连接恢复都来自同一 Subject Chat contract；
局部 UI state 不能成为产品真相。

## 4. Dynamic Island 与 attention

Dynamic Island 是 attention surface，不是常驻 dashboard：

```
no meaningful attention → hidden
meaningful event / operation / approval / failure → may surface
```

它可以呈现有意义的 System event、Subject event、Operation progress、
Approval request 或 Failure attention。它不创造新的 canonical state，也不
拥有 System 或 Subject Authority。即使用户看不到 Island，canonical
Operation、Evidence、Message 或 Subject state 仍独立存在。

Live channel 丢失、窗口关闭或客户端重连不能丢失产品真相。客户端重新连接
后重新查询 canonical Read Models 和消息/Operation state。

## 5. Locked / Dormant character

Locked 或 Dormant 是同一产品 composition 的低活动状态：

- composition 保持一致；
- Dynamic Island 隐藏；
- orb 变为灰白、低饱和、较淡的 presence；
- motion 更慢、更弱；
- dormancy 不等于 failure。

锁定 ceremony、解锁交互和精确视觉语言不在本页冻结；它们必须保持
Authentication/session state 与 Subject Desired/Actual state 的正交关系。

## 6. Canonical runtime state 的投影

Control Plane 不通过颜色或动画猜测状态。它从 canonical Read Models 投影
下列相互区分的运行状态：

```
STOPPED
STARTING
READY
ACTIVE
DEGRADED
BLOCKED
STOPPING
FAILED
```

Home、Dynamic Island、Direct Management 和 System Assistant context 可以
以不同密度呈现这些状态，但它们必须指向同一 canonical owner。Subject 的
Desired 与 Actual 仍然分离；administrator session、Host state 和 Subject
identity 也不能混成一个 UI boolean。

## 7. Direct Management without AI

Direct Management 是可独立使用的确定性 Product Management surface。管理员
可以在没有 System Assistant 的情况下：

```
inspect resources
inspect readiness / runtime / capability
inspect Subject state and lifecycle
inspect configuration / model / provider
inspect operations / approvals / evidence
request governed actions
```

它不要求用户先理解 Assistant，也不把所有资源强行展开成一棵 full-page
tree。资源详情、影响、状态和动作由 canonical Read Models、Management
Contract 和 action metadata 驱动。

## 8. System Assistant：Explain、Navigate、Operate

System Assistant 是 Heptalogos-branded 的机器运维体验，属于独立的
Machine Operations Plane。它分成三个能力层：

```
Explain
→ 基于 Read Models / Lineage / Evidence 解释当前状态

Navigate
→ 生成到资源、Operation、诊断位置的 PresentationIntent

Operate
→ 在正常 Product Management path 可用时使用结构化管理动作
```

Product Host 健康时，Assistant 优先使用 Management API、ManagementClient
或 CLI。这条路径保留 Heptalogos 的 canonical Problems、Operation、
Lineage 和 Evidence 语义。系统需要正常产品 mutation 时，动作返回
Heptalogos System Authority 及其 owning Service。

在 Host、API 或 CLI 不可用的维护场景，Machine Operations Plane 可以在
独立 OS/deployment 权限内使用 shell、filesystem、SQL、service/process
工具和其他机器级能力。它不把这些动作伪装成普通 Product Management
mutation，也不要求 Host 为其保存 privileged control credential。普通
低权限 Presentation 不得获得 Machine Operations credentials。

## 9. Authority handoff 的可见性

产品应让管理员能够理解一条请求属于哪种 Authority：

```
Subject Chat
→ Subject Authority

Direct Management
→ Heptalogos System Authority

System Assistant
→ Machine Operations Plane

Bootstrap / Recovery
→ bounded Recovery Authority
```

当 Subject Chat 中出现系统管理意图，或系统操作需要 Subject context 时，
产品可以显示显式的 AuthorityHandoff。handoff 传递 intent、bounded
context、reason 和 initiating principal；它不自动转移 permission。目标
Authority 必须重新执行自己的认证、授权、风险和 Approval 规则。

## 10. Dual-trust product surfaces

Heptalogos Product Presentation 与 System Assistant / Maintenance surface
可以都使用 Heptalogos 的视觉语言，但它们属于不同 trust domains：

```
Product Presentation
→ Heptalogos Management / Subject contracts
→ lower machine privilege

System Assistant surface
→ independent Machine Operations Plane
→ higher machine privilege
```

它们应保持 separate authentication context、session/cookie scope、
privileged credentials 和适用的 origin/security context。不得为了视觉
便利把 Machine Operations admin token 传过 Product Host，也不得使用
iframe、preload 或隐藏路由绕过权限边界。

## 11. External Presentation repository boundary

Browser、Desktop 和其他 GUI Presentation 是同一 Heptalogos 产品的外部
clients。它们共享 Product Host、Management Contract、Subject Chat
contract 和 canonical Read Models；连接中断后通过重新查询 canonical state
恢复，不把遗漏的 live event 当作事实丢失。

本仓库不实现 Browser/Desktop/Electron/frontend/UI surface。外部
Presentation 是 first-class product consumer，可以基于真实产品需要推动
新的 Host-owned read model、aggregate query、projection 或 protocol
capability；它不能获取或重新定义 Heptalogos domain Authority。具体
renderer、窗口语义和视觉设计属于外部 Presentation 工作流。
